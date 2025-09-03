import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { offerApi, type Offer } from "@/services/offerApi";

const OffersSection = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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



  return (
    <section className="py-8 sm:py-12 bg-chalosawari-light-gray">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-8 px-2 sm:px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Exclusive Offers & Discounts
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Save more with our limited-time offers and promotional codes
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : offers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto px-2 sm:px-4">
            {offers.slice(0, 3).map((offer, index) => (
              <Card key={offer._id} className="p-4 sm:p-6 border-2 border-primary/20 bg-white shadow-card">
                <img 
                  src={offer.image} 
                  alt={offer.title} 
                  className="w-full h-auto max-w-full sm:max-w-md mx-auto rounded-lg"
                />
                <div className="mt-3 sm:mt-4 text-center">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">{offer.title}</h3>
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