import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Car, Shield, HelpCircle, Settings, CreditCard, Star, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import busLogo from "@/assets/BusLogo.png";

const DriverFooter = () => {
  const driverFooterSections = [
    {
      title: "Owner Driver Services",
      links: ["Vehicle Registration", "Earnings Dashboard", "Trip History", "Performance Analytics", "Insurance Coverage"]
    },
    {
      title: "Support",
      links: ["Help Center", "24/7 Support", "Safety Guidelines", "Terms & Conditions", "Privacy Policy"]
    },
    {
      title: "Resources",
      links: ["Owner Driver Training", "Vehicle Maintenance", "Route Optimization", "Customer Tips", "App Tutorials"]
    }
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-black text-white">

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <img src={busLogo} alt="Bus Logo" className="h-10 w-auto filter brightness-0 invert" />
              <div>
                <h4 className="font-bold text-lg">Owner Driver Portal</h4>
                <p className="text-sm text-blue-400">Professional Owner Driver Platform</p>
              </div>
            </div>
            <p className="text-white/80 mb-4">
              Join thousands of successful drivers earning more with our comprehensive platform. 
              Professional tools, reliable support, and maximum earnings potential.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10">
                <Facebook className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10">
                <Twitter className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10">
                <Instagram className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10">
                <Linkedin className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Footer Links */}
          {driverFooterSections.map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold text-lg mb-4 flex items-center">
                {index === 0 && <Car className="w-5 h-5 mr-2 text-blue-400" />}
                {index === 1 && <HelpCircle className="w-5 h-5 mr-2 text-green-400" />}
                {index === 2 && <TrendingUp className="w-5 h-5 mr-2 text-yellow-400" />}
                {index === 3 && <Settings className="w-5 h-5 mr-2 text-purple-400" />}
                {index === 4 && <Users className="w-5 h-5 mr-2 text-orange-400" />}
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    {link === "Help Center" ? (
                      <Link to="/help">
                        <Button variant="link" className="text-white/80 hover:text-white p-0 h-auto font-normal text-sm">
                          {link}
                        </Button>
                      </Link>
                    ) : link === "Terms & Conditions" ? (
                      <Link to="/terms-conditions">
                        <Button variant="link" className="text-white/80 hover:text-white p-0 h-auto font-normal text-sm">
                          {link}
                        </Button>
                      </Link>
                    ) : link === "Privacy Policy" ? (
                      <Link to="/privacy-policy">
                        <Button variant="link" className="text-white/80 hover:text-white p-0 h-auto font-normal text-sm">
                          {link}
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="link" className="text-white/80 hover:text-white p-0 h-auto font-normal text-sm">
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

      {/* Driver Stats */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">50K+</div>
                <div className="text-sm text-white/60">Active Owner Drivers</div>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">₹25Cr+</div>
                <div className="text-sm text-white/60">Total Earnings</div>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">4.8</div>
                <div className="text-sm text-white/60">Avg Rating</div>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">100%</div>
                <div className="text-sm text-white/60">Safe & Secure</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <Phone className="w-5 h-5 text-blue-400" />
              <span className="text-white/80">Support: +91 9171838260</span>
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
            <p>&copy; 2025 Chalo Sawari Owner Driver Portal. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/terms-conditions">
                <Button variant="link" className="text-white/60 hover:text-white p-0 h-auto font-normal text-sm">
                  Driver Terms
                </Button>
              </Link>
              <Link to="/privacy-policy">
                <Button variant="link" className="text-white/60 hover:text-white p-0 h-auto font-normal text-sm">
                  Privacy Policy
                </Button>
              </Link>
              <Button variant="link" className="text-white/60 hover:text-white p-0 h-auto font-normal text-sm">
                Safety Policy
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DriverFooter; 