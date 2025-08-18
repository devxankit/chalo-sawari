import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowLeftRight, Calendar, MapPin, Search, Bus, Plane, PlaneTakeoff, Home, List, HelpCircle, User, Train } from "lucide-react";
import HomeBanner from "@/assets/Home3.png";
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CarImg from "@/assets/Car2.png";
import BusImg from "@/assets/BusBar.png";
import TravellerImg from "@/assets/AutoLogo.png";
import React from "react";
import LocationAutocomplete from "./LocationAutocomplete";
import { LocationSuggestion } from "@/services/googleMapsService";



const LoadingAnimation = () => (
  <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
    <div className="flex space-x-8 animate-pulse">
      <img src={CarImg} alt="Car" className="w-20 h-20 object-contain animate-bounce" style={{animationDelay: '0ms'}} />
      <img src={BusImg} alt="Bus" className="w-20 h-20 object-contain animate-bounce" style={{animationDelay: '200ms'}} />
      <img src={TravellerImg} alt="Auto-Ricksaw" className="w-20 h-20 object-contain animate-bounce" style={{animationDelay: '400ms'}} />
    </div>
    <div className="mt-6 text-xl font-semibold text-primary">Searching best Vehicle for you...</div>
  </div>
);

const HeroSection = () => {
  const navigate = useNavigate();
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [departureDate, setDepartureDate] = useState("2025-08-04");
  const [returnDate, setReturnDate] = useState("2025-08-06");
  const [pickupTime, setPickupTime] = useState("09:00");
  const [selectedDate, setSelectedDate] = useState("04");
  const [activeService, setActiveService] = useState("oneWay");
  const [womenBooking, setWomenBooking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Store selected location data
  const [fromLocationData, setFromLocationData] = useState<LocationSuggestion | null>(null);
  const [toLocationData, setToLocationData] = useState<LocationSuggestion | null>(null);

  const fullText = "CHALO SAWARI";
  const blueText = "SAWARI";

  // Animation trigger on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Typing animation effect
  useEffect(() => {
    if (isVisible && currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(fullText.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 150); // Speed of typing (150ms per character)

      return () => clearTimeout(timeout);
    }
  }, [isVisible, currentIndex, fullText]);

  const handleSwapLocations = () => {
    const temp = fromLocation;
    const tempData = fromLocationData;
    
    setFromLocation(toLocation);
    setToLocation(temp);
    setFromLocationData(toLocationData);
    setToLocationData(tempData);
  };

  const handleSearch = () => {
    // Validate required fields
    if (!fromLocation.trim() || !toLocation.trim()) {
      alert("Please select both departure and destination locations");
      return;
    }
    
    if (!departureDate) {
      alert("Please select pickup date");
      return;
    }
    
    if (!pickupTime) {
      alert("Please select pickup time");
      return;
    }
    
    setLoading(true);
  };

  // Show loading for 2 seconds, then navigate
  React.useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoading(false);
        navigate('/vihicle-search', {
          state: {
            from: fromLocation,
            to: toLocation,
            fromData: fromLocationData,
            toData: toLocationData,
            date: departureDate,
            time: pickupTime,
            serviceType: activeService,
            returnDate: activeService === "roundTrip" ? returnDate : null
          }
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    // Update the actual date value based on selected date
    const baseDate = "2025-08-";
    setDepartureDate(baseDate + date.padStart(2, '0'));
  };

  // Function to render text with blue highlight for "SAWARI"
  const renderTypedText = () => {
    const parts = [];
    let currentPart = "";
    
    for (let i = 0; i < typedText.length; i++) {
      const char = typedText[i];
      currentPart += char;
      
      // Check if we've completed "CHALO " and are starting "SAWARI"
      if (typedText.slice(0, i + 1) === "CHALO " && i === 5) {
        parts.push(<span key={`part-${i}`} className="text-black">{currentPart}</span>);
        currentPart = "";
      }
      // Check if we're in the "SAWARI" part
      else if (typedText.slice(0, 6) === "CHALO " && i >= 6) {
        if (currentPart === "SAWARI") {
          parts.push(<span key={`part-${i}`} className="text-blue-600 animate-pulse">{currentPart}</span>);
          currentPart = "";
        }
      }
    }
    
    // Add any remaining text
    if (currentPart) {
      const isBluePart = typedText.startsWith("CHALO ") && typedText.length > 6;
      parts.push(
        <span key="remaining" className={isBluePart ? "text-blue-600 animate-pulse" : "text-black"}>
          {currentPart}
        </span>
      );
    }
    
    return parts;
  };

  return (
    <section className="relative min-h-[600px] flex flex-col bg-white">
      {loading && <LoadingAnimation />}
      
      {/* Static Banner - No animations as requested */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            <span className="text-white text-lg font-semibold">
            Low Cost Better Travels - Bus, Car & Auto-Ricksaw 
            </span>
          </div>
        </div>
      </div>
      
      {/* Mobile Layout - Show at top on mobile */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Bus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">CHALO SAWARI</h1>
                <p className="text-xs text-gray-600">24/7 Support</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Helpline</p>
              <p className="text-sm font-semibold text-primary">+91 9171838260</p>
            </div>
          </div>
        </div>

        {/* Top Service Navigation */}
        <div className={`flex justify-center space-x-4 p-4 border-b border-border bg-white transition-all duration-1000 ease-out delay-200 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
        }`}>
          <Button 
            variant={activeService === "oneWay" ? "default" : "outline"}
            size="sm"
            className={`${
              activeService === "oneWay" 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "text-muted-foreground border-border hover:bg-muted"
            } transition-all duration-300 hover:scale-105`}
            onClick={() => setActiveService("oneWay")}
          >
            One Way
          </Button>
          
          <Button 
            variant={activeService === "roundTrip" ? "default" : "outline"}
            size="sm"
            className={`${
              activeService === "roundTrip" 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "text-muted-foreground border-border hover:bg-muted"
            } transition-all duration-300 hover:scale-105`}
            onClick={() => setActiveService("roundTrip")}
          >
            Return Trip
          </Button>
        </div>

        {/* Main Content */}
        <div className={`flex-1 p-4 space-y-4 pb-20 bg-gray-50 transition-all duration-1000 ease-out delay-400 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>

          {/* Main Booking Card */}
          <Card className="p-6 bg-white shadow-lg rounded-2xl border-0 transition-all duration-300 hover:shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Book Your Journey</h2>
              <p className="text-sm text-gray-600">Find the best travel options for your trip</p>
            </div>
            
            {/* From Field */}
            <div className="mb-5 relative group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">From</label>
              <LocationAutocomplete
                value={fromLocation}
                onChange={setFromLocation}
                onLocationSelect={(location) => {
                  setFromLocationData(location);
                  setFromLocation(location.description);
                }}
                placeholder="Departure City ( कहाँ से )"
                icon={<Search className="w-4 h-4 text-primary" />}
                className="pl-14 h-14 border-2 border-gray-200 bg-white text-lg font-medium rounded-xl transition-all duration-300 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                showGetLocation={true}
              />
              {/* Swap Icon overlapping From field */}
              <div className="absolute right-5 top-full transform -translate-y-3 z-20">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-2 border-gray-200 hover:bg-primary/10 hover:border-primary transition-all duration-300 w-10 h-10 shadow-md bg-white hover:scale-110 hover:rotate-180"
                  onClick={handleSwapLocations}
                >
                  <ArrowLeftRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* To Field */}
            <div className="mb-5 relative group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">To</label>
              <LocationAutocomplete
                value={toLocation}
                onChange={setToLocation}
                onLocationSelect={(location) => {
                  setToLocationData(location);
                  setToLocation(location.description);
                }}
                placeholder="Destination City ( कहाँ तक )"
                icon={<MapPin className="w-4 h-4 text-primary" />}
                className="pl-14 h-14 border-2 border-gray-200 bg-white text-lg font-medium rounded-xl transition-all duration-300 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Date and Time Row */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              {/* Date of Journey */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="pl-10 h-12 border-2 border-gray-200 rounded-lg transition-all duration-300 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Pickup Time */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup Time</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="pl-10 h-12 border-2 border-gray-200 rounded-lg transition-all duration-300 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Return Date - Only show for Round Trip */}
            {activeService === "roundTrip" && (
              <div className="mb-5 group animate-in slide-in-from-right duration-500">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Return Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="pl-10 h-12 border-2 border-gray-200 rounded-lg transition-all duration-300 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Search Button - Mobile */}
          <Button 
            className="w-full h-16 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:-translate-y-1"
            onClick={handleSearch}
          >
            <Search className="w-6 h-6 mr-3 transition-all duration-300 group-hover:rotate-12" />
            Search Vehicles
          </Button>
        </div>

        {/* Bottom Navigation */}
        <div className={`fixed bottom-0 left-0 right-0 border-t border-border bg-background z-50 transition-all duration-1000 ease-out delay-600 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="flex justify-around py-2">
            <Link to="/" className="flex flex-col items-center space-y-1 transition-all duration-300 hover:scale-110">
              <Home className="w-5 h-5 text-primary transition-all duration-300 hover:rotate-12" />
              <span className="text-xs text-primary font-medium">Home</span>
            </Link>
            <Link to="/bookings" className="flex flex-col items-center space-y-1 transition-all duration-300 hover:scale-110">
              <List className="w-5 h-5 text-muted-foreground transition-all duration-300 hover:text-primary hover:rotate-12" />
              <span className="text-xs text-muted-foreground transition-all duration-300 hover:text-primary">Bookings</span>
            </Link>
            <Link to="/help" className="flex flex-col items-center space-y-1 transition-all duration-300 hover:scale-110">
              <HelpCircle className="w-5 h-5 text-muted-foreground transition-all duration-300 hover:text-primary hover:rotate-12" />
              <span className="text-xs text-muted-foreground transition-all duration-300 hover:text-primary">Help</span>
            </Link>
            <Link to="/profile" className="flex flex-col items-center space-y-1 transition-all duration-300 hover:scale-110">
              <User className="w-5 h-5 text-muted-foreground transition-all duration-300 hover:text-primary hover:rotate-12" />
              <span className="text-xs text-muted-foreground transition-all duration-300 hover:text-primary">Account</span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Desktop Hero Content - Hidden on mobile */}
      <div className="hidden md:block relative min-h-[580px] flex items-center justify-center bg-cover bg-center contrast-125"
        style={{ backgroundImage: `url(${HomeBanner})` }}>
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="relative z-10 container mx-auto px-4 -ml-20">
          <div className={`text-right mb-8 transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <h1 className="text-5x1 md:text-7xl font-bold mt-6 mr-44">
              <span className="inline-block">
                {renderTypedText()}
                {/* Blinking cursor effect */}
                <span className={`inline-block w-1 h-16 bg-blue-600 ml-1 ${currentIndex < fullText.length ? 'animate-pulse' : 'opacity-0'}`}></span>
              </span>
            </h1>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:block">
            {/* Service Type Selection */}
            <div className={`flex justify-center space-x-4 -mt-3 mb-12 ml-[500px] transition-all duration-1000 ease-out delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <Button 
                variant={activeService === "oneWay" ? "default" : "outline"}
                size="sm"
                className={`${
                  activeService === "oneWay" 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "text-muted-foreground border-border hover:bg-muted bg-white"
                } transition-all duration-300 hover:scale-105 hover:shadow-lg`}
                onClick={() => setActiveService("oneWay")}
              >
                One Way
              </Button>
              
              <Button 
                variant={activeService === "roundTrip" ? "default" : "outline"}
                size="sm"
                className={`${
                  activeService === "roundTrip" 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "text-muted-foreground border-border hover:bg-muted bg-white"
                } transition-all duration-300 hover:scale-105 hover:shadow-lg`}
                onClick={() => setActiveService("roundTrip")}
              >
                Return Trip
              </Button>
            </div>

            <Card className={`max-w-6xl px-6 pt-4 pb-6 bg-white/95 backdrop-blur-md shadow-2xl border-0 rounded-2xl -mt-10 ml-[450px] transition-all duration-1000 ease-out delay-500 ${
              isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
            } hover:shadow-3xl hover:scale-[1.02]`}>
              <div className={`grid gap-6 items-end -mt-2 ${activeService === "roundTrip" ? "grid-cols-5" : "grid-cols-4"}`}>
                {/* From */}
                <div className="space-y-2 relative group">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide transition-all duration-300 group-hover:text-blue-600">From</label>
                  <LocationAutocomplete
                    value={fromLocation}
                    onChange={setFromLocation}
                    onLocationSelect={(location) => {
                      setFromLocationData(location);
                      setFromLocation(location.description);
                    }}
                      placeholder="Departure ( कहाँ से )"
                    icon={<Search className="w-4 h-4 text-blue-600" />}
                      className="pl-12 h-14 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-base hover:border-blue-300 hover:shadow-md"
                    showGetLocation={true}
                    />
                  {/* Swap Icon overlapping From field */}
                  <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 z-20">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="rounded-full w-10 h-10 bg-white shadow-lg hover:bg-blue-50 hover:border-blue-500 transition-all duration-300 border-gray-200 hover:scale-110 hover:rotate-180 hover:shadow-xl"
                      onClick={handleSwapLocations}
                      title="Swap locations"
                    >
                      <ArrowLeftRight className="w-5 h-5 text-gray-600" />
                    </Button>
                  </div>
                </div>

                {/* To */}
                <div className="space-y-2 relative group">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide transition-all duration-300 group-hover:text-green-600">To</label>
                  <LocationAutocomplete
                    value={toLocation}
                    onChange={setToLocation}
                    onLocationSelect={(location) => {
                      setToLocationData(location);
                      setToLocation(location.description);
                    }}
                      placeholder="Destination ( कहाँ तक )"
                    icon={<MapPin className="w-4 h-4 text-green-600" />}
                      className="pl-12 h-14 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 text-base hover:border-green-300 hover:shadow-md"
                    />
                </div>

                {/* Departure Date */}
                <div className="space-y-2 group">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide transition-all duration-300 group-hover:text-purple-600">Pickup Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-500 w-5 h-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                    <Input
                      type="date"
                      className="pl-12 h-14 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-base hover:border-purple-300 hover:shadow-md"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Pickup Time */}
                <div className="space-y-2 group">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide transition-all duration-300 group-hover:text-orange-600">Pickup Time</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-500 w-5 h-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                    <Input
                      type="time"
                      className="pl-12 h-14 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 text-base hover:border-orange-300 hover:shadow-md"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Return Date - Only show for Round Trip */}
                {activeService === "roundTrip" && (
                  <div className="space-y-2 group animate-in slide-in-from-right duration-500">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide transition-all duration-300 group-hover:text-red-600">Return</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                      <Input
                        type="date"
                        className="pl-12 h-14 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 text-base hover:border-red-300 hover:shadow-md"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}


              </div>
            </Card>
            
            {/* Search Button - Outside Card */}
            <div className={`flex justify-center mt-6 ml-[450px] transition-all duration-1000 ease-out delay-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <Button 
                className="-mt-11 h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 rounded-3xl shadow-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:-translate-y-1"
                onClick={handleSearch}
              >
                <Search className="w-5 h-5 mr-3 transition-all duration-300 group-hover:rotate-12" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;