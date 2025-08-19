import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Home, 
  List, 
  HelpCircle, 
  Settings, 
  LogOut, 
  CreditCard, 
  MapPin, 
  Phone, 
  Mail,
  ChevronRight,
  Shield,
  Bell,
  Camera,
  Edit3
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useUserAuth } from "@/contexts/UserAuthContext";

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout: contextLogout } = useUserAuth();
  
  const [userProfile, setUserProfile] = useState({
    name: "Ajay Panchal",
    email: "ajay@example.com",
    phone: "+91 1234567890",
    location: "Indore, Madhya Pradesh",
    avatar: "https://github.com/shadcn.png"
  });

  const [editProfile, setEditProfile] = useState({
    name: userProfile.name,
    email: userProfile.email,
    phone: userProfile.phone,
    location: userProfile.location
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Update user profile when user data changes
  useEffect(() => {
    if (user) {
      setUserProfile({
        name: `${user.firstName} ${user.lastName}`,
        email: user.email || "No email provided",
        phone: user.phone || "No phone provided",
        location: "Indore, Madhya Pradesh", // Default location
        avatar: user.profilePicture || "https://github.com/shadcn.png"
      });
      
      // Also update edit profile
      setEditProfile({
        name: `${user.firstName} ${user.lastName}`,
        email: user.email || "No email provided",
        phone: user.phone || "No phone provided",
        location: "Indore, Madhya Pradesh"
      });
    }
  }, [user]);

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleLogout = () => {
    contextLogout();
    navigate('/');
  };

  const handleSaveProfile = () => {
    setUserProfile({
      ...userProfile,
      ...editProfile
    });
    setIsEditModalOpen(false);
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserProfile({
          ...userProfile,
          avatar: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
    setIsPhotoModalOpen(false);
  };

  const handleModalClose = () => {
    setActiveModal(null);
  };

  const profileOptions = [
    {
      id: 1,
      title: "Personal Information",
      icon: User,
      description: "Update your personal details",
      modal: "personal"
    },
    {
      id: 2,
      title: "Payment Methods",
      icon: CreditCard,
      description: "Manage your payment options",
      modal: "payment"
    },
    {
      id: 3,
      title: "Saved Addresses",
      icon: MapPin,
      description: "Your saved pickup locations",
      modal: "addresses"
    },
    {
      id: 4,
      title: "Notifications",
      icon: Bell,
      description: "Manage notification preferences",
      modal: "notifications"
    },
    {
      id: 5,
      title: "Privacy & Security",
      icon: Shield,
      description: "Account security settings",
      modal: "privacy"
    },
    {
      id: 6,
      title: "Settings",
      icon: Settings,
      description: "App preferences and settings",
      modal: "settings"
    }
  ];

  const renderModalContent = (modalType: string) => {
    switch (modalType) {
      case "personal":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modal-name">Full Name</Label>
              <Input
                id="modal-name"
                value={editProfile.name}
                onChange={(e) => setEditProfile({...editProfile, name: e.target.value})}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-email">Email</Label>
              <Input
                id="modal-email"
                type="email"
                value={editProfile.email}
                onChange={(e) => setEditProfile({...editProfile, email: e.target.value})}
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-phone">Phone Number</Label>
              <Input
                id="modal-phone"
                value={editProfile.phone}
                onChange={(e) => setEditProfile({...editProfile, phone: e.target.value})}
                placeholder="Enter your phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-location">Location</Label>
              <Input
                id="modal-location"
                value={editProfile.location}
                onChange={(e) => setEditProfile({...editProfile, location: e.target.value})}
                placeholder="Enter your location"
              />
            </div>
            <div className="flex space-x-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={handleModalClose}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSaveProfile}>
                Save Changes
              </Button>
            </div>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-medium">Credit Card</p>
                    <p className="text-sm text-muted-foreground">**** **** **** 1234</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-medium">UPI</p>
                    <p className="text-sm text-muted-foreground">ajay@upi</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            </div>
            <Button className="w-full">
              <CreditCard className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
            <Button variant="outline" className="w-full" onClick={handleModalClose}>
              Close
            </Button>
          </div>
        );

      case "addresses":
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 border border-border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Home</p>
                      <p className="text-sm text-muted-foreground">123 Main Street, Indore, MP</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </div>
              <div className="p-3 border border-border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Office</p>
                      <p className="text-sm text-muted-foreground">456 Business Park, Indore, MP</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </div>
            </div>
            <Button className="w-full">
              <MapPin className="w-4 h-4 mr-2" />
              Add New Address
            </Button>
            <Button variant="outline" className="w-full" onClick={handleModalClose}>
              Close
            </Button>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive booking confirmations via email</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via SMS</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Promotional Offers</p>
                  <p className="text-sm text-muted-foreground">Receive special offers and discounts</p>
                </div>
                <Switch />
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleModalClose}>
              Save Preferences
            </Button>
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Biometric Login</p>
                  <p className="text-sm text-muted-foreground">Use fingerprint or face ID</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Location Services</p>
                  <p className="text-sm text-muted-foreground">Allow app to access your location</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Data Sharing</p>
                  <p className="text-sm text-muted-foreground">Share usage data for improvements</p>
                </div>
                <Switch />
              </div>
            </div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
              <Button variant="outline" className="w-full">
                Privacy Policy
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={handleModalClose}>
              Close
            </Button>
          </div>
        );

      case "settings":
        return (
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-Login</p>
                  <p className="text-sm text-muted-foreground">Stay logged in</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sound Effects</p>
                  <p className="text-sm text-muted-foreground">Play sounds for notifications</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Haptic Feedback</p>
                  <p className="text-sm text-muted-foreground">Vibrate on interactions</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                Clear Cache
              </Button>
              <Button variant="outline" className="w-full">
                About App
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={handleModalClose}>
              Close
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!isAuthenticated ? (
        // Login Screen
        <div className="bg-white">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-8 max-w-md mx-auto px-4">
              {/* Title */}
              <h1 className="text-3xl font-bold text-black leading-tight">
                Log in to manage<br />your bookings
              </h1>
              
              {/* Login Button */}
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 text-white text-lg font-semibold py-4 rounded-lg"
                onClick={handleLogin}
              >
                Log in
              </Button>
              
              {/* Sign Up Link */}
              <p className="text-sm text-gray-600">
                Don't have an account? <span className="underline cursor-pointer text-black" onClick={handleLogin}>Sign up</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Profile Management Screen
        <>
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4">
            <h1 className="text-xl font-semibold">My Profile</h1>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6 pb-20">
            {/* Profile Card */}
            <Card className="p-6 border border-border">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <img src={userProfile.avatar} alt={userProfile.name} />
                  </Avatar>
                  <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground p-0"
                      >
                        <Camera className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Profile Photo</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="text-center">
                          <Avatar className="w-20 h-20 mx-auto mb-4">
                            <img src={userProfile.avatar} alt={userProfile.name} />
                          </Avatar>
                          <p className="text-sm text-muted-foreground mb-4">
                            Choose a new profile photo
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="photo-upload" className="cursor-pointer">
                            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
                              <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm font-medium">Click to upload photo</p>
                              <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB</p>
                            </div>
                          </Label>
                          <Input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-foreground">{userProfile.name}</h2>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{userProfile.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{userProfile.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{userProfile.location}</span>
                    </div>
                  </div>
                </div>
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={editProfile.name}
                          onChange={(e) => setEditProfile({...editProfile, name: e.target.value})}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editProfile.email}
                          onChange={(e) => setEditProfile({...editProfile, email: e.target.value})}
                          placeholder="Enter your email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={editProfile.phone}
                          onChange={(e) => setEditProfile({...editProfile, phone: e.target.value})}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={editProfile.location}
                          onChange={(e) => setEditProfile({...editProfile, location: e.target.value})}
                          placeholder="Enter your location"
                        />
                      </div>
                      <div className="flex space-x-2 pt-4">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setIsEditModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          className="flex-1"
                          onClick={handleSaveProfile}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            {/* Profile Options */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Account Settings</h3>
              <div className="space-y-2">
                {profileOptions.map((option) => (
                  <Dialog key={option.id} open={activeModal === option.modal} onOpenChange={(open) => setActiveModal(open ? option.modal : null)}>
                    <DialogTrigger asChild>
                      <Card className="p-4 border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <option.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{option.title}</h4>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </Card>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{option.title}</DialogTitle>
                      </DialogHeader>
                      {renderModalContent(option.modal)}
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>

            {/* Logout */}
            <Card className="p-4 border border-border">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">Logout</h4>
                  <p className="text-sm text-muted-foreground">Sign out of your account</p>
                </div>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </Card>

            {/* Download App */}
            <Card className="p-4 border border-border">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">Download App</h4>
                  <p className="text-sm text-muted-foreground">Get the mobile app for better experience</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                  Download
                </Button>
              </div>
            </Card>

            {/* App Version */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">App Version 1.0.0</p>
            </div>
          </div>
        </>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background z-50">
        <div className="flex justify-around py-2">
          <Link to="/" className="flex flex-col items-center space-y-1">
            <Home className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Home</span>
          </Link>
          <Link to="/bookings" className="flex flex-col items-center space-y-1">
            <List className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Bookings</span>
          </Link>
          <Link to="/help" className="flex flex-col items-center space-y-1">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Help</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center space-y-1">
            <User className="w-5 h-5 text-primary" />
            <span className="text-xs text-primary font-medium">Account</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile; 