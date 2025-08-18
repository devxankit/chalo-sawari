import { Card } from "@/components/ui/card";

const PartnersSection = () => {
  const partners = [
    { name: "SRS Travels", logo: "SRS" },
    { name: "VRL Travels", logo: "VRL" },
    { name: "Orange Travels", logo: "OT" },
    { name: "IntrCity", logo: "IC" },
    { name: "Redbus", logo: "RB" },
    { name: "KSRTC", logo: "KS" }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our Top Partner Bus Operators
          </h2>
          <p className="text-muted-foreground text-lg">
            Travel with India's most trusted and reliable bus operators
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
          {partners.map((partner, index) => (
            <Card key={index} className="p-4 text-center hover:shadow-lg transition-shadow border-border bg-white group cursor-pointer">
                              <div className="w-16 h-16 mx-auto mb-3 bg-chalosawari-light-gray rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="font-bold text-lg">{partner.logo}</span>
              </div>
              <p className="text-sm font-medium text-foreground">{partner.name}</p>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-muted-foreground">
            And many more trusted operators across India
          </p>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;