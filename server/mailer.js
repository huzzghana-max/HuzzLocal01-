const nodemailer = require('nodemailer')

const MAIL_HOST = process.env.MAIL_HOST || 'sandbox.smtp.mailtrap.io'
const MAIL_PORT = process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 2525
const MAIL_SECURE = process.env.MAIL_SECURE === 'true'
const MAIL_USER = process.env.MAIL_USER || ''
const MAIL_PASS = process.env.MAIL_PASS || ''
const MAIL_FROM = process.env.MAIL_FROM || 'noreply@huzz.app'

const transporter = nodemailer.createTransport({
  host: MAIL_HOST,
  port: MAIL_PORT,
  secure: MAIL_SECURE,
  auth: MAIL_USER && MAIL_PASS ? { user: MAIL_USER, pass: MAIL_PASS } : undefined,
})

async function sendMail({ to, subject, html, text, from }) {
  const info = await transporter.sendMail({
    from: from || MAIL_FROM,
    to,
    subject,
    html,
    text,
  })
  return info
}

module.exports = {
  sendMail,
  transporter,
}
