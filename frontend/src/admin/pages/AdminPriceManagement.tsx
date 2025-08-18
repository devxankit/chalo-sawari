import { useState, useEffect } from "react";
import AdminLayout from "@/admin/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus,
  Edit,
  Settings
} from "lucide-react";
import { toast } from "@/hooks/use-toast";



const AdminPriceManagement = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'auto-ricksaw' | 'car' | 'bus' | ''>('');
  const [prices, setPrices] = useState({
    'auto-ricksaw': {
      'Fuel Auto-Ricksaw': 30,
      'Electric Auto-Ricksaw': 35,
      'CNG Auto-Ricksaw': 32,
    },
    'car': {
      'Sedan': 40,
      'Hatchback': 35,
      'SUV': 50,
    },
    'bus': {
      'AC Sleeper': 120,
      'Non-AC Sleeper': 100,
      '52-Seater AC/Non-AC': 90,
      '40-Seater AC/Non-AC': 85,
      '32-Seater AC/Non-AC': 80,
      '26-Seater AC/Non-AC': 75,
      '17-Seater AC/Non-AC': 70,
    }
  });

  // Car variants with individual pricing
  const [carVariantPrices, setCarVariantPrices] = useState({
    'sedan': {
      'Honda Amaze': 42,
      'Swift Dzire': 40,
      'Ertiga': 45,
      'Hundai Aura': 38,
      'Honda City': 48,
      'Ciaz': 50,
      'Xcent Hundai': 35,
    },
    'hatchback': {
      'Wagon R': 32,
      'Swift': 35,
      'Tiago': 30,
      'Renault Climber': 33,
    },
    'suv': {
      'Scorpio N': 55,
      'Bolero': 45,
      'Scorpio Classic': 52,
      'Inova Crysta': 58,
      'Fortuner': 75,
      'Renault Triber': 48,
    }
  });
  const [editPrices, setEditPrices] = useState(prices);
  const [editCarVariantPrices, setEditCarVariantPrices] = useState(carVariantPrices);
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [isEditingCarVariants, setIsEditingCarVariants] = useState(false);
  const [priceCalculator, setPriceCalculator] = useState({
    departure: "Delhi",
    destination: "Mumbai",
    distance: 1400, // in kilometers
    vehicleType: "Sedan" as string
  });

  const handlePriceChange = (category: 'auto-ricksaw' | 'car' | 'bus', vehicleType: string, value: string) => {
    setEditPrices((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [vehicleType]: Number(value)
      }
    }));
  };

  const handleCarVariantPriceChange = (carType: string, variant: string, value: string) => {
    setEditCarVariantPrices((prev) => ({
      ...prev,
      [carType]: {
        ...prev[carType as keyof typeof prev],
        [variant]: Number(value)
      }
    }));
  };

  const handleCalculatorChange = (field: string, value: string) => {
    setPriceCalculator((prev) => ({ ...prev, [field]: value }));
  };

  const calculateFare = () => {
    // First check if it's a car variant
    for (const carType in carVariantPrices) {
      if (carVariantPrices[carType as keyof typeof carVariantPrices] && 
          priceCalculator.vehicleType in (carVariantPrices[carType as keyof typeof carVariantPrices] as any)) {
        const rate = (carVariantPrices[carType as keyof typeof carVariantPrices] as any)[priceCalculator.vehicleType];
        return rate * priceCalculator.distance;
      }
    }
    
    // If not a car variant, check main categories
    for (const category in prices) {
      if (prices[category as keyof typeof prices] && 
          typeof prices[category as keyof typeof prices] === 'object' &&
          priceCalculator.vehicleType in (prices[category as keyof typeof prices] as any)) {
        const rate = (prices[category as keyof typeof prices] as any)[priceCalculator.vehicleType];
        return rate * priceCalculator.distance;
      }
    }
    
    return 0;
  };

  const savePrices = () => {
    setPrices(editPrices);
    setIsEditingPrices(false);
    toast({ title: 'Prices updated successfully!' });
  };

  const saveCarVariantPrices = () => {
    setCarVariantPrices(editCarVariantPrices);
    setIsEditingCarVariants(false);
    toast({ title: 'Car variant prices updated successfully!' });
  };

  useEffect(() => {
    setIsLoggedIn(true);
  }, []);





  // ProtectedAdminRoute enforces auth; render content

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Price Management</h1>
        <p className="text-sm md:text-base text-gray-600">Manage vehicle prices and fare calculations</p>
      </div>

      {/* Vehicle Category Selection */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Select Vehicle Category to Manage Prices</h2>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setSelectedCategory('auto-ricksaw')}
            className={`p-4 border-2 rounded-lg text-center transition-all duration-200 ${
              selectedCategory === 'auto-ricksaw'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-2xl mb-2">🛺</div>
            <div className="font-medium">Auto-Ricksaw</div>
          </button>
          <button
            onClick={() => setSelectedCategory('car')}
            className={`p-4 border-2 rounded-lg text-center transition-all duration-200 ${
              selectedCategory === 'car'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-2xl mb-2">🚗</div>
            <div className="font-medium">Car</div>
          </button>
          <button
            onClick={() => setSelectedCategory('bus')}
            className={`p-4 border-2 rounded-lg text-center transition-all duration-200 ${
              selectedCategory === 'bus'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-2xl mb-2">🚌</div>
            <div className="font-medium">Bus</div>
          </button>
        </div>
      </div>

      {/* Price Management Section */}
      <div className={`grid gap-6 md:gap-8 mb-6 md:mb-8 ${
        selectedCategory === 'car' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
      }`}>
        {/* Price Settings - Only show for Auto-Ricksaw and Bus */}
        {selectedCategory && selectedCategory !== 'car' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                {selectedCategory === 'auto-ricksaw' ? 'Auto-Ricksaw' : 'Bus'} Price Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditingPrices ? (
                <div className="space-y-4">
                  {Object.entries(prices[selectedCategory]).map(([vehicleType, price]) => (
                    <div key={vehicleType}>
                      <Label htmlFor={`${vehicleType}-price`}>{vehicleType} Price (per km)</Label>
                      <Input
                        id={`${vehicleType}-price`}
                        type="number"
                        value={editPrices[selectedCategory][vehicleType]}
                        onChange={(e) => handlePriceChange(selectedCategory, vehicleType, e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Button onClick={() => setIsEditingPrices(false)} variant="outline">
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      setPrices(editPrices);
                      setIsEditingPrices(false);
                      toast({
                        title: "Prices Updated",
                        description: `${selectedCategory === 'auto-ricksaw' ? 'Auto-Ricksaw' : 'Bus'} prices have been updated successfully`,
                        variant: "default",
                      });
                    }}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(prices[selectedCategory]).map(([vehicleType, price]) => (
                    <div key={vehicleType} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{vehicleType}</span>
                      <span className="text-lg font-bold">₹{price}/km</span>
                    </div>
                  ))}
                  <Button onClick={() => setIsEditingPrices(true)} className="w-full">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Prices
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

                {/* Car Variant Prices - Only show when car category is selected */}
        {selectedCategory === 'car' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Car Variant Prices</CardTitle>
            </CardHeader>
            <CardContent>


              {isEditingCarVariants ? (
                <div className="space-y-4">
                  {Object.entries(carVariantPrices).map(([carType, variants]) => (
                    <div key={carType} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3 capitalize">{carType} Models</h4>
                      <div className="space-y-3">
                        {Object.entries(variants).map(([variant, price]) => (
                          <div key={variant}>
                            <Label htmlFor={`${carType}-${variant}-price`}>{variant} Price (per km)</Label>
                            <Input
                              id={`${carType}-${variant}-price`}
                              type="number"
                              value={editCarVariantPrices[carType as keyof typeof editCarVariantPrices][variant]}
                              onChange={(e) => handleCarVariantPriceChange(carType, variant, e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Button onClick={() => setIsEditingCarVariants(false)} variant="outline">
                      Cancel
                    </Button>
                    <Button onClick={saveCarVariantPrices}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(carVariantPrices).map(([carType, variants]) => (
                    <div key={carType} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3 capitalize">{carType} Models</h4>
                      <div className="space-y-2">
                        {Object.entries(carVariantPrices[carType as keyof typeof carVariantPrices]).map(([variant, price]) => (
                          <div key={variant} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium">{variant}</span>
                            <span className="text-sm font-bold text-blue-600">₹{price}/km</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button onClick={() => setIsEditingCarVariants(true)} className="w-full">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Car Variant Prices
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fare Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Fare Calculator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="departure">From</Label>
                <Input
                  id="departure"
                  value={priceCalculator.departure}
                  onChange={(e) => handleCalculatorChange('departure', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="destination">To</Label>
                <Input
                  id="destination"
                  value={priceCalculator.destination}
                  onChange={(e) => handleCalculatorChange('destination', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="distance">Distance (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  value={priceCalculator.distance}
                  onChange={(e) => handleCalculatorChange('distance', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="vehicle-type">Vehicle Type</Label>
                <Select
                  value={priceCalculator.vehicleType}
                  onValueChange={(value) => handleCalculatorChange('vehicleType', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto-ricksaw" disabled>-- Auto-Ricksaw --</SelectItem>
                    {Object.entries(prices['auto-ricksaw']).map(([type, price]) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                    
                    <SelectItem value="car" disabled>-- Car Types --</SelectItem>
                    {Object.entries(prices.car).map(([type, price]) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                    
                    <SelectItem value="car-variants" disabled>-- Car Models --</SelectItem>
                    {Object.entries(carVariantPrices).map(([carType, variants]) => (
                      Object.entries(variants).map(([variant, price]) => (
                        <SelectItem key={variant} value={variant}>{variant}</SelectItem>
                      ))
                    ))}
                    
                    <SelectItem value="bus" disabled>-- Bus Types --</SelectItem>
                    {Object.entries(prices.bus).map(([type, price]) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Estimated Fare</p>
                  <p className="text-2xl font-bold text-blue-600">₹{calculateFare().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Ricksaw Detailed Price Breakdown */}
      {selectedCategory === 'auto-ricksaw' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              🛺 Auto-Ricksaw Price Details & Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">Fuel Auto-Ricksaw</h3>
                <div className="text-2xl font-bold text-blue-600">₹30/km</div>
                <p className="text-sm text-blue-600 mt-1">Standard petrol/diesel</p>
                <div className="mt-2 text-xs text-blue-600">
                  <p>• Base fare: ₹30</p>
                  <p>• Night charge: +₹5</p>
                  <p>• Peak hours: +₹3</p>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">Electric Auto-Ricksaw</h3>
                <div className="text-2xl font-bold text-green-600">₹35/km</div>
                <p className="text-sm text-green-600 mt-1">Eco-friendly option</p>
                <div className="mt-2 text-xs text-green-600">
                  <p>• Base fare: ₹35</p>
                  <p>• Green incentive: +₹2</p>
                  <p>• Battery charge: +₹1</p>
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-2">CNG Auto-Ricksaw</h3>
                <div className="text-2xl font-bold text-purple-600">₹32/km</div>
                <p className="text-sm text-purple-600 mt-1">Compressed natural gas</p>
                <div className="mt-2 text-xs text-purple-600">
                  <p>• Base fare: ₹32</p>
                  <p>• Fuel efficiency: +₹1</p>
                  <p>• Maintenance: +₹1</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Additional Charges & Policies</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Waiting Charges:</strong> ₹2/minute after 5 minutes</p>
                  <p><strong>Luggage:</strong> ₹5 per bag (max 2 bags)</p>
                  <p><strong>Late Night:</strong> 10 PM - 6 AM (+₹5)</p>
                  <p><strong>Peak Hours:</strong> 8-10 AM, 6-8 PM (+₹3)</p>
                  <p><strong>Airport:</strong> +₹20 surcharge</p>
                  <p><strong>Highway:</strong> +₹10 surcharge</p>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Service Features</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>24/7 Service:</strong> Available round the clock</p>
                  <p><strong>Digital Payment:</strong> UPI, cards, digital wallets</p>
                  <p><strong>Safety Features:</strong> GPS tracking, driver verification</p>
                  <p><strong>Comfort:</strong> Clean vehicles, AC options</p>
                  <p><strong>Accessibility:</strong> Wheelchair-friendly options</p>
                  <p><strong>Insurance:</strong> Passenger coverage included</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Car Detailed Price Breakdown */}
      {selectedCategory === 'car' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              🚗 Car Price Details & Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">Sedan</h3>
                <div className="text-2xl font-bold text-blue-600">₹40/km</div>
                <p className="text-sm text-blue-600 mt-1">Comfort & Style</p>
                <div className="mt-2 text-xs text-blue-600">
                  <p>• Base fare: ₹40</p>
                  <p>• AC included</p>
                  <p>• 4-5 passengers</p>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">Hatchback</h3>
                <div className="text-2xl font-bold text-green-600">₹35/km</div>
                <p className="text-sm text-green-600 mt-1">Compact & Efficient</p>
                <div className="mt-2 text-xs text-green-600">
                  <p>• Base fare: ₹35</p>
                  <p>• AC included</p>
                  <p>• 4-5 passengers</p>
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-2">SUV</h3>
                <div className="text-2xl font-bold text-purple-600">₹50/km</div>
                <p className="text-sm text-purple-600 mt-1">Spacious & Powerful</p>
                <div className="mt-2 text-xs text-purple-600">
                  <p>• Base fare: ₹50</p>
                  <p>• AC included</p>
                  <p>• 6-8 passengers</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Additional Charges & Policies</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Waiting Charges:</strong> ₹3/minute after 3 minutes</p>
                  <p><strong>Luggage:</strong> ₹10 per bag (max 3 bags)</p>
                  <p><strong>Late Night:</strong> 10 PM - 6 AM (+₹10)</p>
                  <p><strong>Peak Hours:</strong> 8-10 AM, 6-8 PM (+₹5)</p>
                  <p><strong>Airport:</strong> +₹50 surcharge</p>
                  <p><strong>Highway:</strong> +₹20 surcharge</p>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Service Features</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>24/7 Service:</strong> Available round the clock</p>
                  <p><strong>Digital Payment:</strong> UPI, cards, digital wallets</p>
                  <p><strong>Safety Features:</strong> GPS tracking, driver verification</p>
                  <p><strong>Comfort:</strong> Clean vehicles, AC, music system</p>
                  <p><strong>Accessibility:</strong> Child seats available</p>
                  <p><strong>Insurance:</strong> Passenger coverage included</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bus Detailed Price Breakdown */}
      {selectedCategory === 'bus' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              🚌 Bus Price Details & Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">AC Sleeper</h3>
                <div className="text-2xl font-bold text-blue-600">₹120/km</div>
                <p className="text-sm text-blue-600 mt-1">Premium comfort</p>
                <div className="mt-2 text-xs text-blue-600">
                  <p>• Base fare: ₹120</p>
                  <p>• AC included</p>
                  <p>• Sleeper berths</p>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">Non-AC Sleeper</h3>
                <div className="text-2xl font-bold text-green-600">₹100/km</div>
                <p className="text-sm text-green-600 mt-1">Economy option</p>
                <div className="mt-2 text-xs text-green-600">
                  <p>• Base fare: ₹100</p>
                  <p>• Sleeper berths</p>
                  <p>• Ventilation</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Additional Charges & Policies</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Waiting Charges:</strong> ₹5/minute after 10 minutes</p>
                  <p><strong>Luggage:</strong> ₹15 per bag (max 5 bags)</p>
                  <p><strong>Late Night:</strong> 10 PM - 6 AM (+₹20)</p>
                  <p><strong>Peak Hours:</strong> 8-10 AM, 6-8 PM (+₹10)</p>
                  <p><strong>Airport:</strong> +₹100 surcharge</p>
                  <p><strong>Highway:</strong> +₹50 surcharge</p>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Service Features</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>24/7 Service:</strong> Available round the clock</p>
                  <p><strong>Digital Payment:</strong> UPI, cards, digital wallets</p>
                  <p><strong>Safety Features:</strong> GPS tracking, driver verification</p>
                  <p><strong>Comfort:</strong> Clean vehicles, AC, sleeper berths</p>
                  <p><strong>Accessibility:</strong> Wheelchair-friendly options</p>
                  <p><strong>Insurance:</strong> Passenger coverage included</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}




    </AdminLayout>
  );
};

export default AdminPriceManagement; 