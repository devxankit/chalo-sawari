# Twilio Trial Account Setup Guide

## 🚀 Getting Started with Twilio Trial Account

### Step 1: Create Twilio Account
1. Go to [Twilio Console](https://console.twilio.com/)
2. Click "Sign up for free"
3. Fill in your details and verify your email
4. Verify your phone number (this will be the number you can send SMS TO)

### Step 2: Get Your Free Phone Number
1. In your Twilio Console, go to **Phone Numbers** → **Manage** → **Active numbers**
2. Click **Get a trial number**
3. Choose a number (you get one free with trial account)
4. Copy the phone number (it will look like `+15551234567`)

### Step 3: Get Your Credentials
1. In Twilio Console, go to **Settings** → **General** → **API Keys**
2. Copy your **Account SID** (starts with `AC`)
3. Copy your **Auth Token**

### Step 4: Update Your .env File
```env
# Replace these values in your .env file
TWILIO_ACCOUNT_SID=ACyour_actual_account_sid_here
TWILIO_AUTH_TOKEN=your_actual_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567  # Your Twilio-provided number
```

### Step 5: Verify Phone Numbers (REQUIRED for Trial)
**Important**: With a trial account, you can ONLY send SMS to **verified phone numbers**.

#### Option A: Verify Numbers in Twilio Console
1. Go to **Phone Numbers** → **Manage** → **Verified Caller IDs**
2. Click **Add a new Caller ID**
3. Enter the phone number you want to send SMS to
4. Twilio will send a verification code
5. Enter the code to verify

#### Option B: Add Numbers to Code (Development Only)
In `backend/utils/notifications.js`, update the `verifiedNumbers` array:
```javascript
const verifiedNumbers = [
  '+919755620716',  // Your verified number
  '+919876543210',  // Add more verified numbers
  // Add all numbers you want to send SMS to
];
```

## 🔧 How It Works

### For Development/Testing:
- The system will check if a phone number is verified
- If not verified, it will simulate SMS sending (returns success without actually sending)
- This allows you to test your app without hitting Twilio limits

### For Production:
- All phone numbers must be verified in Twilio console
- Or upgrade to a paid Twilio account (removes verification requirement)

## 📱 Testing Your Setup

1. **Start your backend server**
2. **Try to send OTP** from your frontend
3. **Check backend console** for detailed logs
4. **If successful**: You'll see "SMS sent successfully" message
5. **If failed**: Check the error messages for specific issues

## 🚨 Common Issues & Solutions

### Issue: "From phone number not valid"
**Solution**: Make sure `TWILIO_PHONE_NUMBER` in your `.env` is exactly the number Twilio gave you

### Issue: "Phone number not verified"
**Solution**: Add the number to `verifiedNumbers` array or verify it in Twilio console

### Issue: "Account SID must start with AC"
**Solution**: Make sure you copied the Account SID correctly (it starts with "AC")

### Issue: "Authentication failed"
**Solution**: Check your `TWILIO_AUTH_TOKEN` is correct

## 💡 Pro Tips

1. **Keep your credentials secure** - never commit `.env` to git
2. **Use environment variables** - don't hardcode credentials
3. **Test with verified numbers first** - ensure basic functionality works
4. **Monitor your Twilio console** - check for errors and usage
5. **Upgrade when ready** - paid accounts remove trial limitations

## 🔗 Useful Links

- [Twilio Console](https://console.twilio.com/)
- [Twilio Trial Account Guide](https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account)
- [Twilio SMS API Documentation](https://www.twilio.com/docs/sms/api)
- [Twilio Verify Service](https://www.twilio.com/docs/verify)

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Look at your backend console logs
3. Check Twilio console for error details
4. Refer to Twilio documentation
5. Contact Twilio support if needed

---

**Remember**: Trial accounts are perfect for development and testing. When you're ready for production, consider upgrading to a paid account for full functionality.
