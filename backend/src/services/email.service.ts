import nodemailer from 'nodemailer';

let transporter: any = null;

function resolveTransport() {
  if (transporter) {
    return transporter;
  }

  const transportType = process.env.MAIL_TRANSPORT || 'console';

  if (transportType === 'smtp') {
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT || 587),
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });
    return transporter;
  }

  if (transportType === 'test') {
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_TEST_USER,
        pass: process.env.MAIL_TEST_PASS,
      },
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });

  return transporter;
}

export interface ISendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail({ to, subject, html, text }: ISendEmailArgs) {
  const from =
    process.env.MAIL_FROM ||
    '"Anclora Flow" <no-reply@anclora.test>';

  const transport = resolveTransport();

  const message = {
    from,
    to,
    subject,
    text,
    html,
  };

  const info = await transport.sendMail(message);

  if (transport.options?.streamTransport) {
    const output = info.message.toString();
    console.log('✉️  Email simulado (no enviado):');
    console.log(output);
  } else {
    console.log(`✉️  Email enviado a ${to}: ${info.messageId}`);
    // nodemailer.getTestMessageUrl is safe to check at runtime
    if ((nodemailer as any).getTestMessageUrl && info) {
      const previewUrl = (nodemailer as any).getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 Vista previa: ${previewUrl}`);
      }
    }
  }

  return info;
}
