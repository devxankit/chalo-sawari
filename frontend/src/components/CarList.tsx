import React, { useState, useEffect } from 'react';
import { Car, MapPin, Star, Users, Calendar } from 'lucide-react';
import VehicleApiService from '../services/vehicleApi';
import VehicleDetailsModal from './VehicleDetailsModal';
import Checkout from './Checkout';

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
  driver?: {
    _id: string;
    firstName: string;
    lastName: string;
    rating: number;
    phone: string;
  };
  pricing: {
    basePrice: number;
    distancePricing: {
      '50km': number;
      '100km': number;
      '150km': number;
      '200km': number;
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

interface CarListNewProps {
  searchParams?: {
    from?: string;
    to?: string;
    fromData?: any;
    toData?: any;
    date?: string;
    time?: string;
    serviceType?: string;
    returnDate?: string;
    passengers?: number;
  };
}

const CarList: React.FC<CarListNewProps> = ({ searchParams }) => {
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
      
      const response = await vehicleApi.searchVehicles({ vehicleType: 'car' });
      
      if (response.success) {
        // Extract vehicles array from response
        let vehicles: any[] = [];
        if (Array.isArray(response.data)) {
          vehicles = response.data;
        } else if (response.data && typeof response.data === 'object' && 'docs' in response.data) {
          vehicles = response.data.docs;
        }
        
        // Filter only approved, active, and not booked cars and cast to Car type
        const approvedCars = vehicles.filter((car: any) => 
          car.approvalStatus === 'approved' && car.isActive && !car.booked
        ) as Car[];
        
        setCars(approvedCars);
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

  const getAmenitiesText = () => {
    const amenities = [];
    if (cars[0]?.isAc) amenities.push('AC');
    if (cars[0]?.amenities && cars[0].amenities.length > 0) amenities.push(...cars[0].amenities);
    return amenities.slice(0, 3).join(' • ');
  };

  const getPriceDisplay = () => {
    if (cars[0]?.pricing?.basePrice) {
      return (
        <div className="text-2xl font-bold text-green-600">
          ₹{cars[0].pricing.basePrice.toLocaleString()}
          <span className="text-sm font-normal text-gray-500 ml-1">base fare</span>
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
            {cars.length} cars found
          </h2>
          <div className="text-sm text-gray-500 flex items-center">
            <MapPin className="inline h-4 w-4 mr-1" />
            {searchParams.from} → {searchParams.to}
          </div>
        </div>
        
        {/* Cars List */}
        <div className="space-y-4">
          {cars.map((car) => (
            <CarCard key={car._id} car={car} onViewDetails={handleViewDetails} onBookNow={handleBookNow} />
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
          {cars.length} cars found
        </h2>
        <div className="text-sm text-gray-500">
          Showing all available cars
        </div>
      </div>
      
      {/* Cars List */}
      <div className="space-y-4">
        {cars.map((car) => (
          <CarCard key={car._id} car={car} onViewDetails={handleViewDetails} onBookNow={handleBookNow} />
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

const CarCard = ({ car, onViewDetails, onBookNow }: { car: Car; onViewDetails: (car: Car) => void; onBookNow: (car: Car) => void }) => {
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
          
          {!imageError && car.images && car.images.length > 0 ? (
            <img
              src={car.images[0].url}
              alt={`${car.brand} ${car.model}`}
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
                {car.driver?.firstName} {car.driver?.lastName}
              </h3>
            </div>
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
              <span className="font-medium">{car.rating ? car.rating.toFixed(1) : 'N/A'}</span>
              <span className="text-gray-500 ml-1">({car.totalTrips || 0})</span>
            </div>
            <div className="text-sm text-gray-700 mb-1">{car.brand} {car.model}</div>
            <div className="text-sm text-gray-600 mb-1">
              {car.isAc ? 'AC' : 'Non-AC'} {car.transmission} • {car.fuelType}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-1" />
              <span>{car.seatingCapacity} Seater</span>
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
              {car.schedule?.workingDays ? getWorkingDaysText(car.schedule.workingDays) : 'N/A'}
            </div>
            <div className="flex items-center">
              <span className="mr-2">🕐</span>
              {car.schedule?.workingHours ? `${car.schedule.workingHours.start} - ${car.schedule.workingHours.end}` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Pricing & Actions Section - Right Side */}
        <div className="w-48 p-6 flex flex-col justify-center items-end" style={{ width: '192px', flexShrink: 0 }}>
          {/* Pricing */}
          <div className="mb-4 text-right">
            <div className="text-xs text-gray-500 mb-1">Book at only</div>
            <div className="text-xl font-bold text-gray-900">
              ₹{car.pricing?.basePrice ? car.pricing.basePrice.toLocaleString() : 'N/A'}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <button 
              className="flex items-center justify-center bg-white text-blue-600 border border-blue-600 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
              onClick={() => onViewDetails(car)}
            >
              View Details
            </button>
            <button 
              className="flex items-center justify-center bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
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
              {car.driver?.firstName} {car.driver?.lastName}
            </h3>
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Available
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
            <span className="font-medium">{car.rating ? car.rating.toFixed(1) : 'N/A'}</span>
            <span className="text-gray-500 ml-1">({car.totalTrips || 0})</span>
          </div>
          <div className="text-sm text-gray-700">{car.brand} {car.model}</div>
          <div className="text-sm text-gray-600">
            {car.isAc ? 'AC' : 'Non-AC'} {car.transmission} • {car.fuelType}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-1" />
            <span>{car.seatingCapacity} Seater</span>
          </div>
        </div>

        {/* Middle Section - Vehicle Image */}
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse bg-gray-300 w-full h-full"></div>
            </div>
          )}
          
          {!imageError && car.images && car.images.length > 0 ? (
            <img
              src={car.images[0].url}
              alt={`${car.brand} ${car.model}`}
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
              ₹{car.pricing?.basePrice ? car.pricing.basePrice.toLocaleString() : 'N/A'}
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
