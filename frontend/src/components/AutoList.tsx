import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Car, MapPin, Star, Users, Calendar } from 'lucide-react';
import VehicleApiService from '../services/vehicleApi';
import VehicleDetailsModal from './VehicleDetailsModal';
import Checkout from './Checkout';
import { calculateDistance, getPricingDisplay, formatPrice, LocationData } from '../lib/distanceUtils';
import { VehicleFilters } from './FilterSidebar';

interface Auto {
  _id: string;
  type: 'bus' | 'car' | 'auto';
  brand: string;
  fuelType: string;
  seatingCapacity: number;
  isAc: boolean;
  isSleeper: boolean;
  amenities: string[];
  images: Array<{
    url: string;
    caption?: string;
    isPrimary: boolean;
  }>;
  registrationNumber: string;
  operatingArea?: {
    cities: string[];
    states: string[];
    radius: number;
  };
  vehicleLocation?: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
    city?: string;
    state?: string;
    lastUpdated?: string;
  };
  schedule: {
    workingDays: string[];
    workingHours: {
      start: string;
      end: string;
    };
    breakTime?: {
      start: string;
      end: string;
    };
  };
  rating: number;
  totalTrips: number;
  totalEarnings: number;
  isActive: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  booked: boolean;
  isAvailable: boolean;
  bookingStatus: 'available' | 'booked' | 'in_trip' | 'maintenance' | 'offline';
  driver?: {
    _id: string;
    firstName: string;
    lastName: string;
    rating: number;
    phone: string;
  };
  pricing: {
    autoPrice: {
      oneWay: number;
      return: number;
    };
    distancePricing: {
      oneWay: {
        '50km': number;
        '100km': number;
        '150km': number;
        '200km': number;
        '250km': number;
        '300km': number;
      };
      return: {
        '50km': number;
        '100km': number;
        '150km': number;
        '200km': number;
        '250km': number;
        '300km': number;
      };
    };
    lastUpdated: string;
  };
  pricingReference: {
    category: string;
    vehicleType: string;
    vehicleModel: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface AutoListProps {
  searchParams?: {
    from?: string;
    to?: string;
    fromData?: LocationData;
    toData?: LocationData;
    pickupDate?: string;
    pickupTime?: string;
    serviceType?: string;
    returnDate?: string;
    passengers?: number;
  };
  filters?: VehicleFilters;
  onFiltersChange?: (filters: VehicleFilters) => void;
  onVehicleDataUpdate?: (vehicles: any[]) => void;
}

const AutoList: React.FC<AutoListProps> = ({ searchParams, filters, onFiltersChange, onVehicleDataUpdate }) => {
  const [autos, setAutos] = useState<Auto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAuto, setSelectedAuto] = useState<Auto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedAutoForCheckout, setSelectedAutoForCheckout] = useState<Auto | null>(null);
  
  // Ref to prevent multiple simultaneous fetches
  const isFetchingRef = useRef(false);
  
  // Ref to track if we've already fetched data for current params
  const hasFetchedRef = useRef(false);
  
  // Initialize vehicle API service with proper parameters
  const vehicleApi = new VehicleApiService(
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    () => ({}) // Empty headers for public access
  );

  // Create a stable reference for searchParams to prevent infinite re-renders
  const stableSearchParams = useMemo(() => {
    // Only include essential fields that should trigger a re-fetch
    const params = {
      from: searchParams?.from,
      to: searchParams?.to,
      fromData: searchParams?.fromData,
      pickupDate: searchParams?.pickupDate,
      returnDate: searchParams?.returnDate,
      serviceType: searchParams?.serviceType,
      passengers: searchParams?.passengers
    };
    
    // Only return params if we have meaningful data
    if (params.fromData && params.fromData.lat && params.fromData.lng) {
      return params;
    }
    return null;
  }, [
    searchParams?.from,
    searchParams?.to,
    searchParams?.fromData?.lat,
    searchParams?.fromData?.lng,
    searchParams?.pickupDate,
    searchParams?.returnDate,
    searchParams?.serviceType,
    searchParams?.passengers
  ]);

  // Debug: Log when stableSearchParams changes
  useEffect(() => {
    console.log('🔍 AutoList: stableSearchParams changed:', stableSearchParams);
    // Reset the fetch flag when params change
    hasFetchedRef.current = false;
  }, [stableSearchParams]);

  const fetchAutos = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log('🔍 Already fetching autos, skipping...');
      return;
    }
    
    // Check if we have the required data to make the API call
    if (!searchParams?.fromData?.lat || !searchParams?.fromData?.lng) {
      console.log('🔍 No location data available, skipping fetch');
      return;
    }
    
    isFetchingRef.current = true;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Starting to fetch autos...');
      console.log('🔍 API Base URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api');
      console.log('🔍 Search params:', searchParams);
      
      // Extract dates and location from searchParams
      const { pickupDate, returnDate, serviceType, fromData } = searchParams;
      console.log('🔍 Pickup date:', pickupDate);
      console.log('🔍 Return date:', returnDate);
      console.log('🔍 Service type:', serviceType);
      console.log('🔍 From location data:', fromData);
      
      let response;
      
      // If we have location coordinates, use location-based filtering
      if (fromData && fromData.lat && fromData.lng) {
        console.log('🔍 Using location-based filtering with coordinates:', fromData.lat, fromData.lng);
        response = await vehicleApi.getVehiclesByLocation({
          latitude: fromData.lat,
          longitude: fromData.lng,
          vehicleType: 'auto',
          passengers: searchParams.passengers || 1,
          date: pickupDate,
          returnDate: returnDate
        });
      } else if (pickupDate) {
        // Fallback to date-based filtering
        response = await vehicleApi.getVehicleAutoWithDate(pickupDate, returnDate);
      } else {
        // Fallback to general vehicle fetching
        response = await vehicleApi.getVehicleAuto();
      }
      
      console.log('🔍 API Response:', response);
      
      if (response.success) {
        // Extract vehicles array from response
        let vehicles: any[] = [];
        if (Array.isArray(response.data)) {
          vehicles = response.data;
          console.log('🔍 Response data is an array with', vehicles.length, 'vehicles');
        } else if (response.data && typeof response.data === 'object' && 'docs' in response.data) {
          vehicles = response.data.docs;
          console.log('🔍 Response data has docs with', vehicles.length, 'vehicles');
        } else {
          console.log('🔍 Response data structure:', response.data);
          vehicles = [];
        }
        
        console.log('🔍 Raw vehicles before filtering:', vehicles);
        
        // Filter only approved, active, and available autos and cast to Auto type
        const approvedAutos = vehicles.filter((auto: any) => {
          // Basic filters
          const isApproved = auto.approvalStatus === 'approved';
          const isActive = auto.isActive;
          // Removed isAvailable filter to show vehicles even when they are not available (booked, in_trip, etc.)
          // const isAvailable = auto.isAvailable;
          
          // Removed isNotBooked filter to show vehicles even after booking
          // const isNotBooked = !auto.booked;
          
          // Handle bookingStatus - show vehicles regardless of booking status
          let hasValidBookingStatus = true;
          if (auto.bookingStatus !== undefined) {
            // Show vehicles with any booking status (available, booked, in_trip, etc.)
            hasValidBookingStatus = ['available', 'booked', 'in_trip', 'maintenance'].includes(auto.bookingStatus);
          } else {
            // For old vehicles without bookingStatus, show all
            hasValidBookingStatus = true;
          }
          
          const shouldInclude = isApproved && isActive && hasValidBookingStatus;
          
          if (!shouldInclude) {
            console.log('🔍 Auto filtered out:', {
              id: auto._id,
              brand: auto.brand,
              model: auto.model,
              approvalStatus: auto.approvalStatus,
              isActive: auto.isActive,
              bookingStatus: auto.bookingStatus,
              reason: {
                isApproved,
                isActive,
                hasValidBookingStatus
              }
            });
          }
          
          return shouldInclude;
        }) as Auto[];
        
        console.log('🔍 After filtering, approved autos:', approvedAutos.length);
        
        setAutos(approvedAutos);
        
        // Update parent component with vehicle data for filters
        onVehicleDataUpdate?.(approvedAutos);
        
        console.log(`✅ Loaded ${approvedAutos.length} approved and active autos`);
      } else {
        setError('Failed to fetch autos');
        console.error('❌ Error fetching autos:', response.message);
      }
    } catch (err) {
      setError('Error loading autos');
      console.error('❌ Error in fetchAutos:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [stableSearchParams, onVehicleDataUpdate]);

  // Add useEffect after fetchAutos is defined
  useEffect(() => {
    // Only fetch if we have meaningful search parameters and haven't fetched yet
    if (stableSearchParams && stableSearchParams.fromData && !hasFetchedRef.current) {
      console.log('🔍 AutoList: Fetching autos due to search params change');
      hasFetchedRef.current = true;
      fetchAutos();
    }
  }, [stableSearchParams?.fromData?.lat, stableSearchParams?.fromData?.lng, stableSearchParams?.pickupDate, stableSearchParams?.returnDate, fetchAutos]); // Only depend on specific values, not the entire object

  // Apply filters to autos
  const filteredAutos = useMemo(() => {
    if (!filters) return autos;

    return autos.filter(auto => {
      // Seating capacity filter
      if (filters.seatingCapacity.length > 0 && !filters.seatingCapacity.includes(auto.seatingCapacity)) {
        return false;
      }

      // AC filter
      if (filters.isAc.length > 0) {
        const autoAcType = auto.isAc ? 'AC' : 'Non-AC';
        if (!filters.isAc.includes(autoAcType)) {
          return false;
        }
      }

      // Fuel type filter
      if (filters.fuelType.length > 0 && !filters.fuelType.includes(auto.fuelType)) {
        return false;
      }

      // Auto type filter
      if (filters.autoType.length > 0 && !filters.autoType.includes(auto.fuelType)) {
        return false;
      }

      // Price range filter (basic implementation)
      if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) {
        // Get base price for comparison
        let basePrice = 0;
        if (auto.pricing?.autoPrice?.oneWay) {
          basePrice = auto.pricing.autoPrice.oneWay;
        } else if (auto.pricing?.distancePricing?.oneWay?.['50km']) {
          basePrice = auto.pricing.distancePricing.oneWay['50km'];
        }
        
        if (basePrice < filters.priceRange.min || basePrice > filters.priceRange.max) {
          return false;
        }
      }

      return true;
    });
  }, [autos, filters]);

  // Sort filtered autos
  const sortedAutos = useMemo(() => {
    if (!filters?.sortBy) return filteredAutos;

    const sorted = [...filteredAutos];
    
    switch (filters.sortBy) {
      case 'price-low':
        sorted.sort((a, b) => {
          const priceA = a.pricing?.autoPrice?.oneWay || a.pricing?.distancePricing?.oneWay?.['50km'] || 0;
          const priceB = b.pricing?.autoPrice?.oneWay || b.pricing?.distancePricing?.oneWay?.['50km'] || 0;
          return priceA - priceB;
        });
        break;
      case 'price-high':
        sorted.sort((a, b) => {
          const priceA = a.pricing?.autoPrice?.oneWay || a.pricing?.distancePricing?.oneWay?.['50km'] || 0;
          const priceB = b.pricing?.autoPrice?.oneWay || b.pricing?.distancePricing?.oneWay?.['50km'] || 0;
          return priceB - priceA;
        });
        break;
      case 'rating-high':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'seating-low':
        sorted.sort((a, b) => a.seatingCapacity - b.seatingCapacity);
        break;
      case 'seating-high':
        sorted.sort((a, b) => b.seatingCapacity - a.seatingCapacity);
        break;
    }
    
    return sorted;
  }, [filteredAutos, filters?.sortBy]);

  // Helper function to get total active filters
  const getTotalActiveFilters = (filters?: VehicleFilters) => {
    if (!filters) return 0;
    
    let count = 0;
    if (filters.seatingCapacity.length > 0) count++;
    if (filters.isAc.length > 0) count++;
    if (filters.isSleeper.length > 0) count++;
    if (filters.fuelType.length > 0) count++;
    if (filters.carBrand.length > 0) count++;
    if (filters.carModel.length > 0) count++;
    if (filters.busBrand.length > 0) count++;
    if (filters.busModel.length > 0) count++;
    if (filters.autoType.length > 0) count++;
    if (filters.sortBy) count++;
    return count;
  };

  const handleViewDetails = (auto: Auto) => {
    setSelectedAuto(auto);
    setIsModalOpen(true);
  };

  const handleBookNow = (auto: Auto) => {
    setSelectedAutoForCheckout(auto);
    setIsCheckoutOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAuto(null);
  };

  const closeCheckout = () => {
    setIsCheckoutOpen(false);
    setSelectedAutoForCheckout(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-2">⚠️ {error}</div>
        <button 
          onClick={fetchAutos}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (autos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 text-lg mb-2">🛺 No Autos Available</div>
        <div className="text-gray-500">
          {searchParams?.fromData ? 'No autos available within 100km of your pickup location.' : 'No approved and active autos found matching your criteria.'}
        </div>
        {searchParams?.fromData && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-md mx-auto">
            <p className="text-sm text-blue-800">
              💡 <strong>Location Tip:</strong> We're showing vehicles within 100km of "{searchParams.fromData.description}". 
              Try a different pickup location for more options.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Show search location if available
  if (searchParams?.from && searchParams?.to) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {sortedAutos.length} autos found
            {filters && getTotalActiveFilters(filters) > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (filtered from {autos.length})
              </span>
            )}
          </h2>
          <div className="text-sm text-gray-500 flex items-center">
            <MapPin className="inline h-4 w-4 mr-1" />
            {searchParams.from} → {searchParams.to}
          </div>
        </div>
        
        {/* Autos List */}
        <div className="space-y-4">
          {sortedAutos.map((auto) => (
            <AutoCard key={auto._id} auto={auto} searchParams={searchParams} onViewDetails={handleViewDetails} onBookNow={handleBookNow} />
          ))}
        </div>

        {/* Auto Details Modal */}
        <VehicleDetailsModal 
          vehicle={selectedAuto} 
          isOpen={isModalOpen} 
          onClose={closeModal} 
        />

        {/* Checkout Modal */}
        <Checkout
          isOpen={isCheckoutOpen}
          onClose={closeCheckout}
          vehicle={selectedAutoForCheckout}
          bookingData={searchParams}
        />
      </div>
    );
  }

  // Default view without search params
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {sortedAutos.length} autos found
          {filters && getTotalActiveFilters(filters) > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              (filtered from {autos.length})
            </span>
          )}
        </h2>
        <div className="text-sm text-gray-500">
          {filters && getTotalActiveFilters(filters) > 0 ? 'Showing filtered results' : 'Showing all available autos'}
        </div>
      </div>
      
      {/* Autos List */}
      <div className="space-y-4">
        {sortedAutos.map((auto) => (
          <AutoCard key={auto._id} auto={auto} searchParams={searchParams} onViewDetails={handleViewDetails} onBookNow={handleBookNow} />
        ))}
      </div>

      {/* Auto Details Modal */}
      <VehicleDetailsModal 
        vehicle={selectedAuto} 
        isOpen={isModalOpen} 
        onClose={closeModal} 
      />
    </div>
  );
};

interface AutoCardProps {
  auto: Auto;
  searchParams?: {
    from?: string;
    to?: string;
    fromData?: LocationData;
    toData?: LocationData;
    pickupDate?: string;
    pickupTime?: string;
    serviceType?: string;
    returnDate?: string;
    passengers?: number;
  };
  onViewDetails: (auto: Auto) => void;
  onBookNow: (auto: Auto) => void;
}

const AutoCard: React.FC<AutoCardProps> = ({ auto, searchParams, onViewDetails, onBookNow }) => {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => setIsImageLoading(false);
  const handleImageError = () => {
    setIsImageLoading(false);
    setImageError(true);
  };

  const getAmenitiesText = () => {
    const amenities = [];
    if (auto.amenities && auto.amenities.length > 0) amenities.push(...auto.amenities);
    return amenities.slice(0, 3).join(' • ');
  };

  const getPriceDisplay = () => {
    if (!searchParams?.fromData || !searchParams?.toData) {
      // Show auto pricing without distance calculation
      if (auto.pricing?.autoPrice) {
        const price = Math.round(auto.pricing.autoPrice.oneWay || 0); // Round to whole rupees
        return (
          <div className="text-2xl font-bold text-green-600">
            {formatPrice(price)}
            <span className="text-sm font-normal text-gray-500 ml-1">per km</span>
          </div>
        );
      }
      return (
        <div className="text-lg text-red-600 font-medium">
          Pricing Unavailable
        </div>
      );
    }

    // Calculate distance and show appropriate pricing
    const distance = calculateDistance(searchParams.fromData, searchParams.toData);
    const tripType = searchParams.serviceType === 'roundTrip' ? 'return' : 'one-way';
    const pricingInfo = getPricingDisplay(auto, distance, tripType);

    if (!pricingInfo.isValid) {
      return (
        <div className="text-lg text-red-600 font-medium">
          Pricing Unavailable
        </div>
      );
    }

    return (
      <div className="text-2xl font-bold text-green-600">
        {formatPrice(pricingInfo.price)}
        <div className="text-sm font-normal text-gray-500">
          {distance > 0 ? `${distance.toFixed(1)}km ${tripType === 'return' ? 'return' : 'one-way'} trip` : 'Fixed fare'}
        </div>
      </div>
    );
  };

  const formatPrice = (price: number) => {
    // Round to whole rupees (no decimal places) and format
    const roundedPrice = Math.round(price);
    return `₹${roundedPrice.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getWorkingDaysText = (days: string[]) => {
    if (days.length === 7) return 'Daily';
    if (days.length === 5 && !days.includes('saturday') && !days.includes('sunday')) return 'Weekdays';
    return days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
  };

  // Get primary image or fallback
  const getPrimaryImage = () => {
    if (auto.images && auto.images.length > 0) {
      const primaryImage = auto.images.find(img => img.isPrimary) || auto.images[0];
      return primaryImage.url;
    }
    return null;
  };

  const primaryImage = getPrimaryImage();

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200">
      {/* Desktop Layout - Horizontal */}
      <div className="hidden md:flex flex-row items-stretch">
        {/* Image Section - Left Side */}
        <div className="relative w-80 h-64 bg-gray-100 flex-shrink-0 overflow-hidden">
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {!imageError && primaryImage ? (
            <img
              src={primaryImage}
              alt={`${auto.brand} auto`}
              className={`w-full h-full object-contain transition-all duration-300 ${
                isImageLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Car className="h-16 w-16 text-gray-400 mb-2" />
              <span className="text-xs text-gray-500 text-center px-2">No Image Available</span>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full shadow-sm">
              Available
            </span>
          </div>

          {/* Rating Badge */}
          {auto.rating && (
            <div className="absolute bottom-3 left-3">
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full shadow-sm flex items-center">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                {auto.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Content Section - Middle */}
        <div className="flex-1 p-6 flex flex-col justify-center">
          {/* Vehicle Info */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900">
                {auto.brand}
              </h3>
            </div>
            
            <div className="text-sm text-gray-700 mb-2">
               {auto.isAc ? 'AC' : 'Non-AC'} • {auto.fuelType}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-1" />
              <span>{auto.seatingCapacity} Seater</span>
            </div>
            {auto.vehicleLocation?.address && (
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="truncate">{auto.vehicleLocation.address}</span>
              </div>
            )}
          </div>

          {/* Amenities */}
          {getAmenitiesText() && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                ✨ {getAmenitiesText()}
              </div>
            </div>
          )}


        </div>

        {/* Pricing & Actions Section - Right Side */}
        <div className="w-48 p-6 flex flex-col justify-center items-end flex-shrink-0">
          {/* Pricing */}
          <div className="mb-4 text-right">
            <div className="text-xs text-gray-500 mb-1">Book at only</div>
            <div className="text-xl font-bold text-gray-900">
              {getPriceDisplay()}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <button 
              onClick={() => onViewDetails(auto)}
              className="flex items-center justify-center bg-white text-blue-600 border border-blue-600 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm w-full"
            >
              <span className="mr-1">👁️</span>
              View Details
            </button>
            <button 
              onClick={() => onBookNow(auto)}
              className="flex items-center justify-center bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm w-full"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Vertical */}
      <div className="md:hidden p-4 space-y-4">
        {/* Top Section - Vehicle Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">
              {auto.brand}
            </h3>
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Available
            </span>
          </div>
          
          <div className="text-sm text-gray-700">
            {auto.isAc ? 'AC' : 'Non-AC'}• {auto.fuelType}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-1" />
            <span>{auto.seatingCapacity} Seater</span>
          </div>
          {auto.vehicleLocation?.address && (
            <div className="flex items-start text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
              <span className="break-words leading-relaxed">{auto.vehicleLocation.address}</span>
            </div>
          )}
        </div>

        {/* Middle Section - Vehicle Image */}
        <div className="relative w-full h-56 bg-gray-100 rounded-lg overflow-hidden">
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {!imageError && primaryImage ? (
            <img
              src={primaryImage}
              alt={`${auto.brand} auto`}
              className={`w-full h-full object-contain transition-all duration-300 ${
                isImageLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Car className="h-20 w-20 text-gray-400 mb-3" />
              <span className="text-sm text-gray-500 text-center px-4">No Image Available</span>
            </div>
          )}

          {/* Rating Badge for Mobile */}
          {auto.rating && (
            <div className="absolute bottom-3 left-3">
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full shadow-sm flex items-center">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                {auto.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Amenities for Mobile */}
        {getAmenitiesText() && (
          <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            ✨ {getAmenitiesText()}
          </div>
        )}



        {/* Bottom Section - Pricing & Actions */}
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Book at only</div>
            <div className="text-2xl font-bold text-gray-900">
              {getPriceDisplay()}
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <button 
              onClick={() => onViewDetails(auto)}
              className="flex items-center justify-center bg-white text-blue-600 border border-blue-600 py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
            >
              <span className="mr-2">👁️</span>
              View Details
            </button>
            <button 
              onClick={() => onBookNow(auto)}
              className="flex items-center justify-center bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoList;
