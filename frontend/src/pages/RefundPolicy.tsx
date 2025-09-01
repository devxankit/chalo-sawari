import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, CreditCard, Clock, CheckCircle, AlertCircle, Shield, FileText, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import TopNavigation from "../components/TopNavigation";

const RefundPolicy = () => {
  const refundSections = [
    {
      id: 1,
      title: "Refund Eligibility",
      icon: CheckCircle,
      content: `You are eligible for refunds under the following circumstances:

Automatic Refunds:
• Cancellation within 2 hours of booking (if departure is more than 2 hours away)
• Service cancellation by Chalo Sawari
• Technical issues preventing service delivery
• Overbooking situations

Partial Refunds:
• Cancellation 2-24 hours before departure (50% refund)
• Group booking cancellations (as per group policy)
• Promotional booking cancellations (terms may vary)

No Refunds:
• Cancellation within 1 hour of departure
• No-show situations
• Completed journeys
• Force majeure events (weather, natural disasters)
• Government-imposed travel restrictions

Special Cases:
• Medical emergencies (documentation required)
• Death in family (documentation required)
• Military personnel deployment (documentation required)
• These cases are reviewed on individual basis`
    },
    {
      id: 2,
      title: "Refund Processing Timeline",
      icon: Clock,
      content: `We process refunds as quickly as possible:

Processing Timeframes:
• Credit Card: 3-5 business days
• Debit Card: 3-5 business days
• UPI: 2-3 business days
• Net Banking: 3-7 business days
• Digital Wallets: 2-4 business days

Bank Processing:
• Additional 2-3 days for bank processing
• International cards may take 7-10 business days
• Weekend and holidays are not counted
• Processing starts from next business day

Refund Confirmation:
• Email confirmation within 24 hours of processing
• SMS notification for successful refunds
• Check your booking history for status updates
• Contact support if refund is delayed beyond timeline

Factors Affecting Processing:
• Payment method used
• Bank processing times
• Weekend and holiday delays
• Technical issues (rare)`
    },
    {
      id: 3,
      title: "Refund Methods",
      icon: CreditCard,
      content: `Refunds are processed to your original payment method:

Credit/Debit Cards:
• Refunded to the same card used for booking
• Appears on your next billing statement
• International cards may take longer
• Contact your bank if refund doesn't appear

UPI Payments:
• Refunded to the same UPI ID
• Google Pay, PhonePe, Paytm, etc.
• Usually processed within 2-3 days
• Check your UPI app for notifications

Net Banking:
• Refunded to the same bank account
• Account number and IFSC must match
• Processing time varies by bank
• Check your bank statement

Digital Wallets:
• Refunded to the same wallet
• Amazon Pay, Mobikwik, Freecharge, etc.
• Processing time: 2-4 business days
• Check wallet balance and transaction history

Cash Payments:
• Refunded via bank transfer
• Valid bank account required
• Additional verification may be needed
• Processing time: 5-7 business days`
    },
    {
      id: 4,
      title: "Refund Amount Calculation",
      icon: FileText,
      content: `Refund amounts are calculated based on our policy:

Full Refund (100%):
• Cancellation 2+ hours before departure
• Service cancellation by Chalo Sawari
• Technical issues on our end
• Overbooking situations

Partial Refund (50%):
• Cancellation 2-24 hours before departure
• Standard cancellation policy applies
• Base fare refunded, taxes and fees may vary

No Refund (0%):
• Cancellation within 1 hour of departure
• No-show situations
• Completed journeys
• Force majeure events

Deductions:
• Payment gateway charges (if applicable)
• Processing fees (if applicable)
• Service charges (non-refundable)
• Bank charges (if applicable)

Group Bookings:
• 7+ days before: 100% refund
• 3-7 days before: 75% refund
• 1-3 days before: 50% refund
• Less than 24 hours: No refund

Promotional Bookings:
• Terms vary by promotion
• Some may be non-refundable
• Check specific terms at time of booking`
    },
    {
      id: 5,
      title: "Refund Status Tracking",
      icon: Shield,
      content: `Track your refund status through multiple channels:

Online Tracking:
• Login to your account
• Go to 'My Bookings' section
• Click on the specific booking
• View refund status and timeline

Email Notifications:
• Refund initiation confirmation
• Processing status updates
• Completion notification
• Check spam folder if not received

SMS Updates:
• Refund processing notifications
• Completion confirmations
• Important status updates
• Ensure mobile number is correct

Customer Support:
• Call our helpline for status updates
• Email support for detailed queries
• Live chat for immediate assistance
• Visit our booking office

What to Check:
• Refund amount and method
• Processing timeline
• Expected completion date
• Any issues or delays

If Refund is Delayed:
• Check with your bank first
• Contact our customer support
• Provide booking reference number
• Allow processing time before escalation`
    },
    {
      id: 6,
      title: "Dispute Resolution",
      icon: AlertCircle,
      content: `If you have issues with your refund:

Common Issues:
• Refund not received within timeline
• Incorrect refund amount
• Refund to wrong account
• Technical processing errors

Resolution Process:
• Contact customer support immediately
• Provide booking reference number
• Explain the issue clearly
• Provide supporting documentation

Documentation Required:
• Booking confirmation
• Payment receipt
• Bank statement (if applicable)
• Any relevant correspondence

Escalation Process:
• Level 1: Customer Support
• Level 2: Senior Support Manager
• Level 3: Refund Department Head
• Level 4: Customer Relations Manager

Timeline for Resolution:
• Initial response: Within 24 hours
• Investigation: 2-3 business days
• Resolution: 5-7 business days
• Complex cases: Up to 14 days

Your Rights:
• Right to full refund (as per policy)
• Right to timely processing
• Right to clear communication
• Right to escalate unresolved issues`
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
          <h1 className="text-xl font-semibold">Refund Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 pb-20">
        {/* Introduction */}
        <Card className="p-6 border border-border">
          <div className="text-center">
            <CreditCard className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-4">Refund Policy</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We are committed to processing your refunds quickly and transparently. This policy outlines our refund procedures, 
              timelines, and how to track your refund status.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: January 2025
            </p>
          </div>
        </Card>

        {/* Refund Sections */}
        <div className="space-y-4">
          {refundSections.map((section) => (
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

        {/* Processing Timeline */}
        <Card className="p-6 border border-border bg-primary/5">
          <h3 className="text-lg font-semibold text-foreground mb-4">Refund Processing Timeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold text-blue-800">UPI</h4>
              <p className="text-sm text-blue-700">2-3 Days</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CreditCard className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold text-green-800">Cards</h4>
              <p className="text-sm text-green-700">3-5 Days</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <FileText className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <h4 className="font-semibold text-yellow-800">Net Banking</h4>
              <p className="text-sm text-yellow-700">3-7 Days</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-semibold text-purple-800">Wallets</h4>
              <p className="text-sm text-purple-700">2-4 Days</p>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6 border border-border bg-primary/5">
          <h3 className="text-lg font-semibold text-foreground mb-4">Need Help with Refunds?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If you have questions about your refund or need assistance, please contact us:
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
            <p>• Refunds are processed to the original payment method</p>
            <p>• Processing time excludes weekends and bank holidays</p>
            <p>• International cards may take longer to process</p>
            <p>• Keep your booking reference number for tracking</p>
            <p>• Contact support if refund is delayed beyond timeline</p>
            <p>• We reserve the right to modify this policy with prior notice</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RefundPolicy;


