# Razorpay Integration Guide for Chalo Sawari

This guide explains how to set up and use Razorpay payment gateway integration in the Chalo Sawari transportation booking platform.

## 🚀 Features

- **Secure Payment Processing**: Integrated with Razorpay's secure payment gateway
- **Multiple Payment Methods**: Support for UPI, Cards, Net Banking, Wallets, and EMI
- **Real-time Payment Verification**: Automatic payment verification and signature validation
- **Admin Payment Management**: Complete payment tracking and management in admin panel
- **Refund Processing**: Automated refund processing through Razorpay
- **Payment Analytics**: Comprehensive payment statistics and reporting

## 📋 Prerequisites

1. **Razorpay Account**: Sign up at [razorpay.com](https://razorpay.com)
2. **Test Credentials**: Get test API keys from Razorpay dashboard
3. **Node.js**: Version 18 or higher
4. **MongoDB**: Database for storing payment records
5. **Environment Variables**: Configure necessary environment variables

## 🔧 Setup Instructions

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install razorpay
```

#### Environment Configuration
Create a `.env` file in the backend directory:

```bash
# Copy the example file
cp env.example .env
```

Update the `.env` file with your Razorpay credentials:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_test_key_id_here
RAZORPAY_KEY_SECRET=your_test_secret_key_here

# For Production
# RAZORPAY_KEY_ID=rzp_live_your_live_key_id_here
# RAZORPAY_KEY_SECRET=your_live_secret_key_here
```

#### Database Schema
The Payment model has been updated to include Razorpay-specific fields:

```javascript
paymentDetails: {
  // Razorpay specific fields
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  
  // Other fields...
  gatewayResponse: mongoose.Schema.Types.Mixed
}
```

### 2. Frontend Setup

#### Environment Configuration
Create a `.env` file in the frontend directory:

```bash
# Copy the example file
cp env.example .env
```

Update the `.env` file:

```env
# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_your_test_key_id_here

# For Production
# VITE_RAZORPAY_KEY_ID=rzp_live_your_live_key_id_here
```

#### Install Dependencies
```bash
cd frontend
npm install
```

## 🏗️ Architecture

### Backend Components

1. **RazorpayService** (`backend/services/razorpayService.js`)
   - Order creation
   - Payment verification
   - Refund processing
   - Payment details retrieval

2. **Payment Controller** (`backend/controllers/paymentController.js`)
   - Create Razorpay orders
   - Verify payments
   - Process payment confirmations

3. **Admin Payment Controller** (`backend/controllers/adminPaymentController.js`)
   - Payment management
   - Statistics and analytics
   - Refund processing

4. **Payment Routes** (`backend/routes/payment.js`)
   - `/api/payment/create-order` - Create payment order
   - `/api/payment/verify` - Verify payment

5. **Admin Payment Routes** (`backend/routes/adminPayment.js`)
   - `/api/admin/payments` - Get all payments
   - `/api/admin/payments/stats` - Get payment statistics
   - `/api/admin/payments/:id/refund` - Process refunds

### Frontend Components

1. **RazorpayService** (`frontend/src/services/razorpayService.ts`)
   - Payment initialization
   - Order creation
   - Payment verification

2. **Checkout Component** (`frontend/src/components/Checkout.tsx`)
   - Payment method selection
   - Razorpay integration
   - Payment confirmation

3. **Admin Payment Management** (`frontend/src/admin/pages/AdminPaymentManagement.tsx`)
   - Payment overview
   - Transaction management
   - Analytics dashboard

## 💳 Payment Flow

### 1. Order Creation
```javascript
// Create Razorpay order
const order = await razorpayService.createOrder({
  amount: totalPrice,
  currency: 'INR',
  receipt: `booking_${bookingId}`,
  notes: {
    description: 'Vehicle booking payment',
    bookingId: bookingId
  }
});
```

### 2. Payment Initialization
```javascript
// Initialize payment
await razorpayService.processBookingPayment(
  {
    amount: totalPrice,
    bookingId: bookingId,
    description: 'Vehicle booking'
  },
  userData,
  onSuccess,
  onFailure,
  onClose
);
```

### 3. Payment Verification
```javascript
// Verify payment signature
const isSignatureValid = RazorpayService.verifyPaymentSignature(
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
);

if (isSignatureValid) {
  // Process payment confirmation
  // Update booking status
  // Send confirmation notifications
}
```

## 🔐 Security Features

1. **Signature Verification**: All payments are verified using Razorpay's signature verification
2. **Environment Variables**: Sensitive keys are stored in environment variables
3. **HTTPS**: Production deployments should use HTTPS
4. **Input Validation**: All payment data is validated before processing
5. **Error Handling**: Comprehensive error handling and logging

## 📊 Admin Features

### Payment Dashboard
- Total revenue and transaction counts
- Payment method distribution
- Success rate analytics
- Monthly growth tracking

### Transaction Management
- View all payments with filters
- Search by transaction ID, user, or booking
- Export payment data to CSV
- Process refunds

### Razorpay Integration
- View detailed Razorpay payment information
- Access to gateway responses
- Refund processing through Razorpay

## 🧪 Testing

### Test Cards
Use these test card numbers for testing:

- **Visa**: 4111 1111 1111 1111
- **Mastercard**: 5555 5555 5555 4444
- **RuPay**: 6073 8400 0000 0000

### Test UPI IDs
- `success@razorpay` - Successful payment
- `failure@razorpay` - Failed payment

### Test Mode
- Set `NODE_ENV=development` for test mode
- Use test API keys from Razorpay dashboard
- Test webhook endpoints

## 🚀 Production Deployment

### 1. Update Environment Variables
```env
NODE_ENV=production
RAZORPAY_KEY_ID=rzp_live_your_live_key_id
RAZORPAY_KEY_SECRET=your_live_secret_key
```

### 2. SSL Certificate
- Ensure HTTPS is enabled
- Valid SSL certificate required
- Update CORS settings for production domain

### 3. Webhook Configuration
- Set up webhook endpoints in Razorpay dashboard
- Configure webhook URLs for production
- Test webhook delivery

### 4. Monitoring
- Set up payment failure alerts
- Monitor transaction success rates
- Track payment processing times

## 📱 Mobile Responsiveness

The payment integration is fully responsive and works on:
- Desktop browsers
- Mobile browsers
- Progressive Web Apps (PWA)
- React Native (if integrated)

## 🔍 Troubleshooting

### Common Issues

1. **Payment Signature Verification Failed**
   - Check environment variables
   - Verify Razorpay keys
   - Ensure proper signature calculation

2. **Order Creation Failed**
   - Validate amount format (should be in paise)
   - Check API key permissions
   - Verify account status

3. **Payment Not Captured**
   - Check payment status in Razorpay dashboard
   - Verify webhook delivery
   - Check payment method restrictions

### Debug Mode
Enable debug logging:

```javascript
// In RazorpayService
console.log('Payment details:', paymentDetails);
console.log('Signature verification:', isSignatureValid);
```

## 📞 Support

### Razorpay Support
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Support](https://razorpay.com/support/)
- [API Reference](https://razorpay.com/docs/api/)

### Project Support
- Check project documentation
- Review error logs
- Contact development team

## 📈 Future Enhancements

1. **Subscription Payments**: Recurring payment support
2. **Split Payments**: Multiple payment method combinations
3. **International Payments**: Multi-currency support
4. **Advanced Analytics**: Machine learning insights
5. **Mobile SDK**: Native mobile app integration

## 📄 License

This integration is part of the Chalo Sawari project and follows the project's licensing terms.

---

**Note**: Always test thoroughly in development environment before deploying to production. Keep your API keys secure and never commit them to version control.
