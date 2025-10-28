const express = require('express');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const User = require('../../models/User');
const { generateToken, authenticateToken } = require('../../middleware/auth');
const {
  buildPublicUser,
  dispatchVerificationEmail,
  dispatchPasswordResetEmail,
  generateUuid,
  FRONTEND_URL,
} = require('../../services/auth.service');
const { ensureDevUser } = require('../../utils/devUser');

const router = express.Router();

const VALID_LANGUAGES = ['es', 'en'];
const VALID_THEMES = ['light', 'dark'];
const VERIFICATION_TOKEN_TTL_HOURS = Number(process.env.AUTH_VERIFICATION_TTL_HOURS || 48);
const PASSWORD_RESET_TTL_MINUTES = Number(process.env.AUTH_RESET_TTL_MINUTES || 60);

const hasStrategy = (name) => {
  try {
    return Boolean(passport._strategy(name));
  } catch (_err) {
    return false;
  }
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

const buildAuthResponse = (userRow, token) => ({
  token,
  user: buildPublicUser(userRow),
});

const registerValidators = [
  body('firstName').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('lastName').trim().notEmpty().withMessage('Los apellidos son obligatorios'),
  body('company').trim().notEmpty().withMessage('La empresa es obligatoria'),
  body('email').isEmail().withMessage('Correo electrónico inválido').normalizeEmail(),
  body('phone')
    .trim()
    .matches(/^[\d\s+()\-]{6,}$/)
    .withMessage('Introduce un teléfono válido'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),
  body('language').optional().isIn(VALID_LANGUAGES),
  body('theme').optional().isIn(VALID_THEMES),
];

const updateProfileValidators = [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('company').optional().trim().notEmpty(),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s+()\-]{6,}$/)
    .withMessage('Introduce un teléfono válido'),
  body('language').optional().isIn(VALID_LANGUAGES),
  body('theme').optional().isIn(VALID_THEMES),
];

router.post(
  '/register',
  registerValidators,
  validate,
  async (req, res) => {
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

      const existing = await User.findByEmail(email);
      if (existing && existing.email_verified_at) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }

      if (existing && !existing.email_verified_at) {
        const newToken = generateUuid();
        await User.setVerificationToken(existing.id, newToken);
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

      await dispatchVerificationEmail(user, verificationToken);

      return res.status(201).json({
        message: 'Hemos enviado un correo para confirmar tu cuenta. Revisa tu bandeja de entrada.',
      });
    } catch (error) {
      console.error('Error registering user:', error);
      return res.status(500).json({ error: 'Error al registrar el usuario' });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('La contraseña es obligatoria'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      if (!user.password_hash) {
        return res.status(403).json({
          error: 'Esta cuenta se creó con inicio de sesión social. Accede con Google o GitHub.',
        });
      }

      if (!user.email_verified_at) {
        return res.status(403).json({
          error: 'Tu correo todavía no ha sido verificado. Revisa tu bandeja de entrada.',
          requiresVerification: true,
        });
      }

      const isValidPassword = await User.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      await User.updateLastLogin(user.id);

      const token = generateToken(user.id);
      return res.json({
        message: 'Inicio de sesión exitoso',
        ...buildAuthResponse(user, token),
      });
    } catch (error) {
      console.error('Error logging in:', error);
      return res.status(500).json({ error: 'Error al iniciar sesión' });
    }
  }
);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Correo inválido').normalizeEmail()],
  validate,
  async (req, res) => {
    const { email } = req.body;

    try {
      const user = await User.findByEmail(email);
      if (!user) {
        return res.json({
          message: 'Si el correo existe en nuestro sistema, recibirás instrucciones en unos minutos.',
        });
      }

      if (!user.password_hash) {
        return res.status(400).json({
          error: 'Esta cuenta utiliza autenticación social. Restablece tu acceso desde tu proveedor.',
        });
      }

      const resetToken = generateUuid();
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);

      await User.setPasswordResetToken(user.id, resetToken, expiresAt);
      await dispatchPasswordResetEmail(user, resetToken);

      return res.json({
        message: 'Te hemos enviado un enlace para crear una nueva contraseña.',
      });
    } catch (error) {
      console.error('Error requesting password reset:', error);
      return res.status(500).json({ error: 'No se pudo iniciar el proceso de recuperación' });
    }
  }
);

router.post(
  '/reset-password',
  [
    body('token').isUUID().withMessage('Token inválido'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener al menos 8 caracteres'),
  ],
  validate,
  async (req, res) => {
    const { token, password } = req.body;

    try {
      const user = await User.findByPasswordResetToken(token);
      if (!user) {
        return res.status(400).json({ error: 'Token inválido o expirado' });
      }

      if (!user.password_reset_expires_at || new Date(user.password_reset_expires_at) < new Date()) {
        return res.status(400).json({ error: 'El token ha expirado' });
      }

      await User.updatePassword(user.id, password);
      await User.updateLastLogin(user.id);

      const jwt = generateToken(user.id);
      const freshUser = await User.findById(user.id, { raw: true });

      return res.json({
        message: 'Contraseña actualizada correctamente',
        ...buildAuthResponse(freshUser, jwt),
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      return res.status(500).json({ error: 'No se pudo restablecer la contraseña' });
    }
  }
);

router.post(
  '/resend-verification',
  [body('email').isEmail().normalizeEmail()],
  validate,
  async (req, res) => {
    const { email } = req.body;

    try {
      const user = await User.findByEmail(email);
      if (!user) {
        return res.json({
          message: 'Si el correo existe en nuestro sistema, recibirás de nuevo el enlace de verificación.',
        });
      }

      if (user.email_verified_at) {
        return res.json({
          message: 'Tu correo ya está verificado. Puedes iniciar sesión.',
        });
      }

      const token = generateUuid();
      await User.setVerificationToken(user.id, token);
      await dispatchVerificationEmail(user, token);

      return res.json({
        message: 'Hemos reenviado un enlace de verificación a tu correo.',
      });
    } catch (error) {
      console.error('Error resending verification email:', error);
      return res.status(500).json({ error: 'No se pudo reenviar el correo de verificación' });
    }
  }
);

async function resolveEmailVerification(token) {
  const user = await User.findByVerificationToken(token);

  if (!user) {
    return { status: 400, payload: { error: 'Token de verificación inválido' } };
  }

  if (!user.verification_sent_at) {
    return { status: 400, payload: { error: 'El token de verificación no es válido' } };
  }

  const expiresAt = new Date(user.verification_sent_at);
  expiresAt.setHours(expiresAt.getHours() + VERIFICATION_TOKEN_TTL_HOURS);

  if (expiresAt < new Date()) {
    return { status: 410, payload: { error: 'El enlace de verificación ha expirado' } };
  }

  await User.markEmailVerified(user.id);
  await User.updateLastLogin(user.id);

  const freshUser = await User.findById(user.id, { raw: true });
  const tokenJwt = generateToken(user.id);

  return {
    status: 200,
    payload: {
      message: 'Correo verificado correctamente',
      ...buildAuthResponse(freshUser, tokenJwt),
    },
  };
}

router.post(
  '/verify-email',
  [body('token').isUUID().withMessage('Token inválido')],
  validate,
  async (req, res) => {
    try {
      const result = await resolveEmailVerification(req.body.token);
      return res.status(result.status).json(result.payload);
    } catch (error) {
      console.error('Error verifying email:', error);
      return res.status(500).json({ error: 'No se pudo verificar el correo' });
    }
  }
);

router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ error: 'Token requerido' });
  }

  try {
    const result = await resolveEmailVerification(token);
    if (result.status === 200) {
      const url = new URL(`${FRONTEND_URL}/#/auth/callback`);
      url.searchParams.set('token', result.payload.token);
      url.searchParams.set('verified', 'true');
      return res.redirect(url.toString());
    }
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error('Error verifying email (GET):', error);
    return res.status(500).json({ error: 'No se pudo verificar el correo' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id, { raw: true });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json(buildPublicUser(user));
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Error al obtener el usuario' });
  }
});

router.put(
  '/me',
  authenticateToken,
  updateProfileValidators,
  validate,
  async (req, res) => {
    try {
      const current = await User.findById(req.user.id, { raw: true });

      if (!current) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const updates = {};
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
        firstName: updates.firstName || current.first_name,
        lastName: updates.lastName || current.last_name,
        email: current.email,
      });

      updates.name = displayName;

      await User.update(req.user.id, updates);
      const refreshed = await User.findById(req.user.id, { raw: true });

      return res.json({
        message: 'Perfil actualizado correctamente',
        user: buildPublicUser(refreshed),
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Error al actualizar el usuario' });
    }
  }
);

const oauthHandler = (provider) => (req, res, next) => {
  passport.authenticate(provider, { session: false }, async (err, user) => {
    if (err || !user) {
      const failUrl = new URL(`${FRONTEND_URL}/#/auth/callback`);
      failUrl.searchParams.set('error', 'oauth_failed');
      failUrl.searchParams.set('provider', provider);
      return res.redirect(failUrl.toString());
    }

    try {
      await User.markEmailVerified(user.id);
      await User.updateLastLogin(user.id);
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

if (hasStrategy('google')) {
  router.get(
    '/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
      prompt: 'select_account',
    })
  );

  router.get('/google/callback', oauthHandler('google'));
} else {
  router.get('/google', (_req, res) => {
    const failUrl = new URL(`${FRONTEND_URL}/#/auth/callback`);
    failUrl.searchParams.set('error', 'provider_unavailable');
    failUrl.searchParams.set('provider', 'google');
    return res.redirect(failUrl.toString());
  });
  router.get('/google/callback', (_req, res) => {
    const failUrl = new URL(`${FRONTEND_URL}/#/auth/callback`);
    failUrl.searchParams.set('error', 'provider_unavailable');
    failUrl.searchParams.set('provider', 'google');
    return res.redirect(failUrl.toString());
  });
}

if (hasStrategy('github')) {
  router.get(
    '/github',
    passport.authenticate('github', {
      scope: ['user:email'],
      session: false,
    })
  );

  router.get('/github/callback', oauthHandler('github'));
} else {
  router.get('/github', (_req, res) => {
    const failUrl = new URL(`${FRONTEND_URL}/#/auth/callback`);
    failUrl.searchParams.set('error', 'provider_unavailable');
    failUrl.searchParams.set('provider', 'github');
    return res.redirect(failUrl.toString());
  });
  router.get('/github/callback', (_req, res) => {
    const failUrl = new URL(`${FRONTEND_URL}/#/auth/callback`);
    failUrl.searchParams.set('error', 'provider_unavailable');
    failUrl.searchParams.set('provider', 'github');
    return res.redirect(failUrl.toString());
  });
}

router.post('/dev-login', async (_req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Dev login no disponible en producción' });
  }

  try {
    const user = await ensureDevUser();
    await User.updateLastLogin(user.id);
    const token = generateToken(user.id);
    return res.json({
      message: 'Sesión de desarrollo iniciada',
      ...buildAuthResponse(user, token),
    });
  } catch (error) {
    console.error('Error issuing dev login:', error);
    return res.status(500).json({ error: 'No se pudo iniciar sesión con el usuario de prueba' });
  }
});

module.exports = router;
