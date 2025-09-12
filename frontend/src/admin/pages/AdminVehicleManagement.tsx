import { useState, useEffect } from "react";
import AdminLayout from "@/admin/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminVehicles } from "@/services/adminApi";
import { 
  Car, 
  Bus, 
  Truck, 
  Bike,
  Search,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  MapPin,
  Star,
  Loader2,
  RefreshCw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Vehicle {
  _id: string;
  type: 'car' | 'bus' | 'auto';
  brand: string;
  model: string;
  registrationNumber: string;
  driver: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    isActive: boolean;
  };
  bookingStatus: 'available' | 'booked' | 'in_trip' | 'maintenance' | 'offline';
  currentLocation?: {
    address: string;
    coordinates: [number, number];
    lastUpdated: string;
  };
  vehicleLocation?: {
    address: string;
    coordinates: [number, number];
    city?: string;
    state?: string;
    lastUpdated: string;
  };
  maintenance?: {
    lastService?: string;
    nextService?: string;
    isUnderMaintenance: boolean;
    maintenanceReason?: string;
  };
  statistics: {
    totalTrips: number;
    totalDistance: number;
    totalEarnings: number;
  };
  ratings: {
    average: number;
    count: number;
  };
  fuelType: 'petrol' | 'diesel' | 'cng' | 'electric' | 'hybrid';
  transmission: 'manual' | 'automatic';
  seatingCapacity: number;
  engineCapacity?: number;
  mileage?: number;
  isAc: boolean;
  isSleeper: boolean;
  amenities: string[];
  documents: {
    rc: {
      number: string;
      expiryDate: string;
      isVerified: boolean;
    };
    insurance: {
      number?: string;
      expiryDate?: string;
      isVerified: boolean;
    };
    permit: {
      number?: string;
      expiryDate?: string;
      isVerified: boolean;
    };
    fitness: {
      number?: string;
      expiryDate?: string;
      isVerified: boolean;
    };
    puc?: {
      number?: string;
      expiryDate?: string;
      isVerified: boolean;
    };
  };
  approvalStatus: 'pending' | 'approved' | 'rejected';
  isAvailable: boolean;
  isActive: boolean;
  isVerified: boolean;
  isApproved: boolean;
  adminNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminVehicleManagement = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<string | null>(null);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const response = await adminVehicles.getAll({
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      if (response.success) {
        const vehiclesData = response.data.docs || response.data || [];
        console.log('Vehicle data received:', vehiclesData[0]); // Debug log
        setVehicles(vehiclesData);
        setFilteredVehicles(vehiclesData);
      } else {
        throw new Error(response.message || 'Failed to fetch vehicles');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: "Error",
        description: "Failed to load vehicles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchVehicles();
    setIsRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Vehicle data has been refreshed",
    });
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    let filtered = vehicles;

    if (searchTerm) {
      filtered = filtered.filter(vehicle =>
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${vehicle.driver.firstName} ${vehicle.driver.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(vehicle => vehicle.bookingStatus === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(vehicle => vehicle.type === typeFilter);
    }

    setFilteredVehicles(filtered);
  }, [vehicles, searchTerm, statusFilter, typeFilter]);

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'car': return <Car className="w-5 h-5" />;
      case 'bus': return <Bus className="w-5 h-5" />;
      case 'truck': return <Truck className="w-5 h-5" />;
      case 'bike': return <Bike className="w-5 h-5" />;
      case 'auto': return <Car className="w-5 h-5" />;
      default: return <Car className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Available</Badge>;
      case 'booked':
        return <Badge className="bg-blue-100 text-blue-800">Booked</Badge>;
      case 'in_trip':
        return <Badge className="bg-purple-100 text-purple-800">In Trip</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      case 'offline':
        return <Badge variant="secondary">Offline</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleVehicleAction = (action: string, vehicleId: string) => {
    switch (action) {
      case 'view':
        const vehicle = vehicles.find(v => v._id === vehicleId);
        setSelectedVehicle(vehicle || null);
        setShowVehicleDetails(true);
        break;
      case 'delete':
        const vehicleToDelete = vehicles.find(v => v._id === vehicleId);
        setVehicleToDelete(vehicleToDelete || null);
        setShowDeleteConfirm(true);
        break;
    }
  };

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;

    try {
      setDeletingVehicle(vehicleToDelete._id);
      
      // Call the backend API to delete the vehicle
      const response = await adminVehicles.deleteVehicle(vehicleToDelete._id);
      
      if (response.success) {
        // Update local state after successful deletion
        const updatedVehicles = vehicles.filter(v => v._id !== vehicleToDelete._id);
        setVehicles(updatedVehicles);
        setFilteredVehicles(updatedVehicles);
        
        toast({
          title: "Vehicle Deleted",
          description: response.message || `${vehicleToDelete.brand} ${vehicleToDelete.model} has been deleted successfully.`,
        });
        
        setShowDeleteConfirm(false);
        setVehicleToDelete(null);
      } else {
        throw new Error(response.message || 'Failed to delete vehicle');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to delete vehicle. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingVehicle(null);
    }
  };

  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.bookingStatus === 'available').length,
    maintenance: vehicles.filter(v => v.bookingStatus === 'maintenance').length,
    booked: vehicles.filter(v => v.bookingStatus === 'booked' || v.bookingStatus === 'in_trip').length,
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vehicle Management</h1>
          <p className="text-gray-600">Manage all vehicles in the fleet</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Car className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.available}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Car className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Booked</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.booked}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Maintenance</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.maintenance}</p>
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
                    placeholder="Search vehicles..."
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
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="in_trip">In Trip</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="bus">Bus</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                className="w-full md:w-auto"
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vehicles Cards */}
        <Card>
          <CardHeader>
            <CardTitle>All Vehicles ({filteredVehicles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Loading vehicles...</p>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="text-center py-8">
                <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No vehicles found matching your criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVehicles.map((vehicle) => (
                  <Card key={vehicle._id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      {/* Vehicle Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            {getVehicleIcon(vehicle.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{vehicle.brand} {vehicle.model}</h3>
                            <p className="text-sm text-gray-500">{vehicle.registrationNumber}</p>
                          </div>
                        </div>
                        {getStatusBadge(vehicle.bookingStatus)}
                      </div>

                      {/* Vehicle Details */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Owner</span>
                          <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{vehicle.driver.firstName} {vehicle.driver.lastName}</span>
                            {!vehicle.driver.isActive && (
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                Suspended
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Current Location</span>
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                            <span className="text-sm font-medium">
                              {vehicle.currentLocation?.address || 'Not specified'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Base Location</span>
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                            <span className="text-sm font-medium">
                              {vehicle.vehicleLocation?.address || 'Location not set'}
                            </span>
                          </div>
                        </div>



                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Fuel Type</span>
                          <span className="text-sm font-medium capitalize">{vehicle.fuelType}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Seats</span>
                          <span className="text-sm font-medium">{vehicle.seatingCapacity}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Total Trips</span>
                          <span className="text-sm font-medium">{vehicle.statistics.totalTrips || 0}</span>
                        </div>


                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2 mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleVehicleAction('view', vehicle._id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleVehicleAction('delete', vehicle._id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Details Dialog */}
      <Dialog open={showVehicleDetails} onOpenChange={setShowVehicleDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {selectedVehicle && getVehicleIcon(selectedVehicle.type)}
              Vehicle Details
            </DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Vehicle Type</Label>
                    <p className="mt-1 font-medium">{selectedVehicle.type.toUpperCase()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Brand & Model</Label>
                    <p className="mt-1 font-medium">{selectedVehicle.brand} {selectedVehicle.model}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Registration Number</Label>
                    <p className="mt-1 font-medium">{selectedVehicle.registrationNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Seating Capacity</Label>
                    <p className="mt-1 font-medium">{selectedVehicle.seatingCapacity} seats</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Specifications */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Fuel Type</Label>
                    <p className="mt-1 font-medium capitalize">{selectedVehicle.fuelType}</p>
                  </div>
                  {selectedVehicle.engineCapacity && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Engine Capacity</Label>
                      <p className="mt-1 font-medium">{selectedVehicle.engineCapacity} CC</p>
                    </div>
                  )}
                  {selectedVehicle.mileage && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Mileage</Label>
                      <p className="mt-1 font-medium">{selectedVehicle.mileage} km/l</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-gray-600">AC Available</Label>
                    <p className="mt-1 font-medium">{selectedVehicle.isAc ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Sleeper</Label>
                    <p className="mt-1 font-medium">{selectedVehicle.isSleeper ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              {/* Driver Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Driver Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Driver Name</Label>
                    <p className="mt-1 font-medium">{selectedVehicle.driver.firstName} {selectedVehicle.driver.lastName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                    <p className="mt-1 font-medium">{selectedVehicle.driver.phone}</p>
                  </div>
                  {selectedVehicle.driver.email && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="mt-1 font-medium">{selectedVehicle.driver.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Status Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Booking Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedVehicle.bookingStatus)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Approval Status</Label>
                    <p className="mt-1 font-medium capitalize">{selectedVehicle.approvalStatus}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Available for Booking</Label>
                    <p className="mt-1 font-medium">{selectedVehicle.isAvailable ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Active</Label>
                    <p className="mt-1 font-medium">{selectedVehicle.isActive ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Verified</Label>
                    <p className="mt-1 font-medium">{selectedVehicle.isVerified ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Approved</Label>
                    <p className="mt-1 font-medium">{selectedVehicle.isApproved ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Total Trips</Label>
                    <p className="mt-1 font-medium">{selectedVehicle.statistics.totalTrips || 0}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Total Distance</Label>
                    <p className="mt-1 font-medium">{selectedVehicle.statistics.totalDistance || 0} km</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Total Earnings</Label>
                    <p className="mt-1 font-medium">₹{selectedVehicle.statistics.totalEarnings || 0}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Average Rating</Label>
                    <div className="flex items-center mt-1">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="font-medium">{selectedVehicle.ratings.average || 'N/A'}</span>
                      <span className="text-sm text-gray-500 ml-1">({selectedVehicle.ratings.count || 0} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Base Location</Label>
                    <p className="mt-1 font-medium">{selectedVehicle.vehicleLocation?.address || 'Not specified'}</p>
                  </div>
                  {selectedVehicle.currentLocation?.address && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Current Location</Label>
                      <p className="mt-1 font-medium">{selectedVehicle.currentLocation.address}</p>
                    </div>
                  )}
                  {selectedVehicle.vehicleLocation?.lastUpdated && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Last Updated</Label>
                      <p className="mt-1 font-medium">{formatDate(selectedVehicle.vehicleLocation.lastUpdated)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities */}
              {selectedVehicle.amenities && selectedVehicle.amenities.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedVehicle.amenities.map((amenity, index) => (
                      <Badge key={index} variant="outline" className="capitalize">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}


            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Vehicle</DialogTitle>
          </DialogHeader>
          {vehicleToDelete && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  {getVehicleIcon(vehicleToDelete.type)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{vehicleToDelete.brand} {vehicleToDelete.model}</p>
                  <p className="text-sm text-gray-500">{vehicleToDelete.registrationNumber}</p>
                </div>
              </div>
              
              <p className="text-gray-600">
                Are you sure you want to delete this vehicle? This action cannot be undone.
              </p>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setVehicleToDelete(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteVehicle}
                  disabled={deletingVehicle === vehicleToDelete._id}
                  className="flex-1"
                >
                  {deletingVehicle === vehicleToDelete._id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Delete Vehicle
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminVehicleManagement; 