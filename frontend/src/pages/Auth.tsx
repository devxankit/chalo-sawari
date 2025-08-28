import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Mail, Lock, User, Phone, Facebook, Twitter, Instagram, Home, List, HelpCircle, ArrowLeft, X, ChevronDown } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import TopNavigation from "@/components/TopNavigation";
import busLogo from "@/assets/BusLogo.png";
import apiService from "@/services/api";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useUserAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [showOtpField, setShowOtpField] = useState(false);
  const [showSignupOtpField, setShowSignupOtpField] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [isLoading, setIsLoading] = useState(false);
  
  // Get return URL from location state
  const returnUrl = location.state?.returnUrl || '/profile';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log('Auth: User already authenticated, redirecting to:', returnUrl);
      navigate(returnUrl, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, returnUrl]);

  // Form states
  const [loginForm, setLoginForm] = useState({
    phone: "",
    otp: ""
  });

  const [signupForm, setSignupForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    otp: ""
  });



  const handleSendOtp = async () => {
    if (loginForm.phone.trim()) {
      try {
        setIsLoading(true);
        // Remove country code and send only the phone number
        const phoneNumber = loginForm.phone.replace(/[^0-9]/g, '');
        
        const response = await apiService.request('/auth/send-otp', {
          method: 'POST',
          body: JSON.stringify({ 
            phone: phoneNumber,
            purpose: 'login'
          })
        });

        if (response.success) {
          setShowOtpField(true);
          toast({
            title: "OTP Sent",
            description: `OTP sent to ${countryCode} ${loginForm.phone}`,
          });
        }
      } catch (error) {
        console.error('Send OTP error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to send OTP. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSendSignupOtp = async () => {
    if (signupForm.phone.trim() && signupForm.firstName.trim() && signupForm.lastName.trim()) {
      try {
        setIsLoading(true);
        // Remove country code and send only the phone number
        const phoneNumber = signupForm.phone.replace(/[^0-9]/g, '');
        
        const response = await apiService.request('/auth/send-otp', {
          method: 'POST',
          body: JSON.stringify({ 
            phone: phoneNumber,
            purpose: 'signup'
          })
        });

        if (response.success) {
          setShowSignupOtpField(true);
          toast({
            title: "OTP Sent",
            description: `OTP sent to ${countryCode} ${signupForm.phone}`,
          });
        }
      } catch (error) {
        console.error('Send OTP error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to send OTP. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLogin = async () => {
    if (showOtpField && loginForm.otp.trim()) {
      try {
        setIsLoading(true);
        console.log('Handling login with:', { phone: loginForm.phone, otp: loginForm.otp });
        
        // Use the UserAuthContext login function
        await login(loginForm.phone, loginForm.otp);
        
        console.log('Login successful in Auth component');
        
        // Login successful, user will be redirected by useEffect
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
      } catch (error) {
        console.error('Login error in Auth component:', error);
        toast({
          title: "Login Failed",
          description: error.message || "Failed to login. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else if (!showOtpField) {
      handleSendOtp();
    }
  };

  const handleBackToPhone = () => {
    setShowOtpField(false);
    setLoginForm({ ...loginForm, otp: "" });
  };

  const handleBackToSignupPhone = () => {
    setShowSignupOtpField(false);
    setSignupForm({ ...signupForm, otp: "" });
  };

  const handleSignup = async () => {
    if (showSignupOtpField && signupForm.otp.trim()) {
      try {
        setIsLoading(true);
        // Remove country code and send only the phone number
        const phoneNumber = signupForm.phone.replace(/[^0-9]/g, '');
        
        const response = await apiService.request('/auth/verify-otp', {
          method: 'POST',
          body: JSON.stringify({
            phone: phoneNumber,
            otp: signupForm.otp,
            purpose: 'signup',
            userData: {
              firstName: signupForm.firstName,
              lastName: signupForm.lastName,
              email: signupForm.email,
              password: 'defaultPassword123' // We'll generate a secure password
            }
          })
        });
        
        if (response.success) {
          toast({
            title: "Account Created",
            description: "Account created successfully! Please login with your phone number.",
          });
          
          // Switch to login tab
          setActiveTab('login');
          setShowOtpField(true);
          setLoginForm({ phone: signupForm.phone, otp: '' });
          setShowSignupOtpField(false);
          setSignupForm({ firstName: '', lastName: '', email: '', phone: '', otp: '' });
        }
      } catch (error) {
        console.error('Signup error:', error);
        toast({
          title: "Signup Failed",
          description: error.message || "Failed to create account. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else if (!showSignupOtpField) {
      handleSendSignupOtp();
    }
  };

  const handleResendOtp = async (purpose) => {
    try {
      setIsLoading(true);
      const phone = purpose === 'login' ? loginForm.phone : signupForm.phone;
      if (phone.trim()) {
        // Remove country code and send only the phone number
        const phoneNumber = phone.replace(/[^0-9]/g, '');
        
        const response = await apiService.request('/auth/resend-otp', {
          method: 'POST',
          body: JSON.stringify({ 
            phone: phoneNumber,
            purpose: purpose
          })
        });

        if (response.success) {
          toast({
            title: "OTP Resent",
            description: "OTP resent successfully!",
          });
        }
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to resend OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50">
      <TopNavigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <Card className="w-full max-w-md shadow-lg border border-gray-200">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="flex items-center space-x-2">
                  <img src={busLogo} alt="Bus Logo" className="w-12 h-12 object-contain" />
                  <div className="flex flex-col">
                    <div className="flex items-baseline">
                      <span className="text-xl font-bold text-black">CHALO</span>
                      <span className="text-xl font-bold text-blue-600 ml-1">SAWARI</span>
                    </div>
                    <span className="text-xs text-gray-600">Travel with Confidence</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            

            
            <CardContent className="pt-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                {/* Login Tab */}
                <TabsContent value="login" className="space-y-4">
                  {!showOtpField ? (
                    // Phone Number Input Screen
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Login to get exciting offers</span>
                      </div>

                      {/* Main Question */}
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-800">What's your mobile number?</h2>
                      </div>

                      {/* Mobile Number Input */}
                      <div className="space-y-2">
                        <Label htmlFor="mobileNumber" className="text-sm font-medium">Mobile Number</Label>
                        <div className="flex space-x-2">
                          <Select value={countryCode} onValueChange={setCountryCode}>
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="+91">+91</SelectItem>
                              <SelectItem value="+1">+1</SelectItem>
                              <SelectItem value="+44">+44</SelectItem>
                              <SelectItem value="+61">+61</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            id="mobileNumber"
                            type="tel"
                            placeholder="Mobile number"
                            className="flex-1"
                            value={loginForm.phone}
                            onChange={(e) => setLoginForm({...loginForm, phone: e.target.value})}
                          />
                        </div>
                      </div>

                      {/* Generate OTP Button */}
                      <Button 
                        className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300 h-12 rounded-lg"
                        onClick={handleSendOtp}
                        disabled={!loginForm.phone.trim() || isLoading}
                      >
                        {isLoading ? "Sending..." : "Generate OTP"}
                      </Button>



                      {/* Footer */}
                      <div className="text-center text-xs text-gray-600 space-y-1">
                        <div>By logging in, I agree</div>
                        <div className="space-x-2">
                          <Button variant="link" className="text-xs p-0 h-auto text-blue-600">Terms & Conditions</Button>
                          <Button variant="link" className="text-xs p-0 h-auto text-blue-600">Privacy Policy</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // OTP Input Screen
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 mb-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleBackToPhone}
                            className="p-1 h-auto"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </Button>
                          <Label htmlFor="otp" className="text-base">Enter OTP</Label>
                        </div>
                        <div className="text-sm text-muted-foreground mb-4">
                          We've sent a verification code to {countryCode} {loginForm.phone}
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            id="otp"
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            className="pl-10"
                            value={loginForm.otp}
                            onChange={(e) => setLoginForm({...loginForm, otp: e.target.value})}
                            maxLength={6}
                          />
                        </div>
                        <div className="text-center">
                          <Button 
                            variant="link" 
                            className="text-sm p-0 h-auto"
                            onClick={() => handleResendOtp('login')}
                          >
                            Didn't receive code? Resend
                          </Button>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full bg-blue-600 text-white hover:bg-blue-700"
                        onClick={handleLogin}
                        disabled={isLoading}
                      >
                        {isLoading ? "Verifying..." : "Verify & Sign In"}
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                {/* Sign Up Tab */}
                <TabsContent value="signup" className="space-y-4">
                  {!showSignupOtpField ? (
                    // Signup Form Screen
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Create account to get started</span>
                      </div>

                      {/* Main Question */}
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-800">Create your account</h2>
                      </div>

                      {/* Name Fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                              id="firstName"
                              placeholder="First name"
                              className="pl-10"
                              value={signupForm.firstName}
                              onChange={(e) => setSignupForm({...signupForm, firstName: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                              id="lastName"
                              placeholder="Last name"
                              className="pl-10"
                              value={signupForm.lastName}
                              onChange={(e) => setSignupForm({...signupForm, lastName: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Email Input */}
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email (Optional)</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="Email address"
                            className="pl-10"
                            value={signupForm.email || ''}
                            onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                          />
                        </div>
                      </div>

                      {/* Mobile Number Input */}
                      <div className="space-y-2">
                        <Label htmlFor="signupMobileNumber" className="text-sm font-medium">Mobile Number</Label>
                        <div className="flex space-x-2">
                          <Select value={countryCode} onValueChange={setCountryCode}>
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="+91">+91</SelectItem>
                              <SelectItem value="+1">+1</SelectItem>
                              <SelectItem value="+44">+44</SelectItem>
                              <SelectItem value="+61">+61</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            id="signupMobileNumber"
                            type="tel"
                            placeholder="Mobile number"
                            className="flex-1"
                            value={signupForm.phone}
                            onChange={(e) => setSignupForm({...signupForm, phone: e.target.value})}
                          />
                        </div>
                      </div>

                      {/* Generate OTP Button */}
                      <Button 
                        className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300 h-12 rounded-lg"
                        onClick={handleSendSignupOtp}
                        disabled={!signupForm.phone.trim() || !signupForm.firstName.trim() || !signupForm.lastName.trim() || isLoading}
                      >
                        {isLoading ? "Sending..." : "Generate OTP"}
                      </Button>



                      {/* Footer */}
                      <div className="text-center text-xs text-gray-600 space-y-1">
                        <div>By creating an account, I agree</div>
                        <div className="space-x-2">
                          <Button variant="link" className="text-xs p-0 h-auto text-blue-600">Terms & Conditions</Button>
                          <Button variant="link" className="text-xs p-0 h-auto text-blue-600">Privacy Policy</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Signup OTP Input Screen
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 mb-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleBackToSignupPhone}
                            className="p-1 h-auto"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </Button>
                          <Label htmlFor="signupOtp" className="text-base">Enter OTP</Label>
                        </div>
                        <div className="text-sm text-muted-foreground mb-4">
                          We've sent a verification code to {countryCode} {signupForm.phone}
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            id="signupOtp"
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            className="pl-10"
                            value={signupForm.otp}
                            onChange={(e) => setSignupForm({...signupForm, otp: e.target.value})}
                            maxLength={6}
                          />
                        </div>
                        <div className="text-center">
                          <Button 
                            variant="link" 
                            className="text-sm p-0 h-auto"
                            onClick={() => handleResendOtp('signup')}
                          >
                            Didn't receive code? Resend
                          </Button>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full bg-blue-600 text-white hover:bg-blue-700"
                        onClick={handleSignup}
                        disabled={isLoading}
                      >
                        {isLoading ? "Creating..." : "Verify & Create Account"}
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="mt-6 text-center text-sm text-muted-foreground">
                {activeTab === "login" ? (
                  <>
                    Don't have an account?{" "}
                                         <Button 
                       variant="link" 
                       className="p-0 h-auto text-blue-600"
                       onClick={() => setActiveTab("signup")}
                     >
                       Sign up
                     </Button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                                         <Button 
                       variant="link" 
                       className="p-0 h-auto text-blue-600"
                       onClick={() => setActiveTab("login")}
                     >
                       Sign in
                     </Button>
                  </>
                )}
              </div>
              

            </CardContent>
          </Card>
        </div>
      </div>

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
          <Link to="/auth" className="flex flex-col items-center space-y-1">
            <User className="w-5 h-5 text-primary" />
            <span className="text-xs text-primary font-medium">Account</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth; 