import { Card } from "@/components/ui/card";
import { Smartphone, CreditCard, MapPin, Clock, Gift, Users } from "lucide-react";

const BookingBenefits = () => {
  const benefits = [
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Mobile Booking",
      description: "Book tickets anytime, anywhere with our mobile app or website"
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Secure Payments",
      description: "Multiple payment options with bank-level security"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Instant Confirmation",
      description: "Get instant booking confirmation via SMS and email"
    },
    {
      icon: <Gift className="w-8 h-8" />,
      title: "Rewards & Offers",
      description: "Earn rewards points and get exclusive discounts"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Multiple Bookings",
      description: "Special discounts for group Vehicle bookings"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Benefits of Online Bus Booking
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Experience hassle-free bus booking with our advanced features and customer-friendly services
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <Card key={index} className="p-6 text-center hover:shadow-lg transition-all border-border bg-white group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BookingBenefits;