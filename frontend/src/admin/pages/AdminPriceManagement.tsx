import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/admin/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Eye,
  BarChart3,
  CheckCircle,
  Car,
  Bus,
  Bike
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { 
  getAllVehiclePricing, 
  createVehiclePricing, 
  updateVehiclePricing, 
  deleteVehiclePricing,
  VehiclePricing as VehiclePricingType 
} from "@/services/vehiclePricingApi";

// Type definitions for the pricing system
interface DistanceBasedPricing {
  '50km': number;
  '100km': number;
  '150km': number;
  '200km': number;
  '250km': number;
  '300km': number;
}

interface VehiclePricing {
  _id?: string;
  category: 'auto' | 'car' | 'bus';
  vehicleType: string;
  vehicleModel: string;
  tripType: 'one-way' | 'return';
  autoPrice: number;
  distancePricing: DistanceBasedPricing;
  notes?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface PricingFormData {
  category: 'auto' | 'car' | 'bus';
  vehicleType: string;
  vehicleModel: string;
  tripType: 'one-way' | 'return';
  autoPrice: number;
  distancePricing: DistanceBasedPricing;
  notes: string;
  isActive: boolean;
  isDefault: boolean;
}

// Vehicle configurations with proper typing for autos
interface VehicleConfigs {
  auto: {
    types: string[];
    fuelTypes: string[];
  };
  car: {
    types: string[];
    models: {
      Sedan: string[];
      Hatchback: string[];
      SUV: string[];
    };
  };
  bus: {
    types: string[];
    models: string[];
  };
}

const AdminPriceManagement = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAdminAuth();
  
  // Immediate authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/admin-auth');
      return;
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // State management
  const [pricingData, setPricingData] = useState<VehiclePricing[]>([]);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'auto' | 'car' | 'bus' | 'all'>('all');
  const [selectedTripType, setSelectedTripType] = useState<'one-way' | 'return' | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form states
  const [isAddingPricing, setIsAddingPricing] = useState(false);
  const [editingPricingId, setEditingPricingId] = useState<string | null>(null);
  const [selectedPricing, setSelectedPricing] = useState<VehiclePricing | null>(null);
  const [showPricingDetails, setShowPricingDetails] = useState(false);
  const [formData, setFormData] = useState<PricingFormData>({
    category: 'auto',
    vehicleType: 'Auto',
    vehicleModel: 'CNG',
    tripType: 'one-way',
    autoPrice: 0,
    distancePricing: {
      '50km': 0,
      '100km': 0,
      '150km': 0,
      '200km': 0,
      '250km': 0,
      '300km': 0
    },
    notes: '',
    isActive: true,
    isDefault: false
  });

  // Vehicle configurations - Updated to match seeding data and auto fuel types
  const vehicleConfigs: VehicleConfigs = {
    auto: {
      types: ['Auto'],
      fuelTypes: ['CNG', 'Petrol', 'Electric', 'Diesel']
    },
    car: {
      types: ['Sedan', 'Hatchback', 'SUV'],
      models: {
        'Sedan': ['Honda Amaze', 'Swift Dzire', 'Honda City'],
        'Hatchback': ['Swift', 'i20'],
        'SUV': ['Innova Crysta', 'Scorpio', 'XUV500']
      }
    },
    bus: {
      types: ['Mini Bus', 'Luxury Bus'],
      models: ['Tempo Traveller', 'Force Traveller', 'Volvo AC', 'Mercedes Benz']
    }
  };

  // Fetch pricing data from backend
  const fetchPricingData = async () => {
    setIsLoadingPricing(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast({
          title: "Error",
          description: "Admin token not found",
          variant: "destructive"
        });
        return;
      }

      const result = await getAllVehiclePricing(token);
      setPricingData(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch pricing data",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPricing(false);
    }
  };

  // Load pricing data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchPricingData();
    }
  }, [isAuthenticated]);

  // Update distance pricing when category changes
  useEffect(() => {
    if (formData.category === 'auto') {
      // For auto, set all distance pricing to 0
      setFormData(prev => ({
        ...prev,
        distancePricing: {
          '50km': 0,
          '100km': 0,
          '150km': 0,
          '200km': 0,
          '250km': 0,
          '300km': 0
        }
      }));
    }
  }, [formData.category]);

  // Handle form input changes
  const handleFormChange = (field: keyof PricingFormData, value: any) => {
    console.log('🔄 Form field changed:', { field, value, type: typeof value });
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDistancePricingChange = (distance: keyof DistanceBasedPricing, value: string) => {
    console.log('🔄 Distance pricing changed:', { distance, value, type: typeof value });
    setFormData(prev => ({
      ...prev,
      distancePricing: {
        ...prev.distancePricing,
        [distance]: parseFloat(value) || 0
      }
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      category: 'auto',
      vehicleType: 'Auto',
      vehicleModel: 'CNG',
      tripType: 'one-way',
      autoPrice: 0,
      distancePricing: {
        '50km': 0,
        '100km': 0,
        '150km': 0,
        '200km': 0,
        '250km': 0,
        '300km': 0
      },
      notes: '',
      isActive: true,
      isDefault: false
    });
    setIsAddingPricing(false);
    setEditingPricingId(null);
  };

  // Add new pricing
  const handleAddPricing = async () => {
    try {
      console.log('🔍 Adding new pricing with form data:', formData);
      
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast({
          title: "Error",
          description: "Admin token not found",
          variant: "destructive"
        });
        return;
      }

      // For auto, validate auto price
      if (formData.category === 'auto') {
        console.log('🔍 Validating auto pricing:', {
          autoPrice: formData.autoPrice,
          type: typeof formData.autoPrice,
          isValid: formData.autoPrice > 0
        });
        
        if (!formData.autoPrice || formData.autoPrice <= 0) {
          toast({
            title: "Error",
            description: "Auto price must be greater than 0",
            variant: "destructive"
          });
          return;
        }
        console.log('✅ Auto price validation passed');
      }

      // For car and bus, validate distance pricing
      if (formData.category !== 'auto') {
        console.log('🔍 Validating distance pricing:', formData.distancePricing);
        const hasValidDistancePricing = Object.values(formData.distancePricing).some(price => price > 0);
        if (!hasValidDistancePricing) {
          toast({
            title: "Error",
            description: "Distance pricing is required for car and bus categories",
            variant: "destructive"
          });
          return;
        }
        console.log('✅ Distance pricing validation passed');
      }

      console.log('✅ All validations passed, calling API...');
      const result = await createVehiclePricing(token, formData);
      console.log('✅ Pricing created successfully:', result);
      
      toast({
        title: "Success",
        description: "Pricing added successfully",
        variant: "default"
      });
      resetForm();
      fetchPricingData();
    } catch (error) {
      console.error('❌ Error adding pricing:', error);
      
      // Show more specific error message
      let errorMessage = "Failed to add pricing";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Update existing pricing
  const handleUpdatePricing = async () => {
    if (!editingPricingId) return;

    try {
      console.log('🔍 Updating pricing with form data:', formData);
      
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast({
          title: "Error",
          description: "Admin token not found",
          variant: "destructive"
        });
        return;
      }

      // For auto, validate auto price
      if (formData.category === 'auto') {
        console.log('🔍 Validating auto pricing update:', {
          autoPrice: formData.autoPrice,
          type: typeof formData.autoPrice,
          isValid: formData.autoPrice > 0
        });
        
        if (!formData.autoPrice || formData.autoPrice <= 0) {
          toast({
            title: "Error",
            description: "Auto price must be greater than 0",
            variant: "destructive"
          });
          return;
        }
        console.log('✅ Auto price validation passed');
      }

      // For car and bus, validate distance pricing
      if (formData.category !== 'auto') {
        console.log('🔍 Validating distance pricing update:', formData.distancePricing);
        const hasValidDistancePricing = Object.values(formData.distancePricing).some(price => price > 0);
        if (!hasValidDistancePricing) {
          toast({
            title: "Error",
            description: "Distance pricing is required for car and bus categories",
            variant: "destructive"
          });
          return;
        }
        console.log('✅ Distance pricing validation passed');
      }

      console.log('✅ All validations passed, calling update API...');
      const result = await updateVehiclePricing(token, editingPricingId, formData);
      console.log('✅ Pricing updated successfully:', result);
      
      toast({
        title: "Success",
        description: "Pricing updated successfully",
        variant: "default"
      });
      resetForm();
      fetchPricingData();
    } catch (error) {
      console.error('❌ Error updating pricing:', error);
      
      // Show more specific error message
      let errorMessage = "Failed to update pricing";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Delete pricing
  const handleDeletePricing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast({
          title: "Error",
          description: "Admin token not found",
          variant: "destructive"
        });
        return;
      }

      await deleteVehiclePricing(token, id);
      toast({
        title: "Success",
        description: "Pricing deleted successfully",
        variant: "default"
      });
      fetchPricingData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete pricing",
        variant: "destructive"
      });
    }
  };

  // Edit pricing
  const handleEditPricing = (pricing: VehiclePricing) => {
    setFormData({
      category: pricing.category,
      vehicleType: pricing.vehicleType,
      vehicleModel: pricing.vehicleModel,
      tripType: pricing.tripType,
      autoPrice: pricing.autoPrice,
      distancePricing: pricing.distancePricing,
      notes: pricing.notes || '',
      isActive: pricing.isActive,
      isDefault: pricing.isDefault
    });
    setEditingPricingId(pricing._id || null);
    setIsAddingPricing(true);
  };

  // View pricing details
  const handleViewPricing = (pricing: VehiclePricing) => {
    setSelectedPricing(pricing);
    setShowPricingDetails(true);
  };

  // Filter pricing data
  const filteredPricing = pricingData.filter(pricing => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        pricing.vehicleType.toLowerCase().includes(searchLower) ||
        pricing.vehicleModel.toLowerCase().includes(searchLower) ||
        pricing.category.toLowerCase().includes(searchLower)
      );
    }
    if (selectedCategory && selectedCategory !== 'all' && pricing.category !== selectedCategory) return false;
    if (selectedTripType && selectedTripType !== 'all' && pricing.tripType !== selectedTripType) return false;
    return true;
  });

  // Get pricing count by category for tabs
  const getPricingCountByCategory = (category: 'auto' | 'car' | 'bus') => {
    return pricingData.filter(p => p.category === category).length;
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auto': return <Bike className="w-4 h-4" />;
      case 'car': return <Car className="w-4 h-4" />;
      case 'bus': return <Bus className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Inactive</Badge>
    );
  };

  // Calculate total pricing
  const getTotalPricing = (pricing: VehiclePricing) => {
    if (pricing.category === 'auto') {
      return pricing.autoPrice; // Use autoPrice for auto
    }
    const total = Object.values(pricing.distancePricing).reduce((sum, price) => sum + price, 0);
    return total * 100; // Multiply by 100km for estimation
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating admin access...</p>
        </div>
      </div>
    );
  }

  // Show authentication required message
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-gray-600 mb-4">You need to be logged in as an admin to access this page.</p>
          <Button onClick={() => navigate('/admin-auth')} className="w-full">
            Go to Admin Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Vehicle Pricing Management</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage vehicle pricing for all categories, types, and fuel types</p>
          </div>

          {/* Stats Cards - Mobile Optimized */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
            <Card className="shadow-sm">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <Car className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Rules</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{pricingData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Active</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                      {pricingData.filter(p => p.isActive).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <Bike className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Auto</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                      {pricingData.filter(p => p.category === 'auto').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                    <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
                  </div>
                  <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Car</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                      {pricingData.filter(p => p.category === 'car').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search - Mobile Optimized */}
          <Card className="mb-4 md:mb-6 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search pricing rules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 sm:h-11"
                  />
                </div>
                
                {/* Filter Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
                    <SelectTrigger className="h-10 sm:h-11">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedTripType} onValueChange={(value) => setSelectedTripType(value as any)}>
                    <SelectTrigger className="h-10 sm:h-11">
                      <SelectValue placeholder="Filter by trip type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Trip Types</SelectItem>
                      <SelectItem value="one-way">One Way</SelectItem>
                      <SelectItem value="return">Return Trip</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="sm:col-span-2 lg:col-span-1">
                    <Button 
                      onClick={() => setIsAddingPricing(true)} 
                      className="w-full h-10 sm:h-11"
                      disabled={isAddingPricing}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Add Pricing</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add/Edit Pricing Form - Mobile Optimized */}
          {isAddingPricing && (
            <Card className="mb-4 md:mb-6 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl">
                  {editingPricingId ? 'Edit Vehicle Pricing' : 'Add New Vehicle Pricing'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => handleFormChange('category', value as any)}
                    >
                      <SelectTrigger className="h-11 sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="car">Car</SelectItem>
                        <SelectItem value="bus">Bus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicleType" className="text-sm font-medium">Vehicle Type</Label>
                    <Select 
                      value={formData.vehicleType} 
                      onValueChange={(value) => handleFormChange('vehicleType', value)}
                    >
                      <SelectTrigger className="h-11 sm:h-10">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleConfigs[formData.category].types.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicleModel" className="text-sm font-medium">
                      {formData.category === 'auto' ? 'Fuel Type' : 'Vehicle Model'}
                    </Label>
                    <Select 
                      value={formData.vehicleModel} 
                      onValueChange={(value) => handleFormChange('vehicleModel', value)}
                    >
                      <SelectTrigger className="h-11 sm:h-10">
                        <SelectValue placeholder={formData.category === 'auto' ? 'Select Fuel Type' : 'Select Model'} />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.category === 'auto' 
                          ? vehicleConfigs.auto.fuelTypes.map((fuelType: string) => (
                              <SelectItem key={fuelType} value={fuelType}>{fuelType}</SelectItem>
                            ))
                          : formData.category === 'car' && formData.vehicleType 
                            ? (vehicleConfigs.car.models as any)[formData.vehicleType]?.map((model: string) => (
                                <SelectItem key={model} value={model}>{model}</SelectItem>
                              ))
                            : (vehicleConfigs[formData.category].models as string[]).map((model: string) => (
                                <SelectItem key={model} value={model}>{model}</SelectItem>
                              ))
                        }
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tripType" className="text-sm font-medium">Trip Type</Label>
                    <Select
                      value={formData.tripType} 
                      onValueChange={(value) => handleFormChange('tripType', value as any)}
                    >
                      <SelectTrigger className="h-11 sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one-way">One Way</SelectItem>
                        <SelectItem value="return">Return Trip</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Auto Price - Only show for auto category */}
                  {formData.category === 'auto' && (
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="autoPrice" className="text-sm font-medium">Auto Price (₹)</Label>
                      <Input
                        id="autoPrice"
                        type="number"
                        value={formData.autoPrice}
                        onChange={(e) => handleFormChange('autoPrice', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="h-11 sm:h-10"
                      />
                    </div>
                  )}

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleFormChange('notes', e.target.value)}
                      placeholder="Additional notes..."
                      className="min-h-[80px]"
                    />
                  </div>
                </div>

                {/* Distance-based Pricing */}
                {formData.category !== 'auto' && (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-gray-900">Distance-based Pricing (per km)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(['50km', '100km', '150km', '200km', '250km', '300km'] as const).map(distance => (
                        <div key={distance} className="space-y-2">
                          <Label htmlFor={`distance-${distance}`} className="text-sm font-medium">{distance}</Label>
                          <Input
                            id={`distance-${distance}`}
                            type="number"
                            value={formData.distancePricing[distance]}
                            onChange={(e) => handleDistancePricingChange(distance, e.target.value)}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="h-11 sm:h-10"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    onClick={editingPricingId ? handleUpdatePricing : handleAddPricing}
                    className="flex-1 h-12 sm:h-11"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingPricingId ? 'Update Pricing' : 'Add Pricing'}
                  </Button>
                  <Button onClick={resetForm} variant="outline" className="h-12 sm:h-11">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing Data Table */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl">All Pricing Rules ({filteredPricing.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPricing ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading pricing data...</p>
                </div>
              ) : filteredPricing.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pricing rules found matching your criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Category Tabs - Mobile Optimized */}
                  <div className="border-b border-gray-200 overflow-x-auto">
                    <nav className="flex space-x-4 sm:space-x-6 min-w-max px-2 sm:px-0">
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className={`py-3 px-2 sm:py-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                          selectedCategory === 'all'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        All ({filteredPricing.length})
                      </button>
                      <button
                        onClick={() => setSelectedCategory('auto')}
                        className={`py-3 px-2 sm:py-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                          selectedCategory === 'auto'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Auto ({getPricingCountByCategory('auto')})
                      </button>
                      <button
                        onClick={() => setSelectedCategory('car')}
                        className={`py-3 px-2 sm:py-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                          selectedCategory === 'car'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Car ({getPricingCountByCategory('car')})
                      </button>
                      <button
                        onClick={() => setSelectedCategory('bus')}
                        className={`py-3 px-2 sm:py-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                          selectedCategory === 'bus'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Bus ({getPricingCountByCategory('bus')})
                      </button>
                    </nav>
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="w-48">Vehicle Details</TableHead>
                            <TableHead className="w-32">Trip Type</TableHead>
                            {selectedCategory !== 'auto' && (
                              <TableHead className="w-64">Distance Pricing</TableHead>
                            )}
                            {selectedCategory === 'auto' && (
                              <TableHead className="w-32">Auto Price</TableHead>
                            )}
                            <TableHead className="w-32">Status</TableHead>
                            <TableHead className="w-32">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPricing.map((pricing) => (
                            <TableRow key={pricing._id} className="hover:bg-gray-50 transition-colors">
                              {/* Vehicle Details Column */}
                              <TableCell className="py-4">
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                      {getCategoryIcon(pricing.category)}
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <Badge variant="outline" className="capitalize text-xs">
                                        {pricing.category}
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs">
                                        {pricing.vehicleType}
                                      </Badge>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {pricing.vehicleModel}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Trip Type Column */}
                              <TableCell>
                                <Badge variant={pricing.tripType === 'one-way' ? 'default' : 'secondary'}>
                                  {pricing.tripType === 'one-way' ? 'One Way' : 'Return'}
                                </Badge>
                              </TableCell>

                              {/* Distance Pricing Column (Conditional) */}
                              {selectedCategory !== 'auto' && (
                                <TableCell>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="text-center p-2 bg-gray-50 rounded">
                                      <p className="text-xs text-gray-600">50km</p>
                                      <p className="text-sm font-semibold">₹{pricing.distancePricing['50km']}</p>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 rounded">
                                      <p className="text-xs text-gray-600">100km</p>
                                      <p className="text-sm font-semibold">₹{pricing.distancePricing['100km']}</p>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 rounded">
                                      <p className="text-xs text-gray-600">150km</p>
                                      <p className="text-sm font-semibold">₹{pricing.distancePricing['150km']}</p>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 rounded">
                                      <p className="text-xs text-gray-600">200km</p>
                                      <p className="text-sm font-semibold">₹{pricing.distancePricing['200km']}</p>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 rounded">
                                      <p className="text-xs text-gray-600">250km</p>
                                      <p className="text-sm font-semibold">₹{pricing.distancePricing['250km']}</p>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 rounded">
                                      <p className="text-xs text-gray-600">300km</p>
                                      <p className="text-sm font-semibold">₹{pricing.distancePricing['300km']}</p>
                                    </div>
                                  </div>
                                </TableCell>
                              )}

                              {/* Auto Price Column (Conditional) */}
                              {selectedCategory === 'auto' && (
                                <TableCell>
                                  <p className="text-sm font-semibold">₹{pricing.autoPrice}</p>
                                </TableCell>
                              )}

                              {/* Status Column */}
                              <TableCell>
                                {getStatusBadge(pricing.isActive)}
                              </TableCell>

                              {/* Actions Column */}
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewPricing(pricing)}
                                    className="h-8 w-8 p-0 hover:bg-blue-50"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditPricing(pricing)}
                                    className="h-8 w-8 p-0 hover:bg-green-50"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeletePricing(pricing._id!)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Mobile Card View - Enhanced */}
                  <div className="lg:hidden space-y-4">
                    {filteredPricing.map((pricing) => (
                      <div key={pricing._id} className="border rounded-lg p-4 sm:p-5 hover:bg-gray-50 transition-colors shadow-sm bg-white">
                        {/* Header with Vehicle Info */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                {getCategoryIcon(pricing.category)}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="capitalize text-xs">
                                  {pricing.category}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {pricing.vehicleType}
                                </Badge>
                              </div>
                            </div>
                            <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-2">{pricing.vehicleModel}</h3>
                            <div className="flex items-center justify-between">
                              <Badge variant={pricing.tripType === 'one-way' ? 'default' : 'secondary'} className="text-xs">
                                {pricing.tripType === 'one-way' ? 'One Way' : 'Return Trip'}
                              </Badge>
                              {getStatusBadge(pricing.isActive)}
                            </div>
                          </div>
                        </div>

                        {/* Pricing Information */}
                        {pricing.category === 'auto' ? (
                          <div className="mb-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs font-medium text-blue-700 mb-2">Auto Price</p>
                            <p className="text-xl sm:text-2xl font-bold text-blue-900">₹{pricing.autoPrice}</p>
                          </div>
                        ) : (
                          <div className="mb-4">
                            <p className="text-xs font-medium text-gray-600 mb-3">Distance Pricing (per km)</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                              <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg border">
                                <p className="text-xs text-gray-600 mb-1">50km</p>
                                <p className="text-sm sm:text-base font-semibold text-gray-900">₹{pricing.distancePricing['50km']}</p>
                              </div>
                              <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg border">
                                <p className="text-xs text-gray-600 mb-1">100km</p>
                                <p className="text-sm sm:text-base font-semibold text-gray-900">₹{pricing.distancePricing['100km']}</p>
                              </div>
                              <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg border">
                                <p className="text-xs text-gray-600 mb-1">150km</p>
                                <p className="text-sm sm:text-base font-semibold text-gray-900">₹{pricing.distancePricing['150km']}</p>
                              </div>
                              <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg border">
                                <p className="text-xs text-gray-600 mb-1">200km</p>
                                <p className="text-sm sm:text-base font-semibold text-gray-900">₹{pricing.distancePricing['200km']}</p>
                              </div>
                              <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg border">
                                <p className="text-xs text-gray-600 mb-1">250km</p>
                                <p className="text-sm sm:text-base font-semibold text-gray-900">₹{pricing.distancePricing['250km']}</p>
                              </div>
                              <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg border">
                                <p className="text-xs text-gray-600 mb-1">300km</p>
                                <p className="text-sm sm:text-base font-semibold text-gray-900">₹{pricing.distancePricing['300km']}</p>
                              </div>
                            </div>
                          </div>
                        )}


                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewPricing(pricing)}
                            className="flex-1 h-9 text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPricing(pricing)}
                            className="flex-1 h-9 text-xs"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePricing(pricing._id!)}
                            className="flex-1 h-9 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
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

      {/* Floating Action Button for Mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsAddingPricing(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Pricing Details Dialog - Mobile Optimized */}
      <Dialog open={showPricingDetails} onOpenChange={setShowPricingDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Pricing Details
            </DialogTitle>
          </DialogHeader>
          {selectedPricing && (
            <div className="space-y-4 sm:space-y-6">
              {/* Pricing Header */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full flex-shrink-0">
                  {getCategoryIcon(selectedPricing.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold truncate">{selectedPricing.vehicleType}</h3>
                  <p className="text-sm sm:text-base text-gray-600 truncate">
                    {selectedPricing.category === 'auto' ? 'Fuel Type' : 'Model'}: {selectedPricing.vehicleModel}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {getStatusBadge(selectedPricing.isActive)}
                    <Badge variant={selectedPricing.tripType === 'one-way' ? 'default' : 'secondary'}>
                      {selectedPricing.tripType === 'one-way' ? 'One Way' : 'Return Trip'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Distance Pricing Grid */}
              {selectedPricing.category !== 'auto' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Distance-based Pricing (per km)</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      {(['50km', '100km', '150km', '200km', '250km', '300km'] as const).map(distance => (
                        <div key={distance} className="text-center">
                          <p className="text-xs font-medium text-gray-600 mb-1">{distance}</p>
                          <p className="text-base sm:text-lg font-bold text-gray-900">₹{selectedPricing.distancePricing[distance]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Notes */}
              {selectedPricing.notes && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Notes</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 text-sm">{selectedPricing.notes}</p>
                  </div>
                </div>
              )}

              {/* Total Calculation */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Total Pricing Range</label>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-center">
                    <p className="text-sm font-medium text-orange-900">Estimated Total</p>
                    <p className="text-xl sm:text-2xl font-bold text-orange-600">₹{getTotalPricing(selectedPricing)}</p>
                    <p className="text-xs text-orange-700">Base fare + Distance pricing</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPriceManagement;
