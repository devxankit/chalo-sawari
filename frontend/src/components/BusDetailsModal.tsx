import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui2/dialog';
import { Button } from '@/components/ui2/button';
import { Badge } from '@/components/ui2/badge';
import { Separator } from '@/components/ui2/separator';
import { Star, Wifi, Tv, Power, Car, Clock, MapPin, Users, Shield, CreditCard, Phone, Minus, Plus } from 'lucide-react';
import BusLogo from '@/assets/BusLogo.png';
import CarBar from '@/assets/CarBar.png';
import BusBar from '@/assets/BusBar.png';

interface Bus {
  _id: string;
  operatorName: string;
  busName: string;
  busType: string;
  duration: string;
  rating: number;
  reviewCount: number;
  fare: number;
  seatsLeft: number;
  amenities: string[];
  image: string;
  isAc: boolean;
  isSleeper: boolean;
}

interface BusDetailsModalProps {
  bus: Bus | null;
  isOpen: boolean;
  onClose: () => void;
}

const BusDetailsModal = ({ bus, isOpen, onClose }: BusDetailsModalProps) => {
  const navigate = useNavigate();
  const [passengerCount, setPassengerCount] = useState(1);

  if (!bus) return null;

  const renderAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case 'wifi':
        return <Wifi className="w-5 h-5" />;
      case 'tv':
        return <Tv className="w-5 h-5" />;
      case 'power':
        return <Power className="w-5 h-5" />;
      case 'blanket':
        return <div className="w-5 h-5 bg-muted rounded flex items-center justify-center text-xs">B</div>;
      default:
        return <Car className="w-5 h-5" />;
    }
  };

  const getAmenityLabel = (amenity: string) => {
    switch (amenity) {
      case 'wifi':
        return 'Free WiFi';
      case 'tv':
        return 'Entertainment System';
      case 'power':
        return 'Power Outlets';
      case 'blanket':
        return 'Blankets Provided';
      default:
        return amenity;
    }
  };

  const handlePassengerChange = (increment: boolean) => {
    if (increment && passengerCount < bus.seatsLeft) {
      setPassengerCount(passengerCount + 1);
    } else if (!increment && passengerCount > 1) {
      setPassengerCount(passengerCount - 1);
    }
  };

  const handleProceedToPayment = () => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedIn) {
      // Show booking confirmation message
      alert(`Booking Confirmed!
      
Vehicle: ${bus.busName}
Operator: ${bus.operatorName}
From: Bangalore to Chennai
Date: 2024-01-15
Time: 22:00
Passengers: ${passengerCount}
Total Fare: ₹${bus.fare * passengerCount}
Seats: ${Array.from({ length: passengerCount }, (_, i) => `A${i + 1}`).join(', ')}

Your booking has been confirmed. You will receive a confirmation SMS shortly.`);
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

  const totalFare = bus.fare * passengerCount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Bus Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bus Image and Basic Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bus Image */}
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={bus.image}
                  alt={bus.busName}
                  className="w-full h-64 object-cover rounded-lg border border-border"
                />
                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                  {bus.isAc ? 'AC' : 'Non-AC'}
                </Badge>
                <Badge className="absolute top-4 right-4 bg-secondary text-secondary-foreground">
                  {bus.isSleeper ? 'Sleeper' : 'Seater'}
                </Badge>
              </div>
              
              {/* Operator Info */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{bus.operatorName}</h3>
                <p className="text-muted-foreground">{bus.busName}</p>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  <span className="font-medium">{bus.rating}</span>
                  <span className="text-muted-foreground">({bus.reviewCount} reviews)</span>
                </div>
              </div>
            </div>

            {/* Bus Details */}
            <div className="space-y-4">

              {/* Pricing */}
              <div className="space-y-2">
                <h4 className="font-semibold">Pricing</h4>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Starting from</span>
                  <span className="text-3xl font-bold text-primary">₹{bus.fare}</span>
                </div>
              </div>

              <Separator />

              {/* Bus Type */}
              <div className="space-y-2">
                <h4 className="font-semibold">Bus Type</h4>
                <p className="text-muted-foreground">{bus.busType}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Passenger Count Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
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
                    onClick={() => handlePassengerChange(false)}
                    disabled={passengerCount <= 1}
                    className="w-10 h-10 p-0"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <div className="w-16 text-center">
                    <span className="text-2xl font-bold text-gray-800">{passengerCount}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePassengerChange(true)}
                    disabled={passengerCount >= bus.seatsLeft}
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
                    <p className="text-sm text-gray-600">₹{bus.fare} × {passengerCount}</p>
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

export default BusDetailsModal; 