import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { List, Clock, MapPin, Calendar, User, Home, HelpCircle, X, Bus, CreditCard, Phone, Mail, Loader2, Download, Receipt } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TopNavigation from "@/components/TopNavigation";
import { useUserAuth } from "@/contexts/UserAuthContext";
import apiService from "@/services/api";
import { toast } from "@/hooks/use-toast";
import LoginPrompt from "@/components/LoginPrompt";
import { formatDate, formatTime } from "@/lib/utils";

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
          
          // Debug: Log the first booking structure
          if (bookingsData.length > 0) {
            console.log('First booking structure:', bookingsData[0]);
            console.log('First booking tripDetails:', bookingsData[0].tripDetails);
            console.log('First booking date:', bookingsData[0].tripDetails?.pickup?.date);
            console.log('First booking time:', bookingsData[0].tripDetails?.pickup?.time);
            
            // Check all available fields
            console.log('All booking fields:', Object.keys(bookingsData[0]));
            if (bookingsData[0].tripDetails) {
              console.log('tripDetails fields:', Object.keys(bookingsData[0].tripDetails));
              if (bookingsData[0].tripDetails.pickup) {
                console.log('pickup fields:', Object.keys(bookingsData[0].tripDetails.pickup));
              }
            }
            
            // Check for alternative date/time fields
            console.log('Alternative date fields:', {
              directDate: bookingsData[0].date,
              pickupDate: bookingsData[0].pickupDate,
              departureDate: bookingsData[0].departureDate,
              tripDate: bookingsData[0].tripDetails?.date
            });
            
            console.log('Alternative time fields:', {
              directTime: bookingsData[0].time,
              pickupTime: bookingsData[0].pickupTime,
              departureTime: bookingsData[0].departureTime,
              tripTime: bookingsData[0].tripDetails?.time
            });
          }
          
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

  const downloadReceipt = async (booking) => {
    try {
      setIsDownloading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/bookings/${booking._id}/receipt`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('userToken') || localStorage.getItem('authToken')}`,
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
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to download receipt",
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
                    {(() => {
                      const dateValue = booking.tripDetails?.pickup?.date || 
                                      booking.date || 
                                      booking.pickupDate || 
                                      booking.departureDate ||
                                      booking.tripDetails?.date;
                      
                      return formatDate(dateValue);
                    })()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {(() => {
                      const timeValue = booking.tripDetails?.pickup?.time || 
                                      booking.time || 
                                      booking.pickupTime || 
                                      booking.departureTime ||
                                      booking.tripDetails?.time;
                      
                      return formatTime(timeValue);
                    })()}
                  </span>
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
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center justify-between text-lg md:text-xl">
              <span>Booking Details</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDetailModalOpen(false)}
                className="h-8 w-8 md:h-10 md:w-10"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4 md:space-y-6">
              {/* Route Info */}
              <div className="bg-blue-50 p-3 md:p-6 rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3 mb-2 md:mb-3">
                  <h3 className="font-semibold text-base md:text-xl break-words leading-tight">
                    {selectedBooking.tripDetails?.pickup?.address || 'Pickup'} → {selectedBooking.tripDetails?.destination?.address || 'Destination'}
                  </h3>
                  <span className={`px-2 md:px-3 py-1 text-xs md:text-sm rounded-full whitespace-nowrap self-start md:self-auto ${
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
                <p className="text-sm md:text-base text-muted-foreground">Booking ID: {selectedBooking.bookingNumber}</p>
              </div>

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
                      {(() => {
                        const dateValue = selectedBooking.tripDetails?.pickup?.date || 
                                        selectedBooking.tripDetails?.date ||
                                        selectedBooking.date || 
                                        selectedBooking.pickupDate || 
                                        selectedBooking.departureDate;
                        return formatDate(dateValue);
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                    <span className="break-words">
                      {(() => {
                        const timeValue = selectedBooking.tripDetails?.pickup?.time || 
                                        selectedBooking.tripDetails?.time ||
                                        selectedBooking.time || 
                                        selectedBooking.pickupTime || 
                                        selectedBooking.departureTime;
                        return formatTime(timeValue);
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Receipt className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                    <span className="break-words">₹{selectedBooking.pricing?.totalAmount || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground text-base md:text-lg">Vehicle Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm md:text-base">
                  <div className="break-words"><strong>Type:</strong> {selectedBooking.vehicle?.type || 'N/A'}</div>
                  <div className="break-words"><strong>Brand:</strong> {selectedBooking.vehicle?.brand || 'N/A'}</div>
                  <div className="break-words"><strong>Model:</strong> {selectedBooking.vehicle?.model || 'N/A'}</div>
                  <div className="break-words"><strong>Color:</strong> {selectedBooking.vehicle?.color || 'N/A'}</div>
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
                  <div className="break-words"><strong>Distance:</strong> {selectedBooking.tripDetails?.distance || 'N/A'} km</div>
                  <div className="break-words"><strong>Duration:</strong> {selectedBooking.tripDetails?.duration || 'N/A'} min</div>
                  <div className="break-words"><strong>Payment Method:</strong> {selectedBooking.payment?.method || 'N/A'}</div>
                  <div className="break-words"><strong>Payment Status:</strong> {selectedBooking.payment?.status || 'N/A'}</div>
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
                    <span className="break-words">₹{selectedBooking.pricing?.ratePerKm || 'N/A'} /km</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total Amount:</span>
                    <span className="break-words">₹{selectedBooking.pricing?.totalAmount || 'N/A'}</span>
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