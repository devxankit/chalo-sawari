import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import busLogo from "@/assets/BusLogo.png";

const Footer = () => {
  const footerSections = [
    {
      title: "Company",
      links: ["About Us", "Careers", "Contact Us",]
    },
    {
      title: "Support",
      links: ["Help Center", "Terms & Conditions", "Privacy Policy", "Cancellation Policy", "Refund Policy"]
    },
    {
      title: "Services",
              links: ["Bus Booking", "Car Booking", "Auto-Ricksaw Booking", "Group Vehicle Booking"]
    },
    {
      title: "Top Routes",
      links: ["Delhi to Mumbai", "Bangalore to Chennai", "Hyderabad to Pune", "Mumbai to Goa", "Chennai to Coimbatore"]
    },
  ];

  return (
    <footer className="bg-black text-white">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-2">Stay Updated</h3>
              <p className="text-white/80">
                Subscribe to get the latest offers and travel updates
              </p>
            </div>
            <div className="flex gap-2">
              <Input 
                placeholder="Enter your email address"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
              <Button className="bg-blue-600 text-white">
                <Mail className="w-4 h-4 mr-2" />
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <img src={busLogo} alt="Bus Logo" className="h-10 w-auto mb-4 filter brightness-0 invert" />
            <p className="text-white/80 mb-4">
              India's leading Bus, Car, and Auto-Ricksaw booking platform connecting millions of travelers with trusted operators.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="text-white/80">
                <Facebook className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white/80">
                <Twitter className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white/80">
                <Instagram className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white/80">
                <Linkedin className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold text-lg mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    {link === "Driver Login" ? (
                      <Link to="">
                        <Button variant="link" className="text-white/80 p-0 h-auto font-normal">
                          {link}
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="link" className="text-white/80 p-0 h-auto font-normal">
                        {link}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Info */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <Phone className="w-5 h-5 text-blue-400" />
              <span className="text-white/80">Customer Care: +91 9171838260</span>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <Mail className="w-5 h-5 text-blue-400" />
                              <span className="text-white/80"><a href="mailto:chalosawariofficial@gmail.com">chalosawariofficial@gmail.com</a></span>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <MapPin className="w-5 h-5 text-blue-400" />
              <span className="text-white/80">Indore, India</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-white/60 text-sm">
            <p>&copy; 2025 Chalo Sawari. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Button variant="link" className="text-white/60 p-0 h-auto font-normal text-sm">
                Terms of Service
              </Button>
              <Button variant="link" className="text-white/60 p-0 h-auto font-normal text-sm">
                Privacy Policy
              </Button>
              <Button variant="link" className="text-white/60 p-0 h-auto font-normal text-sm">
                Cookie Policy
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;