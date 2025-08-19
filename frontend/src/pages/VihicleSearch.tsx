import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation } from 'react-router-dom';
import TopNavigation from '@/components/TopNavigation';
import BusList from '@/components/BusList';
import CarList from '@/components/CarList';
import AutoList from '@/components/AutoList';
import FilterSidebar from '@/components/FilterSidebar';
import AutoLogo from '@/assets/AutoLogo.png';
import CarBar from '@/assets/CarBar.png';
import BusBar from '@/assets/BusBar.png';
import BusHover from '@/assets/BusHover.png';
import CarBarHover from '@/assets/CarBarHover.png';
import AutoHover from '@/assets/autoHover.png';

const VihicleSearch = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [isFilterOpen, setIsFilterOpen] = useState(!isMobile);
  const [selectedType, setSelectedType] = useState<'bus' | 'car' | 'auto'>('bus');

  // Get search parameters from hero section
  const searchParams = location.state || {};
  const { from, to, pickupDate, pickupTime, serviceType, returnDate, fromData, toData } = searchParams;
  


  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const handleLogoClick = (type: 'bus' | 'car' | 'auto') => {
    setSelectedType(type);
  };

  const renderList = () => {
    switch (selectedType) {
      case 'car':
        return <CarList searchParams={searchParams} />;
      case 'auto':
        return <AutoList searchParams={searchParams} />;
      case 'bus':
      default:
        return <BusList searchParams={searchParams} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <TopNavigation />
      
      {/* Logo Grid Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-4 border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-1 ">
          {/* Mobile: horizontal scroll, Desktop: grid */}
          <div className="flex lg:grid lg:grid-cols-3 gap-2 lg:gap-0 overflow-x-auto scrollbar-hide rounded-2xl shadow-xl bg-white divide-x-0 lg:divide-x lg:overflow-visible">
            {/* Auto-Ricksaw Logo */}
            <div 
              className={`flex flex-col items-center justify-center p-3 min-w-[130px] cursor-pointer transition-all duration-300 ${
                selectedType === 'auto' 
                  ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-xl transform scale-105' 
                  : 'bg-white hover:bg-purple-50 hover:shadow-md'
              }`}
              onClick={() => handleLogoClick('auto')}
            >
              <img 
                src={selectedType === 'auto' ? AutoHover : AutoLogo} 
                alt="Auto-Ricksaw" 
                className={`h-16 w-auto object-contain transition-all duration-300 ${
                  selectedType === 'auto' ? 'drop-shadow-lg' : ''
                }`}
              />
              <span className={`text-sm font-bold mt-1 ${selectedType === 'auto' ? 'text-white' : 'text-gray-800'}`}>Auto-Ricksaw</span>
            </div>
            {/* Car Logo */}
            <div 
              className={`flex flex-col items-center justify-center p-3 min-w-[130px] cursor-pointer transition-all duration-300 ${
                selectedType === 'car' 
                  ? 'bg-gradient-to-br from-green-500 to-green-700 text-white shadow-xl transform scale-105' 
                  : 'bg-white hover:bg-green-50 hover:shadow-md'
              }`}
              onClick={() => handleLogoClick('car')}
            >
              <img 
                src={selectedType === 'car' ? CarBarHover : CarBar} 
                alt="Car Bar" 
                className={`h-16 w-auto object-contain transition-all duration-300 ${
                  selectedType === 'car' ? 'drop-shadow-lg' : ''
                }`}
              />
              <span className={`text-sm font-bold mt-1 ${selectedType === 'car' ? 'text-white' : 'text-gray-800'}`}>Car</span>
            </div>
             {/* Bus Logo */}
             <div 
              className={`flex flex-col items-center justify-center p-3 min-w-[120px] cursor-pointer transition-all duration-300 ${
                selectedType === 'bus' 
                  ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-xl transform scale-105' 
                  : 'bg-white hover:bg-blue-50 hover:shadow-md'
              }`}
              onClick={() => handleLogoClick('bus')}
            >
              <img src={selectedType === 'bus' ? BusHover : BusBar} alt="Bus Logo" 
                className={` h-16 w-auto object-contain transition-all duration-300  ${
                  selectedType === 'bus' ? 'drop-shadow-lg' : ''
                }`}
              />
              <span className={`text-sm font-bold mt-1 ${selectedType === 'bus' ? 'text-white' : 'text-gray-800'}`}>Bus</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Mobile Layout */}
        {isMobile ? (
          <div className="space-y-4">
            {/* Filter Sidebar for Mobile - Redbus.in style */}
            <div className="mb-2">
              <FilterSidebar 
                isOpen={isFilterOpen} 
                onToggle={toggleFilter}
                selectedType={selectedType}
              />
            </div>
            {/* List Content for Mobile */}
            <div className="bg-white rounded-xl shadow-lg p-2 sm:p-4">
              {renderList()}
            </div>
          </div>
        ) : (
          /* Desktop Layout */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filter Sidebar */}
            <div className="lg:col-span-1">
              <FilterSidebar 
                isOpen={isFilterOpen} 
                onToggle={toggleFilter}
                selectedType={selectedType}
              />
            </div>
            {/* List Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-lg p-6">
                {renderList()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VihicleSearch;