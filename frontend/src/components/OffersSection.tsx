import { Card } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import { offerApi, type Offer } from "@/services/offerApi";

const OffersSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedCards, setAnimatedCards] = useState([false, false, false]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const sectionRef = useRef(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await offerApi.getActiveOffers();
        if (response.success && Array.isArray(response.data)) {
          setOffers(response.data as Offer[]);
        }
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffers();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Stagger the card animations based on actual offers count
          const offersCount = offers.length;
          if (offersCount > 0) {
            setTimeout(() => setAnimatedCards([true, false, false]), 200);
            if (offersCount > 1) {
              setTimeout(() => setAnimatedCards([true, true, false]), 400);
              if (offersCount > 2) {
                setTimeout(() => setAnimatedCards([true, true, true]), 600);
              }
            }
          }
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [offers.length]);

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

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : offers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {offers.slice(0, 3).map((offer, index) => (
              <Card key={offer._id} className={`p-6 border-2 border-primary/20 bg-white shadow-card transition-all duration-700 ease-out ${
                index === 0 ? '' : index === 1 ? 'delay-200' : 'delay-400'
              } ${
                animatedCards[index] ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
              } hover:shadow-2xl hover:scale-105 hover:border-primary/40 hover:-translate-y-2`}>
                <img 
                  src={offer.image} 
                  alt={offer.title} 
                  className="w-full h-auto max-w-md mx-auto transition-all duration-300 hover:scale-110 hover:rotate-2"
                />
                <div className="mt-4 text-center">
                  <h3 className="text-lg font-semibold text-gray-900">{offer.title}</h3>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No offers available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default OffersSection;