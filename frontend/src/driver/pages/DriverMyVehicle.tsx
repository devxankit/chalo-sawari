import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DriverTopNavigation from "@/driver/components/DriverTopNavigation";
import AddVehicleForm from "@/driver/components/AddVehicleForm";
import { Home, MessageSquare, Car, User, Plus, Edit, Trash2, MapPin, Calendar, Fuel, Settings, CheckCircle, AlertCircle, Search, Filter, Upload, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

import VehicleApiService, { Vehicle, CreateVehicleData, UpdateVehicleData } from "@/services/vehicleApi";

// Vehicle type configurations
const VEHICLE_CONFIGS = {
  'auto': {
    name: 'Auto',
    icon: '🛺',
    defaultCapacity: 3,
    variants: ['Fuel', 'Electric', 'CNG'],
    amenities: ['charging', 'usb', 'gps'],
    defaultBaseFare: 50,
    defaultPerKmRate: 15
  },
  'car': {
    name: 'Car',
    icon: '🚗',
    defaultCapacity: 4,
    variants: ['Sedan', 'Hatchback', 'SUV'],
    amenities: ['ac', 'charging', 'usb', 'bluetooth', 'gps'],
    defaultBaseFare: 100,
    defaultPerKmRate: 20
  },
  'bus': {
    name: 'Bus',
    icon: '🚌',
    defaultCapacity: 40,
    variants: ['AC Sleeper', 'Non-AC Sleeper', '52-Seater AC/Non-AC', '40-Seater AC/Non-AC', '32-Seater AC/Non-AC', '26-Seater AC/Non-AC', '17-Seater AC/Non-AC'],
    amenities: ['ac', 'sleeper', 'charging', 'usb', 'gps', 'camera', 'wifi', 'tv'],
    defaultBaseFare: 200,
    defaultPerKmRate: 25
  }
};

const DriverMyVehicle = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("myvehicle");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'maintenance'>("all");
  const [filterType, setFilterType] = useState<'all' | 'bus' | 'car' | 'auto'>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: string]: number }>({});
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API service
  const vehicleApi = new VehicleApiService(
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    () => ({
      'Authorization': `Bearer ${localStorage.getItem('driverToken')}`
    })
  );

  useEffect(() => {
    const initializeDriverModule = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if driver is logged in
        const driverToken = localStorage.getItem('driverToken');
        if (!driverToken) {
          navigate('/driver-auth');
          return;
        }
        
        setIsLoggedIn(true);
        
        // Load driver's vehicles
        await loadVehicles();
        
      } catch (err) {
        console.error('Error initializing driver module:', err);
        setError('Failed to load driver module. Please try refreshing the page.');
        toast({
          title: "Error",
          description: "Failed to load driver module. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeDriverModule();
  }, [navigate]);

  const loadVehicles = async () => {
    try {
      const response = await vehicleApi.getDriverVehicles({
        page: 1,
        limit: 100,
        status: filterStatus === 'all' ? undefined : filterStatus,
        type: filterType === 'all' ? undefined : filterType
      });

      let vehiclesData: Vehicle[] = [];
      if (response.success && Array.isArray(response.data)) {
        vehiclesData = response.data;
      } else if (response.success && typeof response.data === 'object' && 'docs' in response.data) {
        vehiclesData = (response.data as any).docs;
      }

      // Populate pricing for all vehicles
      const vehiclesWithPricing = await vehicleApi.populateVehiclePricing(vehiclesData);
      setVehicles(vehiclesWithPricing);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      toast({
        title: "Error",
        description: "Failed to load vehicles. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case "home":
        navigate('/driver');
        break;
      case "requests":
        navigate('/driver/requests');
        break;
      case "profile":
        navigate('/driver/profile');
        break;
      default:
        navigate('/driver/myvehicle');
    }
  };

  const handleAddVehicle = async (vehicleData: CreateVehicleData, images: File[]) => {
    try {
      setIsSubmitting(true);
      
      const response = await vehicleApi.createVehicle(vehicleData);
      
      if (response.success) {
        // Upload images if provided
        const created = response.data as any;
        const vehicleId = created?._id || created?.data?._id;
        if (vehicleId && images && images.length > 0) {
          await vehicleApi.uploadVehicleImages(vehicleId, images);
        }
        toast({
          title: "Vehicle Added!",
          description: `${vehicleData.brand} ${vehicleData.model} has been successfully added to your fleet.`,
          variant: "default",
        });
        
        setShowAddDialog(false);
        await loadVehicles(); // Reload vehicles
      }
    } catch (error: any) {
      console.error('Error adding vehicle:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add vehicle. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVehicle = async (vehicleId: string, updates: UpdateVehicleData) => {
    try {
      setIsSubmitting(true);
      
      const response = await vehicleApi.updateVehicle(vehicleId, updates);
      
      if (response.success) {
        toast({
          title: "Vehicle Updated!",
          description: "Vehicle details have been successfully updated.",
          variant: "default",
        });
        
        setEditingVehicle(null);
        await loadVehicles(); // Reload vehicles
      }
    } catch (error: any) {
      console.error('Error updating vehicle:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update vehicle. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      const response = await vehicleApi.deleteVehicle(vehicleId);
      
      if (response.success) {
        toast({
          title: "Vehicle Removed!",
          description: "Vehicle has been successfully removed from your fleet.",
          variant: "destructive",
        });
        
        await loadVehicles(); // Reload vehicles
      }
    } catch (error: any) {
      console.error('Error deleting vehicle:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete vehicle. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (vehicleId: string, newStatus: 'active' | 'inactive' | 'maintenance') => {
    try {
      const response = await vehicleApi.updateVehicleAvailability(vehicleId, { isAvailable: newStatus === 'active' });
      
      if (response.success) {
        toast({
          title: "Status Updated!",
          description: `Vehicle status changed to ${newStatus}.`,
          variant: "default",
        });
        
        await loadVehicles(); // Reload vehicles
      }
    } catch (error: any) {
      console.error('Error updating vehicle status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update vehicle status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImageNavigation = (vehicleId: string, direction: 'prev' | 'next') => {
    const vehicle = vehicles.find(v => v._id === vehicleId);
    if (!vehicle) return;
    
    const currentIndex = currentImageIndex[vehicleId] || 0;
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? vehicle.images.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === vehicle.images.length - 1 ? 0 : currentIndex + 1;
    }
    
    setCurrentImageIndex(prev => ({ ...prev, [vehicleId]: newIndex }));
  };

  const handleViewDetails = (vehicle: Vehicle) => {
    setViewingVehicle(vehicle);
    setDetailImageIndex(0);
  };

  const handleDetailImageNavigation = (direction: 'prev' | 'next') => {
    if (!viewingVehicle) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = detailImageIndex === 0 ? viewingVehicle.images.length - 1 : detailImageIndex - 1;
    } else {
      newIndex = detailImageIndex === viewingVehicle.images.length - 1 ? 0 : detailImageIndex + 1;
    }
    setDetailImageIndex(newIndex);
  };

  // Filter vehicles
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || vehicle.isAvailable === (filterStatus === 'active');
    const matchesType = filterType === "all" || vehicle.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading driver module...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold">Owner Driver</h1>
              <p className="text-blue-100">My Vehicles</p>
            </div>
            <Button 
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
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
                placeholder="Search vehicles by brand, model or registration number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={filterStatus}
                onValueChange={(value) =>
                  setFilterStatus(value as 'all' | 'active' | 'inactive' | 'maintenance')
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterType}
                onValueChange={(value) =>
                  setFilterType(value as 'all' | 'bus' | 'car' | 'auto')
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="bus">Bus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Vehicle Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{vehicles.length}</div>
              <div className="text-sm text-gray-600">Total Vehicles</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {vehicles.filter(v => v.isAvailable).length}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {vehicles.filter(v => !v.isAvailable).length}
              </div>
              <div className="text-sm text-gray-600">Inactive</div>
            </CardContent>
          </Card>
        </div>

        {/* Vehicles List */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800">My Vehicles ({filteredVehicles.length})</h2>
          {filteredVehicles.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No vehicles found matching your criteria</p>
              </CardContent>
            </Card>
          ) : (
            filteredVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle._id}
                vehicle={vehicle}
                onEdit={() => setEditingVehicle(vehicle)}
                onDelete={() => handleDeleteVehicle(vehicle._id)}
                onToggleStatus={(status) => handleToggleStatus(vehicle._id, status)}
                onViewDetails={() => handleViewDetails(vehicle)}
                currentImageIndex={currentImageIndex[vehicle._id] || 0}
                onImageNavigation={handleImageNavigation}
              />
            ))
          )}
        </div>
      </div>

      {/* Add Vehicle Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
          </DialogHeader>
          <AddVehicleForm 
            mode="create"
            onSubmit={handleAddVehicle} 
            onCancel={() => setShowAddDialog(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Dialog */}
      <Dialog open={!!editingVehicle} onOpenChange={() => setEditingVehicle(null)}>
        <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
          </DialogHeader>
          {editingVehicle && (
            <AddVehicleForm
              mode="edit"
              initial={{
                type: editingVehicle.type as any,
                brand: editingVehicle.brand || '',
                model: editingVehicle.model || '',
                year: Number(editingVehicle.year) || new Date().getFullYear(),
                color: editingVehicle.color || '',
                fuelType: editingVehicle.fuelType as any || 'petrol',
                transmission: editingVehicle.transmission as any || 'manual',
                seatingCapacity: Number(editingVehicle.seatingCapacity) || 4,
                engineCapacity: editingVehicle.engineCapacity || undefined,
                mileage: editingVehicle.mileage || undefined,
                isAc: editingVehicle.isAc || false,
                isSleeper: editingVehicle.isSleeper || false,
                amenities: editingVehicle.amenities || [],
                registrationNumber: editingVehicle.registrationNumber || '',
                chassisNumber: editingVehicle.chassisNumber || '',
                engineNumber: editingVehicle.engineNumber || '',
                // Document numbers
                rcNumber: editingVehicle.documents?.rc?.number || '',
                rcExpiryDate: editingVehicle.documents?.rc?.expiryDate ? new Date(editingVehicle.documents.rc.expiryDate).toISOString().split('T')[0] : '',
                insuranceNumber: editingVehicle.documents?.insurance?.number || '',
                insuranceExpiryDate: editingVehicle.documents?.insurance?.expiryDate ? new Date(editingVehicle.documents.insurance.expiryDate).toISOString().split('T')[0] : '',
                fitnessNumber: editingVehicle.documents?.fitness?.number || '',
                fitnessExpiryDate: editingVehicle.documents?.fitness?.expiryDate ? new Date(editingVehicle.documents.fitness.expiryDate).toISOString().split('T')[0] : '',
                permitNumber: editingVehicle.documents?.permit?.number || '',
                permitExpiryDate: editingVehicle.documents?.permit?.expiryDate ? new Date(editingVehicle.documents.permit.expiryDate).toISOString().split('T')[0] : '',
                pucNumber: editingVehicle.documents?.puc?.number || '',
                pucExpiryDate: editingVehicle.documents?.puc?.expiryDate ? new Date(editingVehicle.documents.puc.expiryDate).toISOString().split('T')[0] : '',
                // Pricing reference
                pricingReference: editingVehicle.pricingReference || {
                  category: editingVehicle.type as any,
                  vehicleType: '',
                  vehicleModel: ''
                },
                // Working schedule
                workingDays: editingVehicle.schedule?.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                workingHoursStart: editingVehicle.schedule?.workingHours?.start || '06:00',
                workingHoursEnd: editingVehicle.schedule?.workingHours?.end || '22:00',
                // Operating area
                operatingCities: editingVehicle.operatingArea?.cities || [],
                operatingStates: editingVehicle.operatingArea?.states || [],
              }}
              existingImages={(editingVehicle.images || []) as any}
              isSubmitting={isSubmitting}
              onCancel={() => setEditingVehicle(null)}
              onSubmit={async (updates, newImages, deleteImageIds) => {
                await handleEditVehicle(editingVehicle._id, updates as any);
                // Delete selected existing images
                if (deleteImageIds && deleteImageIds.length) {
                  for (const imgId of deleteImageIds) {
                    try { await vehicleApi.removeVehicleImage(editingVehicle._id, imgId); } catch {}
                  }
                }
                // Upload new images
                if (newImages && newImages.length) {
                  await vehicleApi.uploadVehicleImages(editingVehicle._id, newImages);
                }
                await loadVehicles();
                setEditingVehicle(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-white z-50">
        <div className="flex justify-around py-2">
          <button 
            className={`flex flex-col items-center space-y-1 p-2 ${activeTab === "home" ? "text-blue-600" : "text-gray-500"}`}
            onClick={() => handleTabChange("home")}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </button>
          <button 
            className={`flex flex-col items-center space-y-1 p-2 ${activeTab === "requests" ? "text-blue-600" : "text-gray-500"}`}
            onClick={() => handleTabChange("requests")}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs">Requests</span>
          </button>
          <button 
            className={`flex flex-col items-center space-y-1 p-2 ${activeTab === "myvehicle" ? "text-blue-600" : "text-gray-500"}`}
            onClick={() => handleTabChange("myvehicle")}
          >
            <Car className="w-5 h-5" />
            <span className="text-xs">MyVehicle</span>
          </button>
          <button 
            className={`flex flex-col items-center space-y-1 p-2 ${activeTab === "profile" ? "text-blue-600" : "text-gray-500"}`}
            onClick={() => handleTabChange("profile")}
          >
            <User className="w-5 h-5" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Vehicle Card Component
const VehicleCard = ({ 
  vehicle, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onViewDetails,
  currentImageIndex,
  onImageNavigation
}: {
  vehicle: Vehicle;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: (status: 'active' | 'inactive' | 'maintenance') => void;
  onViewDetails: () => void;
  currentImageIndex: number;
  onImageNavigation: (vehicleId: string, direction: 'prev' | 'next') => void;
}) => {
  const getStatusColor = (isAvailable: boolean) => {
    return isAvailable ? 'bg-green-600' : 'bg-gray-600';
  };

  const getStatusText = (isAvailable: boolean) => {
    return isAvailable ? 'Active' : 'Inactive';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Car className="w-5 h-5 text-blue-600" />
            <span>{vehicle.brand} {vehicle.model}</span>
            <Badge className={getStatusColor(vehicle.isAvailable)}>
              {getStatusText(vehicle.isAvailable)}
            </Badge>
          </CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onEdit}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Vehicle</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove {vehicle.brand} {vehicle.model} from your fleet? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={onDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Remove Vehicle
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vehicle Images Carousel */}
          <div className="relative">
            <div className="relative h-48 overflow-hidden rounded-lg">
              {vehicle.images && vehicle.images.length > 0 ? (
                <div className="flex transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${currentImageIndex} * 100%)` }}>
                  {vehicle.images.map((image, index) => (
                    <img 
                      key={image._id}
                      src={image.url} 
                      alt={`${vehicle.brand} ${vehicle.model} - Image ${index + 1}`}
                      className="w-full h-48 object-cover flex-shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <Car className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              {/* Image Navigation */}
              {vehicle.images && vehicle.images.length > 1 && (
                <>
                  <button
                    onClick={() => onImageNavigation(vehicle._id, 'prev')}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-75"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onImageNavigation(vehicle._id, 'next')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-75"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  {/* Image Indicators */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                    {vehicle.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => onImageNavigation(vehicle._id, index === 0 ? 'prev' : 'next')}
                        className={`w-2 h-2 rounded-full ${
                          currentImageIndex === index 
                            ? 'bg-white' 
                            : 'bg-white bg-opacity-50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <div className="absolute top-2 right-2">
              {vehicle.isAvailable ? (
                <CheckCircle className="w-6 h-6 text-green-600 bg-white rounded-full" />
              ) : (
                <AlertCircle className="w-6 h-6 text-orange-600 bg-white rounded-full" />
              )}
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Type:</span>
                <p className="capitalize">{vehicle.type}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Year:</span>
                <p>{vehicle.year}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Registration:</span>
                <p className="font-mono">{vehicle.registrationNumber}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Color:</span>
                <p>{vehicle.color}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Fuel Type:</span>
                <p className="flex items-center">
                  <Fuel className="w-4 h-4 mr-1" />
                  {vehicle.fuelType}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Capacity:</span>
                <p>{vehicle.seatingCapacity} passengers</p>
              </div>
            </div>

            <Separator />

            {/* Pricing Information */}
            {vehicle.computedPricing && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Pricing Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600">₹{vehicle.computedPricing.basePrice}</div>
                    <div className="text-xs text-gray-600">Base Price</div>
                  </div>
                  {vehicle.computedPricing.category !== 'auto' && (
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">₹{vehicle.computedPricing.distancePricing['50km']}/km</div>
                      <div className="text-xs text-gray-600">50km Rate</div>
                    </div>
                  )}
                </div>
                {vehicle.computedPricing.category !== 'auto' && (
                  <div className="text-xs text-gray-500 text-center">
                    Distance-based pricing: 50km • 100km • 150km • 200km
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Performance Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{vehicle.statistics?.totalTrips || 0}</div>
                <div className="text-xs text-gray-600">Total Trips</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{vehicle.ratings?.average || 0}</div>
                <div className="text-xs text-gray-600">Rating</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Select 
                value={vehicle.isAvailable ? 'active' : 'inactive'} 
                onValueChange={(value: 'active' | 'inactive' | 'maintenance') => 
                  onToggleStatus(value)
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={onViewDetails}
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverMyVehicle;