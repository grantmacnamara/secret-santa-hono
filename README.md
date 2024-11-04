# 🎅 Secret Santa Gift Exchange

A web application for managing Secret Santa gift exchanges. Features include user management, gift preferences, automatic matching, and email notifications.

## 🎄 Features

- **User Management**: Create and manage participants
- **Gift Preferences**: Users can specify likes and dislikes
- **Automatic Matching**: Random assignment of gift givers and receivers
- **Email Notifications**: Automatic emails when matches are made
- **Admin Dashboard**: Manage users, track readiness, and initiate matching
- **Secure Authentication**: Password hashing and cookie-based sessions

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- SMTP server access for sending emails

## 🚀 Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/secret-santa.git
cd secret-santa
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Create environment file**

Create a `.env` file in the root directory with the following variables:
```env
# Server Configuration
PORT=3000
HOST=localhost

# JWT Secret (generate a secure random string)
JWT_SECRET=your_jwt_secret_here

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
SMTP_FROM=Secret Santa <noreply@example.com>

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
ADMIN_EMAIL=admin@example.com

# Gift Exchange Configuration
MIN_PRICE=20
MAX_PRICE=50
CURRENCY=USD
```

4. **Initialize configuration files**

Create a `config.json` file in the root directory:
```json
{
  "priceRange": {
    "min": 20,
    "max": 50,
    "currency": "USD"
  },
  "matchingDeadline": "2024-12-15",
  "giftExchangeDate": "2024-12-25"
}
```

## 🎮 Usage

1. **Start the development server**
```bash
npm run dev
# or
yarn dev
```

2. **Build for production**
```bash
npm run build
# or
yarn build
```

3. **Start production server**
```bash
npm start
# or
yarn start
```

The application will be available at `http://localhost:3000` (or your configured PORT)

## 👩‍💼 Admin Setup

1. On first run, an admin account will be automatically created using the credentials from your `.env` file
2. Login with your admin credentials at `/login`
3. Access the admin dashboard at `/admin`

## 👤 User Management

### Adding Users (Admin)
1. Navigate to the admin dashboard
2. Use the "Add New User" form
3. Provide username, email, and password

### User Actions
- Users can set gift preferences
- Mark themselves as ready for matching
- View their match once assigned

## 📧 Email Configuration

The application uses SMTP for sending emails. Make sure your SMTP settings in `.env` are correct.

Emails are sent for:
- Match notifications
- Password reset requests (if enabled)
- System notifications

## 🔒 Security Considerations

1. Always use HTTPS in production
2. Regularly update dependencies
3. Use strong passwords
4. Keep your `.env` file secure
5. Never commit sensitive files to version control

## 📁 Project Structure

```
secret-santa/
├── src/
│   ├── server/
│   │   └── index.js
│   ├── utils/
│   │   ├── userManager.js
│   │   ├── matching.js
│   │   └── emailService.js
│   ├── middleware/
│   │   └── auth.js
│   └── components/
│       └── giftPreferences.js
├── public/
│   └── css/
│       └── global.css
├── config.json
├── .env
└── package.json
```

## 🔧 Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check SMTP credentials
   - Verify port is not blocked
   - Check spam folders

2. **Matching not working**
   - Ensure at least 2 ready participants
   - Check for circular matching issues
   - Verify user ready status

3. **Login issues**
   - Clear cookies
   - Reset browser cache
   - Verify user credentials

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request



