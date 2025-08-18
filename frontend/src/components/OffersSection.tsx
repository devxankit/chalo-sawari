import { Card } from "@/components/ui/card";
import Vrindavan from "@/assets/vrindavan.png";
import Sawariya from "@/assets/Sawariya.png";
import Tirupati from "@/assets/Tirupati.png";
import { useEffect, useRef, useState } from "react";

const OffersSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedCards, setAnimatedCards] = useState([false, false, false]);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Stagger the card animations
          setTimeout(() => setAnimatedCards([true, false, false]), 200);
          setTimeout(() => setAnimatedCards([true, true, false]), 400);
          setTimeout(() => setAnimatedCards([true, true, true]), 600);
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
    <section ref={sectionRef} className="pt-2 pb-2 bg-chalosawari-light-gray">
      <div className="container mx-auto px-4">
        <div className={`text-center mb-4 transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 transition-all duration-300 hover:scale-105">
            Exclusive Offers & Discounts
          </h2>
          <p className="text-muted-foreground text-lg transition-all duration-300 hover:text-foreground">
            Save more with our limited-time offers and promotional codes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className={`p-6 border-2 border-primary/20 bg-white shadow-card transition-all duration-700 ease-out ${
            animatedCards[0] ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
          } hover:shadow-2xl hover:scale-105 hover:border-primary/40 hover:-translate-y-2`}>
            <img 
              src={Vrindavan} 
              alt="Vrindavan" 
              className="w-full h-auto max-w-md mx-auto transition-all duration-300 hover:scale-110 hover:rotate-2"
            />
          </Card>
          
          <Card className={`p-6 border-2 border-primary/20 bg-white shadow-card transition-all duration-700 ease-out delay-200 ${
            animatedCards[1] ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
          } hover:shadow-2xl hover:scale-105 hover:border-primary/40 hover:-translate-y-2`}>
            <img 
              src={Sawariya} 
              alt="Sawariya" 
              className="w-full h-auto max-w-md mx-auto transition-all duration-300 hover:scale-110 hover:rotate-2"
            />
          </Card>
          
          <Card className={`p-6 border-2 border-primary/20 bg-white shadow-card transition-all duration-700 ease-out delay-400 ${
            animatedCards[2] ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
          } hover:shadow-2xl hover:scale-105 hover:border-primary/40 hover:-translate-y-2`}>
            <img 
              src={Tirupati} 
              alt="Tirupati" 
              className="w-full h-auto max-w-md mx-auto transition-all duration-300 hover:scale-110 hover:rotate-2"
            />
          </Card>
        </div>
      </div>
    </section>
  );
};

export default OffersSection;