import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/admin/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Users, 
  Search, 
  Filter, 
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
  RefreshCw,
  Shield,
  ShieldOff,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { adminUsers } from "@/services/adminApi";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
  profilePicture?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  totalBookings: number;
  totalSpent: number;
  lastLogin?: string;
  rating: number;
  reviewCount: number;
  wallet: {
    balance: number;
  };
}

interface EditUserForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  isActive: boolean;
  isVerified: boolean;
  totalBookings: number;
  totalSpent: number;
}

const AdminUserManagement = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [deletingUsers, setDeletingUsers] = useState<Set<string>>(new Set());
  const [verifyingUsers, setVerifyingUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState<EditUserForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    isActive: true,
    isVerified: false,
    totalBookings: 0,
    totalSpent: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 0,
    totalDocs: 0
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, statusFilter, verificationFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchUsers();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (verificationFilter !== 'all') {
        params.isVerified = verificationFilter === 'verified';
      }

      const response = await adminUsers.getAll(params);
      
      if (response.success) {
        setUsers(response.data.docs || []);
        setPagination(prev => ({
          ...prev,
          totalPages: response.data.totalPages || 0,
          totalDocs: response.data.totalDocs || 0
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch users');
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      toast({ 
        title: 'Error', 
        description: err.response?.data?.message || err.message || 'Failed to load users.', 
        variant: 'destructive' 
      });
      
      // Set empty state on error
      setUsers([]);
      setPagination(prev => ({
        ...prev,
        totalPages: 0,
        totalDocs: 0
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />;
  };

  const handleStatusChange = async (userId: string, newStatus: boolean) => {
    try {
      setUpdatingUsers(prev => new Set(prev).add(userId));
      const response = await adminUsers.updateStatus(userId, newStatus ? 'active' : 'inactive');
      
      if (response.success) {
        setUsers(prev => prev.map(user => 
          user._id === userId ? { ...user, isActive: newStatus } : user
        ));
        
        const user = users.find(u => u._id === userId);
        const message = newStatus 
          ? `${user?.firstName} ${user?.lastName} has been activated successfully`
          : `${user?.firstName} ${user?.lastName} has been deactivated`;
        
        toast({
          title: newStatus ? "User Activated" : "User Deactivated",
          description: message,
          variant: "default",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || 'Failed to update user status',
        variant: "destructive",
      });
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleUnsuspendUser = (userId: string) => {
    handleStatusChange(userId, true);
  };

  const handleVerificationToggle = async (userId: string) => {
    try {
      setVerifyingUsers(prev => new Set(prev).add(userId));
      const user = users.find(u => u._id === userId);
      if (!user) return;

      const response = await adminUsers.toggleVerification(userId, !user.isVerified);
      
      if (response.success) {
        setUsers(prev => prev.map(user => 
          user._id === userId ? { ...user, isVerified: !user.isVerified } : user
        ));
        
        toast({
          title: "Verification Updated",
          description: `${user.firstName} ${user.lastName} verification status updated`,
          variant: "default",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || 'Failed to update verification status',
        variant: "destructive",
      });
    } finally {
      setVerifyingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(user => user._id === userId);
    if (!userToDelete) return;
    
    try {
      setDeletingUsers(prev => new Set(prev).add(userId));
      const response = await adminUsers.deleteUser(userId);
      
      if (response.success) { 
        setUsers(prev => prev.filter(user => user._id !== userId));
        toast({
          title: "User Deleted",
          description: `${userToDelete.firstName} ${userToDelete.lastName} has been deleted successfully`,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || 'Failed to delete user',
        variant: "destructive",
      });
    } finally {
      setDeletingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleBulkStatusChange = async (newStatus: boolean) => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select users to update",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsBulkUpdating(true);
      const response = await adminUsers.bulkUpdateStatus(
        selectedUsers, 
        newStatus ? 'active' : 'inactive'
      );

      if (response.success) {
        // Update local state
        setUsers(prev => prev.map(user => {
          if (selectedUsers.includes(user._id)) {
            return { ...user, isActive: newStatus };
          }
          return user;
        }));

        setSelectedUsers([]);
        setShowBulkActions(false);

        const message = newStatus 
          ? `${response.data.updatedCount} users have been activated`
          : `${response.data.updatedCount} users have been deactivated`;

        toast({
          title: "Bulk Update Complete",
          description: message,
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || 'Failed to update some users',
        variant: "destructive",
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkUnsuspend = () => {
    const inactiveUsers = selectedUsers.filter(userId => {
      const user = users.find(u => u._id === userId);
      return user && !user.isActive;
    });

    if (inactiveUsers.length === 0) {
      toast({
        title: "No Inactive Users Selected",
        description: "Please select inactive users to activate",
        variant: "destructive",
      });
      return;
    }

    handleBulkStatusChange(true);
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select users to delete",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await adminUsers.bulkDelete(selectedUsers);
      
      if (response.success) {
        setUsers(prev => prev.filter(user => !selectedUsers.includes(user._id)));
        setSelectedUsers([]);
        setShowBulkActions(false);

        toast({
          title: "Bulk Delete Complete",
          description: `${response.data.deletedCount} users have been deleted successfully`,
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || 'Failed to delete some users',
        variant: "destructive",
      });
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(filteredUsers.map(user => user._id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  // Edit user functions
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email || '',
      phone: user.phone,
      city: user.address?.city || '',
      state: user.address?.state || '',
      isActive: user.isActive,
      isVerified: user.isVerified,
      totalBookings: user.totalBookings,
      totalSpent: user.totalSpent
    });
    setShowEditUser(true);
  };

  const handleEditFormChange = (field: keyof EditUserForm, value: any) => {
    setEditUserForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setIsUpdatingUser(true);
      
      const updateData = {
        firstName: editUserForm.firstName,
        lastName: editUserForm.lastName,
        email: editUserForm.email,
        phone: editUserForm.phone,
        address: {
          city: editUserForm.city,
          state: editUserForm.state
        },
        isActive: editUserForm.isActive,
        isVerified: editUserForm.isVerified,
        totalBookings: editUserForm.totalBookings,
        totalSpent: editUserForm.totalSpent
      };

      const response = await adminUsers.updateUser(editingUser._id, updateData);
      
      if (response.success) {
        setUsers(prev => prev.map(user => 
          user._id === editingUser._id 
            ? { ...user, ...updateData }
            : user
        ));
        
        toast({
          title: "User Updated",
          description: `${editUserForm.firstName} ${editUserForm.lastName}'s information has been updated successfully`,
          variant: "default",
        });

        setShowEditUser(false);
        setEditingUser(null);
      }
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingUser(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         user.phone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && user.isActive) ||
                         (statusFilter === "inactive" && !user.isActive);
    const matchesVerification = verificationFilter === "all" || 
                               (verificationFilter === "verified" && user.isVerified) ||
                               (verificationFilter === "unverified" && !user.isVerified);
    
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

  // Calculate real-time stats from current users data
  const calculateStats = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const verifiedUsers = users.filter(u => u.isVerified).length;
    const inactiveUsers = users.filter(u => !u.isActive).length;
    
    return { totalUsers, activeUsers, verifiedUsers, inactiveUsers };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600 text-sm lg:text-base">Manage all registered users on the platform</p>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filters Skeleton */}
        <Card className="mb-6">
          <CardContent className="p-4 lg:p-6">
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="flex gap-3">
                <div className="h-10 bg-gray-200 rounded w-40"></div>
                <div className="h-10 bg-gray-200 rounded w-40"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                    <div className="h-3 bg-gray-200 rounded w-40"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-8 w-20 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600 text-sm lg:text-base">Manage all registered users on the platform</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={async () => {
              setIsRefreshing(true);
              setSearchTerm("");
              setStatusFilter("all");
              setVerificationFilter("all");
              setSelectedUsers([]);
              setPagination(prev => ({ ...prev, page: 1 }));
              await fetchUsers();
              setIsRefreshing(false);
              toast({
                title: "Refreshed",
                description: "Data has been refreshed successfully",
              });
            }}
            disabled={isRefreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">
                  {stats.activeUsers}
                </p>
              </div>
              <UserCheck className="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Verified Users</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">
                  {stats.verifiedUsers}
                </p>
              </div>
              <Shield className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Inactive Users</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">
                  {stats.inactiveUsers}
                </p>
              </div>
              <UserX className="w-6 h-6 lg:w-8 lg:h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <Card className="mb-4 shadow-sm border-0 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedUsers.length} user(s) selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  disabled={isBulkUpdating}
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
                  disabled={isBulkUpdating || selectedUsers.length === 0}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  {isBulkUpdating ? 'Updating...' : 'Activate Selected'}
                </Button>
                <Select 
                  onValueChange={(value) => handleBulkStatusChange(value === 'active')}
                  disabled={isBulkUpdating || selectedUsers.length === 0}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Change Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isBulkUpdating || selectedUsers.length === 0}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isBulkUpdating ? 'Deleting...' : 'Delete Selected'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Bulk Delete Users</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedUsers.length} selected user{selectedUsers.length > 1 ? 's' : ''}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleBulkDelete}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isBulkUpdating}
                      >
                        {isBulkUpdating ? 'Deleting...' : 'Delete Users'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={`Search users by name, email, or phone... ${searchTerm ? `(${filteredUsers.length} results)` : ''}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
                disabled={isLoading || isRefreshing}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading || isRefreshing}
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Active Filters Summary */}
              {(searchTerm || statusFilter !== 'all' || verificationFilter !== 'all') && (
                <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600">
                  <span>Active filters:</span>
                  {searchTerm && (
                    <Badge variant="secondary" className="text-xs">
                      Search: "{searchTerm}"
                    </Badge>
                  )}
                  {statusFilter !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      Status: {statusFilter}
                    </Badge>
                  )}
                  {verificationFilter !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      Verification: {verificationFilter}
                    </Badge>
                  )}
                </div>
              )}
              <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isLoading || isRefreshing}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={verificationFilter} onValueChange={setVerificationFilter} disabled={isLoading || isRefreshing}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={async () => {
                  setIsRefreshing(true);
                  setSearchTerm("");
                  setStatusFilter("all");
                  setVerificationFilter("all");
                  setSelectedUsers([]);
                  setPagination(prev => ({ ...prev, page: 1 }));
                  await fetchUsers();
                  setIsRefreshing(false);
                  toast({
                    title: "Refreshed",
                    description: "Filters have been reset and data refreshed",
                  });
                }}
                disabled={isRefreshing || isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg lg:text-xl">Users ({filteredUsers.length})</CardTitle>
            {filteredUsers.length > 0 && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={selectAllUsers}
                  className="rounded border-gray-300"
                  disabled={isLoading || isRefreshing}
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                    <div className="h-3 bg-gray-200 rounded w-40"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-8 w-20 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user._id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 border rounded-lg hover:bg-gray-50 gap-4">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => toggleUserSelection(user._id)}
                      className="rounded border-gray-300 mt-2"
                      disabled={isLoading || isRefreshing || updatingUsers.has(user._id) || deletingUsers.has(user._id) || verifyingUsers.has(user._id)}
                    />
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarImage src={user.profilePicture} />
                      <AvatarFallback>{`${user.firstName[0]}${user.lastName[0]}`}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{`${user.firstName} ${user.lastName}`}</h3>
                        <div className="flex flex-wrap gap-2">
                          {user.isVerified && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          <Badge className={`${getStatusColor(user.isActive)} text-xs`}>
                            {getStatusIcon(user.isActive)}
                            <span className="ml-1 capitalize">{user.isActive ? 'active' : 'inactive'}</span>
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-600 mt-2 gap-1">
                        {user.email && (
                          <span className="flex items-center">
                            <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </span>
                        )}
                        <span className="flex items-center">
                          <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{user.phone}</span>
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">
                            {user.address?.city && user.address?.state 
                              ? `${user.address.city}, ${user.address.state}`
                              : 'Location not set'
                            }
                          </span>
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs text-gray-500 mt-2 gap-1">
                        <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                        <span>Bookings: {user.totalBookings}</span>
                        <span>Spent: {formatCurrency(user.totalSpent)}</span>
                        <span>Rating: {user.rating.toFixed(1)} ⭐</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end space-x-2 lg:flex-shrink-0">
                    {!user.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnsuspendUser(user._id)}
                        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                        disabled={updatingUsers.has(user._id) || deletingUsers.has(user._id) || verifyingUsers.has(user._id)}
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        {updatingUsers.has(user._id) ? 'Activating...' : 'Activate'}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                      disabled={updatingUsers.has(user._id) || deletingUsers.has(user._id) || verifyingUsers.has(user._id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserDetails(true);
                      }}
                      disabled={updatingUsers.has(user._id) || deletingUsers.has(user._id) || verifyingUsers.has(user._id)}
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
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleVerificationToggle(user._id)}
                          disabled={verifyingUsers.has(user._id)}
                        >
                          {user.isVerified ? (
                            <>
                              <ShieldOff className="w-4 h-4 mr-2" />
                              {verifyingUsers.has(user._id) ? 'Updating...' : 'Remove Verification'}
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4 mr-2" />
                              {verifyingUsers.has(user._id) ? 'Updating...' : 'Verify User'}
                            </>
                          )}
                        </DropdownMenuItem>
                        {!user.isActive ? (
                          <DropdownMenuItem 
                            onClick={() => handleUnsuspendUser(user._id)}
                            disabled={updatingUsers.has(user._id)}
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            {updatingUsers.has(user._id) ? 'Activating...' : 'Activate User'}
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => handleStatusChange(user._id, true)}>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Keep Active
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(user._id, false)}
                              disabled={updatingUsers.has(user._id)}
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              {updatingUsers.has(user._id) ? 'Deactivating...' : 'Deactivate User'}
                            </DropdownMenuItem>
                          </>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()}
                              disabled={deletingUsers.has(user._id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {deletingUsers.has(user._id) ? 'Deleting...' : 'Delete User'}
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.firstName} {user.lastName}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteUser(user._id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deletingUsers.has(user._id)}
                              >
                                {deletingUsers.has(user._id) ? 'Deleting...' : 'Delete User'}
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
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalDocs)} of {pagination.totalDocs} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1 || isLoading || isRefreshing}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages || isLoading || isRefreshing}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Avatar className="w-16 h-16 flex-shrink-0">
                  <AvatarImage src={selectedUser.profilePicture} />
                  <AvatarFallback>{`${selectedUser.firstName[0]}${selectedUser.lastName[0]}`}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold truncate">{`${selectedUser.firstName} ${selectedUser.lastName}`}</h3>
                  <p className="text-gray-600 truncate">{selectedUser.email || 'No email'}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge className={getStatusColor(selectedUser.isActive)}>
                      {getStatusIcon(selectedUser.isActive)}
                      <span className="ml-1 capitalize">{selectedUser.isActive ? 'active' : 'inactive'}</span>
                    </Badge>
                    {selectedUser.isVerified && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900 break-all">{selectedUser.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Location</label>
                  <p className="text-gray-900 break-all">
                    {selectedUser.address?.city && selectedUser.address?.state 
                      ? `${selectedUser.address.city}, ${selectedUser.address.state}`
                      : 'Location not set'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Join Date</label>
                  <p className="text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Login</label>
                  <p className="text-gray-900">
                    {selectedUser.lastLogin 
                      ? new Date(selectedUser.lastLogin).toLocaleString()
                      : 'Never logged in'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Bookings</label>
                  <p className="text-gray-900">{selectedUser.totalBookings}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Spent</label>
                  <p className="text-gray-900">{formatCurrency(selectedUser.totalSpent)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Rating</label>
                  <p className="text-gray-900">{selectedUser.rating.toFixed(1)} ⭐ ({selectedUser.reviewCount} reviews)</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Wallet Balance</label>
                  <p className="text-gray-900">{formatCurrency(selectedUser.wallet.balance)}</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleVerificationToggle(selectedUser._id)}
                  className="flex-1"
                  disabled={verifyingUsers.has(selectedUser._id) || updatingUsers.has(selectedUser._id)}
                >
                  {verifyingUsers.has(selectedUser._id) ? 'Verifying...' : selectedUser.isVerified ? 'Remove Verification' : 'Verify User'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleStatusChange(selectedUser._id, !selectedUser.isActive)}
                  className={`flex-1 ${!selectedUser.isActive ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : ''}`}
                  disabled={updatingUsers.has(selectedUser._id) || verifyingUsers.has(selectedUser._id)}
                >
                  {updatingUsers.has(selectedUser._id) ? 'Updating...' : selectedUser.isActive ? 'Deactivate User' : 'Activate User'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit User Information
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">First Name *</label>
                  <Input
                    placeholder="Enter user's first name"
                    value={editUserForm.firstName}
                    onChange={(e) => handleEditFormChange('firstName', e.target.value)}
                    disabled={isUpdatingUser}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Last Name *</label>
                  <Input
                    placeholder="Enter user's last name"
                    value={editUserForm.lastName}
                    onChange={(e) => handleEditFormChange('lastName', e.target.value)}
                    disabled={isUpdatingUser}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Email Address</label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={editUserForm.email}
                    onChange={(e) => handleEditFormChange('email', e.target.value)}
                    disabled={isUpdatingUser}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Phone Number *</label>
                  <Input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={editUserForm.phone}
                    onChange={(e) => handleEditFormChange('phone', e.target.value)}
                    disabled={isUpdatingUser}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">City</label>
                  <Input
                    placeholder="City"
                    value={editUserForm.city}
                    onChange={(e) => handleEditFormChange('city', e.target.value)}
                    disabled={isUpdatingUser}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">State</label>
                  <Input
                    placeholder="State"
                    value={editUserForm.state}
                    onChange={(e) => handleEditFormChange('state', e.target.value)}
                    disabled={isUpdatingUser}
                  />
                </div>
              </div>
            </div>

            {/* Status and Verification */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Status & Verification</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">User Status *</label>
                  <Select 
                    value={editUserForm.isActive ? 'active' : 'inactive'} 
                    onValueChange={(value: string) => handleEditFormChange('isActive', value === 'active')}
                    disabled={isUpdatingUser}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Verification Status</label>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="isVerified"
                      checked={editUserForm.isVerified}
                      onChange={(e) => handleEditFormChange('isVerified', e.target.checked)}
                      className="rounded border-gray-300"
                      disabled={isUpdatingUser}
                    />
                    <label htmlFor="isVerified" className="text-sm text-gray-700">
                      User is verified
                    </label>
                  </div>
                </div>
              </div>

              {/* Status Summary */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <Badge className={getStatusColor(editUserForm.isActive)}>
                    {getStatusIcon(editUserForm.isActive)}
                    <span className="ml-1 capitalize">{editUserForm.isActive ? 'active' : 'inactive'}</span>
                  </Badge>
                  {editUserForm.isVerified && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Total Bookings</label>
                  <Input
                    type="number"
                    min="0"
                    value={editUserForm.totalBookings}
                    onChange={(e) => handleEditFormChange('totalBookings', parseInt(e.target.value) || 0)}
                    disabled={isUpdatingUser}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Total Spent (₹)</label>
                  <Input
                    type="number"
                    min="0"
                    value={editUserForm.totalSpent}
                    onChange={(e) => handleEditFormChange('totalSpent', parseInt(e.target.value) || 0)}
                    disabled={isUpdatingUser}
                  />
                </div>
              </div>

              {/* Account Summary */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Total Bookings:</span>
                    <span className="font-medium text-blue-900">{editUserForm.totalBookings}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Total Spent:</span>
                    <span className="font-medium text-blue-900">{formatCurrency(editUserForm.totalSpent)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Average per Booking:</span>
                    <span className="font-medium text-blue-900">
                      {editUserForm.totalBookings > 0 
                        ? formatCurrency(editUserForm.totalSpent / editUserForm.totalBookings)
                        : '₹0'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditUser(false);
                setEditingUser(null);
              }}
              disabled={isUpdatingUser}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              className="min-w-[120px]"
              disabled={isUpdatingUser}
            >
              <Edit className="w-4 h-4 mr-2" />
              {isUpdatingUser ? 'Updating...' : 'Update User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUserManagement; 