import 'dotenv/config'
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { getCookie, setCookie } from 'hono/cookie'
import { userManager } from '../utils/userManager.js'
import { generateMatches } from '../utils/matching.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { renderGiftPreferences } from '../components/giftPreferences.js'
import { flash } from '../utils/flash.js'
import { sendMatchNotification } from '../utils/emailService.js'
import { renderWelcomeSteps } from '../components/welcomeSteps.js'
import { createNotification } from '../utils/notifications.js'
import { renderLoginPage } from '../pages/login.js'

export const app = new Hono()

// Initialize user manager
app.use('*', async (c, next) => {
  await userManager.initialize()
  c.set('userManager', userManager)
  await next()
})

// Serve static files
app.use('/public/*', serveStatic({ root: './' }))

// Public routes
app.get('/login', async (c) => {
  const message = flash.get(c)
  return c.html(renderLoginPage(message))
})

app.post('/login', async (c) => {
  const { username, password } = await c.req.parseBody()
  const userManager = c.get('userManager')
  
  try {
    const user = await userManager.validateUser(username, password)
    if (!user) {
      flash.set(c, { type: 'error', text: 'Invalid username or password' })
      return c.html(renderLoginPage({ type: 'error', text: 'Invalid username or password' }))
    }

    setCookie(c, 'userId', user.id.toString(), {
      path: '/',
      httpOnly: true
    })

    return c.redirect(user.isAdmin ? '/admin' : '/')
  } catch (error) {
    console.error('Login error:', error)
    flash.set(c, { type: 'error', text: 'An error occurred during login' })
    return c.html(renderLoginPage({ type: 'error', text: 'An error occurred during login' }))
  }
})

// Protected routes
app.use('/admin/*', authMiddleware, adminMiddleware)
app.use('/*', authMiddleware)

// Admin routes
app.get('/admin', adminMiddleware, async (c) => {
  const userManager = c.get('userManager')
  const allUsers = await userManager.getUsers()
  // Filter out admin users for display and ensure users is always an array
  const users = allUsers?.filter(user => !user.isAdmin) || []
  const message = flash.get(c)

  // Add defensive stats calculation
  const stats = {
    total: users.length || 0,
    ready: users.filter(user => user.ready).length || 0,
    notReady: users.filter(user => !user.ready).length || 0
  }

  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Secret Santa Admin</title>
        <link rel="stylesheet" href="/public/css/global.css">
        <style>
          .user-row {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 0.5rem;
          }
          .ready-toggle {
            padding: 0.25rem 0.5rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.875rem;
          }
          .ready-toggle.ready {
            background-color: var(--christmas-green);
            color: white;
          }
          .ready-toggle.not-ready {
            background-color: var(--christmas-red);
            color: white;
          }
          .user-actions {
            display: flex;
            gap: 0.5rem;
          }
          .delete-btn {
            background-color: var(--christmas-red);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 0.25rem 0.5rem;
            cursor: pointer;
          }
          .stats {
            margin-bottom: 1rem;
            padding: 0.5rem;
            background-color: #f5f5f5;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${message ? `
            <div class="notification notification-${message.type}">
              ${message.text}
              <button onclick="this.parentElement.remove()" class="notification-close">&times;</button>
            </div>
          ` : ''}
          
          <div class="card">
            <h1>Admin Dashboard 🎅</h1>
            
            <section>
              <h2>Add New User</h2>
              <form method="POST" action="/admin/users" class="form">
                <div class="form-group">
                  <label for="username">Username:</label>
                  <input type="text" id="username" name="username" required>
                </div>
                <div class="form-group">
                  <label for="email">Email:</label>
                  <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                  <label for="password">Password:</label>
                  <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="btn">Add User</button>
              </form>
            </section>

            <section>
              <h2>Participants</h2>
              <div class="stats">
                <p>Total Participants: ${stats.total}</p>
                <p>Ready: ${stats.ready}</p>
                <p>Not Ready: ${stats.notReady}</p>
              </div>
              ${users.map(user => `
                <div class="user-row">
                  <span>${user.username}</span>
                  <span>(${user.email})</span>
                  <div class="user-actions">
                    <form method="POST" action="/admin/toggle-ready/${user.id}" style="margin: 0;">
                      <button type="submit" 
                              class="ready-toggle ${user.ready ? 'ready' : 'not-ready'}"
                              title="${user.ready ? 'Click to unready' : 'Click to ready'}">
                        ${user.ready ? '✓ Ready' : '✗ Not Ready'}
                      </button>
                    </form>
                    <form method="POST" action="/admin/users/${user.id}/delete" style="margin: 0;">
                      <button type="submit" class="delete-btn" 
                              onclick="return confirm('Are you sure you want to delete this user?')">
                        Delete
                      </button>
                    </form>
                  </div>
                  ${user.matchedWith ? 
                    `<span>→ Matched with: ${allUsers.find(u => u.id === user.matchedWith)?.username || 'Unknown'}</span>` 
                    : '<span>Not matched</span>'
                  }
                </div>
              `).join('')}

              <div class="admin-match-controls" style="margin-top: 2rem;">
                ${stats.total > 0 ? `
                  <div class="match-status-indicator ${stats.ready === stats.total ? 'ready' : 'not-ready'}">
                    ${stats.ready === stats.total 
                      ? '✅ All participants are ready!' 
                      : `⚠️ Waiting for ${stats.notReady} participant${stats.notReady !== 1 ? 's' : ''} to be ready`
                    }
                  </div>
                  
                  <form method="POST" action="/admin/match" style="display: inline-block; margin-right: 1rem;">
                    <button type="submit" 
                            class="btn btn-primary"
                            ${stats.ready !== stats.total ? 'disabled' : ''}
                            onclick="return confirm('Are you sure you want to generate matches?')">
                      Generate Matches 🎯
                    </button>
                  </form>

                  <form method="POST" action="/admin/rematch" style="display: inline-block; margin-right: 1rem;">
                    <button type="submit" 
                            class="btn btn-warning"
                            ${stats.ready !== stats.total ? 'disabled' : ''}
                            onclick="return confirm('Are you sure you want to clear and regenerate all matches?')">
                      Clear & Rematch 🔄
                    </button>
                  </form>

                  ${users.some(u => u.matchedWith) ? `
                    <form method="POST" action="/admin/send-emails" style="display: inline-block;">
                      <button type="submit" 
                              class="btn btn-success"
                              onclick="return confirm('This will send emails to all matched participants. Continue?')">
                        Send Match Emails 📧
                      </button>
                    </form>
                  ` : ''}
                ` : '<p>No participants added yet.</p>'}
              </div>
            </section>

            <div class="admin-actions" style="margin-top: 2rem; text-align: right;">
              <form method="POST" action="/logout" style="margin: 0;">
                <button type="submit" class="btn btn-secondary">Logout</button>
              </form>
            </div>
          </div>
        </div>
        <script src="/public/js/snowflakes.js"></script>
      </body>
    </html>
  `)
})

app.post('/admin/add-user', async (c) => {
  const { username, password } = await c.req.parseBody()
  try {
    const user = await userManager.addUser(username, password)
    return c.html(`
      <html>
        <head>
          <meta http-equiv="refresh" content="3;url=/admin">
        </head>
        <body>
          User added successfully!
        </body>
      </html>
    `)
  } catch (error) {
    return c.html(`
      <html>
        <head>
          <meta http-equiv="refresh" content="3;url=/admin">
        </head>
        <body>
          Error adding user: ${error.message}
        </body>
      </html>
    `)
  }
})

app.post('/admin/logout', (c) => {
  setCookie(c, 'userId', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0
  })
  return c.redirect('/login')
})

// Home route
app.get('/', async (c) => {
  const user = c.get('user')
  const allUsers = await userManager.getUsers()
  const match = user.matchedWith ? allUsers.find(u => u.id === user.matchedWith) : null
  const message = flash.get(c)
  const config = await userManager.getConfig()

  // Ensure user has giftPreferences
  if (!user.giftPreferences) {
    user.giftPreferences = {
      likes: [],
      dislikes: []
    }
  }

  // Debug the flash message
  const flashMessage = flash.get(c)
  console.log('Flash message:', flashMessage)
  
  const notificationHtml = flashMessage 
    ? createNotification(flashMessage.type, flashMessage.message)
    : ''

  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Secret Santa Dashboard</title>
        <link rel="stylesheet" href="/public/css/global.css">
      </head>
      <body>
        ${notificationHtml}
        <div class="container">
          <div class="card">
            <div class="dashboard-header">
              <h1>Welcome, ${user.username}! 🎄</h1>
              ${user.ready ? 
                '<span class="status-badge ready">Ready for Matching</span>' : 
                '<span class="status-badge pending">Not Ready</span>'
              }
            </div>

            ${renderWelcomeSteps()}

            <div class="preferences-section">
              ${renderGiftPreferences(user.giftPreferences, config, user)}
            </div>

            <form method="POST" action="/logout" class="logout-form">
              <button type="submit" class="btn btn-secondary">Logout</button>
            </form>
          </div>
        </div>
        <script src="/public/js/snowflakes.js"></script>
      </body>
    </html>
  `)
})

// Admin API routes
app.post('/admin/users', adminMiddleware, async (c) => {
  try {
    const formData = await c.req.parseBody()
    console.log('Creating user with data:', {
      username: formData.username,
      email: formData.email
    })
    
    const userManager = c.get('userManager')
    await userManager.addUser(
      formData.username,
      formData.password,
      false,
      formData.email
    )
    
    flash.set(c, { type: 'success', text: 'User added successfully' })
  } catch (error) {
    console.error('User creation error:', error)
    flash.set(c, { type: 'error', text: 'Failed to add user' })
  }
  
  return c.redirect('/admin')
})

app.post('/admin/users/:id/delete', async (c) => {
  const id = parseInt(c.req.param('id'))
  await userManager.deleteUser(id)
  return c.redirect('/admin')
})

app.post('/admin/generate-matches', adminMiddleware, async (c) => {
  try {
    const userManager = c.get('userManager')
    const users = await userManager.getUsers()
    
    if (!users || users.length < 2) {
      throw new Error('Not enough users to generate matches')
    }

    console.log('🎯 Starting match generation with', users.length, 'users')
    const { matches, updatedUsers } = await generateMatches(users)
    
    // Verify we have users before saving
    if (!updatedUsers || updatedUsers.length === 0) {
      throw new Error('Match generation produced no valid user data')
    }

    // Log before saving
    console.log('🎯 Saving updated users:', updatedUsers.length, 'users')
    await userManager.saveUsers(updatedUsers)
    
    flash.set(c, {
      type: 'success',
      text: `Successfully generated ${matches.length} matches!`
    })
  } catch (error) {
    console.error('Match generation error:', error)
    flash.set(c, {
      type: 'error',
      text: error.message || 'Failed to generate matches'
    })
  }
  
  return c.redirect('/admin')
})

app.post('/admin/reset-matches', async (c) => {
  try {
    const users = await userManager.getUsers()
    for (const user of users) {
      if (!user.isAdmin) {
        await userManager.updateUser(user.id, {
          matchedWith: null,
          ready: false
        })
      }
    }
    
    flash.set(c, {
      type: 'success',
      text: 'Matches have been reset!'
    })
    
    return c.redirect('/admin')
  } catch (error) {
    flash.set(c, {
      type: 'error',
      text: 'Failed to reset matches'
    })
    return c.redirect('/admin')
  }
})

// User API routes
app.post('/preferences', async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.parseBody()
    
    // Update preferences and set ready status
    user.giftPreferences = {
      likes: [body['likes[0]'], body['likes[1]']],
      dislikes: [body['dislikes[0]'], body['dislikes[1]']],
    }
    user.ready = true
    
    await userManager.updateUser(user.id, user)
    
    // Set a specific flash message
    flash.set(c, {
      type: 'success',
      message: 'Preferences saved! You\'ll receive an email when matches are made.'
    })
    
    return c.redirect('/')
  } catch (error) {
    console.error('Preference save error:', error)
    flash.set(c, {
      type: 'error',
      message: 'Error saving preferences. Please try again.'
    })
    return c.redirect('/')
  }
})

app.post('/ready', async (c) => {
  const user = c.get('user')
  await userManager.updateUser(user.id, {
    ready: !user.ready
  })
  return c.redirect('/')
})

app.post('/logout', (c) => {
  setCookie(c, 'userId', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0
  })
  return c.redirect('/login')
})

// Add this route for debugging
app.get('/debug/users', async (c) => {
  const users = await userManager.getUsers()
  return c.json({
    userCount: users.length,
    hasAdmin: users.some(u => u.username === 'admin'),
    users: users.map(u => ({
      id: u.id,
      username: u.username,
      isAdmin: u.isAdmin
    }))
  })
})

// Add route to handle config updates
app.post('/admin/config', async (c) => {
  const { priceRange } = await c.req.parseBody()
  await userManager.updateConfig({ priceRange })
  flash.set(c, {
    type: 'success',
    text: 'Exchange settings updated successfully!'
  })
  return c.redirect('/admin')
})

app.post('/admin/reset', adminMiddleware, async (c) => {
  try {
    console.log('🔄 Reset matches requested')
    const userManager = c.get('userManager')
    await userManager.resetMatches()
    
    flash.set(c, {
      type: 'success',
      text: 'Matches have been reset. User preferences and ready status preserved.'
    })
  } catch (error) {
    console.error('Reset error:', error)
    flash.set(c, {
      type: 'error',
      text: 'Failed to reset matches'
    })
  }
  
  return c.redirect('/admin')
})

// Add this new route for toggling ready status
app.post('/admin/toggle-ready/:userId', adminMiddleware, async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'))
    const userManager = c.get('userManager')
    const users = await userManager.getUsers()
    
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          ready: !user.ready  // Toggle the ready status
        }
      }
      return user
    })
    
    await userManager.saveUsers(updatedUsers)
    
    flash.set(c, {
      type: 'success',
      text: `Successfully updated ready status`
    })
  } catch (error) {
    console.error('Toggle ready error:', error)
    flash.set(c, {
      type: 'error',
      text: 'Failed to update ready status'
    })
  }
  
  return c.redirect('/admin')
})

// Generate matches
app.post('/admin/match', adminMiddleware, async (c) => {
  const userManager = c.get('userManager')
  const users = await userManager.getUsers()
  const participants = users.filter(user => !user.isAdmin)

  if (!participants.every(user => user.ready)) {
    flash.set(c, { type: 'error', text: 'All participants must be ready before generating matches.' })
    return c.redirect('/admin')
  }

  try {
    const { updatedUsers } = await generateMatches(users)
    await userManager.saveUsers(updatedUsers)
    flash.set(c, { type: 'success', text: 'Matches generated successfully!' })
  } catch (error) {
    console.error('Matching error:', error)
    flash.set(c, { type: 'error', text: 'Error generating matches: ' + error.message })
  }

  return c.redirect('/admin')
})

// Clear and regenerate matches
app.post('/admin/rematch', adminMiddleware, async (c) => {
  const userManager = c.get('userManager')
  const users = await userManager.getUsers()
  const participants = users.filter(user => !user.isAdmin)

  if (!participants.every(user => user.ready)) {
    flash.set(c, { type: 'error', text: 'All participants must be ready before regenerating matches.' })
    return c.redirect('/admin')
  }

  try {
    // Clear existing matches
    const clearedUsers = users.map(user => ({
      ...user,
      matchedWith: null
    }))

    // Generate new matches
    const { updatedUsers } = await generateMatches(clearedUsers)
    await userManager.saveUsers(updatedUsers)
    flash.set(c, { type: 'success', text: 'Matches cleared and regenerated successfully!' })
  } catch (error) {
    console.error('Rematching error:', error)
    flash.set(c, { type: 'error', text: 'Error regenerating matches: ' + error.message })
  }

  return c.redirect('/admin')
})

app.post('/admin/send-emails', adminMiddleware, async (c) => {
  const userManager = c.get('userManager')
  const users = await userManager.getUsers()
  const matchedUsers = users.filter(user => user.matchedWith && !user.isAdmin)

  if (matchedUsers.length === 0) {
    flash.set(c, { type: 'error', text: 'No matches found to send emails for.' })
    return c.redirect('/admin')
  }

  try {
    let emailsSent = 0
    let emailErrors = 0
    
    for (const giver of matchedUsers) {
      try {
        const receiver = users.find(u => u.id === giver.matchedWith)
        if (giver.email && receiver) {
          await sendMatchNotification(giver, receiver)
          emailsSent++
        }
      } catch (err) {
        console.error(`Failed to send email to ${giver.email}:`, err)
        emailErrors++
      }
    }

    if (emailErrors > 0) {
      flash.set(c, { 
        type: 'warning', 
        text: `Sent ${emailsSent} emails, but ${emailErrors} failed. Check console for details.` 
      })
    } else {
      flash.set(c, { 
        type: 'success', 
        text: `Successfully sent ${emailsSent} match notification email${emailsSent !== 1 ? 's' : ''}!` 
      })
    }
  } catch (error) {
    console.error('Email error:', error)
    flash.set(c, { type: 'error', text: 'Error sending emails: ' + error.message })
  }

  return c.redirect('/admin')
})