import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui2/dialog';
import { Button } from '@/components/ui2/button';
import { Badge } from '@/components/ui2/badge';
import { Separator } from '@/components/ui2/separator';
import { 
  Star, 
  Wifi, 
  Tv, 
  Power, 
  Car, 
  Bus, 
  Clock, 
  MapPin, 
  Users, 
  Shield, 
  CreditCard, 
  Phone, 
  Minus, 
  Plus, 
  Fuel, 
  Settings,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Vehicle {
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

interface VehicleDetailsModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
}

const VehicleDetailsModal = ({ vehicle, isOpen, onClose }: VehicleDetailsModalProps) => {
  const navigate = useNavigate();
  const [vehicleCount, setVehicleCount] = useState(1);

  if (!vehicle) return null;

  const handleVehicleChange = (increment: boolean) => {
    if (increment && vehicleCount < vehicle.seatingCapacity) {
      setVehicleCount(vehicleCount + 1);
    } else if (!increment && vehicleCount > 1) {
      setVehicleCount(vehicleCount - 1);
    }
  };

  const handleProceedToPayment = () => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedIn) {
      // Show booking confirmation message
      alert(`Vehicle Booking Confirmed!
      
Vehicle: ${vehicle.brand} ${vehicle.model}
Driver: ${vehicle.driver?.firstName} ${vehicle.driver?.lastName}
Count: ${vehicleCount}
Total Fare: ₹${(vehicle.pricing?.basePrice || 0) * vehicleCount}
      
Redirecting to payment...`);
      
      // Navigate to payment page or booking confirmation
      // navigate('/payment', { state: { vehicle, count: vehicleCount } });
    } else {
      // Redirect to login
      navigate('/auth');
    }
  };

  const getVehicleTypeIcon = () => {
    switch (vehicle.type) {
      case 'car':
        return <Car className="w-6 h-6" />;
      case 'bus':
        return <Bus className="w-6 h-6" />;
      case 'auto':
        return <Car className="w-6 h-6" />;
      default:
        return <Car className="w-6 h-6" />;
    }
  };

  const getVehicleTypeLabel = () => {
    switch (vehicle.type) {
      case 'car':
        return 'Car';
      case 'bus':
        return 'Bus';
      case 'auto':
        return 'Auto-Rickshaw';
      default:
        return 'Vehicle';
    }
  };

  const getWorkingDaysText = (days: string[]) => {
    if (days.length === 7) return 'Daily';
    if (days.length === 5 && !days.includes('saturday') && !days.includes('sunday')) return 'Weekdays';
    return days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
  };

  const renderAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi className="w-5 h-5" />;
      case 'gps':
        return <MapPin className="w-5 h-5" />;
      case 'power':
        return <Power className="w-5 h-5" />;
      case 'bluetooth':
        return <div className="w-5 h-5 bg-muted rounded flex items-center justify-center text-xs">BT</div>;
      case 'fuel':
        return <Fuel className="w-5 h-5" />;
      case 'ac':
        return <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center text-xs text-blue-600 font-bold">AC</div>;
      case 'tv':
        return <Tv className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const totalFare = (vehicle.pricing?.basePrice || 0) * vehicleCount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {getVehicleTypeIcon()}
            {getVehicleTypeLabel()} Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vehicle Image and Basic Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vehicle Image */}
            <div className="space-y-4">
              <div className="relative">
                {vehicle.images && vehicle.images.length > 0 ? (
                  <img
                    src={vehicle.images[0].url}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-64 object-cover rounded-lg border border-border"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 rounded-lg border border-border flex items-center justify-center">
                    <Car className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                
                <div className="absolute top-4 left-4 space-y-2">
                  <Badge className="bg-primary text-primary-foreground">
                    {vehicle.isAc ? 'AC' : 'Non-AC'}
                  </Badge>
                  {vehicle.isSleeper && (
                    <Badge className="bg-secondary text-secondary-foreground block">
                      Sleeper
                    </Badge>
                  )}
                </div>
                
                <Badge className="absolute top-4 right-4 bg-green-100 text-green-800">
                  {vehicle.seatingCapacity} Seats
                </Badge>
              </div>
              
              {/* Driver Info */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {vehicle.driver?.firstName} {vehicle.driver?.lastName}
                </h3>
                <p className="text-muted-foreground">{vehicle.brand} {vehicle.model} ({vehicle.year})</p>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{vehicle.rating ? vehicle.rating.toFixed(1) : 'N/A'}</span>
                  <span className="text-muted-foreground">({vehicle.totalTrips || 0} trips)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{vehicle.driver?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Vehicle Type</Label>
                  <p className="font-medium">{getVehicleTypeLabel()}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Brand & Model</Label>
                  <p className="font-medium">{vehicle.brand} {vehicle.model}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Year</Label>
                  <p className="font-medium">{vehicle.year}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Color</Label>
                  <p className="font-medium capitalize">{vehicle.color}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Fuel Type</Label>
                  <p className="font-medium capitalize">{vehicle.fuelType}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Transmission</Label>
                  <p className="font-medium capitalize">{vehicle.transmission}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Seating Capacity</Label>
                  <p className="font-medium">{vehicle.seatingCapacity} Seats</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Registration</Label>
                  <p className="font-medium font-mono text-sm">{vehicle.registrationNumber}</p>
                </div>
              </div>

              {/* Schedule Info */}
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Operating Schedule
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Working Days:</span>
                    <p className="font-medium">{vehicle.schedule?.workingDays ? getWorkingDaysText(vehicle.schedule.workingDays) : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Working Hours:</span>
                    <p className="font-medium">
                      {vehicle.schedule?.workingHours ? `${vehicle.schedule.workingHours.start} - ${vehicle.schedule.workingHours.end}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {vehicle.amenities && vehicle.amenities.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold">Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {vehicle.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                          {renderAmenityIcon(amenity)}
                          <span className="text-sm capitalize">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Pricing Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pricing Details</h3>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Base Price */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Base Price</h4>
                  <div className="text-3xl font-bold text-blue-600">
                    ₹{vehicle.pricing?.basePrice ? vehicle.pricing.basePrice.toLocaleString() : 'N/A'}
                  </div>
                  <p className="text-sm text-gray-600">Per trip</p>
                </div>

                {/* Distance Pricing */}
                {vehicle.pricing?.distancePricing && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Distance-based Pricing</h4>
                    <div className="space-y-2">
                      {Object.entries(vehicle.pricing.distancePricing).map(([distance, price]) => (
                        <div key={distance} className="flex justify-between text-sm">
                          <span className="text-gray-600">{distance}:</span>
                          <span className="font-medium">₹{price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                Last updated: {vehicle.pricing?.lastUpdated ? new Date(vehicle.pricing.lastUpdated).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>

          <Separator />

          {/* Vehicle Count Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {getVehicleTypeIcon()}
              Select Number of Vehicles
            </h3>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Number of Vehicles</p>
                  <p className="text-sm text-gray-600">Select how many vehicles you want to book</p>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVehicleChange(false)}
                    disabled={vehicleCount <= 1}
                    className="w-10 h-10 p-0"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <div className="w-16 text-center">
                    <span className="text-2xl font-bold text-gray-800">{vehicleCount}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVehicleChange(true)}
                    disabled={vehicleCount >= vehicle.seatingCapacity}
                    className="w-10 h-10 p-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Total Fare Display */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Fare</p>
                    <div className="text-2xl font-bold text-blue-600">₹{totalFare.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      ₹{vehicle.pricing?.basePrice || 0} × {vehicleCount}
                    </p>
                    <p className="text-xs text-green-600">No convenience fee</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={handleProceedToPayment}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Proceed to Payment - ₹{totalFare.toLocaleString()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper component for labels
const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={className}>{children}</span>
);

export default VehicleDetailsModal;
