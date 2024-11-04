import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { getCookie, setCookie } from 'hono/cookie'
import { userManager } from '../utils/userManager.js'
import { MatchingSystem } from '../utils/matching.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { renderGiftPreferences } from '../components/giftPreferences.js'
import { flash } from '../utils/flash.js'

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
app.get('/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Login - Secret Santa</title>
        <link rel="stylesheet" href="/public/css/global.css">
      </head>
      <body>
        <div class="container">
          <div class="card">
            <h1>Secret Santa Login</h1>
            <form action="/login" method="POST" class="login-form">
              <div class="form-group">
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" required>
              </div>
              <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
              </div>
              <button type="submit" class="btn">Login</button>
            </form>
          </div>
        </div>
      </body>
    </html>
  `)
})

app.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.parseBody()
    console.log('Login attempt:', { username })

    const user = await userManager.validateUser(username, password)
    console.log('Validation result:', user ? 'Success' : 'Failed')

    if (!user) {
      return c.html(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Login Failed</title>
            <meta http-equiv="refresh" content="3;url=/login">
            <link rel="stylesheet" href="/public/css/global.css">
          </head>
          <body>
            <div class="container">
              <div class="card">
                <h1>Login Failed</h1>
                <p>Invalid username or password. Redirecting back to login...</p>
              </div>
            </div>
          </body>
        </html>
      `)
    }

    setCookie(c, 'userId', user.id.toString(), {
      httpOnly: true,
      path: '/'
    })

    return c.redirect(user.isAdmin ? '/admin' : '/')
  } catch (error) {
    console.error('Login error:', error)
    return c.text('Login error occurred', 500)
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
            </section>

            <section>
              <h2>Match Actions</h2>
              <div class="admin-actions">
                <form method="POST" action="/admin/generate-matches" style="display: inline;">
                  <button type="submit" class="btn">Generate Matches</button>
                </form>
                <form method="POST" action="/admin/reset" style="display: inline;">
                  <button type="submit" class="btn btn-danger">Reset Matches</button>
                </form>
              </div>
            </section>
          </div>
        </div>
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

  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Secret Santa Dashboard</title>
        <link rel="stylesheet" href="/public/css/global.css">
      </head>
      <body>
        ${message ? `
          <div class="notification notification-${message.type}">
            ${message.text}
            <button onclick="this.parentElement.remove()" class="notification-close">&times;</button>
          </div>
        ` : ''}
        <div class="container">
          <div class="card">
            <div class="dashboard-header">
              <h1>Welcome, ${user.username}! 🎄</h1>
              ${user.ready ? 
                '<span class="status-badge ready">Ready for Matching</span>' : 
                '<span class="status-badge pending">Not Ready</span>'
              }
            </div>

            <div class="preferences-section">
              <h2>Your Gift Preferences</h2>
              <form method="POST" action="/preferences" class="preferences-form">
                ${renderGiftPreferences(user.giftPreferences, config)}
                <div class="form-actions">
                  <button type="submit" class="btn">Save Preferences</button>
                </div>
              </form>
            </div>

            ${match ? `
              <div class="match-card">
                <h2>Your Secret Santa Match 🎁</h2>
                <div class="match-details">
                  <h3>You are buying for: ${match.username}</h3>
                  ${match.giftPreferences ? `
                    <div class="match-preferences">
                      <h4>Their Preferences:</h4>
                      <div class="preference-summary">
                        <p><strong>Likes:</strong> ${match.giftPreferences.likes?.join(', ') || 'None listed'}</p>
                        <p><strong>Dislikes:</strong> ${match.giftPreferences.dislikes?.join(', ') || 'None listed'}</p>
                      </div>
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : ''}

            <div class="card action-card">
              <form method="POST" action="/ready" class="ready-form">
                <button type="submit" class="btn ${user.ready ? 'btn-success' : 'btn-primary'}">
                  ${user.ready ? 'I\'m Ready! ✓' : 'Mark as Ready'}
                </button>
              </form>
              <form method="POST" action="/logout" class="logout-form">
                <button type="submit" class="btn btn-secondary">Logout</button>
              </form>
            </div>
          </div>
        </div>
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
    const { matches, updatedUsers } = await MatchingSystem.generateMatches(users)
    
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
    
    // Get likes and dislikes from form, ensuring they're arrays
    const likes = [
      body['likes[0]'] || '',
      body['likes[1]'] || ''
    ].filter(Boolean)

    const dislikes = [
      body['dislikes[0]'] || '',
      body['dislikes[1]'] || ''
    ].filter(Boolean)

    if (likes.length !== 2 || dislikes.length !== 2) {
      throw new Error('Please provide exactly two likes and two dislikes')
    }

    await userManager.updateUser(user.id, {
      giftPreferences: { likes, dislikes }
    })

    flash.set(c, {
      type: 'success',
      text: 'Preferences updated successfully!'
    })

    return c.redirect('/')
  } catch (error) {
    flash.set(c, {
      type: 'error',
      text: error.message || 'Failed to update preferences'
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