import React from 'react';
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
  MapPin, 
  Fuel, 
  Settings,
  Calendar,
  Phone
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
  isSleeper?: boolean;
  amenities: string[];
  images: Array<{
    url: string;
    caption?: string;
    isPrimary: boolean;
  }>;
  registrationNumber?: string;
  chassisNumber?: string;
  engineNumber?: string;
  operatingArea?: {
    cities: string[];
    states: string[];
    radius: number;
  };
  schedule?: {
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
  rating?: number;
  totalTrips?: number;
  totalEarnings?: number;
  isActive?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  booked?: boolean;
  driver?: {
    _id: string;
    firstName: string;
    lastName: string;
    rating: number;
    phone: string;
  };
  pricingReference: {
    category: string;
    vehicleType: string;
    vehicleModel: string;
  };
}

interface VehicleDetailsModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
}

const VehicleDetailsModal = ({ vehicle, isOpen, onClose }: VehicleDetailsModalProps) => {
    if (!vehicle) return null;

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

          

          

                     {/* Action Buttons */}
           <div className="flex justify-center">
             <Button variant="outline" className="px-8" onClick={onClose}>
               Close
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
