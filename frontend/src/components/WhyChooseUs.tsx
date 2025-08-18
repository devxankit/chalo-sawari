import { Card } from "@/components/ui/card";
import { Shield, Clock, MapPin, Headphones, CreditCard, Star, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const WhyChooseUs = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedFeatures, setAnimatedFeatures] = useState(Array(6).fill(false));
  const sectionRef = useRef(null);

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Safe & Secure",
      description: "Verified bus operators and secure payment gateway for safe transactions"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "24/7 Support",
      description: "Round the clock customer support to assist you with your travel needs"
    },
    
    {
      icon: <Headphones className="w-8 h-8" />,
      title: "Customer Care",
      description: "Dedicated customer care team to help you with bookings and queries"
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Easy Payments",
      description: "Multiple payment options including UPI, cards, and digital wallets"
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Best Prices",
              description: "Compare prices across operators and get the best deals on Bus, Car, and Auto-Ricksaw bookings"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Quality Services",
      description: "Chalo Sawari provides the best quality services to its customers"
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Stagger the feature animations
          features.forEach((_, index) => {
            setTimeout(() => {
              setAnimatedFeatures(prev => {
                const newState = [...prev];
                newState[index] = true;
                return newState;
              });
            }, index * 150); // 150ms delay between each feature
          });
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className={`text-center mb-12 transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 transition-all duration-300 hover:scale-105">
            Why Choose Chalo Sawari?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto transition-all duration-300 hover:text-foreground">
            Experience the best Bus, Car, and Auto-Ricksaw booking platform with unmatched service quality and customer satisfaction
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={`p-6 text-center transition-all duration-700 ease-out ${
                animatedFeatures[index] ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
              } hover:shadow-2xl hover:scale-105 hover:-translate-y-2 border-border bg-white hover:border-primary/20`}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full text-primary mb-4 transition-all duration-300 hover:bg-primary/20 hover:scale-110 hover:rotate-12">
                <div className="transition-all duration-300 hover:scale-110">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3 transition-all duration-300 hover:text-primary">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed transition-all duration-300 hover:text-foreground">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;