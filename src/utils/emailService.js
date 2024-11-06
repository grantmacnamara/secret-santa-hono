import nodemailer from 'nodemailer'
import 'dotenv/config'

// Debug the environment variables
console.log('Email Environment Variables:', {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS ? '****' : undefined,
  from: process.env.SMTP_FROM
})

// Create the transporter with explicit Gmail configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// Test the connection on startup
transporter.verify(function(error, success) {
  if (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Email service error:', error)
  } else {
    console.log('✅ Email service is ready')
  }
})

export async function sendMatchNotification(giver, receiver) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: giver.email,
    subject: '🎄 Your Secret Santa Match!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #c41e3a;">Ho Ho Ho! 🎅</h1>
        <p>Hello ${giver.username}!</p>
        <p>You have been matched with <strong>${receiver.username}</strong> for the Secret Santa gift exchange!</p>
        
        ${receiver.giftPreferences ? `
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #2e7d32; margin-top: 0;">Their Gift Preferences:</h2>
            <p><strong>Likes:</strong> ${receiver.giftPreferences.likes?.join(', ') || 'None listed'}</p>
            <p><strong>Dislikes:</strong> ${receiver.giftPreferences.dislikes?.join(', ') || 'None listed'}</p>
          </div>
        ` : ''}
        
        <p style="color: #666;">Remember to keep it a secret! 🤫</p>
        <p style="color: #c41e3a;">Happy Christmas and good luck! 🎁</p>
        
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">
          This email was sent from the Macnamara Secret Santa Gift app.
        </p>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`📧 Email sent successfully to ${giver.email}`)
  } catch (error) {
    console.error(`📧 Error sending email to ${giver.email}:`, error)
    throw error
  }
} 