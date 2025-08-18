# Chalo Sawari Backend API

A comprehensive backend API for the Chalo Sawari multi-modal transportation booking platform. Built with Node.js, Express.js, and MongoDB.

## 🚀 Features

- **Multi-User Authentication**: User, Driver, and Admin roles with JWT tokens
- **Real-time Communication**: SMS and Email notifications via Twilio and Nodemailer
- **Secure Payment Processing**: Integration with Stripe and Razorpay
- **File Management**: Cloudinary integration for document and image uploads
- **Role-based Access Control**: Granular permissions for different user types
- **Comprehensive API**: Complete CRUD operations for all entities
- **Real-time Updates**: WebSocket support for live tracking and notifications

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **File Uploads**: Multer + Cloudinary
- **SMS**: Twilio
- **Email**: Nodemailer
- **Payments**: Stripe + Razorpay
- **Real-time**: Socket.io
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB 5+ running locally or MongoDB Atlas account
- Twilio account (for SMS)
- Gmail or other SMTP provider (for emails)
- Cloudinary account (for file uploads)
- Stripe account (for payments)
- Razorpay account (for payments)

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy the environment file and configure your variables:

```bash
cp env.example .env
```

Edit `.env` with your actual values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/chalo_sawari

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Payment Gateway Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 3. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### 4. Health Check

Visit `http://localhost:5000/health` to verify the server is running.

## 📁 Project Structure

```
backend/
├── config/                 # Configuration files
│   └── db.js              # MongoDB connection
├── controllers/            # Route controllers
│   ├── authController.js   # Authentication logic
│   ├── userController.js   # User management
│   ├── driverController.js # Driver management
│   ├── adminController.js  # Admin operations
│   ├── vehicleController.js # Vehicle management
│   ├── bookingController.js # Booking operations
│   ├── paymentController.js # Payment processing
│   └── supportController.js # Support tickets
├── middleware/             # Custom middleware
│   ├── auth.js            # Authentication middleware
│   ├── validate.js        # Request validation
│   ├── errorHandler.js    # Error handling
│   └── notFound.js        # 404 handling
├── models/                 # Mongoose models
│   ├── User.js            # User schema
│   ├── Driver.js          # Driver schema
│   ├── Admin.js           # Admin schema
│   ├── Vehicle.js         # Vehicle schema
│   └── Booking.js         # Booking schema
├── routes/                 # API routes
│   ├── auth.js            # Authentication routes
│   ├── user.js            # User routes
│   ├── driver.js          # Driver routes
│   ├── admin.js           # Admin routes
│   ├── vehicle.js         # Vehicle routes
│   ├── booking.js         # Booking routes
│   ├── payment.js         # Payment routes
│   └── support.js         # Support routes
├── utils/                  # Utility functions
│   ├── notifications.js   # SMS/Email utilities
│   ├── payments.js        # Payment utilities
│   └── uploads.js         # File upload utilities
├── server.js              # Main server file
├── package.json           # Dependencies
└── README.md              # This file
```

## 🔐 Authentication & Authorization

### User Roles

1. **User (Customer)**
   - Book rides
   - View booking history
   - Rate drivers
   - Manage profile

2. **Driver**
   - Accept/reject bookings
   - Update trip status
   - Manage vehicle details
   - View earnings

3. **Admin**
   - Manage all users and drivers
   - Monitor bookings and payments
   - System configuration
   - Analytics and reporting

### JWT Token Structure

```json
{
  "id": "user_id_here",
  "role": "user|driver|admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## 📡 API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | User registration | Public |
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/verify-otp` | Verify OTP | Public |
| POST | `/api/auth/driver/register` | Driver registration | Public |
| POST | `/api/auth/driver/login` | Driver login | Public |
| POST | `/api/auth/admin/login` | Admin login | Public |
| POST | `/api/auth/logout` | Logout | Private |
| GET | `/api/auth/me` | Get current user | Private |

### User Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/user/profile` | Get user profile | Private |
| PUT | `/api/user/profile` | Update user profile | Private |
| GET | `/api/user/bookings` | Get user bookings | Private |
| GET | `/api/user/wallet` | Get wallet balance | Private |

### Driver Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/driver/profile` | Get driver profile | Private |
| PUT | `/api/driver/profile` | Update driver profile | Private |
| GET | `/api/driver/requests` | Get booking requests | Private |
| PUT | `/api/driver/requests/:id` | Accept/reject request | Private |
| PUT | `/api/driver/location` | Update location | Private |
| GET | `/api/driver/earnings` | Get earnings | Private |

### Admin Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/admin/dashboard` | Admin dashboard | Private |
| GET | `/api/admin/users` | Get all users | Private |
| GET | `/api/admin/drivers` | Get all drivers | Private |
| PUT | `/api/admin/drivers/:id/verify` | Verify driver | Private |
| GET | `/api/admin/bookings` | Get all bookings | Private |
| GET | `/api/admin/analytics` | Get analytics | Private |

### Vehicle Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/vehicle/search` | Search vehicles | Public |
| GET | `/api/vehicle/:id` | Get vehicle details | Public |
| POST | `/api/vehicle` | Add vehicle | Private (Driver) |
| PUT | `/api/vehicle/:id` | Update vehicle | Private (Driver) |

### Booking Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/booking` | Create booking | Private |
| GET | `/api/booking/:id` | Get booking details | Private |
| PUT | `/api/booking/:id/status` | Update status | Private |
| POST | `/api/booking/:id/cancel` | Cancel booking | Private |

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds
- **Rate Limiting**: Configurable request limits per IP
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configurable cross-origin policies
- **Helmet Security**: HTTP security headers
- **Account Locking**: Temporary lock after failed attempts
- **OTP Verification**: Two-factor authentication

## 📱 Notification System

### SMS Notifications (Twilio)
- OTP verification
- Booking confirmations
- Trip status updates
- Payment confirmations

### Email Notifications (Nodemailer)
- Welcome emails
- Booking confirmations
- Password reset links
- Account verification

## 💳 Payment Integration

### Supported Gateways
- **Stripe**: Credit/Debit cards, UPI
- **Razorpay**: UPI, Net Banking, Wallets
- **Wallet**: In-app wallet system

### Payment Flow
1. User selects payment method
2. Payment gateway processes transaction
3. Webhook confirms payment status
4. Booking is confirmed
5. Driver is notified

## 🗄️ Database Models

### User Model
- Personal information
- Contact details
- Preferences
- Wallet and transactions
- Booking history

### Driver Model
- Personal and vehicle information
- Documents and verification status
- Current location and availability
- Earnings and commission

### Vehicle Model
- Vehicle specifications
- Pricing and availability
- Documents and maintenance
- Operating area and schedule

### Booking Model
- Trip details and pricing
- Passenger information
- Status tracking
- Communication logs
- Ratings and reviews

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables

Ensure all production environment variables are set:
- Database connection strings
- API keys and secrets
- Payment gateway credentials
- Notification service credentials

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Test Coverage

```bash
npm run test:coverage
```

## 📊 Monitoring & Logging

- **Request Logging**: Morgan middleware
- **Error Logging**: Comprehensive error handling
- **Performance Monitoring**: Response time tracking
- **Health Checks**: System status endpoints

## 🔧 Development

### Code Style

- ESLint configuration
- Prettier formatting
- Consistent naming conventions
- JSDoc documentation

### Git Hooks

- Pre-commit linting
- Pre-push testing
- Commit message validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Email: support@chalosawari.com
- Phone: +91 9171838260
- Documentation: `/api/docs`

## 🔄 Changelog

### v1.0.0
- Initial release
- Complete authentication system
- User, Driver, and Admin management
- Vehicle and booking management
- Payment integration
- Notification system

---

**Built with ❤️ by the Chalo Sawari Team**
