import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui2/button';
import { Card } from '@/components/ui2/card';
import { Badge } from '@/components/ui2/badge';
import { Star, Wifi, Tv, Power, Car, Eye, Users, Armchair } from 'lucide-react';
import AutoDetailsModal from './AutoDetailsModal';

// Configure axios base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

interface Auto {
  _id: string;
  // Backend fields
  type: string;
  brand: string;
  model: string;
  seatingCapacity: number;
  isAc: boolean;
  amenities: string[];
  pricing?: {
    baseFare: number;
    perKmRate: number;
  };
  pricingReference?: {
    category: 'auto' | 'car' | 'bus';
    vehicleType: string;
    vehicleModel: string;
  };
  computedPricing?: {
    basePrice: number;
    distancePricing: {
      '50km': number;
      '100km': number;
      '150km': number;
      '200km': number;
    };
    category: string;
    vehicleType: string;
    vehicleModel: string;
  };
  images?: Array<{
    url: string;
    isPrimary: boolean;
  }>;
  driver?: {
    firstName: string;
    lastName: string;
    rating: number;
    phone: string;
    isOnline: boolean;
  };
  // Frontend display fields (computed)
  operatorName: string;
  autoName: string;
  autoType: string;
  duration: string;
  rating: number;
  reviewCount: number;
  fare: number;
  seatsLeft: number;
  image: string;
  totalSeats: number;
  isBooked?: boolean;
  bookedDate?: string;
}

interface AutoListProps {
  searchParams?: {
    from?: string;
    to?: string;
    date?: string;
    time?: string;
  };
}

const AutoCard = ({ auto, onViewDetails, onBookNow }: { 
  auto: Auto; 
  onViewDetails: (auto: Auto) => void;
  onBookNow: (auto: Auto) => void;
}) => {
  const renderAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case 'wifi':
        return <Wifi className="w-4 h-4" />;
      case 'tv':
        return <Tv className="w-4 h-4" />;
      case 'power':
        return <Power className="w-4 h-4" />;
      case 'ac':
        return <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center text-xs text-blue-600 font-bold">AC</div>;
      case 'charging':
        return <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center text-xs text-green-600 font-bold">⚡</div>;
      case 'usb':
        return <div className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center text-xs text-purple-600 font-bold">USB</div>;
      default:
        return <Car className="w-4 h-4" />;
    }
  };

  return (
    <Card className={`p-4 mb-4 border border-border hover:shadow-lg transition-shadow ${
      auto.isBooked ? 'bg-red-50 border-red-200 cursor-not-allowed' : 'cursor-pointer'
    }`} 
          onClick={() => {
            if (!auto.isBooked) {
              onViewDetails(auto);
            }
          }}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Vehicle Image - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:block lg:col-span-2">
          <img
            src={auto.image}
            alt={auto.autoName}
            className="w-full h-20 object-cover rounded-md border border-border"
          />
        </div>

        {/* Auto Info */}
        <div className="lg:col-span-6">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-foreground">{auto.operatorName}</h3>
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 fill-warning text-warning" />
              <span className="font-medium">{auto.rating}</span>
              <span className="text-muted-foreground">({auto.reviewCount})</span>
            </div>
            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${auto.isBooked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {auto.isBooked ? 'Booked' : 'Available'}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">{auto.autoName}</p>
          <p className="text-sm font-medium text-foreground mb-2">{auto.autoType}</p>
          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
            <Armchair className="w-4 h-4 mr-1" />
            {auto.totalSeats} Seater
          </p>
          <p className="text-sm text-muted-foreground mb-2">Duration: {auto.duration}</p>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Max {auto.seatsLeft} passengers</span>
            </div>
          </div>
          
          {/* Vehicle Image on Mobile */}
          <div className="lg:hidden mb-3">
            <img
              src={auto.image}
              alt={auto.autoName}
              className="w-full h-32 object-cover rounded-md border border-border"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {auto.amenities.map((amenity, index) => (
              <div key={index} className="flex items-center text-muted-foreground">
                {renderAmenityIcon(amenity)}
              </div>
            ))}
          </div>
        </div>

        {/* Pricing and Action */}
        <div className="lg:col-span-4">
          <div className="mb-4 text-right">
            <p className="text-sm text-muted-foreground">Starts from</p>
            <p className="text-2xl font-bold text-foreground">₹ {auto.fare}</p>
            {!auto.computedPricing && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ {!auto.pricingReference ? 'Pricing reference missing' : 'Admin pricing not set'}
              </p>
            )}
            {auto.pricing?.baseFare && !auto.computedPricing && (
              <p className="text-xs text-blue-600 mt-1">
                ℹ️ Using legacy pricing: ₹{auto.pricing.baseFare}
              </p>
            )}
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              variant="outline" 
              size="lg"
              className="w-full border-2 hover:bg-muted/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(auto);
              }}
              disabled={auto.isBooked}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            <Button 
              variant="default" 
              size="lg"
              disabled={auto.isBooked}
              className={`w-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ${
                auto.isBooked 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary/90 text-white'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (!auto.isBooked) {
                  onBookNow(auto);
                }
              }}
            >
              Book Now
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const AutoList = ({ searchParams }: AutoListProps) => {
  const navigate = useNavigate();
  const [selectedAuto, setSelectedAuto] = useState<Auto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [autos, setAutos] = useState<Auto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAutos = async (retryCount = 0) => {
      const maxRetries = 3;
      
      try {
        console.log(`Fetching all autos from ${API_BASE_URL}/vehicles/auto (attempt ${retryCount + 1})`);
        
        const response = await api.get('/vehicles/auto');
        
        console.log('Response status:', response.status);
        console.log('Full response:', response.data);

        const data = response.data.success ? response.data.data : [];
        console.log('Extracted data:', data);
        
        // Debug: Check if any autos have computedPricing
        if (Array.isArray(data) && data.length > 0) {
          console.log('🔍 Checking computedPricing for all autos:');
          data.forEach((auto, index) => {
            console.log(`Auto ${index + 1}:`, {
              id: auto._id,
              hasPricingReference: !!auto.pricingReference,
              hasComputedPricing: !!auto.computedPricing,
              pricingReference: auto.pricingReference,
              computedPricing: auto.computedPricing
            });
          });
        }

        if (!Array.isArray(data)) {
          console.warn('API returned non-array data:', data);
          setAutos([]);
          return;
        }

        const processed = data.map((auto: Auto) => {
          // Debug logging to see what pricing data we're getting
          console.log('🔍 Auto pricing debug:', {
            id: auto._id,
            pricingReference: auto.pricingReference,
            pricingReferenceDetails: {
              category: auto.pricingReference?.category,
              vehicleType: auto.pricingReference?.vehicleType,
              vehicleModel: auto.pricingReference?.vehicleModel
            },
            computedPricing: auto.computedPricing,
            basePrice: auto.computedPricing?.basePrice,
            finalFare: auto.computedPricing?.basePrice || 50
          });
          
          return {
            ...auto,
            operatorName: auto.driver ? `${auto.driver.firstName || ''} ${auto.driver.lastName || ''}`.trim() : 'Unknown Driver',
            autoName: `${auto.brand || ''} ${auto.model || ''}`.trim(),
            autoType: auto.type || 'Auto',
            duration: '30 mins', // TODO: replace with actual route calculation
            rating: auto.driver?.rating || 4.0,
            reviewCount: 25, // TODO: replace with actual reviews
            fare: (() => {
              // Try computedPricing first (new system)
              if (auto.computedPricing?.basePrice) {
                console.log(`✅ Using computed pricing for auto ${auto._id}: ₹${auto.computedPricing.basePrice}`);
                return auto.computedPricing.basePrice;
              }
              
              // Fallback to old pricing structure
              if (auto.pricing?.baseFare) {
                console.log(`⚠️ Using old pricing structure for auto ${auto._id}: ₹${auto.pricing.baseFare}`);
                return auto.pricing.baseFare;
              }
              
              // Final fallback
              console.warn(`❌ Auto ${auto._id} has no pricing data, using fallback price 50`);
              return 50;
            })(),
            seatsLeft: auto.seatingCapacity || 0,
            amenities: auto.amenities || [],
            image: auto.images?.find(img => img.isPrimary)?.url || auto.images?.[0]?.url || '/placeholder-vehicle.jpg',
            isAc: auto.isAc,
            totalSeats: auto.seatingCapacity || 0,
            isBooked: searchParams?.date && auto.bookedDate === searchParams.date
          };
        });

        console.log('Processed autos:', processed);
        setAutos(processed);
        
      } catch (err) {
        console.error('Error fetching autos:', err);
        
        if (axios.isAxiosError(err)) {
          if (err.response) {
            console.error('Response error:', {
              status: err.response.status,
              data: err.response.data,
              headers: err.response.headers
            });
            
            // Handle specific error cases
            if (err.response.status === 404) {
              console.error('API endpoint not found. Check if backend server is running on correct port.');
            } else if (err.response.status >= 500) {
              console.error('Server error. Backend may be down or experiencing issues.');
            }
          } else if (err.request) {
            console.error('Network error - no response received:', err.request);
            console.error('Check if backend server is running on:', API_BASE_URL);
          } else {
            console.error('Request setup error:', err.message);
          }
        } else {
          console.error('Non-axios error:', err);
        }
        
        // Retry logic for network errors
        if (retryCount < maxRetries && (!axios.isAxiosError(err) || !err.response)) {
          console.log(`Retrying in ${(retryCount + 1) * 1000}ms...`);
          setTimeout(() => fetchAutos(retryCount + 1), (retryCount + 1) * 1000);
          return;
        }
        
        // Set empty array on final failure
        setAutos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAutos();
  }, [searchParams?.date]);

  const handleViewDetails = (auto: Auto) => {
    setSelectedAuto(auto);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAuto(null);
  };

  const handleBookNow = (auto: Auto) => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedIn) {
      // Show booking confirmation message
      alert(`Auto Booking Confirmed!
      
Vehicle: ${auto.autoName}
Operator: ${auto.operatorName}
From: Bangalore to Chennai
Date: 2024-01-15
Time: 22:00
Passengers: 1
Total Fare: ₹${auto.fare}
Seats: Front

Your auto booking has been confirmed. You will receive a confirmation SMS shortly.`);
    } else {
      // Redirect to auth page
      navigate('/auth', { 
        state: { 
          returnUrl: '/bookings'
        } 
      });
    }
  };

  // Filter autos based on search date
  const filteredAutos = autos.map(auto => {
    if (searchParams?.date && auto.bookedDate === searchParams.date) {
      return { ...auto, isBooked: true };
    }
    return auto;
  });
  const availableAutos = filteredAutos.filter(auto => !auto.isBooked);
  const bookedAutos = filteredAutos.filter(auto => auto.isBooked);

  if (loading) {
    return <p className="text-center py-6">Loading autos...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          {filteredAutos.length} autos found
        </h2>
        <div className="text-sm text-muted-foreground">
          Showing autos from Bangalore to Chennai
        </div>
      </div>
      {/* Available Autos */}
      {availableAutos.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Available Autos ({availableAutos.length})
          </h3>
          {availableAutos.map((auto) => (
            <AutoCard key={auto._id} auto={auto} onViewDetails={handleViewDetails} onBookNow={handleBookNow} />
          ))}
        </div>
      )}

      {/* Booked Autos */}
      {bookedAutos.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            Booked Autos ({bookedAutos.length})
          </h3>
          {bookedAutos.map((auto) => (
            <AutoCard key={auto._id} auto={auto} onViewDetails={handleViewDetails} onBookNow={handleBookNow} />
          ))}
        </div>
      )}

      {/* No Autos Found */}
      {filteredAutos.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No autos found for the selected criteria.</p>
        </div>
      )}

      <AutoDetailsModal 
        auto={selectedAuto}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default AutoList;
