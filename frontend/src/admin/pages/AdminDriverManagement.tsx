import { useState, useEffect } from "react";
import AdminLayout from "@/admin/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Car, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Plus,
  Download,
  RefreshCw,
  Shield,
  ShieldOff,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Award,
  FileText,
  Car as CarIcon,
  Bus as BusIcon,
  Truck,
  Bike,
  X,
  Key,
  User,
  Building,
  Fuel,
  Palette,
  Settings,
  Route,
  Wifi,
  Snowflake,
  Bed,
  Zap,
  Shield as ShieldIcon,
  EyeOff,
  AlertTriangle,
  Check,
  Ban,
  Filter
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { adminDrivers, adminVehicles } from "@/services/adminApi";

interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    city: string;
    state: string;
  };
  profilePicture?: string;
  status: 'active' | 'suspended' | 'pending' | 'verified';
  createdAt: string;
  totalRides: number;
  totalEarnings: number;
  rating: number;
  isVerified: boolean;
  isApproved: boolean;
  documents: {
    drivingLicense: {
      number: string;
      expiryDate: string;
      isVerified: boolean;
    };
    vehicleRC: {
      number: string;
      expiryDate: string;
      isVerified: boolean;
      image?: string;
    };
    insurance?: {
      image?: string;
    };
  };
  lastLogin?: string;
  vehicleDetails?: {
    type: string;
    brand: string;
    model: string;
  };
}

interface PendingVehicleRequest {
  _id: string;
  driver: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    rating: number;
    status: string;
  };
  type: 'car' | 'bus' | 'auto';
  brand: string;
  model: string;
  year: number;
  color: string;
  registrationNumber: string;
  seatingCapacity: number;
  fuelType: string;
  isAc: boolean;
  isSleeper: boolean;
  amenities: string[];
  pricingReference: {
    category: 'auto' | 'car' | 'bus';
    vehicleType: string;
    vehicleModel: string;
  };
  // Computed pricing field - will be populated with actual pricing data
  computedPricing?: {
    basePrice: number;
    distancePricing: {
      '50km': number;
      '100km': number;
      '150km': number;
      '200km': number;
      '250km': number;
      '300km': number;
    };
    category: string;
    vehicleType: string;
    vehicleModel: string;
  };
  approvalStatus: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface NewDriverForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface EditDriverForm {
  // Basic Information
  name: string;
  email: string;
  phone: string;
  location: string;
  
  
  // Additional Information
  totalTrips: number;
  totalEarnings: number;
  rating: number;
}

interface Vehicle {
  _id: string;
  type: 'car' | 'bus' | 'auto';
  brand: string;
  model?: string;
  year?: number;
  color?: string;
  registrationNumber: string;
  driver: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  status: 'active' | 'inactive' | 'maintenance' | 'pending';
  currentLocation?: {
    address: string;
  };
  vehicleLocation?: {
    address: string;
  };
  maintenance?: {
    lastService?: string;
    nextService?: string;
  };
  statistics: {
    totalTrips: number;
  };
  ratings: {
    average: number;
  };
  fuelType: 'petrol' | 'diesel' | 'cng' | 'electric' | 'hybrid';
  seatingCapacity: number;
  documents: {
    rc: {
      isVerified: boolean;
      image?: string;
    };
    insurance: {
      isVerified: boolean;
      image?: string;
    };
    permit: {
      isVerified: boolean;
    };
    fitness: {
      isVerified: boolean;
    };
  };
  approvalStatus: 'pending' | 'approved' | 'rejected';
  isAvailable: boolean;
  isActive: boolean;
  pricingReference?: {
    category: 'auto' | 'car' | 'bus';
    vehicleType: string;
    vehicleModel: string;
  };
  // Computed pricing field - will be populated with actual pricing data
  computedPricing?: {
    basePrice: number;
    distancePricing: {
      '50km': number;
      '100km': number;
      '150km': number;
      '200km': number;
      '250km': number;
      '300km': number;
    };
    category: string;
    vehicleType: string;
    vehicleModel: string;
  };
}

interface ComputedPricing {
  category: string;
  vehicleType: string;
  vehicleModel: string;
  distancePricing: {
    '50km': number;
    '100km': number;
    '150km': number;
  };
}

interface DriverRequest {
  _id: string;
  driver: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profileImage?: string;
    isActive: boolean;
    isVerified: boolean;
    isApproved: boolean;
    createdAt: string;
    updatedAt: string;
  };
  vehicle: {
    _id: string;
    type: 'bus' | 'car' | 'auto';
    brand: string;
    model: string;
    year: number;
    color: string;
    fuelType: string;
    transmission: string;
    seatingCapacity: number;
    engineCapacity?: number;
    mileage?: number;
    isAc: boolean;
    isSleeper: boolean;
    amenities: string[];
    images: Array<{
      url: string;
      caption?: string;
      isPrimary: boolean;
    }>;
    registrationNumber: string;
    chassisNumber?: string;
    engineNumber?: string;
    operatingArea?: {
      cities: string[];
      states: string[];
      radius: number;
    };
    schedule: {
      workingDays: string[];
      workingHours: {
        start: string;
        end: string;
      };
      breakTime?: {
        start: string;
        end: string;
      };
    };
    rating: number;
    totalTrips: number;
    totalEarnings: number;
    isActive: boolean;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    booked: boolean;
    driver?: {
      _id: string;
      firstName: string;
      lastName: string;
      rating: number;
      phone: string;
    };
    computedPricing?: ComputedPricing;
    pricingReference: {
      category: string;
      vehicleType: string;
      vehicleModel: string;
    };
    createdAt: string;
    updatedAt: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminDriverManagement = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showDriverDetails, setShowDriverDetails] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showEditDriver, setShowEditDriver] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  
  // Document modal states
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{type: string, url: string} | null>(null);
  
  // Vehicle management states
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState("");
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<string>("all");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>("all");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [showVehicleDocuments, setShowVehicleDocuments] = useState(false);
  
  // Vehicle approval workflow states
  const [pendingVehicleRequests, setPendingVehicleRequests] = useState<PendingVehicleRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PendingVehicleRequest | null>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  
  const [newDriverForm, setNewDriverForm] = useState<NewDriverForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  const [editDriverForm, setEditDriverForm] = useState<EditDriverForm>({
    name: "",
    email: "",
    phone: "",
    location: "",
    totalTrips: 0,
    totalEarnings: 0,
    rating: 0
  });
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    const initializeAdminModule = async () => {
      try {
        setIsLoggedIn(true);
        
        // Debug: Check authentication status
        const adminToken = localStorage.getItem('adminToken');
        const adminData = localStorage.getItem('adminData');
        console.log('Admin authentication status:', {
          hasToken: !!adminToken,
          hasData: !!adminData,
          tokenLength: adminToken ? adminToken.length : 0
        });
        
        if (adminData) {
          try {
            const parsed = JSON.parse(adminData);
            console.log('Admin data:', parsed);
          } catch (e) {
            console.error('Error parsing admin data:', e);
          }
        }
        
        await loadDrivers();
        await loadPendingVehicles();
        await loadVehicles();
      } catch (err) {
        console.error('Error initializing admin module:', err);
        toast({
          title: "Error",
          description: "Failed to load driver management. Please try again.",
          variant: "destructive",
        });
      }
    };

    initializeAdminModule();
  }, []);

  const loadDrivers = async () => {
    try {
      console.log('Loading drivers...');
      const response = await adminDrivers.getAll({
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      console.log('Drivers response:', response);
      
      // Map the driver data to include status field based on isActive
      const mappedDrivers = (response.data.docs || []).map((driver: any) => ({
        ...driver,
        status: driver.isActive ? 'active' : 'suspended'
      }));
      
      console.log('🔍 Driver mapping debug:');
      console.log('  - Raw driver data sample:', response.data.docs?.[0]);
      console.log('  - Mapped driver sample:', mappedDrivers[0]);
      console.log('  - Total drivers loaded:', mappedDrivers.length);
      setDrivers(mappedDrivers);
    } catch (error) {
      console.error('Error loading drivers:', error);
      console.error('Error details:', error.response?.data);
      toast({
        title: "Error",
        description: `Failed to load drivers: ${error.response?.data?.message || error.message}`,
        variant: "destructive",
      });
    }
  };

  const loadPendingVehicles = async () => {
    try {
      console.log('Loading pending vehicles...');
      const response = await adminVehicles.getPendingApprovals(1, 100);
      console.log('Pending vehicles response:', response);
      const requests = response.data.docs || [];
      
      // Populate pricing for all pending vehicle requests
      const requestsWithPricing = await Promise.all(
        requests.map(async (request) => {
          try {
            if (request.pricingReference) {
              const { getPricingForVehicle } = await import('@/services/vehiclePricingApi');
              const pricing = await getPricingForVehicle(
                request.pricingReference.category,
                request.pricingReference.vehicleType,
                request.pricingReference.vehicleModel
              );
              
              if (pricing) {
                request.computedPricing = {
                  basePrice: pricing.autoPrice,
                  distancePricing: pricing.distancePricing,
                  category: pricing.category,
                  vehicleType: pricing.vehicleType,
                  vehicleModel: pricing.vehicleModel
                };
              }
            }
            return request;
          } catch (error) {
            console.error(`Error fetching pricing for request ${request._id}:`, error);
            return request;
          }
        })
      );
      
      setPendingVehicleRequests(requestsWithPricing);
    } catch (error) {
      console.error('Error loading pending vehicles:', error);
      console.error('Error details:', error.response?.data);
      toast({
        title: "Error",
        description: `Failed to load pending vehicle requests: ${error.response?.data?.message || error.message}`,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <Award className="w-4 h-4" />;
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'suspended':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleStatusChange = async (driverId: string, newStatus: 'active' | 'suspended' | 'pending' | 'verified') => {
    const driver = drivers.find(d => d._id === driverId);
    if (!driver) return;

    try {
      // Update driver status in the database
      const response = await adminDrivers.updateStatus(driverId, newStatus);
      
      if (response.success) {
        // Update local state only after successful API call
        setDrivers(prev => prev.map(driver => 
          driver._id === driverId ? { 
            ...driver, 
            status: newStatus, 
            isActive: newStatus === 'active' 
          } : driver
        ));
        
        let message = `Driver status changed to ${newStatus}`;
        if (newStatus === 'active' && driver.status === 'suspended') {
          message = `${driver.firstName} ${driver.lastName} has been unsuspended successfully`;
        } else if (newStatus === 'suspended' && driver.status === 'active') {
          message = `${driver.firstName} ${driver.lastName} has been suspended`;
        }
        
        toast({
          title: newStatus === 'active' && driver.status === 'suspended' ? "Driver Unsuspended" : "Status Updated",
          description: message,
          variant: "default",
        });
      } else {
        throw new Error(response.message || 'Failed to update driver status');
      }
    } catch (error) {
      console.error('Error updating driver status:', error);
      toast({
        title: "Error",
        description: "Failed to update driver status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnsuspendDriver = (driverId: string) => {
    handleStatusChange(driverId, 'active');
  };

  const handleBulkStatusChange = async (newStatus: 'active' | 'suspended' | 'pending' | 'verified') => {
    if (selectedDrivers.length === 0) {
      toast({
        title: "No Drivers Selected",
        description: "Please select drivers to update",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update all selected drivers in the database
      const updatePromises = selectedDrivers.map(driverId => 
        adminDrivers.updateStatus(driverId, newStatus)
      );
      
      const results = await Promise.all(updatePromises);
      const successCount = results.filter(result => result.success).length;
      
      if (successCount > 0) {
        // Update local state only after successful API calls
        const updatedDrivers = drivers.map(driver => {
          if (selectedDrivers.includes(driver._id)) {
            return { 
              ...driver, 
              status: newStatus, 
              isActive: newStatus === 'active' 
            };
          }
          return driver;
        });

        setDrivers(updatedDrivers);
        setSelectedDrivers([]);
        setShowBulkActions(false);

        let message = `${successCount} drivers have been updated to ${newStatus}`;
        if (newStatus === 'active') {
          const suspendedCount = drivers.filter(driver => selectedDrivers.includes(driver._id) && driver.status === 'suspended').length;
          if (suspendedCount > 0) {
            message = `${suspendedCount} suspended drivers have been unsuspended`;
          }
        }

        toast({
          title: newStatus === 'active' ? "Bulk Unsuspend Complete" : "Bulk Update Complete",
          description: message,
        });
      } else {
        throw new Error('Failed to update any drivers');
      }
    } catch (error) {
      console.error('Error updating drivers:', error);
      toast({
        title: "Error",
        description: "Failed to update driver statuses. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkUnsuspend = () => {
    const suspendedDrivers = selectedDrivers.filter(driverId => {
      const driver = drivers.find(d => d._id === driverId);
      return driver && driver.status === 'suspended';
    });

    if (suspendedDrivers.length === 0) {
      toast({
        title: "No Suspended Drivers Selected",
        description: "Please select suspended drivers to unsuspend",
        variant: "destructive",
      });
      return;
    }

    handleBulkStatusChange('active');
  };

  const handleBulkDelete = async () => {
    if (selectedDrivers.length === 0) {
      toast({
        title: "No Drivers Selected",
        description: "Please select drivers to delete",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedDrivers.length} drivers? This action cannot be undone.`)) {
      try {
        // Call the backend API to bulk delete drivers
        const response = await adminDrivers.bulkDelete(selectedDrivers);
        
        if (response.success) {
          // Update local state
          const updatedDrivers = drivers.filter(driver => !selectedDrivers.includes(driver._id));
          setDrivers(updatedDrivers);
          setSelectedDrivers([]);
          setShowBulkActions(false);

          toast({
            title: "Bulk Delete Complete",
            description: response.message || `${selectedDrivers.length} drivers have been deleted successfully`,
          });
        } else {
          throw new Error(response.message || 'Failed to delete drivers');
        }
      } catch (error) {
        console.error('Error bulk deleting drivers:', error);
        toast({
          title: "Error",
          description: error.response?.data?.message || error.message || "Failed to delete drivers. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const toggleDriverSelection = (driverId: string) => {
    setSelectedDrivers(prev => 
      prev.includes(driverId) 
        ? prev.filter(id => id !== driverId)
        : [...prev, driverId]
    );
  };

  const selectAllDrivers = () => {
    setSelectedDrivers(filteredDrivers.map(driver => driver._id));
  };

  const clearSelection = () => {
    setSelectedDrivers([]);
  };

  // Edit driver functions
  const handleEditDriver = async (driver: Driver) => {
    setEditingDriver(driver);
    setIsSubmitting(true);
    
    // Fetch the latest driver data to ensure we have the most current document information
    try {
      const response = await adminDrivers.getById(driver._id);
      const latestDriver = response.data;
      
      setEditDriverForm({
        name: `${latestDriver.firstName} ${latestDriver.lastName}`,
        email: latestDriver.email,
        phone: latestDriver.phone,
        location: `${latestDriver.address.city}, ${latestDriver.address.state}`,
        totalTrips: latestDriver.totalRides,
        totalEarnings: latestDriver.totalEarnings,
        rating: latestDriver.rating
      });
    } catch (error) {
      console.error('Error fetching latest driver data:', error);
      // Fallback to the driver data we have
      setEditDriverForm({
        name: `${driver.firstName} ${driver.lastName}`,
        email: driver.email,
        phone: driver.phone,
        location: `${driver.address.city}, ${driver.address.state}`,
        totalTrips: driver.totalRides,
        totalEarnings: driver.totalEarnings,
        rating: driver.rating
      });
    } finally {
      setIsSubmitting(false);
    }
    
    setShowEditDriver(true);
  };

  const handleEditFormChange = (field: keyof EditDriverForm, value: any) => {
    setEditDriverForm(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const handleUpdateDriver = async () => {
    if (!editingDriver) return;

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update driver in the list
      setDrivers(prev => prev.map(driver => 
        driver._id === editingDriver._id 
          ? { ...driver, ...editDriverForm }
          : driver
      ));
      
      toast({
        title: "Driver Updated",
        description: `${editDriverForm.name}'s information has been updated successfully`,
        variant: "default",
      });

      setShowEditDriver(false);
      setEditingDriver(null);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update driver. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  // Vehicle management functions
  const loadVehicles = async () => {
    try {
      console.log('Loading vehicles...');
      const response = await adminVehicles.getAll({
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      console.log('Vehicles response:', response);
      const vehiclesData = response.data.docs || [];
      
      // Populate pricing for all vehicles
      const vehiclesWithPricing = await Promise.all(
        vehiclesData.map(async (vehicle) => {
          try {
            if (vehicle.pricingReference) {
              const { getPricingForVehicle } = await import('@/services/vehiclePricingApi');
              const pricing = await getPricingForVehicle(
                vehicle.pricingReference.category,
                vehicle.pricingReference.vehicleType,
                vehicle.pricingReference.vehicleModel
              );
              
              if (pricing) {
                vehicle.computedPricing = {
                  basePrice: pricing.autoPrice,
                  distancePricing: pricing.distancePricing,
                  category: pricing.category,
                  vehicleType: pricing.vehicleType,
                  vehicleModel: pricing.vehicleModel
                };
              }
            }
            return vehicle;
          } catch (error) {
            console.error(`Error fetching pricing for vehicle ${vehicle._id}:`, error);
            return vehicle;
          }
        })
      );
      
      setVehicles(vehiclesWithPricing);
      setFilteredVehicles(vehiclesWithPricing);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      console.error('Error details:', error.response?.data);
      toast({
        title: "Error",
        description: `Failed to load vehicles: ${error.response?.data?.message || error.message}`,
        variant: "destructive",
      });
    }
  };

  const getVehicleStatusBadge = (status: string) => {
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
        const vehicle = vehicles.find(v => v._id === vehicleId);
        setSelectedVehicle(vehicle || null);
        setShowVehicleDetails(true);
        break;
      case 'edit':
        toast({
          title: "Edit Vehicle",
          description: "Edit functionality will be implemented",
        });
        break;
      case 'delete':
        toast({
          title: "Delete Vehicle",
          description: "Delete functionality will be implemented",
        });
        break;
    }
  };

  // Filter vehicles
  useEffect(() => {
    let filtered = vehicles;

    if (vehicleSearchTerm) {
      filtered = filtered.filter(vehicle =>
        vehicle.model.toLowerCase().includes(vehicleSearchTerm.toLowerCase()) ||
        vehicle.brand.toLowerCase().includes(vehicleSearchTerm.toLowerCase()) ||
        vehicle.registrationNumber.toLowerCase().includes(vehicleSearchTerm.toLowerCase()) ||
        `${vehicle.driver.firstName} ${vehicle.driver.lastName}`.toLowerCase().includes(vehicleSearchTerm.toLowerCase())
      );
    }

    if (vehicleStatusFilter !== "all") {
      filtered = filtered.filter(vehicle => vehicle.status === vehicleStatusFilter);
    }

    if (vehicleTypeFilter !== "all") {
      filtered = filtered.filter(vehicle => vehicle.type === vehicleTypeFilter);
    }

    setFilteredVehicles(filtered);
  }, [vehicles, vehicleSearchTerm, vehicleStatusFilter, vehicleTypeFilter]);

  const handleVerificationToggle = (driverId: string) => {
    const driver = drivers.find(d => d._id === driverId);
    if (!driver) return;

    setDrivers(prev => prev.map(driver => 
      driver._id === driverId ? { ...driver, isVerified: !driver.isVerified } : driver
    ));
    
    toast({
      title: driver.isVerified ? "Verification Removed" : "Driver Verified",
      description: driver.isVerified 
        ? `${driver.firstName} ${driver.lastName}'s verification has been removed` 
        : `${driver.firstName} ${driver.lastName} has been verified successfully`,
      variant: "default",
    });
  };


  const handleBulkDocumentApproval = () => {
    const driversWithoutDocs = selectedDrivers.filter(driverId => {
      const driver = drivers.find(d => d._id === driverId);
      return driver && !(driver.documents.drivingLicense.isVerified && driver.documents.vehicleRC.isVerified);
    });

    if (driversWithoutDocs.length === 0) {
      toast({
        title: "No Drivers Selected",
        description: "Please select drivers without approved documents",
        variant: "destructive",
      });
      return;
    }

    setDrivers(prev => prev.map(driver => 
      selectedDrivers.includes(driver._id) ? { ...driver, documents: { ...driver.documents, drivingLicense: { ...driver.documents.drivingLicense, isVerified: true }, vehicleRC: { ...driver.documents.vehicleRC, isVerified: true } } } : driver
    ));

    setSelectedDrivers([]);
    setShowBulkActions(false);

    toast({
      title: "Bulk Document Approval Complete",
      description: `${driversWithoutDocs.length} drivers' documents have been approved`,
    });
  };

  const handleDeleteDriver = async (driverId: string) => {
    try {
      // Call the backend API to delete the driver
      const response = await adminDrivers.deleteDriver(driverId);
      
      if (response.success) {
        // Update local state
        setDrivers(prev => prev.filter(driver => driver._id !== driverId));
        
        // Clear selection if the deleted driver was selected
        setSelectedDrivers(prev => prev.filter(id => id !== driverId));
        
        toast({
          title: "Driver Deleted",
          description: response.message || "Driver has been permanently removed",
          variant: "destructive",
        });
      } else {
        throw new Error(response.message || 'Failed to delete driver');
      }
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to delete driver. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Vehicle approval workflow functions
  const handleApproveVehicle = async (requestId: string) => {
    try {
      await adminVehicles.approveVehicle(requestId, adminNotes);
      
      // Update local state
      setPendingVehicleRequests(prev => prev.filter(request => request._id !== requestId));
      
      // Refresh data
      await loadPendingVehicles();
      await loadDrivers();
      
      toast({
        title: "Vehicle Approved",
        description: "Vehicle has been approved and added to driver's fleet",
        variant: "default",
      });

      setShowRequestDetails(false);
      setSelectedRequest(null);
      setAdminNotes("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve vehicle. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectVehicle = async (requestId: string) => {
    try {
      const reason = prompt("Please provide a reason for rejection:");
      if (!reason) return;
      
      await adminVehicles.rejectVehicle(requestId, reason, adminNotes);
      
      // Update local state
      setPendingVehicleRequests(prev => prev.filter(request => request._id !== requestId));
      
      // Refresh data
      await loadPendingVehicles();
      
      toast({
        title: "Vehicle Rejected",
        description: "Vehicle request has been rejected",
        variant: "destructive",
      });

      setShowRequestDetails(false);
      setSelectedRequest(null);
      setAdminNotes("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject vehicle. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType.toLowerCase()) {
      case 'car': return <CarIcon className="w-4 h-4 text-green-600" />;
      case 'bus': return <BusIcon className="w-4 h-4 text-purple-600" />;
      case 'auto': return <CarIcon className="w-4 h-4 text-blue-600" />;
      default: return <CarIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  // Generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(password);
    setNewDriverForm(prev => ({
      ...prev,
      driverPassword: password,
      confirmPassword: password
    }));
  };

  // Handle form input changes
  const handleFormChange = (field: keyof NewDriverForm, value: any) => {
    setNewDriverForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Vehicle/document upload handlers removed in simplified flow

  // Submit new driver form
  const handleSubmitNewDriver = async () => {
    if (!newDriverForm.firstName || !newDriverForm.lastName || !newDriverForm.phone || !newDriverForm.password || newDriverForm.password !== newDriverForm.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields (first name, last name, phone, password) and ensure passwords match",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Call the backend API to create driver
      const response = await adminDrivers.create({
        firstName: newDriverForm.firstName,
        lastName: newDriverForm.lastName,
        email: newDriverForm.email || undefined, // Only send if provided
        phone: newDriverForm.phone,
        password: newDriverForm.password
      });

      if (response.success) {
        toast({
          title: "Driver Created Successfully",
          description: `${newDriverForm.firstName} ${newDriverForm.lastName} has been created and can now login with phone ${newDriverForm.phone}`,
          variant: "default",
        });

        // Reset form
        setNewDriverForm({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: ""
        });
        
        setShowAddDriver(false);
        setGeneratedPassword("");
        
        // Refresh the drivers list
        await loadDrivers();
      } else {
        throw new Error(response.message || 'Failed to create driver');
      }
      
    } catch (error) {
      console.error('Error creating driver:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to create driver. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter drivers
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = `${driver.firstName} ${driver.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.phone.includes(searchTerm) ||
                         driver.documents.drivingLicense.number.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || driver.status === statusFilter;
    const matchesVerification = verificationFilter === "all" || 
                               (verificationFilter === "verified" && driver.isVerified) ||
                               (verificationFilter === "unverified" && !driver.isVerified);
    
    return matchesSearch && matchesStatus && matchesVerification;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };


  if (!isLoggedIn) {
    return null;
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Driver Management</h1>
          <p className="text-gray-600 text-sm lg:text-base">Manage all registered drivers and their verification status</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button size="sm" className="w-full sm:w-auto" onClick={() => setShowAddDriver(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Driver
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Total Drivers</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{drivers.length}</p>
              </div>
              <Car className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">
                  {vehicles.length}
                </p>
              </div>
              <CarIcon className="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">
                  {pendingVehicleRequests.filter(r => r.approvalStatus === 'pending').length}
                </p>
              </div>
              <AlertTriangle className="w-6 h-6 lg:w-8 lg:h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Verified Drivers</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">
                  {drivers.filter(d => d.isVerified).length}
                </p>
              </div>
              <Shield className="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Pending Verification</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">
                  {drivers.filter(d => d.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Active Drivers</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">
                  {drivers.filter(d => d.status === 'active' || d.status === 'verified').length}
                </p>
              </div>
              <UserCheck className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search drivers by name, email, phone, or license number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setVerificationFilter("all");
                  setSelectedDrivers([]);
                  toast({
                    title: "Refreshed",
                    description: "Filters have been reset and data refreshed",
                  });
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedDrivers.length > 0 && (
        <Card className="mb-4 shadow-sm border-0 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedDrivers.length} driver(s) selected
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkUnsuspend}
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Unsuspend Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDocumentApproval}
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Approve Documents
                </Button>
                <Select onValueChange={handleBulkStatusChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Change Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="hidden"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drivers List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg lg:text-xl">Drivers ({filteredDrivers.length})</CardTitle>
            {filteredDrivers.length > 0 && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedDrivers.length === filteredDrivers.length && filteredDrivers.length > 0}
                  onChange={selectAllDrivers}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredDrivers.length === 0 ? (
            <div className="text-center py-8">
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No drivers found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDrivers.map((driver) => (
                <div key={driver._id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 border rounded-lg hover:bg-gray-50 gap-4">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedDrivers.includes(driver._id)}
                      onChange={() => toggleDriverSelection(driver._id)}
                      className="rounded border-gray-300 mt-2"
                    />
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarImage src={driver.profilePicture || "https://github.com/shadcn.png"} />
                      <AvatarFallback>{`${driver.firstName} ${driver.lastName}`.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{driver.firstName} {driver.lastName}</h3>
                        <div className="flex flex-wrap gap-2">
                          {driver.isVerified && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          <Badge className={`${getStatusColor(driver.status)} text-xs`}>
                            {getStatusIcon(driver.status)}
                            <span className="ml-1 capitalize">{driver.status}</span>
                          </Badge>
                          <div className="flex items-center text-yellow-600">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="ml-1 text-sm">{driver.rating}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-600 mt-2 gap-1">
                        <span className="flex items-center">
                          <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{driver.email}</span>
                        </span>
                        <span className="flex items-center">
                          <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{driver.phone}</span>
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{driver.address.city}, {driver.address.state}</span>
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs text-gray-500 mt-2 gap-1">
                        <span>Trips: {driver.totalRides}</span>
                        <span>Earnings: {formatCurrency(driver.totalEarnings)}</span>
                        <span>Last Active: {driver.lastLogin ? new Date(driver.lastLogin).toLocaleDateString() : 'Never'}</span>
                      </div>
                      
                      {/* Enhanced Vehicle Information */}
                      <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <CarIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              {driver.vehicleDetails ? 1 : 0} Vehicle{driver.vehicleDetails ? '' : 's'}
                            </span>
                          </div>
                          {driver.vehicleDetails && (
                            <div className="flex flex-wrap items-center gap-1">
                              <Badge variant="outline" className="text-xs bg-white">
                                {getVehicleIcon(driver.vehicleDetails.type)}
                                <span className="ml-1 capitalize">{driver.vehicleDetails.type}</span>
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end space-x-2 lg:flex-shrink-0">
                    {driver.status === 'suspended' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnsuspendDriver(driver._id)}
                        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Unsuspend
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditDriver(driver)}
                      className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDriver(driver);
                        setShowDriverDetails(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditDriver(driver)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Driver
                        </DropdownMenuItem>
                        {driver.status === 'suspended' ? (
                          <DropdownMenuItem onClick={() => handleUnsuspendDriver(driver._id)}>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Unsuspend Driver
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => handleStatusChange(driver._id, 'suspended')}>
                              <UserX className="w-4 h-4 mr-2" />
                              Suspend Driver
                            </DropdownMenuItem>
                          </>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Driver
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Driver</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {driver.firstName} {driver.lastName}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteDriver(driver._id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Driver
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Vehicles Management */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
            <CarIcon className="w-5 h-5 text-blue-600" />
            All Vehicles ({filteredVehicles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Vehicle Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search vehicles by model, brand, registration, or owner..."
                  value={vehicleSearchTerm}
                  onChange={(e) => setVehicleSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={vehicleStatusFilter} onValueChange={setVehicleStatusFilter}>
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
            <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
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

          {/* Vehicle Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {filteredVehicles.map((vehicle) => (
            <Card key={vehicle._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 md:p-6">
                {/* Vehicle Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {getVehicleIcon(vehicle.type)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{vehicle.brand} {vehicle.model}</h3>
                      <p className="text-sm text-gray-600">{vehicle.registrationNumber}</p>
                    </div>
                  </div>
                  {getVehicleStatusBadge(vehicle.status)}
                </div>

                {/* Vehicle Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Owner: {vehicle.driver.firstName} {vehicle.driver.lastName}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 break-words leading-relaxed">Base Location: {vehicle.vehicleLocation?.address || 'Location not set'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Fuel className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Fuel: {vehicle.fuelType}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Seats: {vehicle.seatingCapacity}</span>
                  </div>
                </div>


                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVehicleAction('view', vehicle._id)}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>

          {filteredVehicles.length === 0 && (
            <div className="text-center py-8">
              <CarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No vehicles found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver Details Dialog */}
      <Dialog open={showDriverDetails} onOpenChange={setShowDriverDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Driver Details</DialogTitle>
          </DialogHeader>
          {selectedDriver && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedDriver.profilePicture || "https://github.com/shadcn.png"} />
                  <AvatarFallback>{`${selectedDriver.firstName} ${selectedDriver.lastName}`.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedDriver.firstName} {selectedDriver.lastName}</h3>
                  <p className="text-gray-600">{selectedDriver.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={getStatusColor(selectedDriver.status)}>
                      {getStatusIcon(selectedDriver.status)}
                      <span className="ml-1 capitalize">{selectedDriver.status}</span>
                    </Badge>
                    {selectedDriver.isVerified && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    <div className="flex items-center text-yellow-600">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="ml-1">{selectedDriver.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900">{selectedDriver.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Location</label>
                  <p className="text-gray-900">{selectedDriver.address.city}, {selectedDriver.address.state}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">License Number</label>
                  <p className="text-gray-900">{selectedDriver.documents.drivingLicense.number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">License Expiry</label>
                  <p className="text-gray-900">{new Date(selectedDriver.documents.drivingLicense.expiryDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Trips</label>
                  <p className="text-gray-900">{selectedDriver.totalRides}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Earnings</label>
                  <p className="text-gray-900">{formatCurrency(selectedDriver.totalEarnings)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Vehicle Count</label>
                  <p className="text-gray-900">{selectedDriver.vehicleDetails ? 1 : 0}</p>
                </div>
              </div>
              
              {selectedDriver.vehicleDetails && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Vehicle Type</label>
                  <div className="flex space-x-2 mt-1">
                    <Badge variant="outline">
                      {selectedDriver.vehicleDetails.type}
                    </Badge>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleStatusChange(selectedDriver._id, selectedDriver.status === 'active' ? 'suspended' : 'active')}
                  className={`flex-1 ${selectedDriver.status === 'suspended' ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : ''}`}
                >
                  {selectedDriver.status === 'active' ? 'Suspend Driver' : 'Unsuspend Driver'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Vehicle Request Details Dialog */}
      <Dialog open={showRequestDetails} onOpenChange={setShowRequestDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg lg:text-xl">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Vehicle Request Details
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              {/* Driver Information */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full flex-shrink-0">
                  {getVehicleIcon(selectedRequest.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold truncate">{selectedRequest.driver.firstName} {selectedRequest.driver.lastName}</h3>
                  <p className="text-gray-600 truncate">{selectedRequest.driver.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending Approval
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedRequest.type.charAt(0).toUpperCase() + selectedRequest.type.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Vehicle Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Driver Phone</label>
                  <p className="text-gray-900 break-all">{selectedRequest.driver.phone}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Registration Number</label>
                  <p className="text-gray-900 break-all">{selectedRequest.registrationNumber}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Seating Capacity</label>
                  <p className="text-gray-900">{selectedRequest.seatingCapacity} seats</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Fuel Type</label>
                  <p className="text-gray-900 capitalize">{selectedRequest.fuelType}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Vehicle Color</label>
                  <p className="text-gray-900 capitalize">{selectedRequest.color}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Pricing Reference</label>
                  <p className="text-gray-900">{selectedRequest.pricingReference?.category || 'N/A'} - {selectedRequest.pricingReference?.vehicleType || 'N/A'} - {selectedRequest.pricingReference?.vehicleModel || 'N/A'}</p>
                </div>
                {selectedRequest.computedPricing && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Actual Pricing</label>
                    <p className="text-gray-900">₹{selectedRequest.computedPricing.basePrice} base</p>
                    {selectedRequest.computedPricing.category !== 'auto' && (
                      <div className="text-sm text-gray-600">
                        <p>50km: ₹{selectedRequest.computedPricing.distancePricing['50km']}/km</p>
                        <p>100km: ₹{selectedRequest.computedPricing.distancePricing['100km']}/km</p>
                        <p>150km: ₹{selectedRequest.computedPricing.distancePricing['150km']}/km</p>
                        <p>200km: ₹{selectedRequest.computedPricing.distancePricing['200km']}/km</p>
                        <p>250km: ₹{selectedRequest.computedPricing.distancePricing['250km']}/km</p>
                        <p>300km: ₹{selectedRequest.computedPricing.distancePricing['300km']}/km</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Vehicle Features */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Vehicle Features</label>
                <div className="flex flex-wrap gap-2">
                  {selectedRequest.isAc && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Snowflake className="w-3 h-3 mr-1" />
                      AC
                    </Badge>
                  )}
                  {selectedRequest.isSleeper && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      <Bed className="w-3 h-3 mr-1" />
                      Sleeper
                    </Badge>
                  )}
                  {selectedRequest.amenities.includes('charging') && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Zap className="w-3 h-3 mr-1" />
                      Charging Points
                    </Badge>
                  )}
                  {!selectedRequest.isAc && !selectedRequest.isSleeper && !selectedRequest.amenities.includes('charging') && (
                    <p className="text-sm text-gray-500">No special features</p>
                  )}
                </div>
              </div>
              
              {/* Vehicle Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Vehicle Description</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-900 text-sm">{selectedRequest.brand} {selectedRequest.model} - {selectedRequest.color}</p>
                </div>
              </div>
              
              {/* Pricing Reference */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Pricing Reference</label>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Category:</span>
                    <span className="font-medium text-blue-900 capitalize">{selectedRequest.pricingReference?.category || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-blue-800">Vehicle Type:</span>
                    <span className="font-medium text-blue-900">{selectedRequest.pricingReference?.vehicleType || 'N/A'}</span>
                  </div>
                  <div className="border-t border-blue-200 mt-2 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-800">Vehicle Model:</span>
                      <span className="font-bold text-blue-900">{selectedRequest.pricingReference?.vehicleModel || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actual Pricing */}
              {selectedRequest.computedPricing && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Actual Pricing</label>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-800">Base Price:</span>
                      <span className="font-medium text-green-900">₹{selectedRequest.computedPricing.basePrice}</span>
                    </div>
                    {selectedRequest.computedPricing.category !== 'auto' && (
                      <>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm text-green-800">50km Rate:</span>
                          <span className="font-medium text-green-900">₹{selectedRequest.computedPricing.distancePricing['50km']}/km</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm text-green-800">100km Rate:</span>
                          <span className="font-medium text-green-900">₹{selectedRequest.computedPricing.distancePricing['100km']}/km</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm text-green-800">150km Rate:</span>
                          <span className="font-medium text-green-900">₹{selectedRequest.computedPricing.distancePricing['150km']}/km</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm text-green-800">200km Rate:</span>
                          <span className="font-medium text-green-900">₹{selectedRequest.computedPricing.distancePricing['200km']}/km</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm text-green-800">250km Rate:</span>
                          <span className="font-medium text-green-900">₹{selectedRequest.computedPricing.distancePricing['250km']}/km</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm text-green-800">300km Rate:</span>
                          <span className="font-medium text-green-900">₹{selectedRequest.computedPricing.distancePricing['300km']}/km</span>
                        </div>
                        <div className="border-t border-green-200 mt-2 pt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-green-800">Example (100km):</span>
                            <span className="font-bold text-green-900">₹{selectedRequest.computedPricing.basePrice + (selectedRequest.computedPricing.distancePricing['100km'] * 100)}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Submitted At */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Submitted At</label>
                <p className="text-gray-900">{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
              </div>
              
              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="adminNotes" className="text-sm font-medium text-gray-600">Admin Notes (Optional)</Label>
                <Textarea
                  id="adminNotes"
                  placeholder="Add any notes or comments for the driver..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowRequestDetails(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleRejectVehicle(selectedRequest._id)}
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Reject Request
                </Button>
                <Button 
                  onClick={() => handleApproveVehicle(selectedRequest._id)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve Vehicle
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Driver Dialog */}
      <Dialog open={showAddDriver} onOpenChange={setShowAddDriver}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Add New Driver
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="account">Driver Credentials</TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Enter driver's first name"
                    value={newDriverForm.firstName}
                    onChange={(e) => handleFormChange('firstName', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Enter driver's last name"
                    value={newDriverForm.lastName}
                    onChange={(e) => handleFormChange('lastName', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter driver's email address (optional)"
                  value={newDriverForm.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter driver's phone number"
                  value={newDriverForm.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={newDriverForm.password}
                    onChange={(e) => handleFormChange('password', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={newDriverForm.confirmPassword}
                  onChange={(e) => handleFormChange('confirmPassword', e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                  className="flex items-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  Generate Password
                </Button>
                
                {generatedPassword && (
                  <div className="text-sm text-gray-600">
                    Generated: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{generatedPassword}</span>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDriver(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmitNewDriver}
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    "Creating..."
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      Create Driver
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Driver Dialog */}
      <Dialog open={showEditDriver} onOpenChange={setShowEditDriver}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Driver Information
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editName">Driver Name *</Label>
                  <Input
                    id="editName"
                    placeholder="Enter driver's full name"
                    value={editDriverForm.name}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editEmail">Email Address *</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    placeholder="driver@example.com"
                    value={editDriverForm.email}
                    onChange={(e) => handleEditFormChange('email', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editPhone">Phone Number *</Label>
                  <Input
                    id="editPhone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={editDriverForm.phone}
                    onChange={(e) => handleEditFormChange('phone', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editLocation">Location *</Label>
                  <Input
                    id="editLocation"
                    placeholder="City, State"
                    value={editDriverForm.location}
                    onChange={(e) => handleEditFormChange('location', e.target.value)}
                  />
                </div>
                
              </div>

              {/* Documents Section */}
              <div className="space-y-4">
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Driver Documents
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* RC Document */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">RC Document</h4>
                      </div>
                      
                      {editingDriver?.documents?.vehicleRC?.image ? (
                        <div className="border rounded-lg overflow-hidden">
                          <img 
                            src={editingDriver.documents.vehicleRC.image} 
                            alt="RC Document" 
                            className="w-full h-auto max-h-48 object-contain bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setSelectedDocument({ type: 'RC Document', url: editingDriver.documents.vehicleRC.image });
                              setShowDocumentModal(true);
                            }}
                          />
                          <div className="p-3 bg-gray-50 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDocument({ type: 'RC Document', url: editingDriver.documents.vehicleRC.image });
                                setShowDocumentModal(true);
                              }}
                              className="w-full"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View RC Document
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">RC Document not uploaded</p>
                        </div>
                      )}
                    </div>

                    {/* Insurance Document */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-green-600" />
                        <h4 className="font-semibold text-gray-900">Insurance Document</h4>
                      </div>
                      
                      {editingDriver?.documents?.insurance?.image ? (
                        <div className="border rounded-lg overflow-hidden">
                          <img 
                            src={editingDriver.documents.insurance.image} 
                            alt="Insurance Document" 
                            className="w-full h-auto max-h-48 object-contain bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setSelectedDocument({ type: 'Insurance Document', url: editingDriver.documents.insurance.image });
                              setShowDocumentModal(true);
                            }}
                          />
                          <div className="p-3 bg-gray-50 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDocument({ type: 'Insurance Document', url: editingDriver.documents.insurance.image });
                                setShowDocumentModal(true);
                              }}
                              className="w-full"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Insurance Document
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Insurance Document not uploaded</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDriver(false);
                setEditingDriver(null);
              }}
              disabled={isSubmitting}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateDriver}
              disabled={isSubmitting}
              className="w-full sm:w-auto order-1 sm:order-2 min-w-[120px]"
            >
              {isSubmitting ? (
                "Updating..."
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Update Driver
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document View Modal */}
      <Dialog open={showDocumentModal} onOpenChange={setShowDocumentModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>{selectedDocument?.type}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDocument && (
              <div className="border rounded-lg overflow-hidden">
                <img 
                  src={selectedDocument.url} 
                  alt={selectedDocument.type}
                  className="w-full h-auto max-h-[70vh] object-contain bg-gray-50"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden p-8 text-center text-gray-500 bg-gray-50">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Document image not available</p>
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowDocumentModal(false)}
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  if (selectedDocument) {
                    window.open(selectedDocument.url, '_blank');
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                  <Label className="text-sm font-medium text-gray-600">Registration</Label>
                  <p className="mt-1">{selectedVehicle.registrationNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Owner</Label>
                  <p className="mt-1">{selectedVehicle.driver.firstName} {selectedVehicle.driver.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone</Label>
                  <p className="mt-1">{selectedVehicle.driver.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Base Location</Label>
                  <p className="mt-1">{selectedVehicle.vehicleLocation?.address || selectedVehicle.currentLocation?.address || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Fuel Type</Label>
                  <p className="mt-1">{selectedVehicle.fuelType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Seats</Label>
                  <p className="mt-1">{selectedVehicle.seatingCapacity}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Total Trips</Label>
                  <p className="mt-1">{selectedVehicle.statistics.totalTrips}</p>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Vehicle Documents Dialog */}
      <Dialog open={showVehicleDocuments} onOpenChange={setShowVehicleDocuments}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Vehicle Documents
            </DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-6">
              {/* Vehicle Info Header */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  {getVehicleIcon(selectedVehicle.type)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedVehicle.brand} {selectedVehicle.model}</h3>
                    <p className="text-sm text-gray-600">{selectedVehicle.registrationNumber}</p>
                  </div>
                </div>
              </div>

              {/* Documents Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* RC Document */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Registration Certificate (RC)</h4>
                    <Badge 
                      variant={selectedVehicle.documents.rc.isVerified ? "default" : "secondary"}
                      className={selectedVehicle.documents.rc.isVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                    >
                      {selectedVehicle.documents.rc.isVerified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                  
                  {selectedVehicle.documents.rc.image ? (
                    <div className="border rounded-lg overflow-hidden">
                      <img 
                        src={selectedVehicle.documents.rc.image} 
                        alt="RC Document" 
                        className="w-full h-auto max-h-96 object-contain bg-gray-50"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden p-8 text-center text-gray-500 bg-gray-50">
                        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>RC image not available</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>RC document not uploaded</p>
                    </div>
                  )}
                </div>

                {/* Insurance Document */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-gray-900">Insurance Document</h4>
                    <Badge 
                      variant={selectedVehicle.documents.insurance.isVerified ? "default" : "secondary"}
                      className={selectedVehicle.documents.insurance.isVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                    >
                      {selectedVehicle.documents.insurance.isVerified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                  
                  {selectedVehicle.documents.insurance.image ? (
                    <div className="border rounded-lg overflow-hidden">
                      <img 
                        src={selectedVehicle.documents.insurance.image} 
                        alt="Insurance Document" 
                        className="w-full h-auto max-h-96 object-contain bg-gray-50"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden p-8 text-center text-gray-500 bg-gray-50">
                        <Shield className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>Insurance image not available</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <Shield className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>Insurance document not uploaded</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Status Summary */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h5 className="font-semibold text-blue-900 mb-2">Document Status Summary</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-800">RC:</span>
                    <span className={`font-medium ${selectedVehicle.documents.rc.isVerified ? 'text-green-700' : 'text-yellow-700'}`}>
                      {selectedVehicle.documents.rc.isVerified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-blue-800">Insurance:</span>
                    <span className={`font-medium ${selectedVehicle.documents.insurance.isVerified ? 'text-green-700' : 'text-yellow-700'}`}>
                      {selectedVehicle.documents.insurance.isVerified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowVehicleDocuments(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDriverManagement; 