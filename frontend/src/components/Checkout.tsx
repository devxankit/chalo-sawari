import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Clock, Users, Car, CreditCard, Wallet, Smartphone, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BookingApiService from '@/services/bookingApi';
import RazorpayService from '@/services/razorpayService';
import { calculateDistance, calculateVehicleFare, formatPrice, LocationData } from '@/lib/distanceUtils';
import { validateDateFormat, validateTimeFormat, getDefaultDate } from "@/lib/utils";
import { toast } from '@/hooks/use-toast';
import { useUserAuth } from "@/contexts/UserAuthContext";

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
  pricing: {
    autoPrice?: {
      oneWay: number;
      return: number;
    };
    distancePricing?: {
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
    lastUpdated?: string;
  };
  pricingReference: {
    category: string;
    vehicleType: string;
    vehicleModel: string;
  };
  createdAt?: string;
  updatedAt?: string;
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'razorpay'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const { user, isAuthenticated } = useUserAuth();

  // Early return if modal is not open or vehicle is not available
  if (!isOpen || !vehicle) return null;

  // Check if this vehicle supports partial payment (bus/car only, not auto)
  const supportsPartialPayment = vehicle.pricingReference?.category !== 'auto';
  
  // Calculate partial payment amounts for cash method
  const getPartialPaymentAmounts = () => {
    if (!supportsPartialPayment || selectedPaymentMethod !== 'cash') {
      return { onlineAmount: 0, cashAmount: totalPrice };
    }
    
    const onlineAmount = Math.round(totalPrice * 0.3);
    const cashAmount = totalPrice - onlineAmount;
    return { onlineAmount, cashAmount };
  };
  
  // Get partial payment amounts (will be calculated after totalPrice is available)
  const getPartialPaymentAmountsWithPrice = (price: number) => {
    if (!supportsPartialPayment || selectedPaymentMethod !== 'cash') {
      return { onlineAmount: 0, cashAmount: price };
    }
    
    const onlineAmount = Math.round(price * 0.3);
    const cashAmount = price - onlineAmount;
    return { onlineAmount, cashAmount };
  };

  // Debug: Log the booking data received
  console.log('Debug - Checkout received bookingData:', bookingData);
  console.log('Debug - Checkout received vehicle:', vehicle);

  // Calculate distance using utility function
  const distance = calculateDistance(bookingData.fromData, bookingData.toData);
  
  // Determine trip type based on service type
  const tripType = bookingData.serviceType === 'roundTrip' ? 'return' : 'one-way';
  
  // Calculate price using the same robust logic as listing pages
  const calculateTotalPrice = () => {
    if (!vehicle.pricing) return 0;
    
    let totalPrice = 0;
    
    if (vehicle.pricingReference?.category === 'auto') {
      // For auto vehicles, use fixed auto price and multiply by distance
      const autoPricing = vehicle.pricing.autoPrice;
      const ratePerKm = tripType === 'return' ? (autoPricing?.return || autoPricing?.oneWay || 0) : (autoPricing?.oneWay || autoPricing?.return || 0);
      totalPrice = ratePerKm * distance; // Multiply rate by distance for auto
    } else {
      // For car and bus vehicles, calculate distance-based pricing
      const distancePricing = vehicle.pricing.distancePricing;
      if (!distancePricing) return 0;
      
      // Try multiple possible trip type keys (same as listing pages)
      let pricing = distancePricing[tripType];
      if (!pricing) {
        // Fallback to other possible keys
        pricing = distancePricing['oneWay'] || 
                  distancePricing['one-way'] || 
                  distancePricing['oneway'] ||
                  distancePricing['return'] ||
                  Object.values(distancePricing)[0]; // Use first available
      }
      
      if (!pricing) return 0;
      
      // Determine rate based on distance tier
      let ratePerKm = 0;
      if (distance <= 50 && pricing['50km']) {
        ratePerKm = pricing['50km'];
      } else if (distance <= 100 && pricing['100km']) {
        ratePerKm = pricing['100km'];
      } else if (distance <= 150 && pricing['150km']) {
        ratePerKm = pricing['150km'];
      } else if (pricing['150km']) {
        ratePerKm = pricing['150km'];
      } else if (pricing['100km']) {
        ratePerKm = pricing['100km'];
      } else if (pricing['50km']) {
        ratePerKm = pricing['50km'];
      }
      
      totalPrice = ratePerKm * distance;
    }
    
    // Round to whole rupees (no decimal places)
    return Math.round(totalPrice);
  };
  
  const totalPrice = calculateTotalPrice();
  
  // Get partial payment amounts now that totalPrice is available
  const { onlineAmount, cashAmount } = getPartialPaymentAmountsWithPrice(totalPrice);
  
  // Get rate per km for display
  const getRatePerKm = () => {
    if (!vehicle.pricing) return 0;
    
    if (vehicle.pricingReference?.category === 'auto') {
      // For auto, show the fixed price
      const autoPricing = vehicle.pricing.autoPrice;
      const ratePerKm = tripType === 'return' ? (autoPricing?.return || autoPricing?.oneWay || 0) : (autoPricing?.oneWay || autoPricing?.return || 0);
      return ratePerKm;
    }
    
    // For car and bus, calculate rate per km based on distance
    const distancePricing = vehicle.pricing.distancePricing;
    if (!distancePricing) return 0;
    
    // Try multiple possible trip type keys (same as listing pages)
    let pricing = distancePricing[tripType];
    if (!pricing) {
      // Fallback to other possible keys
      pricing = distancePricing['oneWay'] || 
                distancePricing['one-way'] || 
                distancePricing['oneway'] ||
                distancePricing['return'] ||
                Object.values(distancePricing)[0]; // Use first available
    }
    
    if (!pricing) return 0;
    
    // Determine rate based on distance tier
    let ratePerKm = 0;
    if (distance <= 50 && pricing['50km']) {
      ratePerKm = pricing['50km'];
    } else if (distance <= 100 && pricing['100km']) {
      ratePerKm = pricing['100km'];
    } else if (distance <= 150 && pricing['150km']) {
      ratePerKm = pricing['150km'];
    } else if (pricing['150km']) {
      ratePerKm = pricing['150km'];
    } else if (pricing['100km']) {
      ratePerKm = pricing['100km'];
    } else if (pricing['50km']) {
      ratePerKm = pricing['50km'];
    }
    
    return ratePerKm;
  };

  const handleBooking = async () => {
    if (selectedPaymentMethod === 'cash') {
      if (supportsPartialPayment) {
        // For bus/car with cash method, show partial payment dialog
        setPaymentAmount(onlineAmount);
        setShowPaymentDialog(true);
      } else {
        // For auto vehicles, proceed with normal cash booking
        await processCashBooking();
      }
    } else if (selectedPaymentMethod === 'razorpay') {
      // For Razorpay payments, show payment dialog
      setPaymentAmount(totalPrice);
      setShowPaymentDialog(true);
    }
  };

  const processCashBooking = async () => {
    setIsProcessing(true);
    
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('userToken') || 
                   localStorage.getItem('authToken');
      
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to book a vehicle.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Initialize booking API service
      const bookingApi = new BookingApiService(
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      );

      // Prepare booking data with complete information
      const pickupDate = bookingData.pickupDate || getDefaultDate(1);
      const pickupTime = bookingData.pickupTime || '09:00';
      
      // Validate time format using utility function
      if (!validateTimeFormat(pickupTime)) {
        throw new Error('Invalid time format. Please use HH:MM format (e.g., 09:00)');
      }
      
      // Validate date format using utility function
      if (!validateDateFormat(pickupDate)) {
        throw new Error('Invalid date format. Please use YYYY-MM-DD format (e.g., 2025-08-04)');
      }
      
      // Get user information from context
      if (!user || !isAuthenticated) {
        toast({
          title: "Authentication Required",
          description: "Please log in to book a vehicle.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      const tripType = bookingData.serviceType === 'roundTrip' ? 'return' : 'one-way';
      
      // Ensure coordinates are valid numbers
      const fromLat = parseFloat(bookingData.fromData?.lat?.toString() || '0');
      const fromLng = parseFloat(bookingData.fromData?.lng?.toString() || '0');
      const toLat = parseFloat(bookingData.toData?.lat?.toString() || '0');
      const toLng = parseFloat(bookingData.toData?.lng?.toString() || '0');
      
      // Validate coordinates
      if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
        throw new Error('Invalid coordinates. Please select valid pickup and destination locations.');
      }
      
      const bookingPayload = {
        vehicleId: vehicle._id,
        pickup: {
          latitude: fromLat,
          longitude: fromLng,
          address: bookingData.from || 'Not specified',
        },
        destination: {
          latitude: toLat,
          longitude: toLng,
          address: bookingData.to || 'Not specified',
        },
        date: pickupDate,
        time: pickupTime,
        tripType: tripType,
        passengers: 1,
        paymentMethod: selectedPaymentMethod,
        specialRequests: '',
      };

      // Create booking
      await bookingApi.createBooking(bookingPayload);
      
      toast({
        title: "Booking Successful!",
        description: "Your booking has been confirmed. Pay in cash to the driver.",
      });
      
      // Close checkout on success
      onClose();
    } catch (error) {
      console.error('Booking failed:', error);
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processRazorpayPayment = async () => {
    setIsProcessing(true);
    
    try {
      // Check if user is authenticated (already done above with useUserAuth)

      // Get user information from context
      if (!user || !isAuthenticated) {
        toast({
          title: "Authentication Required",
          description: "Please log in to book a vehicle.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      if (!user.firstName || !user.email || !user.phone) {
        toast({
          title: "Profile Incomplete",
          description: "Please complete your profile with name, email, and phone number.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Initialize Razorpay service
      const razorpayService = new RazorpayService();
      
      // Process payment
      await razorpayService.processBookingPayment(
        {
          amount: paymentAmount, // Use paymentAmount which could be partial or full
          bookingId: `temp_${Date.now()}`, // Temporary ID, will be updated after payment
          description: `Booking for ${vehicle.brand} ${vehicle.model} from ${bookingData.from} to ${bookingData.to}${supportsPartialPayment && selectedPaymentMethod === 'cash' ? ` (Partial Payment: ₹${onlineAmount} online + ₹${cashAmount} cash)` : ''}`
        },
        {
          name: `${user.firstName} ${user.lastName || ''}`,
          email: user.email,
          phone: user.phone
        },
        async (paymentResponse, order) => { // Add order parameter
          // Payment successful, now create the actual booking
          try {
            console.log('=== PAYMENT SUCCESS - CREATING BOOKING ===');
            console.log('Payment response:', paymentResponse);
            console.log('Order data:', order);
            console.log('Total price used for payment:', totalPrice);
            console.log('Payment amount from response:', paymentResponse.amount);
            console.log('Payment ID for linking:', paymentResponse.paymentId);
            console.log('Order amount in paise:', order.amount);
            console.log('Order amount in rupees:', order.amount / 100);
            
            const bookingApi = new BookingApiService(
              import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
            );

            const pickupDate = bookingData.pickupDate || getDefaultDate(1);
            const pickupTime = bookingData.pickupTime || '09:00';
            const tripType = bookingData.serviceType === 'roundTrip' ? 'return' : 'one-way';
            
            const fromLat = parseFloat(bookingData.fromData?.lat?.toString() || '0');
            const fromLng = parseFloat(bookingData.fromData?.lng?.toString() || '0');
            const toLat = parseFloat(bookingData.toData?.lat?.toString() || '0');
            const toLng = parseFloat(bookingData.toData?.lng?.toString() || '0');
            
            const bookingPayload = {
              vehicleId: vehicle._id,
              pickup: {
                latitude: fromLat,
                longitude: fromLng,
                address: bookingData.from || 'Not specified',
              },
              destination: {
                latitude: toLat,
                longitude: toLng,
                address: bookingData.to || 'Not specified',
              },
              date: pickupDate,
              time: pickupTime,
              tripType: tripType,
              passengers: 1,
              specialRequests: '',
              // For partial payments, use 'cash' as method but backend will handle the split
              paymentMethod: selectedPaymentMethod
            };

            console.log('Creating booking with payload:', bookingPayload);

            // Create booking with payment confirmation
            const bookingResult = await bookingApi.createBooking(bookingPayload);
            console.log('Booking created successfully:', bookingResult);
            
            // For partial payments, process the partial payment
            if (supportsPartialPayment && selectedPaymentMethod === 'cash') {
              try {
                const token = localStorage.getItem('token') || 
                             localStorage.getItem('userToken') || 
                             localStorage.getItem('authToken');
                
                if (token) {
                  const partialPaymentResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/payments/process-partial-payment`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      bookingId: bookingResult.data.bookingId,
                      onlineAmount: onlineAmount,
                      totalAmount: totalPrice
                    })
                  });
                  
                  if (partialPaymentResponse.ok) {
                    console.log('Partial payment processed successfully');
                  } else {
                    console.error('Failed to process partial payment:', await partialPaymentResponse.json());
                  }
                }
              } catch (partialPaymentError) {
                console.error('Error processing partial payment:', partialPaymentError);
                // Don't fail the booking if partial payment processing fails
              }
            }
            
            // Link the payment to the booking
            try {
              const token = localStorage.getItem('token') || 
                           localStorage.getItem('userToken') || 
                           localStorage.getItem('authToken');
              
              if (token && paymentResponse.paymentId) {
                const linkResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/payments/link-booking`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    paymentId: paymentResponse.paymentId,
                    bookingId: bookingResult.data.bookingId
                  })
                });
                
                if (linkResponse.ok) {
                  console.log('Payment linked to booking successfully');
                } else {
                  console.error('Failed to link payment to booking:', await linkResponse.json());
                }
              }
            } catch (linkError) {
              console.error('Error linking payment to booking:', linkError);
              // Don't fail the booking if linking fails
            }
            
            toast({
              title: "Payment & Booking Successful!",
              description: supportsPartialPayment && selectedPaymentMethod === 'cash' 
                ? `Online payment of ₹${onlineAmount} processed. Pay remaining ₹${cashAmount} in cash to driver.`
                : "Your payment has been processed and booking confirmed.",
            });
            
            setShowPaymentDialog(false);
            onClose();
          } catch (bookingError) {
            console.error('Booking creation failed after payment:', bookingError);
            toast({
              title: "Payment Successful but Booking Failed",
              description: "Please contact support to resolve this issue.",
              variant: "destructive",
            });
          }
        },
        (paymentError) => {
          console.error('Payment failed:', paymentError);
          toast({
            title: "Payment Failed",
            description: paymentError instanceof Error ? paymentError.message : "Please try again.",
            variant: "destructive",
          });
        },
        () => {
          // Payment modal closed
          setShowPaymentDialog(false);
        }
      );
    } catch (error) {
      console.error('Payment processing failed:', error);
      toast({
        title: "Payment Processing Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
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
                <span className="font-medium">{distance.toFixed(1)} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rate per km</span>
                <span className="font-medium">₹{getRatePerKm()} /km</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                  <span className="text-xl font-bold text-green-600">₹{totalPrice.toLocaleString()}</span>
                </div>
                
                {/* Partial Payment Breakdown for Bus/Car with Cash Method */}
                {supportsPartialPayment && selectedPaymentMethod === 'cash' && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600 mb-2">Payment Breakdown (Cash Method):</div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Online Payment (30%)</span>
                        <span className="font-medium text-blue-600">₹{onlineAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cash to Driver (70%)</span>
                        <span className="font-medium text-green-600">₹{cashAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Payment Method */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
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
                  <span className="text-xs text-gray-500">Pay to driver</span>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedPaymentMethod('razorpay')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  selectedPaymentMethod === 'razorpay'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <CreditCard className="h-6 w-6" />
                  <span className="text-sm font-medium">Online Payment</span>
                  <span className="text-xs text-gray-500">UPI, Card, Net Banking</span>
                </div>
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-3 text-center">
              Razorpay securely handles all online payment methods including UPI, Credit/Debit Cards, Net Banking, and Digital Wallets.
            </p>
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
                supportsPartialPayment && selectedPaymentMethod === 'cash'
                  ? `Book Now - ₹${onlineAmount.toLocaleString()} Online + ₹${cashAmount.toLocaleString()} Cash`
                  : `Book Now - ₹${totalPrice.toLocaleString()}`
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Secure Payment
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Complete Your Payment</h3>
              <p className="text-gray-600">Amount: ₹{paymentAmount.toLocaleString()}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-900">Secure Payment Gateway</span>
              </div>
              <p className="text-xs text-gray-600">
                Your payment is secured by Razorpay, a trusted payment gateway used by millions of users.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={processRazorpayPayment}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  `Pay ₹${paymentAmount.toLocaleString()}`
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
                className="w-full"
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Checkout;

