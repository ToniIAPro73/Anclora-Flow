import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
// @ts-ignore
import pkg from 'express-validator';
const { validationResult } = pkg as any;
import passport from 'passport';
import { userRepository } from '../../repositories/user.repository.js';
import User from '../../models/User.js';
import { generateToken } from '../../middleware/auth.js';
import {
  buildPublicUser,
  dispatchVerificationEmail,
  dispatchPasswordResetEmail,
  generateUuid,
  FRONTEND_URL,
} from '../../services/auth.service.js';
import { ensureDevUser } from '../../utils/devUser.js';

const VALID_LANGUAGES = ['es', 'en'];
const VALID_THEMES = ['light', 'dark'];
const VERIFICATION_TOKEN_TTL_HOURS = Number(process.env.AUTH_VERIFICATION_TTL_HOURS || 48);
const PASSWORD_RESET_TTL_MINUTES = Number(process.env.AUTH_RESET_TTL_MINUTES || 60);

const buildAuthResponse = (userRow: any, token: string) => ({
  token,
  user: buildPublicUser(userRow),
});

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

export const register = async (req: Request, res: Response) => {
  try {
    const {
      email,
      firstName,
      lastName,
      company,
      phone,
      password,
      language,
      theme,
    } = req.body;

    const existing = await userRepository.findByEmail(email);
    if (existing && existing.emailVerifiedAt) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    if (existing && !existing.emailVerifiedAt) {
      const newToken = generateUuid();
      await userRepository.setVerificationToken(existing.id, newToken);
      await dispatchVerificationEmail(existing, newToken);
      return res.status(200).json({
        message: 'Ya habíamos recibido tu registro. Hemos reenviado el correo de verificación.',
      });
    }

    const verificationToken = generateUuid();
    const user = await User.create({
      email,
      firstName,
      lastName,
      company,
      phone,
      password,
      authProvider: 'local',
      language: language && VALID_LANGUAGES.includes(language) ? language : 'es',
      theme: theme && VALID_THEMES.includes(theme) ? theme : 'light',
      verificationToken,
      verificationSentAt: new Date(),
    });

    if (user) {
      await dispatchVerificationEmail(user, verificationToken);
    }

    return res.status(201).json({
      message: 'Hemos enviado un correo para confirmar tu cuenta. Revisa tu bandeja de entrada.',
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ error: 'Error al registrar el usuario' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await userRepository.findByEmail(email, true);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!user.passwordHash) {
      return res.status(403).json({
        error: 'Esta cuenta se creó con inicio de sesión social. Accede con Google o GitHub.',
      });
    }

    if (!user.emailVerifiedAt) {
      return res.status(403).json({
        error: 'Tu correo todavía no ha sido verificado. Revisa tu bandeja de entrada.',
        requiresVerification: true,
      });
    }

    const isValidPassword = await User.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    await userRepository.updateLastLogin(user.id);

    const token = generateToken(user.id);
    return res.json({
      message: 'Inicio de sesión exitoso',
      ...buildAuthResponse(user, token),
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await userRepository.findByEmail(email, true);
    if (!user) {
      return res.json({
        message: 'Si el correo existe en nuestro sistema, recibirás instrucciones en unos minutos.',
      });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        error: 'Esta cuenta utiliza autenticación social. Restablece tu acceso desde tu proveedor.',
      });
    }

    const resetToken = generateUuid();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);

    await userRepository.setPasswordResetToken(user.id, resetToken, expiresAt);
    await dispatchPasswordResetEmail(user, resetToken);

    return res.json({
      message: 'Te hemos enviado un enlace para crear una nueva contraseña.',
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return res.status(500).json({ error: 'No se pudo iniciar el proceso de recuperación' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;

  try {
    const user = await userRepository.findByPasswordResetToken(token);
    if (!user) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    if (!user.passwordResetExpiresAt || new Date(user.passwordResetExpiresAt) < new Date()) {
      return res.status(400).json({ error: 'El token ha expirado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await userRepository.updatePassword(user.id, passwordHash);
    await userRepository.updateLastLogin(user.id);

    const jwt = generateToken(user.id);
    const freshUser = await userRepository.findById(user.id);

    return res.json({
      message: 'Contraseña actualizada correctamente',
      ...buildAuthResponse(freshUser, jwt),
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ error: 'No se pudo restablecer la contraseña' });
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return res.json({
        message: 'Si el correo existe en nuestro sistema, recibirás de nuevo el enlace de verificación.',
      });
    }

    if (user.emailVerifiedAt) {
      return res.json({
        message: 'Tu correo ya está verificado. Puedes iniciar sesión.',
      });
    }

    const token = generateUuid();
    await userRepository.setVerificationToken(user.id, token);
    await dispatchVerificationEmail(user, token);

    return res.json({
      message: 'Hemos reenviado un enlace de verificación a tu correo.',
    });
  } catch (error) {
    console.error('Error resending verification email:', error);
    return res.status(500).json({ error: 'No se pudo reenviar el correo de verificación' });
  }
};

export const resolveEmailVerification = async (token: string) => {
  const user = await userRepository.findByVerificationToken(token);

  if (!user) {
    return { status: 400, payload: { error: 'Token de verificación inválido' } };
  }

  if (!user.verificationSentAt) {
    return { status: 400, payload: { error: 'El token de verificación no es válido' } };
  }

  const expiresAt = new Date(user.verificationSentAt);
  expiresAt.setHours(expiresAt.getHours() + VERIFICATION_TOKEN_TTL_HOURS);

  if (expiresAt < new Date()) {
    return { status: 410, payload: { error: 'El enlace de verificación ha expirado' } };
  }

  await userRepository.markEmailVerified(user.id);
  await userRepository.updateLastLogin(user.id);

  const freshUser = await userRepository.findById(user.id);
  const tokenJwt = generateToken(user.id);

  return {
    status: 200,
    payload: {
      message: 'Correo verificado correctamente',
      ...buildAuthResponse(freshUser, tokenJwt),
    },
  };
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const result = await resolveEmailVerification(req.body.token);
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error('Error verifying email:', error);
    return res.status(500).json({ error: 'No se pudo verificar el correo' });
  }
};

export const verifyEmailGet = async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token requerido' });
  }

  try {
    const result = await resolveEmailVerification(token);
    if (result.status === 200) {
      const url = new URL(`${FRONTEND_URL}/#/auth/callback`);
      url.searchParams.set('token', (result.payload as any).token);
      url.searchParams.set('verified', 'true');
      return res.redirect(url.toString());
    }
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error('Error verifying email (GET):', error);
    return res.status(500).json({ error: 'No se pudo verificar el correo' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const user = await userRepository.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json(buildPublicUser(user));
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Error al obtener el usuario' });
  }
};

export const updateMe = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const current = await userRepository.findById(userId);

    if (!current) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updates: any = {};
    if (typeof req.body.firstName === 'string') updates.firstName = req.body.firstName.trim();
    if (typeof req.body.lastName === 'string') updates.lastName = req.body.lastName.trim();
    if (typeof req.body.company === 'string') updates.company = req.body.company.trim();
    if (typeof req.body.phone === 'string') updates.phone = req.body.phone.trim();
    if (req.body.language && VALID_LANGUAGES.includes(req.body.language)) {
      updates.language = req.body.language;
    }
    if (req.body.theme && VALID_THEMES.includes(req.body.theme)) {
      updates.theme = req.body.theme;
    }

    const displayName = User.mapDisplayName({
      name: current.name,
      firstName: updates.firstName || current.firstName,
      lastName: updates.lastName || current.lastName,
      email: current.email,
    });

    updates.name = displayName;

    await userRepository.update(userId, updates);
    const refreshed = await userRepository.findById(userId);

    return res.json({
      message: 'Perfil actualizado correctamente',
      user: buildPublicUser(refreshed),
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
};

export const oauthHandler = (provider: string) => (req: Request, res: Response, next: any) => {
  passport.authenticate(provider, { session: false }, async (err: any, user: any) => {
    if (err || !user) {
      const failUrl = new URL(`${FRONTEND_URL}/#/auth/callback`);
      failUrl.searchParams.set('error', 'oauth_failed');
      failUrl.searchParams.set('provider', provider);
      return res.redirect(failUrl.toString());
    }

    try {
      await userRepository.markEmailVerified(user.id);
      await userRepository.updateLastLogin(user.id);
      const token = generateToken(user.id);
      const successUrl = new URL(`${FRONTEND_URL}/#/auth/callback`);
      successUrl.searchParams.set('token', token);
      successUrl.searchParams.set('provider', provider);
      return res.redirect(successUrl.toString());
    } catch (errorOauth) {
      console.error(`Error completing OAuth for ${provider}:`, errorOauth);
      const failUrl = new URL(`${FRONTEND_URL}/#/auth/callback`);
      failUrl.searchParams.set('error', 'oauth_failed');
      failUrl.searchParams.set('provider', provider);
      return res.redirect(failUrl.toString());
    }
  })(req, res, next);
};

export const devLogin = async (_req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Dev login no disponible en producción' });
  }

  try {
    const user = await ensureDevUser();
    if (user) {
      await userRepository.updateLastLogin(user.id);
      const token = generateToken(user.id);
      return res.json({
        message: 'Sesión de desarrollo iniciada',
        ...buildAuthResponse(user, token),
      });
    }
    return res.status(500).json({ error: 'No se pudo iniciar sesión con el usuario de prueba' });
  } catch (error) {
    console.error('Error issuing dev login:', error);
    return res.status(500).json({ error: 'No se pudo iniciar sesión con el usuario de prueba' });
  }
};
