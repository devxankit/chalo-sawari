import { useState, useEffect } from "react";
import AdminLayout from "@/admin/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Edit,
  Reply,
  Trash2,
  User,
  Phone,
  Mail,
  Calendar,
  BarChart3,
  Activity,
  Tag,
  FileText
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SupportTicket {
  id: string;
  ticketId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  subject: string;
  description: string;
  category: 'booking' | 'payment' | 'technical' | 'refund' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  rating?: number;
  feedback?: string;
  attachments: string[];
  messages: {
    id: string;
    sender: 'customer' | 'admin';
    message: string;
    timestamp: string;
  }[];
}

const AdminSupportManagement = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [editPriority, setEditPriority] = useState<string>("");
  const [editAssignedTo, setEditAssignedTo] = useState<string>("");
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    setIsLoggedIn(true);
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockTickets: SupportTicket[] = [
        {
          id: "1",
          ticketId: "TKT-2024-001",
          customerName: "Ajay Panchal",
          customerEmail: "ajay@example.com",
          customerPhone: "+91 98765-43210",
          subject: "Payment Failed - Booking Cancelled",
          description: "I tried to make payment for my Delhi to Mumbai trip but the payment failed and my booking was cancelled. I need help to rebook.",
          category: "payment",
          priority: "high",
          status: "open",
          assignedTo: "Support Team",
          createdAt: "2024-03-15 10:30 AM",
          updatedAt: "2024-03-15 10:30 AM",
          attachments: ["payment_screenshot.png"],
          messages: [
            {
              id: "1",
              sender: "customer",
              message: "I tried to make payment for my Delhi to Mumbai trip but the payment failed and my booking was cancelled. I need help to rebook.",
              timestamp: "2024-03-15 10:30 AM"
            }
          ]
        },
        {
          id: "2",
          ticketId: "TKT-2024-002",
          customerName: "Priya Sharma",
          customerEmail: "priya@example.com",
          customerPhone: "+91 98765-43211",
          subject: "Driver Not Responding",
          description: "My driver is not responding to calls and messages. The trip is scheduled for tomorrow and I'm worried.",
          category: "booking",
          priority: "urgent",
          status: "in_progress",
          assignedTo: "John Doe",
          createdAt: "2024-03-14 02:15 PM",
          updatedAt: "2024-03-15 09:45 AM",
          attachments: [],
          messages: [
            {
              id: "1",
              sender: "customer",
              message: "My driver is not responding to calls and messages. The trip is scheduled for tomorrow and I'm worried.",
              timestamp: "2024-03-14 02:15 PM"
            },
            {
              id: "2",
              sender: "admin",
              message: "We have contacted the driver and he will call you within 30 minutes. Please check your phone.",
              timestamp: "2024-03-15 09:45 AM"
            }
          ]
        },
        {
          id: "3",
          ticketId: "TKT-2024-003",
          customerName: "Rajesh Kumar",
          customerEmail: "rajesh@example.com",
          customerPhone: "+91 98765-43212",
          subject: "App Not Working",
          description: "The app is crashing every time I try to book a trip. I've tried reinstalling but the issue persists.",
          category: "technical",
          priority: "medium",
          status: "resolved",
          assignedTo: "Tech Support",
          createdAt: "2024-03-13 11:20 AM",
          updatedAt: "2024-03-14 03:30 PM",
          resolvedAt: "2024-03-14 03:30 PM",
          rating: 4,
          feedback: "Issue resolved quickly. Good support.",
          attachments: ["app_error.png"],
          messages: [
            {
              id: "1",
              sender: "customer",
              message: "The app is crashing every time I try to book a trip. I've tried reinstalling but the issue persists.",
              timestamp: "2024-03-13 11:20 AM"
            },
            {
              id: "2",
              sender: "admin",
              message: "We have identified the issue. Please update your app to version 2.1.5. The issue should be resolved.",
              timestamp: "2024-03-14 03:30 PM"
            }
          ]
        },
        {
          id: "4",
          ticketId: "TKT-2024-004",
          customerName: "Meera Patel",
          customerEmail: "meera@example.com",
          customerPhone: "+91 98765-43213",
          subject: "Refund Request",
          description: "I cancelled my trip due to emergency. I need a refund for the amount paid.",
          category: "refund",
          priority: "medium",
          status: "closed",
          assignedTo: "Finance Team",
          createdAt: "2024-03-12 04:45 PM",
          updatedAt: "2024-03-13 10:15 AM",
          resolvedAt: "2024-03-13 10:15 AM",
          rating: 5,
          feedback: "Refund processed quickly. Excellent service!",
          attachments: ["cancellation_receipt.pdf"],
          messages: [
            {
              id: "1",
              sender: "customer",
              message: "I cancelled my trip due to emergency. I need a refund for the amount paid.",
              timestamp: "2024-03-12 04:45 PM"
            },
            {
              id: "2",
              sender: "admin",
              message: "Your refund has been processed and will be credited to your account within 3-5 business days.",
              timestamp: "2024-03-13 10:15 AM"
            }
          ]
        }
      ];

      setTickets(mockTickets);
      setFilteredTickets(mockTickets);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load support tickets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = tickets;

    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter);
    }

    setFilteredTickets(filtered);
  }, [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-red-100 text-red-800">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'booking': return <Calendar className="w-4 h-4" />;
      case 'payment': return <FileText className="w-4 h-4" />;
      case 'technical': return <Activity className="w-4 h-4" />;
      case 'refund': return <FileText className="w-4 h-4" />;
      case 'general': return <MessageSquare className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const handleTicketAction = (action: string, ticketId: string) => {
    switch (action) {
      case 'view':
        const ticket = tickets.find(t => t.id === ticketId);
        setSelectedTicket(ticket || null);
        setShowTicketDetails(true);
        break;
      case 'reply':
        const replyTicket = tickets.find(t => t.id === ticketId);
        setSelectedTicket(replyTicket || null);
        setShowReplyDialog(true);
        break;
      case 'edit':
        const editTicket = tickets.find(t => t.id === ticketId);
        setSelectedTicket(editTicket || null);
        setEditStatus(editTicket?.status || "");
        setEditPriority(editTicket?.priority || "");
        setEditAssignedTo(editTicket?.assignedTo || "");
        setShowEditDialog(true);
        break;
      case 'delete':
        const deleteTicket = tickets.find(t => t.id === ticketId);
        if (deleteTicket) {
          if (window.confirm(`Are you sure you want to delete ticket ${deleteTicket.ticketId}? This action cannot be undone.`)) {
            const updatedTickets = tickets.filter(t => t.id !== ticketId);
            setTickets(updatedTickets);
            toast({
              title: "Ticket Deleted",
              description: `Ticket ${deleteTicket.ticketId} has been deleted successfully`,
            });
          }
        }
        break;
    }
  };

  const handleReply = () => {
    if (!replyMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply message",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTicket) return;

    // Add the reply to the ticket
    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === selectedTicket.id) {
        const newMessage = {
          id: (ticket.messages.length + 1).toString(),
          sender: 'admin' as const,
          message: replyMessage,
          timestamp: new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        };

        return {
          ...ticket,
          messages: [...ticket.messages, newMessage],
          updatedAt: newMessage.timestamp,
          status: ticket.status === 'open' ? 'in_progress' : ticket.status
        };
      }
      return ticket;
    });

    setTickets(updatedTickets);
    setSelectedTicket(updatedTickets.find(t => t.id === selectedTicket.id) || null);

    toast({
      title: "Reply Sent",
      description: "Your reply has been sent to the customer",
    });

    setReplyMessage("");
    setShowReplyDialog(false);
  };

  const handleEdit = () => {
    if (!editStatus || !editPriority || !editAssignedTo.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTicket) return;

    // Update the ticket with new information
    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === selectedTicket.id) {
        const updatedTicket = {
          ...ticket,
          status: editStatus as 'open' | 'in_progress' | 'resolved' | 'closed',
          priority: editPriority as 'low' | 'medium' | 'high' | 'urgent',
          assignedTo: editAssignedTo,
          updatedAt: new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        };

        // If status is resolved or closed, add resolvedAt timestamp
        if (editStatus === 'resolved' || editStatus === 'closed') {
          updatedTicket.resolvedAt = updatedTicket.updatedAt;
        }

        return updatedTicket;
      }
      return ticket;
    });

    setTickets(updatedTickets);
    setSelectedTicket(updatedTickets.find(t => t.id === selectedTicket.id) || null);

    toast({
      title: "Ticket Updated",
      description: "Ticket information has been updated successfully",
    });

    setShowEditDialog(false);
  };

  const handleBulkStatusChange = (newStatus: string) => {
    if (selectedTickets.length === 0) {
      toast({
        title: "No Tickets Selected",
        description: "Please select tickets to update",
        variant: "destructive",
      });
      return;
    }

    const updatedTickets = tickets.map(ticket => {
      if (selectedTickets.includes(ticket.id)) {
        const updatedTicket = {
          ...ticket,
          status: newStatus as 'open' | 'in_progress' | 'resolved' | 'closed',
          updatedAt: new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        };

        if (newStatus === 'resolved' || newStatus === 'closed') {
          updatedTicket.resolvedAt = updatedTicket.updatedAt;
        }

        return updatedTicket;
      }
      return ticket;
    });

    setTickets(updatedTickets);
    setSelectedTickets([]);
    setShowBulkActions(false);

    toast({
      title: "Bulk Update Complete",
      description: `${selectedTickets.length} tickets have been updated to ${newStatus}`,
    });
  };

  const handleBulkDelete = () => {
    if (selectedTickets.length === 0) {
      toast({
        title: "No Tickets Selected",
        description: "Please select tickets to delete",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedTickets.length} tickets? This action cannot be undone.`)) {
      const updatedTickets = tickets.filter(ticket => !selectedTickets.includes(ticket.id));
      setTickets(updatedTickets);
      setSelectedTickets([]);
      setShowBulkActions(false);

      toast({
        title: "Bulk Delete Complete",
        description: `${selectedTickets.length} tickets have been deleted successfully`,
      });
    }
  };

  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const selectAllTickets = () => {
    setSelectedTickets(filteredTickets.map(ticket => ticket.id));
  };

  const clearSelection = () => {
    setSelectedTickets([]);
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length,
  };

  // ProtectedAdminRoute ensures auth; render content directly

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Management</h1>
          <p className="text-gray-600">Manage all customer support tickets and complaints</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-sm border-0 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Tickets</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">All time tickets</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Open Tickets</p>
                  <p className="text-3xl font-bold text-red-600">{stats.open}</p>
                  <p className="text-xs text-gray-500 mt-1">Requires attention</p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <Clock className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">In Progress</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.inProgress}</p>
                  <p className="text-xs text-gray-500 mt-1">Being handled</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Resolved</p>
                  <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
                  <p className="text-xs text-gray-500 mt-1">Successfully closed</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-sm border-0 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Urgent Tickets</p>
                  <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
                  <p className="text-xs text-gray-500 mt-1">High priority issues</p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>



          <Card className="shadow-sm border-0 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Closed Tickets</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
                  <p className="text-xs text-gray-500 mt-1">Completed cases</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6 shadow-sm border-0">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search tickets by ID, customer name, subject, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
              
              {/* Filter Controls */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Priority</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="booking">Booking</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setPriorityFilter("all");
                      setCategoryFilter("all");
                    }}
                    className="h-10 px-4"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {selectedTickets.length > 0 && (
          <Card className="mb-4 shadow-sm border-0 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedTickets.length} ticket(s) selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    Clear Selection
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Select onValueChange={handleBulkStatusChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Change Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tickets Table */}
        <Card className="shadow-sm border-0">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">All Support Tickets</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Manage and respond to customer support requests</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-sm">
                  {filteredTickets.length} tickets
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-3 text-gray-600 font-medium">Loading support tickets...</p>
                <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the latest tickets</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                <p className="text-gray-600 mb-4">No support tickets match your current filters</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setPriorityFilter("all");
                    setCategoryFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold text-gray-700 py-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedTickets.length === filteredTickets.length && filteredTickets.length > 0}
                            onChange={selectAllTickets}
                            className="rounded border-gray-300"
                          />
                          <span>Select</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4">Ticket ID</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4">Customer</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4">Subject & Description</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4">Category</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4">Priority</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4">Assigned To</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4">Created</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id} className="hover:bg-gray-50 border-b border-gray-100">
                        <TableCell className="py-4">
                          <input
                            type="checkbox"
                            checked={selectedTickets.includes(ticket.id)}
                            onChange={() => toggleTicketSelection(ticket.id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <p className="font-semibold text-blue-600">{ticket.ticketId}</p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <MessageSquare className="w-3 h-3" />
                              <span>{ticket.messages.length} messages</span>
                              {ticket.attachments.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{ticket.attachments.length} attachments</span>
                                </>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{ticket.customerName}</p>
                                <p className="text-sm text-gray-500">{ticket.customerEmail}</p>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="max-w-xs space-y-1">
                            <p className="font-medium text-gray-900 line-clamp-1">{ticket.subject}</p>
                            <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-gray-100 rounded-lg">
                              {getCategoryIcon(ticket.category)}
                            </div>
                            <span className="text-sm font-medium capitalize text-gray-700">{ticket.category}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {getPriorityBadge(ticket.priority)}
                        </TableCell>
                        <TableCell className="py-4">
                          {getStatusBadge(ticket.status)}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-green-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">{ticket.assignedTo}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900">{ticket.createdAt.split(' ')[0]}</p>
                            <p className="text-xs text-gray-500">{ticket.createdAt.split(' ')[1]}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center justify-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTicketAction('view', ticket.id)}
                              className="h-8 w-8 p-0 hover:bg-blue-50"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTicketAction('reply', ticket.id)}
                              className="h-8 w-8 p-0 hover:bg-green-50"
                              title="Reply"
                            >
                              <Reply className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTicketAction('edit', ticket.id)}
                              className="h-8 w-8 p-0 hover:bg-yellow-50"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTicketAction('delete', ticket.id)}
                              className="h-8 w-8 p-0 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-gray-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ticket Details Dialog */}
      <Dialog open={showTicketDetails} onOpenChange={setShowTicketDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Ticket Information</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Ticket ID:</span>
                      <span className="text-sm font-medium">{selectedTicket.ticketId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className="text-sm font-medium">{selectedTicket.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Priority:</span>
                      <span className="text-sm font-medium">{selectedTicket.priority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Category:</span>
                      <span className="text-sm font-medium capitalize">{selectedTicket.category}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Customer Information</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">{selectedTicket.customerName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{selectedTicket.customerEmail}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{selectedTicket.customerPhone}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Subject</Label>
                <p className="mt-1 font-medium">{selectedTicket.subject}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Description</Label>
                <p className="mt-1 text-sm text-gray-600">{selectedTicket.description}</p>
              </div>

              {selectedTicket.attachments.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Attachments</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedTicket.attachments.map((attachment, index) => (
                      <Badge key={index} variant="outline">
                        {attachment}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-600">Conversation</Label>
                <div className="mt-2 space-y-4 max-h-60 overflow-y-auto">
                  {selectedTicket.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.sender === 'customer'
                          ? 'bg-gray-100 ml-0'
                          : 'bg-blue-100 ml-8'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium capitalize">
                          {message.sender === 'customer' ? selectedTicket.customerName : 'Support Team'}
                        </span>
                        <span className="text-xs text-gray-500">{message.timestamp}</span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  ))}
                </div>
              </div>


            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to Ticket</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Ticket</Label>
                <p className="mt-1 text-sm">{selectedTicket.ticketId} - {selectedTicket.subject}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Your Reply</Label>
                <Textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Enter your reply message..."
                  className="mt-1"
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleReply}>
                  Send Reply
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-600">Ticket</Label>
                <p className="mt-1 text-sm font-medium">{selectedTicket.ticketId} - {selectedTicket.subject}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-2 block">Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-2 block">Priority</Label>
                  <Select value={editPriority} onValueChange={setEditPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-2 block">Assigned To</Label>
                  <Input
                    value={editAssignedTo}
                    onChange={(e) => setEditAssignedTo(e.target.value)}
                    placeholder="Enter assignee name"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Current Status:</span>
                    <span className="ml-2 font-medium">{selectedTicket.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Current Priority:</span>
                    <span className="ml-2 font-medium">{selectedTicket.priority}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Currently Assigned:</span>
                    <span className="ml-2 font-medium">{selectedTicket.assignedTo}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
                  Update Ticket
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSupportManagement; 