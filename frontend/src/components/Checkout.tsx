import React, { useState } from 'react';
import { X, MapPin, Calendar, Clock, Users, Car, CreditCard, Wallet, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BookingApiService from '@/services/bookingApi';
import { calculateDistance, calculateVehicleFare, formatPrice, LocationData } from '@/lib/distanceUtils';

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
  isAc: boolean;
  amenities: string[];
  images: Array<{
    url: string;
    caption?: string;
    isPrimary: boolean;
  }>;
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
}

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  bookingData: {
    from?: string;
    to?: string;
    fromData?: LocationData | null;
    toData?: LocationData | null;
    pickupDate?: string;
    pickupTime?: string;
    serviceType?: string;
    returnDate?: string;
  };
}

const Checkout: React.FC<CheckoutProps> = ({ isOpen, onClose, vehicle, bookingData }) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'upi' | 'netbanking' | 'card'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !vehicle) return null;

  // Calculate distance using utility function
  const distance = calculateDistance(bookingData.fromData, bookingData.toData);
  
  // Determine trip type based on service type
  const tripType = bookingData.serviceType === 'roundTrip' ? 'return' : 'one-way';
  
  // Calculate price using utility function
  const totalPrice = calculateVehicleFare(vehicle, distance, tripType);
  const tax = Math.round(totalPrice * 0.18); // 18% GST
  const finalPrice = totalPrice + tax;

  const handleBooking = async () => {
    setIsProcessing(true);
    
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('userToken') || 
                   localStorage.getItem('authToken');
      
      if (!token) {
        alert('Please log in to book a vehicle.');
        setIsProcessing(false);
        return;
      }

      // Initialize booking API service
      const bookingApi = new BookingApiService(
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      );

      // Prepare booking data
      const bookingPayload = {
        vehicleId: vehicle._id,
        pickup: {
          latitude: bookingData.fromData?.lat || 0,
          longitude: bookingData.fromData?.lng || 0,
          address: bookingData.from || 'Not specified',
          date: bookingData.pickupDate || new Date().toISOString(),
          time: bookingData.pickupTime || '09:00',
        },
        destination: {
          latitude: bookingData.toData?.lat || 0,
          longitude: bookingData.toData?.lng || 0,
          address: bookingData.to || 'Not specified',
        },
        date: bookingData.pickupDate || new Date().toISOString(),
        time: bookingData.pickupTime || '09:00',
        passengers: 1, // Number of passengers
        paymentMethod: selectedPaymentMethod,
        specialRequests: '',
      };

      // Debug: Log the payload being sent
      console.log('Debug - Booking payload being sent:', JSON.stringify(bookingPayload, null, 2));
      console.log('Debug - User token exists:', !!token);
      
      // Create booking
      await bookingApi.createBooking(bookingPayload);
      
      // Close checkout on success
      onClose();
    } catch (error) {
      console.error('Booking failed:', error);
      // Show user-friendly error message
      if (error instanceof Error) {
        alert(`Booking failed: ${error.message}`);
      } else {
        alert('Booking failed. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Complete Your Booking</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Trip Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              Trip Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm text-gray-500">From</p>
                    <p className="font-medium text-gray-900">{bookingData.from || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <p className="text-sm text-gray-500">To</p>
                    <p className="font-medium text-gray-900">{bookingData.to || 'Not specified'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                                         <p className="font-medium text-gray-900">{bookingData.pickupDate ? formatDate(bookingData.pickupDate) : 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                                         <p className="font-medium text-gray-900">{bookingData.pickupTime ? formatTime(bookingData.pickupTime) : 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Trip Type</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {bookingData.serviceType === 'oneWay' ? 'One Way' : 
                       bookingData.serviceType === 'roundTrip' ? 'Round Trip' : 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {bookingData.returnDate && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-500">Return Date</p>
                    <p className="font-medium text-gray-900">{formatDate(bookingData.returnDate)}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Vehicle Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Car className="h-5 w-5 mr-2 text-green-600" />
              Vehicle Details
            </h3>
            <div className="flex items-start space-x-4">
              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {vehicle.images && vehicle.images.length > 0 ? (
                  <img
                    src={vehicle.images[0].url}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <Car className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="text-lg font-semibold text-gray-900">
                  {vehicle.brand} {vehicle.model} ({vehicle.year})
                </h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{vehicle.color}</span>
                  <span>{vehicle.fuelType}</span>
                  <span>{vehicle.transmission}</span>
                  <span>{vehicle.isAc ? 'AC' : 'Non-AC'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{vehicle.seatingCapacity} Seater</span>
                </div>
                {vehicle.driver && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Driver:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {vehicle.driver.firstName} {vehicle.driver.lastName}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      ⭐ {vehicle.driver.rating}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Pricing Breakdown */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Distance</span>
                <span className="font-medium">{distance} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Distance Price</span>
                <span className="font-medium">₹{totalPrice.toLocaleString()}</span>
              </div>
              {distance > 50 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance Range Price</span>
                  <span className="font-medium">₹{totalPrice.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Taxes (18% GST)</span>
                <span className="font-medium">₹{tax.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                  <span className="text-xl font-bold text-green-600">₹{finalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment Method */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => setSelectedPaymentMethod('cash')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  selectedPaymentMethod === 'cash'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Wallet className="h-6 w-6" />
                  <span className="text-sm font-medium">Cash</span>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedPaymentMethod('upi')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  selectedPaymentMethod === 'upi'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Smartphone className="h-6 w-6" />
                  <span className="text-sm font-medium">UPI</span>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedPaymentMethod('netbanking')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  selectedPaymentMethod === 'netbanking'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <CreditCard className="h-6 w-6" />
                  <span className="text-sm font-medium">Net Banking</span>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedPaymentMethod('card')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  selectedPaymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <CreditCard className="h-6 w-6" />
                  <span className="text-sm font-medium">Card</span>
                </div>
              </button>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBooking}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                `Book Now - ₹${finalPrice.toLocaleString()}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
