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
  Edit,
  Trash2,
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
  Check,
  X
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  driverName: string;
  driverPhone: string;
  vehicleType: 'car' | 'bus' | 'truck' | 'bike';
  vehicleModel: string;
  vehicleNumber: string;
  from: string;
  to: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  passengers: number;
  amount: number;
  advanceAmount: number;
  remainingAmount: number;
  cashAmount: number;
  status: 'ongoing' | 'active' | 'completed' | 'cancelled' | 'pending';
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  bookingDate: string;
  rating?: number;
  review?: string;
}

const AdminBookingManagement = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [actionBookingId, setActionBookingId] = useState<string>("");
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    setIsLoggedIn(true);
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
             const mockBookings: Booking[] = [
         {
           id: "1",
           bookingNumber: "BK-2024-001",
           customerName: "Ajay Panchal",
           customerPhone: "+91 98765-43210",
           customerEmail: "ajay@example.com",
           driverName: "Rahul Kumar",
           driverPhone: "+91 98765-43211",
           vehicleType: "car",
           vehicleModel: "Swift Dzire",
           vehicleNumber: "DL-01-AB-1234",
           from: "Delhi",
           to: "Mumbai",
           departureDate: "2024-03-15",
           departureTime: "08:00 AM",
           arrivalDate: "2024-03-16",
           arrivalTime: "08:00 AM",
           passengers: 4,
           amount: 8500,
           advanceAmount: 3000,
           remainingAmount: 5500,
           cashAmount: 5500,
           status: "completed",
           paymentStatus: "paid",
           bookingDate: "2024-03-10",
           rating: 4.5,
           review: "Great service, driver was professional"
         },
         {
           id: "2",
           bookingNumber: "BK-2024-002",
           customerName: "Priya Sharma",
           customerPhone: "+91 98765-43212",
           customerEmail: "priya@example.com",
           driverName: "Amit Singh",
           driverPhone: "+91 98765-43213",
           vehicleType: "bus",
           vehicleModel: "Volvo B8R",
           vehicleNumber: "MH-02-CD-5678",
           from: "Mumbai",
           to: "Pune",
           departureDate: "2024-03-20",
           departureTime: "10:00 AM",
           arrivalDate: "2024-03-20",
           arrivalTime: "02:00 PM",
           passengers: 35,
           amount: 25000,
           advanceAmount: 10000,
           remainingAmount: 15000,
           cashAmount: 15000,
           status: "active",
           paymentStatus: "paid",
           bookingDate: "2024-03-12"
         },
         {
           id: "3",
           bookingNumber: "BK-2024-003",
           customerName: "Rajesh Kumar",
           customerPhone: "+91 98765-43214",
           customerEmail: "rajesh@example.com",
           driverName: "Suresh Kumar",
           driverPhone: "+91 98765-43215",
           vehicleType: "truck",
           vehicleModel: "Tata 407",
           vehicleNumber: "KA-03-EF-9012",
           from: "Bangalore",
           to: "Chennai",
           departureDate: "2024-03-25",
           departureTime: "06:00 AM",
           arrivalDate: "2024-03-26",
           arrivalTime: "06:00 AM",
           passengers: 2,
           amount: 15000,
           advanceAmount: 5000,
           remainingAmount: 10000,
           cashAmount: 0,
           status: "ongoing",
           paymentStatus: "pending",
           bookingDate: "2024-03-14"
         },
         {
           id: "4",
           bookingNumber: "BK-2024-004",
           customerName: "Meera Patel",
           customerPhone: "+91 98765-43216",
           customerEmail: "meera@example.com",
           driverName: "Vikram Singh",
           driverPhone: "+91 98765-43217",
           vehicleType: "bike",
           vehicleModel: "Pulsar 150",
           vehicleNumber: "TN-04-GH-3456",
           from: "Chennai",
           to: "Bangalore",
           departureDate: "2024-03-18",
           departureTime: "07:00 AM",
           arrivalDate: "2024-03-18",
           arrivalTime: "05:00 PM",
           passengers: 1,
           amount: 3000,
           advanceAmount: 3000,
           remainingAmount: 0,
           cashAmount: 0,
           status: "cancelled",
           paymentStatus: "refunded",
           bookingDate: "2024-03-08"
         }
       ];

      setBookings(mockBookings);
      setFilteredBookings(mockBookings);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.to.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    if (paymentFilter !== "all") {
      filtered = filtered.filter(booking => booking.paymentStatus === paymentFilter);
    }

    if (dateFilter !== "all") {
      const today = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case "today":
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.departureDate);
            return bookingDate.toDateString() === today.toDateString();
          });
          break;
        case "week":
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.departureDate);
            return bookingDate >= filterDate;
          });
          break;
        case "month":
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.departureDate);
            return bookingDate >= filterDate;
          });
          break;
      }
    }

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter, paymentFilter, dateFilter]);

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'car': return <Car className="w-5 h-5" />;
      case 'bus': return <Bus className="w-5 h-5" />;
      case 'truck': return <Car className="w-5 h-5" />;
      case 'bike': return <Car className="w-5 h-5" />;
      default: return <Car className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ongoing':
        return <Badge className="bg-blue-100 text-blue-800">Ongoing</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'completed':
        return <Badge className="bg-purple-100 text-purple-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-gray-100 text-gray-800">Refunded</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleBookingAction = (action: string, bookingId: string) => {
    switch (action) {
      case 'view':
        const booking = bookings.find(b => b.id === bookingId);
        setSelectedBooking(booking || null);
        setShowBookingDetails(true);
        break;
      case 'edit':
        const bookingToEdit = bookings.find(b => b.id === bookingId);
        if (bookingToEdit) {
          setEditingBooking({ ...bookingToEdit });
          setShowEditDialog(true);
        }
        break;
      case 'cancel':
        const bookingToCancel = bookings.find(b => b.id === bookingId);
        if (bookingToCancel) {
          if (bookingToCancel.status === 'cancelled') {
            toast({
              title: "Already Cancelled",
              description: "This booking is already cancelled",
              variant: "destructive",
            });
            return;
          }
          
          if (bookingToCancel.status === 'completed') {
            toast({
              title: "Cannot Cancel",
              description: "Completed bookings cannot be cancelled",
              variant: "destructive",
            });
            return;
          }
          
          setBookings(prev => prev.map(b => 
            b.id === bookingId 
              ? { ...b, status: 'cancelled' as const, paymentStatus: 'refunded' as const }
              : b
          ));
          
          toast({
            title: "Booking Cancelled",
            description: "Booking has been cancelled and payment refunded",
            variant: "default",
          });
        }
        break;
      case 'revert':
        const bookingToRevert = bookings.find(b => b.id === bookingId);
        if (bookingToRevert) {
          if (bookingToRevert.status !== 'cancelled') {
            toast({
              title: "Cannot Revert",
              description: "Only cancelled bookings can be reverted",
              variant: "destructive",
            });
            return;
          }
          
          setBookings(prev => prev.map(b => 
            b.id === bookingId 
              ? { ...b, status: 'ongoing' as const, paymentStatus: 'pending' as const }
              : b
          ));
          
          toast({
            title: "Booking Reverted",
            description: "Booking has been reverted to confirmed status",
            variant: "default",
          });
        }
        break;
      case 'delete':
        setActionBookingId(bookingId);
        setShowDeleteConfirm(true);
        break;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string, timeString: string) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    return `${formattedDate} at ${timeString}`;
  };

  const handleEditBooking = () => {
    if (editingBooking) {
      setBookings(prev => prev.map(b => 
        b.id === editingBooking.id ? editingBooking : b
      ));
      setShowEditDialog(false);
      setEditingBooking(null);
      toast({
        title: "Booking Updated",
        description: "Booking details have been updated successfully",
        variant: "default",
      });
    }
  };

  const handleDeleteBooking = () => {
    setBookings(prev => prev.filter(b => b.id !== actionBookingId));
    setShowDeleteConfirm(false);
    setActionBookingId("");
    toast({
      title: "Booking Deleted",
      description: "Booking has been permanently deleted",
      variant: "default",
    });
  };

  const handleRevertBooking = () => {
    const bookingToRevert = bookings.find(b => b.id === actionBookingId);
    if (bookingToRevert && bookingToRevert.status === 'cancelled') {
      setBookings(prev => prev.map(b => 
        b.id === actionBookingId 
          ? { ...b, status: 'ongoing' as const, paymentStatus: 'pending' as const }
          : b
      ));
      setShowRevertConfirm(false);
      setActionBookingId("");
      toast({
        title: "Booking Reverted",
        description: "Booking has been reverted to confirmed status",
        variant: "default",
      });
    }
  };

  const stats = {
    total: bookings.length,
    ongoing: bookings.filter(b => b.status === 'ongoing').length,
    active: bookings.filter(b => b.status === 'active').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    totalRevenue: bookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.amount, 0),
    pendingAmount: bookings.filter(b => b.paymentStatus === 'pending').reduce((sum, b) => sum + b.amount, 0),
    paidAmount: bookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.amount, 0),
  };

  // ProtectedAdminRoute ensures auth; render content directly

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Booking Management</h1>
        <p className="text-sm md:text-base text-gray-600">Manage all bookings and trips in the system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
              </div>
              <div className="ml-2 md:ml-4 min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 truncate">Total Bookings</p>
                <p className="text-base md:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
              </div>
              <div className="ml-2 md:ml-4 min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 truncate">Active Trips</p>
                <p className="text-base md:text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
              </div>
              <div className="ml-2 md:ml-4 min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 truncate">Paid Amount</p>
                <p className="text-base md:text-2xl font-bold text-gray-900">{formatCurrency(stats.paidAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-4 h-4 md:w-6 md:h-6 text-yellow-600" />
              </div>
              <div className="ml-2 md:ml-4 min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 truncate">Pending Amount</p>
                <p className="text-base md:text-2xl font-bold text-gray-900">{formatCurrency(stats.pendingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 truncate">Completed Trips</p>
                <p className="text-base md:text-xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg ml-2">
                <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 truncate">Ongoing Bookings</p>
                <p className="text-base md:text-xl font-bold text-gray-900">{stats.ongoing}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg ml-2">
                <CheckCircle className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 truncate">Total Revenue</p>
                <p className="text-base md:text-xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg ml-2">
                <DollarSign className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-4 md:mb-6">
        <CardContent className="p-4 md:p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search bookings by number, customer, driver, or route..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:col-span-2 lg:col-span-1">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Cards */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading bookings...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:gap-6">
              {filteredBookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    {/* Top Row - Mobile Optimized */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 md:space-x-3">
                        <h3 className="text-base md:text-xl font-bold text-gray-900">{booking.bookingNumber}</h3>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {getStatusBadge(booking.status)}
                          {getPaymentStatusBadge(booking.paymentStatus)}
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-lg md:text-xl font-bold text-gray-900">{formatCurrency(booking.amount)}</p>
                      </div>
                    </div>

                    {/* Middle Section - Details - Mobile Optimized */}
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500">Customer</p>
                            <p className="text-sm font-medium text-gray-900 truncate">{booking.customerName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500">Driver</p>
                            <p className="text-sm font-medium text-gray-900 truncate">{booking.driverName}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500">Route</p>
                          <p className="text-sm font-medium text-gray-900">{booking.from} → {booking.to}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500">Date</p>
                            <p className="text-sm font-medium text-gray-900">{formatDate(booking.departureDate)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500">Time</p>
                            <p className="text-sm font-medium text-gray-900">{booking.departureTime}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getVehicleIcon(booking.vehicleType)}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500">Vehicle</p>
                          <p className="text-sm font-medium text-gray-900">{booking.vehicleModel}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section - Actions - Mobile Optimized */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBookingAction('view', booking.id)}
                          className="w-full"
                        >
                          <Eye className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">View</span>
                          <span className="sm:hidden">View</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBookingAction('edit', booking.id)}
                          className="w-full"
                        >
                          <Edit className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Edit</span>
                          <span className="sm:hidden">Edit</span>
                        </Button>
                      </div>

                      {/* Additional Actions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {booking.status !== 'cancelled' && booking.status !== 'completed' && booking.paymentStatus !== 'paid' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBookingAction('cancel', booking.id)}
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Ban className="w-4 h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Cancel</span>
                            <span className="sm:hidden">Cancel</span>
                          </Button>
                        )}
                        {booking.status === 'cancelled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBookingAction('revert', booking.id)}
                            className="w-full text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <RotateCcw className="w-4 h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Revert</span>
                            <span className="sm:hidden">Revert</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBookingAction('delete', booking.id)}
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Delete</span>
                          <span className="sm:hidden">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Dialog */}
      <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mb-4">
            {selectedBooking && selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'completed' && (
              <Button
                variant="outline"
                onClick={() => {
                  handleBookingAction('cancel', selectedBooking.id);
                  setShowBookingDetails(false);
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Ban className="w-4 h-4 mr-2" />
                Cancel Booking
              </Button>
            )}
            {selectedBooking && selectedBooking.status === 'cancelled' && (
              <Button
                variant="outline"
                onClick={() => {
                  handleBookingAction('revert', selectedBooking.id);
                  setShowBookingDetails(false);
                }}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Revert Booking
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowBookingDetails(false)}
            >
              Close
            </Button>
          </div>
          {selectedBooking && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Booking Information</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Booking Number:</span>
                      <span className="text-sm font-medium">{selectedBooking.bookingNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Booking Date:</span>
                      <span className="text-sm font-medium">{formatDate(selectedBooking.bookingDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className="text-sm font-medium">{selectedBooking.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Payment Status:</span>
                      <span className="text-sm font-medium">{selectedBooking.paymentStatus}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Trip Details</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">From:</span>
                      <span className="text-sm font-medium">{selectedBooking.from}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">To:</span>
                      <span className="text-sm font-medium">{selectedBooking.to}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Departure:</span>
                      <span className="text-sm font-medium">{formatDateTime(selectedBooking.departureDate, selectedBooking.departureTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Arrival:</span>
                      <span className="text-sm font-medium">{formatDateTime(selectedBooking.arrivalDate, selectedBooking.arrivalTime)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Customer Information</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">{selectedBooking.customerName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{selectedBooking.customerPhone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{selectedBooking.customerEmail}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Driver & Vehicle</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">{selectedBooking.driverName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{selectedBooking.driverPhone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getVehicleIcon(selectedBooking.vehicleType)}
                      <span className="text-sm">{selectedBooking.vehicleModel} - {selectedBooking.vehicleNumber}</span>
                    </div>
                  </div>
                </div>
              </div>

                             <div className="grid grid-cols-2 gap-6">
                 <div>
                   <Label className="text-sm font-medium text-gray-600">Payment Information</Label>
                   <div className="mt-2 space-y-2">
                     <div className="flex justify-between">
                       <span className="text-sm text-gray-500">Total Amount:</span>
                       <span className="text-sm font-medium">{formatCurrency(selectedBooking.amount)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-sm text-gray-500">Advance Amount:</span>
                       <span className="text-sm font-medium text-green-600">{formatCurrency(selectedBooking.advanceAmount)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-sm text-gray-500">Remaining Amount:</span>
                       <span className="text-sm font-medium text-orange-600">{formatCurrency(selectedBooking.remainingAmount)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-sm text-gray-500">Cash Amount:</span>
                       <span className="text-sm font-medium text-blue-600">{formatCurrency(selectedBooking.cashAmount)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-sm text-gray-500">Passengers:</span>
                       <span className="text-sm font-medium">{selectedBooking.passengers}</span>
                     </div>
                   </div>
                 </div>

                {selectedBooking.rating && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Rating & Review</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium">{selectedBooking.rating}/5</span>
                      </div>
                      {selectedBooking.review && (
                        <p className="text-sm text-gray-600">{selectedBooking.review}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
                 </DialogContent>
       </Dialog>

       {/* Delete Confirmation Dialog */}
       <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>Delete Booking</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <p className="text-gray-600">
               Are you sure you want to delete this booking? This action cannot be undone.
             </p>
             <div className="flex justify-end space-x-2">
               <Button
                 variant="outline"
                 onClick={() => setShowDeleteConfirm(false)}
               >
                 Cancel
               </Button>
               <Button
                 variant="destructive"
                 onClick={handleDeleteBooking}
               >
                 <Trash2 className="w-4 h-4 mr-2" />
                 Delete
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>

       {/* Edit Booking Dialog */}
       <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
         <DialogContent className="max-w-4xl">
           <DialogHeader>
             <DialogTitle>Edit Booking</DialogTitle>
           </DialogHeader>
           {editingBooking && (
             <div className="space-y-6">
               <div className="grid grid-cols-2 gap-6">
                 <div>
                   <Label htmlFor="customerName">Customer Name</Label>
                   <Input
                     id="customerName"
                     value={editingBooking.customerName}
                     onChange={(e) => setEditingBooking(prev => prev ? { ...prev, customerName: e.target.value } : null)}
                   />
                 </div>
                 <div>
                   <Label htmlFor="customerPhone">Customer Phone</Label>
                   <Input
                     id="customerPhone"
                     value={editingBooking.customerPhone}
                     onChange={(e) => setEditingBooking(prev => prev ? { ...prev, customerPhone: e.target.value } : null)}
                   />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                 <div>
                   <Label htmlFor="from">From</Label>
                   <Input
                     id="from"
                     value={editingBooking.from}
                     onChange={(e) => setEditingBooking(prev => prev ? { ...prev, from: e.target.value } : null)}
                   />
                 </div>
                 <div>
                   <Label htmlFor="to">To</Label>
                   <Input
                     id="to"
                     value={editingBooking.to}
                     onChange={(e) => setEditingBooking(prev => prev ? { ...prev, to: e.target.value } : null)}
                   />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                 <div>
                   <Label htmlFor="departureDate">Departure Date</Label>
                   <Input
                     id="departureDate"
                     type="date"
                     value={editingBooking.departureDate}
                     onChange={(e) => setEditingBooking(prev => prev ? { ...prev, departureDate: e.target.value } : null)}
                   />
                 </div>
                 <div>
                   <Label htmlFor="departureTime">Departure Time</Label>
                   <Input
                     id="departureTime"
                     value={editingBooking.departureTime}
                     onChange={(e) => setEditingBooking(prev => prev ? { ...prev, departureTime: e.target.value } : null)}
                   />
                 </div>
               </div>

                               <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="amount">Total Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={editingBooking.amount}
                      onChange={(e) => setEditingBooking(prev => prev ? { ...prev, amount: parseInt(e.target.value) || 0 } : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="passengers">Passengers</Label>
                    <Input
                      id="passengers"
                      type="number"
                      value={editingBooking.passengers}
                      onChange={(e) => setEditingBooking(prev => prev ? { ...prev, passengers: parseInt(e.target.value) || 0 } : null)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="advanceAmount">Advance Amount</Label>
                    <Input
                      id="advanceAmount"
                      type="number"
                      value={editingBooking.advanceAmount}
                      onChange={(e) => setEditingBooking(prev => prev ? { ...prev, advanceAmount: parseInt(e.target.value) || 0 } : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="remainingAmount">Remaining Amount</Label>
                    <Input
                      id="remainingAmount"
                      type="number"
                      value={editingBooking.remainingAmount}
                      onChange={(e) => setEditingBooking(prev => prev ? { ...prev, remainingAmount: parseInt(e.target.value) || 0 } : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cashAmount">Cash Amount</Label>
                    <Input
                      id="cashAmount"
                      type="number"
                      value={editingBooking.cashAmount}
                      onChange={(e) => setEditingBooking(prev => prev ? { ...prev, cashAmount: parseInt(e.target.value) || 0 } : null)}
                    />
                  </div>
                </div>

               <div className="grid grid-cols-2 gap-6">
                 <div>
                   <Label htmlFor="status">Status</Label>
                   <Select
                     value={editingBooking.status}
                     onValueChange={(value) => setEditingBooking(prev => prev ? { ...prev, status: value as any } : null)}
                   >
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="ongoing">Ongoing</SelectItem>
                       <SelectItem value="active">Active</SelectItem>
                       <SelectItem value="completed">Completed</SelectItem>
                       <SelectItem value="cancelled">Cancelled</SelectItem>
                       <SelectItem value="pending">Pending</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div>
                   <Label htmlFor="paymentStatus">Payment Status</Label>
                   <Select
                     value={editingBooking.paymentStatus}
                     onValueChange={(value) => setEditingBooking(prev => prev ? { ...prev, paymentStatus: value as any } : null)}
                   >
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="paid">Paid</SelectItem>
                       <SelectItem value="pending">Pending</SelectItem>
                       <SelectItem value="failed">Failed</SelectItem>
                       <SelectItem value="refunded">Refunded</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>

               <div className="flex justify-end space-x-2">
                 <Button
                   variant="outline"
                   onClick={() => {
                     setShowEditDialog(false);
                     setEditingBooking(null);
                   }}
                 >
                   Cancel
                 </Button>
                 <Button
                   onClick={handleEditBooking}
                 >
                   <Check className="w-4 h-4 mr-2" />
                   Save Changes
                 </Button>
               </div>
             </div>
           )}
         </DialogContent>
       </Dialog>
     </AdminLayout>
   );
 };

export default AdminBookingManagement; 