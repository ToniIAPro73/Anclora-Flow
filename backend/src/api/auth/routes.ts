import express from 'express';
import passport from 'passport';
// @ts-ignore
import { body } from 'express-validator';
import { authenticateToken } from '../../middleware/auth.js';
import * as authController from './controller.js';

const router = express.Router();

const VALID_LANGUAGES = ['es', 'en'];
const VALID_THEMES = ['light', 'dark'];

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
    .custom((value: string, { req }: { req: any }) => {
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
  authController.validate,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('La contraseña es obligatoria'),
  ],
  authController.validate,
  authController.login
);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Correo inválido').normalizeEmail()],
  authController.validate,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').isUUID().withMessage('Token inválido'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener al menos 8 caracteres'),
  ],
  authController.validate,
  authController.resetPassword
);

router.post(
  '/resend-verification',
  [body('email').isEmail().normalizeEmail()],
  authController.validate,
  authController.resendVerification
);

router.post(
  '/verify-email',
  [body('token').isUUID().withMessage('Token inválido')],
  authController.validate,
  authController.verifyEmail
);

router.get('/verify-email', authController.verifyEmailGet);

router.get('/me', authenticateToken, authController.getMe);

router.put(
  '/me',
  authenticateToken,
  updateProfileValidators,
  authController.validate,
  authController.updateMe
);

// Helper to check for strategies (passport-google-oauth20 doesn't expose it easily in Types)
const hasStrategy = (name: string) => {
  try {
    return Boolean((passport as any)._strategy(name));
  } catch (_err) {
    return false;
  }
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

  router.get('/google/callback', authController.oauthHandler('google'));
}

if (hasStrategy('github')) {
  router.get(
    '/github',
    passport.authenticate('github', {
      scope: ['user:email'],
      session: false,
    })
  );

  router.get('/github/callback', authController.oauthHandler('github'));
}

router.post('/dev-login', authController.devLogin);

export default router;
