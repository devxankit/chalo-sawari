import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Download, Star, Users } from "lucide-react";
import mobileAppImage from "@/assets/mobile-app.png";

const AppDownloadSection = () => {
  const stats = [
    { icon: <Download className="w-6 h-6" />, value: "10+", label: "Downloads" },
    { icon: <Star className="w-6 h-6" />, value: "4.5", label: "Rating" },
    { icon: <Users className="w-6 h-6" />, value: "50+", label: "Happy Users" }
  ];

  return (
    <section className="py-16 bg-gradient-primary">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Content */}
          <div className="text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Download Chalo Sawari App
            </h2>
            <p className="text-white/90 text-lg mb-8">
              Book Bus, Car, and Auto-Ricksaw tickets faster and easier with our mobile app. Get exclusive offers, track your vehicle, and manage bookings on the go.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white mx-auto mb-2">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-white/80 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* App Store Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="secondary" 
                className="bg-white text-foreground hover:bg-white/90"
                onClick={() => window.open('https://play.google.com/store/apps/details?id=com.chalo.sawari', '_blank')}
              >
                <Smartphone className="w-5 h-5 mr-2" />
                Download for Android
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-black hover:bg-white hover:text-foreground"
                onClick={() => window.open('https://play.google.com/store/apps/details?id=com.chalo.sawari', '_blank')}
              >
                <Smartphone className="w-5 h-5 mr-2" />
                Download for iOS
              </Button>
            </div>
          </div>

          {/* Mobile App Image */}
          <div className="text-center">
            <Card className="inline-block p-6 bg-white/10 backdrop-blur-sm border-white/20">
              <img 
                src={mobileAppImage} 
                alt="Chalo Sawari Mobile App" 
                className="w-64 h-auto mx-auto"
              />
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDownloadSection;