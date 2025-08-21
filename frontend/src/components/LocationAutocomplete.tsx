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

  // Check if Google Maps service is ready
  useEffect(() => {
    const checkService = async () => {
      try {
        if (googleMapsService.isReady()) {
          setIsServiceReady(true);
          setError(null);
          return;
        } else {
          await googleMapsService.reinitialize();
          if (googleMapsService.isReady()) {
            setIsServiceReady(true);
            setError(null);
          } else {
            setError('Google Maps service not available');
          }
        }
      } catch (err) {
        console.error('LocationAutocomplete: Error checking service:', err);
        setError('Failed to initialize Google Maps service');
      }
    };

    checkService();
  }, []);

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

  // Handle location selection
  const handleLocationSelect = (location: LocationSuggestion) => {
    onChange(location.description);
    onLocationSelect(location);
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
      
      // Reverse geocode the coordinates to get address
      if (googleMapsService.isReady()) {
        const address = await reverseGeocode(latitude, longitude);
        if (address) {
          onChange(address);
          // Create a location object with coordinates for the current location
          const currentLocation = {
            place_id: 'current_location',
            description: address,
            structured_formatting: {
              main_text: 'Current Location',
              secondary_text: address
            },
            // Add actual coordinates for distance calculation
            lat: latitude,
            lng: longitude
          };
          onLocationSelect(currentLocation);
        }
      } else {
        setError('Google Maps service not ready');
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

  // Reverse geocode coordinates to address
  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return null;
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
