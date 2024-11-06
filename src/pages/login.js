export function renderLoginPage(message = null) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Login - Secret Santa</title>
        <link rel="stylesheet" href="/public/css/global.css">
        <style>
          .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .login-card {
            width: 100%;
            max-width: 400px;
            padding: 2rem;
          }

          .login-title {
            text-align: center;
            margin-bottom: 2rem;
            color: var(--snow-white);
          }

          .login-form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .login-btn {
            margin-top: 1rem;
          }
        </style>
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
            <h1 class="login-title">🎄 Secret Santa</h1>
            <form action="/login" method="POST" class="login-form">
              <div class="form-group">
                <label for="username">Username:</label>
                <input type="text" 
                       id="username" 
                       name="username" 
                       required 
                       autocomplete="username">
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