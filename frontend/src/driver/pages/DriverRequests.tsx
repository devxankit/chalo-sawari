import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DriverTopNavigation from "@/driver/components/DriverTopNavigation";
import DriverFooter from "@/driver/components/DriverFooter";
import { ArrowLeft, CheckCircle, XCircle, Clock, MapPin, User, Car, Calendar, Clock as ClockIcon, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDriverAuth } from "@/contexts/DriverAuthContext";
import { toast } from "@/hooks/use-toast";

interface BookingRequest {
  _id: string;
  bookingNumber: string;
  user: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  vehicle: {
    type: string;
    brand: string;
    model: string;
    color: string;
  };
  tripDetails: {
    pickup: {
      address: string;
    };
    destination: {
      address: string;
    };
    date: string;
    time: string;
    passengers: number;
    distance: number;
  };
  pricing: {
    totalAmount: number;
    ratePerKm: number;
  };
  status: string;
  createdAt: string;
  payment: {
    method: string;
    status: string;
    isPartialPayment: boolean;
    partialPaymentDetails?: {
      onlineAmount: number;
      cashAmount: number;
      onlinePaymentStatus: string;
      cashPaymentStatus: string;
    };
  };
}

const DriverRequests = () => {
  const navigate = useNavigate();
  const { driver, isLoggedIn } = useDriverAuth();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      fetchDriverBookings();
    }
  }, [isLoggedIn]);

  const fetchDriverBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('driverToken');
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/driver/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.data.docs || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch booking requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      setUpdatingStatus(bookingId);
      const token = localStorage.getItem('driverToken');
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive",
        });
        return;
      }

      console.log('Debug - Updating booking status:', { bookingId, newStatus, token: token ? 'exists' : 'missing' });
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/driver/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      console.log('Debug - Response status:', response.status);
      console.log('Debug - Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Debug - Error response:', errorData);
        throw new Error(errorData.message || errorData.error?.message || 'Failed to update status');
      }

      const data = await response.json();
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking._id === bookingId 
          ? { ...booking, status: newStatus }
          : booking
      ));

      toast({
        title: "Success",
        description: `Booking ${newStatus} successfully`,
      });

      // Refresh bookings to get updated data
      fetchDriverBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const collectCashPayment = async (bookingId: string) => {
    try {
      setUpdatingStatus(bookingId);
      const token = localStorage.getItem('driverToken');
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/bookings/${bookingId}/collect-cash-payment`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to collect cash payment');
      }

      const data = await response.json();
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking._id === bookingId 
          ? {
              ...booking,
              payment: {
                ...booking.payment,
                partialPaymentDetails: {
                  ...booking.payment.partialPaymentDetails,
                  cashPaymentStatus: 'collected'
                }
              }
            }
          : booking
      ));

      toast({
        title: "Success",
        description: "Cash payment marked as collected successfully",
      });

      // Refresh bookings to get updated data
      fetchDriverBookings();
    } catch (error) {
      console.error('Error collecting cash payment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to collect cash payment",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'accepted':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Accepted</Badge>;
      case 'started':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Started</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-600 text-white">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusActions = (booking: BookingRequest) => {
    switch (booking.status) {
      case 'pending':
        return (
          <div className="flex space-x-2">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => updateBookingStatus(booking._id, 'accepted')}
              disabled={updatingStatus === booking._id}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
              onClick={() => updateBookingStatus(booking._id, 'cancelled')}
              disabled={updatingStatus === booking._id}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Decline
            </Button>
          </div>
        );
      case 'accepted':
        return (
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => updateBookingStatus(booking._id, 'started')}
            disabled={updatingStatus === booking._id}
          >
            <Clock className="w-4 h-4 mr-1" />
            Start Trip
          </Button>
        );
      case 'started':
        return (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => updateBookingStatus(booking._id, 'completed')}
            disabled={updatingStatus === booking._id}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Complete Trip
          </Button>
        );
      case 'completed':
        // Show payment collection button for partial payment bookings
        if (booking.payment?.isPartialPayment && 
            booking.payment.partialPaymentDetails?.cashPaymentStatus === 'pending') {
          return (
            <Button
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => collectCashPayment(booking._id)}
              disabled={updatingStatus === booking._id}
            >
              <CreditCard className="w-4 h-4 mr-1" />
              Collect Cash Payment
            </Button>
          );
        }
        return null;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DriverTopNavigation />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/driver')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Booking Requests</h1>
              <p className="text-gray-600">Manage incoming ride requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : bookings.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Booking Requests</h3>
              <p className="text-gray-500">You don't have any pending booking requests at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Car className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">#{booking.bookingNumber}</CardTitle>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          {getStatusBadge(booking.status)}
                          <span>•</span>
                          <span>{formatDate(booking.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ₹{booking.pricing.totalAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.pricing.ratePerKm}/km
                      </div>
                      {/* Show partial payment info for bus/car with cash method */}
                      {booking.payment?.isPartialPayment && (
                        <div className="mt-1 text-xs">
                          <div className="text-blue-600">
                            Online: ₹{booking.payment.partialPaymentDetails?.onlineAmount}
                          </div>
                          <div className="text-orange-600">
                            Cash: ₹{booking.payment.partialPaymentDetails?.cashAmount}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Trip Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Pickup</p>
                          <p className="text-sm text-gray-600">{booking.tripDetails.pickup.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Destination</p>
                          <p className="text-sm text-gray-600">{booking.tripDetails.destination.address}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Passenger</p>
                          <p className="text-sm text-gray-600">
                            {booking.user.firstName} {booking.user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{booking.user.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Date & Time</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(booking.tripDetails.date)} at {formatTime(booking.tripDetails.time)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trip Info */}
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {booking.tripDetails.distance.toFixed(1)} km
                      </div>
                      <div className="text-xs text-gray-500">Distance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {booking.tripDetails.passengers}
                      </div>
                      <div className="text-xs text-gray-500">Passengers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {booking.vehicle.brand} {booking.vehicle.model}
                      </div>
                      <div className="text-xs text-gray-500">Vehicle</div>
                    </div>
                  </div>

                  {/* Actions */}
                  {getStatusActions(booking) && (
                    <div className="pt-3 border-t">
                      {getStatusActions(booking)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DriverFooter />
    </div>
  );
};

export default DriverRequests; 