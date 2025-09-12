import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui2/card';
import { Checkbox } from '@/components/ui2/checkbox';
import { Label } from '@/components/ui2/label';
import { Separator } from '@/components/ui2/separator';
import { Button } from '@/components/ui2/button';
import { Badge } from '@/components/ui2/badge';
import { ChevronDown, ChevronUp, Filter, X, Sparkles, SortAsc, Tag, Snowflake, Bed, Armchair, Car, Star } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  selectedType?: 'bus' | 'car' | 'auto';
  onFiltersChange?: (filters: VehicleFilters) => void;
  vehicles?: any[];
  filters?: VehicleFilters;
}

export interface VehicleFilters {
  // Common filters
  priceRange: {
    min: number;
    max: number;
  };
  seatingCapacity: number[];
  
  // Vehicle type specific filters
  isAc: string[];
  isSleeper: string[];
  fuelType: string[];
  
  // Car specific filters
  carBrand: string[];
  carModel: string[];
  
  // Bus specific filters
  busBrand: string[];
  busModel: string[];
  
  // Auto specific filters
  autoType: string[];
  
  // Sorting
  sortBy: string;
}

export const FilterSidebar = ({ 
  isOpen = true, 
  onToggle, 
  selectedType = 'bus',
  onFiltersChange,
  vehicles = [],
  filters: propFilters
}: FilterSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState({
    price: false,
    vehicleType: false,
    features: false,
    seating: false,
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Use passed filters or default filters
  const filters = propFilters || {
    priceRange: { min: 0, max: 10000 },
    seatingCapacity: [],
    isAc: [],
    isSleeper: [],
    fuelType: [],
    carBrand: [],
    carModel: [],
    busBrand: [],
    busModel: [],
    autoType: [],
    sortBy: ''
  };

  // Extract available filter options from vehicles data
  const availableFilters = React.useMemo(() => {
    if (!vehicles || vehicles.length === 0) {
      console.log('🔍 FilterSidebar: No vehicles data received');
      return {};
    }

    console.log('🔍 FilterSidebar: Processing vehicles data:', vehicles.length, 'vehicles');
    console.log('🔍 FilterSidebar: Sample vehicle:', vehicles[0]);

    const brands = [...new Set(vehicles.map(v => v.brand).filter(Boolean))];
    const models = [...new Set(vehicles.map(v => v.model).filter(Boolean))];
    const fuelTypes = [...new Set(vehicles.map(v => v.fuelType).filter(Boolean))];
    const transmissions = [...new Set(vehicles.map(v => v.transmission).filter(Boolean))];
    const seatingCapacities = [...new Set(vehicles.map(v => v.seatingCapacity).filter(Boolean))].sort((a, b) => a - b);

    console.log('🔍 FilterSidebar: Available filters:', {
      brands,
      models,
      fuelTypes,
      transmissions,
      seatingCapacities
    });

    return {
      brands,
      models,
      fuelTypes,
      transmissions,
      seatingCapacities
    };
  }, [vehicles]);

  // Price range options based on vehicle type
  const getPriceOptions = () => {
    if (selectedType === 'auto') {
      return [
        { id: '0-500', label: '₹0 - ₹500', min: 0, max: 500 },
        { id: '500-1000', label: '₹500 - ₹1000', min: 500, max: 1000 },
        { id: '1000-2000', label: '₹1000 - ₹2000', min: 1000, max: 2000 },
        { id: '2000+', label: '₹2000+', min: 2000, max: 10000 }
      ];
    } else {
      return [
        { id: '0-1000', label: '₹0 - ₹1000', min: 0, max: 1000 },
        { id: '1000-3000', label: '₹1000 - ₹3000', min: 1000, max: 3000 },
        { id: '3000-5000', label: '₹3000 - ₹5000', min: 3000, max: 5000 },
        { id: '5000+', label: '₹5000+', min: 5000, max: 10000 }
      ];
    }
  };

  // Sort options
  const sortOptions = [
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
    { id: 'rating-high', label: 'Rating: High to Low' },
    { id: 'seating-low', label: 'Seating: Low to High' },
    { id: 'seating-high', label: 'Seating: High to Low' },
  ];

  // Update filters and notify parent
  const updateFilters = (newFilters: Partial<VehicleFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    onFiltersChange?.(updatedFilters);
  };

  // Handle filter changes
  const handleFilterChange = (filterType: keyof VehicleFilters, value: any) => {
    updateFilters({ [filterType]: value });
  };

  // Handle array filter changes (checkboxes)
  const handleArrayFilterChange = (filterType: keyof VehicleFilters, value: string, checked: boolean) => {
    const currentArray = filters[filterType] as string[];
    let newArray: string[];
    
    if (checked) {
      newArray = [...currentArray, value];
    } else {
      newArray = currentArray.filter(item => item !== value);
    }
    
    updateFilters({ [filterType]: newArray });
  };

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters: VehicleFilters = {
      priceRange: { min: 0, max: 10000 },
      seatingCapacity: [],
      isAc: [],
      isSleeper: [],
      fuelType: [],
      carBrand: [],
      carModel: [],
      busBrand: [],
      busModel: [],
      autoType: [],
      sortBy: ''
    };
    updateFilters(clearedFilters);
  };

  // Get total active filters count
  const getTotalActiveFilters = () => {
    let count = 0;
    if (filters.seatingCapacity.length > 0) count++;
    if (filters.isAc.length > 0) count++;
    if (filters.isSleeper.length > 0) count++;
    if (filters.fuelType.length > 0) count++;
    if (filters.transmission.length > 0) count++;
    if (filters.carBrand.length > 0) count++;
    if (filters.carModel.length > 0) count++;
    if (filters.busBrand.length > 0) count++;
    if (filters.busModel.length > 0) count++;
    if (filters.autoType.length > 0) count++;
    if (filters.sortBy) count++;
    return count;
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Filter Section Component
  const FilterSection = ({ 
    title, 
    children,
    sectionKey 
  }: { 
    title: string; 
    children: React.ReactNode;
    sectionKey: keyof typeof expandedSections;
  }) => (
    <div className="mb-6">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full py-3 px-4 text-left bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all duration-200 shadow-sm"
      >
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          {title}
        </h3>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="w-5 h-5 text-gray-500 transition-transform duration-200" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 transition-transform duration-200" />
        )}
      </button>
      
      {expandedSections[sectionKey] && (
        <div className="mt-4 space-y-3 px-2">
          {children}
        </div>
      )}
      <Separator className="mt-6 bg-gray-100" />
    </div>
  );

  // Mobile Filter Bar
  const MobileFilterBar = () => (
    <div className="lg:hidden mb-6">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm transition-all duration-200 whitespace-nowrap ${
            showMobileFilters || getTotalActiveFilters() > 0
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
          {getTotalActiveFilters() > 0 && (
            <Badge className="ml-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {getTotalActiveFilters()}
            </Badge>
          )}
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showMobileFilters ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Quick filter buttons */}
        {filters.seatingCapacity.length > 0 && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
            Seating: {filters.seatingCapacity.join(', ')}
          </Badge>
        )}
        {filters.isAc.length > 0 && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
            AC: {filters.isAc.join(', ')}
          </Badge>
        )}
        {filters.fuelType.length > 0 && (
          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
            Fuel: {filters.fuelType.join(', ')}
          </Badge>
        )}
        {filters.sortBy && (
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
            {sortOptions.find(opt => opt.id === filters.sortBy)?.label || 'Sorted'}
          </Badge>
        )}
      </div>
    </div>
  );

  // Desktop Sidebar Component
  const DesktopSidebar = () => (
    <Card className="p-6 h-fit sticky top-4 bg-white shadow-lg border-0 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <Filter className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Filters</h2>
            <p className="text-sm text-gray-500">Refine your search</p>
          </div>
        </div>
        {getTotalActiveFilters() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {getTotalActiveFilters() > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-800">
              {getTotalActiveFilters()} filter(s) applied
            </p>
            <Badge variant="default" className="bg-blue-500 text-white">
              {getTotalActiveFilters()}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.seatingCapacity.length > 0 && (
              <Badge variant="secondary" className="bg-white text-blue-700 border-blue-200">
                Seating: {filters.seatingCapacity.join(', ')}
              </Badge>
            )}
            {filters.isAc.length > 0 && (
              <Badge variant="secondary" className="bg-white text-blue-700 border-blue-200">
                AC: {filters.isAc.join(', ')}
              </Badge>
            )}
            {filters.fuelType.length > 0 && (
              <Badge variant="secondary" className="bg-white text-green-700 border-green-200">
                Fuel: {filters.fuelType.join(', ')}
              </Badge>
            )}
            {filters.transmission.length > 0 && (
              <Badge variant="secondary" className="bg-white text-purple-700 border-purple-200">
                Transmission: {filters.transmission.join(', ')}
              </Badge>
            )}
            {filters.sortBy && (
              <Badge variant="secondary" className="bg-white text-orange-700 border-orange-200">
                {sortOptions.find(opt => opt.id === filters.sortBy)?.label || 'Sorted'}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Filter Sections */}
      <div className="space-y-2">
        {/* Price Range */}
        <FilterSection title="PRICE RANGE" sectionKey="price">
          <div className="space-y-3">
            {getPriceOptions().map((option) => (
              <div key={option.id} className="flex items-center space-x-3">
                <Checkbox
                  id={option.id}
                  checked={filters.priceRange.min === option.min && filters.priceRange.max === option.max}
                  onCheckedChange={(checked) => 
                    checked && handleFilterChange('priceRange', { min: option.min, max: option.max })
                  }
                  className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <Label htmlFor={option.id} className="text-sm text-gray-700 cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Seating Capacity */}
        <FilterSection title="SEATING CAPACITY" sectionKey="seating">
          <div className="space-y-3">
            {availableFilters.seatingCapacities?.map((capacity) => (
              <div key={capacity} className="flex items-center space-x-3">
                <Checkbox
                  id={`seating-${capacity}`}
                  checked={filters.seatingCapacity.includes(capacity)}
                  onCheckedChange={(checked) => 
                    handleArrayFilterChange('seatingCapacity', capacity.toString(), checked as boolean)
                  }
                  className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <Label htmlFor={`seating-${capacity}`} className="text-sm text-gray-700 cursor-pointer">
                  {capacity} Seater
                </Label>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Features */}
        <FilterSection title="FEATURES" sectionKey="features">
          <div className="space-y-3">
            {/* AC/Non-AC */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">AC Type</Label>
              <div className="space-y-2">
                {['AC', 'Non-AC'].map((type) => (
                  <div key={type} className="flex items-center space-x-3">
                    <Checkbox
                      id={`ac-${type}`}
                      checked={filters.isAc.includes(type)}
                      onCheckedChange={(checked) => 
                        handleArrayFilterChange('isAc', type, checked as boolean)
                      }
                      className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    />
                    <Label htmlFor={`ac-${type}`} className="text-sm text-gray-600 cursor-pointer">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Sleeper/Seater (for buses) */}
            {selectedType === 'bus' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Seat Type</Label>
                <div className="space-y-2">
                  {['Sleeper', 'Seater'].map((type) => (
                    <div key={type} className="flex items-center space-x-3">
                      <Checkbox
                        id={`sleeper-${type}`}
                        checked={filters.isSleeper.includes(type)}
                        onCheckedChange={(checked) => 
                          handleArrayFilterChange('isSleeper', type, checked as boolean)
                        }
                        className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                      <Label htmlFor={`sleeper-${type}`} className="text-sm text-gray-600 cursor-pointer">
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fuel Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Fuel Type</Label>
              <div className="space-y-2">
                {availableFilters.fuelTypes?.map((fuel) => (
                  <div key={fuel} className="flex items-center space-x-3">
                    <Checkbox
                      id={`fuel-${fuel}`}
                      checked={filters.fuelType.includes(fuel)}
                      onCheckedChange={(checked) => 
                        handleArrayFilterChange('fuelType', fuel, checked as boolean)
                      }
                      className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    />
                    <Label htmlFor={`fuel-${fuel}`} className="text-sm text-gray-600 cursor-pointer capitalize">
                      {fuel}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Transmission */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Transmission</Label>
              <div className="space-y-2">
                {availableFilters.transmissions?.map((transmission) => (
                  <div key={transmission} className="flex items-center space-x-3">
                    <Checkbox
                      id={`transmission-${transmission}`}
                      checked={filters.transmission.includes(transmission)}
                      onCheckedChange={(checked) => 
                        handleArrayFilterChange('transmission', transmission, checked as boolean)
                      }
                      className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    />
                    <Label htmlFor={`transmission-${transmission}`} className="text-sm text-gray-600 cursor-pointer capitalize">
                      {transmission}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FilterSection>

        {/* Vehicle Type Specific Filters */}
        <FilterSection title="VEHICLE TYPE" sectionKey="vehicleType">
          {selectedType === 'car' && (
            <div className="space-y-3">
              {/* Car Brands */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Brand</Label>
                <div className="space-y-2">
                  {availableFilters.brands?.map((brand) => (
                    <div key={brand} className="flex items-center space-x-3">
                      <Checkbox
                        id={`brand-${brand}`}
                        checked={filters.carBrand.includes(brand)}
                        onCheckedChange={(checked) => 
                          handleArrayFilterChange('carBrand', brand, checked as boolean)
                        }
                        className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                      <Label htmlFor={`brand-${brand}`} className="text-sm text-gray-600 cursor-pointer">
                        {brand}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Car Models */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Model</Label>
                <div className="space-y-2">
                  {availableFilters.models?.map((model) => (
                    <div key={model} className="flex items-center space-x-3">
                      <Checkbox
                        id={`model-${model}`}
                        checked={filters.carModel.includes(model)}
                        onCheckedChange={(checked) => 
                          handleArrayFilterChange('carModel', model, checked as boolean)
                        }
                        className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                      <Label htmlFor={`model-${model}`} className="text-sm text-gray-600 cursor-pointer">
                        {model}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedType === 'bus' && (
            <div className="space-y-3">
              {/* Bus Brands */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Brand</Label>
                <div className="space-y-2">
                  {availableFilters.brands?.map((brand) => (
                    <div key={brand} className="flex items-center space-x-3">
                      <Checkbox
                        id={`busbrand-${brand}`}
                        checked={filters.busBrand.includes(brand)}
                        onCheckedChange={(checked) => 
                          handleArrayFilterChange('busBrand', brand, checked as boolean)
                        }
                        className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                      <Label htmlFor={`busbrand-${brand}`} className="text-sm text-gray-600 cursor-pointer">
                        {brand}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bus Models */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Model</Label>
                <div className="space-y-2">
                  {availableFilters.models?.map((model) => (
                    <div key={model} className="flex items-center space-x-3">
                      <Checkbox
                        id={`busmodel-${model}`}
                        checked={filters.busModel.includes(model)}
                        onCheckedChange={(checked) => 
                          handleArrayFilterChange('busModel', model, checked as boolean)
                        }
                        className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                      <Label htmlFor={`busmodel-${model}`} className="text-sm text-gray-600 cursor-pointer">
                        {model}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedType === 'auto' && (
            <div className="space-y-3">
              {/* Auto Types */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Auto Type</Label>
                <div className="space-y-2">
                  {['Electric', 'CNG', 'Petrol'].map((type) => (
                    <div key={type} className="flex items-center space-x-3">
                      <Checkbox
                        id={`autotype-${type}`}
                        checked={filters.autoType.includes(type)}
                        onCheckedChange={(checked) => 
                          handleArrayFilterChange('autoType', type, checked as boolean)
                        }
                        className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                      <Label htmlFor={`autotype-${type}`} className="text-sm text-gray-600 cursor-pointer">
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </FilterSection>

        {/* Sort Options */}
        <FilterSection title="SORT BY" sectionKey="seating">
          <div className="space-y-3">
            {sortOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-3">
                <Checkbox
                  id={option.id}
                  checked={filters.sortBy === option.id}
                  onCheckedChange={(checked) => 
                    checked ? handleFilterChange('sortBy', option.id) : handleFilterChange('sortBy', '')
                  }
                  className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <Label htmlFor={option.id} className="text-sm text-gray-700 cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </FilterSection>
      </div>
    </Card>
  );

  if (!isOpen) {
    return (
      <div className="lg:hidden">
        <MobileFilterBar />
        <Button
          variant="outline"
          size="lg"
          onClick={onToggle}
          className="mb-4 w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 text-blue-700 font-semibold shadow-sm"
        >
          <Filter className="w-5 h-5 mr-3" />
          Show Filters
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <MobileFilterBar />
        
        {showMobileFilters && (
          <Card className="p-6 mb-6 bg-white shadow-lg border-0 rounded-xl mobile-filter-slide-in">
            {/* Mobile filter content - simplified version */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobileFilters(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Quick filters for mobile */}
              <div className="space-y-4">
                {/* Seating Capacity */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Seating Capacity</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableFilters.seatingCapacities?.slice(0, 6).map((capacity) => (
                      <Button
                        key={capacity}
                        variant={filters.seatingCapacity.includes(capacity) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const newSeating = filters.seatingCapacity.includes(capacity) 
                            ? filters.seatingCapacity.filter(c => c !== capacity)
                            : [...filters.seatingCapacity, capacity];
                          handleFilterChange('seatingCapacity', newSeating);
                        }}
                        className="text-xs"
                      >
                        {capacity} Seater
                      </Button>
                    ))}
                  </div>
                </div>

                {/* AC Type */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">AC Type</Label>
                  <div className="flex gap-2">
                    {['AC', 'Non-AC'].map((type) => (
                      <Button
                        key={type}
                        variant={filters.isAc.includes(type) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const newAc = filters.isAc.includes(type) 
                            ? filters.isAc.filter(t => t !== type)
                            : [...filters.isAc, type];
                          handleFilterChange('isAc', newAc);
                        }}
                        className="text-xs"
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Fuel Type */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Fuel Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableFilters.fuelTypes?.slice(0, 4).map((fuel) => (
                      <Button
                        key={fuel}
                        variant={filters.fuelType.includes(fuel) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const newFuel = filters.fuelType.includes(fuel) 
                            ? filters.fuelType.filter(f => f !== fuel)
                            : [...filters.fuelType, fuel];
                          handleFilterChange('fuelType', newFuel);
                        }}
                        className="text-xs capitalize"
                      >
                        {fuel}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</Label>
                  <div className="flex flex-wrap gap-2">
                    {sortOptions.slice(0, 3).map((option) => (
                      <Button
                        key={option.id}
                        variant={filters.sortBy === option.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterChange('sortBy', filters.sortBy === option.id ? '' : option.id)}
                        className="text-xs"
                      >
                        {option.label.split(':')[1]?.trim() || option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                onClick={() => setShowMobileFilters(false)}
              >
                <Filter className="w-5 h-5 mr-2" />
                Apply Filters ({getTotalActiveFilters()})
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <DesktopSidebar />
      </div>
    </>
  );
};

export default FilterSidebar; 