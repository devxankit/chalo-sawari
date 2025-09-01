import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';
import LocationAutocomplete from './LocationAutocomplete';

interface LocationData {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  lat?: number;
  lng?: number;
  detailedAddress?: any;
}

const LocationTest: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [testStatus, setTestStatus] = useState<string>('');

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
    console.log('Selected Location Details:', location);
  };

  const handleCurrentLocation = (location: LocationData) => {
    setCurrentLocation(location);
    console.log('Current Location Details:', location);
  };

  // Manual test function for current location
  const testCurrentLocation = async () => {
    setTestStatus('Testing current location...');
    
    if (!navigator.geolocation) {
      setTestStatus('Geolocation not supported');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      setTestStatus(`Coordinates: ${latitude}, ${longitude}`);
      
      // Test reverse geocoding
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          setTestStatus(`Address: ${data.results[0].formatted_address}`);
        } else {
          setTestStatus(`Geocoding failed: ${data.status} - ${data.error_message || 'Unknown error'}`);
        }
      } catch (error) {
        setTestStatus(`Geocoding error: ${error}`);
      }
    } catch (error: any) {
      setTestStatus(`Location error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Enhanced Location Test
        </h1>
        <p className="text-gray-600">
          Test the enhanced Google Maps integration with village name extraction
        </p>
      </div>

      {/* API Key Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            API Status Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>API Key:</strong> {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? '✅ Configured' : '❌ Not configured'}</p>
            <p><strong>Geolocation:</strong> {navigator.geolocation ? '✅ Supported' : '❌ Not supported'}</p>
            <Button onClick={testCurrentLocation} className="mt-2">
              Test Current Location
            </Button>
            {testStatus && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                {testStatus}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Selection Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Location Selection Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Type a location to see enhanced address details including village names:
            </p>
            
            <LocationAutocomplete
              value=""
              onChange={() => {}}
              onLocationSelect={handleLocationSelect}
              placeholder="Search for a location..."
              showGetLocation={false}
            />

            {selectedLocation && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Selected Location:</h4>
                <p className="text-blue-800 mb-2">{selectedLocation.description}</p>
                
                {selectedLocation.detailedAddress && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-blue-900">Address Components:</h5>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {selectedLocation.detailedAddress.sublocality && (
                        <div>
                          <Badge variant="secondary" className="text-xs">Village</Badge>
                          <p className="text-blue-800">{selectedLocation.detailedAddress.sublocality}</p>
                        </div>
                      )}
                      {selectedLocation.detailedAddress.locality && (
                        <div>
                          <Badge variant="secondary" className="text-xs">City</Badge>
                          <p className="text-blue-800">{selectedLocation.detailedAddress.locality}</p>
                        </div>
                      )}
                      {selectedLocation.detailedAddress.administrative_area_level_2 && (
                        <div>
                          <Badge variant="secondary" className="text-xs">District</Badge>
                          <p className="text-blue-800">{selectedLocation.detailedAddress.administrative_area_level_2}</p>
                        </div>
                      )}
                      {selectedLocation.detailedAddress.administrative_area_level_1 && (
                        <div>
                          <Badge variant="secondary" className="text-xs">State</Badge>
                          <p className="text-blue-800">{selectedLocation.detailedAddress.administrative_area_level_1}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {selectedLocation.lat && selectedLocation.lng && (
                  <div className="mt-2 text-sm text-blue-700">
                    <strong>Coordinates:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Location Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-green-600" />
              Current Location Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Click the GPS button to get your current location with detailed address:
            </p>
            
            <LocationAutocomplete
              value=""
              onChange={() => {}}
              onLocationSelect={handleCurrentLocation}
              placeholder="Click GPS button for current location"
              showGetLocation={true}
            />

            {currentLocation && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Current Location:</h4>
                <p className="text-green-800 mb-2">{currentLocation.description}</p>
                
                {currentLocation.detailedAddress && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-green-900">Address Components:</h5>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {currentLocation.detailedAddress.sublocality && (
                        <div>
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Village</Badge>
                          <p className="text-green-800">{currentLocation.detailedAddress.sublocality}</p>
                        </div>
                      )}
                      {currentLocation.detailedAddress.locality && (
                        <div>
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">City</Badge>
                          <p className="text-green-800">{currentLocation.detailedAddress.locality}</p>
                        </div>
                      )}
                      {currentLocation.detailedAddress.administrative_area_level_2 && (
                        <div>
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">District</Badge>
                          <p className="text-green-800">{currentLocation.detailedAddress.administrative_area_level_2}</p>
                        </div>
                      )}
                      {currentLocation.detailedAddress.administrative_area_level_1 && (
                        <div>
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">State</Badge>
                          <p className="text-green-800">{currentLocation.detailedAddress.administrative_area_level_1}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {currentLocation.lat && currentLocation.lng && (
                  <div className="mt-2 text-sm text-green-700">
                    <strong>Coordinates:</strong> {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Village Name Extraction</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Extracts village/neighborhood names from address components</li>
                <li>• Prioritizes village names in the display</li>
                <li>• Shows comprehensive address hierarchy</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Enhanced Reverse Geocoding</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Uses result type filtering for better accuracy</li>
                <li>• Extracts detailed address components</li>
                <li>• Provides structured address data</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Current Location Enhancement</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• GPS button for automatic location detection</li>
                <li>• Detailed address with village information</li>
                <li>• Precise coordinate extraction</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Location Selection Enhancement</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Enhanced place details with address components</li>
                <li>• Village name prioritization in display</li>
                <li>• Comprehensive location object with coordinates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationTest;
