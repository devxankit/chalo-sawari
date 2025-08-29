import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, CreditCard, AlertTriangle, Shield, FileText, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import TopNavigation from "@/components/TopNavigation";

const CancellationPolicy = () => {
  const cancellationSections = [
    {
      id: 1,
      title: "Cancellation Timeframes",
      icon: Clock,
      content: `Our cancellation policy is designed to be fair and transparent for all users:

Free Cancellation:
• Up to 2 hours before departure time
• Full refund will be processed
• No cancellation charges apply

Partial Refund:
• 2-24 hours before departure time
• 50% of the booking amount will be refunded
• 50% cancellation charges apply

No Refund:
• Within 1 hour of departure time
• After departure time has passed
• For no-show situations

Special Cases:
• Group bookings (10+ passengers) have different terms
• Festival and peak season bookings may have extended cancellation charges
• Promotional bookings may have non-refundable terms`
    },
    {
      id: 2,
      title: "Refund Process",
      icon: CreditCard,
      content: `We ensure a smooth and transparent refund process:

Processing Time:
• Refunds are processed within 3-5 business days
• Processing time may vary based on payment method
• Bank processing may take additional 2-3 days

Refund Method:
• Amount is credited to your original payment method
• Credit card refunds appear on your next statement
• UPI refunds are processed directly to your account
• Net banking refunds are credited to your bank account

Refund Confirmation:
• You will receive an email confirmation once processed
• SMS notification will be sent for successful refunds
• Check your booking history for refund status
• Contact customer support if refund is delayed

Processing Fees:
• Payment gateway charges may be deducted
• Bank processing fees may apply
• Service charges are non-refundable`
    },
    {
      id: 3,
      title: "Modification Policy",
      icon: FileText,
      content: `You can modify your booking under certain conditions:

Allowed Modifications:
• Change travel date (subject to availability)
• Modify passenger details and contact information
• Update pickup location (if route allows)
• Change seat preferences (if available)

Modification Charges:
• Date changes: ₹50 per booking
• Passenger detail updates: Free
• Contact information changes: Free
• Pickup location changes: ₹25 per booking

Modification Timeframe:
• Changes must be made at least 2 hours before departure
• Some bookings may not be eligible for modification
• Peak season bookings may have restrictions
• Group bookings require special approval

How to Modify:
• Use our website or mobile app
• Contact customer support
• Visit our booking office
• Call our helpline number`
    },
    {
      id: 4,
      title: "Force Majeure & Special Circumstances",
      icon: AlertTriangle,
      content: `Certain situations are beyond our control and have special policies:

Weather Conditions:
• No refunds for weather-related cancellations
• Alternative arrangements will be made when possible
• Rescheduling options may be available
• Safety is our top priority

Government Regulations:
• Lockdown or travel restrictions
• Route diversions or closures
• Emergency situations
• Policy changes affecting travel

Natural Disasters:
• Floods, earthquakes, or other natural calamities
• Road blockages or infrastructure damage
• Emergency evacuations
• Force majeure events

Our Response:
• We will make reasonable efforts to provide alternatives
• Full or partial refunds may be offered at our discretion
• Rescheduling to next available service
• Credit vouchers for future travel`
    },
    {
      id: 5,
      title: "Booking Cancellation by Chalo Sawari",
      icon: Shield,
      content: `In rare cases, we may need to cancel bookings:

Reasons for Cancellation:
• Vehicle breakdown or technical issues
• Driver unavailability
• Route closure or safety concerns
• Overbooking situations
• Regulatory compliance issues

Our Compensation:
• Full refund of booking amount
• Alternative transportation arrangements
• Compensation for inconvenience (if applicable)
• Priority booking for rescheduled travel

Notification Process:
• Immediate notification via SMS and email
• Phone call for urgent cancellations
• Website and app notifications
• Social media updates for major disruptions

Customer Rights:
• Right to full refund
• Right to alternative arrangements
• Right to compensation (as per policy)
• Right to reschedule without charges`
    },
    {
      id: 6,
      title: "Group Booking Policy",
      icon: FileText,
      content: `Special terms apply for group bookings (10+ passengers):

Cancellation Terms:
• 7 days before departure: Full refund
• 3-7 days before departure: 75% refund
• 1-3 days before departure: 50% refund
• Less than 24 hours: No refund

Group Modifications:
• Date changes: ₹100 per booking
• Passenger count changes: ₹50 per person
• Route changes: Subject to availability and charges
• Special requests: Additional charges may apply

Group Responsibilities:
• Designated group leader must coordinate
• All payments must be made in advance
• Passenger list must be finalized 24 hours before travel
• Group behavior and safety guidelines must be followed

Special Services:
• Dedicated customer support for groups
• Customized pickup and drop points
• Special meal arrangements (if applicable)
• Group discounts and promotional offers`
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
          <h1 className="text-xl font-semibold">Cancellation Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 pb-20">
        {/* Introduction */}
        <Card className="p-6 border border-border">
          <div className="text-center">
            <Clock className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-4">Cancellation & Refund Policy</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We understand that travel plans can change. Our cancellation policy is designed to be fair and transparent, 
              providing you with flexibility while ensuring the sustainability of our services.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: January 2025
            </p>
          </div>
        </Card>

        {/* Cancellation Sections */}
        <div className="space-y-4">
          {cancellationSections.map((section) => (
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

        {/* Quick Reference */}
        <Card className="p-6 border border-border bg-primary/5">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold text-green-800">2+ Hours Before</h4>
              <p className="text-sm text-green-700">Full Refund</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <h4 className="font-semibold text-yellow-800">2-24 Hours Before</h4>
              <p className="text-sm text-yellow-700">50% Refund</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <Clock className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <h4 className="font-semibold text-red-800">Within 1 Hour</h4>
              <p className="text-sm text-red-700">No Refund</p>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6 border border-border bg-primary/5">
          <h3 className="text-lg font-semibold text-foreground mb-4">Need Help with Cancellation?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If you need assistance with cancellation or have questions about our policy, please contact us:
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

        {/* Important Notes */}
        <Card className="p-6 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Important Notes</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• All times are calculated based on the scheduled departure time</p>
            <p>• Refund processing time may vary based on your payment method</p>
            <p>• Cancellation charges are non-refundable</p>
            <p>• Group bookings have different cancellation terms</p>
            <p>• Promotional bookings may have special cancellation conditions</p>
            <p>• We reserve the right to modify this policy with prior notice</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CancellationPolicy;
