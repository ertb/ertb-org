import nodemailer from 'nodemailer'

/**
 * @param {string} from 
 * @param {string|string[]} to 
 * @param {string} subject 
 * @param {string} html 
 * @throws error if cannot send email via smpt server
 */
export const sendEmail = async (from:string, to:string, subject:string, html:string) => {
  if (Array.isArray(to)) to = to.join(', ')

  if (!process.env.SMTP_URL) {
    throw new Error('SMTP_URL is not set.')
  }

  const smtpUrl = new URL(process.env.SMTP_URL || '')
  if (['smtp', 'smtps'].indexOf(smtpUrl.protocol) < 0) {
    throw new Error('Protocol in SMTP_URL is invalid. Expecting "smtps" or "smtp".')
  }

  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: smtpUrl.host,
    port: parseInt(smtpUrl.port || '0') || 465,
    secure: parseInt(process.env.SMTP_PORT || '0') === 465,
    auth: {
      user: smtpUrl.username,
      pass: smtpUrl.password,
    }
  })

  // send mail with defined transport object
  await transporter.sendMail({
    from, // sender address
    bcc: process.env.SMTP_TEST_RECIPIENTS || to, // list of receivers
    subject, // Subject line
    html, // html body
  })
}
