import React, { useState, useEffect, useMemo } from 'react';
import { Car, MapPin, Star, Users, Calendar } from 'lucide-react';
import VehicleApiService from '../services/vehicleApi';
import VehicleDetailsModal from './VehicleDetailsModal';
import Checkout from './Checkout';
import { calculateDistance, getPricingDisplay, formatPrice, LocationData } from '../lib/distanceUtils';
import { VehicleFilters } from './FilterSidebar';

interface Car {
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

interface CarListProps {
  searchParams?: {
    from?: string;
    to?: string;
    fromData?: LocationData | null;
    toData?: LocationData | null;
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

const CarList: React.FC<CarListProps> = ({ searchParams, filters, onFiltersChange, onVehicleDataUpdate }) => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedCarForCheckout, setSelectedCarForCheckout] = useState<Car | null>(null);
  
  // Initialize vehicle API service with proper parameters
  const vehicleApi = new VehicleApiService(
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    () => ({}) // Empty headers for public access
  );

  useEffect(() => {
    fetchCars();
  }, [searchParams]);

  const fetchCars = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await vehicleApi.getVehicleCar();
      
      if (response.success) {
        // Extract vehicles array from response
        let vehicles: any[] = [];
        if (Array.isArray(response.data)) {
          vehicles = response.data;
        } else if (response.data && typeof response.data === 'object' && 'docs' in response.data) {
          vehicles = response.data.docs;
        }
        
        // Filter only approved, active, and available cars and cast to Car type
        const approvedCars = vehicles.filter((car: any) => {
          // Basic filters
          const isApproved = car.approvalStatus === 'approved';
          const isActive = car.isActive;
          const isAvailable = car.isAvailable;
          const isNotBooked = !car.booked;
          
          // Handle bookingStatus - for old vehicles it might be undefined
          let hasValidBookingStatus = true;
          if (car.bookingStatus !== undefined) {
            hasValidBookingStatus = car.bookingStatus === 'available';
          } else {
            // For old vehicles without bookingStatus, just check if not booked
            hasValidBookingStatus = !car.booked;
          }
          
          return isApproved && isActive && isAvailable && isNotBooked && hasValidBookingStatus;
        }) as Car[];
        
        setCars(approvedCars);
        
        // Update parent component with vehicle data for filters
        onVehicleDataUpdate?.(approvedCars);
        
        console.log(`✅ Loaded ${approvedCars.length} approved and active cars`);
      } else {
        setError('Failed to fetch cars');
        console.error('❌ Error fetching cars:', response.message);
      }
    } catch (err) {
      setError('Error loading cars');
      console.error('❌ Error in fetchCars:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to cars
  const filteredCars = useMemo(() => {
    if (!filters) return cars;

    return cars.filter(car => {
      // Seating capacity filter
      if (filters.seatingCapacity.length > 0 && !filters.seatingCapacity.includes(car.seatingCapacity)) {
        return false;
      }

      // AC filter
      if (filters.isAc.length > 0) {
        const carAcType = car.isAc ? 'AC' : 'Non-AC';
        if (!filters.isAc.includes(carAcType)) {
          return false;
        }
      }

      // Fuel type filter
      if (filters.fuelType.length > 0 && !filters.fuelType.includes(car.fuelType)) {
        return false;
      }

      // Transmission filter
      if (filters.transmission.length > 0 && !filters.transmission.includes(car.transmission)) {
        return false;
      }

      // Brand filter
      if (filters.carBrand.length > 0 && !filters.carBrand.includes(car.brand)) {
        return false;
      }

      // Model filter
      if (filters.carModel.length > 0 && !filters.carModel.includes(car.model)) {
        return false;
      }

      // Price range filter (basic implementation)
      if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) {
        // Get base price for comparison
        let basePrice = 0;
        if (car.pricing?.distancePricing?.oneWay?.['50km']) {
          basePrice = car.pricing.distancePricing.oneWay['50km'];
        } else if (car.pricing?.autoPrice?.oneWay) {
          basePrice = car.pricing.autoPrice.oneWay;
        }
        
        if (basePrice < filters.priceRange.min || basePrice > filters.priceRange.max) {
          return false;
        }
      }

      return true;
    });
  }, [cars, filters]);

  // Sort filtered cars
  const sortedCars = useMemo(() => {
    if (!filters?.sortBy) return filteredCars;

    const sorted = [...filteredCars];
    
    switch (filters.sortBy) {
      case 'price-low':
        sorted.sort((a, b) => {
          const priceA = a.pricing?.distancePricing?.oneWay?.['50km'] || a.pricing?.autoPrice?.oneWay || 0;
          const priceB = b.pricing?.distancePricing?.oneWay?.['50km'] || b.pricing?.autoPrice?.oneWay || 0;
          return priceA - priceB;
        });
        break;
      case 'price-high':
        sorted.sort((a, b) => {
          const priceA = a.pricing?.distancePricing?.oneWay?.['50km'] || a.pricing?.autoPrice?.oneWay || 0;
          const priceB = b.pricing?.distancePricing?.oneWay?.['50km'] || b.pricing?.autoPrice?.oneWay || 0;
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
  }, [filteredCars, filters?.sortBy]);

  const getAmenitiesText = () => {
    const amenities = [];
    if (cars[0]?.isAc) amenities.push('AC');
    if (cars[0]?.amenities && cars[0].amenities.length > 0) amenities.push(...cars[0].amenities);
    return amenities.slice(0, 3).join(' • ');
  };

  const getPriceDisplay = () => {
    if (!cars[0]?.pricing) {
      return (
        <div className="text-lg text-red-600 font-medium">
          Pricing Unavailable
        </div>
      );
    }

    if (cars[0].pricingReference?.category === 'auto') {
      // For auto vehicles, show fixed price
      const autoPrice = cars[0].pricing.autoPrice?.oneWay || 0;
      return (
        <div className="text-2xl font-bold text-green-600">
          ₹{autoPrice.toLocaleString()}
          <span className="text-sm font-normal text-gray-500 ml-1">fixed fare</span>
        </div>
      );
    }

    // For car vehicles, show distance-based pricing
    if (cars[0].pricing.distancePricing) {
      const oneWayPricing = cars[0].pricing.distancePricing.oneWay;
      return (
        <div className="text-2xl font-bold text-green-600">
          ₹{oneWayPricing['50km'].toLocaleString()}
          <span className="text-sm font-normal text-gray-500 ml-1">per 50km</span>
        </div>
      );
    }

    return (
      <div className="text-lg text-red-600 font-medium">
        Pricing Unavailable
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

  const handleViewDetails = (car: Car) => {
    setSelectedCar(car);
    setIsModalOpen(true);
  };

  const handleBookNow = (car: Car) => {
    setSelectedCarForCheckout(car);
    setIsCheckoutOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCar(null);
  };

  const closeCheckout = () => {
    setIsCheckoutOpen(false);
    setSelectedCarForCheckout(null);
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
          onClick={fetchCars}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 text-lg mb-2">🚗 No Cars Available</div>
        <div className="text-gray-500">No approved and active cars found matching your criteria.</div>
      </div>
    );
  }

  // Show search location if available
  if (searchParams?.from && searchParams?.to) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {sortedCars.length} cars found
            {filters && getTotalActiveFilters(filters) > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (filtered from {cars.length})
              </span>
            )}
          </h2>
          <div className="text-sm text-gray-500 flex items-center">
            <MapPin className="inline h-4 w-4 mr-1" />
            {searchParams.from} → {searchParams.to}
          </div>
        </div>
        
        {/* Cars List */}
        <div className="space-y-4">
          {sortedCars.map((car) => (
            <CarCard key={car._id} car={car} searchParams={searchParams} onViewDetails={handleViewDetails} onBookNow={handleBookNow} />
          ))}
        </div>

        {/* Car Details Modal */}
        <VehicleDetailsModal 
          vehicle={selectedCar} 
          isOpen={isModalOpen} 
          onClose={closeModal} 
        />

        {/* Checkout Modal */}
        <Checkout
          isOpen={isCheckoutOpen}
          onClose={closeCheckout}
          vehicle={selectedCarForCheckout}
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
          {sortedCars.length} cars found
          {filters && getTotalActiveFilters(filters) > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              (filtered from {cars.length})
            </span>
          )}
        </h2>
        <div className="text-sm text-gray-500">
          {filters && getTotalActiveFilters(filters) > 0 ? 'Showing filtered results' : 'Showing all available cars'}
        </div>
      </div>
      
      {/* Cars List */}
      <div className="space-y-4">
        {sortedCars.map((car) => (
          <CarCard key={car._id} car={car} searchParams={searchParams} onViewDetails={handleViewDetails} onBookNow={handleBookNow} />
        ))}
      </div>

      {/* Car Details Modal */}
      <VehicleDetailsModal 
        vehicle={selectedCar} 
        isOpen={isModalOpen} 
        onClose={closeModal} 
      />
    </div>
  );
};

// Helper function to get total active filters
const getTotalActiveFilters = (filters?: VehicleFilters) => {
  if (!filters) return 0;
  
  let count = 0;
  if (filters.seatingCapacity.length > 0) count++;
  if (filters.isAc.length > 0) count++;
  if (filters.isSleeper.length > 0) count++;
  if (filters.fuelType.length > 0) count++;
  if (filters.transmission.length > 0) count++;
  if (filters.carBrand.length > 0) count++;
  if (filters.carModel.length > 0) count++;
  if (filters.sortBy) count++;
  return count;
};

const CarCard = ({ car, searchParams, onViewDetails, onBookNow }: { 
  car: Car; 
  searchParams?: {
    from?: string;
    to?: string;
    fromData?: LocationData | null;
    toData?: LocationData | null;
    pickupDate?: string;
    pickupTime?: string;
    serviceType?: string;
    returnDate?: string;
    passengers?: number;
  };
  onViewDetails: (car: Car) => void; 
  onBookNow: (car: Car) => void; 
}) => {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setIsImageLoading(false);
  };

  const handleImageError = () => {
    setIsImageLoading(false);
    setImageError(true);
  };

  const getAmenitiesText = () => {
    const amenities = [];
    if (car.isAc) amenities.push('AC');
    if (car.amenities && car.amenities.length > 0) amenities.push(...car.amenities);
    return amenities.slice(0, 3).join(' • ');
  };

  // Get primary image or fallback
  const getPrimaryImage = () => {
    if (car.images && car.images.length > 0) {
      const primaryImage = car.images.find(img => img.isPrimary) || car.images[0];
      return primaryImage.url;
    }
    return null;
  };

  const primaryImage = getPrimaryImage();

  const getPriceDisplay = () => {
    if (!car.pricing) {
      return (
        <div className="text-lg text-red-600 font-medium">
          Pricing Unavailable
        </div>
      );
    }

    // For auto vehicles, show fixed price
    if (car.pricingReference?.category === 'auto') {
      const tripType = searchParams?.serviceType === 'roundTrip' ? 'return' : 'one-way';
      const autoPrice = tripType === 'return' 
        ? (car.pricing.autoPrice?.return || car.pricing.autoPrice?.oneWay || 0)
        : (car.pricing.autoPrice?.oneWay || 0);
      
      return (
        <div className="text-2xl font-bold text-green-600">
          ₹{autoPrice.toLocaleString()}
          <span className="text-sm font-normal text-gray-500 ml-1">
            {tripType === 'return' ? 'Return fare' : 'One-way fare'}
          </span>
        </div>
      );
    }

    // For car vehicles, show distance-based pricing
    if (car.pricing.distancePricing) {
      // Determine trip type - handle both "oneWay" and "one-way" formats
      let tripType = 'one-way';
      if (searchParams?.serviceType === 'roundTrip') {
        tripType = 'return';
      } else if (searchParams?.serviceType === 'oneWay') {
        tripType = 'one-way';
      }
      
      // Try multiple possible trip type keys
      let pricing = car.pricing.distancePricing[tripType];
      if (!pricing) {
        // Fallback to other possible keys
        pricing = car.pricing.distancePricing['oneWay'] || 
                  car.pricing.distancePricing['one-way'] || 
                  car.pricing.distancePricing['oneway'] ||
                  car.pricing.distancePricing['return'] ||
                  Object.values(car.pricing.distancePricing)[0]; // Use first available
      }
      
      if (!pricing) {
        return (
          <div className="text-lg text-red-600 font-medium">
            Pricing not available for {tripType} trip
          </div>
        );
      }
      
      // Check if we have search parameters to calculate distance
      if (searchParams?.fromData && searchParams?.toData) {
        const distance = calculateDistance(searchParams.fromData, searchParams.toData);
        
        // Find the best available rate per km
        let ratePerKm = 0;
        let rateLabel = '';
        
        // Try to find the appropriate rate based on distance
        if (distance <= 50 && pricing['50km']) {
          ratePerKm = pricing['50km'];
          rateLabel = '50km rate';
        } else if (distance <= 100 && pricing['100km']) {
          ratePerKm = pricing['100km'];
          rateLabel = '100km rate';
        } else if (distance <= 150 && pricing['150km']) {
          ratePerKm = pricing['150km'];
          rateLabel = '150km rate';
        } else if (pricing['150km']) {
          ratePerKm = pricing['150km'];
          rateLabel = '150km rate';
        } else if (pricing['100km']) {
          ratePerKm = pricing['100km'];
          rateLabel = '100km rate';
        } else if (pricing['50km']) {
          ratePerKm = pricing['50km'];
          rateLabel = '50km rate';
        }
        
        if (ratePerKm > 0) {
          // Calculate total price: distance × rate per km
          const totalPrice = ratePerKm * distance;
          
          return (
            <div className="text-2xl font-bold text-green-600">
              ₹{totalPrice.toLocaleString()}
              <div className="text-sm font-normal text-gray-500">
                {distance.toFixed(1)} km trip (₹{ratePerKm}/km)
              </div>
            </div>
          );
        }
      } else {
        // Missing coordinates - show helpful message
        return (
          <div className="text-lg text-amber-600 font-medium">
            Select locations to see distance-based pricing
          </div>
        );
      }
      
      // Fallback: show best available rate per km
      let bestRate = 0;
      let rateLabel = 'Base rate';
      
      if (pricing['50km']) {
        bestRate = pricing['50km'];
        rateLabel = '50km rate';
      } else if (pricing['100km']) {
        bestRate = pricing['100km'];
        rateLabel = '100km rate';
      } else if (pricing['150km']) {
        bestRate = pricing['150km'];
        rateLabel = '150km rate';
      }
      
      if (bestRate > 0) {
        return (
          <div className="text-2xl font-bold text-green-600">
            ₹{bestRate.toLocaleString()}
            <div className="text-sm font-normal text-gray-600">
              {rateLabel} per km
            </div>
          </div>
        );
      }
    }

    return (
      <div className="text-lg text-red-600 font-medium">
        Pricing structure incomplete
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
        <div className="relative w-80 h-64 bg-gray-100 flex-shrink-0 overflow-hidden">
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {!imageError && primaryImage ? (
            <img
              src={primaryImage}
              alt={`${car.brand} ${car.model} car`}
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
          {car.rating && (
            <div className="absolute bottom-3 left-3">
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full shadow-sm flex items-center">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                {car.rating.toFixed(1)}
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
                {car.brand} {car.model}
              </h3>
            </div>
            
            <div className="text-sm text-gray-700 mb-2">
              {car.year} • {car.isAc ? 'AC' : 'Non-AC'} • {car.transmission} • {car.fuelType}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-1" />
              <span>{car.seatingCapacity} Seater</span>
            </div>
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
              className="flex items-center justify-center bg-white text-blue-600 border border-blue-600 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm w-full"
              onClick={() => onViewDetails(car)}
            >
              <span className="mr-1">👁️</span>
              View Details
            </button>
            <button 
              className="flex items-center justify-center bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm w-full"
              onClick={() => onBookNow(car)}
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
              {car.brand} {car.model}
            </h3>
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Available
            </span>
          </div>
          <div className="text-sm text-gray-700">
            {car.year} • {car.isAc ? 'AC' : 'Non-AC'} • {car.transmission} • {car.fuelType}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-1" />
            <span>{car.seatingCapacity} Seater</span>
          </div>
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
              alt={`${car.brand} ${car.model} car`}
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
          {car.rating && (
            <div className="absolute bottom-3 left-3">
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full shadow-sm flex items-center">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                {car.rating.toFixed(1)}
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
              className="flex items-center justify-center bg-white text-blue-600 border border-blue-600 py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
              onClick={() => onViewDetails(car)}
            >
              <span className="mr-2">👁️</span>
              View Details
            </button>
            <button 
              className="flex items-center justify-center bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              onClick={() => onBookNow(car)}
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarList;
