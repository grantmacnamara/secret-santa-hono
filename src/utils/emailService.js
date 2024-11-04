import nodemailer from 'nodemailer'
import 'dotenv/config'

class EmailService {
  constructor() {
    console.log('📧 Initializing Email Service...')
    
    // Verify we have email credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('📧 Missing email credentials in .env file')
      throw new Error('Email credentials not configured')
    }

    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    // Log email configuration (without password)
    console.log('📧 Email Service configured with:', {
      host: 'smtp.gmail.com',
      user: process.env.EMAIL_USER,
      port: 587
    })
  }

  async sendMatchNotification(user, match) {
    if (!user.email) {
      console.log(`📧 Skipping email for ${user.username} - no email address`)
      return
    }

    console.log(`📧 Preparing to send match notification email to ${user.username} (${user.email})`)
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: '🎄 Your Secret Santa Match is Ready! 🎁',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #165B33;">Your Secret Santa Match</h1>
          <p>Hello ${user.username}!</p>
          <p>Your Secret Santa match has been generated. Log in to see who you'll be buying a gift for!</p>
          <p style="margin: 20px 0;">
            <a href="${process.env.APP_URL || 'http://localhost:3000'}" 
               style="background-color: #D42426; color: white; padding: 10px 20px; 
                      text-decoration: none; border-radius: 5px;">
              View Your Match
            </a>
          </p>
          <p>Happy gifting! 🎁</p>
        </div>
      `
    }

    try {
      console.log('📧 Attempting to send email...')
      await this.transporter.sendMail(mailOptions)
      console.log('📧 Email sent successfully to:', user.email)
    } catch (error) {
      console.error('❌ Email sending failed:', error.message)
      console.error('Details:', {
        user: user.username,
        email: user.email,
        error: error.toString()
      })
      throw error // Re-throw to handle in calling code
    }
  }
}

export default EmailService 