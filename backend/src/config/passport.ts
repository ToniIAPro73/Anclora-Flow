import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as GithubStrategy, Profile as GithubProfile } from 'passport-github2';
import User from '../models/User.js';
import { BACKEND_URL } from '../services/auth.service.js';

async function upsertOAuthUser(provider: string, profile: any) {
  const providerId = profile.id;
  const email = profile.emails?.[0]?.value;
  const firstName = profile.name?.givenName || profile.displayName || null;
  const lastName = profile.name?.familyName || null;
  const avatarUrl = profile.photos?.[0]?.value || null;

  if (!email) {
    throw new Error(`El proveedor ${provider} no devolvió un correo electrónico válido.`);
  }

  let user = await User.findByAuthProvider(provider, providerId);

  if (!user) {
    const existingByEmail = await User.findByEmail(email);
    if (existingByEmail) {
      await User.setAuthProvider(existingByEmail.id, provider, providerId);
      const updates: any = {};
      if (!existingByEmail.first_name && firstName) {
        updates.firstName = firstName;
      }
      if (!existingByEmail.last_name && lastName) {
        updates.lastName = lastName;
      }
      if (!existingByEmail.avatar_url && avatarUrl) {
        updates.avatarUrl = avatarUrl;
      }
      if (Object.keys(updates).length) {
        await User.update(existingByEmail.id, updates);
      }
      if (!existingByEmail.email_verified_at) {
        await User.markEmailVerified(existingByEmail.id);
      }
      user = await User.findById(existingByEmail.id, { raw: true });
    } else {
      const newUser = await User.create({
        email,
        firstName,
        lastName,
        avatarUrl,
        authProvider: provider,
        authProviderId: providerId,
        emailVerifiedAt: new Date(),
      });
      return newUser;
    }
  } else {
    const updates: any = {};
    if (!user.first_name && firstName) {
      updates.firstName = firstName;
    }
    if (!user.last_name && lastName) {
      updates.lastName = lastName;
    }
    if (!user.avatar_url && avatarUrl) {
      updates.avatarUrl = avatarUrl;
    }
    if (Object.keys(updates).length) {
      await User.update(user.id, updates);
    }
    if (!user.email_verified_at) {
      await User.markEmailVerified(user.id);
    }
  }

  return user ? User.findById(user.id, { raw: true }) : null;
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await upsertOAuthUser('google', profile);
          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
} else {
  console.warn('⚠️  GOOGLE_CLIENT_ID/SECRET no configurados. El login con Google está desactivado.');
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GithubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/github/callback`,
        scope: ['user:email'],
      },
      async (_accessToken: string, _refreshToken: string, profile: GithubProfile, done: any) => {
        try {
          const primaryEmail = profile.emails?.find((email: any) => email.primary) || profile.emails?.[0];
          if (primaryEmail && !(primaryEmail as any).verified) {
            (primaryEmail as any).verified = true;
          }
          const normalizedProfile = {
            ...profile,
            emails: profile.emails?.length ? profile.emails : primaryEmail ? [primaryEmail] : [],
          };
          const user = await upsertOAuthUser('github', normalizedProfile);
          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
} else {
  console.warn('⚠️  GITHUB_CLIENT_ID/SECRET no configurados. El login con GitHub está desactivado.');
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id, { raw: true });
    done(null, user);
  } catch (error) {
    done(error as Error);
  }
});

export default passport;
