import EmailService from './emailService.js'

export class MatchingSystem {
  static shuffle(array) {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static async generateMatches(users) {
    console.log('🎯 Starting match generation...')
    const allUsers = [...users]
    const participants = allUsers.filter(user => !user.isAdmin && user.ready)

    if (participants.length < 2) {
      throw new Error('Need at least 2 participants')
    }

    const shuffledUsers = this.shuffle([...participants])
    const matches = []

    for (let i = 0; i < shuffledUsers.length; i++) {
      const giver = shuffledUsers[i]
      const receiver = shuffledUsers[(i + 1) % shuffledUsers.length]
      
      if (giver.id === receiver.id) {
        return this.generateMatches(allUsers)
      }
      
      matches.push({
        giverId: giver.id,
        receiverId: receiver.id
      })
    }

    const updatedUsers = allUsers.map(user => {
      const match = matches.find(m => m.giverId === user.id)
      if (match) {
        return {
          ...user,
          matchedWith: match.receiverId
        }
      }
      return user
    })

    try {
      console.log('📧 Starting email notifications...')
      const emailService = new EmailService()
      
      for (const match of matches) {
        const giver = updatedUsers.find(u => u.id === match.giverId)
        const receiver = updatedUsers.find(u => u.id === match.receiverId)
        
        if (giver && giver.email) {
          console.log(`📧 Sending email to ${giver.username} (${giver.email})`)
          await emailService.sendMatchNotification(giver, receiver)
        }
      }
      console.log('📧 Email notifications complete')
    } catch (error) {
      console.error('📧 Error sending emails:', error)
    }

    return { matches, updatedUsers }
  }
} 