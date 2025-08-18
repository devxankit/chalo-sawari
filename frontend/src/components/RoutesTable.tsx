import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const RoutesTable = () => {
  const routes = [
    { from: "Delhi", to: "Mumbai", fromCode: "DEL", toCode: "BOM" },
    { from: "Bangalore", to: "Chennai", fromCode: "BLR", toCode: "CHE" },
    { from: "Hyderabad", to: "Pune", fromCode: "HYD", toCode: "PUN" },
    { from: "Mumbai", to: "Goa", fromCode: "BOM", toCode: "GOA" },
    { from: "Chennai", to: "Coimbatore", fromCode: "CHE", toCode: "COI" },
    { from: "Delhi", to: "Jaipur", fromCode: "DEL", toCode: "JAI" },
    { from: "Pune", to: "Mumbai", fromCode: "PUN", toCode: "BOM" },
    { from: "Ahmedabad", to: "Mumbai", fromCode: "AMD", toCode: "BOM" },
    { from: "Kochi", to: "Bangalore", fromCode: "COK", toCode: "BLR" },
    { from: "Indore", to: "Mumbai", fromCode: "IDR", toCode: "BOM" },
    { from: "Surat", to: "Mumbai", fromCode: "SUR", toCode: "BOM" },
    { from: "Nagpur", to: "Mumbai", fromCode: "NAG", toCode: "BOM" }
  ];

  return (
    <section className="py-16 bg-chalosawari-light-gray">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Popular Bus Routes in India
          </h2>
          <p className="text-muted-foreground text-lg">
            Book tickets for the most traveled bus routes across India
          </p>
        </div>

        <Card className="max-w-6xl mx-auto overflow-hidden bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">From</th>
                  <th className="px-6 py-4 text-center font-semibold">Route</th>
                  <th className="px-6 py-4 text-left font-semibold">To</th>
                  <th className="px-6 py-4 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route, index) => (
                  <tr key={index} className="border-b border-border hover:bg-chalosawari-light-gray/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-foreground">{route.from}</div>
                        <div className="text-sm text-muted-foreground">{route.fromCode}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div className="flex-1 h-0.5 bg-border mx-2"></div>
                        <ArrowRight className="w-4 h-4 text-primary" />
                        <div className="flex-1 h-0.5 bg-border mx-2"></div>
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-foreground">{route.to}</div>
                        <div className="text-sm text-muted-foreground">{route.toCode}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                        Book Now
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="text-center mt-8">
          <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-white">
            View All Routes
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RoutesTable;