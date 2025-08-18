import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, MessageCircle, Phone, Mail, User, Home, List, HelpCircle, ChevronDown, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import TopNavigation from "@/components/TopNavigation";

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);

  const helpTopics = [
    {
      id: 1,
      title: "How to book a ticket?",
      description: "Step by step guide to book your journey",
      content: "To book a ticket, follow these steps:\n\n1. Select your departure and destination cities\n2. Choose your travel date and time\n3. Select One Way or Round Trip\n4. Click 'Search buses' to see available options\n5. Choose your preferred bus and seat\n6. Enter passenger details and payment information\n7. Confirm your booking"
    },
    {
      id: 2,
      title: "Cancellation & Refund",
      description: "Learn about cancellation policies and refund process",
      content: "Cancellation Policy:\n\n• Free cancellation up to 2 hours before departure\n• 50% refund for cancellations 2-24 hours before departure\n• No refund for cancellations within 1 hour of departure\n\nRefund Process:\n• Refunds are processed within 3-5 business days\n• Amount is credited to your original payment method\n• You'll receive an email confirmation once processed"
    },
    {
      id: 3,
      title: "Payment methods",
      description: "Accepted payment options and security",
      content: "Accepted Payment Methods:\n\n• Credit/Debit Cards (Visa, MasterCard, RuPay)\n• UPI (Google Pay, PhonePe, Paytm)\n• Net Banking\n• Digital Wallets\n• Cash on Board (selected routes)\n\nSecurity Features:\n• SSL encrypted transactions\n• PCI DSS compliant\n• Secure payment gateway\n• No card details stored"
    },
    {
      id: 4,
      title: "Booking modifications",
      description: "How to change or modify your booking",
      content: "Booking Modifications:\n\nYou can modify your booking up to 2 hours before departure:\n\n• Change travel date (subject to availability)\n• Modify passenger details\n• Update contact information\n• Change pickup location\n\nModification Charges:\n• ₹50 for date changes\n• Free for passenger detail updates\n• No charge for contact info changes"
    }
  ];

  const contactOptions = [
    {
      id: 1,
      title: "Live Chat",
      icon: MessageCircle,
      description: "Chat with our support team",
      action: "Start Chat",
      actionHandler: () => {
        alert("Live chat feature coming soon! Our support team will be available 24/7.");
      }
    },
    {
      id: 2,
      title: "Call Support",
      icon: Phone,
      description: "Speak with our customer care",
      action: "Call Now",
      actionHandler: () => {
        window.location.href = "tel:+919171838260";
      }
    },
    {
      id: 3,
      title: "Email Support",
      icon: Mail,
      description: "Send us an email",
      action: "Send Email",
      actionHandler: () => {
        window.location.href = "mailto:chalosawariofficial@gmail.com?subject=Support Request";
      }
    }
  ];

  const filteredTopics = helpTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleEmergencyContact = () => {
    setShowEmergencyContact(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation/>
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-xl font-semibold">Help & Support</h1>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 pb-20">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search for help topics..."
            className="w-full p-3 pl-10 border border-border rounded-lg bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <HelpCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        </div>

        {/* Help Topics */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Frequently Asked Questions
            {searchQuery && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredTopics.length} results)
              </span>
            )}
          </h2>
          <div className="space-y-3">
            {filteredTopics.map((topic) => (
              <Card key={topic.id} className="border border-border">
                <div 
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleFAQ(topic.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{topic.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
                    </div>
                    {expandedFAQ === topic.id ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
                {expandedFAQ === topic.id && (
                  <div className="px-4 pb-4">
                    <div className="border-t border-border pt-4">
                      <p className="text-sm text-foreground whitespace-pre-line">{topic.content}</p>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
          {filteredTopics.length === 0 && searchQuery && (
            <div className="text-center py-8">
              <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No help topics found for "{searchQuery}"</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>

        {/* Contact Support */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Contact Support</h2>
          <div className="space-y-3">
            {contactOptions.map((option) => (
              <Card key={option.id} className="p-4 border border-border">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <option.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{option.title}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={option.actionHandler}>
                    {option.action}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <Card className="p-4 border border-border bg-primary/5">
          <h3 className="font-semibold text-foreground mb-2">Emergency Support</h3>
          <p className="text-sm text-muted-foreground mb-3">
            For urgent assistance during your journey
          </p>
          <Button className="w-full bg-primary text-primary-foreground" onClick={handleEmergencyContact}>
            Emergency Contact
          </Button>
        </Card>
      </div>

      {/* Emergency Contact Modal */}
      {showEmergencyContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Emergency Contact</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowEmergencyContact(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-2">24/7 Emergency Helpline</p>
                <p className="text-sm text-red-700">For immediate assistance during your journey</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Emergency Number</p>
                    <p className="text-sm text-muted-foreground">Available 24/7</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = "tel:+919171838260"}
                  >
                    Call Now
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">WhatsApp Support</p>
                    <p className="text-sm text-muted-foreground">Quick messaging support</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open("https://wa.me/919171838260", "_blank")}
                  >
                    Chat Now
                  </Button>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={() => setShowEmergencyContact(false)}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background z-50">
        <div className="flex justify-around py-2">
          <Link to="/" className="flex flex-col items-center space-y-1">
            <Home className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Home</span>
          </Link>
          <Link to="/bookings" className="flex flex-col items-center space-y-1">
            <List className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Bookings</span>
          </Link>
          <Link to="/help" className="flex flex-col items-center space-y-1">
            <HelpCircle className="w-5 h-5 text-primary" />
            <span className="text-xs text-primary font-medium">Help</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center space-y-1">
            <User className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Account</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Help; 