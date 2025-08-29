import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Scale, CreditCard, AlertTriangle, Shield, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";
import TopNavigation from "@/components/TopNavigation";

const TermsConditions = () => {
  const termsSections = [
    {
      id: 1,
      title: "Acceptance of Terms",
      icon: FileText,
      content: `By accessing and using Chalo Sawari's services, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.

Agreement to Terms:
• These terms constitute a legally binding agreement
• You must be at least 18 years old to use our services
• You represent that you have the legal capacity to enter into this agreement
• These terms apply to all users of our platform

Updates to Terms:
• We may modify these terms at any time
• Continued use constitutes acceptance of updated terms
• We will notify users of significant changes
• Your rights and obligations remain in effect until termination`
    },
    {
      id: 2,
      title: "Service Description",
      icon: Scale,
      content: `Chalo Sawari provides an online platform for booking transportation services including buses, cars, and auto-rickshaws.

Our Services Include:
• Online booking platform for transportation services
• Payment processing and transaction management
• Customer support and assistance
• Real-time tracking and updates
• Booking modifications and cancellations

Service Availability:
• Services are subject to availability
• We reserve the right to modify or discontinue services
• Third-party transportation providers are independent contractors
• We act as an intermediary between users and service providers

Platform Features:
• User account management
• Booking history and management
• Payment processing
• Customer support services`
    },
    {
      id: 3,
      title: "User Responsibilities",
      icon: Users,
      content: `As a user of our platform, you have certain responsibilities and obligations:

Account Security:
• Maintain the confidentiality of your account credentials
• Notify us immediately of any unauthorized access
• Provide accurate and up-to-date information
• Use strong passwords and security measures

Proper Use:
• Use our services only for lawful purposes
• Comply with all applicable laws and regulations
• Respect the rights of other users and service providers
• Do not engage in fraudulent or abusive behavior

Booking Responsibilities:
• Provide accurate passenger and contact information
• Arrive on time for your scheduled transportation
• Follow safety guidelines and instructions
• Treat drivers and staff with respect

Prohibited Activities:
• Creating multiple accounts to circumvent restrictions
• Attempting to hack or compromise our systems
• Using automated tools to access our services
• Engaging in any illegal or harmful activities`
    },
    {
      id: 4,
      title: "Booking and Payment Terms",
      icon: CreditCard,
      content: `Our booking and payment terms govern all transactions on our platform:

Booking Process:
• Bookings are confirmed upon successful payment
• All prices are inclusive of applicable taxes
• Prices may vary based on demand and availability
• We reserve the right to refuse or cancel bookings

Payment Terms:
• Payment must be made at the time of booking
• We accept various payment methods including cards, UPI, and net banking
• All payments are processed securely through our payment partners
• Failed payments may result in booking cancellation

Pricing and Fees:
• Prices are subject to change without notice
• Additional fees may apply for special services
• Cancellation and modification fees are clearly displayed
• Refunds are processed according to our refund policy

Booking Confirmation:
• Confirmation details are sent via email and SMS
• Keep your booking reference number for future reference
• Present valid ID and booking confirmation when traveling`
    },
    {
      id: 5,
      title: "Cancellation and Refund Policy",
      icon: Clock,
      content: `Our cancellation and refund policy is designed to be fair and transparent:

Cancellation Timeframes:
• Free cancellation up to 2 hours before departure
• 50% refund for cancellations 2-24 hours before departure
• No refund for cancellations within 1 hour of departure
• Special conditions may apply for group bookings

Refund Process:
• Refunds are processed within 3-5 business days
• Amount is credited to your original payment method
• Processing fees may be deducted from refunds
• You will receive email confirmation of refund processing

Modification Policy:
• Booking modifications are subject to availability
• Modification fees may apply as per our fee structure
• Changes must be made at least 2 hours before departure
• Some bookings may not be eligible for modification

Force Majeure:
• No refunds for cancellations due to weather or natural disasters
• Alternative arrangements will be made when possible
• Government regulations may affect cancellation policies`
    },
    {
      id: 6,
      title: "Limitation of Liability",
      icon: AlertTriangle,
      content: `Our liability is limited as described in this section:

Service Limitations:
• We act as an intermediary between users and transportation providers
• We are not responsible for the quality of third-party services
• Transportation providers are independent contractors
• We do not guarantee specific arrival or departure times

Liability Limitations:
• Our liability is limited to the amount paid for the specific booking
• We are not liable for indirect, incidental, or consequential damages
• We are not responsible for personal belongings left in vehicles
• Users travel at their own risk

Force Majeure:
• We are not liable for delays or cancellations due to circumstances beyond our control
• This includes weather, traffic, government actions, or other emergencies
• We will make reasonable efforts to provide alternative arrangements
• No compensation is provided for force majeure events

User Responsibility:
• Users are responsible for their own safety and security
• Follow all safety instructions provided by drivers
• Report any safety concerns immediately
• Comply with all applicable laws and regulations`
    },
    {
      id: 7,
      title: "Privacy and Data Protection",
      icon: Shield,
      content: `We are committed to protecting your privacy and personal information:

Data Collection:
• We collect only necessary information for service provision
• Personal data is processed in accordance with our Privacy Policy
• We implement appropriate security measures to protect your data
• You have rights regarding your personal information

Data Usage:
• Information is used to provide and improve our services
• We may share information with transportation partners as necessary
• Marketing communications are sent only with your consent
• You can opt-out of marketing communications at any time

Security Measures:
• We use industry-standard security protocols
• All data transmission is encrypted
• Access to personal information is restricted
• Regular security audits are conducted

Your Rights:
• Access and update your personal information
• Request deletion of your account and data
• Opt-out of marketing communications
• File complaints about data handling practices`
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation/>
      
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center space-x-4">
          <Link to="/help">
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Help
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Terms & Conditions</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 pb-20">
        {/* Introduction */}
        <Card className="p-6 border border-border">
          <div className="text-center">
            <FileText className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-4">Terms of Service</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These Terms and Conditions govern your use of Chalo Sawari's transportation booking platform. 
              Please read these terms carefully before using our services.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: January 2025
            </p>
          </div>
        </Card>

        {/* Terms Sections */}
        <div className="space-y-4">
          {termsSections.map((section) => (
            <Card key={section.id} className="border border-border">
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <section.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-3">{section.title}</h3>
                    <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Contact Information */}
        <Card className="p-6 border border-border bg-primary/5">
          <h3 className="text-lg font-semibold text-foreground mb-4">Contact Us</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If you have any questions about these Terms and Conditions, please contact us:
          </p>
          <div className="space-y-2">
                         <p className="text-sm text-foreground">
               <strong>Email:</strong> chalosawariofficial@gmail.com
             </p>
            <p className="text-sm text-foreground">
              <strong>Phone:</strong> +91 9171838260
            </p>
            <p className="text-sm text-foreground">
              <strong>Address:</strong> Indore, India
            </p>
          </div>
        </Card>

        {/* Updates */}
        <Card className="p-6 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Changes to Terms</h3>
          <p className="text-sm text-muted-foreground">
            We reserve the right to modify these Terms and Conditions at any time. We will notify users of any material changes 
            by posting the updated terms on our website and updating the "Last updated" date. Your continued use of our services 
            after such changes constitutes acceptance of the new terms.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default TermsConditions;
