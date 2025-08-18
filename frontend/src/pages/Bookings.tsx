import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { List, Clock, MapPin, Calendar, User, Home, HelpCircle, X, Bus, CreditCard, Phone, Mail, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TopNavigation from "@/components/TopNavigation";
import { useUserAuth } from "@/contexts/UserAuthContext";
import apiService from "@/services/api";
import { toast } from "@/hooks/use-toast";
import LoginPrompt from "@/components/LoginPrompt";

const Bookings = () => {
  const { user, isAuthenticated } = useUserAuth();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get all bookings for the user
        const response = await apiService.getUserBookings();
        
        console.log('Bookings API response:', response);
        
        if (response.success) {
          const bookingsData = response.data?.bookings || response.data || [];
          console.log('Setting bookings data:', bookingsData);
          setBookings(bookingsData);
        } else {
          setError(response.error?.message || response.message || 'Failed to fetch bookings');
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        if (error.message?.includes('Authentication failed')) {
          // Handle authentication errors
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

    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  // Filter bookings based on active tab
  const upcomingBookings = Array.isArray(bookings) ? bookings.filter(booking => 
    ['pending', 'accepted', 'started'].includes(booking.status)
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
      
      const response = await apiService.cancelBooking(selectedBooking._id, 'User cancelled');
      
      if (response.success) {
        toast({
          title: "Booking Cancelled",
          description: "Your booking has been cancelled successfully.",
        });
        
        // Update local state
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking._id === selectedBooking._id 
              ? { ...booking, status: 'cancelled' }
              : booking
          )
        );
        
        setIsCancelModalOpen(false);
        setIsDetailModalOpen(false);
        setSelectedBooking(null);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to cancel booking",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const currentBookings = activeTab === "upcoming" ? upcomingBookings : pastBookings;

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <LoginPrompt 
        title="Login to View Bookings"
        description="Please login to view your booking history and manage your trips"
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation/>
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">My Bookings</h1>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            <Loader2 className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-40 flex border-b border-border bg-background">
        <button
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === "upcoming"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("upcoming")}
        >
          Booking
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === "past"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("past")}
        >
          Past
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 pb-20">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading your bookings...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 mb-2">{error}</p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : currentBookings.length > 0 ? (
          currentBookings.map((booking) => (
            <Card key={booking._id} className="p-4 border border-border">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {booking.tripDetails?.pickup?.address || 'Pickup'} → {booking.tripDetails?.destination?.address || 'Destination'}
                  </h3>
                  <p className="text-sm text-muted-foreground">Booking ID: {booking.bookingNumber}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  ['accepted', 'started'].includes(booking.status)
                    ? "bg-green-100 text-green-800" 
                    : booking.status === 'pending'
                    ? "bg-yellow-100 text-yellow-800"
                    : booking.status === 'completed'
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {new Date(booking.tripDetails?.pickup?.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{booking.tripDetails?.pickup?.time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Bus className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {booking.vehicle?.type} - {booking.vehicle?.brand} {booking.vehicle?.model}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">₹{booking.pricing?.totalAmount}</span>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleViewDetails(booking)}
                >
                  View Details
                </Button>
                {['pending', 'accepted'].includes(booking.status) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setIsCancelModalOpen(true);
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <List className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No {activeTab} bookings found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {activeTab === 'upcoming' 
                ? "You haven't made any bookings yet." 
                : "You don't have any past bookings."
              }
            </p>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Booking Details</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDetailModalOpen(false)}
              >
               
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              {/* Route Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">
                    {selectedBooking.tripDetails?.pickup?.address || 'Pickup'} → {selectedBooking.tripDetails?.destination?.address || 'Destination'}
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    ['accepted', 'started'].includes(selectedBooking.status)
                      ? "bg-green-100 text-green-800" 
                      : selectedBooking.status === 'pending'
                      ? "bg-yellow-100 text-yellow-800"
                      : selectedBooking.status === 'completed'
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Booking ID: {selectedBooking.bookingNumber}</p>
              </div>

              {/* Journey Details */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Journey Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {new Date(selectedBooking.tripDetails?.pickup?.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedBooking.tripDetails?.pickup?.time}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bus className="w-4 h-4 text-muted-foreground" />
                    <span>Passengers: {selectedBooking.tripDetails?.passengers || 1}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span>₹{selectedBooking.pricing?.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Vehicle Details</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Type:</strong> {selectedBooking.vehicle?.type || 'N/A'}</div>
                  <div><strong>Brand:</strong> {selectedBooking.vehicle?.brand || 'N/A'}</div>
                  <div><strong>Model:</strong> {selectedBooking.vehicle?.model || 'N/A'}</div>
                  <div><strong>Color:</strong> {selectedBooking.vehicle?.color || 'N/A'}</div>
                  <div><strong>Registration:</strong> {selectedBooking.vehicle?.registrationNumber || 'N/A'}</div>
                </div>
              </div>

              {/* Driver Details */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Driver Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {selectedBooking.driver?.firstName} {selectedBooking.driver?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedBooking.driver?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">Rating:</span>
                    <span>{selectedBooking.driver?.rating || 'N/A'}/5</span>
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Trip Details</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Distance:</strong> {selectedBooking.tripDetails?.distance || 'N/A'} km</div>
                  <div><strong>Duration:</strong> {selectedBooking.tripDetails?.duration || 'N/A'} min</div>
                  <div><strong>Payment Method:</strong> {selectedBooking.payment?.method || 'N/A'}</div>
                  <div><strong>Payment Status:</strong> {selectedBooking.payment?.status || 'N/A'}</div>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Pricing Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Fare:</span>
                    <span>₹{selectedBooking.pricing?.baseFare || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distance Fare:</span>
                    <span>₹{selectedBooking.pricing?.distanceFare || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Surge Multiplier:</span>
                    <span>×{selectedBooking.pricing?.surgeMultiplier || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes (18% GST):</span>
                    <span>₹{selectedBooking.pricing?.taxes || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total Amount:</span>
                    <span>₹{selectedBooking.pricing?.totalAmount || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Modal */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to cancel your booking from {selectedBooking?.tripDetails?.pickup?.address || 'Pickup'} to {selectedBooking?.tripDetails?.destination?.address || 'Destination'}?
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Cancellation charges may apply based on the cancellation policy.
            </p>
            
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
                Cancel Booking
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background z-50">
        <div className="flex justify-around py-2">
          <Link to="/" className="flex flex-col items-center space-y-1">
            <Home className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Home</span>
          </Link>
          <Link to="/bookings" className="flex flex-col items-center space-y-1">
            <List className="w-5 h-5 text-primary" />
            <span className="text-xs text-primary font-medium">Bookings</span>
          </Link>
          <Link to="/help" className="flex flex-col items-center space-y-1">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Help</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center space-y-1">
            <User className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Account</span>
          </Link>
        </div>
      </div>
    </div>
  );
  };
  
  export default Bookings; 