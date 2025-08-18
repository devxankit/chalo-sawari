# Google Maps API Setup Guide

This guide will help you set up Google Maps API integration for the location autocomplete functionality in the booking form.

## Prerequisites

1. A Google Cloud Platform account
2. A billing account (Google Maps API requires billing to be enabled)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for your project

## Step 2: Enable Required APIs

In your Google Cloud Console, navigate to **APIs & Services** > **Library** and enable these APIs:

1. **Places API** - For location autocomplete and place details
2. **Maps JavaScript API** - For the base Google Maps functionality  
3. **Geocoding API** - For converting coordinates to addresses (current location feature)

### How to Enable APIs:
1. Go to [Google Cloud Console APIs](https://console.cloud.google.com/apis/library)
2. Search for each API name
3. Click on the API
4. Click **Enable**
5. Repeat for all three APIs

## Step 3: Create API Credentials

1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key
4. (Optional) Restrict the API key to specific APIs and websites for security

## Step 4: Configure Environment Variables

1. Create a `.env` file in your `frontend` directory
2. Add your API key:

```bash
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

## Step 5: API Key Restrictions (Recommended)

For security, restrict your API key:

1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your API key
3. Under "Application restrictions", select "HTTP referrers (websites)"
4. Add your domain(s):
   - `http://localhost:3000/*` (for development)
   - `https://yourdomain.com/*` (for production)
5. Under "API restrictions", select "Restrict key"
6. Select only the APIs you need (Places API, Geocoding API, Maps JavaScript API)

## Step 6: Test the Integration

1. Start your development server
2. Go to the home page
3. Try typing in the "From" or "To" location fields
4. You should see location suggestions appear

## Troubleshooting

### "Google Maps API not configured" warning
- Check that your `.env` file exists and contains the correct API key
- Ensure the environment variable name is exactly `VITE_GOOGLE_MAPS_API_KEY`
- Restart your development server after adding the environment variable

### No location suggestions appearing
- Verify that Places API is enabled in your Google Cloud project
- Check the browser console for any error messages
- Ensure your API key has the necessary permissions
- Check if you've hit API usage limits

### API key restrictions too strict
- Temporarily remove restrictions to test
- Add restrictions gradually, testing after each change
- Ensure your domain is correctly added to the allowed referrers

## Cost Considerations

- Google Maps API has a generous free tier
- Free tier includes:
  - 28,500 free calls per month for Places API
  - 40,000 free calls per month for Geocoding API
- Monitor your usage in the [Google Cloud Console](https://console.cloud.google.com/billing)

## Security Best Practices

1. **Never commit your API key to version control**
2. **Use environment variables** for all API keys
3. **Restrict API keys** to specific domains and APIs
4. **Monitor API usage** regularly
5. **Set up billing alerts** to avoid unexpected charges

## Support

If you encounter issues:
1. Check the [Google Maps API documentation](https://developers.google.com/maps/documentation)
2. Review your Google Cloud Console for error messages
3. Check the browser console for JavaScript errors
4. Verify your API key and restrictions are correct

## Features

This integration provides:

1. **Location Autocomplete** - As users type, they get suggestions from Google Places API
2. **Current Location Detection** - Users can click the GPS icon to automatically fill their current location
3. **Place Details** - Get detailed information about selected locations
4. **Country Restriction** - Results are limited to India for better relevance
5. **Debounced Search** - Efficient API calls with 300ms delay

### Current Location Feature

The "From" location field includes a GPS button (📍) that:
- Uses the browser's Geolocation API to get user coordinates
- Reverse geocodes coordinates to get the full address
- Automatically fills the "From" field with the current location
- Shows loading state while getting location
- Handles various error cases (permission denied, timeout, etc.)
