import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const from = process.env.EMAIL_FROM ?? 'PizzaMath <onboarding@resend.dev>'

const resend = apiKey ? new Resend(apiKey) : null

interface SendArgs {
  to: string
  subject: string
  html: string
}

async function send({ to, subject, html }: SendArgs): Promise<void> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — printing email to console instead')
    console.info('[email] to:', to)
    console.info('[email] subject:', subject)
    console.info('[email] html:', html)
    return
  }
  const result = await resend.emails.send({ from, to, subject, html })
  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`)
  }
}

function buildLinkHtml(intro: string, link: string, ctaLabel: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <h1 style="color:#ea580c;font-size:24px;margin:0 0 12px;">PizzaMath</h1>
      <p style="font-size:15px;color:#374151;line-height:1.5;">${intro}</p>
      <p style="margin:24px 0;">
        <a href="${link}" style="background:#ea580c;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600;font-size:14px;display:inline-block;">${ctaLabel}</a>
      </p>
      <p style="font-size:13px;color:#6b7280;line-height:1.5;">Or copy and paste this URL:<br><span style="word-break:break-all;color:#9ca3af;">${link}</span></p>
      <p style="font-size:12px;color:#9ca3af;margin-top:32px;">This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `
}

export async function sendMagicLink(email: string, link: string): Promise<void> {
  await send({
    to: email,
    subject: 'Your PizzaMath sign-in link',
    html: buildLinkHtml(
      "Click the button below to sign in to your PizzaMath account. No password needed.",
      link,
      'Sign in to PizzaMath',
    ),
  })
}

export async function sendWelcomeLink(email: string, link: string): Promise<void> {
  await send({
    to: email,
    subject: 'Welcome to PizzaMath — confirm your email',
    html: buildLinkHtml(
      "Welcome to PizzaMath! Click the button below to confirm your email and sign in.",
      link,
      'Confirm and sign in',
    ),
  })
}
