import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui2/button';
import { Card } from '@/components/ui2/card';
import { Calendar, Wifi, Tv, Power, Car, Star, Armchair, Eye } from 'lucide-react';
import BusDetailsModal from './BusDetailsModal';

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

interface Bus {
  _id: string;
  // Backend fields
  type: string;
  brand: string;
  model: string;
  seatingCapacity: number;
  isAc: boolean;
  isSleeper: boolean;
  amenities: string[];
  pricing?: {
    baseFare: number;
    perKmRate: number;
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
  busName: string;
  busType: string;
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

interface BusListProps {
  searchParams?: {
    from?: string;
    to?: string;
    date?: string;
    time?: string;
  };
}

const BusCard = ({ bus, onViewDetails, onBookNow }: { 
  bus: Bus; 
  onViewDetails: (bus: Bus) => void;
  onBookNow: (bus: Bus) => void;
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
      case 'sleeper':
        return <div className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center text-xs text-purple-600 font-bold">S</div>;
      default:
        return <Car className="w-4 h-4" />;
    }
  };

  return (
    <Card className={`p-4 mb-4 border border-border hover:shadow-lg transition-shadow ${
      bus.isBooked ? 'bg-red-50 border-red-200 cursor-not-allowed' : 'cursor-pointer'
    }`} 
          onClick={() => {
            if (!bus.isBooked) {
              onViewDetails(bus);
            }
          }}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Vehicle Image - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:block lg:col-span-2">
          <img
            src={bus.image}
            alt={bus.busName}
            className="w-full h-20 object-cover rounded-md border border-border"
          />
        </div>

        {/* Bus Info */}
        <div className="lg:col-span-6">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-foreground">{bus.operatorName}</h3>
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 fill-warning text-warning" />
              <span className="font-medium">{bus.rating}</span>
              <span className="text-muted-foreground">({bus.reviewCount})</span>
            </div>
            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${bus.isBooked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {bus.isBooked ? 'Booked' : 'Available'}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">{bus.busName}</p>
          <p className="text-sm font-medium text-foreground mb-2">{bus.busType}</p>
          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
            <Armchair className="w-4 h-4 mr-1" />
            {bus.totalSeats} Seater
          </p>
          <p className="text-sm text-muted-foreground mb-2">Duration: {bus.duration}</p>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Max {bus.seatsLeft} passengers</span>
            </div>
          </div>
          
          {/* Vehicle Image on Mobile */}
          <div className="lg:hidden mb-3">
            <img
              src={bus.image}
              alt={bus.busName}
              className="w-full h-32 object-cover rounded-md border border-border"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {bus.amenities.map((amenity, index) => (
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
            <p className="text-2xl font-bold text-foreground">₹ {bus.fare}</p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              variant="outline" 
              size="lg"
              className="w-full border-2 hover:bg-muted/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(bus);
              }}
              disabled={bus.isBooked}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            <Button 
              variant="default" 
              size="lg"
              disabled={bus.isBooked}
              className={`w-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ${
                bus.isBooked 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary/90 text-white'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (!bus.isBooked) {
                  onBookNow(bus);
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

export const BusList = ({ searchParams }: BusListProps) => {
  const navigate = useNavigate();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchBuses = async (retryCount = 0) => {
      const maxRetries = 3;
      
      try {
        console.log(`Fetching all buses from ${API_BASE_URL}/vehicles/bus (attempt ${retryCount + 1})`);
        
        const response = await api.get('/vehicles/bus');
        
        console.log('Response status:', response.status);
        console.log('Full response:', response.data);

        const data = response.data.success ? response.data.data : [];
        console.log('Extracted data:', data);

        if (!Array.isArray(data)) {
          console.warn('API returned non-array data:', data);
          setBuses([]);
          return;
        }

        const processed = data.map((bus: Bus) => ({
          ...bus,
          operatorName: bus.driver ? `${bus.driver.firstName || ''} ${bus.driver.lastName || ''}`.trim() : 'Unknown Operator',
          busName: `${bus.brand || ''} ${bus.model || ''}`.trim(),
          busType: bus.type || 'Bus',
          duration: '4-6 hours', // TODO: replace with actual route calculation
          rating: bus.driver?.rating || 4.2,
          reviewCount: 45, // TODO: replace with actual reviews
          fare: bus.pricing?.baseFare || 800,
          seatsLeft: bus.seatingCapacity || 0,
          amenities: bus.amenities || [],
          image: bus.images?.find(img => img.isPrimary)?.url || bus.images?.[0]?.url || '/placeholder-bus.jpg',
          totalSeats: bus.seatingCapacity || 0,
          isBooked: searchParams?.date && bus.bookedDate === searchParams.date
        }));

        console.log('Processed buses:', processed);
        setBuses(processed);
        
      } catch (err) {
        console.error('Error fetching buses:', err);
        
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
          setTimeout(() => fetchBuses(retryCount + 1), (retryCount + 1) * 1000);
          return;
        }
        
        // Set empty array on final failure
        setBuses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
  }, [searchParams?.date]);

  const handleViewDetails = (bus: Bus) => {
    setSelectedBus(bus);
    setIsModalOpen(true);
  };

  const handleBookNow = (bus: Bus) => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedIn) {
      // Show booking confirmation message
      alert(`Bus Booking Confirmed!
      
Vehicle: ${bus.busName}
Operator: ${bus.operatorName}
From: Bangalore to Chennai
Date: 2024-01-15
Time: 22:00
Passengers: 1
Total Fare: ₹${bus.fare}
Seats: Front

Your bus booking has been confirmed. You will receive a confirmation SMS shortly.`);
    } else {
      // Redirect to auth page
      navigate('/auth', { 
        state: { 
          returnUrl: '/bookings'
        } 
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBus(null);
  };

  // Filter buses based on search date
  const filteredBuses = buses.map(bus => {
    if (searchParams?.date && bus.bookedDate === searchParams.date) {
      return { ...bus, isBooked: true };
    }
    return bus;
  });
  const availableBuses = filteredBuses.filter(bus => !bus.isBooked);
  const bookedBuses = filteredBuses.filter(bus => bus.isBooked);

  if (loading) {
    return <p className="text-center py-6">Loading buses...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          {filteredBuses.length} buses found
        </h2>
        <div className="text-sm text-muted-foreground">
          Showing buses from Bangalore to Chennai
        </div>
      </div>
      {/* Available Buses */}
      {availableBuses.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Available Buses ({availableBuses.length})
          </h3>
          {availableBuses.map((bus) => (
            <BusCard key={bus._id} bus={bus} onViewDetails={handleViewDetails} onBookNow={handleBookNow} />
          ))}
        </div>
      )}

      {/* Booked Buses */}
      {bookedBuses.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            Booked Buses ({bookedBuses.length})
          </h3>
          {bookedBuses.map((bus) => (
            <BusCard key={bus._id} bus={bus} onViewDetails={handleViewDetails} onBookNow={handleBookNow} />
          ))}
        </div>
      )}

      {/* No Buses Found */}
      {filteredBuses.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No buses found for the selected criteria.</p>
        </div>
      )}

      <BusDetailsModal 
        bus={selectedBus}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default BusList;

