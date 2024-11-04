import nodemailer from 'nodemailer'
import 'dotenv/config'

// Log environment variables (temporarily, for debugging)
console.log('Email Config:', {
  host: process.env.SMTP_HOST,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS?.substring(0, 3) + '...' // Only log first 3 chars of password
})

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Using Gmail service
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,  // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Your app-specific password
  },
  tls: {
    rejectUnauthorized: false // Only use during development
  }
})

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log('❌ Email service error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

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
        <p style="color: #c41e3a;">Happy gifting! 🎁</p>
        
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">
          This email was sent from the Secret Santa Gift Exchange application.
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