import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui2/button';
import { Card } from '@/components/ui2/card';
import { Badge } from '@/components/ui2/badge';
import { Star, Wifi, Tv, Power, Car, Eye, Users, Shield, Armchair } from 'lucide-react';
import Car1 from '@/assets/Car1.webp';
import Car2 from '@/assets/Car2.png';
import Car3 from '@/assets/Car3.png';
import Car4 from '@/assets/Car4.webp';
import CarDetailsModal from './CarDetailsModal';

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

interface Car {
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
  carName: string;
  carType: string;
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

interface CarListProps {
  searchParams?: {
    from?: string;
    to?: string;
    date?: string;
    time?: string;
  };
}

const CarCard = ({ car, onViewDetails, onBookNow }: { 
  car: Car; 
  onViewDetails: (car: Car) => void;
  onBookNow: (car: Car) => void;
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
      default:
        return <Car className="w-4 h-4" />;
    }
  };

  return (
    <Card className={`p-4 mb-4 border border-border hover:shadow-lg transition-shadow ${
      car.isBooked ? 'bg-red-50 border-red-200 cursor-not-allowed' : 'cursor-pointer'
    }`} 
          onClick={() => {
            if (!car.isBooked) {
              onViewDetails(car);
            }
          }}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Vehicle Image - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:block lg:col-span-2">
          <img
            src={car.image}
            alt={car.carName}
            className="w-full h-20 object-cover rounded-md border border-border"
          />
        </div>

        {/* Car Info */}
        <div className="lg:col-span-6">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-foreground">{car.operatorName}</h3>
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 fill-warning text-warning" />
              <span className="font-medium">{car.rating}</span>
              <span className="text-muted-foreground">({car.reviewCount})</span>
            </div>
            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${car.isBooked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {car.isBooked ? 'Booked' : 'Available'}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">{car.carName}</p>
          <p className="text-sm font-medium text-foreground mb-2">{car.carType}</p>
          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
            <Armchair className="w-4 h-4 mr-1" />
            {car.totalSeats} Seater
          </p>
          <p className="text-sm text-muted-foreground mb-2">Duration: {car.duration}</p>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Max {car.seatsLeft} passengers</span>
            </div>
          </div>
          
          {/* Vehicle Image on Mobile */}
          <div className="lg:hidden mb-3">
            <img
              src={car.image}
              alt={car.carName}
              className="w-full h-32 object-cover rounded-md border border-border"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {car.amenities.map((amenity, index) => (
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
            <p className="text-2xl font-bold text-foreground">₹ {car.fare}</p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              variant="outline" 
              size="lg"
              className="w-full border-2 hover:bg-muted/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(car);
              }}
              disabled={car.isBooked}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            <Button 
              variant="default" 
              size="lg"
              disabled={car.isBooked}
              className={`w-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ${
                car.isBooked 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary/90 text-white'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (!car.isBooked) {
                  onBookNow(car);
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

export const CarList = ({ searchParams }: CarListProps) => {
  const navigate = useNavigate();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchCars = async (retryCount = 0) => {
      const maxRetries = 3;
      
      try {
        console.log(`Fetching all cars from ${API_BASE_URL}/vehicles/car (attempt ${retryCount + 1})`);
        
        const response = await api.get('/vehicles/car');
        
        console.log('Response status:', response.status);
        console.log('Full response:', response.data);

        const data = response.data.success ? response.data.data : [];
        console.log('Extracted data:', data);

        if (!Array.isArray(data)) {
          console.warn('API returned non-array data:', data);
          setCars([]);
          return;
        }

        const processed = data.map((car: Car) => ({
          ...car,
          operatorName: car.driver ? `${car.driver.firstName || ''} ${car.driver.lastName || ''}`.trim() : 'Unknown Operator',
          carName: `${car.brand || ''} ${car.model || ''}`.trim(),
          carType: car.type || 'Car',
          duration: '4-6 hours', // TODO: replace with actual route calculation
          rating: car.driver?.rating || 4.2,
          reviewCount: 45, // TODO: replace with actual reviews
          fare: car.pricing?.baseFare || 800,
          seatsLeft: car.seatingCapacity || 0,
          amenities: car.amenities || [],
          image: car.images?.find(img => img.isPrimary)?.url || car.images?.[0]?.url || Car1,
          totalSeats: car.seatingCapacity || 0,
          isBooked: searchParams?.date && car.bookedDate === searchParams.date
        }));

        console.log('Processed cars:', processed);
        setCars(processed);
        
      } catch (err) {
        console.error('Error fetching cars:', err);
        
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
          setTimeout(() => fetchCars(retryCount + 1), (retryCount + 1) * 1000);
          return;
        }
        
        // Set empty array on final failure
        setCars([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [searchParams?.date]);

  const handleViewDetails = (car: Car) => {
    setSelectedCar(car);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCar(null);
  };

  const handleBookNow = (car: Car) => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedIn) {
      // Show booking confirmation message
      alert(`Booking Confirmed!
      
Vehicle: ${car.carName}
Operator: ${car.operatorName}
From: Bangalore to Chennai
Date: 2024-01-15
Time: 22:00
Passengers: 1
Total Fare: ₹${car.fare}
Seats: Front

Your booking has been confirmed. You will receive a confirmation SMS shortly.`);
    } else {
      // Redirect to auth page
      navigate('/auth', { 
        state: { 
          returnUrl: '/bookings'
        } 
      });
    }
  };

  // Filter cars based on search date
  const filteredCars = cars.map(car => {
    if (searchParams?.date && car.bookedDate === searchParams.date) {
      return { ...car, isBooked: true };
    }
    return car;
  });
  const availableCars = filteredCars.filter(car => !car.isBooked);
  const bookedCars = filteredCars.filter(car => car.isBooked);

  if (loading) {
    return <p className="text-center py-6">Loading cars...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          {filteredCars.length} cars found
        </h2>
        <div className="text-sm text-muted-foreground">
          Showing cars from Bangalore to Chennai
        </div>
      </div>
      {/* Available Cars */}
      {availableCars.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Available Cars ({availableCars.length})
          </h3>
          {availableCars.map((car) => (
            <CarCard key={car._id} car={car} onViewDetails={handleViewDetails} onBookNow={handleBookNow} />
          ))}
        </div>
      )}

      {/* Booked Cars */}
      {bookedCars.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            Booked Cars ({bookedCars.length})
          </h3>
          {bookedCars.map((car) => (
            <CarCard key={car._id} car={car} onViewDetails={handleViewDetails} onBookNow={handleBookNow} />
          ))}
        </div>
      )}

      {/* No Cars Found */}
      {filteredCars.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No cars found for the selected criteria.</p>
        </div>
      )}

      <CarDetailsModal 
        car={selectedCar}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default CarList; 