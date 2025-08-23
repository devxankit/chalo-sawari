import { useState, useEffect } from "react";
import AdminLayout from "@/admin/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  Search,
  Filter,
  Eye,
  Download,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
  Banknote,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Activity,
  RefreshCw,
  FileText
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import AdminPaymentApiService from "@/services/adminPaymentApi";
import { useIsMobile } from "@/hooks/use-mobile";

// Updated interfaces to match the actual database schema
interface Payment {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  booking?: {
    _id: string;
    bookingNumber: string;
    pickup: string;
    destination: string;
    date: string;
    time: string;
    tripType: string;
  };
  amount: number;
  currency: string;
  method: 'wallet' | 'card' | 'upi' | 'cash' | 'netbanking' | 'razorpay';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  type: 'booking' | 'wallet_recharge' | 'refund' | 'withdrawal';
  transactionId?: string;
  paymentGateway: 'stripe' | 'razorpay' | 'paytm' | 'internal';
  paymentDetails: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    upiId?: string;
    bankName?: string;
    walletType?: string;
    referenceId?: string;
  };
  refund?: {
    amount: number;
    reason: string;
    refundedAt: string;
    refundId: string;
  };
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    deviceType?: string;
  };
  timestamps: {
    initiated: string;
    processed?: string;
    completed?: string;
    failed?: string;
    refunded?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  refundedPayments: number;
  averageTransactionValue: number;
  successRate: number;
  methodDistribution: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
  gatewayDistribution: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
}

interface PaginatedPayments {
  docs: Payment[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const AdminPaymentManagement = () => {
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    totalPayments: 0,
    totalAmount: 0,
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayments: 0,
    refundedPayments: 0,
    averageTransactionValue: 0,
    successRate: 0,
    methodDistribution: [],
    gatewayDistribution: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const adminPaymentApi = new AdminPaymentApiService();

  useEffect(() => {
    loadPaymentData();
  }, [currentPage, statusFilter, paymentMethodFilter, dateFilter]);

  const loadPaymentData = async () => {
    setIsLoading(true);
    try {
      // Debug: Check admin token
      const adminToken = localStorage.getItem('adminToken');
      console.log('Admin token exists:', !!adminToken);
      console.log('Admin token length:', adminToken ? adminToken.length : 0);
      
      // Load payments with filters
      const paymentsResponse = await adminPaymentApi.getAllPayments({
        page: currentPage,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        paymentMethod: paymentMethodFilter !== 'all' ? paymentMethodFilter : undefined,
        startDate: getDateFilterStart(),
        endDate: getDateFilterEnd(),
        search: searchTerm || undefined
      });

      if (paymentsResponse.success) {
        const paginatedData: PaginatedPayments = paymentsResponse.data;
        setPayments(paginatedData.docs);
        setFilteredPayments(paginatedData.docs);
        setTotalPages(paginatedData.totalPages);
      }

      // Load payment statistics
      const statsResponse = await adminPaymentApi.getPaymentStats('month');
      if (statsResponse.success) {
        setPaymentStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load payment data:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDateFilterStart = (): string | undefined => {
    if (dateFilter === 'all') return undefined;
    
    const today = new Date();
    switch (dateFilter) {
      case 'today':
        return today.toISOString().split('T')[0];
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString().split('T')[0];
      case 'month':
        const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);
        return monthAgo.toISOString().split('T')[0];
      default:
        return undefined;
    }
  };

  const getDateFilterEnd = (): string | undefined => {
    if (dateFilter === 'all') return undefined;
    
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPaymentData();
    setIsRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Payment data has been refreshed",
    });
  };

  const handleExport = async () => {
    try {
      await adminPaymentApi.exportPayments({
        startDate: getDateFilterStart(),
        endDate: getDateFilterEnd(),
        status: statusFilter !== 'all' ? statusFilter : undefined,
        paymentMethod: paymentMethodFilter !== 'all' ? paymentMethodFilter : undefined
      });
      toast({
        title: "Export Successful",
        description: "Payment data has been exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export payment data",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-gray-100 text-gray-800">Refunded</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return <CreditCard className="w-4 h-4" />;
      case 'upi': return <CreditCard className="w-4 h-4" />;
      case 'netbanking': return <Banknote className="w-4 h-4" />;
      case 'wallet': return <Wallet className="w-4 h-4" />;
      case 'cash': return <Receipt className="w-4 h-4" />;
      case 'razorpay': return <CreditCard className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const handlePaymentAction = (action: string, paymentId: string) => {
    switch (action) {
      case 'view':
        const payment = payments.find(p => p._id === paymentId);
        setSelectedPayment(payment || null);
        setShowPaymentDetails(true);
        break;
      case 'export':
        handleExport();
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
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCustomerName = (payment: Payment) => {
    if (payment.user) {
      return `${payment.user.firstName} ${payment.user.lastName}`;
    }
    return 'N/A';
  };

  const getBookingNumber = (payment: Payment) => {
    if (payment.booking) {
      return payment.booking.bookingNumber;
    }
    return 'N/A';
  };

  const getRouteInfo = (payment: Payment) => {
    if (payment.booking) {
      return `${payment.booking.pickup} → ${payment.booking.destination}`;
    }
    return 'N/A';
  };

  return (
    <AdminLayout>
      <main className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payment Management</h1>
            <p className="text-gray-600 mt-1">Monitor and manage all payment transactions</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleRefresh}
              className="flex items-center gap-2"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4" />
              {isMobile ? "Refresh" : "Refresh Data"}
            </Button>
            <Button
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isMobile ? "Export" : "Export Data"}
            </Button>
          </div>
        </div>

        {/* Main Stats - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Revenue</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{formatCurrency(paymentStats.totalAmount)}</p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">All time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Successful</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{paymentStats.successfulPayments}</p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Payments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Avg Transaction</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{formatCurrency(paymentStats.averageTransactionValue)}</p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Per payment</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Pending</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{paymentStats.pendingPayments}</p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Failed Payments</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{paymentStats.failedPayments}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg flex-shrink-0 ml-3">
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Refunded</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{paymentStats.refundedPayments}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0 ml-3">
                  <ArrowDownRight className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Payments</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{paymentStats.totalPayments}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0 ml-3">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search - Mobile Optimized */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={isMobile ? "Search payments..." : "Search by transaction ID, booking number, or customer..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-20"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      loadPaymentData();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={loadPaymentData}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 px-3"
                >
                  {isMobile ? "Go" : "Search"}
                </Button>
              </div>
              
              {/* Filters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="netbanking">Net Banking</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="razorpay">Razorpay</SelectItem>
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

        {/* Payments List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg lg:text-xl">All Payments ({filteredPayments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading payments...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No payments found matching your criteria</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Booking</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payment.transactionId || 'N/A'}</p>
                              <p className="text-sm text-gray-500">{payment.paymentGateway}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{getCustomerName(payment)}</p>
                              <p className="text-sm text-gray-500">{payment.user?.email || 'N/A'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{getBookingNumber(payment)}</p>
                              <p className="text-sm text-gray-500">{getRouteInfo(payment)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{formatCurrency(payment.amount)}</p>
                              <p className="text-sm text-gray-500">{payment.currency}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getPaymentMethodIcon(payment.method)}
                              <span className="text-sm font-medium capitalize">{payment.method}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(payment.status)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">{formatDate(payment.createdAt)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePaymentAction('view', payment._id)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View - Enhanced */}
                <div className="lg:hidden space-y-3">
                  {filteredPayments.map((payment) => (
                    <div key={payment._id} className="border rounded-lg p-4 hover:bg-gray-50 bg-white shadow-sm">
                      {/* Header with Status */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900 truncate text-sm">
                              {payment.transactionId || 'N/A'}
                            </h3>
                            {getStatusBadge(payment.status)}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{payment.paymentGateway}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePaymentAction('view', payment._id)}
                          className="flex-shrink-0 ml-2"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Amount and Method - Prominent Display */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-600">Amount</p>
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              {getPaymentMethodIcon(payment.method)}
                              <span className="text-sm font-medium capitalize">{payment.method}</span>
                            </div>
                            <p className="text-xs text-gray-500">{payment.currency}</p>
                          </div>
                        </div>
                      </div>

                      {/* Customer and Booking Info */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-600">Customer</p>
                            <p className="text-sm font-medium text-gray-900 truncate">{getCustomerName(payment)}</p>
                          </div>
                          <div className="flex-1 min-w-0 ml-3">
                            <p className="text-xs font-medium text-gray-600">Email</p>
                            <p className="text-sm text-gray-600 truncate">{payment.user?.email || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-600">Booking</p>
                            <p className="text-sm font-medium text-gray-900 truncate">{getBookingNumber(payment)}</p>
                          </div>
                          <div className="flex-1 min-w-0 ml-3">
                            <p className="text-xs font-medium text-gray-600">Date</p>
                            <p className="text-sm text-gray-900">{formatDate(payment.createdAt)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Route Information */}
                      <div className="border-t pt-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">Route</p>
                        <p className="text-sm text-gray-600 truncate">{getRouteInfo(payment)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination - Mobile Optimized */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
                <div className="text-sm text-gray-700 text-center sm:text-left">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex justify-center sm:justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="min-w-[80px]"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="min-w-[80px]"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Payment Details Dialog - Mobile Optimized */}
      <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg lg:text-xl">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Payment Details
            </DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 sm:space-y-6">
              {/* Payment Header - Mobile Optimized */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full flex-shrink-0 mx-auto sm:mx-0">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h3 className="text-lg sm:text-xl font-semibold truncate">
                    {selectedPayment.transactionId || 'N/A'}
                  </h3>
                  <p className="text-gray-600 truncate">{selectedPayment.paymentGateway}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-2">
                    {getStatusBadge(selectedPayment.status)}
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon(selectedPayment.method)}
                      <span className="text-sm font-medium capitalize">{selectedPayment.method}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment Information Grid - Mobile Optimized */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-600">Payment Type</label>
                  <p className="text-sm sm:text-base text-gray-900 break-all capitalize">{selectedPayment.type}</p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-600">Created Date</label>
                  <p className="text-sm sm:text-base text-gray-900">{formatDate(selectedPayment.createdAt)}</p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-600">Customer</label>
                  <p className="text-sm sm:text-base text-gray-900 break-all">{getCustomerName(selectedPayment)}</p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-600">Customer Email</label>
                  <p className="text-sm sm:text-base text-gray-900 break-all">{selectedPayment.user?.email || 'N/A'}</p>
                </div>
              </div>
              
              {/* Amount Information - Mobile Optimized */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-600">Amount Information</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600">Amount</p>
                      <p className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(selectedPayment.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Currency</p>
                      <p className="text-base sm:text-lg font-medium text-gray-900">{selectedPayment.currency}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment Details - Mobile Optimized */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-600">Payment Details</label>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon(selectedPayment.method)}
                      <div>
                        <p className="text-sm font-medium text-blue-900 capitalize">{selectedPayment.method}</p>
                        <p className="text-xs text-blue-700">Payment Method</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">{selectedPayment.paymentGateway}</p>
                      <p className="text-xs text-blue-700">Gateway</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Information - Mobile Optimized */}
              {selectedPayment.booking && (
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-600">Booking Information</label>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <p className="text-sm font-medium text-green-900 truncate">{selectedPayment.booking.bookingNumber}</p>
                        <p className="text-xs text-green-700">Booking Number</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-900">{selectedPayment.booking.tripType}</p>
                        <p className="text-xs text-green-700">Trip Type</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-sm font-medium text-green-900 truncate">
                          {selectedPayment.booking.pickup} → {selectedPayment.booking.destination}
                        </p>
                        <p className="text-xs text-green-700">Route</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-900">{selectedPayment.booking.date}</p>
                        <p className="text-xs text-green-700">Date</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-900">{selectedPayment.booking.time}</p>
                        <p className="text-xs text-green-700">Time</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Refund Information - Mobile Optimized */}
              {selectedPayment.refund && (
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-600">Refund Information</label>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <p className="text-sm font-medium text-red-900">Refund Amount</p>
                        <p className="text-base sm:text-lg font-bold text-red-600">{formatCurrency(selectedPayment.refund.amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-900">Refund Date</p>
                        <p className="text-sm text-red-700">{formatDate(selectedPayment.refund.refundedAt)}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-sm font-medium text-red-900">Reason</p>
                        <p className="text-sm text-red-700">{selectedPayment.refund.reason}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamps - Mobile Optimized */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-600">Timeline</label>
                <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Initiated:</span>
                    <span className="font-medium">{formatDate(selectedPayment.timestamps.initiated)}</span>
                  </div>
                  {selectedPayment.timestamps.processed && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Processed:</span>
                      <span className="font-medium">{formatDate(selectedPayment.timestamps.processed)}</span>
                    </div>
                  )}
                  {selectedPayment.timestamps.completed && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Completed:</span>
                      <span className="font-medium">{formatDate(selectedPayment.timestamps.completed)}</span>
                    </div>
                  )}
                  {selectedPayment.timestamps.failed && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Failed:</span>
                      <span className="font-medium">{formatDate(selectedPayment.timestamps.failed)}</span>
                    </div>
                  )}
                  {selectedPayment.timestamps.refunded && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Refunded:</span>
                      <span className="font-medium">{formatDate(selectedPayment.timestamps.refunded)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPaymentManagement; 