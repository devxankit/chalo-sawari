import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Lock, Phone, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DriverTopNavigation from "../components/DriverTopNavigation";
import busLogo from "@/assets/BusLogo.png";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDriverAuth } from "@/contexts/DriverAuthContext";

const DriverAuth = () => {
  const navigate = useNavigate();
  const { login } = useDriverAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Form states
  const [loginForm, setLoginForm] = useState({
    phone: "",
    password: ""
  });

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!loginForm.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (loginForm.phone.replace(/\D/g, '').length !== 10) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }
    
    if (!loginForm.password.trim()) {
      newErrors.password = "Password is required";
    } else if (loginForm.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      // Send only the 10-digit phone number (remove country code)
      const phoneNumber = loginForm.phone.replace(/\D/g, '').slice(-10);
      await login(phoneNumber, loginForm.password);
      
      toast({
        title: "Login Successful!",
        description: "Welcome to your driver dashboard.",
        variant: "default",
      });
      
      navigate('/driver');
    } catch (error: any) {
      const errorMessage = error.message || "Login failed. Please check your credentials.";
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50">
      <DriverTopNavigation />
      
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
                    <span className="text-xs text-gray-600"> Owner Driver Module</span>
                  </div>
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">Driver Login</CardTitle>
              <CardDescription>Access your Dashboard with Admin-assigned credentials</CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-6">
                {/* Mobile Number Input */}
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber" className="text-sm font-medium">Mobile Number *</Label>
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
                      placeholder="Enter your phone number"
                      className={`flex-1 ${errors.phone ? 'border-red-500' : ''}`}
                      value={loginForm.phone}
                      onChange={(e) => {
                        setLoginForm({...loginForm, phone: e.target.value});
                        if (errors.phone) setErrors({...errors, phone: ''});
                      }}
                    />
                  </div>
                  {errors.phone && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.phone}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                      value={loginForm.password}
                      onChange={(e) => {
                        setLoginForm({...loginForm, password: e.target.value});
                        if (errors.password) setErrors({...errors, password: ''});
                      }}
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
                  {errors.password && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.password}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Login Button */}
                <Button 
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 h-12 rounded-lg"
                  onClick={handleLogin}
                  disabled={isLoading || !loginForm.phone.trim() || !loginForm.password.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                {/* Info Text */}
                <div className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <p>Use the credentials assigned by your admin to login.</p>
                  <p className="text-xs mt-1">Contact your admin if you need login credentials.</p>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-600 space-y-1">
                  <div>By logging in, I agree to</div>
                  <div className="space-x-2">
                    <Button variant="link" className="text-xs p-0 h-auto text-blue-600">Terms & Conditions</Button>
                    <Button variant="link" className="text-xs p-0 h-auto text-blue-600">Privacy Policy</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DriverAuth; 