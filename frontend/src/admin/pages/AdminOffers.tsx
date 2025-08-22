

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/admin/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tag, 
  Image as ImageIcon
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { offerApi, type Offer, type OfferStats } from "@/services/offerApi";



const AdminOffers = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAdminAuth();
  
  // Offers state
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [stats, setStats] = useState<OfferStats>({
    totalOffers: 0,
    activeOffers: 0,
    inactiveOffers: 0
  });

  // Form states
  const [offerForm, setOfferForm] = useState({
    title: "",
    image: null as File | null
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadOffers();
      loadStats();
    }
  }, [isAuthenticated]);

  const loadOffers = async () => {
    try {
      setIsLoadingOffers(true);
      const response = await offerApi.getAllOffers();
      if (response.success && Array.isArray(response.data)) {
        setOffers(response.data as Offer[]);
      }
    } catch (error) {
      console.error('Error loading offers:', error);
      toast({
        title: "Error",
        description: "Failed to load offers. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingOffers(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await offerApi.getOfferStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!offerForm.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter an offer title.",
        variant: "destructive"
      });
      return;
    }

    if (!editingOffer && !offerForm.image) {
      toast({
        title: "Error",
        description: "Please select an image for the offer.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingOffer) {
        // Update existing offer
        await offerApi.updateOffer(editingOffer._id, offerForm.title, offerForm.image || undefined);
        toast({
          title: "Success",
          description: "Offer has been updated successfully.",
        });
      } else {
        // Create new offer
        await offerApi.createOffer(offerForm.title, offerForm.image!);
        toast({
          title: "Success",
          description: "New offer has been created successfully.",
        });
      }
      
      resetOfferForm();
      setIsOfferDialogOpen(false);
      loadOffers(); // Reload offers
      loadStats(); // Reload stats
    } catch (error) {
      console.error('Error saving offer:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save offer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetOfferForm = () => {
    setOfferForm({
      title: "",
      image: null
    });
    setImagePreview(null);
    setEditingOffer(null);
  };

  const editOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setOfferForm({
      title: offer.title,
      image: null // Don't pre-fill image when editing
    });
    setImagePreview(offer.image); // Show current image preview
    setIsOfferDialogOpen(true);
  };

  const deleteOffer = async (id: string) => {
    try {
      await offerApi.deleteOffer(id);
      toast({
        title: "Success",
        description: "Offer has been deleted successfully.",
      });
      loadOffers(); // Reload offers
      loadStats(); // Reload stats
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast({
        title: "Error",
        description: "Failed to delete offer. Please try again.",
        variant: "destructive"
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
                    {stats.inactiveOffers}
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
                    
                    {/* Image Preview */}
                    {(imagePreview || offerForm.image) && (
                      <div className="relative">
                        <img
                          src={offerForm.image ? URL.createObjectURL(offerForm.image) : imagePreview}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-md border border-gray-200"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                          onClick={() => {
                            setOfferForm({...offerForm, image: null});
                            setImagePreview(null);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    {/* File Input */}
                    <div className="relative">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setOfferForm({...offerForm, image: file});
                            setImagePreview(null); // Clear old preview when new file is selected
                          }
                        }}
                        className="cursor-pointer"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ImageIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    
                    {/* Drag & Drop Area */}
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-primary/50', 'bg-primary/5');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-primary/50', 'bg-primary/5');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-primary/50', 'bg-primary/5');
                        const files = e.dataTransfer.files;
                        if (files.length > 0) {
                          const file = files[0];
                          if (file.type.startsWith('image/')) {
                            setOfferForm({...offerForm, image: file});
                            setImagePreview(null);
                          } else {
                            toast({
                              title: "Invalid file type",
                              description: "Please select an image file.",
                              variant: "destructive"
                            });
                          }
                        }
                      }}
                      onClick={() => document.getElementById('image')?.click()}
                    >
                      <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-primary">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP up to 5MB</p>
                    </div>
                    
                    {editingOffer && (
                      <p className="text-sm text-muted-foreground">
                        Leave empty to keep the current image
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      Supported formats: JPG, PNG, WebP (Max: 5MB)
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsOfferDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingOffer ? "Updating..." : "Creating..."}
                        </>
                      ) : (
                        editingOffer ? "Update Offer" : "Create Offer"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Offers List */}
          <div className="grid gap-4 md:gap-6">
            {offers.map((offer) => (
              <Card key={offer._id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <p>Created: {new Date(offer.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons - Mobile */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editOffer(offer)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteOffer(offer._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
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
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <p>Created: {new Date(offer.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editOffer(offer)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteOffer(offer._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
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

export default AdminOffers;