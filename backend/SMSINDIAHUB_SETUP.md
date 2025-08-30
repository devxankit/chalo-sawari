# SMSIndia Hub Setup Guide

## 🚀 Getting Started with SMSIndia Hub

### Step 1: Create SMSIndia Hub Account
1. Go to [SMSIndia Hub](https://www.smsindiahub.in/)
2. Sign up for an account
3. Verify your email and phone number
4. Complete your profile verification

### Step 2: Get Your Credentials
1. Login to your SMSIndia Hub dashboard
2. Go to **API Settings** or **Profile** section
3. Copy your **API Key**
4. Copy your **Sender ID** (usually 6 characters, e.g., "CHALOS")

### Step 3: Update Your .env File
Add these variables to your `.env` file:

```env
# SMSIndia Hub Configuration
SMSINDIAHUB_API_KEY=your_actual_api_key_here
SMSINDIAHUB_SENDER_ID=your_sender_id_here
```

**Example:**
```env
SMSINDIAHUB_API_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
SMSINDIAHUB_SENDER_ID=CHALOS
```

### Step 4: Install Dependencies
Make sure you have axios installed (already added to package.json):
```bash
npm install axios
```

## 🔧 How It Works

### SMS Sending Process:
1. **Phone Number Normalization**: Automatically converts various phone number formats to 10-digit Indian mobile numbers
2. **API Call**: Sends SMS via SMSIndia Hub REST API
3. **Error Handling**: Comprehensive error handling for various scenarios
4. **Response Tracking**: Returns message ID for delivery tracking

### Supported Phone Number Formats:
- `9876543210` (10 digits)
- `+919876543210` (with country code)
- `919876543210` (with country code, no +)
- `09876543210` (with leading 0)

All formats are automatically normalized to `9876543210` for SMSIndia Hub.

## 📱 Testing Your Setup

### 1. Check Configuration
The system will automatically check if SMSIndia Hub is properly configured on startup.

### 2. Test OTP Sending
1. **Start your backend server**
2. **Try to send OTP** from your frontend
3. **Check backend console** for detailed logs
4. **If successful**: You'll see "SMS sent successfully via SMSIndia Hub" message
5. **If failed**: Check the error messages for specific issues

### 3. Monitor SMS Delivery
- Check your SMSIndia Hub dashboard for delivery reports
- Use the `getDeliveryStatus()` function to check individual message status
- Use the `getSMSBalance()` function to check your account balance

## 🚨 Common Issues & Solutions

### Issue: "SMSIndia Hub not configured"
**Solution**: Make sure both `SMSINDIAHUB_API_KEY` and `SMSINDIAHUB_SENDER_ID` are set in your `.env` file

### Issue: "Invalid phone number format"
**Solution**: The system automatically normalizes phone numbers, but ensure you're passing a valid Indian mobile number

### Issue: "Authentication failed"
**Solution**: Check your API key is correct and active in your SMSIndia Hub dashboard

### Issue: "Insufficient balance"
**Solution**: Add credits to your SMSIndia Hub account

### Issue: "Sender ID not approved"
**Solution**: Make sure your sender ID is approved by SMSIndia Hub (usually takes 24-48 hours)

## 💡 Pro Tips

1. **Keep your API key secure** - never commit `.env` to git
2. **Monitor your balance** - set up low balance alerts in SMSIndia Hub dashboard
3. **Test with your own number first** - ensure basic functionality works
4. **Check delivery reports** - monitor SMS delivery success rates
5. **Use appropriate sender ID** - make sure it's approved and recognizable

## 🔗 Useful Links

- [SMSIndia Hub Dashboard](https://www.smsindiahub.in/)
- [SMSIndia Hub API Documentation](https://www.smsindiahub.in/api-docs)
- [SMSIndia Hub Pricing](https://www.smsindiahub.in/pricing)

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Look at your backend console logs
3. Check SMSIndia Hub dashboard for error details
4. Contact SMSIndia Hub support if needed

## 🆚 Migration from Twilio

### What Changed:
- ✅ **Removed**: Twilio SDK dependency
- ✅ **Added**: SMSIndia Hub REST API integration
- ✅ **Improved**: Better phone number normalization
- ✅ **Enhanced**: More detailed error handling
- ✅ **Added**: Balance checking and delivery status tracking

### What Stayed the Same:
- ✅ **Same function signatures**: `sendOTP(phone, otp)` works exactly the same
- ✅ **Same response format**: Compatible with existing code
- ✅ **Same error handling**: Errors are thrown in the same way
- ✅ **Same logging**: Console logs provide similar information

---

**Remember**: SMSIndia Hub is optimized for Indian mobile numbers and provides better rates for domestic SMS. Your 10 trial messages should be sufficient for testing the basic functionality.
