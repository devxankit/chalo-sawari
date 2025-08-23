import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/admin/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Edit, 
  Save, 
  Camera,
  Eye,
  EyeOff,
  Key,
  LogOut,
  Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { adminAuth } from "@/services/adminApi";

interface AdminProfileData {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  profilePicture?: string;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: string;
  lastPasswordChange?: string;
  createdAt: string;
}

const AdminProfile = () => {
  const navigate = useNavigate();
  const { adminData, logout } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [editProfile, setEditProfile] = useState<Partial<AdminProfileData>>({});
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (adminData) {
      fetchProfile();
    }
  }, [adminData]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await adminAuth.getProfile();
      if (response.success) {
        setProfile(response.data);
        setEditProfile({
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          phone: response.data.phone
        });
      } else {
        throw new Error(response.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      const response = await adminAuth.updateProfile(editProfile);
      if (response.success) {
        setProfile(prev => prev ? { ...prev, ...editProfile } : null);
        setIsEditing(false);
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully",
        });
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditProfile({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phone: profile?.phone || ''
    });
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

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await adminAuth.changePassword(currentPassword, newPassword);
      if (response.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast({
          title: "Password Changed",
          description: "Your password has been updated successfully",
        });
      } else {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Failed to change password. Please check your current password and try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
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

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!profile) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <p className="text-gray-600">Profile not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Admin Profile</h1>
          <p className="text-sm md:text-base text-gray-600">Manage your profile information and password</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 text-white">
              <div className="relative inline-block">
                <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white/20">
                  <AvatarImage src={profile.profilePicture} />
                  <AvatarFallback className="text-2xl bg-white/20 text-white">
                    {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                  </AvatarFallback>
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
                <h2 className="text-xl font-semibold">{profile.firstName} {profile.lastName}</h2>
                <p className="text-blue-100">Main Administrator</p>
                <div className="flex justify-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {profile.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {profile.isVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">No email configured</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{profile.phone}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Joined {formatDate(profile.createdAt)}</span>
              </div>
              {profile.lastLogin && (
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Last login: {formatDateTime(profile.lastLogin)}</span>
                </div>
              )}
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
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={editProfile.firstName || ''}
                      onChange={(e) => setEditProfile(prev => ({ ...prev, firstName: e.target.value }))}
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-sm text-gray-600">{profile.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={editProfile.lastName || ''}
                      onChange={(e) => setEditProfile(prev => ({ ...prev, lastName: e.target.value }))}
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-sm text-gray-600">{profile.lastName}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={editProfile.phone || ''}
                    onChange={(e) => setEditProfile(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 text-sm text-gray-600">{profile.phone}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="w-full md:w-auto"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Logout Section */}
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
      </div>
    </AdminLayout>
  );
};

export default AdminProfile; 