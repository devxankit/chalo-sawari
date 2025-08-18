import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/admin/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Edit, 
  Save, 
  Camera,
  Settings,
  Activity,
  Award,
  Clock,
  Star,
  Eye,
  EyeOff,
  Lock,
  Key,
  Bell,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Database,
  CreditCard,
  FileText,
  BarChart3,
  LogOut,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  department: string;
  location: string;
  joinDate: string;
  lastLogin: string;
  status: 'active' | 'inactive';
  bio: string;
  permissions: string[];
  stats: {
    totalActions: number;
    successfulLogins: number;
    lastMonthActivity: number;
    rating: number;
    totalBookings: number;
    totalRevenue: number;
    activeUsers: number;
  };
  recentActivity: {
    id: string;
    action: string;
    timestamp: string;
    type: 'success' | 'warning' | 'info';
  }[];
}

const AdminProfile = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [profile, setProfile] = useState<AdminProfile>({
    id: "admin-001",
    name: "Admin User",
    email: "admin@chalosawari.com",
    phone: "+91 98765-43210",
    avatar: "https://github.com/shadcn.png",
    role: "Super Admin",
    department: "Administration",
    location: "Mumbai, India",
    joinDate: "2024-01-15",
    lastLogin: "2024-03-15T10:30:00Z",
    status: "active",
    bio: "Experienced administrator with 5+ years in transportation management. Passionate about improving user experience and system efficiency.",
    permissions: ["user_management", "driver_management", "booking_management", "payment_management", "system_settings", "analytics", "reports"],
    stats: {
      totalActions: 1247,
      successfulLogins: 156,
      lastMonthActivity: 89,
      rating: 4.8,
      totalBookings: 2847,
      totalRevenue: 1250000,
      activeUsers: 1243
    },
    recentActivity: [
      {
        id: "1",
        action: "Updated booking management settings",
        timestamp: "2024-03-15T10:30:00Z",
        type: "success"
      },
      {
        id: "2",
        action: "Approved new driver registration",
        timestamp: "2024-03-15T09:15:00Z",
        type: "success"
      },
      {
        id: "3",
        action: "Generated monthly revenue report",
        timestamp: "2024-03-15T08:45:00Z",
        type: "info"
      },
      {
        id: "4",
        action: "System maintenance scheduled",
        timestamp: "2024-03-14T16:20:00Z",
        type: "warning"
      }
    ]
  });

  const [editProfile, setEditProfile] = useState<Partial<AdminProfile>>({});
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Settings states
  const [settings, setSettings] = useState({
    // Security settings
    twoFactorAuth: false,
    loginNotifications: true,
    sessionManagement: true,
    accountRecovery: false,
    
    // Notification settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    systemAlerts: true,
    
    // Privacy settings
    profileVisibility: 'public',
    dataSharing: false,
    activityLog: true,
    dataExport: false
  });
  
  const [showSettingsDialog, setShowSettingsDialog] = useState<string | null>(null);
  const [settingsLoading, setSettingsLoading] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    security: true,
    notifications: false,
    privacy: false
  });

  useEffect(() => {
    const checkAuth = () => {
      // const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn');
      // if (!isAdminLoggedIn) {
      //   navigate('/admin-auth');
      //   return;
      // }
      setIsLoggedIn(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProfile(prev => ({ ...prev, ...editProfile }));
      setIsEditing(false);
      setEditProfile({});
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditProfile({});
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingToggle = async (settingKey: string, value: any) => {
    setSettingsLoading(settingKey);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSettings(prev => ({ ...prev, [settingKey]: value }));
      toast({
        title: "Setting Updated",
        description: `${settingKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} has been updated`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    } finally {
      setSettingsLoading(null);
    }
  };

  const handleSettingAction = async (action: string, settingKey: string) => {
    setSettingsLoading(settingKey);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      switch (action) {
        case 'enable2fa':
          setSettings(prev => ({ ...prev, twoFactorAuth: true }));
          toast({
            title: "2FA Enabled",
            description: "Two-factor authentication has been enabled",
            variant: "default",
          });
          break;
        case 'configureNotifications':
          toast({
            title: "Notifications Configured",
            description: "Notification settings have been updated",
            variant: "default",
          });
          break;
        case 'viewSessions':
          toast({
            title: "Sessions",
            description: "Session management opened",
            variant: "default",
          });
          break;
        case 'setupRecovery':
          setSettings(prev => ({ ...prev, accountRecovery: true }));
          toast({
            title: "Recovery Setup",
            description: "Account recovery has been configured",
            variant: "default",
          });
          break;
        case 'viewActivityLog':
          toast({
            title: "Activity Log",
            description: "Activity log opened",
            variant: "default",
          });
          break;
        case 'exportData':
          toast({
            title: "Data Export",
            description: "Your data export has been initiated",
            variant: "default",
          });
          break;
        default:
          toast({
            title: "Action Completed",
            description: "Setting has been updated successfully",
            variant: "default",
          });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform action",
        variant: "destructive",
      });
    } finally {
      setSettingsLoading(null);
      setShowSettingsDialog(null);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  const handleLogout = () => {
    // Use AdminAuthContext via top navigation; local page no longer mutates auth keys
    navigate('/admin-auth');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Activity className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const permissionLabels = {
    user_management: "User Management",
    driver_management: "Driver Management", 
    booking_management: "Booking Management",
    payment_management: "Payment Management",
    system_settings: "System Settings",
    analytics: "Analytics",
    reports: "Reports"
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <AdminLayout>
             {/* Header */}
       <div className="mb-6 md:mb-8">
         <div>
           <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
           <p className="text-sm md:text-base text-gray-600">Manage your profile information and preferences</p>
         </div>
       </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
         {/* Profile Card */}
         <div className="lg:col-span-1 space-y-6">
           <Card className="overflow-hidden">
             <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 text-white">
               <div className="relative inline-block">
                 <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white/20">
                   <AvatarImage src={profile.avatar} />
                   <AvatarFallback className="text-2xl bg-white/20 text-white">AD</AvatarFallback>
                 </Avatar>
                 <Button
                   size="sm"
                   variant="outline"
                   className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 bg-white/20 border-white/30 hover:bg-white/30"
                 >
                   <Camera className="w-4 h-4 text-white" />
                 </Button>
               </div>
               <div className="text-center">
                 <h2 className="text-xl font-semibold">{profile.name}</h2>
                 <p className="text-blue-100">{profile.role}</p>
                 <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-white/30">
                   {profile.status}
                 </Badge>
               </div>
             </div>
             <CardContent className="p-6 space-y-4">
               <div className="flex items-center space-x-3">
                 <Mail className="w-4 h-4 text-gray-400" />
                 <span className="text-sm">{profile.email}</span>
               </div>
               <div className="flex items-center space-x-3">
                 <Phone className="w-4 h-4 text-gray-400" />
                 <span className="text-sm">{profile.phone}</span>
               </div>
               <div className="flex items-center space-x-3">
                 <MapPin className="w-4 h-4 text-gray-400" />
                 <span className="text-sm">{profile.location}</span>
               </div>
               <div className="flex items-center space-x-3">
                 <Calendar className="w-4 h-4 text-gray-400" />
                 <span className="text-sm">Joined {formatDate(profile.joinDate)}</span>
               </div>

             </CardContent>
           </Card>


         </div>

         {/* Profile Details */}
         <div className="lg:col-span-2 space-y-6">
           {/* Basic Information */}
           <Card>
             <CardHeader className="flex flex-row items-center justify-between">
               <CardTitle className="text-lg flex items-center">
                 <User className="w-5 h-5 mr-2" />
                 Basic Information
               </CardTitle>
               {!isEditing ? (
                 <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                   <Edit className="w-4 h-4 mr-2" />
                   Edit
                 </Button>
               ) : (
                 <div className="flex space-x-2">
                   <Button onClick={handleCancelEdit} variant="outline" size="sm">
                     Cancel
                   </Button>
                   <Button onClick={handleSaveProfile} disabled={isSaving} size="sm">
                     <Save className="w-4 h-4 mr-2" />
                     {isSaving ? "Saving..." : "Save"}
                   </Button>
                 </div>
               )}
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                   {isEditing ? (
                     <Input
                       id="name"
                       value={editProfile.name || profile.name}
                       onChange={(e) => setEditProfile(prev => ({ ...prev, name: e.target.value }))}
                       className="mt-2"
                     />
                   ) : (
                     <p className="mt-2 text-sm text-gray-600">{profile.name}</p>
                   )}
                 </div>
                 <div>
                   <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                   {isEditing ? (
                     <Input
                       id="email"
                       type="email"
                       value={editProfile.email || profile.email}
                       onChange={(e) => setEditProfile(prev => ({ ...prev, email: e.target.value }))}
                       className="mt-2"
                     />
                   ) : (
                     <p className="mt-2 text-sm text-gray-600">{profile.email}</p>
                   )}
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                   {isEditing ? (
                     <Input
                       id="phone"
                       value={editProfile.phone || profile.phone}
                       onChange={(e) => setEditProfile(prev => ({ ...prev, phone: e.target.value }))}
                       className="mt-2"
                     />
                   ) : (
                     <p className="mt-2 text-sm text-gray-600">{profile.phone}</p>
                   )}
                 </div>
                 <div>
                   <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                   {isEditing ? (
                     <Input
                       id="location"
                       value={editProfile.location || profile.location}
                       onChange={(e) => setEditProfile(prev => ({ ...prev, location: e.target.value }))}
                       className="mt-2"
                     />
                   ) : (
                     <p className="mt-2 text-sm text-gray-600">{profile.location}</p>
                   )}
                 </div>
               </div>
               <div>
                 <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                 {isEditing ? (
                   <Textarea
                     id="bio"
                     value={editProfile.bio || profile.bio}
                     onChange={(e) => setEditProfile(prev => ({ ...prev, bio: e.target.value }))}
                     className="mt-2"
                     rows={3}
                   />
                 ) : (
                   <p className="mt-2 text-sm text-gray-600">{profile.bio}</p>
                 )}
               </div>
             </CardContent>
           </Card>

           {/* Account Information */}
           <Card>
             <CardHeader>
               <CardTitle className="text-lg flex items-center">
                 <Settings className="w-5 h-5 mr-2" />
                 Account Information
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <Label className="text-sm font-medium">Role</Label>
                   <p className="mt-2 text-sm text-gray-600">{profile.role}</p>
                 </div>
                 <div>
                   <Label className="text-sm font-medium">Department</Label>
                   <p className="mt-2 text-sm text-gray-600">{profile.department}</p>
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <Label className="text-sm font-medium">Join Date</Label>
                   <p className="mt-2 text-sm text-gray-600">{formatDate(profile.joinDate)}</p>
                 </div>
                 <div>
                   <Label className="text-sm font-medium">Last Login</Label>
                   <p className="mt-2 text-sm text-gray-600">{formatDateTime(profile.lastLogin)}</p>
                 </div>
               </div>
             </CardContent>
           </Card>



           {/* Recent Activity */}
           <Card>
             <CardHeader>
               <CardTitle className="text-lg flex items-center">
                 <Activity className="w-5 h-5 mr-2" />
                 Recent Activity
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 {profile.recentActivity.map((activity) => (
                   <div key={activity.id} className="flex items-start space-x-3">
                     <div className="mt-1">
                       {getActivityIcon(activity.type)}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                       <p className="text-xs text-gray-500">{formatDateTime(activity.timestamp)}</p>
                     </div>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
         </div>
       </div>

             <div className="max-w-4xl space-y-6">
                       {/* Security Section */}
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('security')}
              >
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Security Settings
                  </div>
                  {expandedSections.security ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </CardTitle>
              </CardHeader>
                           {expandedSections.security && (
                <CardContent className="space-y-6">
                  {/* Change Password */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Change Password</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="currentPassword" className="text-sm font-medium">Current Password</Label>
                        <div className="relative mt-2">
                          <Input
                            id="currentPassword"
                            type={showPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="mt-2"
                      />
                    </div>
                    <Button 
                      onClick={handleChangePassword} 
                      disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
                      className="w-full md:w-auto"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      {isSaving ? "Changing Password..." : "Change Password"}
                    </Button>
                  </div>

                  <Separator />

                  {/* Security Options */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Security Options</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h5 className="font-medium">Two-Factor Authentication</h5>
                          <p className="text-sm text-gray-600">Add an extra layer of security</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={settings.twoFactorAuth}
                            onCheckedChange={(checked) => handleSettingToggle('twoFactorAuth', checked)}
                            disabled={settingsLoading === 'twoFactorAuth'}
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSettingAction('enable2fa', 'twoFactorAuth')}
                            disabled={settingsLoading === 'twoFactorAuth'}
                          >
                            {settingsLoading === 'twoFactorAuth' ? 'Enabling...' : 'Enable'}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h5 className="font-medium">Login Notifications</h5>
                          <p className="text-sm text-gray-600">Get notified of new login attempts</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={settings.loginNotifications}
                            onCheckedChange={(checked) => handleSettingToggle('loginNotifications', checked)}
                            disabled={settingsLoading === 'loginNotifications'}
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSettingAction('configureNotifications', 'loginNotifications')}
                            disabled={settingsLoading === 'loginNotifications'}
                          >
                            {settingsLoading === 'loginNotifications' ? 'Configuring...' : 'Configure'}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h5 className="font-medium">Session Management</h5>
                          <p className="text-sm text-gray-600">Manage active sessions and devices</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={settings.sessionManagement}
                            onCheckedChange={(checked) => handleSettingToggle('sessionManagement', checked)}
                            disabled={settingsLoading === 'sessionManagement'}
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSettingAction('viewSessions', 'sessionManagement')}
                            disabled={settingsLoading === 'sessionManagement'}
                          >
                            {settingsLoading === 'sessionManagement' ? 'Loading...' : 'View Sessions'}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h5 className="font-medium">Account Recovery</h5>
                          <p className="text-sm text-gray-600">Set up recovery email and phone</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={settings.accountRecovery}
                            onCheckedChange={(checked) => handleSettingToggle('accountRecovery', checked)}
                            disabled={settingsLoading === 'accountRecovery'}
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSettingAction('setupRecovery', 'accountRecovery')}
                            disabled={settingsLoading === 'accountRecovery'}
                          >
                            {settingsLoading === 'accountRecovery' ? 'Setting up...' : 'Setup'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
           </Card>

                       {/* Notification Settings */}
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('notifications')}
              >
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Notification Settings
                  </div>
                  {expandedSections.notifications ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </CardTitle>
              </CardHeader>
              {expandedSections.notifications && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h5 className="font-medium">Email Notifications</h5>
                        <p className="text-sm text-gray-600">Receive updates via email</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={settings.emailNotifications}
                          onCheckedChange={(checked) => handleSettingToggle('emailNotifications', checked)}
                          disabled={settingsLoading === 'emailNotifications'}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSettingAction('configureNotifications', 'emailNotifications')}
                          disabled={settingsLoading === 'emailNotifications'}
                        >
                          {settingsLoading === 'emailNotifications' ? 'Configuring...' : 'Configure'}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h5 className="font-medium">SMS Notifications</h5>
                        <p className="text-sm text-gray-600">Receive updates via SMS</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={settings.smsNotifications}
                          onCheckedChange={(checked) => handleSettingToggle('smsNotifications', checked)}
                          disabled={settingsLoading === 'smsNotifications'}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSettingAction('configureNotifications', 'smsNotifications')}
                          disabled={settingsLoading === 'smsNotifications'}
                        >
                          {settingsLoading === 'smsNotifications' ? 'Configuring...' : 'Configure'}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h5 className="font-medium">Push Notifications</h5>
                        <p className="text-sm text-gray-600">Receive push notifications</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={settings.pushNotifications}
                          onCheckedChange={(checked) => handleSettingToggle('pushNotifications', checked)}
                          disabled={settingsLoading === 'pushNotifications'}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSettingAction('configureNotifications', 'pushNotifications')}
                          disabled={settingsLoading === 'pushNotifications'}
                        >
                          {settingsLoading === 'pushNotifications' ? 'Configuring...' : 'Configure'}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h5 className="font-medium">System Alerts</h5>
                        <p className="text-sm text-gray-600">Important system notifications</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={settings.systemAlerts}
                          onCheckedChange={(checked) => handleSettingToggle('systemAlerts', checked)}
                          disabled={settingsLoading === 'systemAlerts'}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSettingAction('configureNotifications', 'systemAlerts')}
                          disabled={settingsLoading === 'systemAlerts'}
                        >
                          {settingsLoading === 'systemAlerts' ? 'Configuring...' : 'Configure'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

                       {/* Privacy Settings */}
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('privacy')}
              >
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Privacy Settings
                  </div>
                  {expandedSections.privacy ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </CardTitle>
              </CardHeader>
              {expandedSections.privacy && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h5 className="font-medium">Profile Visibility</h5>
                        <p className="text-sm text-gray-600">Control who can see your profile</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select 
                          value={settings.profileVisibility}
                          onValueChange={(value) => handleSettingToggle('profileVisibility', value)}
                          disabled={settingsLoading === 'profileVisibility'}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="friends">Friends Only</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSettingAction('configurePrivacy', 'profileVisibility')}
                          disabled={settingsLoading === 'profileVisibility'}
                        >
                          {settingsLoading === 'profileVisibility' ? 'Configuring...' : 'Configure'}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h5 className="font-medium">Data Sharing</h5>
                        <p className="text-sm text-gray-600">Control data sharing preferences</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={settings.dataSharing}
                          onCheckedChange={(checked) => handleSettingToggle('dataSharing', checked)}
                          disabled={settingsLoading === 'dataSharing'}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSettingAction('configurePrivacy', 'dataSharing')}
                          disabled={settingsLoading === 'dataSharing'}
                        >
                          {settingsLoading === 'dataSharing' ? 'Configuring...' : 'Configure'}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h5 className="font-medium">Activity Log</h5>
                        <p className="text-sm text-gray-600">View your activity history</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={settings.activityLog}
                          onCheckedChange={(checked) => handleSettingToggle('activityLog', checked)}
                          disabled={settingsLoading === 'activityLog'}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSettingAction('viewActivityLog', 'activityLog')}
                          disabled={settingsLoading === 'activityLog'}
                        >
                          {settingsLoading === 'activityLog' ? 'Loading...' : 'View Log'}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h5 className="font-medium">Data Export</h5>
                        <p className="text-sm text-gray-600">Export your data</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={settings.dataExport}
                          onCheckedChange={(checked) => handleSettingToggle('dataExport', checked)}
                          disabled={settingsLoading === 'dataExport'}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSettingAction('exportData', 'dataExport')}
                          disabled={settingsLoading === 'dataExport'}
                        >
                          {settingsLoading === 'dataExport' ? 'Exporting...' : 'Export'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
         </div>



       {/* Logout Section */}
       <div className="mt-6">
         <Card className="border-red-200 bg-red-50">
           <CardContent className="p-6">
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                   <LogOut className="w-5 h-5 text-red-600" />
                 </div>
                 <div>
                   <h4 className="font-medium text-gray-900">Logout</h4>
                   <p className="text-sm text-gray-600">Sign out of your admin account</p>
                 </div>
               </div>
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="text-red-600 border-red-300 hover:bg-red-100 hover:text-red-700"
                 onClick={handleLogout}
               >
                 <LogOut className="w-4 h-4 mr-2" />
                 Logout
               </Button>
             </div>
           </CardContent>
         </Card>
       </div>
     </AdminLayout>
   );
 };

export default AdminProfile; 