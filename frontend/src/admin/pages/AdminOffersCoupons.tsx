

import { useState, useEffect } from "react";
import AdminLayout from "@/admin/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Percent, 
  Tag, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Copy,
  Download,
  Upload
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Offer {
  id: string;
  title: string;
  image?: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minAmount?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  usageLimit: number;
  usedCount: number;
  applicableRoutes: string[];
  terms: string;
  createdAt: string;
}

const AdminOffersCoupons = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("offers");
  
  // Offers state
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  
  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form states
  const [offerForm, setOfferForm] = useState({
    title: "",
    image: "",
    validFrom: "",
    validUntil: "",
    isActive: true
  });

  const [couponForm, setCouponForm] = useState({
    code: "",
    title: "",
    description: "",
    discountType: "percentage" as 'percentage' | 'fixed',
    discountValue: 0,
    minAmount: 0,
    maxDiscount: 0,
    validFrom: "",
    validUntil: "",
    isActive: true,
    usageLimit: 100,
    applicableRoutes: [] as string[],
    terms: ""
  });

  // Sample data
  const sampleOffers: Offer[] = [
    {
      id: "1",
      title: "First Trip Discount",
      image: "/public/placeholder.svg",
      validFrom: "2024-01-01",
      validUntil: "2024-12-31",
      isActive: true,
      createdAt: "2024-01-01"
    },
    {
      id: "2",
      title: "Weekend Special",
      image: "/public/placeholder.svg",
      validFrom: "2024-01-01",
      validUntil: "2024-12-31",
      isActive: true,
      createdAt: "2024-01-01"
    }
  ];

  const sampleCoupons: Coupon[] = [
    {
      id: "1",
      code: "WELCOME20",
      title: "Welcome Discount",
      description: "20% off for new users",
      discountType: "percentage",
      discountValue: 20,
      minAmount: 500,
      maxDiscount: 1000,
      validFrom: "2024-01-01",
      validUntil: "2024-12-31",
      isActive: true,
      usageLimit: 1000,
      usedCount: 156,
      applicableRoutes: ["All Routes"],
      terms: "One-time use per user",
      createdAt: "2024-01-01"
    },
    {
      id: "2",
      code: "SAVE50",
      title: "Fixed Discount",
      description: "Flat ₹50 off on bookings above ₹500",
      discountType: "fixed",
      discountValue: 50,
      minAmount: 500,
      maxDiscount: 50,
      validFrom: "2024-01-01",
      validUntil: "2024-12-31",
      isActive: true,
      usageLimit: 500,
      usedCount: 78,
      applicableRoutes: ["Delhi-Mumbai", "Mumbai-Bangalore"],
      terms: "Minimum booking amount ₹500",
      createdAt: "2024-01-01"
    }
  ];

  useEffect(() => {
    const initializeAdminModule = async () => {
      try {
        setIsLoggedIn(true);
        setOffers(sampleOffers);
        setCoupons(sampleCoupons);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAdminModule();
  }, []);

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingOffer) {
      // Update existing offer
      setOffers(offers.map(offer => 
        offer.id === editingOffer.id 
          ? { ...offer, ...offerForm }
          : offer
      ));
      toast({
        title: "Offer Updated",
        description: "Offer has been updated successfully.",
      });
    } else {
      // Create new offer
      const newOffer: Offer = {
        id: Date.now().toString(),
        ...offerForm,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setOffers([...offers, newOffer]);
      toast({
        title: "Offer Created",
        description: "New offer has been created successfully.",
      });
    }
    
    resetOfferForm();
    setIsOfferDialogOpen(false);
  };

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCoupon) {
      // Update existing coupon
      setCoupons(coupons.map(coupon => 
        coupon.id === editingCoupon.id 
          ? { ...coupon, ...couponForm }
          : coupon
      ));
      toast({
        title: "Coupon Updated",
        description: "Coupon has been updated successfully.",
      });
    } else {
      // Create new coupon
      const newCoupon: Coupon = {
        id: Date.now().toString(),
        ...couponForm,
        usedCount: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setCoupons([...coupons, newCoupon]);
      toast({
        title: "Coupon Created",
        description: "New coupon has been created successfully.",
      });
    }
    
    resetCouponForm();
    setIsCouponDialogOpen(false);
  };

  const resetOfferForm = () => {
    setOfferForm({
      title: "",
      image: "",
      validFrom: "",
      validUntil: "",
      isActive: true
    });
    setEditingOffer(null);
  };

  const resetCouponForm = () => {
    setCouponForm({
      code: "",
      title: "",
      description: "",
      discountType: "percentage",
      discountValue: 0,
      minAmount: 0,
      maxDiscount: 0,
      validFrom: "",
      validUntil: "",
      isActive: true,
      usageLimit: 100,
      applicableRoutes: [],
      terms: ""
    });
    setEditingCoupon(null);
  };

  const editOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setOfferForm({
      title: offer.title,
      image: offer.image || "",
      validFrom: offer.validFrom,
      validUntil: offer.validUntil,
      isActive: offer.isActive
    });
    setIsOfferDialogOpen(true);
  };

  const editCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      title: coupon.title,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minAmount: coupon.minAmount || 0,
      maxDiscount: coupon.maxDiscount || 0,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      isActive: coupon.isActive,
      usageLimit: coupon.usageLimit,
      applicableRoutes: coupon.applicableRoutes,
      terms: coupon.terms
    });
    setIsCouponDialogOpen(true);
  };

  const deleteOffer = (id: string) => {
    setOffers(offers.filter(offer => offer.id !== id));
    toast({
      title: "Offer Deleted",
      description: "Offer has been deleted successfully.",
    });
  };

  const deleteCoupon = (id: string) => {
    setCoupons(coupons.filter(coupon => coupon.id !== id));
    toast({
      title: "Coupon Deleted",
      description: "Coupon has been deleted successfully.",
    });
  };

  const toggleOfferStatus = (id: string) => {
    setOffers(offers.map(offer => 
      offer.id === id 
        ? { ...offer, isActive: !offer.isActive }
        : offer
    ));
  };

  const toggleCouponStatus = (id: string) => {
    setCoupons(coupons.map(coupon => 
      coupon.id === id 
        ? { ...coupon, isActive: !coupon.isActive }
        : coupon
    ));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard.",
    });
  };

  const getStatusBadge = (isActive: boolean, validUntil: string) => {
    const isExpired = new Date(validUntil) < new Date();
    
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  // ProtectedAdminRoute handles auth; render page content

  return (
    <AdminLayout>
      <div className="space-y-6">
                 {/* Header */}
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
           <div>
             <h1 className="text-3xl font-bold tracking-tight">Offers & Coupons</h1>
             <p className="text-muted-foreground">
               Manage promotional offers and discount coupons for your users
             </p>
           </div>
         </div>

                                   {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm font-medium truncate">Total Offers</p>
                    <p className="text-xl md:text-2xl font-bold">{offers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center space-x-2">
                  <Percent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm font-medium truncate">Active Offers</p>
                    <p className="text-xl md:text-2xl font-bold">{offers.filter(o => o.isActive).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-2 md:col-span-1">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm font-medium truncate">Total Coupons</p>
                    <p className="text-xl md:text-2xl font-bold">{coupons.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="offers">Offers</TabsTrigger>
            <TabsTrigger value="coupons">Coupons</TabsTrigger>
          </TabsList>

                     {/* Offers Tab */}
           <TabsContent value="offers" className="space-y-4">
                           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h2 className="text-lg md:text-xl font-semibold">Manage Offers</h2>
                <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => resetOfferForm()} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Offer
                    </Button>
                  </DialogTrigger>
                 <DialogContent className="max-w-md">
                   <DialogHeader>
                     <DialogTitle>
                       {editingOffer ? "Edit Offer" : "Create New Offer"}
                     </DialogTitle>
                   </DialogHeader>
                   <form onSubmit={handleOfferSubmit} className="space-y-4">
                     <div className="space-y-2">
                       <Label htmlFor="title">Title</Label>
                       <Input
                         id="title"
                         value={offerForm.title}
                         onChange={(e) => setOfferForm({...offerForm, title: e.target.value})}
                         placeholder="Enter offer title"
                         required
                       />
                     </div>

                     <div className="space-y-2">
                       <Label htmlFor="image">Offer Image</Label>
                       <Input
                         id="image"
                         type="file"
                         accept="image/*"
                         onChange={(e) => {
                           const file = e.target.files?.[0];
                           if (file) {
                             const reader = new FileReader();
                             reader.onload = (e) => {
                               setOfferForm({...offerForm, image: e.target?.result as string});
                             };
                             reader.readAsDataURL(file);
                           }
                         }}
                       />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <Label htmlFor="validFrom">Valid From</Label>
                         <Input
                           id="validFrom"
                           type="date"
                           value={offerForm.validFrom}
                           onChange={(e) => setOfferForm({...offerForm, validFrom: e.target.value})}
                           required
                         />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="validUntil">Valid Until</Label>
                         <Input
                           id="validUntil"
                           type="date"
                           value={offerForm.validUntil}
                           onChange={(e) => setOfferForm({...offerForm, validUntil: e.target.value})}
                           required
                         />
                       </div>
                     </div>

                     <div className="space-y-2">
                       <Label htmlFor="isActive">Status</Label>
                       <Select
                         value={offerForm.isActive ? "active" : "inactive"}
                         onValueChange={(value) => 
                           setOfferForm({...offerForm, isActive: value === "active"})
                         }
                       >
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="active">Active</SelectItem>
                           <SelectItem value="inactive">Inactive</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>

                     <div className="flex justify-end gap-2">
                       <Button type="button" variant="outline" onClick={() => setIsOfferDialogOpen(false)}>
                         Cancel
                       </Button>
                       <Button type="submit">
                         {editingOffer ? "Update Offer" : "Create Offer"}
                       </Button>
                     </div>
                   </form>
                 </DialogContent>
               </Dialog>
             </div>

                                                       {/* Offers List */}
               <div className="grid gap-4 md:gap-6">
                 {offers.map((offer) => (
                   <Card key={offer.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                     {/* Mobile Layout */}
                     <div className="md:hidden">
                       {/* Image Section - Mobile */}
                       <div className="w-full h-48 bg-gray-100">
                         {offer.image ? (
                           <img 
                             src={offer.image} 
                             alt={offer.title}
                             className="w-full h-full object-cover"
                           />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                             <Tag className="h-12 w-12 text-gray-400" />
                           </div>
                         )}
                       </div>
                       
                       {/* Content Section - Mobile */}
                       <div className="p-4">
                         <div className="flex items-start justify-between mb-3">
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 mb-2">
                               <h3 className="text-lg font-semibold text-gray-900 truncate">{offer.title}</h3>
                               {getStatusBadge(offer.isActive, offer.validUntil)}
                             </div>
                             
                             <div className="space-y-2 text-sm text-gray-600">
                               <div className="flex items-center gap-2">
                                 <Calendar className="h-4 w-4 flex-shrink-0" />
                                 <span className="truncate">From: {new Date(offer.validFrom).toLocaleDateString()}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                 <Calendar className="h-4 w-4 flex-shrink-0" />
                                 <span className="truncate">Until: {new Date(offer.validUntil).toLocaleDateString()}</span>
                               </div>
                             </div>
                           </div>
                         </div>
                         
                         {/* Action Buttons - Mobile */}
                         <div className="flex gap-2 pt-3 border-t">
                           <Button
                             variant={offer.isActive ? "destructive" : "default"}
                             size="sm"
                             onClick={() => toggleOfferStatus(offer.id)}
                             className="flex-1"
                           >
                             {offer.isActive ? "Deactivate" : "Activate"}
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => editOffer(offer)}
                           >
                             <Edit className="h-4 w-4" />
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => deleteOffer(offer.id)}
                             className="text-red-600 hover:text-red-700 hover:bg-red-50"
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </div>
                       </div>
                     </div>
                     
                     {/* Desktop Layout */}
                     <div className="hidden md:flex">
                       {/* Image Section - Desktop */}
                       <div className="w-48 h-32 bg-gray-100 flex-shrink-0">
                         {offer.image ? (
                           <img 
                             src={offer.image} 
                             alt={offer.title}
                             className="w-full h-full object-cover"
                           />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                             <Tag className="h-8 w-8 text-gray-400" />
                           </div>
                         )}
                       </div>
                       
                       {/* Content Section - Desktop */}
                       <div className="flex-1 p-6">
                         <div className="flex items-start justify-between mb-4">
                           <div className="flex-1">
                             <div className="flex items-center gap-3 mb-2">
                               <h3 className="text-xl font-semibold text-gray-900">{offer.title}</h3>
                               {getStatusBadge(offer.isActive, offer.validUntil)}
                             </div>
                             
                             <div className="flex items-center gap-6 text-sm text-gray-600">
                               <div className="flex items-center gap-2">
                                 <Calendar className="h-4 w-4" />
                                 <span>From: {new Date(offer.validFrom).toLocaleDateString()}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                 <Calendar className="h-4 w-4" />
                                 <span>Until: {new Date(offer.validUntil).toLocaleDateString()}</span>
                               </div>
                             </div>
                           </div>
                           
                           <div className="flex gap-2">
                             <Button
                               variant={offer.isActive ? "destructive" : "default"}
                               size="sm"
                               onClick={() => toggleOfferStatus(offer.id)}
                               className="min-w-[100px]"
                             >
                               {offer.isActive ? "Deactivate" : "Activate"}
                             </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => editOffer(offer)}
                             >
                               <Edit className="h-4 w-4" />
                             </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => deleteOffer(offer.id)}
                               className="text-red-600 hover:text-red-700 hover:bg-red-50"
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </div>
                         </div>
                       </div>
                     </div>
                   </Card>
                 ))}
                 
                 {offers.length === 0 && (
                   <Card className="p-6 md:p-12">
                     <div className="text-center">
                       <Tag className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-4" />
                       <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No offers yet</h3>
                       <p className="text-sm md:text-base text-gray-500 mb-4">Create your first offer to get started</p>
                       <Button onClick={() => resetOfferForm()} className="w-full md:w-auto">
                         <Plus className="h-4 w-4 mr-2" />
                         Create First Offer
                       </Button>
                     </div>
                   </Card>
                 )}
               </div>
           </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Manage Coupons</h2>
              <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetCouponForm()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Coupon
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCouponSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="code">Coupon Code</Label>
                        <div className="flex gap-2">
                          <Input
                            id="code"
                            value={couponForm.code}
                            onChange={(e) => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                            placeholder="WELCOME20"
                            required
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCouponForm({...couponForm, code: generateCouponCode()})}
                          >
                            Generate
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discountType">Discount Type</Label>
                        <Select
                          value={couponForm.discountType}
                          onValueChange={(value: 'percentage' | 'fixed') => 
                            setCouponForm({...couponForm, discountType: value})
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={couponForm.title}
                          onChange={(e) => setCouponForm({...couponForm, title: e.target.value})}
                          placeholder="Enter coupon title"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discountValue">
                          {couponForm.discountType === 'percentage' ? 'Discount %' : 'Discount Amount'}
                        </Label>
                        <Input
                          id="discountValue"
                          type="number"
                          value={couponForm.discountValue}
                          onChange={(e) => setCouponForm({...couponForm, discountValue: Number(e.target.value)})}
                          placeholder={couponForm.discountType === 'percentage' ? '20' : '100'}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={couponForm.description}
                        onChange={(e) => setCouponForm({...couponForm, description: e.target.value})}
                        placeholder="Enter coupon description"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minAmount">Minimum Amount</Label>
                        <Input
                          id="minAmount"
                          type="number"
                          value={couponForm.minAmount}
                          onChange={(e) => setCouponForm({...couponForm, minAmount: Number(e.target.value)})}
                          placeholder="500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxDiscount">Max Discount</Label>
                        <Input
                          id="maxDiscount"
                          type="number"
                          value={couponForm.maxDiscount}
                          onChange={(e) => setCouponForm({...couponForm, maxDiscount: Number(e.target.value)})}
                          placeholder="1000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="usageLimit">Usage Limit</Label>
                        <Input
                          id="usageLimit"
                          type="number"
                          value={couponForm.usageLimit}
                          onChange={(e) => setCouponForm({...couponForm, usageLimit: Number(e.target.value)})}
                          placeholder="1000"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="validFrom">Valid From</Label>
                        <Input
                          id="validFrom"
                          type="date"
                          value={couponForm.validFrom}
                          onChange={(e) => setCouponForm({...couponForm, validFrom: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="validUntil">Valid Until</Label>
                        <Input
                          id="validUntil"
                          type="date"
                          value={couponForm.validUntil}
                          onChange={(e) => setCouponForm({...couponForm, validUntil: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="isActive">Status</Label>
                      <Select
                        value={couponForm.isActive ? "active" : "inactive"}
                        onValueChange={(value) => 
                          setCouponForm({...couponForm, isActive: value === "active"})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="terms">Terms & Conditions</Label>
                      <Textarea
                        id="terms"
                        value={couponForm.terms}
                        onChange={(e) => setCouponForm({...couponForm, terms: e.target.value})}
                        placeholder="Enter terms and conditions"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCouponDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingCoupon ? "Update Coupon" : "Create Coupon"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Coupons List */}
            <div className="grid gap-4">
              {coupons.map((coupon) => (
                <Card key={coupon.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{coupon.title}</h3>
                          {getStatusBadge(coupon.isActive, coupon.validUntil)}
                        </div>
                        <p className="text-muted-foreground mb-3">{coupon.description}</p>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {coupon.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(coupon.code)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Discount:</span>
                            <span className="ml-1">
                              {coupon.discountType === 'percentage' 
                                ? `${coupon.discountValue}%` 
                                : `₹${coupon.discountValue}`
                              }
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Min Amount:</span>
                            <span className="ml-1">₹{coupon.minAmount}</span>
                          </div>
                          <div>
                            <span className="font-medium">Usage:</span>
                            <span className="ml-1">{coupon.usedCount}/{coupon.usageLimit}</span>
                          </div>
                          <div>
                            <span className="font-medium">Valid Until:</span>
                            <span className="ml-1">{new Date(coupon.validUntil).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCouponStatus(coupon.id)}
                        >
                          {coupon.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editCoupon(coupon)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteCoupon(coupon.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminOffersCoupons;
