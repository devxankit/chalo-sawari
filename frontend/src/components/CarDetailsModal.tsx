import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui2/dialog';
import { Button } from '@/components/ui2/button';
import { Badge } from '@/components/ui2/badge';
import { Separator } from '@/components/ui2/separator';
import { Star, Wifi, Tv, Power, Car, Clock, MapPin, Users, Shield, CreditCard, Phone, Minus, Plus, Fuel, Settings } from 'lucide-react';
import CarLogo from '@/assets/CarLogo.png';
import CarBar from '@/assets/CarBar.png';

interface Car {
  _id: string;
  // Backend fields
  type: string;
  brand: string;
  model: string;
  seatingCapacity: number;
  isAc: boolean;
  amenities: string[];
  pricing?: {
    baseFare: number;
    perKmRate: number;
  };
  images?: Array<{
    url: string;
    isPrimary: boolean;
  }>;
  driver?: {
    firstName: string;
    lastName: string;
    rating: number;
    phone: string;
    isOnline: boolean;
  };
  // Frontend display fields (computed)
  operatorName: string;
  carName: string;
  carType: string;
  duration: string;
  rating: number;
  reviewCount: number;
  fare: number;
  seatsLeft: number;
  image: string;
  totalSeats: number;
  isBooked?: boolean;
  bookedDate?: string;
}

interface CarDetailsModalProps {
  car: Car | null;
  isOpen: boolean;
  onClose: () => void;
}

const CarDetailsModal = ({ car, isOpen, onClose }: CarDetailsModalProps) => {
  const navigate = useNavigate();
  const [carCount, setCarCount] = useState(1);

  if (!car) return null;

  const renderAmenityIcon = (amenity: string) => {
    switch (amenity) {
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
        return <Car className="w-5 h-5" />;
    }
  };

  const getAmenityLabel = (amenity: string) => {
    switch (amenity) {
      case 'wifi':
        return 'Free WiFi';
      case 'gps':
        return 'GPS Navigation';
      case 'power':
        return 'Power Outlets';
      case 'bluetooth':
        return 'Bluetooth Audio';
      case 'fuel':
        return 'Fuel Included';
      case 'ac':
        return 'Air Conditioning';
      case 'tv':
        return 'TV Entertainment';
      default:
        return amenity;
    }
  };

  const handleCarChange = (increment: boolean) => {
    if (increment && carCount < car.seatsLeft) {
      setCarCount(carCount + 1);
    } else if (!increment && carCount > 1) {
      setCarCount(carCount - 1);
    }
  };

  const handleProceedToPayment = () => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedIn) {
      // Show booking confirmation message
      alert(`Car Booking Confirmed!
      
Vehicle: ${car.carName}
Operator: ${car.operatorName}
From: Bangalore to Chennai
Date: 2024-01-15
Duration: ${car.duration}
Cars: ${carCount}
Total Fare: ₹${car.fare * carCount}
Car Numbers: ${Array.from({ length: carCount }, (_, i) => `CAR${i + 1}`).join(', ')}

Your car booking has been confirmed. You will receive a confirmation SMS shortly.`);
    } else {
      // Redirect to auth page
      navigate('/auth', { 
        state: { 
          returnUrl: '/bookings'
        } 
      });
    }
    
    // Close the modal
    onClose();
  };

  const totalFare = car.fare * carCount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Car Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Car Image and Basic Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Car Image */}
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={car.image}
                  alt={car.carName}
                  className="w-full h-64 object-cover rounded-lg border border-border"
                />
                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                  {car.isAc ? 'AC' : 'Non-AC'}
                </Badge>
                <Badge className="absolute top-4 right-4 bg-secondary text-secondary-foreground">
                  {car.seatsLeft} Seats Available
                </Badge>
              </div>
              
              {/* Operator Info */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{car.operatorName}</h3>
                <p className="text-muted-foreground">{car.carName}</p>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  <span className="font-medium">{car.rating}</span>
                  <span className="text-muted-foreground">({car.reviewCount} reviews)</span>
                </div>
              </div>
            </div>

            {/* Car Details */}
            <div className="space-y-4">

              {/* Pricing */}
              <div className="space-y-2">
                <h4 className="font-semibold">Pricing</h4>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Starting from</span>
                  <span className="text-3xl font-bold text-primary">₹{car.fare}</span>
                </div>
              </div>

              <Separator />

              {/* Car Specifications */}
              <div className="space-y-2">
                <h4 className="font-semibold">Car Specifications</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Car Type</p>
                    <p className="font-medium">{car.carType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Brand & Model</p>
                    <p className="font-medium">{car.brand} {car.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Seats</p>
                    <p className="font-medium">{car.totalSeats} persons</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available Seats</p>
                    <p className="font-medium">{car.seatsLeft} seats</p>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {car.amenities && car.amenities.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold">Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {car.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                          {renderAmenityIcon(amenity)}
                          <span className="text-sm">{getAmenityLabel(amenity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Car Count Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Car className="w-5 h-5" />
              Select Number of Vehicle
            </h3>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Number of Vehicles</p>
                  <p className="text-sm text-gray-600">Select how many vehicle want to book</p>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCarChange(false)}
                    disabled={carCount <= 1}
                    className="w-10 h-10 p-0"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <div className="w-16 text-center">
                    <span className="text-2xl font-bold text-gray-800">{carCount}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCarChange(true)}
                    disabled={carCount >= car.seatsLeft}
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
                    <p className="text-2xl font-bold text-blue-600">₹{totalFare.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">₹{car.fare} × {carCount}</p>
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

export default CarDetailsModal; 