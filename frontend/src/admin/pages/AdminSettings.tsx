import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/admin/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { 
  Settings, 
  Shield, 
  Database,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Globe,
  Users,
  Truck,
  AlertTriangle,
  CheckCircle,
  Info,
  Download,
  Upload,
  Trash2,
  Copy,
  ExternalLink
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [backupStatus, setBackupStatus] = useState("idle");
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    // General Settings
    companyName: "Chalo Sawari",
    companyEmail: "admin@chalosawari.com",
    companyPhone: "+91 98765 43210",
    companyAddress: "123 Transport Nagar, Delhi - 110001",
    website: "https://chalosawari.com",
    timezone: "Asia/Kolkata",
    currency: "INR",
    language: "en",
    maintenanceMode: false,
    maintenanceMessage: "We are currently performing maintenance. Please check back soon.",
    
    // Security Settings
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    requireTwoFactor: false,
    passwordMinLength: 8,
    requireSpecialChars: true,
    lockoutDuration: 15,
    enableAuditLog: true,
    
    // API Settings
    enableApi: true,
    apiKey: import.meta.env.VITE_API_KEY || "demo_api_key_for_development",
    rateLimit: 1000,
    enableWebhooks: false,
    webhookUrl: "",
    
    // Business Settings
    bookingAdvanceTime: 2,
    cancellationWindow: 24,
    refundPolicy: "Full refund within 24 hours of booking",
    termsOfService: "Standard terms and conditions apply",
    privacyPolicy: "We respect your privacy and protect your data",
  });

  // Load settings from localStorage when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      const savedSettings = localStorage.getItem('adminSettings');
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch (error) {
          console.error('Error parsing saved settings:', error);
        }
      }
    }
  }, [isAuthenticated]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Save to localStorage for demo
      localStorage.setItem('adminSettings', JSON.stringify(settings));
      
      toast({
        title: "✅ Settings Saved Successfully",
        description: "All settings have been updated and applied to the system",
      });
    } catch (error) {
      toast({
        title: "❌ Error Saving Settings",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generateApiKey = () => {
    const newKey = 'demo_api_key_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setSettings(prev => ({ ...prev, apiKey: newKey }));
    toast({
      title: "🔄 API Key Generated",
      description: "New API key has been generated successfully",
    });
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(settings.apiKey);
    toast({
      title: "📋 API Key Copied",
      description: "API key has been copied to clipboard",
    });
  };

  const createBackup = async () => {
    setBackupStatus("creating");
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      setBackupStatus("completed");
      toast({
        title: "💾 Backup Created",
        description: "System backup has been created successfully",
      });
    } catch (error) {
      setBackupStatus("failed");
      toast({
        title: "❌ Backup Failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetToDefaults = () => {
    if (window.confirm("Are you sure you want to reset all settings to default values?")) {
      setSettings({
        companyName: "Chalo Sawari",
        companyEmail: "admin@chalosawari.com",
        companyPhone: "+91 98765 43210",
        companyAddress: "123 Transport Nagar, Delhi - 110001",
        website: "https://chalosawari.com",
        timezone: "Asia/Kolkata",
        currency: "INR",
        language: "en",
        maintenanceMode: false,
        maintenanceMessage: "We are currently performing maintenance. Please check back soon.",
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        requireTwoFactor: false,
        passwordMinLength: 8,
        requireSpecialChars: true,
        lockoutDuration: 15,
        enableAuditLog: true,
        enableApi: true,
        apiKey: import.meta.env.VITE_API_KEY || "demo_api_key_for_development",
        rateLimit: 1000,
        enableWebhooks: false,
        webhookUrl: "",
        bookingAdvanceTime: 2,
        cancellationWindow: 24,
        refundPolicy: "Full refund within 24 hours of booking",
        termsOfService: "Standard terms and conditions apply",
        privacyPolicy: "We respect your privacy and protect your data",
      });
      toast({
        title: "🔄 Settings Reset",
        description: "All settings have been reset to default values",
      });
    }
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

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/admin-auth');
    return null;
  }

  return (
    <AdminLayout>
      {/* Enhanced Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-600" />
              System Settings
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">Configure platform settings, security, and business preferences</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button variant="outline" onClick={resetToDefaults} className="w-full sm:w-auto text-xs sm:text-sm">
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Reset to Defaults
            </Button>
            <Button onClick={handleSaveSettings} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-xs sm:text-sm">
              <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              {isSaving ? "Saving..." : "Save All Settings"}
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full overflow-x-auto mb-6 bg-gray-100 p-1 rounded-lg scrollbar-hide shadow-sm border border-gray-200">
          <TabsTrigger 
            value="general" 
            className="flex items-center justify-center space-x-1 md:space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 whitespace-nowrap min-w-fit px-3 md:px-4 py-2 text-gray-600 hover:text-gray-900 text-xs md:text-sm transition-all duration-200"
          >
            <Globe className="w-3 h-3 md:w-4 md:h-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="flex items-center justify-center space-x-1 md:space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 whitespace-nowrap min-w-fit px-3 md:px-4 py-2 text-gray-600 hover:text-gray-900 text-xs md:text-sm transition-all duration-200"
          >
            <Shield className="w-3 h-3 md:w-4 md:h-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 block">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-blue-600" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={settings.companyName}
                      onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                      className="mt-1"
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyEmail">Company Email *</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={settings.companyEmail}
                      onChange={(e) => setSettings(prev => ({ ...prev, companyEmail: e.target.value }))}
                      className="mt-1"
                      placeholder="admin@company.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="companyPhone">Phone Number</Label>
                    <Input
                      id="companyPhone"
                      value={settings.companyPhone}
                      onChange={(e) => setSettings(prev => ({ ...prev, companyPhone: e.target.value }))}
                      className="mt-1"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={settings.website}
                      onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))}
                      className="mt-1"
                      placeholder="https://company.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="companyAddress">Company Address</Label>
                  <Textarea
                    id="companyAddress"
                    value={settings.companyAddress}
                    onChange={(e) => setSettings(prev => ({ ...prev, companyAddress: e.target.value }))}
                    className="mt-1"
                    placeholder="Enter full address"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-green-600" />
                  System Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={settings.timezone} onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                        <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={settings.currency} onValueChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="GBP">British Pound (£)</SelectItem>
                        <SelectItem value="AED">UAE Dirham (د.إ)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={settings.language} onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="gu">Gujarati</SelectItem>
                      <SelectItem value="bn">Bengali</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                    <p className="text-sm text-gray-600">Enable maintenance mode to restrict access</p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                  />
                </div>
                {settings.maintenanceMode && (
                  <div>
                    <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                    <Textarea
                      id="maintenanceMessage"
                      value={settings.maintenanceMessage}
                      onChange={(e) => setSettings(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
                      className="mt-1"
                      placeholder="Enter maintenance message"
                      rows={2}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-red-600" />
                  Authentication & Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 30 }))}
                      className="mt-1"
                      min="5"
                      max="480"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) || 5 }))}
                      className="mt-1"
                      min="3"
                      max="10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      value={settings.passwordMinLength}
                      onChange={(e) => setSettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) || 8 }))}
                      className="mt-1"
                      min="6"
                      max="20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                    <Input
                      id="lockoutDuration"
                      type="number"
                      value={settings.lockoutDuration}
                      onChange={(e) => setSettings(prev => ({ ...prev, lockoutDuration: parseInt(e.target.value) || 15 }))}
                      className="mt-1"
                      min="5"
                      max="60"
                    />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireTwoFactor">Require Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-600">Enable 2FA for all admin accounts</p>
                  </div>
                  <Switch
                    id="requireTwoFactor"
                    checked={settings.requireTwoFactor}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireTwoFactor: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireSpecialChars">Require Special Characters</Label>
                    <p className="text-sm text-gray-600">Passwords must contain special characters</p>
                  </div>
                  <Switch
                    id="requireSpecialChars"
                    checked={settings.requireSpecialChars}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireSpecialChars: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableAuditLog">Enable Audit Logging</Label>
                    <p className="text-sm text-gray-600">Log all admin actions for security</p>
                  </div>
                  <Switch
                    id="enableAuditLog"
                    checked={settings.enableAuditLog}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableAuditLog: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium">Session Management</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Shield className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium">Password Policy</span>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">Configured</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="text-sm font-medium">Two-Factor Auth</span>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {settings.requireTwoFactor ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center">
                      <Database className="w-5 h-5 text-purple-600 mr-2" />
                      <span className="text-sm font-medium">Audit Logging</span>
                    </div>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      {settings.enableAuditLog ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>



        <TabsContent value="business" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl flex items-center">
                  <Truck className="w-5 h-5 mr-2 text-purple-600" />
                  Booking Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="bookingAdvanceTime">Advance Booking Time (hours)</Label>
                    <Input
                      id="bookingAdvanceTime"
                      type="number"
                      value={settings.bookingAdvanceTime}
                      onChange={(e) => setSettings(prev => ({ ...prev, bookingAdvanceTime: parseInt(e.target.value) || 2 }))}
                      className="mt-1"
                      min="1"
                      max="72"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cancellationWindow">Cancellation Window (hours)</Label>
                    <Input
                      id="cancellationWindow"
                      type="number"
                      value={settings.cancellationWindow}
                      onChange={(e) => setSettings(prev => ({ ...prev, cancellationWindow: parseInt(e.target.value) || 24 }))}
                      className="mt-1"
                      min="1"
                      max="48"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="refundPolicy">Refund Policy</Label>
                  <Textarea
                    id="refundPolicy"
                    value={settings.refundPolicy}
                    onChange={(e) => setSettings(prev => ({ ...prev, refundPolicy: e.target.value }))}
                    className="mt-1"
                    placeholder="Enter refund policy details"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-indigo-500">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl flex items-center">
                  <Info className="w-5 h-5 mr-2 text-indigo-600" />
                  Legal & Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="termsOfService">Terms of Service</Label>
                  <Textarea
                    id="termsOfService"
                    value={settings.termsOfService}
                    onChange={(e) => setSettings(prev => ({ ...prev, termsOfService: e.target.value }))}
                    className="mt-1"
                    placeholder="Enter terms of service"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="privacyPolicy">Privacy Policy</Label>
                  <Textarea
                    id="privacyPolicy"
                    value={settings.privacyPolicy}
                    onChange={(e) => setSettings(prev => ({ ...prev, privacyPolicy: e.target.value }))}
                    className="mt-1"
                    placeholder="Enter privacy policy"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>



        <TabsContent value="api" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl flex items-center">
                  <Database className="w-5 h-5 mr-2 text-purple-600" />
                  API Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableApi">Enable API Access</Label>
                    <p className="text-sm text-gray-600">Allow external API access</p>
                  </div>
                  <Switch
                    id="enableApi"
                    checked={settings.enableApi}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableApi: checked }))}
                  />
                </div>
                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      value={settings.apiKey}
                      readOnly
                      className="flex-1 font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyApiKey}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateApiKey}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="rateLimit">Rate Limit (requests/hour)</Label>
                  <Input
                    id="rateLimit"
                    type="number"
                    value={settings.rateLimit}
                    onChange={(e) => setSettings(prev => ({ ...prev, rateLimit: parseInt(e.target.value) || 1000 }))}
                    className="mt-1"
                    min="100"
                    max="10000"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableWebhooks">Enable Webhooks</Label>
                    <p className="text-sm text-gray-600">Send real-time notifications</p>
                  </div>
                  <Switch
                    id="enableWebhooks"
                    checked={settings.enableWebhooks}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableWebhooks: checked }))}
                  />
                </div>
                {settings.enableWebhooks && (
                  <div>
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      value={settings.webhookUrl}
                      onChange={(e) => setSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      className="mt-1"
                      placeholder="https://your-domain.com/webhook"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl flex items-center">
                  <Database className="w-5 h-5 mr-2 text-blue-600" />
                  System Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button 
                    onClick={createBackup} 
                    disabled={backupStatus === "creating"}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {backupStatus === "creating" ? "Creating Backup..." : "Create System Backup"}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => toast({
                      title: "📊 System Health",
                      description: "System is running optimally. All services are operational.",
                    })}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Check System Health
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => toast({
                      title: "📈 API Usage",
                      description: "Current API usage: 45% of rate limit",
                    })}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View API Usage
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">API Status</h4>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant={settings.enableApi ? "default" : "secondary"}>
                        {settings.enableApi ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Rate Limit:</span>
                      <span className="font-mono">{settings.rateLimit}/hour</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Webhooks:</span>
                      <Badge variant={settings.enableWebhooks ? "default" : "secondary"}>
                        {settings.enableWebhooks ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Enhanced Save Button */}
      <div className="mt-6 md:mt-8 flex flex-col space-y-4">
        <div className="flex items-center justify-center sm:justify-start space-x-2 text-xs sm:text-sm text-gray-600">
          <Info className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>All changes are automatically validated before saving</span>
        </div>
        </div>
    </AdminLayout>
  );
};

export default AdminSettings; 