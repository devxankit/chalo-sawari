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
import { Progress } from "@/components/ui/progress";
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
  Activity
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  transactionId: string;
  bookingNumber: string;
  customerName: string;
  driverName: string;
  amount: number;
  commission: number;
  netAmount: number;
  paymentMethod: 'card' | 'upi' | 'netbanking' | 'wallet' | 'cash';
  status: 'success' | 'pending' | 'failed' | 'refunded';
  transactionDate: string;
  description: string;
  gateway: string;
  refundAmount?: number;
  refundDate?: string;
}

interface RevenueData {
  totalRevenue: number;
  totalCommission: number;
  netRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  refundedAmount: number;
  monthlyGrowth: number;
  averageTransactionValue: number;
}

const AdminPaymentManagement = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [revenueData, setRevenueData] = useState<RevenueData>({
    totalRevenue: 0,
    totalCommission: 0,
    netRevenue: 0,
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
    refundedAmount: 0,
    monthlyGrowth: 0,
    averageTransactionValue: 0
  });

  useEffect(() => {
    // Load initial data
    setIsLoggedIn(true);
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockTransactions: Transaction[] = [
        {
          id: "1",
          transactionId: "TXN-2024-001",
          bookingNumber: "BK-2024-001",
          customerName: "Ajay Panchal",
          driverName: "Rahul Kumar",
          amount: 8500,
          commission: 850,
          netAmount: 7650,
          paymentMethod: "card",
          status: "success",
          transactionDate: "2024-03-15",
          description: "Payment for Delhi to Mumbai trip",
          gateway: "Razorpay"
        },
        {
          id: "2",
          transactionId: "TXN-2024-002",
          bookingNumber: "BK-2024-002",
          customerName: "Priya Sharma",
          driverName: "Amit Singh",
          amount: 25000,
          commission: 2500,
          netAmount: 22500,
          paymentMethod: "upi",
          status: "success",
          transactionDate: "2024-03-20",
          description: "Payment for Mumbai to Pune bus trip",
          gateway: "PayU"
        },
        {
          id: "3",
          transactionId: "TXN-2024-003",
          bookingNumber: "BK-2024-003",
          customerName: "Rajesh Kumar",
          driverName: "Suresh Kumar",
          amount: 15000,
          commission: 1500,
          netAmount: 13500,
          paymentMethod: "netbanking",
          status: "pending",
          transactionDate: "2024-03-25",
          description: "Payment for Bangalore to Chennai trip",
          gateway: "CCAvenue"
        },
        {
          id: "4",
          transactionId: "TXN-2024-004",
          bookingNumber: "BK-2024-004",
          customerName: "Meera Patel",
          driverName: "Vikram Singh",
          amount: 3000,
          commission: 300,
          netAmount: 2700,
          paymentMethod: "wallet",
          status: "refunded",
          transactionDate: "2024-03-18",
          description: "Payment for Chennai to Bangalore bike trip",
          gateway: "Paytm",
          refundAmount: 3000,
          refundDate: "2024-03-19"
        },
        {
          id: "5",
          transactionId: "TXN-2024-005",
          bookingNumber: "BK-2024-005",
          customerName: "Suresh Verma",
          driverName: "Rajesh Singh",
          amount: 12000,
          commission: 1200,
          netAmount: 10800,
          paymentMethod: "cash",
          status: "success",
          transactionDate: "2024-03-22",
          description: "Payment for Hyderabad to Bangalore trip",
          gateway: "Cash"
        }
      ];

      setTransactions(mockTransactions);
      setFilteredTransactions(mockTransactions);
      
      // Calculate revenue data
      const totalRevenue = mockTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalCommission = mockTransactions.reduce((sum, t) => sum + t.commission, 0);
      const netRevenue = totalRevenue - totalCommission;
      const successfulTransactions = mockTransactions.filter(t => t.status === 'success').length;
      const failedTransactions = mockTransactions.filter(t => t.status === 'failed').length;
      const pendingTransactions = mockTransactions.filter(t => t.status === 'pending').length;
      const refundedAmount = mockTransactions
        .filter(t => t.status === 'refunded')
        .reduce((sum, t) => sum + (t.refundAmount || 0), 0);
      const averageTransactionValue = totalRevenue / mockTransactions.length;

      setRevenueData({
        totalRevenue,
        totalCommission,
        netRevenue,
        totalTransactions: mockTransactions.length,
        successfulTransactions,
        failedTransactions,
        pendingTransactions,
        refundedAmount,
        monthlyGrowth: 12.5, // Mock growth percentage
        averageTransactionValue
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.driverName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(transaction => transaction.status === statusFilter);
    }

    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter(transaction => transaction.paymentMethod === paymentMethodFilter);
    }

    if (dateFilter !== "all") {
      const today = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case "today":
          filtered = filtered.filter(transaction => {
            const transactionDate = new Date(transaction.transactionDate);
            return transactionDate.toDateString() === today.toDateString();
          });
          break;
        case "week":
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(transaction => {
            const transactionDate = new Date(transaction.transactionDate);
            return transactionDate >= filterDate;
          });
          break;
        case "month":
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(transaction => {
            const transactionDate = new Date(transaction.transactionDate);
            return transactionDate >= filterDate;
          });
          break;
      }
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, statusFilter, paymentMethodFilter, dateFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
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

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return <CreditCard className="w-4 h-4" />;
      case 'upi': return <CreditCard className="w-4 h-4" />;
      case 'netbanking': return <Banknote className="w-4 h-4" />;
      case 'wallet': return <Wallet className="w-4 h-4" />;
      case 'cash': return <Receipt className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const handleTransactionAction = (action: string, transactionId: string) => {
    switch (action) {
      case 'view':
        const transaction = transactions.find(t => t.id === transactionId);
        setSelectedTransaction(transaction || null);
        setShowTransactionDetails(true);
        break;
      case 'download':
        toast({
          title: "Download Receipt",
          description: "Receipt download functionality will be implemented",
        });
        break;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getSuccessRate = () => {
    return (revenueData.successfulTransactions / revenueData.totalTransactions) * 100;
  };

  // ProtectedAdminRoute handles auth; always render content here

  return (
    <AdminLayout>
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
              <p className="text-gray-600">Manage all financial transactions and revenue analytics</p>
            </div>

            {/* Revenue Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueData.totalRevenue)}</p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                        <span className="text-sm text-green-600">+{revenueData.monthlyGrowth}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Net Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueData.netRevenue)}</p>
                      <p className="text-sm text-gray-500 mt-1">After commission</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Activity className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Success Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{getSuccessRate().toFixed(1)}%</p>
                      <p className="text-sm text-gray-500 mt-1">{revenueData.successfulTransactions}/{revenueData.totalTransactions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avg Transaction</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueData.averageTransactionValue)}</p>
                      <p className="text-sm text-gray-500 mt-1">Per booking</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Commission Earned</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(revenueData.totalCommission)}</p>
                    </div>
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Transactions</p>
                      <p className="text-xl font-bold text-gray-900">{revenueData.pendingTransactions}</p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Refunded Amount</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(revenueData.refundedAmount)}</p>
                    </div>
                    <div className="p-2 bg-red-100 rounded-lg">
                      <ArrowDownRight className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="netbanking">Net Banking</SelectItem>
                      <SelectItem value="wallet">Wallet</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-full md:w-48">
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
              </CardContent>
            </Card>

            {/* Transactions List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg lg:text-xl">All Transactions ({filteredTransactions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading transactions...</p>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No transactions found matching your criteria</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Transaction</TableHead>
                            <TableHead>Booking</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Commission</TableHead>
                            <TableHead>Payment Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTransactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{transaction.transactionId}</p>
                                  <p className="text-sm text-gray-500">{transaction.gateway}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="font-medium">{transaction.bookingNumber}</p>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{transaction.customerName}</p>
                                  <p className="text-sm text-gray-500">{transaction.driverName}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                                  <p className="text-sm text-gray-500">Net: {formatCurrency(transaction.netAmount)}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="font-medium">{formatCurrency(transaction.commission)}</p>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {getPaymentMethodIcon(transaction.paymentMethod)}
                                  <span className="text-sm font-medium capitalize">{transaction.paymentMethod}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(transaction.status)}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p className="font-medium">{transaction.transactionDate}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTransactionAction('view', transaction.id)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTransactionAction('download', transaction.id)}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-4">
                      {filteredTransactions.map((transaction) => (
                        <div key={transaction.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold text-gray-900 truncate">{transaction.transactionId}</h3>
                                {getStatusBadge(transaction.status)}
                              </div>
                              <p className="text-sm text-gray-500 truncate">{transaction.gateway}</p>
                            </div>
                            <div className="flex space-x-2 ml-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTransactionAction('view', transaction.id)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTransactionAction('download', transaction.id)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Transaction Details */}
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <p className="text-xs font-medium text-gray-600">Booking</p>
                              <p className="text-sm font-medium text-gray-900 truncate">{transaction.bookingNumber}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-600">Date</p>
                              <p className="text-sm text-gray-900">{transaction.transactionDate}</p>
                            </div>
                          </div>

                          {/* Customer & Driver */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-600">Customer</p>
                                <p className="text-sm font-medium text-gray-900 truncate">{transaction.customerName}</p>
                              </div>
                              <div className="flex-1 min-w-0 ml-4">
                                <p className="text-xs font-medium text-gray-600">Driver</p>
                                <p className="text-sm text-gray-600 truncate">{transaction.driverName}</p>
                              </div>
                            </div>
                          </div>

                          {/* Amount Information */}
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div>
                              <p className="text-xs font-medium text-gray-600">Amount</p>
                              <p className="text-sm font-bold text-gray-900">{formatCurrency(transaction.amount)}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-600">Commission</p>
                              <p className="text-sm font-medium text-gray-900">{formatCurrency(transaction.commission)}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-600">Net Amount</p>
                              <p className="text-sm font-medium text-green-600">{formatCurrency(transaction.netAmount)}</p>
                            </div>
                          </div>

                          {/* Payment Method */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getPaymentMethodIcon(transaction.paymentMethod)}
                              <span className="text-sm font-medium capitalize">{transaction.paymentMethod}</span>
                            </div>
                            {transaction.refundAmount && (
                              <div className="text-right">
                                <p className="text-xs font-medium text-red-600">Refunded</p>
                                <p className="text-sm font-medium text-red-600">{formatCurrency(transaction.refundAmount)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

      {/* Transaction Details Dialog */}
      <Dialog open={showTransactionDetails} onOpenChange={setShowTransactionDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg lg:text-xl">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Transaction Details
            </DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Transaction Header */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full flex-shrink-0">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold truncate">{selectedTransaction.transactionId}</h3>
                  <p className="text-gray-600 truncate">{selectedTransaction.gateway}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {getStatusBadge(selectedTransaction.status)}
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon(selectedTransaction.paymentMethod)}
                      <span className="text-sm font-medium capitalize">{selectedTransaction.paymentMethod}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Transaction Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Booking Number</label>
                  <p className="text-gray-900 break-all">{selectedTransaction.bookingNumber}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Transaction Date</label>
                  <p className="text-gray-900">{selectedTransaction.transactionDate}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Customer</label>
                  <p className="text-gray-900 break-all">{selectedTransaction.customerName}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Driver</label>
                  <p className="text-gray-900 break-all">{selectedTransaction.driverName}</p>
                </div>
              </div>
              
              {/* Amount Information */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Amount Information</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600">Total Amount</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedTransaction.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Commission</p>
                      <p className="text-lg font-medium text-gray-900">{formatCurrency(selectedTransaction.commission)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Net Amount</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(selectedTransaction.netAmount)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment Details */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Payment Details</label>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon(selectedTransaction.paymentMethod)}
                      <div>
                        <p className="text-sm font-medium text-blue-900 capitalize">{selectedTransaction.paymentMethod}</p>
                        <p className="text-xs text-blue-700">Payment Method</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">{selectedTransaction.gateway}</p>
                      <p className="text-xs text-blue-700">Gateway</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Description</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-900 text-sm">{selectedTransaction.description || 'No description provided'}</p>
                </div>
              </div>

              {/* Refund Information */}
              {selectedTransaction.refundAmount && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Refund Information</label>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-red-900">Refund Amount</p>
                        <p className="text-lg font-bold text-red-600">{formatCurrency(selectedTransaction.refundAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-900">Refund Date</p>
                        <p className="text-sm text-red-700">{selectedTransaction.refundDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPaymentManagement; 