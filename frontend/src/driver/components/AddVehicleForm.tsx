import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, X, Loader2, Car, Bus, AlertCircle, MapPin } from "lucide-react";
import { CreateVehicleData, Vehicle, UpdateVehicleData } from "@/services/vehicleApi";
import { getPricingForVehicle, VehiclePricing } from "@/services/vehiclePricingApi";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { LocationSuggestion } from "@/services/googleMapsService";

// Vehicle type configurations
const VEHICLE_CONFIGS = {
  'auto': {
    name: 'Auto',
    icon: '🛺',
    defaultCapacity: 3,
    variants: ['Auto'],
    amenities: ['charging', 'usb', 'gps'],

  },
  'car': {
    name: 'Car',
    icon: '🚗',
    defaultCapacity: 4,
    variants: ['Sedan', 'Hatchback', 'SUV'],
    amenities: ['ac', 'charging', 'usb', 'bluetooth', 'gps'],

  },
  'bus': {
    name: 'Bus',
    icon: '🚌',
    defaultCapacity: 40,
    variants: ['Mini Bus', 'Luxury Bus'],
    amenities: ['ac', 'sleeper', 'charging', 'usb', 'gps', 'camera', 'wifi', 'tv'],

  }
};

interface AddVehicleFormProps {
  mode?: 'create' | 'edit';
  initial?: Partial<CreateVehicleData> & { type?: 'auto' | 'car' | 'bus' };
  existingImages?: { _id: string; url: string; isPrimary?: boolean; caption?: string }[];
  onSubmit: (
    data: CreateVehicleData | UpdateVehicleData,
    newImages: File[],
    deleteImageIds: string[]
  ) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const AddVehicleForm = ({ mode = 'create', initial, existingImages = [], onSubmit, onCancel, isSubmitting }: AddVehicleFormProps) => {
  const [selectedVehicleCategory, setSelectedVehicleCategory] = useState<'auto' | 'car' | 'bus'>(
    (initial?.type as 'auto' | 'car' | 'bus') || 'car'
  );
  const [formData, setFormData] = useState<Partial<CreateVehicleData>>({
    type: (initial?.type as any) || 'car',
    brand: '',
    fuelType: 'petrol',
    seatingCapacity: 4,
    isAc: false,
    isSleeper: false,
    amenities: [],
    registrationNumber: '',
    insuranceNumber: '',
    insuranceExpiryDate: '',
    fitnessNumber: '',
    fitnessExpiryDate: '',
    permitNumber: '',
    permitExpiryDate: '',
    pucNumber: '',
    pucExpiryDate: '',
    // Pricing reference fields
    pricingReference: {
      category: 'car',
      vehicleType: '',
      vehicleModel: ''
    },
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    workingHoursStart: '06:00',
    workingHoursEnd: '22:00',
    operatingCities: [],
    operatingStates: [],
    vehicleLocation: {
      latitude: 0,
      longitude: 0,
      address: '',
      city: '',
      state: ''
    }
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existing, setExisting] = useState<(typeof existingImages[0] & { markDelete?: boolean })[]>(existingImages);
  const [fetchedPricing, setFetchedPricing] = useState<VehiclePricing | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const [oneWayPricing, setOneWayPricing] = useState<VehiclePricing | null>(null);
  const [returnPricing, setReturnPricing] = useState<VehiclePricing | null>(null);
  
  // Vehicle location input state
  const [vehicleLocationInput, setVehicleLocationInput] = useState("");

  // Auto-fetch pricing when vehicle category, type, or model changes
  useEffect(() => {
    const fetchPricing = async () => {
      if (formData.pricingReference?.category && 
          formData.pricingReference?.vehicleType && 
          formData.pricingReference?.vehicleModel) {
        setIsLoadingPricing(true);
        try {
          // Fetch both one-way and return pricing
          const [oneWay, returnTrip] = await Promise.all([
            getPricingForVehicle(
              formData.pricingReference.category,
              formData.pricingReference.vehicleType,
              formData.pricingReference.vehicleModel,
              'one-way'
            ),
            getPricingForVehicle(
              formData.pricingReference.category,
              formData.pricingReference.vehicleType,
              formData.pricingReference.vehicleModel,
              'return'
            )
          ]);
          
          setOneWayPricing(oneWay);
          setReturnPricing(returnTrip);
          setFetchedPricing(oneWay); // Keep for backward compatibility
        } catch (error) {
          console.error('Error fetching pricing:', error);
          setOneWayPricing(null);
          setReturnPricing(null);
          setFetchedPricing(null);
        } finally {
          setIsLoadingPricing(false);
        }
      } else {
        setOneWayPricing(null);
        setReturnPricing(null);
        setFetchedPricing(null);
      }
    };

    fetchPricing();
  }, [formData.pricingReference?.category, formData.pricingReference?.vehicleType, formData.pricingReference?.vehicleModel]);

  const handleFormChange = (field: keyof CreateVehicleData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Helper function to extract seating capacity from vehicle model name
  const extractSeatingCapacity = (modelName: string): number => {
    // Look for patterns like "32-Seater", "40-Seater", "13-Seater", etc.
    const match = modelName.match(/(\d+)-?Seater/i);
    if (match) {
      return parseInt(match[1]);
    }
    
    // Look for patterns like "32 Seater", "40 Seater" (with space)
    const match2 = modelName.match(/(\d+)\s+Seater/i);
    if (match2) {
      return parseInt(match2[1]);
    }
    
    // Look for patterns like "32S", "40S" (abbreviated)
    const match3 = modelName.match(/(\d+)S/i);
    if (match3) {
      return parseInt(match3[1]);
    }
    
    // Default seating capacity based on vehicle category
    return selectedVehicleCategory === 'auto' ? 3 : selectedVehicleCategory === 'car' ? 4 : 40;
  };

  const handlePricingReferenceChange = (field: 'category' | 'vehicleType' | 'vehicleModel', value: string) => {
    setFormData(prev => {
      const newPricingReference = {
        ...prev.pricingReference!,
        [field]: value
      };

      // If vehicleModel is being set, also set the seating capacity and brand (for cars only)
      if (field === 'vehicleModel' && value) {
        const extractedCapacity = extractSeatingCapacity(value);
        const updates: any = {
          ...prev,
          seatingCapacity: extractedCapacity, // Set seating capacity based on model name
          pricingReference: newPricingReference
        };
        
        // Only auto-populate brand for car vehicles, not for buses
        if (selectedVehicleCategory === 'car') {
          updates.brand = value; // Set brand to the selected vehicle model for cars
        }
        
        return updates;
      }

      return {
        ...prev,
        pricingReference: newPricingReference
      };
    });
  };

  // Handle vehicle location selection
  const handleVehicleLocationSelect = async (location: LocationSuggestion) => {
    setVehicleLocationInput(location.description);
    
    try {
      // Import the googleMapsService dynamically to avoid circular dependencies
      const { googleMapsService } = await import('@/services/googleMapsService');
      const placeDetails = await googleMapsService.getPlaceDetails(location.place_id);
      
      if (placeDetails && placeDetails.geometry && placeDetails.geometry.location) {
        const lat = placeDetails.geometry.location.lat();
        const lng = placeDetails.geometry.location.lng();
        
        // Extract city and state from the address components
        let city = '';
        let state = '';
        
        if (placeDetails.address_components) {
          const cityComponent = placeDetails.address_components.find(
            (component: any) => 
              component.types.includes('locality') || 
              component.types.includes('administrative_area_level_2')
          );
          const stateComponent = placeDetails.address_components.find(
            (component: any) => 
              component.types.includes('administrative_area_level_1')
          );
          
          if (cityComponent) city = cityComponent.long_name;
          if (stateComponent) state = stateComponent.long_name;
        }
        
        // Update form data with the selected location
        handleFormChange('vehicleLocation', {
          latitude: lat,
          longitude: lng,
          address: location.description,
          city: city,
          state: state
        });
      }
    } catch (error) {
      console.error('Error getting location details:', error);
      // Fallback: just set the address
      handleFormChange('vehicleLocation', {
        ...formData.vehicleLocation,
        address: location.description
      });
    }
  };

  // Initialize form with initial values for edit
  useEffect(() => {
    if (initial) {
      setFormData(prev => ({
        ...prev,
        ...initial,
        type: initial.type || prev.type,
      }));
      if (initial.type) setSelectedVehicleCategory(initial.type);
      setExisting(existingImages);
      
      // Set vehicle location input for display
      if (initial.vehicleLocation?.address) {
        setVehicleLocationInput(initial.vehicleLocation.address);
      }
      
      // If editing and pricingReference exists, fetch the pricing
      if (mode === 'edit' && initial.pricingReference) {
        fetchPricing(
          initial.pricingReference.category,
          initial.pricingReference.vehicleType,
          initial.pricingReference.vehicleModel
        );
      }
    }
  }, [initial, mode, existingImages]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newImages = [...selectedImages, ...files];
      setSelectedImages(newImages);
      
      // Convert new files to preview URLs
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrls(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };


  // Validate that both one-way and return pricing are available
  const isPricingComplete = () => {
    if (!oneWayPricing || !returnPricing) return false;
    
    if (fetchedPricing?.category === 'auto') {
      return oneWayPricing.autoPrice > 0 && returnPricing.autoPrice > 0;
    } else {
      const oneWayValid = Object.values(oneWayPricing.distancePricing).some(price => price > 0);
      const returnValid = Object.values(returnPricing.distancePricing).some(price => price > 0);
      return oneWayValid && returnValid;
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVehicleCategory) {
      alert('Please select a vehicle category');
      return;
    }

    if (!formData.pricingReference?.vehicleType || !formData.pricingReference?.vehicleModel) {
      const fieldName = selectedVehicleCategory === 'auto' ? 'auto type and fuel type' : 'vehicle type and model';
      alert(`Please select ${fieldName} for pricing`);
      return;
    }

    // Validate vehicle location
    if (!formData.vehicleLocation?.latitude || !formData.vehicleLocation?.longitude || !formData.vehicleLocation?.address) {
      alert('Please provide complete vehicle location information (latitude, longitude, and address)');
      return;
    }

    // Check if pricing is complete
    if (!isPricingComplete()) {
      alert('Both one-way and return trip pricing must be available to add this vehicle. Please contact admin if pricing is incomplete.');
      return;
    }

    const submitData: CreateVehicleData = {
      // Ensure backend-compliant type string - updated interface
      type: selectedVehicleCategory as 'auto' | 'car' | 'bus',
      brand: formData.brand || '',
      fuelType: formData.fuelType || 'petrol',
      seatingCapacity: formData.seatingCapacity || 4,
      isAc: formData.isAc || false,
      isSleeper: formData.isSleeper || false,
      amenities: formData.amenities || [],
      registrationNumber: formData.registrationNumber || '',
      insuranceNumber: formData.insuranceNumber ? formData.insuranceNumber : undefined,
      insuranceExpiryDate: formData.insuranceExpiryDate ? formData.insuranceExpiryDate : undefined,
      fitnessNumber: formData.fitnessNumber ? formData.fitnessNumber : undefined,
      fitnessExpiryDate: formData.fitnessExpiryDate ? formData.fitnessExpiryDate : undefined,
      permitNumber: formData.permitNumber ? formData.permitNumber : undefined,
      permitExpiryDate: formData.permitExpiryDate ? formData.permitExpiryDate : undefined,
      pucNumber: formData.pucNumber ? formData.pucNumber : undefined,
      pucExpiryDate: formData.pucExpiryDate ? formData.pucExpiryDate : undefined,
      pricingReference: {
        category: selectedVehicleCategory,
        vehicleType: formData.pricingReference?.vehicleType || '',
        vehicleModel: formData.pricingReference?.vehicleModel || ''
      },
      vehicleLocation: {
        latitude: formData.vehicleLocation?.latitude || 0,
        longitude: formData.vehicleLocation?.longitude || 0,
        address: formData.vehicleLocation?.address || '',
        city: formData.vehicleLocation?.city || '',
        state: formData.vehicleLocation?.state || ''
      },
      workingDays: formData.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      workingHoursStart: formData.workingHoursStart || '06:00',
      workingHoursEnd: formData.workingHoursEnd || '22:00',
      operatingCities: formData.operatingCities || [],
      operatingStates: formData.operatingStates || []
    };
    const deleteIds = existing.filter(e => e.markDelete).map(e => e._id);
    onSubmit(
      mode === 'edit' ? (submitData as unknown as UpdateVehicleData) : submitData,
      selectedImages,
      deleteIds
    );
  };

  const handleCategorySelect = (category: 'auto' | 'car' | 'bus') => {
    setSelectedVehicleCategory(category);
    const config = VEHICLE_CONFIGS[category];
    
    // Set default values based on vehicle type
    setFormData(prev => ({
      ...prev,
      // Always set API type to the selected category (not variant)
      type: category,
      seatingCapacity: config.defaultCapacity,
      // Don't automatically set amenities - let user choose features manually
      amenities: [],
      pricingReference: {
        ...prev.pricingReference!,
        category: category,
        vehicleType: '',
        vehicleModel: ''
      }
    }));
    
    // Clear fetched pricing when category changes
    setFetchedPricing(null);
  };
  
  // Function to fetch pricing when vehicle type and model are selected
  const fetchPricing = async (category: string, vehicleType: string, vehicleModel: string) => {
    if (!category || !vehicleType || !vehicleModel) {
      setFetchedPricing(null);
      return;
    }
    
    try {
      setIsLoadingPricing(true);
      const pricing = await getPricingForVehicle(
        category as 'auto' | 'car' | 'bus',
        vehicleType,
        vehicleModel
      );
      setFetchedPricing(pricing);
    } catch (error) {
      console.error('Error fetching pricing:', error);
      setFetchedPricing(null);
    } finally {
      setIsLoadingPricing(false);
    }
  };

  // Dynamic vehicle configurations based on category
  const getVehicleOptions = (category: 'auto' | 'car' | 'bus') => {
    switch (category) {
      case 'auto':
        return {
          variants: ['Auto'],
          fuelTypes: ['CNG', 'Electric', 'Diesel'],
          models: ['Petrol', 'CNG'] // Match the active pricing in database
        };
      case 'car':
        return {
          variants: ['Sedan', 'Hatchback', 'SUV'],
          fuelTypes: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'],
          models: {
            'Sedan': ['Honda Amaze', 'Swift Dzire', 'Honda City', 'Suzuki Ciaz','Hyundai Aura','Verna','Tata Tigor','Skoda Slavia' ],
            'Hatchback': ['Baleno','Hundai i20','Renault Kwid Toyota Glanza','Alto K10','Calerio Maruti','Ignis Maruti','Swift Vxi,Lxi,Vdi', 'WagonR', 'Polo', 'Tata Altroz','Tata Tiago'],
            'SUV': ['Hundai Extor','Grand Vitara Brezza Suzuki','Suzuki Vitara Brezza','XUV 3x0','XUV 700','Tata Punch','Kia Seltos','Tata Harrier','Tata Nexon','Innova Crysta', 'Scorpio N','Scorpio', 'XUV500', 'Nexon EV','Hundai Creta','Hundai Venue','Bolereo Plus','Bolereo','Bolereo Neo','Fronx Maruti Suzuki','Ertiga Maruti Suzuki','XI Maruti Suzuki','Fortuner']
          }
        };
      case 'bus':
        return {
          variants: ['Mini Bus', 'Luxury Bus','Traveller'],
          fuelTypes: ['Diesel','Petrol','Electric'],
          models: {
            'Mini Bus': ['32-Seater','40-Seater','52-Seater'],
            'Luxury Bus': ['45-Seater'],
            'Traveller': ['13-Seater','17-Seater','26-Seater'],
          }
        };
      default:
        return { variants: [], fuelTypes: [], models: [] };
    }
  };

  // Helper function to get models for a specific vehicle type
  const getModelsForType = (category: 'auto' | 'car' | 'bus', vehicleType: string): string[] => {
    const options = getVehicleOptions(category);
    if ((category === 'car' || category === 'bus') && typeof options.models === 'object') {
      return options.models[vehicleType as keyof typeof options.models] || [];
    }
    return Array.isArray(options.models) ? options.models : [];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Vehicle Category Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">What type of vehicle do you want to add?</Label>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(VEHICLE_CONFIGS).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleCategorySelect(key as 'auto' | 'car' | 'bus')}
              className={`p-4 border-2 rounded-lg text-center transition-all duration-200 ${
                selectedVehicleCategory === key
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-2">{config.icon}</div>
              <div className="font-medium">{config.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Show form only after category selection */}
      {selectedVehicleCategory && (
        <>
          {/* Vehicle Type Selection */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="vehicleType">
                {selectedVehicleCategory === 'auto' ? 'Auto Type' : 'Variant'}
              </Label>
              <Select 
                value={formData.pricingReference?.vehicleType || ''} 
                onValueChange={(value) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    pricingReference: {
                      ...prev.pricingReference!,
                      vehicleType: value,
                      vehicleModel: '' // Reset model when type changes
                    }
                  }));
                  // Fetch pricing when vehicle type changes
                  fetchPricing(selectedVehicleCategory, value, '');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${selectedVehicleCategory === 'auto' ? 'auto type' : 'variant'}`} />
                </SelectTrigger>
                <SelectContent>
                  {getVehicleOptions(selectedVehicleCategory).variants.map((variant) => (
                    <SelectItem key={variant} value={variant}>{variant}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pricing Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pricingVehicleType">
                  {selectedVehicleCategory === 'auto' ? 'Auto Type for Pricing' : 'Vehicle Type for Pricing'}
                </Label>
                <Select 
                  value={formData.pricingReference?.vehicleType || ''} 
                  onValueChange={(value) => handlePricingReferenceChange('vehicleType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${selectedVehicleCategory === 'auto' ? 'auto type' : 'vehicle type'} for pricing`} />
                  </SelectTrigger>
                  <SelectContent>
                    {getVehicleOptions(selectedVehicleCategory).variants.map((variant) => (
                      <SelectItem key={variant} value={variant}>{variant}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="pricingVehicleModel">
                  {selectedVehicleCategory === 'auto' ? 'Fuel Type for Pricing' : 'Vehicle Model for Pricing'}
                </Label>
                <Select 
                  value={formData.pricingReference?.vehicleModel || ''} 
                  onValueChange={(value) => handlePricingReferenceChange('vehicleModel', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${selectedVehicleCategory === 'auto' ? 'fuel type' : 'vehicle model'} for pricing`} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedVehicleCategory === 'auto' ? (
                      // For auto, show fuel types instead of models
                      getVehicleOptions('auto').fuelTypes.map((fuelType) => (
                        <SelectItem key={fuelType} value={fuelType}>{fuelType}</SelectItem>
                      ))
                    ) : formData.pricingReference?.vehicleType && selectedVehicleCategory === 'car' ? (
                      // For car, show models based on selected variant
                      getModelsForType('car', formData.pricingReference.vehicleType).map(model => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))
                    ) : formData.pricingReference?.vehicleType && selectedVehicleCategory === 'bus' ? (
                      // For bus, show models based on selected variant
                      getModelsForType('bus', formData.pricingReference.vehicleType).map(model => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))
                    ) : (
                      // Fallback for auto or when no vehicle type is selected
                      getModelsForType('auto', '').map((model) => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pricing Display - Hidden */}
            {false && formData.pricingReference?.vehicleType && formData.pricingReference?.vehicleModel && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">
                  {selectedVehicleCategory === 'auto' ? 'Auto Pricing Structure' : 'Vehicle Pricing Structure'}
                </h4>
                {isLoadingPricing ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="ml-2 text-blue-600">Loading pricing...</span>
                  </div>
                ) : fetchedPricing ? (
                  <div className="space-y-3">
                    {fetchedPricing.category === 'auto' ? (
                      // For auto, show auto price for both trip types
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Auto Price (One-way):</span>
                          <div className="font-semibold text-blue-600">₹{fetchedPricing.autoPrice}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Auto Price (Return):</span>
                          <div className="font-semibold text-blue-600">₹{returnPricing?.autoPrice || 'N/A'}</div>
                        </div>
                      </div>
                    ) : (
                      // For car and bus, show distance-based pricing for both trip types
                      <div className="space-y-4">
                        {/* One-way Pricing */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">One-way Trip Pricing</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">50km:</span>
                              <div className="font-semibold text-blue-600">₹{fetchedPricing.distancePricing['50km']}/km</div>
                            </div>
                            <div>
                              <span className="text-gray-600">100km:</span>
                              <div className="font-semibold text-blue-600">₹{fetchedPricing.distancePricing['100km']}/km</div>
                            </div>
                            <div>
                              <span className="text-gray-600">150km:</span>
                              <div className="font-semibold text-blue-600">₹{fetchedPricing.distancePricing['150km']}/km</div>
                            </div>
                            <div>
                              <span className="text-gray-600">200km:</span>
                              <div className="font-semibold text-blue-600">₹{fetchedPricing.distancePricing['200km']}/km</div>
                            </div>
                            <div>
                              <span className="text-gray-600">250km:</span>
                              <div className="font-semibold text-blue-600">₹{fetchedPricing.distancePricing['250km']}/km</div>
                            </div>
                            <div>
                              <span className="text-gray-600">300km:</span>
                              <div className="font-semibold text-blue-600">₹{fetchedPricing.distancePricing['300km']}/km</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Return Trip Pricing */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Return Trip Pricing</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">50km:</span>
                              <div className="font-semibold text-blue-600">₹{returnPricing?.distancePricing['50km'] || 'N/A'}/km</div>
                            </div>
                            <div>
                              <span className="text-gray-600">100km:</span>
                              <div className="font-semibold text-blue-600">₹{returnPricing?.distancePricing['100km'] || 'N/A'}/km</div>
                            </div>
                            <div>
                              <span className="text-gray-600">150km:</span>
                              <div className="font-semibold text-blue-600">₹{returnPricing?.distancePricing['150km'] || 'N/A'}/km</div>
                            </div>
                            <div>
                              <span className="text-gray-600">200km:</span>
                              <div className="font-semibold text-blue-600">₹{returnPricing?.distancePricing['200km'] || 'N/A'}/km</div>
                            </div>
                            <div>
                              <span className="text-gray-600">250km:</span>
                              <div className="font-semibold text-blue-600">₹{returnPricing?.distancePricing['250km'] || 'N/A'}/km</div>
                            </div>
                            <div>
                              <span className="text-gray-600">300km:</span>
                              <div className="font-semibold text-blue-600">₹{returnPricing?.distancePricing['300km'] || 'N/A'}/km</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {fetchedPricing.notes && (
                      <div className="text-sm text-gray-600 mt-2">
                        <strong>Notes:</strong> {fetchedPricing.notes}
                      </div>
                    )}
                    <p className="text-xs text-blue-600 mt-2">
                      * {fetchedPricing.category === 'auto' 
                        ? 'Auto pricing is fixed per trip regardless of distance' 
                        : 'Pricing will be automatically applied based on distance and trip type'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="text-amber-600 text-sm">
                    ⚠️ No pricing found for this vehicle configuration. Both one-way and return trip pricing must be set up by admin.
                  </div>
                )}
              </div>
            )}

            {/* Pricing Fields - Read Only - Hidden */}
            {false && fetchedPricing && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <h4 className="font-semibold text-green-800">
                    Vehicle Pricing Details (Auto-populated from Admin Pricing)
                  </h4>
                </div>
                <p className="text-sm text-green-700 mb-4 bg-green-100 p-2 rounded border border-green-200">
                  <strong>ℹ️ Information:</strong> These pricing fields are automatically populated from the admin-defined pricing structure 
                  and cannot be modified by drivers. The pricing will be applied automatically when users book your vehicle.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fetchedPricing.category === 'auto' ? (
                    // Auto Price Fields for both trip types
                    <>
                      <div>
                        <Label htmlFor="autoPriceOneWay" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <span>Auto Price - One-way (₹)</span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Read Only</span>
                        </Label>
                        <Input 
                          id="autoPriceOneWay" 
                          type="number"
                          value={fetchedPricing.autoPrice}
                          readOnly
                          className="bg-gray-100 cursor-not-allowed border-gray-300 text-gray-700"
                          placeholder="Auto-populated"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Fixed price for one-way trips
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="autoPriceReturn" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <span>Auto Price - Return (₹)</span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Read Only</span>
                        </Label>
                        <Input 
                          id="autoPriceReturn" 
                          type="number"
                          value={returnPricing?.autoPrice || 'N/A'}
                          readOnly
                          className="bg-gray-100 cursor-not-allowed border-gray-300 text-gray-700"
                          placeholder="Auto-populated"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Fixed price for return trips
                        </p>
                      </div>
                    </>
                  ) : (
                    // Distance Pricing Fields for Car and Bus - Both trip types
                    <>
                      {/* One-way Trip Pricing */}
                      <div className="col-span-2">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">One-way Trip Pricing</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="distance50kmOneWay" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <span>50km Rate (₹/km)</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Read Only</span>
                            </Label>
                            <Input 
                              id="distance50kmOneWay" 
                              type="number"
                              value={fetchedPricing.distancePricing['50km']}
                              readOnly
                              className="bg-gray-100 cursor-not-allowed border-gray-300 text-gray-700"
                              placeholder="Auto-populated"
                            />
                          </div>
                          <div>
                            <Label htmlFor="distance100kmOneWay" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <span>100km Rate (₹/km)</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Read Only</span>
                            </Label>
                            <Input 
                              id="distance100kmOneWay" 
                              type="number"
                              value={fetchedPricing.distancePricing['100km']}
                              readOnly
                              className="bg-gray-100 cursor-not-allowed border-gray-300 text-gray-700"
                              placeholder="Auto-populated"
                            />
                          </div>
                          <div>
                            <Label htmlFor="distance150kmOneWay" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <span>150km Rate (₹/km)</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Read Only</span>
                            </Label>
                            <Input 
                              id="distance150kmOneWay" 
                              type="number"
                              value={fetchedPricing.distancePricing['150km']}
                              readOnly
                              className="bg-gray-100 cursor-not-allowed border-gray-300 text-gray-700"
                              placeholder="Auto-populated"
                            />
                          </div>
                          <div>
                            <Label htmlFor="distance200kmOneWay" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <span>200km Rate (₹/km)</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Read Only</span>
                            </Label>
                            <Input 
                              id="distance200kmOneWay" 
                              type="number"
                              value={fetchedPricing.distancePricing['200km']}
                              readOnly
                              className="bg-gray-100 cursor-not-allowed border-gray-300 text-gray-700"
                              placeholder="Auto-populated"
                            />
                          </div>
                          <div>
                            <Label htmlFor="distance250kmOneWay" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <span>250km Rate (₹/km)</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Read Only</span>
                            </Label>
                            <Input 
                              id="distance250kmOneWay" 
                              type="number"
                              value={fetchedPricing.distancePricing['250km']}
                              readOnly
                              className="bg-gray-100 cursor-not-allowed border-gray-300 text-gray-700"
                              placeholder="Auto-populated"
                            />
                          </div>
                          <div>
                            <Label htmlFor="distance300kmOneWay" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <span>300km Rate (₹/km)</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Read Only</span>
                            </Label>
                            <Input 
                              id="distance300kmOneWay" 
                              type="number"
                              value={fetchedPricing.distancePricing['300km']}
                              readOnly
                              className="bg-gray-100 cursor-not-allowed border-gray-300 text-gray-700"
                              placeholder="Auto-populated"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Return Trip Pricing */}
                      <div className="col-span-2">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Return Trip Pricing</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="distance50kmReturn" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <span>50km Rate (₹/km)</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Read Only</span>
                            </Label>
                            <Input 
                              id="distance50kmReturn" 
                              type="number"
                              value={returnPricing?.distancePricing['50km'] || 'N/A'}
                              readOnly
                              className="bg-gray-100 cursor-not-allowed border-gray-300 text-gray-700"
                              placeholder="Auto-populated"
                            />
                          </div>
                          <div>
                            <Label htmlFor="distance100kmReturn" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <span>100km Rate (₹/km)</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Read Only</span>
                            </Label>
                            <Input 
                              id="distance100kmReturn" 
                              type="number"
                              value={returnPricing?.distancePricing['100km'] || 'N/A'}
                              readOnly
                              className="bg-gray-100 cursor-not-allowed border-gray-300 text-gray-700"
                              placeholder="Auto-populated"
                            />
                          </div>
                          <div>
                            <Label htmlFor="distance150kmReturn" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <span>150km Rate (₹/km)</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Read Only</span>
                            </Label>
                            <Input 
                              id="distance150kmReturn" 
                              type="number"
                              value={returnPricing?.distancePricing['150km'] || 'N/A'}
                              readOnly
                              className="bg-gray-100 cursor-not-allowed border-gray-300 text-gray-700"
                              placeholder="Auto-populated"
                            />
                          </div>
                          <div>
                            <Label htmlFor="distance200kmReturn" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <span>200km Rate (₹/km)</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Read Only</span>
                            </Label>
                            <Input 
                              id="distance200kmReturn" 
                              type="number"
                              value={returnPricing?.distancePricing['200km'] || 'N/A'}
                              readOnly
                              className="bg-gray-100 cursor-not-allowed border-gray-300 text-gray-700"
                              placeholder="Auto-populated"
                            />
                          </div>
                          <div>
                            <Label htmlFor="distance250kmReturn" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <span>250km Rate (₹/km)</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Read Only</span>
                            </Label>
                            <Input 
                              id="distance250kmReturn" 
                              type="number"
                              value={returnPricing?.distancePricing['250km'] || 'N/A'}
                              readOnly
                              className="bg-gray-100 cursor-not-allowed border-gray-300 text-gray-700"
                              placeholder="Auto-populated"
                            />
                          </div>
                          <div>
                            <Label htmlFor="distance300kmReturn" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <span>300km Rate (₹/km)</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Read Only</span>
                            </Label>
                            <Input 
                              id="distance300kmReturn" 
                              type="number"
                              value={returnPricing?.distancePricing['300km'] || 'N/A'}
                              readOnly
                              className="bg-gray-100 cursor-not-allowed border-gray-300 text-gray-700"
                              placeholder="Auto-populated"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                      i
                    </div>
                    <div>
                      <p className="text-sm text-blue-800 font-medium mb-1">How Pricing Works</p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        {fetchedPricing.category === 'auto' ? (
                          <>
                            <li>• <strong>Auto Pricing:</strong> Fixed fare per trip regardless of distance</li>
                            <li>• <strong>One-way Trip:</strong> Auto price for single journey</li>
                            <li>• <strong>Return Trip:</strong> Separate return trip pricing (may differ from one-way)</li>
                            <li>• <strong>No Distance Factor:</strong> Same price regardless of trip distance</li>
                          </>
                        ) : (
                          <>
                            <li>• <strong>Distance Pricing:</strong> Per-kilometer rate based on trip distance</li>
                            <li>• <strong>One-way Trip:</strong> Standard per-km rates for single journey</li>
                            <li>• <strong>Return Trip:</strong> Separate per-km rates for round trips</li>
                            <li>• <strong>Distance Ranges:</strong> 50km (higher), 100km (medium), 150km (lower) rates</li>
                            <li>• <strong>Total Fare:</strong> Distance × Per-km Rate (based on range and trip type)</li>
                          </>
                        )}
                        <li>• <strong>Dual Pricing System:</strong> Separate pricing for one-way and return trips</li>
                        <li>• <strong>Automatic Calculation:</strong> Fare calculated automatically when users book</li>
                        <li>• <strong>Admin Controlled:</strong> All pricing set by admin, drivers cannot modify</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Basic Vehicle Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Brand *</Label>
              <Input 
                id="brand" 
                placeholder="e.g., Maruti Suzuki, Honda, Volvo"
                value={formData.brand}
                onChange={(e) => handleFormChange('brand', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="seatingCapacity">Seating Capacity *</Label>
              <Input 
                id="seatingCapacity" 
                type="number" 
                min="1"
                max="100"
                placeholder={selectedVehicleCategory === 'auto' ? "e.g., 3" : selectedVehicleCategory === 'car' ? "e.g., 4" : "e.g., 40"}
                value={formData.seatingCapacity}
                onChange={(e) => handleFormChange('seatingCapacity', parseInt(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fuelType">Fuel Type *</Label>
              <Select value={formData.fuelType} onValueChange={(value) => handleFormChange('fuelType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  {getVehicleOptions(selectedVehicleCategory).fuelTypes.map((fuelType) => (
                    <SelectItem key={fuelType.toLowerCase()} value={fuelType.toLowerCase()}>
                      {fuelType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Features - Hidden for Auto */}
          {selectedVehicleCategory !== 'auto' && (
            <div className="space-y-3">
              <Label>Features</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isAc" 
                    checked={formData.isAc}
                    onCheckedChange={(checked) => {
                      handleFormChange('isAc', checked);
                      // Also update amenities
                      const currentAmenities = formData.amenities || [];
                      if (checked) {
                        if (!currentAmenities.includes('ac')) {
                          handleFormChange('amenities', [...currentAmenities, 'ac']);
                        }
                      } else {
                        handleFormChange('amenities', currentAmenities.filter(a => a !== 'ac'));
                      }
                    }}
                  />
                  <Label htmlFor="isAc">AC</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isNonAc" 
                    checked={!formData.isAc}
                    onCheckedChange={(checked) => {
                      handleFormChange('isAc', !checked);
                      // Also update amenities
                      const currentAmenities = formData.amenities || [];
                      if (!checked) {
                        if (!currentAmenities.includes('ac')) {
                          handleFormChange('amenities', [...currentAmenities, 'ac']);
                        }
                      } else {
                        handleFormChange('amenities', currentAmenities.filter(a => a !== 'ac'));
                      }
                    }}
                  />
                  <Label htmlFor="isNonAc">Non-AC</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isSleeper" 
                    checked={formData.isSleeper}
                    onCheckedChange={(checked) => {
                      handleFormChange('isSleeper', checked);
                      // Also update amenities
                      const currentAmenities = formData.amenities || [];
                      if (checked) {
                        if (!currentAmenities.includes('sleeper')) {
                          handleFormChange('amenities', [...currentAmenities, 'sleeper']);
                        }
                      } else {
                        handleFormChange('amenities', currentAmenities.filter(a => a !== 'sleeper'));
                      }
                    }}
                  />
                  <Label htmlFor="isSleeper">Sleeper</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isNonSleeper" 
                    checked={!formData.isSleeper}
                    onCheckedChange={(checked) => {
                      handleFormChange('isSleeper', !checked);
                      // Also update amenities
                      const currentAmenities = formData.amenities || [];
                      if (!checked) {
                        if (!currentAmenities.includes('sleeper')) {
                          handleFormChange('amenities', [...currentAmenities, 'sleeper']);
                        }
                      } else {
                        handleFormChange('amenities', currentAmenities.filter(a => a !== 'sleeper'));
                      }
                    }}
                  />
                  <Label htmlFor="isNonSleeper">Non-Sleeper</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hasTv" 
                    checked={formData.amenities?.includes('tv') || false}
                    onCheckedChange={(checked) => {
                      const currentAmenities = formData.amenities || [];
                      if (checked) {
                        handleFormChange('amenities', [...currentAmenities, 'tv']);
                      } else {
                        handleFormChange('amenities', currentAmenities.filter(a => a !== 'tv'));
                      }
                    }}
                  />
                  <Label htmlFor="hasTv">TV</Label>
                </div>
              </div>
            </div>
          )}

          {/* Registration Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Registration Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="registrationNumber">Registration Number *</Label>
                <Input 
                  id="registrationNumber" 
                  placeholder="e.g., DL-01-AB-1234" 
                  value={formData.registrationNumber}
                  onChange={(e) => handleFormChange('registrationNumber', e.target.value.toUpperCase())}
                  required
                />
              </div>
            </div>
          </div>

          {/* Vehicle Location */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="vehicleLocation">Vehicle Base Location *</Label>
              <LocationAutocomplete
                value={vehicleLocationInput}
                onChange={setVehicleLocationInput}
                onLocationSelect={handleVehicleLocationSelect}
                placeholder="Enter your vehicle's base location (e.g., Indore, Madhya Pradesh)"
                icon={<MapPin className="w-4 h-4 text-blue-600" />}
                className="w-full"
                showGetLocation={false}
              />
            </div>

            {/* Display selected location details */}
            {formData.vehicleLocation?.address && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-2">Selected Location:</div>
                <div className="space-y-1 text-sm text-blue-800">
                  <div><strong>Address:</strong> {formData.vehicleLocation.address}</div>
                  {formData.vehicleLocation.city && <div><strong>City:</strong> {formData.vehicleLocation.city}</div>}
                  {formData.vehicleLocation.state && <div><strong>State:</strong> {formData.vehicleLocation.state}</div>}
                  <div><strong>Coordinates:</strong> {formData.vehicleLocation.latitude}, {formData.vehicleLocation.longitude}</div>
                </div>
              </div>
            )}


          </div>


          {/* Vehicle Images Upload */}
          <div className="space-y-4">
            <Label>Vehicle Images ({previewUrls.length}/10)</Label>
            <div className="space-y-4">
              {mode === 'edit' && existing.length > 0 && (
                <div className="space-y-2">
                  <Label>Existing Images</Label>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {existing.map((img, idx) => (
                      <div key={img._id} className={`relative group ${img.markDelete ? 'opacity-50' : ''}`}>
                        <img src={img.url} className="w-full h-24 object-cover rounded-lg border-2 border-gray-200" />
                        <button
                          type="button"
                          onClick={() => setExisting(prev => prev.map((e,i)=> i===idx ? { ...e, markDelete: !e.markDelete } : e))}
                          className="absolute top-1 right-1 bg-white text-gray-800 rounded px-1 text-xs border"
                        >{img.markDelete ? 'Undo' : 'Delete'}</button>
                        {img.isPrimary && !img.markDelete && (
                          <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">Main</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Image Grid */}
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={url} 
                      alt={`Vehicle preview ${index + 1}`} 
                      className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {index === 0 && (
                      <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Main
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Upload Button */}
              <div className="flex items-center space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => document.getElementById('addImageInput')?.click()}
                  className="flex items-center space-x-2"
                  disabled={previewUrls.length >= 10}
                >
                  <Upload className="w-4 h-4" />
                  <span>Add Images</span>
                </Button>
                {previewUrls.length > 0 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setSelectedImages([]);
                      setPreviewUrls([]);
                    }}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Reset All
                  </Button>
                )}
              </div>
              <input
                id="addImageInput"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
              <p className="text-sm text-gray-500">
                Supported formats: JPG, PNG, WebP. Max size: 5MB per image. Up to 10 images.
              </p>
            </div>
          </div>
          
          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding Vehicle...
                </>
              ) : (
                'Add Vehicle'
              )}
            </Button>
          </div>
        </>
      )}
    </form>
  );
};

export default AddVehicleForm;
