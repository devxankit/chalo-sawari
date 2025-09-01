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

## Enhanced Location Features

### Current Location Detection with Village Information

The enhanced location system now provides:

1. **Detailed Address Components** - Extracts village names, neighborhoods, cities, districts, and states
2. **Village Name Prioritization** - When available, village names are displayed prominently in the address
3. **Comprehensive Address Format** - Shows addresses in the format: Village, City, District, State
4. **GPS Icon Integration** - Users can click the GPS icon (📍) to automatically fill their current location with detailed address information

### Address Component Extraction

The system extracts the following address components:

- **Street Number** - Building/house number
- **Route** - Street name
- **Sublocality** - Village/Neighborhood name (prioritized in display)
- **Locality** - City name
- **Administrative Area Level 2** - District name
- **Administrative Area Level 1** - State name
- **Country** - Country name
- **Postal Code** - PIN code

### Location Selection Enhancement

When users select a location from autocomplete suggestions:

1. **Detailed Place Information** - Gets comprehensive address components
2. **Village Name Display** - Prioritizes village/neighborhood names when available
3. **Enhanced Location Object** - Includes detailed address information for better location accuracy
4. **Coordinate Extraction** - Provides precise latitude and longitude coordinates

### Reverse Geocoding Enhancement

The current location feature now uses enhanced reverse geocoding:

1. **Result Type Filtering** - Requests specific address types for better accuracy
2. **Village Detection** - Specifically looks for sublocality and neighborhood information
3. **Structured Address** - Creates well-formatted addresses starting with village names
4. **Fallback Handling** - Gracefully handles cases where detailed information is not available

## Usage Examples

### Current Location with Village Information

When a user clicks the GPS icon, the system will:

1. Get current coordinates using browser geolocation
2. Reverse geocode to get detailed address components
3. Display address starting with village name if available
4. Example output: "Village Name, City Name, District Name, State Name"

### Location Selection with Enhanced Details

When a user selects a location from autocomplete:

1. Get detailed place information from Google Places API
2. Extract address components including village information
3. Create enhanced location object with detailed address
4. Provide coordinates for distance calculations

## Technical Implementation

### Enhanced Reverse Geocoding

```typescript
// Enhanced reverse geocoding with detailed address components
const reverseGeocode = async (lat: number, lng: number) => {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}&result_type=street_address|route|premise|subpremise|neighborhood|sublocality|locality|administrative_area_level_1|administrative_area_level_2|country`
  );
  // Process detailed address components
  // Extract village, city, district, state information
  // Return structured address data
};
```

### Enhanced Place Details

```typescript
// Get detailed place information including address components
const placeDetails = await googleMapsService.getPlaceDetails(placeId);
// Extract detailed address components
// Create enhanced location object with village information
```

## Benefits

This integration provides:

1. **Location Autocomplete** - As users type, they get suggestions from Google Places API
2. **Current Location Detection** - Users can click the GPS icon to automatically fill their current location
3. **Village Name Extraction** - Properly displays village names when available
4. **Detailed Address Information** - Comprehensive address components for better location accuracy
5. **Place Details** - Get detailed information about selected locations
6. **Country Restriction** - Results are limited to India for better relevance
7. **Debounced Search** - Efficient API calls with 300ms delay

### Enhanced Current Location Feature

The "From" location field includes a GPS button (📍) that:

- Uses the browser's Geolocation API to get user coordinates
- Reverse geocodes coordinates to get detailed address including village names
- Automatically fills the "From" field with the current location
- Shows loading state while getting location
- Handles various error cases (permission denied, timeout, etc.)
- Prioritizes village names in the display when available

### Village Name Support

The system now properly handles:

- **Village Detection** - Identifies and extracts village names from address components
- **Village Prioritization** - Displays village names prominently in the address
- **Comprehensive Address Format** - Shows full address hierarchy: Village → City → District → State
- **Fallback Handling** - Gracefully handles cases where village information is not available
