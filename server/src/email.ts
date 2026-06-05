import nodemailer from 'nodemailer'

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const host = process.env.SMTP_HOST
  if (!host) {
    const token = new URL(resetUrl).searchParams.get('token') ?? ''
    console.log(`[email:dev] Password reset requested for ${to} (token prefix: ${token.slice(0, 8)}…) — set SMTP_HOST to send real email`)
    return
  }
  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
  await transport.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@pizzamath.com',
    to,
    subject: 'Reset your PizzaMath password',
    text: `Click the link below to reset your password. It expires in 1 hour.\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>Click the link below to reset your password. It expires in <strong>1 hour</strong>.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can ignore this email.</p>`,
  })
}
