import { useState, useEffect } from "react";

import AdminLayout from "@/admin/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Star
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Vehicle {
  id: string;
  type: 'car' | 'bus' | 'truck' | 'bike';
  model: string;
  brand: string;
  year: number;
  registrationNumber: string;
  owner: string;
  ownerPhone: string;
  status: 'active' | 'inactive' | 'maintenance' | 'pending';
  location: string;
  lastService: string;
  nextService: string;
  totalTrips: number;
  rating: number;
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  seats: number;
  documents: {
    rc: boolean;
    insurance: boolean;
    permit: boolean;
    fitness: boolean;
  };
}

const AdminVehicleManagement = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const mockVehicles: Vehicle[] = [
          {
            id: "1",
            type: "car",
            model: "Swift Dzire",
            brand: "Maruti Suzuki",
            year: 2022,
            registrationNumber: "DL-01-AB-1234",
            owner: "Rahul Kumar",
            ownerPhone: "+91 98765-43210",
            status: "active",
            location: "Delhi",
            lastService: "2024-01-15",
            nextService: "2024-04-15",
            totalTrips: 45,
            rating: 4.5,
            fuelType: "petrol",
            seats: 4,
            documents: { rc: true, insurance: true, permit: true, fitness: true }
          },
          {
            id: "2",
            type: "bus",
            model: "Volvo B8R",
            brand: "Volvo",
            year: 2021,
            registrationNumber: "MH-02-CD-5678",
            owner: "Mumbai Travels",
            ownerPhone: "+91 98765-43211",
            status: "active",
            location: "Mumbai",
            lastService: "2024-02-01",
            nextService: "2024-05-01",
            totalTrips: 120,
            rating: 4.8,
            fuelType: "diesel",
            seats: 45,
            documents: { rc: true, insurance: true, permit: true, fitness: true }
          },
          {
            id: "3",
            type: "truck",
            model: "Tata 407",
            brand: "Tata",
            year: 2020,
            registrationNumber: "KA-03-EF-9012",
            owner: "Karnataka Logistics",
            ownerPhone: "+91 98765-43212",
            status: "maintenance",
            location: "Bangalore",
            lastService: "2024-01-20",
            nextService: "2024-04-20",
            totalTrips: 78,
            rating: 4.2,
            fuelType: "diesel",
            seats: 2,
            documents: { rc: true, insurance: true, permit: true, fitness: false }
          },
          {
            id: "4",
            type: "bike",
            model: "Pulsar 150",
            brand: "Bajaj",
            year: 2023,
            registrationNumber: "TN-04-GH-3456",
            owner: "Suresh Kumar",
            ownerPhone: "+91 98765-43213",
            status: "pending",
            location: "Chennai",
            lastService: "2024-03-01",
            nextService: "2024-06-01",
            totalTrips: 23,
            rating: 4.0,
            fuelType: "petrol",
            seats: 2,
            documents: { rc: true, insurance: false, permit: true, fitness: true }
          }
        ];

        setVehicles(mockVehicles);
        setFilteredVehicles(mockVehicles);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load vehicles",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    let filtered = vehicles;

    if (searchTerm) {
      filtered = filtered.filter(vehicle =>
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.owner.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter);
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
      default: return <Car className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleVehicleAction = (action: string, vehicleId: string) => {
    switch (action) {
      case 'view':
        const vehicle = vehicles.find(v => v.id === vehicleId);
        setSelectedVehicle(vehicle || null);
        setShowVehicleDetails(true);
        break;
      case 'delete':
        const vehicleToDelete = vehicles.find(v => v.id === vehicleId);
        setVehicleToDelete(vehicleToDelete || null);
        setShowDeleteConfirm(true);
        break;
    }
  };

  const handleDeleteVehicle = () => {
    if (vehicleToDelete) {
      const updatedVehicles = vehicles.filter(v => v.id !== vehicleToDelete.id);
      setVehicles(updatedVehicles);
      setFilteredVehicles(updatedVehicles);
      
      toast({
        title: "Vehicle Deleted",
        description: `${vehicleToDelete.brand} ${vehicleToDelete.model} has been deleted successfully.`,
      });
      
      setShowDeleteConfirm(false);
      setVehicleToDelete(null);
    }
  };

  const stats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'active').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    pending: vehicles.filter(v => v.status === 'pending').length,
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
                      <p className="text-sm font-medium text-gray-600">Active</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
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

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
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
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

                 {/* Vehicles Cards */}
            <Card>
              <CardHeader>
                <CardTitle>All Vehicles</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading vehicles...</p>
                  </div>
                ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredVehicles.map((vehicle) => (
                   <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
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
                         {getStatusBadge(vehicle.status)}
                       </div>

                       {/* Vehicle Details */}
                       <div className="space-y-3">
                         <div className="flex items-center justify-between">
                           <span className="text-sm text-gray-600">Owner</span>
                           <span className="text-sm font-medium">{vehicle.owner}</span>
                              </div>
                         
                         <div className="flex items-center justify-between">
                           <span className="text-sm text-gray-600">Location</span>
                              <div className="flex items-center">
                             <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                             <span className="text-sm font-medium">{vehicle.location}</span>
                           </div>
                              </div>

                         <div className="flex items-center justify-between">
                           <span className="text-sm text-gray-600">Rating</span>
                              <div className="flex items-center">
                             <Star className="w-3 h-3 text-yellow-400 mr-1" />
                             <span className="text-sm font-medium">{vehicle.rating}</span>
                           </div>
                         </div>

                         <div className="flex items-center justify-between">
                           <span className="text-sm text-gray-600">Total Trips</span>
                           <span className="text-sm font-medium">{vehicle.totalTrips}</span>
                         </div>

                         <div className="flex items-center justify-between">
                           <span className="text-sm text-gray-600">Fuel Type</span>
                           <span className="text-sm font-medium capitalize">{vehicle.fuelType}</span>
                         </div>

                         <div className="flex items-center justify-between">
                           <span className="text-sm text-gray-600">Seats</span>
                           <span className="text-sm font-medium">{vehicle.seats}</span>
                         </div>

                         <div className="border-t pt-3">
                           <div className="flex items-center justify-between mb-2">
                             <span className="text-sm text-gray-600">Last Service</span>
                             <span className="text-sm font-medium">{vehicle.lastService}</span>
                           </div>
                           <div className="flex items-center justify-between">
                             <span className="text-sm text-gray-600">Next Service</span>
                             <span className="text-sm font-medium">{vehicle.nextService}</span>
                           </div>
                              </div>
                              </div>

                       {/* Actions */}
                       <div className="flex space-x-2 mt-4 pt-4 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                           className="flex-1"
                                  onClick={() => handleVehicleAction('view', vehicle.id)}
                                >
                           <Eye className="w-4 h-4 mr-2" />
                           View Details
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                           className="flex-1"
                                  onClick={() => handleVehicleAction('delete', vehicle.id)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vehicle Details</DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Vehicle Type</Label>
                  <p className="mt-1">{selectedVehicle.type.toUpperCase()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Brand & Model</Label>
                  <p className="mt-1">{selectedVehicle.brand} {selectedVehicle.model}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Year</Label>
                  <p className="mt-1">{selectedVehicle.year}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Registration</Label>
                  <p className="mt-1">{selectedVehicle.registrationNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Owner</Label>
                  <p className="mt-1">{selectedVehicle.owner}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone</Label>
                  <p className="mt-1">{selectedVehicle.ownerPhone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Location</Label>
                  <p className="mt-1">{selectedVehicle.location}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Fuel Type</Label>
                  <p className="mt-1">{selectedVehicle.fuelType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Seats</Label>
                  <p className="mt-1">{selectedVehicle.seats}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Total Trips</Label>
                  <p className="mt-1">{selectedVehicle.totalTrips}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Documents Status</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    {selectedVehicle.documents.rc ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm">RC Book</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedVehicle.documents.insurance ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm">Insurance</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedVehicle.documents.permit ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm">Permit</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedVehicle.documents.fitness ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm">Fitness</span>
                  </div>
                </div>
              </div>
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
                  className="flex-1"
                >
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