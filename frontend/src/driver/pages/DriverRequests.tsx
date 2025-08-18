import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DriverTopNavigation from "@/driver/components/DriverTopNavigation";
import DriverFooter from "@/driver/components/DriverFooter";
import { Home, MessageSquare, Car, User, LogOut, Clock, CheckCircle, XCircle, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDriverAuth } from "@/contexts/DriverAuthContext";

const DriverRequests = () => {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useDriverAuth();
  const [activeTab, setActiveTab] = useState("requests");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterVehicleType, setFilterVehicleType] = useState("all");
  const [sortBy, setSortBy] = useState("timestamp");
  const [requests, setRequests] = useState([
    {
      id: "1",
      customerName: "Rahul Kumar",
      customerPhone: "+91 9876543210",
      pickupLocation: "Connaught Place, New Delhi",
      dropLocation: "Lajpat Nagar, New Delhi",
      vehicleType: "Car",
      seats: 4,
      status: "pending",
      requestTime: "2024-03-15 14:30",
      estimatedFare: 450,
      customerRating: 4.8,
      totalRides: 156,
      timestamp: "2024-03-15 14:30"
    },
    {
      id: "2",
      customerName: "Priya Sharma",
      customerPhone: "+91 8765432109",
      pickupLocation: "Khan Market, New Delhi",
      dropLocation: "Saket, New Delhi",
      vehicleType: "SUV",
      seats: 6,
      status: "accepted",
      requestTime: "2024-03-15 15:15",
      estimatedFare: 380,
      customerRating: 4.9,
      totalRides: 89,
      timestamp: "2024-03-15 15:15"
    },
    {
      id: "3",
      customerName: "Amit Singh",
      customerPhone: "+91 7654321098",
      pickupLocation: "Hauz Khas, New Delhi",
      dropLocation: "Dwarka, New Delhi",
      vehicleType: "Car",
      seats: 4,
      status: "completed",
      requestTime: "2024-03-15 13:45",
      estimatedFare: 520,
      customerRating: 4.7,
      totalRides: 234,
      timestamp: "2024-03-15 13:45"
    },
    {
      id: "4",
      customerName: "Neha Patel",
      customerPhone: "+91 6543210987",
      pickupLocation: "Rajouri Garden, New Delhi",
      dropLocation: "Punjabi Bagh, New Delhi",
      vehicleType: "Auto-Ricksaw",
      seats: 3,
      status: "cancelled",
      requestTime: "2024-03-15 16:00",
      estimatedFare: 120,
      customerRating: 4.6,
      totalRides: 67,
      timestamp: "2024-03-15 16:00"
    }
  ]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/driver-auth');
    }
  }, [isLoggedIn, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/driver-auth');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case "home":
        navigate('/driver');
        break;
      case "myvehicle":
        navigate('/driver/myvehicle');
        break;
      case "profile":
        navigate('/driver/profile');
        break;
      default:
        navigate('/driver/requests');
    }
  };

  const handleAction = (requestId: string, action: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: action } : req
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'declined': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter and sort requests
  const filteredRequests = selectedStatus === "all"
    ? requests
    : requests.filter(req => req.status === selectedStatus);

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const acceptedRequests = requests.filter(req => req.status === 'accepted');
  const declinedRequests = requests.filter(req => req.status === 'declined');

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DriverTopNavigation />
      
      {/* Driver Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Driver Requests</h1>
              <p className="text-blue-100">Manage ride requests and bookings</p>
            </div>
            <Button 
              variant="outline" 
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 pb-20">
        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by customer name, pickup, or drop location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterVehicleType} onValueChange={setFilterVehicleType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  <SelectItem value="Sedan">Sedan</SelectItem>
                  <SelectItem value="Hatchback">Hatchback</SelectItem>
                  <SelectItem value="SUV">SUV</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timestamp">Latest First</SelectItem>
                  <SelectItem value="price">Price High-Low</SelectItem>
                  <SelectItem value="distance">Distance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Request Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{pendingRequests.length}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{acceptedRequests.length}</div>
              <div className="text-sm text-gray-600">Accepted</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{declinedRequests.length}</div>
              <div className="text-sm text-gray-600">Declined</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Pending Requests</h2>
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No pending requests at the moment</p>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-blue-600" />
                      <span>{request.customerName}</span>
                      <Badge variant="secondary">{request.vehicleType}</Badge>
                    </CardTitle>
                    <div className="text-sm text-gray-500">{request.timestamp}</div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Route Information */}
                  <div className="space-y-2">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Pickup</p>
                        <p className="text-gray-600">{request.pickupLocation}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Drop</p>
                        <p className="text-gray-600">{request.dropLocation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <p className="font-medium">{request.customerPhone}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Seats:</span>
                      <p className="font-medium">{request.seats}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Rating:</span>
                      <p className="font-medium">{request.customerRating}/5</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Rides:</span>
                      <p className="font-medium">{request.totalRides}</p>
                    </div>
                  </div>

                  {/* Fare and Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-lg font-bold text-green-600">
                      ₹{request.estimatedFare}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => handleAction(request.id, 'declined')}
                      >
                        Decline
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleAction(request.id, 'accepted')}
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Accepted Requests */}
        {acceptedRequests.length > 0 && (
          <div className="space-y-4 mt-8">
            <h2 className="text-xl font-bold text-gray-800">Accepted Requests</h2>
            {acceptedRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow border-green-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-green-600" />
                      <span>{request.customerName}</span>
                      <Badge className="bg-green-100 text-green-800">Accepted</Badge>
                    </CardTitle>
                    <div className="text-sm text-gray-500">{request.timestamp}</div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Route Information */}
                  <div className="space-y-2">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Pickup</p>
                        <p className="text-gray-600">{request.pickupLocation}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Drop</p>
                        <p className="text-gray-600">{request.dropLocation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Fare and Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-lg font-bold text-green-600">
                      ₹{request.estimatedFare}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAction(request.id, 'completed')}
                      >
                        Mark Complete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <DriverFooter />
    </div>
  );
};

export default DriverRequests; 