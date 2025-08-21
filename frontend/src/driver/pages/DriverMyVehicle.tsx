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

  const handleImageNavigation = (vehicleId: string, direction: 'prev' | 'next' | number) => {
    const vehicle = vehicles.find(v => v._id === vehicleId);
    if (!vehicle) return;
    
    const currentIndex = currentImageIndex[vehicleId] || 0;
    let newIndex;
    
    if (typeof direction === 'number') {
      // Direct index navigation
      newIndex = direction;
    } else if (direction === 'prev') {
      newIndex = currentIndex === 0 ? vehicle.images.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === vehicle.images.length - 1 ? 0 : currentIndex + 1;
    }
    
    // Ensure index is within bounds
    if (newIndex >= 0 && newIndex < vehicle.images.length) {
      setCurrentImageIndex(prev => ({ ...prev, [vehicleId]: newIndex }));
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <DriverTopNavigation />
      
      {/* Driver Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white py-10 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Owner Driver
              </h1>
              <p className="text-blue-100 text-lg lg:text-xl font-medium">Manage Your Vehicle Fleet Professionally</p>
            </div>
            <Button 
              className="bg-white text-blue-700 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-4 text-lg font-semibold rounded-xl hover:scale-105"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-6 h-6 mr-3" />
              Add Vehicle
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  placeholder="Search vehicles by brand, model, or registration..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all duration-200 hover:border-gray-300"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select
                value={filterStatus}
                onValueChange={(value) =>
                  setFilterStatus(value as 'all' | 'active' | 'inactive' | 'maintenance')
                }
              >
                <SelectTrigger className="w-32 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
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
                <SelectTrigger className="w-32 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 border-blue-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-300/20 rounded-full -translate-y-12 translate-x-12"></div>
            <CardContent className="p-6 text-center relative z-10">
              <div className="text-4xl font-bold text-blue-700 mb-2">{vehicles.length}</div>
              <div className="text-sm text-blue-800 font-semibold">Total Vehicles</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 via-green-100 to-green-200 border-green-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-300/20 rounded-full -translate-y-12 translate-x-12"></div>
            <CardContent className="p-6 text-center relative z-10">
              <div className="text-4xl font-bold text-green-700 mb-2">
                {vehicles.filter(v => v.isAvailable).length}
              </div>
              <div className="text-sm text-green-800 font-semibold">Active</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 border-orange-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-300/20 rounded-full -translate-y-12 translate-x-12"></div>
            <CardContent className="p-6 text-center relative z-10">
              <div className="text-4xl font-bold text-orange-700 mb-2">
                {vehicles.filter(v => !v.isAvailable).length}
              </div>
              <div className="text-sm text-orange-800 font-semibold">Inactive</div>
            </CardContent>
          </Card>
        </div>

        {/* Vehicles List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">My Vehicles ({filteredVehicles.length})</h2>
            {filteredVehicles.length > 0 && (
              <div className="text-sm text-gray-600">
                Showing {filteredVehicles.length} of {vehicles.length} vehicles
              </div>
            )}
          </div>
          
          {filteredVehicles.length === 0 ? (
            <Card className="bg-white shadow-md">
              <CardContent className="p-12 text-center">
                <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No vehicles found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
                    ? "Try adjusting your search criteria or filters."
                    : "Get started by adding your first vehicle to the fleet."
                  }
                </p>
                {!searchTerm && filterStatus === 'all' && filterType === 'all' && (
                  <Button 
                    onClick={() => setShowAddDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Vehicle
                  </Button>
                )}
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

      {/* Vehicle Details Modal */}
      <Dialog open={!!viewingVehicle} onOpenChange={() => setViewingVehicle(null)}>
        <DialogContent className="w-[95vw] sm:max-w-4xl lg:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <Car className="w-8 h-8 text-blue-600" />
              {viewingVehicle?.brand} {viewingVehicle?.model} - Complete Details
            </DialogTitle>
          </DialogHeader>
          
          {viewingVehicle && (
            <div className="space-y-6">
              {/* Vehicle Images Gallery */}
              <div className="relative">
                <div className="relative h-72 overflow-hidden rounded-2xl border border-gray-200 shadow-lg">
                  {viewingVehicle.images && viewingVehicle.images.length > 0 ? (
                    <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${detailImageIndex * 100}%)` }}>
                      {viewingVehicle.images.map((image, index) => (
                        <img 
                          key={image._id}
                          src={image.url} 
                          alt={`${viewingVehicle.brand} ${viewingVehicle.model} - Image ${index + 1}`}
                          className="w-full h-72 object-contain flex-shrink-0 bg-gray-50"
                        />
                      ))}
                    </div>
                  ) : (
                    <PlaceholderImage vehicleType={viewingVehicle.type} />
                  )}
                  
                  {/* Image Navigation */}
                  {viewingVehicle.images && viewingVehicle.images.length > 1 && (
                    <>
                      <button
                        onClick={() => handleDetailImageNavigation('prev')}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition-all duration-300 hover:scale-110 z-10"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDetailImageNavigation('next')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition-all duration-300 hover:scale-110 z-10"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      
                      {/* Image Counter */}
                      <div className="absolute top-3 left-3 z-10">
                        <Badge className="bg-black/80 text-white text-xs px-2 py-1 rounded-full">
                          {detailImageIndex + 1} / {viewingVehicle.images.length}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Vehicle Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Basic Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Brand & Model</span>
                      <span className="font-semibold text-gray-800">{viewingVehicle.brand} {viewingVehicle.model}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Type</span>
                      <span className="font-semibold text-gray-800 capitalize">{viewingVehicle.type}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-3 bg-purple-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Year</span>
                      <span className="font-semibold text-gray-800">{viewingVehicle.year}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Color</span>
                      <span className="font-semibold text-gray-800">{viewingVehicle.color}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Fuel Type</span>
                      <span className="font-semibold text-gray-800">{viewingVehicle.fuelType}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-3 bg-indigo-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Transmission</span>
                      <span className="font-semibold text-gray-800 capitalize">{viewingVehicle.transmission}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-3 bg-yellow-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Seating Capacity</span>
                      <span className="font-semibold text-gray-800">{viewingVehicle.seatingCapacity} passengers</span>
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Technical Details</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Registration Number</span>
                      <span className="font-mono font-semibold text-gray-800 text-sm">{viewingVehicle.registrationNumber}</span>
                    </div>
                    {viewingVehicle.chassisNumber && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">Chassis Number</span>
                        <span className="font-mono font-semibold text-gray-800 text-sm">{viewingVehicle.chassisNumber}</span>
                      </div>
                    )}
                    {viewingVehicle.engineNumber && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">Engine Number</span>
                        <span className="font-mono font-semibold text-gray-800 text-sm">{viewingVehicle.engineNumber}</span>
                      </div>
                    )}
                    {viewingVehicle.engineCapacity && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">Engine Capacity</span>
                        <span className="font-semibold text-gray-800">{viewingVehicle.engineCapacity}cc</span>
                      </div>
                    )}
                    {viewingVehicle.mileage && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">Mileage</span>
                        <span className="font-semibold text-gray-800">{viewingVehicle.mileage} km/l</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 font-medium">AC</span>
                      <span className="font-semibold text-gray-800">{viewingVehicle.isAc ? 'Yes' : 'No'}</span>
                    </div>
                    {viewingVehicle.isSleeper && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">Sleeper</span>
                        <span className="font-semibold text-gray-800">Yes</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {viewingVehicle.amenities && viewingVehicle.amenities.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingVehicle.amenities.map((amenity, index) => (
                      <Badge key={index} className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Information */}
              {viewingVehicle.computedPricing && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Pricing Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-600">₹{viewingVehicle.computedPricing.basePrice}</div>
                      <div className="text-sm text-gray-600">Base Price</div>
                    </div>
                    {viewingVehicle.computedPricing.category !== 'auto' && (
                      <>
                        <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                          <div className="text-2xl font-bold text-purple-600">₹{viewingVehicle.computedPricing.distancePricing['50km']}/km</div>
                          <div className="text-sm text-gray-600">50km Rate</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                          <div className="text-2xl font-bold text-green-600">₹{viewingVehicle.computedPricing.distancePricing['100km']}/km</div>
                          <div className="text-sm text-gray-600">100km Rate</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}




            </div>
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

// Placeholder Image Component
const PlaceholderImage = ({ vehicleType, className }: { vehicleType: string; className?: string }) => {
  const getVehicleIcon = () => {
    switch (vehicleType) {
      case 'bus':
        return '🚌';
      case 'car':
        return '🚗';
      case 'auto':
        return '🛺';
      default:
        return '🚗';
    }
  };

  return (
    <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center ${className}`}>
      <div className="text-4xl mb-2">{getVehicleIcon()}</div>
      <p className="text-gray-500 text-sm text-center">No image available</p>
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
  onImageNavigation: (vehicleId: string, direction: 'prev' | 'next' | number) => void;
}) => {
  const getStatusColor = (isAvailable: boolean) => {
    return isAvailable ? 'bg-green-600' : 'bg-gray-600';
  };

  const getStatusText = (isAvailable: boolean) => {
    return isAvailable ? 'Active' : 'Inactive';
  };

  const handleImageNavigation = (direction: 'prev' | 'next' | number) => {
    if (typeof direction === 'number') {
      onImageNavigation(vehicle._id, direction);
    } else {
      onImageNavigation(vehicle._id, direction);
    }
  };

  return (
    <Card className="hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden group">
      <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-800">{vehicle.brand} {vehicle.model}</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${getStatusColor(vehicle.isAvailable)} text-xs font-medium px-2 py-1`}>
                  {getStatusText(vehicle.isAvailable)}
                </Badge>
                <span className="text-xs text-gray-500 capitalize">• {vehicle.type}</span>
              </div>
            </div>
          </CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onEdit}
              className="hover:bg-blue-50 hover:border-blue-200 hover:scale-105 transition-all duration-200 rounded-xl"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50 hover:scale-105 transition-all duration-200 rounded-xl">
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
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Vehicle Images Carousel */}
          <div className="relative order-1 lg:order-1">
            <div className="relative h-64 sm:h-72 md:h-80 overflow-hidden rounded-2xl border border-gray-200 shadow-xl group-hover:shadow-2xl transition-all duration-500">
              {vehicle.images && vehicle.images.length > 0 ? (
                <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
                  {vehicle.images.map((image, index) => (
                    <img 
                      key={image._id}
                      src={image.url} 
                      alt={`${vehicle.brand} ${vehicle.model} - Image ${index + 1}`}
                      className="w-full h-64 sm:h-72 md:h-80 object-cover flex-shrink-0 group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        // Show placeholder instead
                        const placeholder = target.parentElement?.querySelector('.placeholder-fallback');
                        if (placeholder) {
                          (placeholder as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                  ))}
                  {/* Fallback placeholder for each image */}
                  {vehicle.images.map((_, index) => (
                    <div 
                      key={`placeholder-${index}`}
                      className="w-full h-64 sm:h-72 md:h-80 flex-shrink-0 hidden placeholder-fallback"
                    >
                      <PlaceholderImage vehicleType={vehicle.type} />
                    </div>
                  ))}
                </div>
              ) : (
                <PlaceholderImage vehicleType={vehicle.type} />
              )}
              
              {/* Image Navigation Arrows */}
              {vehicle.images && vehicle.images.length > 1 && (
                <>
                  <button
                    onClick={() => handleImageNavigation('prev')}
                    className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 bg-black/70 text-white p-2 sm:p-2.5 rounded-full hover:bg-black/90 transition-all duration-300 hover:scale-110 z-10 backdrop-blur-sm opacity-0 group-hover:opacity-100"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => handleImageNavigation('next')}
                    className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 bg-black/70 text-white p-2 sm:p-2.5 rounded-full hover:bg-black/90 transition-all duration-300 hover:scale-110 z-10 backdrop-blur-sm opacity-0 group-hover:opacity-100"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  
                  {/* Image Indicators */}
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {vehicle.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleImageNavigation(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 ${
                          currentImageIndex === index 
                            ? 'bg-white shadow-lg' 
                            : 'bg-white/60 hover:bg-white/80'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Vehicle Status Badge */}
            <div className="absolute top-3 right-3 z-10">
              {vehicle.isAvailable ? (
                <Badge className="bg-green-500/90 text-white border-0 shadow-lg backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Available
                </Badge>
              ) : (
                <Badge className="bg-orange-500/90 text-white border-0 shadow-lg backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Unavailable
                </Badge>
              )}
            </div>

            {/* Image Counter */}
            {vehicle.images && vehicle.images.length > 1 && (
              <div className="absolute top-3 left-3 z-10">
                <Badge className="bg-black/80 text-white text-xs shadow-lg backdrop-blur-sm px-2 py-1 rounded-full">
                  {currentImageIndex + 1} / {vehicle.images.length}
                </Badge>
              </div>
            )}
          </div>

          {/* Vehicle Details */}
          <div className="space-y-4 lg:space-y-6 order-2 lg:order-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 text-sm">Type</span>
                <span className="font-medium text-gray-800 capitalize">{vehicle.type}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 text-sm">Year</span>
                <span className="font-medium text-gray-800">{vehicle.year}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 text-sm">Color</span>
                <span className="font-medium text-gray-800">{vehicle.color}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 text-sm">Fuel Type</span>
                <span className="font-medium text-gray-800">{vehicle.fuelType}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 text-sm">Registration</span>
                <span className="font-mono font-medium text-gray-800 text-xs">{vehicle.registrationNumber}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 text-sm">Capacity</span>
                <span className="font-medium text-gray-800">{vehicle.seatingCapacity} passengers</span>
              </div>
            </div>

            <Separator />

            {/* Pricing Information */}
            {vehicle.computedPricing && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800 text-sm sm:text-base">Pricing Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-base sm:text-lg font-bold text-yellow-600">₹{vehicle.computedPricing.basePrice}</div>
                    <div className="text-xs text-gray-600">Base Price</div>
                  </div>
                  {vehicle.computedPricing.category !== 'auto' && (
                    <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="text-base sm:text-lg font-bold text-purple-600">₹{vehicle.computedPricing.distancePricing['50km']}/km</div>
                      <div className="text-xs text-gray-600">50km Rate</div>
                    </div>
                  )}
                </div>
                {vehicle.computedPricing.category !== 'auto' && (
                  <div className="text-xs text-gray-500 text-center">
                    Distance-based pricing: 50km • 100km • 150km
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Performance Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-lg sm:text-xl font-bold text-blue-600">{vehicle.statistics?.totalTrips || 0}</div>
                <div className="text-xs text-gray-600">Total Trips</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-lg sm:text-xl font-bold text-green-600">{vehicle.ratings?.average || 0}</div>
                <div className="text-xs text-gray-600">Rating</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select 
                value={vehicle.isAvailable ? 'active' : 'inactive'} 
                onValueChange={(value: 'active' | 'inactive' | 'maintenance') => 
                  onToggleStatus(value)
                }
              >
                <SelectTrigger className="flex-1 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-xl transition-all duration-200">
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
                className="flex-1 hover:bg-blue-600 hover:text-white hover:border-blue-600 rounded-xl transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
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