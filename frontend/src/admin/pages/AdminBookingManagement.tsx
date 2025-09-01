import { useState, useEffect } from "react";
import AdminLayout from "@/admin/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  MapPin, 
  User, 
  Car, 
  Bus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Star,
  Phone,
  Mail,
  Navigation,
  CalendarDays,
  Ban,
  RotateCcw,
  X,
  CreditCard,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Download
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { adminBookings } from "@/services/adminApi";
import * as XLSX from 'xlsx';

interface Booking {
  _id: string;
  bookingNumber: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  driver: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  vehicle: {
    _id: string;
    type: 'car' | 'bus' | 'auto';
    brand: string;
    model: string;
    registrationNumber: string;
  };
  tripDetails: {
    pickup: {
      address: string;
      latitude: number;
      longitude: number;
    };
    destination: {
      address: string;
      latitude: number;
      longitude: number;
    };
    date: string;
    time: string;
    passengers: number;
    distance: number;
    duration: number;
  };
  pricing: {
    ratePerKm: number;
    totalAmount: number;
    tripType: 'one-way' | 'return';
  };
  status: 'pending' | 'accepted' | 'started' | 'completed' | 'cancelled' | 'cancellation_requested';
  payment: {
    method: 'cash' | 'upi' | 'netbanking' | 'card' | 'razorpay';
    status: 'pending' | 'completed' | 'failed';
    transactionId?: string;
    completedAt?: string;
    amount?: number;
    isPartialPayment?: boolean;
    partialPaymentDetails?: {
      onlineAmount: number;
      cashAmount: number;
      onlinePaymentStatus: 'pending' | 'completed' | 'failed';
      cashPaymentStatus: 'pending' | 'collected' | 'not_collected';
      onlinePaymentId?: string;
      cashCollectedAt?: string;
      cashCollectedBy?: string;
      cashCollectedByModel?: 'Driver' | 'Admin';
    };
  };
  cancellation?: {
    cancelledBy: string;
    cancelledByModel: 'User' | 'Driver' | 'Admin';
    cancelledAt: string;
    reason: string;
    refundAmount: number;
    refundStatus: 'pending' | 'processed' | 'completed' | 'initiated';
  };
  statusHistory: Array<{
    status: string;
    timestamp: string;
    updatedBy: string;
    updatedByModel: string;
    reason?: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface PaymentDetails {
  booking: Booking;
  payments: Array<{
    _id: string;
    amount: number;
    method: string;
    status: string;
    transactionId?: string;
    paymentDetails: {
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
    };
    refund?: {
      amount: number;
      reason: string;
      refundedAt: string;
      refundId: string;
      gatewayRefundId?: string;
    };
    createdAt: string;
  }>;
  refundDetails?: any;
  canProcessRefund: boolean;
}

const AdminBookingManagement = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // Refund form state
  const [refundMethod, setRefundMethod] = useState<'razorpay' | 'manual'>('razorpay');
  const [refundReason, setRefundReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // Status update form state
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusReason, setStatusReason] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    loadBookings();
  }, [currentPage]);

  useEffect(() => {
    handleSearch();
  }, [statusFilter, paymentFilter, dateFilter, searchTerm]);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const response = await adminBookings.getAll({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter === 'all' ? undefined : statusFilter,
        startDate: dateFilter === 'all' ? undefined : getDateFilterValue(dateFilter),
        endDate: dateFilter === 'all' ? undefined : new Date().toISOString().split('T')[0]
      });

      if (response.success) {
        // Handle the real API response structure
        const bookingsData = response.data.docs || response.data || [];
        setBookings(bookingsData);
        setTotalPages(response.data.totalPages || response.data.pages || 1);
        setFilteredBookings(bookingsData);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load bookings",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDateFilterValue = (filter: string): string => {
    const today = new Date();
    switch (filter) {
      case 'today':
        return today.toISOString().split('T')[0];
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString().split('T')[0];
      case 'month':
        const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);
        return monthAgo.toISOString().split('T')[0];
      default:
        return today.toISOString().split('T')[0];
    }
  };

  const getStartDate = (filter: string): string => {
    const today = new Date();
    switch (filter) {
      case 'today':
        return today.toISOString().split('T')[0];
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString().split('T')[0];
      case 'month':
        const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);
        return monthAgo.toISOString().split('T')[0];
      default:
        return today.toISOString().split('T')[0];
    }
  };

  const handleSearch = () => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${booking.user.firstName} ${booking.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${booking.driver.firstName} ${booking.driver.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.vehicle.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Apply payment filter
    if (paymentFilter !== 'all') {
      if (paymentFilter === 'partial') {
        filtered = filtered.filter(booking => booking.payment.isPartialPayment);
      } else {
        filtered = filtered.filter(booking => booking.payment.status === paymentFilter);
      }
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const startDate = getStartDate(dateFilter);
      
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.tripDetails.date);
        return bookingDate >= new Date(startDate);
      });
    }

    setFilteredBookings(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200 px-3 py-1.5 font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              Pending
            </div>
          </Badge>
        );
      case 'accepted':
        return (
          <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 px-3 py-1.5 font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Accepted
            </div>
          </Badge>
        );
      case 'started':
        return (
          <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200 px-3 py-1.5 font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
              Started
            </div>
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 px-3 py-1.5 font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Completed
            </div>
          </Badge>
        );
      case 'cancellation_requested':
        return (
          <Badge className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200 px-3 py-1.5 font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              Cancellation Requested
            </div>
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200 px-3 py-1.5 font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Cancelled
            </div>
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200 px-3 py-1.5 font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              Pending
            </div>
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 px-3 py-1.5 font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Paid
            </div>
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200 px-3 py-1.5 font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Failed
            </div>
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'car': return <Car className="w-4 h-4" />;
      case 'bus': return <Bus className="w-4 h-4" />;
      case 'auto': return <Car className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Not specified';
    return timeString;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getPaymentStatusDisplay = (booking: Booking) => {
    if (!booking.payment) return null;
    
    if (booking.payment.isPartialPayment) {
      const { onlinePaymentStatus, cashPaymentStatus, onlineAmount, cashAmount } = booking.payment.partialPaymentDetails || {};
      
      return (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-700">Partial Payment:</div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              onlinePaymentStatus === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-xs text-gray-600">
              Online: ₹{onlineAmount} ({onlinePaymentStatus === 'completed' ? 'Paid' : 'Pending'})
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              cashPaymentStatus === 'collected' ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-xs text-gray-600">
              Cash: ₹{cashAmount} ({cashPaymentStatus === 'collected' ? 'Collected' : 'Pending'})
            </span>
          </div>
        </div>
      );
    }
    
    return (
      <div className="text-xs text-gray-600">
        {booking.payment.method.toUpperCase()}: {booking.payment.status === 'completed' ? 'Completed' : 'Pending'}
      </div>
    );
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const handleViewPayment = async (booking: Booking) => {
    try {
      const response = await adminBookings.getPaymentDetails(booking._id);
      if (response.success) {
        // Handle the real API response structure
        const paymentData = response.data || response;
        setPaymentDetails(paymentData);
        setShowPaymentDetails(true);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load payment details",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading payment details:', error);
      toast({
        title: "Error",
        description: "Failed to load payment details. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRefund = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowRefundModal(true);
  };

  const handleMarkCashCollected = async (booking: Booking) => {
    try {
      const response = await adminBookings.markCashCollected(booking._id);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Cash payment marked as collected successfully",
        });
        loadBookings(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to mark cash as collected",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error marking cash as collected:', error);
      toast({
        title: "Error",
        description: "Failed to mark cash as collected. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleApproveCancellation = async (booking: Booking) => {
    try {
      const response = await adminBookings.approveCancellationRequest(booking._id);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Cancellation request approved successfully",
        });
        loadBookings(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to approve cancellation request",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error approving cancellation request:', error);
      toast({
        title: "Error",
        description: "Failed to approve cancellation request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRejectCancellation = async (booking: Booking) => {
    try {
      const response = await adminBookings.rejectCancellationRequest(booking._id);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Cancellation request rejected successfully",
        });
        loadBookings(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to reject cancellation request",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error rejecting cancellation request:', error);
      toast({
        title: "Error",
        description: "Failed to reject cancellation request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleInitiateRefund = async (booking: Booking) => {
    try {
      // Use processRefund instead of initiateRefund for actual refund processing
      const response = await adminBookings.processRefund(
        booking._id, 
        'razorpay', 
        'Driver cancelled trip', 
        'Refund processed for driver cancellation'
      );
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Refund processed successfully",
        });
        loadBookings(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to process refund",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error processing refund:', error);
      
      // Show more specific error messages
      let errorMessage = "Failed to process refund. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleCompleteRefund = async (booking: Booking) => {
    try {
      const response = await adminBookings.completeRefund(booking._id);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Refund marked as completed successfully",
        });
        loadBookings(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to complete refund",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error completing refund:', error);
      toast({
        title: "Error",
        description: "Failed to complete refund. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStatusUpdate = (booking: Booking) => {
    setSelectedBooking(booking);
    setNewStatus(booking.status);
    setShowStatusUpdateModal(true);
  };

  const updateBookingStatus = async () => {
    if (!selectedBooking || !newStatus) return;

    try {
      setIsUpdatingStatus(true);
      const response = await adminBookings.updateStatus(
        selectedBooking._id,
        newStatus,
        statusReason,
        statusNotes
      );

      if (response.success) {
        toast({
          title: "Success",
          description: `Booking status updated to ${newStatus} successfully`,
        });
        setShowStatusUpdateModal(false);
        setStatusReason('');
        setStatusNotes('');
        loadBookings(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update booking status",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const processRefund = async () => {
    if (!selectedBooking) return;

    try {
      setIsProcessingRefund(true);
      const response = await adminBookings.processRefund(
        selectedBooking._id,
        refundMethod,
        refundReason,
        adminNotes
      );

      if (response.success) {
        toast({
          title: "Success",
          description: `Refund processed successfully via ${refundMethod}`,
        });
        setShowRefundModal(false);
        setRefundReason('');
        setAdminNotes('');
        loadBookings(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to process refund",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: "Error",
        description: "Failed to process refund. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const refreshBookings = async () => {
    setIsRefreshing(true);
    await loadBookings();
    setIsRefreshing(false);
  };

  const exportToExcel = async () => {
    try {
      // Show loading state
      toast({
        title: "Exporting...",
        description: "Preparing data for export. Please wait.",
      });

      // Get all bookings data without pagination using the export API
      const response = await adminBookings.exportAll({
        status: statusFilter === 'all' ? undefined : statusFilter,
        startDate: dateFilter === 'all' ? undefined : getDateFilterValue(dateFilter),
        endDate: dateFilter === 'all' ? undefined : new Date().toISOString().split('T')[0],
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch data for export');
      }

      const allBookings = response.data || [];

      // Prepare data for export
      const exportData = allBookings.map(booking => ({
        'Booking Number': booking.bookingNumber,
        'Status': booking.status,
        'Date': formatDate(booking.tripDetails.date),
        'Time': formatTime(booking.tripDetails.time),
        'Customer Name': `${booking.user.firstName} ${booking.user.lastName}`,
        'Customer Phone': booking.user.phone,
        'Customer Email': booking.user.email || 'N/A',
        'Driver Name': `${booking.driver.firstName} ${booking.driver.lastName}`,
        'Driver Phone': booking.driver.phone,
        'Driver Email': booking.driver.email || 'N/A',
        'Vehicle Type': booking.vehicle.type,
        'Vehicle Brand': booking.vehicle.brand,
        'Vehicle Model': booking.vehicle.model,
        'Registration Number': booking.vehicle.registrationNumber,
        'Pickup Address': booking.tripDetails.pickup.address,
        'Destination Address': booking.tripDetails.destination.address,
        'Passengers': booking.tripDetails.passengers,
        'Distance (km)': booking.tripDetails.distance,
        'Duration (min)': booking.tripDetails.duration,
        'Rate per km': formatCurrency(booking.pricing.ratePerKm),
        'Total Amount': formatCurrency(booking.pricing.totalAmount),
        'Trip Type': booking.pricing.tripType,
        'Payment Method': booking.payment.method,
        'Payment Status': booking.payment.status,
        'Transaction ID': booking.payment.transactionId || 'N/A',
        'Payment Completed At': booking.payment.completedAt ? formatDate(booking.payment.completedAt) : 'N/A',
        'Is Partial Payment': booking.payment.isPartialPayment ? 'Yes' : 'No',
        'Online Amount': booking.payment.isPartialPayment && booking.payment.partialPaymentDetails ? formatCurrency(booking.payment.partialPaymentDetails.onlineAmount) : 'N/A',
        'Cash Amount': booking.payment.isPartialPayment && booking.payment.partialPaymentDetails ? formatCurrency(booking.payment.partialPaymentDetails.cashAmount) : 'N/A',
        'Online Payment Status': booking.payment.isPartialPayment && booking.payment.partialPaymentDetails ? booking.payment.partialPaymentDetails.onlinePaymentStatus : 'N/A',
        'Cash Payment Status': booking.payment.isPartialPayment && booking.payment.partialPaymentDetails ? booking.payment.partialPaymentDetails.cashPaymentStatus : 'N/A',
        'Cancellation Reason': booking.cancellation ? booking.cancellation.reason : 'N/A',
        'Cancelled By': booking.cancellation ? `${booking.cancellation.cancelledByModel}: ${booking.cancellation.cancelledBy}` : 'N/A',
        'Cancelled At': booking.cancellation ? formatDate(booking.cancellation.cancelledAt) : 'N/A',
        'Refund Amount': booking.cancellation ? formatCurrency(booking.cancellation.refundAmount) : 'N/A',
        'Refund Status': booking.cancellation ? booking.cancellation.refundStatus : 'N/A',
        'Created At': formatDate(booking.createdAt),
        'Last Updated': booking.statusHistory && booking.statusHistory.length > 0 ? formatDate(booking.statusHistory[booking.statusHistory.length - 1].timestamp) : 'N/A'
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const columnWidths = [
        { wch: 15 }, // Booking Number
        { wch: 12 }, // Status
        { wch: 12 }, // Date
        { wch: 10 }, // Time
        { wch: 20 }, // Customer Name
        { wch: 15 }, // Customer Phone
        { wch: 25 }, // Customer Email
        { wch: 20 }, // Driver Name
        { wch: 15 }, // Driver Phone
        { wch: 25 }, // Driver Email
        { wch: 12 }, // Vehicle Type
        { wch: 15 }, // Vehicle Brand
        { wch: 15 }, // Vehicle Model
        { wch: 20 }, // Registration Number
        { wch: 30 }, // Pickup Address
        { wch: 30 }, // Destination Address
        { wch: 10 }, // Passengers
        { wch: 12 }, // Distance
        { wch: 12 }, // Duration
        { wch: 15 }, // Rate per km
        { wch: 15 }, // Total Amount
        { wch: 12 }, // Trip Type
        { wch: 15 }, // Payment Method
        { wch: 15 }, // Payment Status
        { wch: 25 }, // Transaction ID
        { wch: 20 }, // Payment Completed At
        { wch: 15 }, // Is Partial Payment
        { wch: 15 }, // Online Amount
        { wch: 15 }, // Cash Amount
        { wch: 20 }, // Online Payment Status
        { wch: 20 }, // Cash Payment Status
        { wch: 25 }, // Cancellation Reason
        { wch: 20 }, // Cancelled By
        { wch: 15 }, // Cancelled At
        { wch: 15 }, // Refund Amount
        { wch: 15 }, // Refund Status
        { wch: 15 }, // Created At
        { wch: 15 }  // Last Updated
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');

      // Generate filename with current date and filters
      const currentDate = new Date().toISOString().split('T')[0];
      let filename = `chalo-sawari-bookings-${currentDate}`;
      
      if (statusFilter !== 'all') {
        filename += `-${statusFilter}`;
      }
      if (dateFilter !== 'all') {
        filename += `-${dateFilter}`;
      }
      
      filename += '.xlsx';

      // Save file
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Success",
        description: `Exported ${exportData.length} bookings to Excel file: ${filename}`,
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Error",
        description: "Failed to export bookings to Excel. Please try again.",
        variant: "destructive"
      });
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    active: bookings.filter(b => ['accepted', 'started'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    cancellationRequests: bookings.filter(b => b.status === 'cancellation_requested').length,
    paid: bookings.filter(b => b.payment.status === 'completed').length,
    pendingPayment: bookings.filter(b => b.payment.status === 'pending').length,
    partialPayments: bookings.filter(b => b.payment.isPartialPayment).length
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Enhanced Header Section */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                    <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                      Booking Management
                    </h1>
                    <p className="mt-1 sm:mt-2 text-base sm:text-lg text-gray-600">
                      Comprehensive oversight of all vehicle bookings, payments, and customer interactions
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 lg:mt-0 lg:ml-4 flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="h-8 px-2 sm:px-3"
                  >
                    <div className="grid grid-cols-2 gap-1 w-4 h-4">
                      <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                      <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                      <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                      <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                    </div>
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="h-8 px-2 sm:px-3"
                  >
                    <div className="flex flex-col gap-0.5 w-4 h-4">
                      <div className="w-full h-0.5 bg-current rounded-sm"></div>
                      <div className="w-full h-0.5 bg-current rounded-sm"></div>
                      <div className="w-full h-0.5 bg-current rounded-sm"></div>
                      <div className="w-full h-0.5 bg-current rounded-sm"></div>
                    </div>
                  </Button>
                </div>
                <Button
                  onClick={exportToExcel}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="hidden sm:inline">Export to Excel</span>
                  <span className="sm:hidden">Export</span>
                </Button>
                <Button
                  onClick={refreshBookings}
                  disabled={isRefreshing}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
                >
                  {isRefreshing ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  )}
                  <span className="hidden sm:inline">Refresh Data</span>
                  <span className="sm:hidden">Refresh</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
              {/* Total Bookings Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Bookings</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-xs text-gray-500 mt-1">All time bookings</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Pending Bookings Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Pending</p>
                    <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.pending}</p>
                    <p className="text-xs text-gray-500 mt-1">Awaiting confirmation</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Completed Bookings Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Completed</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.completed}</p>
                    <p className="text-xs text-gray-500 mt-1">Successful trips</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Paid Bookings Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Paid</p>
                    <p className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.paid}</p>
                    <p className="text-xs text-gray-500 mt-1">Revenue collected</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Partial Payment Bookings Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Partial Payments</p>
                    <p className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.partialPayments}</p>
                    <p className="text-xs text-gray-500 mt-1">Split payment bookings</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Cancellation Requests Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Cancellation Requests</p>
                    <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats.cancellationRequests}</p>
                    <p className="text-xs text-gray-500 mt-1">Pending approval</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
                    <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Partial Payment Summary */}
        {bookings.filter(b => b.payment.isPartialPayment).length > 0 && (
          <div className="px-4 sm:px-6 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-blue-900">Partial Payment Summary</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="bg-white rounded-xl p-3 sm:p-4 border border-blue-200">
                    <div className="text-xs sm:text-sm font-medium text-blue-700 mb-1">Total Partial Payments</div>
                    <div className="text-xl sm:text-2xl font-bold text-blue-900">{bookings.filter(b => b.payment.isPartialPayment).length}</div>
                    <div className="text-xs text-blue-600 mt-1">Split payment bookings</div>
                  </div>
                  <div className="bg-white rounded-xl p-3 sm:p-4 border border-blue-200">
                    <div className="text-xs sm:text-sm font-medium text-blue-700 mb-1">Pending Cash Collection</div>
                    <div className="text-xl sm:text-2xl font-bold text-orange-600">{bookings.filter(b => b.payment.isPartialPayment && b.payment.partialPaymentDetails?.cashPaymentStatus === 'pending').length}</div>
                    <div className="text-xs text-blue-600 mt-1">Awaiting cash collection</div>
                  </div>
                  <div className="bg-white rounded-xl p-3 sm:p-4 border border-blue-200">
                    <div className="text-xs sm:text-sm font-medium text-blue-700 mb-1">Completed Partial Payments</div>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">{bookings.filter(b => b.payment.isPartialPayment && b.payment.partialPaymentDetails?.cashPaymentStatus === 'collected').length}</div>
                    <div className="text-xs text-blue-600 mt-1">Fully collected</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Filters and Search Section */}
        <div className="px-4 sm:px-6 pb-6 sm:pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Advanced Filters</h3>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={exportToExcel}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export to Excel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setPaymentFilter('all');
                      setDateFilter('all');
                    }}
                    className="text-gray-600 hover:text-gray-800 w-full sm:w-auto"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Search Input */}
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-sm font-medium text-gray-700">Search Bookings</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <Input
                      id="search"
                      placeholder="Booking #, customer, driver..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10 h-10 sm:h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">Booking Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-10 sm:h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">⏳ Pending</SelectItem>
                      <SelectItem value="accepted">✅ Accepted</SelectItem>
                      <SelectItem value="started">🚗 Started</SelectItem>
                      <SelectItem value="completed">🎉 Completed</SelectItem>
                      <SelectItem value="cancellation_requested">🔄 Cancellation Requested</SelectItem>
                      <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Filter */}
                <div className="space-y-2">
                  <Label htmlFor="payment" className="text-sm font-medium text-gray-700">Payment Status</Label>
                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger className="h-10 sm:h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base">
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payments</SelectItem>
                      <SelectItem value="pending">⏳ Pending</SelectItem>
                      <SelectItem value="completed">✅ Completed</SelectItem>
                      <SelectItem value="failed">❌ Failed</SelectItem>
                      <SelectItem value="partial">💰 Partial Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Filter */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium text-gray-700">Date Range</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="h-10 sm:h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base">
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">📅 All Time</SelectItem>
                      <SelectItem value="today">🌅 Today</SelectItem>
                      <SelectItem value="week">📆 This Week</SelectItem>
                      <SelectItem value="month">📅 This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <Button 
                  onClick={handleSearch} 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-2 sm:py-3 h-10 sm:h-12 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
                >
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Bookings Cards */}
        <div className="px-4 sm:px-6 pb-6 sm:pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">All Bookings</h3>
                  <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium rounded-full">
                    {filteredBookings.length} bookings
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={exportToExcel}
                    variant="outline"
                    className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-12 sm:py-16">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full mb-4">
                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
                  </div>
                  <p className="text-base sm:text-lg font-medium text-gray-900 mb-2">Loading Bookings</p>
                  <p className="text-sm sm:text-base text-gray-600">Please wait while we fetch your data...</p>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full mb-4">
                    <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <p className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Bookings Found</p>
                  <p className="text-sm sm:text-base text-gray-600">Try adjusting your filters or search criteria</p>
                </div>
              ) : viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {filteredBookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300"
                    >
                      {/* Booking Header */}
                      <div className="mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <div className="font-mono font-bold text-base sm:text-lg text-blue-600">
                            {booking.bookingNumber}
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <span>📅 {formatDate(booking.tripDetails.date)}</span>
                          <span>🕐 {formatTime(booking.tripDetails.time)}</span>
                        </div>
                      </div>

                      {/* Payment Price Section */}
                      <div className="mb-4">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-green-800">Total Amount</p>
                              <p className="text-xs text-green-600">Trip Type: {booking.pricing.tripType === 'one-way' ? 'One Way' : 'Return Trip'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg sm:text-xl text-green-700">
                                {formatCurrency(booking.pricing.totalAmount)}
                              </p>
                              <p className="text-xs text-green-600 font-medium">
                                {formatCurrency(booking.pricing.ratePerKm)}/km
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Customer & Driver Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="text-xs sm:text-sm font-medium text-gray-700">Customer</span>
                          </div>
                          <p className="font-semibold text-sm sm:text-base text-gray-900">
                            {booking.user.firstName} {booking.user.lastName}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {booking.user.phone}
                          </p>
                          {booking.user.email && (
                            <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {booking.user.email}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-green-600" />
                            <span className="text-xs sm:text-sm font-medium text-gray-700">Driver</span>
                          </div>
                          <p className="font-semibold text-sm sm:text-base text-gray-900">
                            {booking.driver.firstName} {booking.driver.lastName}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {booking.driver.phone}
                          </p>
                        </div>
                      </div>

                      {/* Vehicle Info */}
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            {getVehicleIcon(booking.vehicle.type)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm sm:text-base text-gray-900">
                              {booking.vehicle.brand} {booking.vehicle.model}
                            </p>
                            <p className="text-xs font-mono text-gray-600 bg-white px-2 py-1 rounded border">
                              {booking.vehicle.registrationNumber}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Trip Details */}
                      <div className="mb-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-700">Pickup</p>
                            <p className="text-xs sm:text-sm text-gray-600">{booking.tripDetails.pickup.address}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Navigation className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-700">Destination</p>
                            <p className="text-xs sm:text-sm text-gray-600">{booking.tripDetails.destination.address}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                          <span>👥 {booking.tripDetails.passengers} passengers</span>
                          <span>📏 {booking.tripDetails.distance} km</span>
                          <span>⏱️ {booking.tripDetails.duration} min</span>
                        </div>
                      </div>

                      {/* Payment Status */}
                      <div className="mb-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-purple-600" />
                            <span className="text-xs sm:text-sm font-medium text-gray-700">Payment</span>
                            {booking.payment.isPartialPayment && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                💰 Partial Payment
                              </Badge>
                            )}
                          </div>
                          {getPaymentStatusBadge(booking.payment.status)}
                        </div>
                        
                        {/* Partial Payment Details */}
                        {booking.payment.isPartialPayment && (
                          <div className={`border rounded-lg p-3 ${
                            booking.payment.partialPaymentDetails?.cashPaymentStatus === 'collected' 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-orange-50 border-orange-200'
                          }`}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                              <div className="text-xs font-medium text-blue-800">Partial Payment Details</div>
                              {booking.payment.partialPaymentDetails?.cashPaymentStatus === 'pending' && (
                                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                  ⚠️ Cash Pending
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <span className="text-xs text-blue-700">Online Payment:</span>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    booking.payment.partialPaymentDetails?.onlinePaymentStatus === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                                  }`}></div>
                                  <span className="text-xs font-medium text-blue-800">
                                    ₹{booking.payment.partialPaymentDetails?.onlineAmount || 0}
                                  </span>
                                  <Badge variant={booking.payment.partialPaymentDetails?.onlinePaymentStatus === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                    {booking.payment.partialPaymentDetails?.onlinePaymentStatus === 'completed' ? 'Paid' : 'Pending'}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <span className="text-xs text-blue-700">Cash Payment:</span>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    booking.payment.partialPaymentDetails?.cashPaymentStatus === 'collected' ? 'bg-green-500' : 'bg-yellow-500'
                                  }`}></div>
                                  <span className="text-xs font-medium text-blue-800">
                                    ₹{booking.payment.partialPaymentDetails?.cashAmount || 0}
                                  </span>
                                  <Badge variant={booking.payment.partialPaymentDetails?.cashPaymentStatus === 'collected' ? 'default' : 'secondary'} className="text-xs">
                                    {booking.payment.partialPaymentDetails?.cashPaymentStatus === 'collected' ? 'Collected' : 'Pending'}
                                  </Badge>
                                </div>
                              </div>
                              
                              {booking.payment.partialPaymentDetails?.cashCollectedAt && (
                                <div className="text-xs text-green-600 pt-1 border-t border-green-200">
                                  Cash collected on: {new Date(booking.payment.partialPaymentDetails.cashCollectedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-gray-100">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(booking)}
                          className="flex-1 h-9 hover:bg-blue-50 hover:border-blue-300 text-xs sm:text-sm font-medium"
                        >
                          <Eye className="w-4 h-4 mr-2 text-blue-600" />
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewPayment(booking)}
                          className="flex-1 h-9 hover:bg-green-50 hover:border-green-300 text-xs sm:text-sm font-medium"
                        >
                          <CreditCard className="w-4 h-4 mr-2 text-green-600" />
                          Payment
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(booking)}
                          className="flex-1 h-9 hover:bg-purple-50 hover:border-purple-300 text-xs sm:text-sm font-medium"
                        >
                          <CheckSquare className="w-4 h-4 mr-2 text-purple-600" />
                          Status
                        </Button>
                      </div>

                                             {/* Cancellation Request Actions */}
                       {booking.status === 'cancellation_requested' && (
                         <div className="mt-4 pt-4 border-t border-orange-200 space-y-2">
                           <p className="text-sm font-medium text-orange-800 text-center mb-3">Cancellation Request</p>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleApproveCancellation(booking)}
                             className="w-full h-10 hover:bg-green-50 hover:border-green-300 text-sm font-medium transition-all duration-200"
                           >
                             <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                             Approve Cancellation
                           </Button>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleRejectCancellation(booking)}
                             className="w-full h-10 hover:bg-red-50 hover:border-red-300 text-sm font-medium transition-all duration-200"
                           >
                             <XCircle className="w-4 h-4 mr-2 text-red-600" />
                             Reject Cancellation
                           </Button>
                         </div>
                       )}

                       {/* Refund Button for Cancelled Bookings */}
                       {booking.status === 'cancelled' && 
                        booking.cancellation?.refundStatus === 'pending' && (
                         <div className="mt-4 pt-4 border-t border-red-200">
                           <p className="text-sm font-medium text-red-800 text-center mb-3">Refund Required</p>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleInitiateRefund(booking)}
                             className="w-full h-10 hover:bg-orange-50 hover:border-orange-300 text-sm font-medium transition-all duration-200"
                           >
                             <RotateCcw className="w-4 h-4 mr-2 text-orange-600" />
                             Initiate Refund
                           </Button>
                         </div>
                       )}

                       {/* Mark Refund Completed Button */}
                       {booking.status === 'cancelled' && 
                        booking.cancellation?.refundStatus === 'initiated' && (
                         <div className="mt-4 pt-4 border-t border-yellow-200">
                           <p className="text-sm font-medium text-yellow-800 text-center mb-3">Refund Initiated</p>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleCompleteRefund(booking)}
                             className="w-full h-10 hover:bg-green-50 hover:border-green-300 text-sm font-medium transition-all duration-200"
                           >
                             <CheckSquare className="w-4 h-4 mr-2 text-green-600" />
                             Mark Refund Completed
                           </Button>
                         </div>
                       )}

                       {/* Cash Collection Button for Partial Payment Bookings */}
                       {booking.payment.isPartialPayment && 
                        booking.payment.partialPaymentDetails?.cashPaymentStatus === 'pending' && (
                         <div className="mt-4 pt-4 border-t border-blue-200">
                           <p className="text-sm font-medium text-blue-800 text-center mb-3">Cash Collection Required</p>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleMarkCashCollected(booking)}
                             className="w-full h-10 hover:bg-green-50 hover:border-green-300 text-sm font-medium transition-all duration-200"
                           >
                             <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                             Mark Cash Collected
                           </Button>
                         </div>
                       )}
                                         </div>
                   ))}
                 </div>
               ) : (
                 <div className="overflow-x-auto -mx-4 sm:mx-0">
                   <div className="min-w-[1200px] sm:min-w-0">
                     <Table>
                       <TableHeader>
                         <TableRow className="bg-gray-50 hover:bg-gray-50">
                           <TableHead className="font-semibold text-gray-900 py-4 text-xs sm:text-sm">Booking #</TableHead>
                           <TableHead className="font-semibold text-gray-900 py-4 text-xs sm:text-sm">Customer</TableHead>
                           <TableHead className="font-semibold text-gray-900 py-4 text-xs sm:text-sm">Driver</TableHead>
                           <TableHead className="font-semibold text-gray-900 py-4 text-xs sm:text-sm">Vehicle</TableHead>
                           <TableHead className="font-semibold text-gray-900 py-4 text-xs sm:text-sm">Trip Details</TableHead>
                           <TableHead className="font-semibold text-gray-900 py-4 text-xs sm:text-sm">Amount</TableHead>
                           <TableHead className="font-semibold text-gray-900 py-4 text-xs sm:text-sm">Status</TableHead>
                           <TableHead className="font-semibold text-gray-900 py-4 text-xs sm:text-sm">Payment</TableHead>
                           <TableHead className="font-semibold text-gray-900 py-4 text-xs sm:text-sm">Actions</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {filteredBookings.map((booking, index) => (
                           <TableRow 
                             key={booking._id} 
                             className={`hover:bg-blue-50/50 transition-colors duration-150 ${
                               index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                             }`}
                           >
                             <TableCell className="py-4">
                               <div className="font-mono font-semibold text-blue-600 text-xs sm:text-sm">
                                 {booking.bookingNumber}
                               </div>
                             </TableCell>
                             <TableCell className="py-4">
                               <div className="space-y-1">
                                 <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                                   {booking.user.firstName} {booking.user.lastName}
                                 </p>
                                 <p className="text-xs text-gray-600 flex items-center gap-1">
                                   <Phone className="w-3 h-3" />
                                   {booking.user.phone}
                                 </p>
                                 {booking.user.email && (
                                   <p className="text-xs text-gray-500 flex items-center gap-1">
                                     <Mail className="w-3 h-3" />
                                     {booking.user.email}
                                   </p>
                                 )}
                               </div>
                             </TableCell>
                             <TableCell className="py-4">
                               <div className="space-y-1">
                                 <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                                   {booking.driver.firstName} {booking.driver.lastName}
                                 </p>
                                 <p className="text-xs text-gray-600 flex items-center gap-1">
                                   <Phone className="w-3 h-3" />
                                   {booking.driver.phone}
                                 </p>
                               </div>
                             </TableCell>
                             <TableCell className="py-4">
                               <div className="flex items-center gap-3">
                                 <div className="p-2 bg-gray-100 rounded-lg">
                                   {getVehicleIcon(booking.vehicle.type)}
                                 </div>
                                 <div className="space-y-1">
                                   <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                                     {booking.vehicle.brand} {booking.vehicle.model}
                                   </p>
                                   <p className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                     {booking.vehicle.registrationNumber}
                                   </p>
                                 </div>
                               </div>
                             </TableCell>
                             <TableCell className="py-4">
                               <div className="space-y-2 max-w-xs">
                                 <div className="flex items-start gap-2">
                                   <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                   <p className="text-xs sm:text-sm text-gray-900 font-medium">Pickup</p>
                                 </div>
                                 <p className="text-xs sm:text-sm text-gray-600 ml-6">
                                   {booking.tripDetails.pickup.address}
                                 </p>
                                 
                                 <div className="flex items-start gap-2">
                                   <Navigation className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                   <p className="text-xs sm:text-sm text-gray-900 font-medium">Destination</p>
                                 </div>
                                 <p className="text-xs sm:text-sm text-gray-600 ml-6">
                                   {booking.tripDetails.destination.address}
                                 </p>
                                 
                                 <div className="text-xs text-gray-500 ml-6 mt-2">
                                   📅 {formatDate(booking.tripDetails.date)} at {formatTime(booking.tripDetails.time)}
                                 </div>
                               </div>
                             </TableCell>
                             <TableCell className="py-4">
                               <div className="text-right">
                                 <p className="font-bold text-base sm:text-lg text-gray-900">
                                   {formatCurrency(booking.pricing.totalAmount)}
                                 </p>
                                 <p className="text-xs text-gray-500">
                                   {formatCurrency(booking.pricing.ratePerKm)}/km
                                 </p>
                               </div>
                             </TableCell>
                             <TableCell className="py-4">
                               {getStatusBadge(booking.status)}
                             </TableCell>
                             <TableCell className="py-4">
                               <div className="space-y-2">
                                 {getPaymentStatusBadge(booking.payment.status)}
                                 {getPaymentStatusDisplay(booking)}
                               </div>
                             </TableCell>
                             <TableCell className="py-4">
                               <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => handleViewDetails(booking)}
                                   className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-blue-50 hover:border-blue-300"
                                   title="View Details"
                                 >
                                   <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                                 </Button>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => handleViewPayment(booking)}
                                   className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-green-50 hover:border-green-300"
                                   title="Payment Details"
                                 >
                                   <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                 </Button>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => handleStatusUpdate(booking)}
                                   className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-purple-50 hover:border-purple-300"
                                   title="Update Status"
                                 >
                                   <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                                 </Button>
                                 
                                 {/* Cancellation Request Actions */}
                                 {booking.status === 'cancellation_requested' && (
                                   <>
                                     <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => handleApproveCancellation(booking)}
                                       className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-green-50 hover:border-green-300"
                                       title="Approve Cancellation"
                                     >
                                       <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                     </Button>
                                     <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => handleRejectCancellation(booking)}
                                       className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-red-50 hover:border-red-300"
                                       title="Reject Cancellation"
                                     >
                                       <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                                     </Button>
                                   </>
                                 )}

                                 {/* Refund Button for Cancelled Bookings */}
                                 {booking.status === 'cancelled' && 
                                  booking.cancellation?.refundStatus === 'pending' && (
                                   <Button
                                     size="sm"
                                     variant="outline"
                                     onClick={() => handleInitiateRefund(booking)}
                                     className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-orange-50 hover:border-orange-300"
                                     title="Initiate Refund"
                                   >
                                     <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                                   </Button>
                                 )}

                                 {/* Mark Refund Completed Button */}
                                 {booking.status === 'cancelled' && 
                                  booking.cancellation?.refundStatus === 'initiated' && (
                                   <Button
                                     size="sm"
                                     variant="outline"
                                     onClick={() => handleCompleteRefund(booking)}
                                     className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-green-50 hover:border-green-300"
                                     title="Mark Refund Completed"
                                   >
                                     <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                   </Button>
                                 )}

                                 {/* Cash Collection Button for Partial Payment Bookings */}
                                 {booking.payment.isPartialPayment && 
                                  booking.payment.partialPaymentDetails?.cashPaymentStatus === 'pending' && (
                                   <Button
                                     size="sm"
                                     variant="outline"
                                     onClick={() => handleMarkCashCollected(booking)}
                                     className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-green-50 hover:border-green-300"
                                     title="Mark Cash Collected"
                                   >
                                     <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                   </Button>
                                 )}
                               </div>
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                   </div>
                 </div>
               )}
             </div>
           </div>
         </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-6 pb-6 sm:pb-8">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-gray-600 text-center sm:text-left">
                    Showing page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
                    <span className="font-semibold text-gray-900">{totalPages}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 sm:px-4 py-2 h-9 sm:h-10 border-gray-300 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto text-sm"
                    >
                      <ChevronUp className="w-4 h-4 mr-2 rotate-90" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        if (totalPages <= 5) {
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`h-9 w-9 sm:h-10 sm:w-10 p-0 text-sm ${
                                currentPage === pageNum 
                                  ? 'bg-blue-600 text-white border-blue-600' 
                                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                        return null;
                      })}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 sm:px-4 py-2 h-9 sm:h-10 border-gray-300 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto text-sm"
                    >
                      Next
                      <ChevronDown className="w-4 h-4 ml-2 rotate-90" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold">
              Booking Details - {selectedBooking?.bookingNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-900">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Booking Number</Label>
                    <p className="mt-1 font-medium text-sm sm:text-base">{selectedBooking.bookingNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Trip Type</Label>
                    <p className="mt-1 font-medium capitalize text-sm sm:text-base">{selectedBooking.pricing.tripType}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Total Amount</Label>
                    <p className="mt-1 font-medium text-sm sm:text-base">{formatCurrency(selectedBooking.pricing.totalAmount)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Rate per KM</Label>
                    <p className="mt-1 font-medium text-sm sm:text-base">{formatCurrency(selectedBooking.pricing.ratePerKm)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Created At</Label>
                    <p className="mt-1 font-medium text-sm sm:text-base">{formatDate(selectedBooking.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Name</Label>
                    <p className="mt-1 font-medium">
                      {selectedBooking.user.firstName} {selectedBooking.user.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Phone</Label>
                    <p className="mt-1 font-medium">{selectedBooking.user.phone}</p>
                  </div>
                  {selectedBooking.user.email && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="mt-1 font-medium">{selectedBooking.user.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Driver Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Driver Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Name</Label>
                    <p className="mt-1 font-medium">
                      {selectedBooking.driver.firstName} {selectedBooking.driver.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Phone</Label>
                    <p className="mt-1 font-medium">{selectedBooking.driver.phone}</p>
                  </div>
                  {selectedBooking.driver.email && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="mt-1 font-medium">{selectedBooking.driver.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Vehicle Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Type</Label>
                    <div className="mt-1 flex items-center gap-2">
                      {getVehicleIcon(selectedBooking.vehicle.type)}
                      <span className="font-medium capitalize">{selectedBooking.vehicle.type}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Brand & Model</Label>
                    <p className="mt-1 font-medium">
                      {selectedBooking.vehicle.brand} {selectedBooking.vehicle.model}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Registration</Label>
                    <p className="mt-1 font-medium">{selectedBooking.vehicle.registrationNumber}</p>
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Trip Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Pickup Location</Label>
                    <p className="mt-1 font-medium">{selectedBooking.tripDetails.pickup.address}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Destination</Label>
                    <p className="mt-1 font-medium">{selectedBooking.tripDetails.destination.address}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Date & Time</Label>
                    <p className="mt-1 font-medium">
                      {formatDate(selectedBooking.tripDetails.date)} at {formatTime(selectedBooking.tripDetails.time)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Passengers</Label>
                    <p className="mt-1 font-medium">{selectedBooking.tripDetails.passengers}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Distance</Label>
                    <p className="mt-1 font-medium">{selectedBooking.tripDetails.distance} km</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Duration</Label>
                    <p className="mt-1 font-medium">{selectedBooking.tripDetails.duration} minutes</p>
                  </div>
                </div>
              </div>

              {/* Status History */}
              {selectedBooking.statusHistory && selectedBooking.statusHistory.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Status History</h3>
                  <div className="space-y-3">
                    {selectedBooking.statusHistory.map((history, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium capitalize">{history.status}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(history.timestamp)} - {history.updatedByModel}
                          </p>
                          {history.reason && (
                            <p className="text-sm text-gray-600 mt-1">{history.reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cancellation Details */}
              {selectedBooking.cancellation && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Cancellation Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Cancelled By</Label>
                      <p className="mt-1 font-medium capitalize">{selectedBooking.cancellation.cancelledByModel}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Cancelled At</Label>
                      <p className="mt-1 font-medium">{formatDate(selectedBooking.cancellation.cancelledAt)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Reason</Label>
                      <p className="mt-1 font-medium">{selectedBooking.cancellation.reason}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Refund Amount</Label>
                      <p className="mt-1 font-medium">{formatCurrency(selectedBooking.cancellation.refundAmount)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Refund Status</Label>
                      <div className="mt-1">
                        <Badge className={
                          selectedBooking.cancellation.refundStatus === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }>
                          {selectedBooking.cancellation.refundStatus === 'completed' ? 'Completed' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold">
              Payment Details - {paymentDetails?.booking.bookingNumber}
            </DialogTitle>
          </DialogHeader>
          {paymentDetails && (
            <div className="space-y-6">
              {/* Payment Information */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-900">Payment Information</h3>
                {paymentDetails.payments && paymentDetails.payments.length > 0 ? (
                  <div className="space-y-4">
                    {paymentDetails.payments.map((payment, index) => (
                      <div key={index} className="border rounded-lg p-3 sm:p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Amount</Label>
                            <p className="mt-1 font-medium text-sm sm:text-base">{formatCurrency(payment.amount)}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Method</Label>
                            <p className="mt-1 font-medium capitalize text-sm sm:text-base">{payment.method}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Status</Label>
                            <div className="mt-1">{getPaymentStatusBadge(payment.status)}</div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Date</Label>
                            <p className="mt-1 font-medium text-sm sm:text-base">{formatDate(payment.createdAt)}</p>
                          </div>
                          {payment.transactionId && (
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Transaction ID</Label>
                              <p className="mt-1 font-medium font-mono text-xs sm:text-sm">{payment.transactionId}</p>
                            </div>
                          )}
                          {payment.paymentDetails?.razorpayPaymentId && (
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Razorpay Payment ID</Label>
                              <p className="mt-1 font-medium font-mono text-xs sm:text-sm">{payment.paymentDetails.razorpayPaymentId}</p>
                            </div>
                          )}
                        </div>

                        {/* Refund Information */}
                        {payment.refund && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Refund Information</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Refund Amount</Label>
                                <p className="mt-1 font-medium text-sm sm:text-base">{formatCurrency(payment.refund.amount)}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Refund Reason</Label>
                                <p className="mt-1 font-medium text-sm sm:text-base">{payment.refund.reason}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Refund Date</Label>
                                <p className="mt-1 font-medium text-sm sm:text-base">{formatDate(payment.refund.refundedAt)}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Refund ID</Label>
                                <p className="mt-1 font-medium font-mono text-xs sm:text-sm">{payment.refund.refundId}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm sm:text-base">No payment records found for this booking.</p>
                )}
              </div>

              {/* Refund Actions */}
              {paymentDetails.canProcessRefund && (
                <div className="border-t pt-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-900">Process Refund</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => {
                        setShowPaymentDetails(false);
                        setShowRefundModal(true);
                      }}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Process Refund
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Modal */}
      <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Process Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="refundMethod">Refund Method</Label>
              <Select value={refundMethod} onValueChange={(value: 'razorpay' | 'manual') => setRefundMethod(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select refund method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="razorpay">Razorpay (Automatic)</SelectItem>
                  <SelectItem value="manual">Manual (Offline)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="refundReason">Refund Reason</Label>
              <Textarea
                id="refundReason"
                placeholder="Enter refund reason..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="adminNotes">Admin Notes</Label>
              <Textarea
                id="adminNotes"
                placeholder="Enter admin notes (optional)..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={processRefund}
                disabled={isProcessingRefund || !refundReason}
                className="flex-1"
              >
                {isProcessingRefund ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Process Refund
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRefundModal(false)}
                disabled={isProcessingRefund}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Update Modal */}
      <Dialog open={showStatusUpdateModal} onOpenChange={setShowStatusUpdateModal}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Update Booking Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newStatus">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="started">Started</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="statusReason">Reason for Change</Label>
              <Textarea
                id="statusReason"
                placeholder="Enter reason for status change..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="statusNotes">Admin Notes</Label>
              <Textarea
                id="statusNotes"
                placeholder="Enter admin notes (optional)..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={updateBookingStatus}
                disabled={isUpdatingStatus || !newStatus || !statusReason}
                className="flex-1"
              >
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Update Status
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowStatusUpdateModal(false)}
                disabled={isUpdatingStatus}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBookingManagement;
