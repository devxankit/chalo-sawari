import React, { useState, useEffect } from 'react';
import { Car, MapPin, Star, Users, Calendar } from 'lucide-react';
import VehicleApiService from '../services/vehicleApi';
import VehicleDetailsModal from './VehicleDetailsModal';
import Checkout from './Checkout';
import { calculateDistance, getPricingDisplay, formatPrice, LocationData } from '../lib/distanceUtils';

interface Auto {
  _id: string;
  type: 'bus' | 'car' | 'auto';
  brand: string;
  model: string;
  year: number;
  color: string;
  fuelType: string;
  transmission: string;
  seatingCapacity: number;
  engineCapacity?: number;
  mileage?: number;
  isAc: boolean;
  isSleeper: boolean;
  amenities: string[];
  images: Array<{
    url: string;
    caption?: string;
    isPrimary: boolean;
  }>;
  registrationNumber: string;
  chassisNumber?: string;
  engineNumber?: string;
  operatingArea?: {
    cities: string[];
    states: string[];
    radius: number;
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
      };
      return: {
        '50km': number;
        '100km': number;
        '150km': number;
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
}

const AutoList: React.FC<AutoListProps> = ({ searchParams }) => {
  const [autos, setAutos] = useState<Auto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAuto, setSelectedAuto] = useState<Auto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedAutoForCheckout, setSelectedAutoForCheckout] = useState<Auto | null>(null);
  
  // Initialize vehicle API service with proper parameters
  const vehicleApi = new VehicleApiService(
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    () => ({}) // Empty headers for public access
  );

  useEffect(() => {
    fetchAutos();
  }, [searchParams]);

  const fetchAutos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await vehicleApi.searchVehicles({ vehicleType: 'auto' });
      
      if (response.success) {
        // Extract vehicles array from response
        let vehicles: any[] = [];
        if (Array.isArray(response.data)) {
          vehicles = response.data;
        } else if (response.data && typeof response.data === 'object' && 'docs' in response.data) {
          vehicles = response.data.docs;
        }
        
        // Filter only approved, active, and available autos and cast to Auto type
        const approvedAutos = vehicles.filter((auto: any) => 
          auto.approvalStatus === 'approved' && 
          auto.isActive && 
          auto.isAvailable && 
          auto.bookingStatus === 'available' && 
          !auto.booked
        ) as Auto[];
        
        setAutos(approvedAutos);
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
      }
    };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString()}`;
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
        <Car className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Autos Available</h3>
        <p className="text-gray-500">No approved and active autos found for your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Available Autos ({autos.length})
        </h2>
        {searchParams?.from && searchParams?.to && (
          <div className="text-sm text-gray-600">
            <MapPin className="inline h-4 w-4 mr-1" />
            {searchParams.from} → {searchParams.to}
        </div>
        )}
      </div>

      <div className="space-y-4">
        {autos.map((auto) => (
          <AutoCard key={auto._id} auto={auto} searchParams={searchParams} onViewDetails={handleViewDetails} onBookNow={handleBookNow} />
        ))}
      </div>
      {selectedAuto && (
        <VehicleDetailsModal
          isOpen={isModalOpen}
          onClose={closeModal}
          vehicle={selectedAuto}
        />
      )}

      {/* Checkout Modal */}
      <Checkout
        isOpen={isCheckoutOpen}
        onClose={closeCheckout}
        vehicle={selectedAutoForCheckout}
        bookingData={searchParams}
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
        return (
          <div className="text-2xl font-bold text-green-600">
            {formatPrice(auto.pricing.autoPrice.oneWay)}
            <span className="text-sm font-normal text-gray-500 ml-1">one-way</span>
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
          {distance > 0 ? `${distance}km trip` : 'Fixed fare'}
        </div>
      </div>
    );
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString()}`;
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

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200">
      {/* Desktop Layout - Horizontal */}
      <div className="hidden md:flex flex-row items-stretch">
        {/* Image Section - Left Side */}
        <div className="relative w-48 h-48 bg-gray-100" style={{ width: '192px', height: '192px', flexShrink: 0 }}>
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse bg-gray-300 w-full h-full"></div>
            </div>
          )}
          
          {!imageError && auto.images && auto.images.length > 0 ? (
            <img
              src={auto.images[0].url}
              alt={`${auto.brand} ${auto.model}`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isImageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <Car className="h-16 w-16 text-gray-400" />
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Available
            </span>
          </div>
        </div>

        {/* Content Section - Middle */}
        <div className="flex-1 p-6 flex flex-col justify-center" style={{ flex: '1 1 auto' }}>
          {/* Vehicle Info */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">
                {auto.brand}
              </h3>
            </div>
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
              <span className="font-medium">{auto.rating ? auto.rating.toFixed(1) : 'N/A'}</span>
              <span className="text-gray-500 ml-1">({auto.totalTrips || 0})</span>
            </div>
            <div className="text-sm text-gray-700 mb-1">{auto.brand} {auto.model}</div>
            <div className="text-sm text-gray-600 mb-1">
              {auto.isAc ? 'AC' : 'Non-AC'} {auto.transmission} • {auto.fuelType}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-1" />
              <span>{auto.seatingCapacity} Seater</span>
            </div>
          </div>

          {/* Amenities */}
          {getAmenitiesText() && (
            <div className="mb-4">
              <div className="text-sm text-gray-600">
                {getAmenitiesText()}
              </div>
            </div>
          )}

          {/* Schedule Info */}
          <div className="text-sm text-gray-600">
            <div className="flex items-center mb-1">
              <Calendar className="h-4 w-4 mr-2" />
              {auto.schedule?.workingDays ? getWorkingDaysText(auto.schedule.workingDays) : 'N/A'}
            </div>
            <div className="flex items-center">
              <span className="mr-2">🕐</span>
              {auto.schedule?.workingHours ? `${auto.schedule.workingHours.start} - ${auto.schedule.workingHours.end}` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Pricing & Actions Section - Right Side */}
        <div className="w-48 p-6 flex flex-col justify-center items-end" style={{ width: '192px', flexShrink: 0 }}>
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
              className="flex items-center justify-center bg-white text-blue-600 border border-blue-600 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
            >
              <span className="mr-1">👁️</span>
              View Details
            </button>
            <button 
              onClick={() => onBookNow(auto)}
              className="flex items-center justify-center bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
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
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5">
              Available
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
            <span className="font-medium">{auto.rating ? auto.rating.toFixed(1) : 'N/A'}</span>
            <span className="text-gray-500 ml-1">({auto.totalTrips || 0})</span>
          </div>
          <div className="text-sm text-gray-700">{auto.brand} {auto.model}</div>
          <div className="text-sm text-gray-600">
            {auto.isAc ? 'AC' : 'Non-AC'} {auto.transmission} • {auto.fuelType}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-1" />
            <span>{auto.seatingCapacity} Seater</span>
          </div>
        </div>

        {/* Middle Section - Vehicle Image */}
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse bg-gray-300 w-full h-full"></div>
            </div>
          )}
          
          {!imageError && auto.images && auto.images.length > 0 ? (
            <img
              src={auto.images[0].url}
              alt={`${auto.brand} ${auto.model}`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isImageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <Car className="h-16 w-16 text-gray-400" />
            </div>
          )}
        </div>

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
