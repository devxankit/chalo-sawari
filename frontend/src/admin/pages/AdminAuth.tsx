import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from '../../hooks/use-toast';
import { adminAuth } from '../../services/adminApi';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const AdminAuth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('signup');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Handle login success: update context so auth state persists across routes
  const handleLoginSuccess = (adminData: any) => {
    if (!adminData?.token) {
      toast({ title: 'Error', description: 'Missing token in response', variant: 'destructive' });
      return;
    }

    // Update context + storage
    login(adminData);

    toast({ title: 'Success!', description: 'Login successful!' });
    navigate('/admin');
  };

  // Check if redirected from protected route
  useEffect(() => {
    if (location.state?.from) {
      setMessage('Please login to access the admin panel.');
      setActiveTab('login');
    }

    // Debug: Check current authentication status
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    console.log('Current admin auth status:', { adminToken: !!adminToken, adminData: !!adminData });
    if (adminToken && adminData) {
      try {
        const parsed = JSON.parse(adminData);
        console.log('Parsed admin data:', parsed);
      } catch (e) {
        console.error('Error parsing admin data:', e);
      }
    }
  }, [location.state]);

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Login form state
  const [loginForm, setLoginForm] = useState({
    phone: '',
    password: ''
  });

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupForm({
      ...signupForm,
      [e.target.name]: e.target.value
    });
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({
      ...loginForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await adminAuth.signup(signupForm.firstName, signupForm.lastName, signupForm.phone, signupForm.password, signupForm.confirmPassword);
      if (response.success && response.token && response.admin) {
        // Create complete admin data object with default values for missing fields
        const adminData = {
          id: response.admin.id,
          firstName: response.admin.firstName,
          lastName: response.admin.lastName,
          phone: response.admin.phone,
          profilePicture: response.admin.profilePicture || undefined,
          isActive: response.admin.isActive !== undefined ? response.admin.isActive : true,
          isVerified: response.admin.isVerified !== undefined ? response.admin.isVerified : true,
          lastLogin: response.admin.lastLogin || undefined,
          lastPasswordChange: response.admin.lastPasswordChange || undefined,
          createdAt: response.admin.createdAt || new Date().toISOString(),
          token: response.token
        };
        
        login(adminData);
        toast({
          title: 'Success!',
          description: 'Admin account created successfully!',
        });
        navigate('/admin');
      } else {
        setMessage(response.message || 'Signup failed');
        toast({ title: 'Error', description: response.message || 'Signup failed', variant: 'destructive' });
      }
    } catch (error: any) {
      setMessage(error?.message || 'Network error. Please try again.');
      toast({ title: 'Error', description: error?.message || 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await adminAuth.login(loginForm.phone, loginForm.password);
      if (response.success && response.token && response.admin) {
        // Create complete admin data object with default values for missing fields
        const adminData = {
          id: response.admin.id,
          firstName: response.admin.firstName,
          lastName: response.admin.lastName,
          phone: response.admin.phone,
          profilePicture: response.admin.profilePicture || undefined,
          isActive: response.admin.isActive !== undefined ? response.admin.isActive : true,
          isVerified: response.admin.isVerified !== undefined ? response.admin.isVerified : true,
          lastLogin: response.admin.lastLogin || undefined,
          lastPasswordChange: response.admin.lastPasswordChange || undefined,
          createdAt: response.admin.createdAt || new Date().toISOString(),
          token: response.token
        };
        
        login(adminData);
        toast({ title: 'Success!', description: 'Login successful!' });
        navigate('/admin');
      } else {
        throw new Error(response.message || 'Login failed - invalid response');
      }
    } catch (error: any) {
      setMessage(error?.message || 'Login failed');
      toast({ title: 'Error', description: error?.message || 'Login failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Admin Panel</CardTitle>
            <CardDescription className="text-gray-600">Manage your ChaloSawari platform</CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="login">Login</TabsTrigger>
              </TabsList>

              {message && (
                <div className={`mb-4 p-3 rounded-md text-sm ${
                  message.includes('successfully') 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>{message}</div>
              )}

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" name="firstName" type="text" value={signupForm.firstName} onChange={handleSignupChange} required className="mt-1" placeholder="John" />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" name="lastName" type="text" value={signupForm.lastName} onChange={handleSignupChange} required className="mt-1" placeholder="Doe" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" type="tel" value={signupForm.phone} onChange={handleSignupChange} required className="mt-1" placeholder="9876543210" pattern="[0-9]{10}" />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" value={signupForm.password} onChange={handleSignupChange} required className="mt-1" placeholder="••••••••" minLength={6} />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" name="confirmPassword" type="password" value={signupForm.confirmPassword} onChange={handleSignupChange} required className="mt-1" placeholder="••••••••" minLength={6} />
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Create Admin Account'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="loginPhone">Phone Number</Label>
                    <Input id="loginPhone" name="phone" type="tel" value={loginForm.phone} onChange={handleLoginChange} required className="mt-1" placeholder="9876543210" pattern="[0-9]{10}" />
                  </div>

                  <div>
                    <Label htmlFor="loginPassword">Password</Label>
                    <Input id="loginPassword" name="password" type="password" value={loginForm.password} onChange={handleLoginChange} required className="mt-1" placeholder="••••••••" />
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                    {loading ? 'Logging In...' : 'Login to Admin Panel'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">Need help? Contact system administrator</p>
              <Button variant="ghost" size="sm" onClick={() => {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminData');
                setMessage('Admin authentication cleared. Please login again.');
                console.log('Admin auth manually cleared');
              }} className="mt-2 text-xs text-gray-500 hover:text-red-600">Clear Admin Auth</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAuth; 