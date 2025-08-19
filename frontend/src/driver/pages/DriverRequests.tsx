import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DriverTopNavigation from "@/driver/components/DriverTopNavigation";
import { Home, MessageSquare, Car, User, Check, X, MapPin, Clock, User as UserIcon, Phone, Sliders, Filter, Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface RideRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  dropLocation: string;
  originalPrice: number;
  adjustedPrice: number;
  distance: string;
  duration: string;
  passengers: number;
  vehicleType: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: string;
}

const DriverRequests = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("requests");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterVehicleType, setFilterVehicleType] = useState("all");
  const [sortBy, setSortBy] = useState("timestamp");
  const [requests, setRequests] = useState<RideRequest[]>([
    {
      id: "1",
      customerName: "Rahul Sharma",
      customerPhone: "+91 98765 43210",
      pickupLocation: "Connaught Place, New Delhi",
      dropLocation: "Indira Gandhi International Airport",
      originalPrice: 1200,
      adjustedPrice: 1200,
      distance: "18.5 km",
      duration: "45 min",
      passengers: 2,
      vehicleType: "Sedan",
      status: 'pending',
      timestamp: "2 min ago"
    },
    {
      id: "2",
      customerName: "Priya Patel",
      customerPhone: "+91 87654 32109",
      pickupLocation: "Lajpat Nagar, New Delhi",
      dropLocation: "Gurgaon Cyber City",
      originalPrice: 800,
      adjustedPrice: 800,
      distance: "12.3 km",
      duration: "35 min",
      passengers: 1,
      vehicleType: "Hatchback",
      status: 'pending',
      timestamp: "5 min ago"
    },
    {
      id: "3",
      customerName: "Amit Kumar",
      customerPhone: "+91 76543 21098",
      pickupLocation: "Dwarka Sector 12",
      dropLocation: "Rajiv Chowk Metro Station",
      originalPrice: 950,
      adjustedPrice: 950,
      distance: "15.2 km",
      duration: "40 min",
      passengers: 3,
      vehicleType: "SUV",
      status: 'pending',
      timestamp: "8 min ago"
    }
  ]);

  useEffect(() => {
    const driverLoggedIn = localStorage.getItem('isDriverLoggedIn');
    if (!driverLoggedIn) {
      navigate('/driver-auth');
    } else {
      setIsLoggedIn(true);
    }
  }, [navigate]);

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



  const handleAcceptRequest = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'accepted' } : req
    ));
    toast({
      title: "Request Accepted!",
      description: "You have successfully accepted the ride request.",
      variant: "default",
    });
  };

  const handleDeclineRequest = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'declined' } : req
    ));
    toast({
      title: "Request Declined",
      description: "The ride request has been declined.",
      variant: "destructive",
    });
  };

  const handleCallCustomer = (phone: string) => {
    window.open(`tel:${phone}`, '_blank');
  };

  const handleSendMessage = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
  };

  // Filter and sort requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.dropLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || req.status === filterStatus;
    const matchesVehicle = filterVehicleType === "all" || req.vehicleType === filterVehicleType;
    return matchesSearch && matchesStatus && matchesVehicle;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    switch (sortBy) {
      case "price":
        return b.adjustedPrice - a.adjustedPrice;
      case "distance":
        return parseFloat(b.distance) - parseFloat(a.distance);
      case "timestamp":
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      default:
        return 0;
    }
  });

  const pendingRequests = sortedRequests.filter(req => req.status === 'pending');
  const acceptedRequests = sortedRequests.filter(req => req.status === 'accepted');
  const declinedRequests = sortedRequests.filter(req => req.status === 'declined');

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DriverTopNavigation />
      
      {/* Driver Header */}
      <div className="bg-blue-600 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Owner Driver Module</h1>
              <p className="text-blue-100">Vehicle Requests</p>
            </div>
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
                      <UserIcon className="w-5 h-5 text-blue-600" />
                      <span>{request.customerName}</span>
                      <Badge variant="secondary">{request.vehicleType}</Badge>
                    </CardTitle>
                    <div className="text-sm text-gray-500">{request.timestamp}</div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Route Information */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="font-medium">Pickup:</span>
                      <span>{request.pickupLocation}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="w-4 h-4 text-red-600" />
                      <span className="font-medium">Drop:</span>
                      <span>{request.dropLocation}</span>
                    </div>
                  </div>

                                                        {/* Trip Details */}
                   <div className="space-y-3 text-sm">
                     <div className="flex items-center space-x-2">
                       <MapPin className="w-4 h-4 text-gray-500" />
                       <span className="font-medium">Distance:</span>
                       <span>{request.distance}</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <UserIcon className="w-4 h-4 text-gray-500" />
                       <span className="font-medium">Vehicle Count:</span>
                       <span>{request.passengers}</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <Car className="w-4 h-4 text-gray-500" />
                       <span className="font-medium">Vehicle Type:</span>
                       <span>{request.vehicleType}</span>
                     </div>
                   </div>
                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleAcceptRequest(request.id)}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                      onClick={() => handleDeclineRequest(request.id)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
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
              <Card key={request.id} className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{request.customerName}</div>
                      <div className="text-sm text-gray-600">{request.pickupLocation} → {request.dropLocation}</div>
                    </div>
                    <Badge className="bg-green-600">Accepted</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur-md z-50 shadow-lg">
        <div className="flex justify-around py-3">
          <button 
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 ${
              activeTab === "home" 
                ? "text-blue-600 bg-blue-50" 
                : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            }`}
            onClick={() => handleTabChange("home")}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button 
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 ${
              activeTab === "requests" 
                ? "text-blue-600 bg-blue-50" 
                : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            }`}
            onClick={() => handleTabChange("requests")}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs font-medium">Requests</span>
          </button>
          <button 
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 ${
              activeTab === "myvehicle" 
                ? "text-blue-600 bg-blue-50" 
                : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            }`}
            onClick={() => handleTabChange("myvehicle")}
          >
            <Car className="w-5 h-5" />
            <span className="text-xs font-medium">MyVehicle</span>
          </button>
          <button 
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 ${
              activeTab === "profile" 
                ? "text-blue-600 bg-blue-50" 
                : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            }`}
            onClick={() => handleTabChange("profile")}
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverRequests; 