import { Card } from "@/components/ui/card";
import { Search, CreditCard, Ticket, CheckCircle } from "lucide-react";

const HowToBook = () => {
  const steps = [
    {
      step: 1,
      icon: <Search className="w-8 h-8" />,
      title: "Search Vehicles",
              description: "Enter your source, destination, and travel date to find available Buses, Cars, and Auto-Ricksaws"
    },
    {
      step: 2,
      icon: <Ticket className="w-8 h-8" />,
      title: "Select & Book",
      description: "Choose your preferred vehicle, seat, and boarding point for your journey"
    },
    {
      step: 3,
      icon: <CreditCard className="w-8 h-8" />,
      title: "Make Payment",
      description: "Complete secure payment using your preferred payment method"
    },
    {
      step: 4,
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Get Confirmation",
      description: "Receive instant confirmation with your e-ticket via SMS and email"
    }
  ];

  return (
    <section className="py-16 bg-chalosawari-light-gray">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How to Book Tickets Online?
          </h2>
          <p className="text-muted-foreground text-lg">
            Simple 4-step process to book your Bus, Car, and Auto-Ricksaw tickets in minutes
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <Card key={step.step} className="p-6 text-center bg-white shadow-card border-border relative">
                {/* Step number */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {step.step}
                  </div>
                </div>

                {/* Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full text-primary mb-4 mt-4">
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Connection line (hidden on mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-primary/30 transform -translate-y-1/2"></div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowToBook;