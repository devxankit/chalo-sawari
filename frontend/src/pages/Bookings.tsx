import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { List, Clock, MapPin, Calendar, User, Home, HelpCircle, X, Bus, CreditCard, Phone, Mail, Loader2, Download, Receipt, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TopNavigation from "@/components/TopNavigation";
import UserBottomNavigation from "@/components/UserBottomNavigation";
import { useUserAuth } from "@/contexts/UserAuthContext";
import apiService from "@/services/api";
import { toast } from "@/hooks/use-toast";
import LoginPrompt from "@/components/LoginPrompt";
import { formatDate, formatTime } from "@/lib/utils";
import { calculateDistance } from "@/lib/distanceUtils";

const Bookings = () => {
  const { user, isAuthenticated } = useUserAuth();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch user bookings
  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get all bookings for the user
      const response = await apiService.getUserBookings();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Bookings API response:', response);
      }
      
      if (response.success) {
        // Handle both possible response structures
        let bookingsData = [];
        if (response.data?.docs) {
          // New paginated structure
          bookingsData = response.data.docs;
        } else if (response.data?.bookings) {
          // Old structure
          bookingsData = response.data.bookings;
        } else if (Array.isArray(response.data)) {
          // Direct array
          bookingsData = response.data;
        } else {
          bookingsData = [];
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Setting bookings data:', bookingsData);
          console.log('Sample booking cancellation data:', bookingsData[0]?.cancellation);
        }
        setBookings(bookingsData);
      } else {
        setError(response.error?.message || response.message || 'Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      if (error.message?.includes('Authentication failed')) {
        setError('Your session has expired. Please login again.');
      } else if (error.message?.includes('Route not found')) {
        setError('API endpoint not found. Please check server configuration.');
      } else if (error.message?.includes('Failed to fetch')) {
        setError('Network error. Please check if the server is running.');
      } else {
        setError(`Failed to fetch bookings: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  // Refresh bookings when user returns to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        fetchBookings();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated]);

  // Helper function to get date from booking
  const getBookingDate = (booking) => {
    if (!booking) return null;
    // Try different possible date fields in order of preference
    return booking.tripDetails?.date || 
           booking.tripDetails?.pickup?.date || 
           booking.date || 
           booking.pickupDate || 
           booking.departureDate;
  };

  // Helper function to get pricing - use stored pricing from backend instead of recalculating
  const getBookingPricing = (booking) => {
    // Always use the stored pricing from backend as it's already calculated correctly
    // The backend calculates: 34 km × ₹7 = ₹238 and stores it in booking.pricing.totalAmount
    return booking.pricing || { totalAmount: 0, ratePerKm: 0, distance: 0 };
  };

  // Helper function to get time from booking
  const getBookingTime = (booking) => {
    if (!booking) return null;
    // Try different possible time fields in order of preference
    return booking.tripDetails?.time || 
           booking.tripDetails?.pickup?.time || 
           booking.time || 
           booking.pickupTime || 
           booking.departureTime;
  };

  // Helper function to get pickup address
  const getPickupAddress = (booking) => {
    if (!booking) return 'Pickup Location';
    return booking.tripDetails?.pickup?.address || 
           booking.pickupAddress || 
           booking.from || 
           'Pickup Location';
  };

  // Helper function to get destination address
  const getDestinationAddress = (booking) => {
    if (!booking) return 'Destination';
    return booking.tripDetails?.destination?.address || 
           booking.destinationAddress || 
           booking.to || 
           'Destination';
  };

  // Helper function to get return date from booking (for round trips)
  const getReturnDate = (booking) => {
    if (!booking) return null;
    // Try multiple possible return date fields
    return booking.tripDetails?.returnDate || 
           booking.tripDetails?.return?.date ||
           booking.tripDetails?.destination?.returnDate ||
           booking.returnDate || 
           booking.destinationReturnDate ||
           booking.returnTripDate ||
           booking.roundTripReturnDate ||
           booking.tripDetails?.roundTrip?.returnDate ||
           booking.tripDetails?.roundTripReturnDate ||
           null;
  };

  // Helper function to get trip type
  const getTripType = (booking) => {
    if (!booking) return 'one-way';
    // Try multiple possible trip type fields
    return booking.tripType || 
           booking.tripDetails?.tripType || 
           booking.tripDetails?.type ||
           booking.serviceType ||
           booking.bookingType ||
           (getReturnDate(booking) ? 'return' : 'one-way');
  };

  // Helper function to check if it's a round trip
  const isRoundTrip = (booking) => {
    // Check multiple conditions for round trip
    const hasReturnDate = !!getReturnDate(booking);
    const isReturnType = getTripType(booking) === 'return';
    const hasRoundTripFlag = booking.isRoundTrip === true;
    
    // Additional checks for round trip indicators
    const hasRoundTripInDetails = booking.tripDetails?.isRoundTrip === true;
    const hasReturnInDetails = !!booking.tripDetails?.return;
    const hasDestinationReturn = !!booking.tripDetails?.destination?.returnDate;
    const hasServiceTypeReturn = booking.serviceType === 'return' || booking.serviceType === 'round_trip';
    const hasBookingTypeReturn = booking.bookingType === 'return' || booking.bookingType === 'round_trip';
    
    // Check for any text that might indicate round trip
    const hasRoundTripText = 
      (booking.tripDetails?.description && 
       (booking.tripDetails.description.toLowerCase().includes('round') || 
        booking.tripDetails.description.toLowerCase().includes('return'))) ||
      (booking.notes && 
       (booking.notes.toLowerCase().includes('round') || 
        booking.notes.toLowerCase().includes('return'))) ||
      (booking.comments && 
       (booking.comments.toLowerCase().includes('round') || 
        booking.comments.toLowerCase().includes('return')));
    
    // Check for any field that might contain round trip info
    const hasAnyRoundTripField = 
      booking.roundTrip === true ||
      booking.isRoundTrip === true ||
      booking.round_trip === true ||
      booking.returnTrip === true ||
      booking.twoWay === true ||
      booking.two_way === true;
    
    // Debug logging for round trip detection
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Round Trip Check for booking:', {
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        hasReturnDate,
        isReturnType,
        hasRoundTripFlag,
        hasServiceTypeReturn,
        hasBookingTypeReturn,
        returnDate: getReturnDate(booking),
        tripType: getTripType(booking),
        serviceType: booking.serviceType,
        bookingType: booking.bookingType
      });
    }
    
    return hasReturnDate || isReturnType || hasRoundTripFlag || hasRoundTripInDetails || 
           hasReturnInDetails || hasDestinationReturn || hasServiceTypeReturn || hasBookingTypeReturn ||
           hasRoundTripText || hasAnyRoundTripField;
  };

  // Filter bookings based on active tab
  const upcomingBookings = Array.isArray(bookings) ? bookings.filter(booking => 
    ['pending', 'accepted', 'started', 'cancellation_requested'].includes(booking.status)
  ) : [];

  const pastBookings = Array.isArray(bookings) ? bookings.filter(booking => 
    ['completed', 'cancelled'].includes(booking.status)
  ) : [];

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setIsDetailModalOpen(true);
  };

  const handleCancelBooking = () => {
    setIsCancelModalOpen(true);
  };

  const confirmCancelBooking = async () => {
    try {
      if (!selectedBooking) return;
      
      // Request cancellation instead of direct cancellation
      const response = await apiService.requestCancellation(selectedBooking._id, 'User requested cancellation');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Cancellation response:', response);
      }
      
      if (response.success) {
        toast({
          title: "Cancellation Requested",
          description: "Your cancellation request has been submitted. Admin will review and process it.",
        });
        
        // Update local state to show cancellation requested
        setBookings(prevBookings => {
          const updatedBookings = prevBookings.map(booking => 
            booking._id === selectedBooking._id 
              ? { ...booking, status: 'cancellation_requested' }
              : booking
          );
          if (process.env.NODE_ENV === 'development') {
            console.log('Updated bookings state:', updatedBookings);
          }
          return updatedBookings;
        });
        
        setIsCancelModalOpen(false);
        setIsDetailModalOpen(false);
        setSelectedBooking(null);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to request cancellation",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error requesting cancellation:', error);
      toast({
        title: "Error",
        description: "Failed to request cancellation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const currentBookings = activeTab === "upcoming" ? upcomingBookings : pastBookings;
  
  // Debug logging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Current bookings state:', bookings);
    console.log('Upcoming bookings:', upcomingBookings);
    console.log('Past bookings:', pastBookings);
    console.log('Active tab:', activeTab);
    console.log('Current bookings for display:', currentBookings);
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <LoginPrompt 
        title="Login to View Bookings"
        description="Please login to view your booking history and manage your trips"
      />
    );
  }

  // Helper function to get payment status display
  const getPaymentStatusDisplay = (booking) => {
    if (!booking.payment) return null;
    
    // Ensure payment object has required properties
    const payment = booking.payment || {};
    
    if (payment.isPartialPayment) {
      const { onlinePaymentStatus, cashPaymentStatus, onlineAmount, cashAmount } = payment.partialPaymentDetails || {};
      
      return (
        <div className="space-y-0.5">
          <div className="text-xs text-gray-600">Payment Status:</div>
          <div className="flex items-center space-x-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${
              onlinePaymentStatus === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-xs text-gray-700">
              Online: ₹{onlineAmount} ({onlinePaymentStatus === 'completed' ? 'Paid' : 'Pending'})
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${
              cashPaymentStatus === 'collected' ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-xs text-gray-700">
              Cash: ₹{cashAmount} ({cashPaymentStatus === 'collected' ? 'Collected' : 'Pending'})
            </span>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-0.5">
        <div className="text-xs text-gray-600">Payment Method:</div>
        <div className="text-xs text-gray-700 capitalize">
          {payment.method === 'razorpay' ? 'Online Payment' : 
           payment.method === 'cash' ? 'Cash Payment' : 
           payment.method || 'Unknown'}
        </div>
        <div className="text-xs text-gray-600">Payment Status:</div>
        <div className="flex items-center space-x-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${
            payment.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
          }`}></div>
          <span className="text-xs text-gray-700">
            {payment.status === 'completed' ? 'Completed' : 'Pending'}
          </span>
        </div>
        {payment.transactionId && (
          <div className="text-xs text-gray-600">
            Transaction ID: {payment.transactionId}
          </div>
        )}
      </div>
    );
  };

  const downloadReceipt = async (booking) => {
    try {
      setIsDownloading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('userToken') || localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/bookings/${booking._id}/receipt`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || `receipt_${booking.bookingNumber}`;
        
        if (contentType && contentType.includes('application/pdf')) {
          // Handle PDF download
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', filename);
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          toast({
            title: "PDF Receipt Downloaded",
            description: "Your booking receipt has been downloaded successfully.",
          });
        } else if (contentType && contentType.includes('text/html')) {
          // Handle HTML download
          const htmlContent = await response.text();
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', filename);
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          toast({
            title: "HTML Receipt Downloaded",
            description: "Your booking receipt has been downloaded. Open it in a browser and print.",
          });
        } else {
          // Fallback for unknown content type
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', filename);
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          toast({
            title: "Receipt Downloaded",
            description: "Your booking receipt has been downloaded.",
          });
        }
        } else {
          let errorMessage = "Failed to download receipt";
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            // If response is not JSON, use status text
            errorMessage = response.statusText || errorMessage;
          }
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast({
        title: "Error",
        description: "Failed to download receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavigation/>
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">My Bookings</h1>
                     <Button 
             variant="outline" 
             size="sm"
             onClick={fetchBookings}
             className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
           >
             <Loader2 className="w-4 h-4 mr-2" />
             Refresh
           </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-40 flex border-b border-border bg-background flex-shrink-0">
        <button
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === "upcoming"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming Bookings
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === "past"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("past")}
        >
          Past Bookings
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 space-y-3 pb-24 md:pb-6 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-6">
            <Loader2 className="w-8 h-8 text-muted-foreground mx-auto mb-3 animate-spin" />
            <p className="text-muted-foreground text-sm">Loading your bookings...</p>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 mb-2 text-sm">{error}</p>
                             <Button 
                 variant="outline" 
                 onClick={fetchBookings}
                 className="text-red-600 border-red-300 hover:bg-red-50 text-sm"
               >
                 Try Again
               </Button>
            </div>
          </div>
        ) : currentBookings.length > 0 ? (
          currentBookings.map((booking) => (
            <Card key={booking._id} className="p-3 border border-border">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground text-sm leading-tight">
                    {getPickupAddress(booking)} → {getDestinationAddress(booking)}
                  </h3>
                  <p className="text-xs text-muted-foreground">ID: {booking.bookingNumber}</p>
                </div>
                <div className="flex flex-col space-y-0.5">
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    ['accepted', 'started'].includes(booking.status)
                      ? "bg-green-100 text-green-800" 
                      : booking.status === 'pending'
                      ? "bg-yellow-100 text-yellow-800"
                      : booking.status === 'completed'
                      ? "bg-blue-100 text-blue-800"
                      : booking.status === 'cancellation_requested'
                      ? "bg-orange-100 text-orange-800"
                      : booking.status === 'cancelled'
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {booking.status === 'cancellation_requested' 
                      ? 'Cancellation Requested'
                      : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)
                    }
                  </span>
                  
                  {/* Show refund status for cancelled bookings */}
                  {booking.status === 'cancelled' && booking.cancellation?.refundStatus && (
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                      booking.cancellation.refundStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : booking.cancellation.refundStatus === 'initiated'
                        ? 'bg-blue-100 text-blue-800'
                        : booking.cancellation.refundStatus === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : booking.cancellation.refundStatus === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      Refund: {booking.cancellation.refundStatus === 'pending' && 'Pending'}
                      {booking.cancellation.refundStatus === 'initiated' && 'Initiated'}
                      {booking.cancellation.refundStatus === 'completed' && 'Completed'}
                      {booking.cancellation.refundStatus === 'failed' && 'Failed'}
                    </span>
                  )}
                  
                  {/* Show request status for cancellation requested bookings */}
                  {booking.status === 'cancellation_requested' && booking.cancellation?.requestStatus && (
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                      booking.cancellation.requestStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : booking.cancellation.requestStatus === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      Request: {booking.cancellation.requestStatus === 'pending' && 'Pending'}
                      {booking.cancellation.requestStatus === 'approved' && 'Approved'}
                      {booking.cancellation.requestStatus === 'rejected' && 'Rejected'}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-1.5">
                {/* Main Date Display - Simple and Clear */}
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-foreground">
                    {formatDate(getBookingDate(booking))}
                    {getReturnDate(booking) && (
                      <span className="text-blue-600 font-medium">
                        {' → '}{formatDate(getReturnDate(booking))}
                      </span>
                    )}
                  </span>
                </div>
                
                
                {/* Round Trip Indicator - Only show if it's actually a round trip */}
                {getReturnDate(booking) && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-1.5">
                    <div className="flex items-center justify-center space-x-1 text-xs">
                      <span className="text-blue-700 font-medium">🔄</span>
                      <span className="text-blue-800 font-medium">
                        Round Trip: {formatDate(getBookingDate(booking))} → {formatDate(getReturnDate(booking))}
                      </span>
                      <span className="text-blue-600 font-bold">
                        ({(() => {
                          const start = new Date(getBookingDate(booking));
                          const end = new Date(getReturnDate(booking));
                          const diffTime = Math.abs(end.getTime() - start.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
                        })()})
                      </span>
                    </div>
                  </div>
                )}
                
                
                {/* Trip Type Label */}
                {(getReturnDate(booking) || getTripType(booking) === 'return') ? (
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3.5 h-3.5 text-muted-foreground flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">↔</span>
                    </div>
                    <span className="text-xs text-blue-600 font-medium">
                      Round Trip
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3.5 h-3.5 text-muted-foreground flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-600">→</span>
                    </div>
                    <span className="text-xs text-gray-600 font-medium">
                      One Way Trip
                    </span>
                  </div>
                )}
                
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-foreground">
                    {formatTime(getBookingTime(booking))}
                  </span>
                </div>
                {getReturnDate(booking) && (
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3.5 h-3.5 text-muted-foreground flex items-center justify-center">
                      <span className="text-xs font-bold text-green-600">📅</span>
                    </div>
                    <span className="text-xs text-green-600 font-medium">
                      {(() => {
                        const start = new Date(getBookingDate(booking));
                        const end = new Date(getReturnDate(booking));
                        const diffTime = Math.abs(end.getTime() - start.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return `${diffDays} day${diffDays > 1 ? 's' : ''} trip`;
                      })()}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Bus className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-foreground">
                      {booking.vehicle?.type} - {booking.vehicle?.brand} {booking.vehicle?.model}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-foreground font-medium">₹{getBookingPricing(booking).totalAmount || 0}</span>
                  </div>
                </div>
                
                {/* Night Stay Note - Only show for round trips */}
                {isRoundTrip(booking) && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-1">
                    <div className="flex items-start space-x-1.5">
                      <div className="w-3.5 h-3.5 text-amber-600 flex items-center justify-center mt-0.5">
                        <span className="text-xs font-bold">🌙</span>
                      </div>
                      <div className="text-xs text-amber-800">
                        <span className="font-medium">Note:</span> If night stay is required, please pay ₹500 to the driver in addition to the booking amount.
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Show refund amount for cancelled bookings */}
                {booking.status === 'cancelled' && booking.cancellation?.refundAmount && booking.cancellation.refundAmount > 0 && (
                  <div className="flex items-center space-x-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">
                      Refund: ₹{booking.cancellation.refundAmount}
                    </span>
                  </div>
                )}
                
                {/* Payment Status Display */}
                {getPaymentStatusDisplay(booking)}
              </div>
              
              <div className="flex space-x-1.5 mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-xs py-1.5"
                  onClick={() => handleViewDetails(booking)}
                >
                  View Details
                </Button>
                {['pending', 'accepted'].includes(booking.status) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50 text-xs py-1.5"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setIsCancelModalOpen(true);
                    }}
                  >
                    Request Cancellation
                  </Button>
                )}
                {booking.status === 'cancellation_requested' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-orange-600 border-orange-300 bg-orange-50 text-xs py-1.5"
                    disabled
                  >
                    Cancellation Requested
                  </Button>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-6">
            <List className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No {activeTab} bookings found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTab === 'upcoming' 
                ? "You haven't made any upcoming bookings yet." 
                : "You don't have any past bookings."
              }
            </p>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center justify-between text-lg md:text-xl">
              <span>Booking Details</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4 md:space-y-6">
              {/* Route Info */}
              <div className="bg-blue-50 p-3 md:p-6 rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3 mb-2 md:mb-3">
                  <h3 className="font-semibold text-base md:text-xl break-words leading-tight">
                    {getPickupAddress(selectedBooking)} → {getDestinationAddress(selectedBooking)}
                  </h3>
                  <span className={`px-2 md:px-3 py-1 text-xs md:text-sm rounded-full whitespace-nowrap self-start md:self-auto ${
                    ['accepted', 'started'].includes(selectedBooking.status)
                      ? "bg-green-100 text-green-800" 
                      : selectedBooking.status === 'pending'
                      ? "bg-yellow-100 text-yellow-800"
                      : selectedBooking.status === 'completed'
                      ? "bg-blue-100 text-blue-800"
                      : selectedBooking.status === 'cancellation_requested'
                      ? "bg-orange-100 text-orange-800"
                      : selectedBooking.status === 'cancelled'
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {selectedBooking.status === 'cancellation_requested' 
                      ? 'Cancellation Requested'
                      : selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)
                    }
                  </span>
                </div>
                <p className="text-sm md:text-base text-muted-foreground">Booking ID: {selectedBooking.bookingNumber}</p>
              </div>

              {/* Cancellation Request Status - Show prominently for cancellation requested bookings */}
              {selectedBooking.status === 'cancellation_requested' && selectedBooking.cancellation && (
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 p-4 md:p-6 rounded-lg">
                  <h4 className="font-semibold text-orange-800 text-base md:text-lg mb-3 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Cancellation Request Status
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm md:text-base">
                    <div className="flex items-center justify-between">
                      <span className="text-orange-700 font-medium">Request Status:</span>
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                        selectedBooking.cancellation.requestStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : selectedBooking.cancellation.requestStatus === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedBooking.cancellation.requestStatus === 'pending' && 'Pending Review'}
                        {selectedBooking.cancellation.requestStatus === 'approved' && 'Approved'}
                        {selectedBooking.cancellation.requestStatus === 'rejected' && 'Rejected'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-orange-700 font-medium">Requested On:</span>
                      <span className="text-orange-800">
                        {selectedBooking.cancellation.requestedAt ? 
                          new Date(selectedBooking.cancellation.requestedAt).toLocaleDateString() : 'N/A'
                        }
                      </span>
                    </div>
                    {selectedBooking.cancellation.requestReason && (
                      <div className="sm:col-span-2">
                        <span className="text-orange-700 font-medium">Reason:</span>
                        <p className="text-orange-800 mt-1 p-2 bg-orange-100 rounded">
                          {selectedBooking.cancellation.requestReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Refund Status Summary - Show prominently for cancelled bookings */}
              {selectedBooking.status === 'cancelled' && selectedBooking.cancellation && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 p-4 md:p-6 rounded-lg">
                  <h4 className="font-semibold text-red-800 text-base md:text-lg mb-3 flex items-center">
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Refund Status
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm md:text-base">
                    <div className="flex items-center justify-between">
                      <span className="text-red-700 font-medium">Refund Amount:</span>
                      <span className="text-red-800 font-bold text-lg">
                        ₹{selectedBooking.cancellation.refundAmount || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-red-700 font-medium">Refund Status:</span>
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                        selectedBooking.cancellation.refundStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : selectedBooking.cancellation.refundStatus === 'initiated'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedBooking.cancellation.refundStatus === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : selectedBooking.cancellation.refundStatus === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedBooking.cancellation.refundStatus === 'pending' && 'Pending'}
                        {selectedBooking.cancellation.refundStatus === 'initiated' && 'Initiated'}
                        {selectedBooking.cancellation.refundStatus === 'completed' && 'Completed'}
                        {selectedBooking.cancellation.refundStatus === 'failed' && 'Failed'}
                      </span>
                    </div>
                    {selectedBooking.cancellation.refundMethod && (
                      <div className="flex items-center justify-between">
                        <span className="text-red-700 font-medium">Refund Method:</span>
                        <span className="text-red-800">{selectedBooking.cancellation.refundMethod}</span>
                      </div>
                    )}
                    {selectedBooking.cancellation.refundCompletedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-red-700 font-medium">Completed On:</span>
                        <span className="text-red-800">
                          {new Date(selectedBooking.cancellation.refundCompletedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Download Receipt Button */}
              <div className="flex justify-center">
                <Button 
                  onClick={() => downloadReceipt(selectedBooking)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 md:px-6 py-2 md:py-3 text-sm md:text-base w-full md:w-auto"
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {isDownloading ? 'Downloading...' : 'Download Receipt'}
                </Button>
              </div>

              {/* Journey Details */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground text-base md:text-lg">Journey Details</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm md:text-base">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                    <span className="break-words">
                      {formatDate(getBookingDate(selectedBooking))}
                      {isRoundTrip(selectedBooking) && getReturnDate(selectedBooking) && (
                        <span className="text-blue-600 font-medium block mt-1">
                          Return: {formatDate(getReturnDate(selectedBooking))}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                    <span className="break-words">
                      {formatTime(getBookingTime(selectedBooking))}
                    </span>
                  </div>
                  {isRoundTrip(selectedBooking) && (
                    <div className="flex items-center space-x-2 sm:col-span-2">
                      <div className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">↔</span>
                      </div>
                      <span className="text-blue-600 font-medium">
                        Round Trip
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Receipt className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                    <span className="break-words">₹{getBookingPricing(selectedBooking).totalAmount || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Round Trip Information - Show prominently for round trips */}
              {isRoundTrip(selectedBooking) && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 md:p-6 rounded-lg">
                  <h4 className="font-semibold text-blue-800 text-base md:text-lg mb-3 flex items-center">
                    <div className="w-5 h-5 mr-2 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">↔</span>
                    </div>
                    Round Trip Details
                  </h4>
                  
                  {/* Visual Timeline */}
                  <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mb-1"></div>
                        <div className="text-xs text-blue-700 font-medium">Departure</div>
                        <div className="text-sm text-blue-800 font-bold">
                          {formatDate(getBookingDate(selectedBooking))}
                        </div>
                      </div>
                      <div className="flex-1 h-0.5 bg-blue-300 mx-2 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400"></div>
                      </div>
                      <div className="text-center">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full mb-1"></div>
                        <div className="text-xs text-indigo-700 font-medium">Return</div>
                        <div className="text-sm text-indigo-800 font-bold">
                          {getReturnDate(selectedBooking) ? formatDate(getReturnDate(selectedBooking)) : 'Return Date'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm md:text-base">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700 font-medium">Departure Date:</span>
                      <span className="text-blue-800 font-medium">
                        {formatDate(getBookingDate(selectedBooking))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700 font-medium">Return Date:</span>
                      <span className="text-blue-800 font-medium">
                        {getReturnDate(selectedBooking) ? formatDate(getReturnDate(selectedBooking)) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700 font-medium">Trip Type:</span>
                      <span className="text-blue-800 font-medium capitalize">
                        {getTripType(selectedBooking) === 'return' ? 'Round Trip' : 'One Way'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700 font-medium">Duration:</span>
                      <span className="text-blue-800 font-medium">
                        {getReturnDate(selectedBooking) && getBookingDate(selectedBooking) ? 
                          (() => {
                            const start = new Date(getBookingDate(selectedBooking));
                            const end = new Date(getReturnDate(selectedBooking));
                            const diffTime = Math.abs(end.getTime() - start.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
                          })() : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                  
                  {/* Additional Trip Info */}
                  {getReturnDate(selectedBooking) && getBookingDate(selectedBooking) && (
                    <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                      <div className="text-center">
                        <div className="text-sm text-blue-800 font-medium mb-1">Trip Summary</div>
                        <div className="text-lg text-blue-900 font-bold">
                          {(() => {
                            const start = new Date(getBookingDate(selectedBooking));
                            const end = new Date(getReturnDate(selectedBooking));
                            const diffTime = Math.abs(end.getTime() - start.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            return `${diffDays} Day${diffDays > 1 ? 's' : ''} Round Trip`;
                          })()}
                        </div>
                        <div className="text-xs text-blue-700 mt-1">
                          From {formatDate(getBookingDate(selectedBooking))} to {formatDate(getReturnDate(selectedBooking))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Show when return date is not available */}
                  {!getReturnDate(selectedBooking) && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-center">
                        <div className="text-sm text-yellow-800 font-medium mb-1">Round Trip Booking</div>
                        <div className="text-xs text-yellow-700">
                          This is a round trip booking. Return date details will be updated by the driver.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Vehicle Details */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground text-base md:text-lg">Vehicle Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm md:text-base">
                  <div className="break-words"><strong>Type:</strong> {selectedBooking.vehicle?.type || 'N/A'}</div>
                  <div className="break-words"><strong>Brand:</strong> {selectedBooking.vehicle?.brand || 'N/A'}</div>
                  <div className="sm:col-span-2 break-words"><strong>Registration:</strong> {selectedBooking.vehicle?.registrationNumber || 'N/A'}</div>
                </div>
              </div>

              {/* Driver Details */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground text-base md:text-lg">Driver Details</h4>
                <div className="space-y-2 text-sm md:text-base">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                    <span className="break-words">
                      {selectedBooking.driver?.firstName} {selectedBooking.driver?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                    <span className="break-words">{selectedBooking.driver?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">Rating:</span>
                    <span className="break-words">{selectedBooking.driver?.rating || 'N/A'}/5</span>
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground text-base md:text-lg">Trip Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm md:text-base">
                  <div className="break-words"><strong>Distance:</strong> {isRoundTrip(selectedBooking) ? (selectedBooking.tripDetails?.distance * 2).toFixed(1) : selectedBooking.tripDetails?.distance || 'N/A'} km</div>
                  <div className="break-words"><strong>Duration:</strong> {selectedBooking.tripDetails?.duration || 'N/A'} min</div>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground text-base md:text-lg">Pricing Breakdown</h4>
                <div className="space-y-2 text-sm md:text-base">
                  <div className="flex justify-between">
                    <span>Distance:</span>
                    <span className="break-words">{selectedBooking.tripDetails?.distance || 'N/A'} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate per km:</span>
                    <span className="break-words">₹{getBookingPricing(selectedBooking).ratePerKm || 'N/A'} /km</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total Amount:</span>
                    <span className="break-words">₹{getBookingPricing(selectedBooking).totalAmount || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Cancellation and Refund Information - Hidden */}
              {/* {selectedBooking.cancellation && (
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground text-base md:text-lg">Cancellation & Refund</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    {selectedBooking.cancellation.requestStatus && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Request Status:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          selectedBooking.cancellation.requestStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : selectedBooking.cancellation.requestStatus === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedBooking.cancellation.requestStatus.charAt(0).toUpperCase() + 
                           selectedBooking.cancellation.requestStatus.slice(1)}
                        </span>
                      </div>
                    )}
                    
                    {selectedBooking.cancellation.requestReason && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Cancellation Reason:</span>
                        <span className="text-sm text-gray-600 break-words max-w-xs text-right">
                          {selectedBooking.cancellation.requestReason}
                        </span>
                      </div>
                    )}

                    {selectedBooking.cancellation.refundAmount && selectedBooking.cancellation.refundAmount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Refund Amount:</span>
                        <span className="text-sm font-semibold text-green-600">
                          ₹{selectedBooking.cancellation.refundAmount}
                        </span>
                      </div>
                    )}

                    {selectedBooking.cancellation.refundStatus && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Refund Status:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          selectedBooking.cancellation.refundStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : selectedBooking.cancellation.refundStatus === 'initiated'
                            ? 'bg-blue-100 text-blue-800'
                            : selectedBooking.cancellation.refundStatus === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : selectedBooking.cancellation.refundStatus === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedBooking.cancellation.refundStatus === 'pending' && 'Pending'}
                          {selectedBooking.cancellation.refundStatus === 'initiated' && 'Initiated'}
                          {selectedBooking.cancellation.refundStatus === 'completed' && 'Completed'}
                          {selectedBooking.cancellation.refundStatus === 'failed' && 'Failed'}
                        </span>
                      </div>
                    )}

                    {selectedBooking.cancellation.refundCompletedAt && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Refund Completed:</span>
                        <span className="text-sm text-gray-600">
                          {new Date(selectedBooking.cancellation.refundCompletedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {selectedBooking.cancellation.approvedReason && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Admin Notes:</span>
                        <span className="text-sm text-gray-600 break-words max-w-xs text-right">
                          {selectedBooking.cancellation.approvedReason}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )} */}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Modal */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="max-w-md w-[95vw] p-4 md:p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg md:text-xl">Request Cancellation</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Are you sure you want to request cancellation for your booking from {selectedBooking ? getPickupAddress(selectedBooking) : 'Pickup'} to {selectedBooking ? getDestinationAddress(selectedBooking) : 'Destination'}?
              </p>
              
              {selectedBooking && isRoundTrip(selectedBooking) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">↔</span>
                    </div>
                    <span className="text-blue-800 font-medium text-sm">Round Trip</span>
                  </div>
                  <div className="text-xs text-blue-700">
                    {formatDate(getBookingDate(selectedBooking))} → {getReturnDate(selectedBooking) ? formatDate(getReturnDate(selectedBooking)) : 'N/A'}
                  </div>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                This will submit a cancellation request for admin review. You'll be notified once it's processed.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setIsCancelModalOpen(false)}
              >
                Keep Booking
              </Button>
              <Button 
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
                onClick={confirmCancelBooking}
              >
                Request Cancellation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UserBottomNavigation />
    </div>
  );
};

export default Bookings; 