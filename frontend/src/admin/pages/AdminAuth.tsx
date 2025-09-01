import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from '../../hooks/use-toast';
import { adminAuth } from '../../services/adminApi';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const AdminAuth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Check if redirected from protected route
  useEffect(() => {
    if (location.state?.from) {
      setMessage('Please login to access the admin panel.');
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

  // Login form state
  const [loginForm, setLoginForm] = useState({
    phone: '',
    password: ''
  });

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({
      ...loginForm,
      [e.target.name]: e.target.value
    });
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
            <CardDescription className="text-gray-600">Login to manage your ChaloSawari platform</CardDescription>
          </CardHeader>
          
          <CardContent>
            {message && (
              <div className={`mb-4 p-3 rounded-md text-sm ${
                message.includes('successfully') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>{message}</div>
            )}

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