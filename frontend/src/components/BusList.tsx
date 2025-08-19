import React, { useState, useEffect } from 'react';
import { Bus, MapPin, Star, Users, Calendar } from 'lucide-react';
import VehicleApiService from '../services/vehicleApi';
import VehicleDetailsModal from './VehicleDetailsModal';

interface Bus {
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

interface BusListProps {
  searchParams?: {
    from?: string;
    to?: string;
    date?: string;
    passengers?: number;
  };
}

const BusList: React.FC<BusListProps> = ({ searchParams }) => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Initialize vehicle API service with proper parameters
  const vehicleApi = new VehicleApiService(
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    () => ({}) // Empty headers for public access
  );

  useEffect(() => {
    fetchBuses();
  }, [searchParams]);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await vehicleApi.searchVehicles({ vehicleType: 'bus' });
      
      if (response.success) {
        // Extract vehicles array from response
        let vehicles: any[] = [];
        if (Array.isArray(response.data)) {
          vehicles = response.data;
        } else if (response.data && typeof response.data === 'object' && 'docs' in response.data) {
          vehicles = response.data.docs;
        }
        
        // Filter only approved and active buses and cast to Bus type
        const approvedBuses = vehicles.filter((bus: any) => 
          bus.approvalStatus === 'approved' && bus.isActive
        ) as Bus[];
        
        setBuses(approvedBuses);
        console.log(`✅ Loaded ${approvedBuses.length} approved and active buses`);
          } else {
        setError('Failed to fetch buses');
        console.error('❌ Error fetching buses:', response.message);
      }
    } catch (err) {
      setError('Error loading buses');
      console.error('❌ Error in fetchBuses:', err);
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

  const handleViewDetails = (bus: Bus) => {
    setSelectedBus(bus);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBus(null);
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
          onClick={fetchBuses}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (buses.length === 0) {
    return (
      <div className="text-center py-12">
        <Bus className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Buses Available</h3>
        <p className="text-gray-500">No approved and active buses found for your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Available Buses ({buses.length})
        </h2>
        {searchParams?.from && searchParams?.to && (
          <div className="text-sm text-gray-600">
            <MapPin className="inline h-4 w-4 mr-1" />
            {searchParams.from} → {searchParams.to}
        </div>
        )}
      </div>

      <div className="space-y-4">
        {buses.map((bus) => (
          <BusCard key={bus._id} bus={bus} searchParams={searchParams} onViewDetails={handleViewDetails} />
        ))}
      </div>

      {selectedBus && (
        <VehicleDetailsModal
          isOpen={isModalOpen}
          onClose={closeModal}
          vehicle={selectedBus}
        />
      )}
    </div>
  );
};

interface BusCardProps {
  bus: Bus;
  searchParams?: {
    from?: string;
    to?: string;
    date?: string;
    passengers?: number;
  };
  onViewDetails: (bus: Bus) => void;
}

const BusCard: React.FC<BusCardProps> = ({ bus, searchParams, onViewDetails }) => {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => setIsImageLoading(false);
  const handleImageError = () => {
    setIsImageLoading(false);
    setImageError(true);
  };

  const getAmenitiesText = () => {
    const amenities = [];
    if (bus.isAc) amenities.push('AC');
    if (bus.isSleeper) amenities.push('Sleeper');
    if (bus.amenities && bus.amenities.length > 0) amenities.push(...bus.amenities);
    return amenities.slice(0, 3).join(' • ');
  };

  const getPriceDisplay = () => {
    if (bus.pricing?.basePrice) {
      return (
        <div className="text-2xl font-bold text-green-600">
          {formatPrice(bus.pricing.basePrice)}
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
          
          {!imageError && bus.images && bus.images.length > 0 ? (
            <img
              src={bus.images[0].url}
              alt={`${bus.brand} ${bus.model}`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isImageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <Bus className="h-16 w-16 text-gray-400" />
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
                {bus.driver?.firstName} {bus.driver?.lastName}
              </h3>
            </div>
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
              <span className="font-medium">{bus.rating ? bus.rating.toFixed(1) : 'N/A'}</span>
              <span className="text-gray-500 ml-1">({bus.totalTrips || 0})</span>
            </div>
            <div className="text-sm text-gray-700 mb-1">{bus.brand} {bus.model}</div>
            <div className="text-sm text-gray-600 mb-1">
              {bus.isAc ? 'AC' : 'Non-AC'} {bus.transmission} • {bus.fuelType}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-1" />
              <span>{bus.seatingCapacity} Seater</span>
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
              {bus.schedule?.workingDays ? getWorkingDaysText(bus.schedule.workingDays) : 'N/A'}
            </div>
            <div className="flex items-center">
              <span className="mr-2">🕐</span>
              {bus.schedule?.workingHours ? `${bus.schedule.workingHours.start} - ${bus.schedule.workingHours.end}` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Pricing & Actions Section - Right Side */}
        <div className="w-48 p-6 flex flex-col justify-center items-end" style={{ width: '192px', flexShrink: 0 }}>
          {/* Pricing */}
          <div className="mb-4 text-right">
            <div className="text-xs text-gray-500 mb-1">Book at only</div>
            <div className="text-xl font-bold text-gray-900">
              ₹{bus.pricing?.basePrice ? bus.pricing.basePrice.toLocaleString() : 'N/A'}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <button 
              onClick={() => onViewDetails(bus)}
              className="flex items-center justify-center bg-white text-blue-600 border border-blue-600 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
            >
              <span className="mr-1">👁️</span>
              View Details
            </button>
            <button className="flex items-center justify-center bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
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
              {bus.driver?.firstName} {bus.driver?.lastName}
            </h3>
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Available
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
            <span className="font-medium">{bus.rating ? bus.rating.toFixed(1) : 'N/A'}</span>
            <span className="text-gray-500 ml-1">({bus.totalTrips || 0})</span>
          </div>
          <div className="text-sm text-gray-700">{bus.brand} {bus.model}</div>
          <div className="text-sm text-gray-600">
            {bus.isAc ? 'AC' : 'Non-AC'} {bus.transmission} • {bus.fuelType}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-1" />
            <span>{bus.seatingCapacity} Seater</span>
          </div>
        </div>

        {/* Middle Section - Vehicle Image */}
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse bg-gray-300 w-full h-full"></div>
            </div>
          )}
          
          {!imageError && bus.images && bus.images.length > 0 ? (
            <img
              src={bus.images[0].url}
              alt={`${bus.brand} ${bus.model}`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isImageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <Bus className="h-16 w-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Bottom Section - Pricing & Actions */}
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Book at only</div>
            <div className="text-2xl font-bold text-gray-900">
              ₹{bus.pricing?.basePrice ? bus.pricing.basePrice.toLocaleString() : 'N/A'}
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <button 
              onClick={() => onViewDetails(bus)}
              className="flex items-center justify-center bg-white text-blue-600 border border-blue-600 py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
            >
              <span className="mr-2">👁️</span>
              View Details
            </button>
            <button className="flex items-center justify-center bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusList;

