export function renderLoginPage(message = null) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Secret Santa - Login</title>
      <link rel="stylesheet" href="/public/css/global.css">
      <link rel="stylesheet" href="/public/css/login.css">
    </head>
    <body>
      ${message ? `
        <div class="notification notification-${message.type}">
          ${message.text}
          <button onclick="this.parentElement.remove()" class="notification-close">&times;</button>
        </div>
      ` : ''}
      
      <div class="login-container">
        <div class="card login-card">
          <h1 class="login-title">
            🎄 Macnamara's
            <span>Secret Santa!</span>
          </h1>
          <form action="/login" method="POST" class="login-form">
            <div class="form-group">
              <label for="username">Username:</label>
              <input type="text" 
                     id="username" 
                     name="username" 
                     required 
                     autocomplete="username"
                     autocapitalize="none">
            </div>
            <div class="form-group">
              <label for="password">Password:</label>
              <input type="password" 
                     id="password" 
                     name="password" 
                     required
                     autocomplete="current-password">
            </div>
            <button type="submit" class="btn login-btn">Login</button>
          </form>
        </div>
      </div>
      <script src="/public/js/snowflakes.js"></script>
    </body>
    </html>
  `
} 