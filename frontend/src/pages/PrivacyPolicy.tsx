import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Eye, Lock, Database, UserCheck, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import TopNavigation from "@/components/TopNavigation";

const PrivacyPolicy = () => {
  const privacySections = [
    {
      id: 1,
      title: "Information We Collect",
      icon: Database,
      content: `We collect information you provide directly to us, such as when you create an account, make a booking, or contact us for support.

Personal Information:
• Name, email address, phone number
• Date of birth and gender
• Payment information (processed securely)
• Travel preferences and booking history

Technical Information:
• Device information and IP address
• Browser type and version
• Usage patterns and preferences
• Location data (with your permission)`
    },
    {
      id: 2,
      title: "How We Use Your Information",
      icon: Eye,
      content: `We use the information we collect to provide, maintain, and improve our services:

Service Delivery:
• Process bookings and payments
• Send booking confirmations and updates
• Provide customer support
• Track your journey and provide real-time updates

Communication:
• Send important service notifications
• Provide customer support
• Send promotional offers (with your consent)
• Share important policy updates

Improvement:
• Analyze usage patterns to improve our services
• Develop new features and services
• Ensure platform security and prevent fraud`
    },
    {
      id: 3,
      title: "Information Sharing",
      icon: UserCheck,
      content: `We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:

Service Providers:
• Payment processors for transaction processing
• Transportation partners for booking fulfillment
• Customer support service providers
• Analytics and marketing service providers

Legal Requirements:
• When required by law or legal process
• To protect our rights and property
• To ensure user safety and security
• In case of business transfers or mergers

With Your Consent:
• When you explicitly agree to share information
• For promotional partnerships (with opt-out options)`
    },
    {
      id: 4,
      title: "Data Security",
      icon: Lock,
      content: `We implement appropriate security measures to protect your personal information:

Technical Safeguards:
• SSL encryption for data transmission
• Secure servers and databases
• Regular security audits and updates
• Access controls and authentication

Operational Safeguards:
• Limited access to personal information
• Employee training on data protection
• Incident response procedures
• Regular backup and recovery systems

Your Role:
• Keep your account credentials secure
• Use strong, unique passwords
• Log out from shared devices
• Report suspicious activities immediately`
    },
    {
      id: 5,
      title: "Your Rights and Choices",
      icon: Shield,
      content: `You have certain rights regarding your personal information:

Access and Control:
• View and update your personal information
• Download your data in a portable format
• Delete your account and associated data
• Opt-out of marketing communications

Privacy Settings:
• Control location sharing preferences
• Manage notification preferences
• Adjust privacy settings in your account
• Choose data sharing preferences

Contact Us:
• Submit privacy-related requests
• Ask questions about your data
• Report privacy concerns
• Request data corrections`
    },
    {
      id: 6,
      title: "Cookies and Tracking",
      icon: FileText,
      content: `We use cookies and similar technologies to enhance your experience:

Essential Cookies:
• Required for basic website functionality
• Enable secure login and booking processes
• Remember your preferences and settings

Analytics Cookies:
• Help us understand how you use our services
• Improve website performance and user experience
• Provide insights for service enhancement

Marketing Cookies:
• Deliver relevant advertisements
• Track campaign effectiveness
• Personalize your experience (with consent)

You can control cookie settings through your browser preferences.`
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
          <h1 className="text-xl font-semibold">Privacy Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 pb-20">
        {/* Introduction */}
        <Card className="p-6 border border-border">
          <div className="text-center">
            <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-4">Your Privacy Matters</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              At Chalo Sawari, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, and safeguard your data when you use our services.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: January 2025
            </p>
          </div>
        </Card>

        {/* Privacy Sections */}
        <div className="space-y-4">
          {privacySections.map((section) => (
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
          <h3 className="text-lg font-semibold text-foreground mb-4">Contact Us About Privacy</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If you have any questions about this Privacy Policy or our data practices, please contact us:
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
          <h3 className="text-lg font-semibold text-foreground mb-4">Policy Updates</h3>
          <p className="text-sm text-muted-foreground">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy 
            on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically for any changes.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
