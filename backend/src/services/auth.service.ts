import crypto from 'crypto';
import { sendEmail } from './email.service.js';
import { IUser } from '../types/user.js';

export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3020';
export const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 8020}`;

export function generateUuid(): string {
  return crypto.randomUUID();
}

export function buildVerificationLink(token: string): string {
  const base = process.env.AUTH_VERIFICATION_URL || `${FRONTEND_URL}/#/auth/verify`;
  const url = new URL(base);
  url.searchParams.set('token', token);
  return url.toString();
}

export function buildPasswordResetLink(token: string): string {
  const base = process.env.AUTH_RESET_URL || `${FRONTEND_URL}/#/auth/reset`;
  const url = new URL(base);
  url.searchParams.set('token', token);
  return url.toString();
}

export function buildPublicUser(user: any) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    firstName: user.first_name || user.firstName,
    lastName: user.last_name || user.lastName,
    company: user.company,
    phone: user.phone,
    avatarUrl: user.avatar_url,
    authProvider: user.auth_provider || user.authProvider,
    language: user.language,
    theme: user.theme,
    emailVerifiedAt: user.email_verified_at,
  };
}

export async function dispatchVerificationEmail(user: IUser, token: string) {
  const link = buildVerificationLink(token);
  const subject = 'Confirma tu cuenta en Anclora Flow';
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 512px; margin: 0 auto; background: #f8fafc; padding: 32px;">
      <div style="background: linear-gradient(135deg, #3366ff 0%, #14b8a6 50%, #d946ef 100%); padding: 24px; border-radius: 18px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">Bienvenido a Anclora Flow</h1>
        <p style="color: rgba(255,255,255,0.92); margin: 12px 0 0; font-size: 15px;">
          Hola ${user.firstName || user.name || 'creador/a'}, estamos casi listos.
        </p>
      </div>
      <div style="background: #ffffff; padding: 24px; margin-top: 16px; border-radius: 18px; box-shadow: 0 12px 32px rgba(51,102,255,0.12);">
        <p style="color: #1e293b; font-size: 15px; line-height: 1.6;">
          Confirma tu correo electrónico para activar tu espacio de trabajo.
        </p>
        <a href="${link}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background: linear-gradient(135deg, #3366ff 0%, #1e40af 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600;">
          Confirmar cuenta
        </a>
        <p style="color: #64748b; font-size: 13px;">
          Si no has solicitado esta cuenta, puedes ignorar este correo.
        </p>
      </div>
    </div>
  `;

  const text = `Hola ${user.firstName || user.name || 'creador/a'}, confirma tu correo en Anclora Flow: ${link}`;

  await sendEmail({ to: user.email, subject, html, text });
}

export async function dispatchPasswordResetEmail(user: IUser, token: string) {
  const link = buildPasswordResetLink(token);
  const subject = 'Restablece tu contraseña en Anclora Flow';
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 512px; margin: 0 auto; background: #f8fafc; padding: 32px;">
      <div style="background: #ffffff; padding: 24px; border-radius: 18px; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);">
        <h2 style="color: #1e293b; margin-top: 0; font-size: 22px;">¿Olvidaste tu contraseña?</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Anclora Flow.
        </p>
        <a href="${link}" style="display: inline-block; margin: 24px 0; padding: 12px 26px; background: linear-gradient(135deg, #3366ff 0%, #14b8a6 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600;">
          Crear nueva contraseña
        </a>
        <p style="color: #94a3b8; font-size: 13px;">
          Si tú no solicitaste este cambio, ignora este mensaje. El enlace expirará en 1 hora.
        </p>
      </div>
    </div>
  `;

  const text = `Sigue este enlace para restablecer tu contraseña en Anclora Flow: ${link}`;

  await sendEmail({ to: user.email, subject, html, text });
}
