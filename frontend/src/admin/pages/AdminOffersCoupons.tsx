

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/admin/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tag, 
  Calendar
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

const AdminOffersCoupons = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAdminAuth();
  
  // Offers state
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  // Form states
  const [offerForm, setOfferForm] = useState({
    title: "",
    image: "",
    validFrom: "",
    validUntil: "",
    isActive: true
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

  useEffect(() => {
    if (isAuthenticated) {
      // Load sample offers when authenticated
      setOffers(sampleOffers);
    }
  }, [isAuthenticated]);

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

  const deleteOffer = (id: string) => {
    setOffers(offers.filter(offer => offer.id !== id));
    toast({
      title: "Offer Deleted",
      description: "Offer has been deleted successfully.",
    });
  };

  const toggleOfferStatus = (id: string) => {
    setOffers(offers.map(offer => 
      offer.id === id 
        ? { ...offer, isActive: !offer.isActive }
        : offer
    ));
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Offers Management</h1>
            <p className="text-muted-foreground">
              Manage promotional offers for your users
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
                <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
                  <p className="text-xs md:text-sm font-medium truncate">Expired Offers</p>
                  <p className="text-xl md:text-2xl font-bold">
                    {offers.filter(o => new Date(o.validUntil) < new Date()).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Offers Section */}
        <div className="space-y-4">
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
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOffersCoupons;