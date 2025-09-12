import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DriverTopNavigation from "@/driver/components/DriverTopNavigation";
import DriverFooter from "@/driver/components/DriverFooter";
import { Home, MessageSquare, Car, User, LogOut, Edit, Save, X, Camera, Upload, Phone, Mail, MapPin, Calendar, CreditCard, Download, Star, Settings, Bell, TrendingUp, Loader2, FileText, Shield, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useDriverAuth } from "@/contexts/DriverAuthContext";
import { toast } from "sonner";
import apiService from "@/services/api";

const DriverProfile = () => {
  const navigate = useNavigate();
  const { driver, isLoggedIn, logout, refreshDriverData, updateDriverData } = useDriverAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showEarningsDialog, setShowEarningsDialog] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [earningsData, setEarningsData] = useState<any>(null);
  const [statsData, setStatsData] = useState<any>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{type: string, url: string} | null>(null);

  // Format address for display
  const formatAddress = (address: any) => {
    if (!address) return "Not specified";
    const parts = [address.street, address.city, address.state, address.pincode, address.country];
    return parts.filter(Boolean).join(", ");
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get driver stats from backend
  const fetchDriverStats = async () => {
    try {
      const response = await apiService.getDriverStats();
      if (response.success) {
        setStatsData(response.data);
      }
    } catch (error) {
      console.error('Error fetching driver stats:', error);
    }
  };

  // Get driver earnings from backend
  const fetchDriverEarnings = async () => {
    try {
      const response = await apiService.getDriverEarnings();
      if (response.success) {
        setEarningsData(response.data);
      }
    } catch (error) {
      console.error('Error fetching driver earnings:', error);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/driver-auth');
    } else if (driver) {
      // Fetch additional data when driver is available
      fetchDriverStats();
      fetchDriverEarnings();
    }
  }, [isLoggedIn, driver, navigate]);

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
      case "requests":
        navigate('/driver/requests');
        break;
      case "myvehicle":
        navigate('/driver/myvehicle');
        break;
      default:
        navigate('/driver/profile');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    // This function is no longer needed as we're using the edit dialog
  };

  const handleUpdateProfile = async (data: any) => {
    setIsLoading(true);
    try {
      // Prepare the data for the backend
      const updateData: any = {};
      
      if (data.firstName && data.lastName) {
        updateData.firstName = data.firstName;
        updateData.lastName = data.lastName;
      }
      
      if (data.phone) {
        updateData.phone = data.phone;
      }
      
      if (data.email) {
        updateData.email = data.email;
      }
      
      if (data.address) {
        updateData.address = data.address;
      }

      const response = await apiService.updateDriverProfile(updateData);
      
      if (response.success) {
        // Update local driver data
        updateDriverData(response.data);
        toast.success("Profile updated successfully!");
        setShowEditDialog(false);
      } else {
        toast.error(response.error?.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadEarnings = () => {
    // Download earnings report logic here
    toast({
      title: "Download Started",
      description: "Earnings report download has started.",
    });
  };

  const handleToggleNotifications = (checked: boolean) => {
    setNotifications(checked);
    toast.success(`Notifications ${checked ? 'enabled' : 'disabled'}`);
  };

  const handleToggleLocationSharing = (checked: boolean) => {
    setLocationSharing(checked);
    toast.success(`Location sharing ${checked ? 'enabled' : 'disabled'}`);
  };

  const handleViewDocument = (documentType: string, documentUrl: string) => {
    setSelectedDocument({ type: documentType, url: documentUrl });
    setShowDocumentModal(true);
  };

  const handleUpdateDocument = (documentType: 'vehicleRC' | 'insurance') => {
    const inputId = documentType === 'vehicleRC' ? 'rcUpload' : 'insuranceUpload';
    document.getElementById(inputId)?.click();
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, documentType: 'vehicleRC' | 'insurance') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);

      console.log('Uploading document:', { documentType, fileName: file.name, fileSize: file.size });

      // Custom request for file upload to avoid Content-Type conflicts
      const token = apiService.getAuthToken('driver');
      const url = `${apiService.baseURL}/driver/upload-document`;
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
      });

      const data = await response.json();

      console.log('Upload response:', response);
      console.log('Upload data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      if (data.success) {
        // Update the driver state with the new document
        const updatedDriver = {
          ...driver,
          documents: {
            ...driver.documents,
            [documentType]: {
              ...driver.documents?.[documentType],
              image: data.data.documentUrl,
              isVerified: false // New uploads need verification
            }
          }
        };
        
        // Update the driver data in the context
        updateDriverData(updatedDriver);

        toast.success(`${documentType.toUpperCase()} document uploaded successfully`);
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Document upload error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      const errorMessage = error.message || 'Failed to upload document';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      // Reset the input
      e.target.value = '';
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading driver profile...</p>
        </div>
      </div>
    );
  }

  // Calculate derived data
  const driverName = `${driver.firstName} ${driver.lastName}`;
  const joinDate = formatDate(driver.createdAt);
  const currentAddress = formatAddress(driver.address);

  return (
    <div className="min-h-screen bg-gray-50">
      <DriverTopNavigation />
      
      {/* Driver Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 md:py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Driver Module</h1>
                <p className="text-blue-100 text-sm md:text-base">Profile & Settings</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to logout? You will need to login again to access the driver portal.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                      Logout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 md:py-6 pb-20">
        {/* Profile Header */}
        <Card className="mb-4 md:mb-6">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">{driverName}</h2>
                <p className="text-gray-600 text-sm md:text-base">Professional Driver</p>

              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full md:w-auto"
                onClick={() => setShowEditDialog(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-4 md:mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
              <User className="w-5 h-5 text-blue-600" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm md:text-base">{driver.phone}</p>
                  <p className="text-xs md:text-sm text-gray-500">Mobile Number</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm md:text-base truncate">{driver.email}</p>
                  <p className="text-xs md:text-sm text-gray-500">Email Address</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm md:text-base">{currentAddress}</p>
                  <p className="text-xs md:text-sm text-gray-500">Address</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm md:text-base">Member since {joinDate}</p>
                  <p className="text-xs md:text-sm text-gray-500">Join Date</p>
                </div>
              </div>

              {/* RC Document Upload */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm md:text-base">
                        {driver.documents?.vehicleRC?.image ? 'RC Document Uploaded' : 'RC Document Not Uploaded'}
                      </p>
                      <p className="text-xs md:text-sm text-gray-500">RC Document</p>
                    </div>
                     <div className="flex flex-col space-y-2">
                       {driver.documents?.vehicleRC?.image ? (
                         <>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleViewDocument('RC Document', driver.documents.vehicleRC.image)}
                             className="text-blue-600 hover:text-blue-700"
                           >
                             <Eye className="w-4 h-4 mr-1" />
                             View
                           </Button>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleUpdateDocument('vehicleRC')}
                             className="text-orange-600 hover:text-orange-700"
                           >
                             <Upload className="w-4 h-4 mr-1" />
                             Update
                           </Button>
                         </>
                       ) : (
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => document.getElementById('rcUpload')?.click()}
                           className="text-green-600 hover:text-green-700"
                         >
                           <Upload className="w-4 h-4 mr-1" />
                           Upload
                         </Button>
                       )}
                     </div>
                  </div>
                </div>
                <input
                  id="rcUpload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleDocumentUpload(e, 'vehicleRC')}
                  className="hidden"
                />
              </div>

              {/* Insurance Document Upload */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Shield className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm md:text-base">
                        {driver.documents?.insurance?.image ? 'Insurance Document Uploaded' : 'Insurance Document Not Uploaded'}
                      </p>
                      <p className="text-xs md:text-sm text-gray-500">Insurance Document</p>
                    </div>
                     <div className="flex flex-col space-y-2">
                       {driver.documents?.insurance?.image ? (
                         <>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleViewDocument('Insurance Document', driver.documents.insurance.image)}
                             className="text-blue-600 hover:text-blue-700"
                           >
                             <Eye className="w-4 h-4 mr-1" />
                             View
                           </Button>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleUpdateDocument('insurance')}
                             className="text-orange-600 hover:text-orange-700"
                           >
                             <Upload className="w-4 h-4 mr-1" />
                             Update
                           </Button>
                         </>
                       ) : (
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => document.getElementById('insuranceUpload')?.click()}
                           className="text-green-600 hover:text-green-700"
                         >
                           <Upload className="w-4 h-4 mr-1" />
                           Upload
                         </Button>
                       )}
                     </div>
                  </div>
                </div>
                <input
                  id="insuranceUpload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleDocumentUpload(e, 'insurance')}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Overview */}
        <Card className="mb-4 md:mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
              <CreditCard className="w-5 h-5 text-green-600" />
              <span>Earnings Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors" onClick={() => setShowEarningsDialog(true)}>
                <div className="text-lg md:text-2xl font-bold text-green-600">
                  ₹{earningsData?.netEarnings?.toLocaleString() || '0'}
                </div>
                <div className="text-xs md:text-sm text-gray-600">Total Earnings</div>
              </div>
              <div className="text-center p-3 md:p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => setShowEarningsDialog(true)}>
                <div className="text-lg md:text-2xl font-bold text-blue-600">
                  ₹{driver.earnings?.wallet?.balance?.toLocaleString() || '0'}
                </div>
                <div className="text-xs md:text-sm text-gray-600">Wallet Balance</div>
              </div>
              <div className="text-center p-3 md:p-4 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors" onClick={() => setShowEarningsDialog(true)}>
                <div className="text-lg md:text-2xl font-bold text-purple-600">
                  {driver.totalRides || 0}
                </div>
                <div className="text-xs md:text-sm text-gray-600">Total Rides</div>
              </div>
              <div className="text-center p-3 md:p-4 bg-orange-50 rounded-lg">
                <div className="text-lg md:text-2xl font-bold text-orange-600">
                  {driver.earnings?.commission || 15}%
                </div>
                <div className="text-xs md:text-sm text-gray-600">Commission Rate</div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Performance Stats */}
        <Card className="mb-4 md:mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>Performance Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl md:text-3xl font-bold text-blue-600">
                  {statsData?.completionRate || 0}%
                </div>
                <div className="text-xs md:text-sm text-gray-600">Completion Rate</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl md:text-3xl font-bold text-green-600">
                  {driver.rating || 0}
                </div>
                <div className="text-xs md:text-sm text-gray-600">Average Rating</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-xl md:text-3xl font-bold text-purple-600">
                  {driver.totalRides || 0}
                </div>
                <div className="text-xs md:text-sm text-gray-600">Total Rides</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="mb-4 md:mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
              <Settings className="w-5 h-5 text-gray-600" />
              <span>Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
                <Bell className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm md:text-base">Push Notifications</p>
                  <p className="text-xs md:text-sm text-gray-500">Receive ride requests and updates</p>
                </div>
              </div>
              <Switch 
                checked={notifications} 
                onCheckedChange={handleToggleNotifications}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
                <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm md:text-base">Location Sharing</p>
                  <p className="text-xs md:text-sm text-gray-500">Share location with customers</p>
                </div>
              </div>
              <Switch 
                checked={locationSharing} 
                onCheckedChange={handleToggleLocationSharing}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <EditProfileForm 
            driverData={driver} 
            onSubmit={handleUpdateProfile} 
            onCancel={() => setShowEditDialog(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

       {/* Earnings Details Dialog */}
       <Dialog open={showEarningsDialog} onOpenChange={setShowEarningsDialog}>
         <DialogContent className="max-w-lg">
           <DialogHeader>
             <DialogTitle>Earnings Details</DialogTitle>
           </DialogHeader>
           <EarningsDetailsDialog 
             driverData={driver} 
             earningsData={earningsData}
           />
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

// Edit Profile Form Component
const EditProfileForm = ({ 
  driverData, 
  onSubmit, 
  onCancel, 
  isLoading 
}: { 
  driverData: any; 
  onSubmit: (data: any) => void; 
  onCancel: () => void; 
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState({
    firstName: driverData.firstName || "",
    lastName: driverData.lastName || "",
    phone: driverData.phone || "",
    email: driverData.email || "",
    address: {
      street: driverData.address?.street || "",
      city: driverData.address?.city || "",
      state: driverData.address?.state || "",
      pincode: driverData.address?.pincode || "",
      country: driverData.address?.country || "India"
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input 
            id="firstName" 
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input 
            id="lastName" 
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            required
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input 
          id="phone" 
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input 
          id="email" 
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="street">Street Address</Label>
        <Input 
          id="street" 
          value={formData.address.street}
          onChange={(e) => handleAddressChange('street', e.target.value)}
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="city">City</Label>
          <Input 
            id="city" 
            value={formData.address.city}
            onChange={(e) => handleAddressChange('city', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input 
            id="state" 
            value={formData.address.state}
            onChange={(e) => handleAddressChange('state', e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="pincode">Pincode</Label>
          <Input 
            id="pincode" 
            value={formData.address.pincode}
            onChange={(e) => handleAddressChange('pincode', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input 
            id="country" 
            value={formData.address.country}
            onChange={(e) => handleAddressChange('country', e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="flex space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            'Update Profile'
          )}
        </Button>
      </div>
    </form>
  );
};

// Earnings Details Dialog Component
const EarningsDetailsDialog = ({ 
  driverData, 
  earningsData 
}: { 
  driverData: any; 
  earningsData: any;
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            ₹{earningsData?.netEarnings?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-gray-600">Total Earnings</div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            ₹{driverData.earnings?.wallet?.balance?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-gray-600">Wallet Balance</div>
        </div>
      </div>
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <div className="text-3xl font-bold text-purple-600">
          {earningsData?.totalBookings || 0}
        </div>
        <div className="text-sm text-gray-600">Total Bookings</div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Rides:</span>
          <span className="font-medium">{driverData.totalRides || 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Commission Rate:</span>
          <span className="font-medium">{driverData.earnings?.commission || 15}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Average Rating:</span>
          <span className="font-medium">{driverData.rating || 0}</span>
        </div>
      </div>
      <div className="flex space-x-3 pt-4">
        <Button variant="outline" className="flex-1" onClick={() => window.print()}>
          <Download className="w-4 h-4 mr-2" />
          Print Report
        </Button>
        <Button className="flex-1">
          <TrendingUp className="w-4 h-4 mr-2" />
          View Analytics
        </Button>
      </div>
    </div>
  );
};

export default DriverProfile; 