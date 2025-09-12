import React, { useState } from 'react';
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
  Phone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Vehicle {
  _id: string;
  type: 'bus' | 'car' | 'auto';
  brand: string;
  fuelType: string;
  seatingCapacity: number;
  isAc: boolean;
  isSleeper?: boolean;
  amenities: string[];
  images: Array<{
    url: string;
    caption?: string;
    isPrimary: boolean;
  }>;
  registrationNumber?: string;
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

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    if (vehicle.images && vehicle.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === vehicle.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const previousImage = () => {
    if (vehicle.images && vehicle.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? vehicle.images.length - 1 : prev - 1
      );
    }
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
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
            {/* Vehicle Image Gallery */}
            <div className="space-y-4">
              <div className="relative">
                {vehicle.images && vehicle.images.length > 0 ? (
                  <div className="space-y-4">
                    {/* Main Image Display */}
                    <div className="relative">
                      <img
                        src={vehicle.images[currentImageIndex].url}
                        alt={`${vehicle.brand} ${vehicle.model} - Image ${currentImageIndex + 1}`}
                        className="w-full h-64 object-cover rounded-lg border border-border"
                      />
                      
                      {/* Navigation Arrows */}
                      {vehicle.images.length > 1 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                            onClick={previousImage}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                            onClick={nextImage}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      
                      {/* Image Counter */}
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                        {currentImageIndex + 1} / {vehicle.images.length}
                      </div>
                    </div>
                    
                    {/* Thumbnail Gallery */}
                    {vehicle.images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {vehicle.images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => goToImage(index)}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden ${
                              index === currentImageIndex 
                                ? 'border-primary' 
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <img
                              src={image.url}
                              alt={`${vehicle.brand} ${vehicle.model} - Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
                <p className="text-muted-foreground">{vehicle.brand} {vehicle.model}</p>
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
                  <Label className="text-sm font-medium text-gray-600">Fuel Type</Label>
                  <p className="font-medium capitalize">{vehicle.fuelType}</p>
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
