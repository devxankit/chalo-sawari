import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, MapPin, Loader2, Navigation } from 'lucide-react';
import { googleMapsService, LocationSuggestion } from '@/services/googleMapsService';
import { cn } from '@/lib/utils';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (location: LocationSuggestion) => void;
  placeholder: string;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  showGetLocation?: boolean; // New prop to show/hide get location button
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  onLocationSelect,
  placeholder,
  icon = <Search className="w-4 h-4" />,
  className,
  disabled = false,
  showGetLocation = false
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isServiceReady, setIsServiceReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Check if Google Maps service is ready with retry mechanism
  useEffect(() => {
    const checkService = async () => {
      let retryCount = 0;
      const maxRetries = 5;
      const retryDelay = 1000; // 1 second

      const attemptInitialization = async (): Promise<void> => {
        try {
          if (googleMapsService.isReady()) {
            setIsServiceReady(true);
            setError(null);
            return;
          } else {
            // Try to initialize if not already initialized
            await googleMapsService.initialize();
            if (googleMapsService.isReady()) {
              setIsServiceReady(true);
              setError(null);
              return;
            } else {
              throw new Error('Service not ready after initialization');
            }
          }
        } catch (err) {
          console.error(`LocationAutocomplete: Attempt ${retryCount + 1} failed:`, err);
          retryCount++;
          
          if (retryCount < maxRetries) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return attemptInitialization();
          } else {
            setError('Google Maps service not available');
          }
        }
      };

      attemptInitialization();
    };

    checkService();
  }, []);

  // Periodic check to clear error when service becomes available
  useEffect(() => {
    if (error && !isServiceReady) {
      const interval = setInterval(() => {
        if (googleMapsService.isReady()) {
          setIsServiceReady(true);
          setError(null);
          clearInterval(interval);
        }
      }, 2000); // Check every 2 seconds

      return () => clearInterval(interval);
    }
  }, [error, isServiceReady]);

  // Debounced search function
  const searchLocations = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!isServiceReady) {
      setError('Google Maps service not ready');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const results = await googleMapsService.getLocationSuggestions(searchTerm);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('LocationAutocomplete: Error searching locations:', error);
      setError('Failed to search locations');
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, [isServiceReady]);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      searchLocations(newValue);
    }, 300);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleLocationSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle location selection with enhanced details
  const handleLocationSelect = async (location: LocationSuggestion) => {
    try {
      // Get detailed place information including address components
      const placeDetails = await googleMapsService.getPlaceDetails(location.place_id);
      
      if (placeDetails && placeDetails.detailedAddress) {
        const { detailedAddress } = placeDetails;
        
        // Create a more detailed display address that prioritizes village information
        let displayAddress = location.description;
        
        // If we have village/sublocality information, create a more detailed address
        if (detailedAddress.sublocality) {
          const addressParts = [];
          if (detailedAddress.sublocality) addressParts.push(detailedAddress.sublocality);
          if (detailedAddress.locality) addressParts.push(detailedAddress.locality);
          if (detailedAddress.administrative_area_level_2) addressParts.push(detailedAddress.administrative_area_level_2);
          if (detailedAddress.administrative_area_level_1) addressParts.push(detailedAddress.administrative_area_level_1);
          
          displayAddress = addressParts.join(', ');
        }
        
        // Update the location object with detailed information
        const enhancedLocation = {
          ...location,
          description: displayAddress,
          structured_formatting: {
            main_text: detailedAddress.sublocality || detailedAddress.locality || location.structured_formatting.main_text,
            secondary_text: displayAddress
          },
          detailedAddress: detailedAddress,
          // Add coordinates if available
          ...(placeDetails.geometry?.location && {
            lat: placeDetails.geometry.location.lat(),
            lng: placeDetails.geometry.location.lng()
          })
        };
        
        onChange(displayAddress);
        onLocationSelect(enhancedLocation);
      } else {
        // Fallback to original behavior if detailed info is not available
        onChange(location.description);
        onLocationSelect(location);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      // Fallback to original behavior
      onChange(location.description);
      onLocationSelect(location);
    }
    
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus input when suggestions are shown
  useEffect(() => {
    if (showSuggestions && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showSuggestions]);

  // Get current location function
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocode the coordinates to get detailed address
      console.log('Starting reverse geocoding for current location...');
      const geocodeResult = await reverseGeocode(latitude, longitude);
      console.log('Reverse geocoding result:', geocodeResult);
      
      if (geocodeResult) {
        const { formattedAddress, detailedAddress } = geocodeResult;
        
        // Create a comprehensive address string that includes village information
        let displayAddress = formattedAddress;
        
        // If we have village/sublocality information, prioritize it in the display
        if (detailedAddress.sublocality) {
          // Create a more detailed address starting with village
          const addressParts = [];
          if (detailedAddress.sublocality) addressParts.push(detailedAddress.sublocality);
          if (detailedAddress.locality) addressParts.push(detailedAddress.locality);
          if (detailedAddress.administrative_area_level_2) addressParts.push(detailedAddress.administrative_area_level_2);
          if (detailedAddress.administrative_area_level_1) addressParts.push(detailedAddress.administrative_area_level_1);
          
          displayAddress = addressParts.join(', ');
        }
        
        console.log('Final display address:', displayAddress);
        onChange(displayAddress);
        
        // Create a location object with coordinates and detailed information
        const currentLocation = {
          place_id: 'current_location',
          description: displayAddress,
          structured_formatting: {
            main_text: detailedAddress.sublocality || detailedAddress.locality || 'Current Location',
            secondary_text: displayAddress
          },
          // Add actual coordinates for distance calculation
          lat: latitude,
          lng: longitude,
          // Add detailed address information
          detailedAddress: detailedAddress
        };
        
        console.log('Current location object:', currentLocation);
        onLocationSelect(currentLocation);
      } else {
        console.error('Reverse geocoding returned null');
        setError('Unable to get address for current location. Please try again.');
      }
    } catch (error: any) {
      console.error('Error getting location:', error);
      if (error.code === 1) {
        setError('Location access denied. Please allow location access.');
      } else if (error.code === 2) {
        setError('Location unavailable. Please try again.');
      } else if (error.code === 3) {
        setError('Location request timed out. Please try again.');
      } else {
        setError('Failed to get current location. Please try again.');
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Reverse geocode coordinates to address with detailed components
  const reverseGeocode = async (lat: number, lng: number): Promise<{ formattedAddress: string; detailedAddress: any } | null> => {
    try {
      console.log('Starting reverse geocoding for coordinates:', lat, lng);
      
      // Try multiple geocoding strategies for better results
      const strategies = [
        // Strategy 1: Try with specific result types for detailed addresses
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&result_type=street_address|route|premise|subpremise|neighborhood|sublocality|locality|administrative_area_level_1|administrative_area_level_2|country`,
        // Strategy 2: Try without result_type restriction for broader results
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`,
        // Strategy 3: Try with English language for English results
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&language=en&region=IN`
      ];

      let bestResult = null;
      let bestAddress = null;

      for (let i = 0; i < strategies.length; i++) {
        try {
          console.log(`Trying strategy ${i + 1}...`);
          const response = await fetch(strategies[i]);
          const data = await response.json();
          
          console.log(`Strategy ${i + 1} response:`, data.status, data.results?.length || 0);
          
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            // Look for the best result that includes village/sublocality information
            for (const result of data.results) {
              const addressComponents = result.address_components || [];
              const hasVillage = addressComponents.some(comp => 
                comp.types.includes('sublocality') || 
                comp.types.includes('neighborhood') ||
                comp.types.includes('locality')
              );
              
              if (hasVillage || !bestResult) {
                bestResult = result;
                bestAddress = result.formatted_address;
                console.log('Found good result:', result.formatted_address);
                break;
              }
            }
            
            // If we found a good result with village info, break early
            if (bestResult && bestResult.address_components?.some(comp => 
              comp.types.includes('sublocality') || 
              comp.types.includes('neighborhood')
            )) {
              break;
            }
          }
        } catch (error) {
          console.error(`Strategy ${i + 1} failed:`, error);
        }
      }

      if (bestResult) {
        const formattedAddress = bestResult.formatted_address;
        const addressComponents = bestResult.address_components || [];
        
        // Extract detailed address components
        const detailedAddress = {
          street_number: '',
          route: '',
          sublocality: '', // Village/Neighborhood
          locality: '', // City
          administrative_area_level_2: '', // District
          administrative_area_level_1: '', // State
          country: '',
          postal_code: '',
          formatted_address: formattedAddress
        };

        // Map address components to our structure
        addressComponents.forEach((component: any) => {
          const types = component.types;
          if (types.includes('street_number')) {
            detailedAddress.street_number = component.long_name;
          } else if (types.includes('route')) {
            detailedAddress.route = component.long_name;
          } else if (types.includes('sublocality') || types.includes('neighborhood')) {
            detailedAddress.sublocality = component.long_name;
          } else if (types.includes('locality')) {
            detailedAddress.locality = component.long_name;
          } else if (types.includes('administrative_area_level_2')) {
            detailedAddress.administrative_area_level_2 = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            detailedAddress.administrative_area_level_1 = component.long_name;
          } else if (types.includes('country')) {
            detailedAddress.country = component.long_name;
          } else if (types.includes('postal_code')) {
            detailedAddress.postal_code = component.long_name;
          }
        });

        console.log('Final reverse geocoding result:', { formattedAddress, detailedAddress });
        return { formattedAddress, detailedAddress };
      } else {
        console.error('All reverse geocoding strategies failed');
        return null;
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center z-10 transition-all duration-300 group-hover:bg-blue-200 group-hover:scale-110">
          {icon}
        </div>
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className={cn(
            "pl-12 h-14 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-base hover:border-blue-300 hover:shadow-md",
            showGetLocation ? "pr-20" : "pr-4", // Add right padding when GPS button is shown
            className
          )}
          disabled={disabled}
        />
        
        {/* GPS Button for getting current location */}
        {showGetLocation && (
          <button
            onClick={getCurrentLocation}
            disabled={isGettingLocation || disabled}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:scale-100 disabled:cursor-not-allowed"
            title="Get current location"
          >
            {isGettingLocation ? (
              <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 text-green-600" />
            )}
          </button>
        )}
        
        {/* Loading spinner (only show when not getting location) */}
        {isLoading && !isGettingLocation && (
          <div className={cn(
            "absolute top-1/2 transform -translate-y-1/2",
            showGetLocation ? "right-24" : "right-4" // Position based on GPS button
          )}>
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 z-50 max-h-60 overflow-y-auto shadow-2xl border-0 bg-white rounded-xl scrollbar-hide"
        >
          <div className="p-2">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.place_id}
                className={cn(
                  "flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-blue-50",
                  selectedIndex === index && "bg-blue-100 border-l-4 border-blue-500"
                )}
                onClick={() => handleLocationSelect(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex-shrink-0 mt-1">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.structured_formatting.main_text}
                  </div>
                  {suggestion.structured_formatting.secondary_text && (
                    <div className="text-sm text-gray-500 truncate">
                      {suggestion.structured_formatting.secondary_text}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* No API Key Warning */}
      {!isServiceReady && !error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-yellow-600" />
            <span>
              Initializing Google Maps service... Please wait.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
