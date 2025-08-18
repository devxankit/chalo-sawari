import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, X, Loader2, Car, Bus } from "lucide-react";
import { CreateVehicleData, Vehicle, UpdateVehicleData } from "@/services/vehicleApi";

// Vehicle type configurations
const VEHICLE_CONFIGS = {
  'auto': {
    name: 'Auto',
    icon: '🛺',
    defaultCapacity: 3,
    variants: ['Fuel', 'Electric', 'CNG'],
    amenities: ['charging', 'usb', 'gps'],
    defaultBaseFare: 50,
    defaultPerKmRate: 15
  },
  'car': {
    name: 'Car',
    icon: '🚗',
    defaultCapacity: 4,
    variants: ['Sedan', 'Hatchback', 'SUV'],
    amenities: ['ac', 'charging', 'usb', 'bluetooth', 'gps'],
    defaultBaseFare: 100,
    defaultPerKmRate: 20
  },
  'bus': {
    name: 'Bus',
    icon: '🚌',
    defaultCapacity: 40,
    variants: ['AC Sleeper', 'Non-AC Sleeper', '52-Seater AC/Non-AC', '40-Seater AC/Non-AC', '32-Seater AC/Non-AC', '26-Seater AC/Non-AC', '17-Seater AC/Non-AC'],
    amenities: ['ac', 'sleeper', 'charging', 'usb', 'gps', 'camera', 'wifi', 'tv'],
    defaultBaseFare: 200,
    defaultPerKmRate: 25
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
    model: '',
    year: new Date().getFullYear(),
    color: '',
    fuelType: 'petrol',
    transmission: 'manual',
    seatingCapacity: 4,
    engineCapacity: undefined,
    mileage: undefined,
    isAc: false,
    isSleeper: false,
    amenities: [],
    registrationNumber: '',
    chassisNumber: '',
    engineNumber: '',
    rcNumber: '',
    rcExpiryDate: '',
    insuranceNumber: '',
    insuranceExpiryDate: '',
    fitnessNumber: '',
    fitnessExpiryDate: '',
    permitNumber: '',
    permitExpiryDate: '',
    pucNumber: '',
    pucExpiryDate: '',
    baseFare: 100,
    perKmRate: 20,
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    workingHoursStart: '06:00',
    workingHoursEnd: '22:00',
    operatingCities: [],
    operatingStates: []
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existing, setExisting] = useState<(typeof existingImages[0] & { markDelete?: boolean })[]>(existingImages);

  const handleFormChange = (field: keyof CreateVehicleData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVehicleCategory) {
      alert('Please select a vehicle category');
      return;
    }

    const submitData: CreateVehicleData = {
      // Ensure backend-compliant type string
      type: selectedVehicleCategory as 'auto' | 'car' | 'bus',
      brand: formData.brand || '',
      model: formData.model || '',
      year: formData.year || new Date().getFullYear(),
      color: formData.color || '',
      fuelType: formData.fuelType || 'petrol',
      transmission: formData.transmission || 'manual',
      seatingCapacity: formData.seatingCapacity || 4,
      engineCapacity: formData.engineCapacity !== undefined && formData.engineCapacity !== null ? formData.engineCapacity : undefined,
      mileage: formData.mileage !== undefined && formData.mileage !== null ? formData.mileage : undefined,
      isAc: formData.isAc || false,
      isSleeper: formData.isSleeper || false,
      amenities: formData.amenities || [],
      registrationNumber: formData.registrationNumber || '',
      chassisNumber: formData.chassisNumber ? formData.chassisNumber : undefined,
      engineNumber: formData.engineNumber ? formData.engineNumber : undefined,
      rcNumber: formData.rcNumber || '',
      rcExpiryDate: formData.rcExpiryDate || '',
      insuranceNumber: formData.insuranceNumber ? formData.insuranceNumber : undefined,
      insuranceExpiryDate: formData.insuranceExpiryDate ? formData.insuranceExpiryDate : undefined,
      fitnessNumber: formData.fitnessNumber ? formData.fitnessNumber : undefined,
      fitnessExpiryDate: formData.fitnessExpiryDate ? formData.fitnessExpiryDate : undefined,
      permitNumber: formData.permitNumber ? formData.permitNumber : undefined,
      permitExpiryDate: formData.permitExpiryDate ? formData.permitExpiryDate : undefined,
      pucNumber: formData.pucNumber ? formData.pucNumber : undefined,
      pucExpiryDate: formData.pucExpiryDate ? formData.pucExpiryDate : undefined,
      baseFare: formData.baseFare || 100,
      perKmRate: formData.perKmRate || 20,
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
      baseFare: config.defaultBaseFare,
      perKmRate: config.defaultPerKmRate,
      amenities: config.amenities
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Vehicle Category Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">What type of vehicle do you want to add?</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <Label htmlFor="vehicleType">Variant</Label>
              <Select value={(formData as any).variant || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, /* keep API type as category */ type: prev.type, ...(prev as any), variant: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_CONFIGS[selectedVehicleCategory].variants.map((variant) => (
                    <SelectItem key={variant} value={variant}>{variant}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
              <Label htmlFor="model">Model *</Label>
              <Input 
                id="model" 
                placeholder="e.g., Swift Dzire, City, B8R"
                value={formData.model}
                onChange={(e) => handleFormChange('model', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="year">Year *</Label>
              <Input 
                id="year" 
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                placeholder="e.g., 2020" 
                value={formData.year}
                onChange={(e) => handleFormChange('year', parseInt(e.target.value))}
                required
              />
            </div>
            <div>
              <Label htmlFor="color">Color *</Label>
              <Input 
                id="color" 
                placeholder="e.g., White" 
                value={formData.color}
                onChange={(e) => handleFormChange('color', e.target.value)}
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
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="cng">CNG</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="transmission">Transmission</Label>
              <Select value={formData.transmission} onValueChange={(value) => handleFormChange('transmission', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select transmission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="engineCapacity">Engine Capacity (cc)</Label>
              <Input 
                id="engineCapacity" 
                type="number"
                min="0"
                placeholder="e.g., 1200"
                value={formData.engineCapacity || ''}
                onChange={(e) => handleFormChange('engineCapacity', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
            <div>
              <Label htmlFor="mileage">Mileage (km/l)</Label>
              <Input 
                id="mileage" 
                type="number"
                min="0"
                placeholder="e.g., 20"
                value={formData.mileage || ''}
                onChange={(e) => handleFormChange('mileage', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <Label>Features</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isAc" 
                  checked={formData.isAc}
                  onCheckedChange={(checked) => handleFormChange('isAc', checked)}
                />
                <Label htmlFor="isAc">AC</Label>
              </div>
              {selectedVehicleCategory === 'bus' && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isSleeper" 
                    checked={formData.isSleeper}
                    onCheckedChange={(checked) => handleFormChange('isSleeper', checked)}
                  />
                  <Label htmlFor="isSleeper">Sleeper</Label>
                </div>
              )}
            </div>
          </div>

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
              <div>
                <Label htmlFor="rcNumber">RC Number *</Label>
                <Input 
                  id="rcNumber" 
                  placeholder="e.g., RC123456789" 
                  value={formData.rcNumber}
                  onChange={(e) => handleFormChange('rcNumber', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rcExpiryDate">RC Expiry Date *</Label>
                <Input 
                  id="rcExpiryDate" 
                  type="date"
                  value={formData.rcExpiryDate}
                  onChange={(e) => handleFormChange('rcExpiryDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="chassisNumber">Chassis Number</Label>
                <Input 
                  id="chassisNumber" 
                  placeholder="e.g., CH123456789" 
                  value={formData.chassisNumber || ''}
                  onChange={(e) => handleFormChange('chassisNumber', e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="engineNumber">Engine Number</Label>
                <Input 
                  id="engineNumber" 
                  placeholder="e.g., EN123456789" 
                  value={formData.engineNumber || ''}
                  onChange={(e) => handleFormChange('engineNumber', e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pricing Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="baseFare">Base Fare (₹) *</Label>
                <Input 
                  id="baseFare" 
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 100"
                  value={formData.baseFare}
                  onChange={(e) => handleFormChange('baseFare', parseFloat(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="perKmRate">Per Km Rate (₹) *</Label>
                <Input 
                  id="perKmRate" 
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 20"
                  value={formData.perKmRate}
                  onChange={(e) => handleFormChange('perKmRate', parseFloat(e.target.value))}
                  required
                />
              </div>
            </div>
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
