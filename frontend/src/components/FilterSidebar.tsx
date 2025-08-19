import React, { useState } from 'react';
import { Card } from '@/components/ui2/card';
import { Checkbox } from '@/components/ui2/checkbox';
import { Label } from '@/components/ui2/label';
import { Separator } from '@/components/ui2/separator';
import { Button } from '@/components/ui2/button';
import { Badge } from '@/components/ui2/badge';
import { ChevronDown, ChevronUp, Filter, X, Sparkles, SortAsc, Tag, Snowflake, Bed, Armchair, Car } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  selectedType?: 'bus' | 'car' | 'auto';
}

export const FilterSidebar = ({ isOpen = true, onToggle, selectedType = 'bus' }: FilterSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState({
    price: false,
    busType: false,
    operators: false,
    busPartner: false,
    carType: false,
  });

  const [expandedCarTypes, setExpandedCarTypes] = useState({
    sedan: false,
    hatchback: false,
    suv: false,
  });

  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Mobile filter states
  const [selectedMobileFilters, setSelectedMobileFilters] = useState({
    specialPrice: false,
    ac: false,
    nonAc: false,
    sleeper: false,
    singleSeats: false,
    seater: false,
    sedan: false,
    suv: false,
    hatchback: false,
    electric: false,
    fuel: false,
  });

  const [sortOption, setSortOption] = useState<string>('');

  const priceOptions: FilterOption[] = [
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
    { id: 'departure-early', label: 'Departure: Early to Late' },
    { id: 'departure-late', label: 'Departure: Late to Early' },
    { id: 'rating', label: 'Rating: High to Low' },
  ];

  const busTypeOptions: FilterOption[] = [
    { id: 'ac', label: 'AC Sleeper' },
    { id: 'non-ac', label: 'Non-AC Sleeper' },
    { id: '52ac_non_ac', label: '52-Seater AC/Non-AC' },
    { id: '40ac_non_ac', label: '40-Seater AC/Non-AC' },
    { id: '32ac_non_ac', label: '32-Seater AC/Non-AC' },
    { id: '26ac_non_ac', label: '26-Seater AC/Non-AC' },
    { id: '17ac_non_ac', label: '17-Seater AC/Non-AC' }
  ];

  const operatorOptions: FilterOption[] = [
    { id: 'redbus-travels', label: 'Redbus Travels' },
    { id: 'srs-travels', label: 'SRS Travels' },
    { id: 'kpn-travels', label: 'KPN Travels' },
    { id: 'orange-travels', label: 'Orange Travels' },
    { id: 'kallada-travels', label: 'Kallada Travels' },
    { id: 'parveen-travels', label: 'Parveen Travels' },
  ];

  const carTypeOptions: FilterOption[] = [
    { id: 'sedan', label: 'Sedan' },
    { id: 'hatchback', label: 'Hatchback' },
    { id: 'suv', label: 'SUV' },
  ];

  const carVariantOptions: Record<string, FilterOption[]> = {
    sedan: [
      { id: 'honda-amaze', label: 'Honda Amaze' },
      { id: 'swift-dzire', label: 'Swift Dzire' },
      { id: 'ertiga', label: 'Ertiga' },
      { id: 'hundai-aura', label: 'Hundai Aura' },
      { id: 'honda-city', label: 'Honda City' },
      { id: 'ciaz', label: 'Ciaz' },
      { id: 'xcent-hundai', label: 'Xcent Hundai' },
    ],
    hatchback: [
      { id: 'wagon-r', label: 'Wagon R' },
      { id: 'swift', label: 'Swift' },
      { id: 'tiago', label: 'Tiago' },
      { id: 'renault-climber', label: 'Renault Climber' },
    ],
    suv: [
      { id: 'scorpio-n', label: 'Scorpio N' },
      { id: 'bolero', label: 'Bolero' },
      { id: 'scorpio-classic', label: 'Scorpio Classic' },
      { id: 'inova-crysta', label: 'Inova Crysta' },
      { id: 'fortuner', label: 'Fortuner' },
      { id: 'renault-triber', label: 'Renault Triber' },
    ],
  };

  const carOperatorOptions: FilterOption[] = [
    { id: 'uber', label: 'Uber' },
    { id: 'ola', label: 'Ola' },
    { id: 'zoomcar', label: 'Zoomcar' },
    { id: 'revv', label: 'Revv' },
    { id: 'myles', label: 'Myles' },
  ];

  const travellerTypeOptions: FilterOption[] = [
    { id: 'fuel', label: 'Fuel' },
    { id: 'electric', label: 'Electric' },
    { id: 'cng', label: 'CNG' }
  ];

  // Auto-Ricksaw operator options removed as requested



  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleCarType = (carType: keyof typeof expandedCarTypes) => {
    setExpandedCarTypes(prev => ({
      ...prev,
      [carType]: !prev[carType]
    }));
  };

  const handleFilterChange = (filterId: string, checked: boolean) => {
    setSelectedFilters(prev => 
      checked 
        ? [...prev, filterId]
        : prev.filter(id => id !== filterId)
    );
  };

  const clearAllFilters = () => {
    setSelectedFilters([]);
    setSelectedMobileFilters({
      specialPrice: false,
      ac: false,
      nonAc: false,
      sleeper: false,
      singleSeats: false,
      seater: false,
      sedan: false,
      suv: false,
      hatchback: false,
      electric: false,
      fuel: false,
    });
    setExpandedCarTypes({
      sedan: false,
      hatchback: false,
      suv: false,
    });
    setSortOption('');
  };

  // Mobile filter handlers
  const handleMobileFilterToggle = (filterKey: keyof typeof selectedMobileFilters) => {
    setSelectedMobileFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  };

  const handleSortChange = (sortId: string) => {
    setSortOption(sortId === sortOption ? '' : sortId);
  };

  // Get total active filters count
  const getTotalActiveFilters = () => {
    const mobileFilterCount = Object.values(selectedMobileFilters).filter(Boolean).length;
    const carVariantCount = selectedType === 'car' ? 
      selectedFilters.filter(filter => 
        Object.values(carVariantOptions).flat().some(variant => variant.id === filter)
      ).length : 0;
    return selectedFilters.length + mobileFilterCount + carVariantCount + (sortOption ? 1 : 0);
  };

  const FilterSection = ({ 
    title, 
    options, 
    sectionKey 
  }: { 
    title: string; 
    options: FilterOption[]; 
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
          {options.map((option) => (
            <div key={option.id}>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150">
                <Checkbox
                  id={option.id}
                  checked={selectedFilters.includes(option.id)}
                  onCheckedChange={(checked) => 
                    handleFilterChange(option.id, checked as boolean)
                  }
                  className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <Label
                  htmlFor={option.id}
                  className="text-sm text-gray-700 cursor-pointer flex-1 font-medium"
                >
                  {option.label}
                </Label>
                {option.count && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">
                    {option.count}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Separator className="mt-6 bg-gray-100" />
    </div>
  );

  // New component for car types with individual expand/collapse
  const CarTypeSection = () => (
    <div className="mb-6">
      <button
        onClick={() => toggleSection('carType')}
        className="flex items-center justify-between w-full py-3 px-4 text-left bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all duration-200 shadow-sm"
      >
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          CAR TYPES
        </h3>
        {expandedSections.carType ? (
          <ChevronUp className="w-5 h-5 text-gray-500 transition-transform duration-200" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 transition-transform duration-200" />
        )}
      </button>
      
      {expandedSections.carType && (
        <div className="mt-4 space-y-3 px-2">
          {carTypeOptions.map((option) => (
            <div key={option.id} className="border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
              <button
                onClick={() => toggleCarType(option.id as keyof typeof expandedCarTypes)}
                className="flex items-center justify-between w-full py-4 px-4 text-left bg-white hover:bg-blue-50 transition-all duration-200 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    expandedCarTypes[option.id as keyof typeof expandedCarTypes] 
                      ? 'bg-blue-500' 
                      : 'bg-gray-300'
                  }`} />
                  <Label className="text-sm text-gray-700 cursor-pointer font-medium">
                    {option.label}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {carVariantOptions[option.id]?.length || 0} models
                  </span>
                  {expandedCarTypes[option.id as keyof typeof expandedCarTypes] ? (
                    <ChevronUp className="w-5 h-5 text-blue-500 transition-transform duration-200" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 transition-transform duration-200" />
                  )}
                </div>
              </button>
              
              {/* Show car variants when expanded */}
              {expandedCarTypes[option.id as keyof typeof expandedCarTypes] && carVariantOptions[option.id] && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 bg-gradient-to-b from-blue-50/30 to-white">
                  <div className="text-xs text-blue-600 font-medium mt-3 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    Available Models
                  </div>
                  <div className="grid gap-2">
                    {carVariantOptions[option.id].map((variant) => (
                      <div key={variant.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-150 ml-4 border border-gray-100 bg-white/80">
                        <Checkbox
                          id={variant.id}
                          checked={selectedFilters.includes(variant.id)}
                          onCheckedChange={(checked) => 
                            handleFilterChange(variant.id, checked as boolean)
                          }
                          className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                        />
                        <Label
                          htmlFor={variant.id}
                          className="text-sm text-gray-600 cursor-pointer flex-1 font-medium hover:text-blue-600 transition-colors duration-150"
                        >
                          {variant.label}
                        </Label>
                        {selectedFilters.includes(variant.id) && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Separator className="mt-6 bg-gray-100" />
    </div>
  );

  // Mobile Horizontal Filter Bar
  const MobileFilterBar = () => (
    <div className="lg:hidden mb-6">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {/* Filters Button */}
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm transition-all duration-200 whitespace-nowrap ${
            showMobileFilters || getTotalActiveFilters() > 0
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
          }`}
        >
          <div className="flex flex-col gap-0.5">
            <div className="w-4 h-0.5 bg-current"></div>
            <div className="w-3 h-0.5 bg-current"></div>
            <div className="w-2 h-0.5 bg-current"></div>
          </div>
          <span className="text-sm font-medium">Filters</span>
          {getTotalActiveFilters() > 0 && (
            <Badge className="ml-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {getTotalActiveFilters()}
            </Badge>
          )}
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showMobileFilters ? 'rotate-180' : ''}`} />
        </button>
        {selectedType === 'car' ? (
          <>
            {/* Sedan Button */}
            <button 
              onClick={() => handleMobileFilterToggle('sedan')}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm transition-all duration-200 whitespace-nowrap ${
                selectedMobileFilters.sedan
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Car className="w-4 h-4" />
              <span className="text-sm font-medium">Sedan</span>
            </button>

            {/* SUV Button */}
            <button 
              onClick={() => handleMobileFilterToggle('suv')}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm transition-all duration-200 whitespace-nowrap ${
                selectedMobileFilters.suv
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Car className="w-4 h-4" />
              <span className="text-sm font-medium">SUV</span>
            </button>

            {/* Hatchback Button */}
            <button 
              onClick={() => handleMobileFilterToggle('hatchback')}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm transition-all duration-200 whitespace-nowrap ${
                selectedMobileFilters.hatchback
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Car className="w-4 h-4" />
              <span className="text-sm font-medium">Hatchback</span>
            </button>

            {/* Popular Car Variants */}
            {selectedFilters.some(filter => carVariantOptions.sedan.some(v => v.id === filter)) && (
              <button 
                className="flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm transition-all duration-200 whitespace-nowrap bg-blue-50 border-blue-300 text-blue-700"
              >
                <Car className="w-4 h-4" />
                <span className="text-sm font-medium">Honda City</span>
              </button>
            )}
            {selectedFilters.some(filter => carVariantOptions.suv.some(v => v.id === filter)) && (
              <button 
                className="flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm transition-all duration-200 whitespace-nowrap bg-blue-50 border-blue-300 text-blue-700"
              >
                <Car className="w-4 h-4" />
                <span className="text-sm font-medium">Scorpio N</span>
              </button>
            )}
            {selectedFilters.some(filter => carVariantOptions.hatchback.some(v => v.id === filter)) && (
              <button 
                className="flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm transition-all duration-200 whitespace-nowrap bg-blue-50 border-blue-300 text-blue-700"
              >
                <Car className="w-4 h-4" />
                <span className="text-sm font-medium">Swift</span>
              </button>
            )}
          </>
        ) : selectedType === 'traveller' ? (
          <>
            {/* Electric Button */}
            <button 
              onClick={() => handleMobileFilterToggle('electric')}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm transition-all duration-200 whitespace-nowrap ${
                selectedMobileFilters.electric
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Car className="w-4 h-4" />
              <span className="text-sm font-medium">Electric</span>
            </button>

            {/* Fuel Button */}
            <button 
              onClick={() => handleMobileFilterToggle('fuel')}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm transition-all duration-200 whitespace-nowrap ${
                selectedMobileFilters.fuel
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Car className="w-4 h-4" />
              <span className="text-sm font-medium">Fuel</span>
            </button>
          </>
        ) : (
          <>
            {/* AC Button */}
            <button 
              onClick={() => handleMobileFilterToggle('ac')}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm transition-all duration-200 whitespace-nowrap ${
                selectedMobileFilters.ac
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Snowflake className="w-4 h-4" />
              <span className="text-sm font-medium">AC</span>
            </button>

            {/* Non-AC Button */}
            <button 
              onClick={() => handleMobileFilterToggle('nonAc')}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm transition-all duration-200 whitespace-nowrap ${
                selectedMobileFilters.nonAc
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Car className="w-4 h-4" />
              <span className="text-sm font-medium">Non-AC</span>
            </button>

            {/* Sleeper Button */}
            <button 
              onClick={() => handleMobileFilterToggle('sleeper')}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm transition-all duration-200 whitespace-nowrap ${
                selectedMobileFilters.sleeper
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Bed className="w-4 h-4" />
              <span className="text-sm font-medium">SLEEPER</span>
            </button>
          </>
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
        {selectedFilters.length > 0 && (
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
      {selectedFilters.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-800">
            {selectedFilters.length} filter(s) applied
          </p>
            <Badge variant="default" className="bg-blue-500 text-white">
              {selectedFilters.length}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedFilters.slice(0, 3).map((filterId) => {
              const allOptions = selectedType === 'car' 
                ? [...priceOptions, ...carTypeOptions, ...carOperatorOptions, ...Object.values(carVariantOptions).flat()]
                : selectedType === 'traveller'
                ? [...priceOptions, ...travellerTypeOptions]
                : [...priceOptions, ...busTypeOptions, ...operatorOptions];
              const option = allOptions.find(opt => opt.id === filterId);
              return (
                <Badge 
                  key={filterId} 
                  variant="secondary" 
                  className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                >
                  {option?.label || filterId}
                </Badge>
              );
            })}
            {selectedFilters.length > 3 && (
              <Badge variant="secondary" className="bg-white text-blue-700 border-blue-200">
                +{selectedFilters.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Filter Sections */}
      <div className="space-y-2">
        {selectedType === 'car' ? (
          <>
            <CarTypeSection />

            <FilterSection
              title="OPERATORS"
              options={carOperatorOptions}
              sectionKey="operators"
            />

            <FilterSection
              title="PRICE"
              options={priceOptions}
              sectionKey="price"
            />
          </>
        ) : selectedType === 'traveller' ? (
          <>
            <FilterSection
                              title="AUTO-RIKSAW TYPE"
              options={travellerTypeOptions}
              sectionKey="busType"
            />



            <FilterSection
              title="PRICE"
              options={priceOptions}
              sectionKey="price"
            />
          </>
        ) : (
          <>
            <FilterSection
              title="BUS TYPE"
              options={busTypeOptions}
              sectionKey="busType"
            />

            <FilterSection
              title="OPERATORS"
              options={operatorOptions}
              sectionKey="operators"
            />

            <FilterSection
              title="PRICE"
              options={priceOptions}
              sectionKey="price"
            />
          </>
        )}
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
              <div className="flex items-center gap-2">
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobileFilters(false)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Active Filters Summary */}
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
                  {selectedMobileFilters.specialPrice && (
                    <Badge variant="secondary" className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50">
                      Special Price
                    </Badge>
                  )}
                  {selectedMobileFilters.ac && (
                    <Badge variant="secondary" className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50">
                      AC
                    </Badge>
                  )}
                  {selectedMobileFilters.sleeper && (
                    <Badge variant="secondary" className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50">
                      Sleeper
                    </Badge>
                  )}
                  {selectedMobileFilters.singleSeats && (
                    <Badge variant="secondary" className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50">
                      Single Seats
                    </Badge>
                  )}
                  {selectedMobileFilters.seater && (
                    <Badge variant="secondary" className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50">
                      Seater
                    </Badge>
                  )}
                  {selectedMobileFilters.sedan && (
                    <Badge variant="secondary" className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50">
                      Sedan
                    </Badge>
                  )}
                  {selectedMobileFilters.suv && (
                    <Badge variant="secondary" className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50">
                      SUV
                    </Badge>
                  )}
                  {selectedMobileFilters.hatchback && (
                    <Badge variant="secondary" className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50">
                      Hatchback
                    </Badge>
                  )}
                  {/* Show selected car variants */}
                  {selectedType === 'car' && selectedFilters.filter(filter => 
                    Object.values(carVariantOptions).flat().some(variant => variant.id === filter)
                  ).map((variantId) => {
                    const variant = Object.values(carVariantOptions).flat().find(v => v.id === variantId);
                    return variant ? (
                      <Badge key={variantId} variant="secondary" className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50">
                        {variant.label}
                      </Badge>
                    ) : null;
                  })}

                  {/* Electric and Fuel filter badges for traveller type */}
                  {selectedMobileFilters.electric && (
                    <Badge variant="secondary" className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50">
                      Electric
                    </Badge>
                  )}
                  {selectedMobileFilters.fuel && (
                    <Badge variant="secondary" className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50">
                      Fuel
                    </Badge>
                  )}

                  {sortOption && (
                    <Badge variant="secondary" className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50">
                      {priceOptions.find(opt => opt.id === sortOption)?.label || 'Sort'}
                    </Badge>
                  )}
                  {selectedFilters.slice(0, 2).map((filterId) => {
                    const allOptions = selectedType === 'car' 
                      ? [...priceOptions, ...carTypeOptions, ...carOperatorOptions, ...Object.values(carVariantOptions).flat()]
                      : selectedType === 'traveller'
                      ? [...priceOptions, ...travellerTypeOptions]
                      : [...priceOptions, ...busTypeOptions, ...operatorOptions];
                    const option = allOptions.find(opt => opt.id === filterId);
                    return (
                      <Badge 
                        key={filterId} 
                        variant="secondary" 
                        className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                      >
                        {option?.label || filterId}
                      </Badge>
                    );
                  })}
                  {selectedFilters.length > 2 && (
                    <Badge variant="secondary" className="bg-white text-blue-700 border-blue-200">
                      +{selectedFilters.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            )}



            {/* Filter Sections */}
            <div className="space-y-2">
              {selectedType === 'car' ? (
                <>
                  {/* Custom Car Type Section for Mobile */}
                  <div className="mb-6">
                    <button
                      onClick={() => toggleSection('carType')}
                      className="flex items-center justify-between w-full py-3 px-4 text-left bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all duration-200 shadow-sm"
                    >
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        CAR TYPES
                      </h3>
                      {expandedSections.carType ? (
                        <ChevronUp className="w-5 h-5 text-gray-500 transition-transform duration-200" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500 transition-transform duration-200" />
                      )}
                    </button>
                    
                    {expandedSections.carType && (
                      <div className="mt-4 space-y-3 px-2">
                        {carTypeOptions.map((option) => (
                          <div key={option.id} className="border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                            <button
                              onClick={() => toggleCarType(option.id as keyof typeof expandedCarTypes)}
                              className="flex items-center justify-between w-full py-4 px-4 text-left bg-white hover:bg-blue-50 transition-all duration-200 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                  expandedCarTypes[option.id as keyof typeof expandedCarTypes] 
                                    ? 'bg-blue-500' 
                                    : 'bg-gray-300'
                                }`} />
                                <Label className="text-sm text-gray-700 cursor-pointer font-medium">
                                  {option.label}
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                  {carVariantOptions[option.id]?.length || 0} models
                                </span>
                                {expandedCarTypes[option.id as keyof typeof expandedCarTypes] ? (
                                  <ChevronUp className="w-5 h-5 text-blue-500 transition-transform duration-200" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-500 transition-transform duration-200" />
                                )}
                              </div>
                            </button>
                            
                            {/* Show car variants when expanded */}
                            {expandedCarTypes[option.id as keyof typeof expandedCarTypes] && carVariantOptions[option.id] && (
                              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 bg-gradient-to-b from-blue-50/30 to-white">
                                <div className="text-xs text-blue-600 font-medium mt-3 mb-2 flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                  Available Models
                                </div>
                                <div className="grid gap-2">
                                  {carVariantOptions[option.id].map((variant) => (
                                    <div key={variant.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-150 ml-4 border border-gray-100 bg-white/80">
                                      <Checkbox
                                        id={`mobile-${variant.id}`}
                                        checked={selectedFilters.includes(variant.id)}
                                        onCheckedChange={(checked) => 
                                          handleFilterChange(variant.id, checked as boolean)
                                        }
                                        className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                      />
                                      <Label
                                        htmlFor={`mobile-${variant.id}`}
                                        className="text-sm text-gray-600 cursor-pointer flex-1 font-medium hover:text-blue-600 transition-colors duration-200"
                                      >
                                        {variant.label}
                                      </Label>
                                      {selectedFilters.includes(variant.id) && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <FilterSection
                    title="OPERATORS"
                    options={carOperatorOptions}
                    sectionKey="operators"
                  />

                  <FilterSection
                    title="PRICE"
                    options={priceOptions}
                    sectionKey="price"
                  />
                </>
              ) : selectedType === 'traveller' ? (
                <>
                  <FilterSection
                    title="AUTO-RIKSAW TYPE"
                    options={travellerTypeOptions}
                    sectionKey="busType"
                  />



                  <FilterSection
                    title="PRICE"
                    options={priceOptions}
                    sectionKey="price"
                  />
                </>
              ) : (
                <>
                  <FilterSection
                    title="BUS TYPE"
                    options={busTypeOptions}
                    sectionKey="busType"
                  />

                  <FilterSection
                    title="OPERATORS"
                    options={operatorOptions}
                    sectionKey="operators"
                  />

                  <FilterSection
                    title="PRICE"
                    options={priceOptions}
                    sectionKey="price"
                  />
                </>
              )}
            </div>

            {/* Mobile Apply Button */}
            <div className="mt-8">
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