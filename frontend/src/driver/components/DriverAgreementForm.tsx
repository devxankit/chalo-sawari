import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import apiService from '@/services/api.js';

interface DriverAgreementFormProps {
  onAgreementAccepted: () => void;
  driverName?: string;
}

const DriverAgreementForm: React.FC<DriverAgreementFormProps> = ({ 
  onAgreementAccepted, 
  driverName = "Driver" 
}) => {
  const [agreements, setAgreements] = useState({
    rcValid: false,
    insuranceValid: false,
    roadTaxValid: false,
    drivingLicenseValid: false,
    legalResponsibility: false,
    platformLiability: false,
    serviceResponsibility: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const allAgreementsAccepted = Object.values(agreements).every(accepted => accepted);

  const handleAgreementChange = (key: keyof typeof agreements, checked: boolean) => {
    setAgreements(prev => ({
      ...prev,
      [key]: checked
    }));
    
    // Clear errors when user starts checking boxes
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async () => {
    if (!allAgreementsAccepted) {
      setErrors(['Please accept all conditions to proceed.']);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      const response = await apiService.acceptDriverAgreement({
        agreements: agreements,
        ipAddress: await getClientIP()
      });

      if (response.success) {
        toast({
          title: "Agreement Accepted!",
          description: "Welcome to Chalo Sawaari. You can now access your dashboard.",
          variant: "default",
        });
        
        onAgreementAccepted();
      } else {
        throw new Error(response.error?.message || 'Failed to accept agreement');
      }
    } catch (error: any) {
      console.error('Agreement submission error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit agreement. Please try again.",
        variant: "destructive",
      });
      setErrors([error.message || "Failed to submit agreement. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simple function to get client IP (in a real app, you might want to use a more robust solution)
  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-lg border border-gray-200">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <FileText className="w-12 h-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Driver / Owner Agreement Form
          </CardTitle>
          <CardDescription className="text-lg">
            Welcome {driverName}! Please review and accept the terms below to continue.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Agreement Content */}
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Driver / Owner Declaration
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please tick (✔) the boxes to accept the conditions:
            </p>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="rcValid"
                  checked={agreements.rcValid}
                  onCheckedChange={(checked) => handleAgreementChange('rcValid', checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="rcValid" className="text-sm text-gray-700 cursor-pointer">
                  I declare that my vehicle's Registration Certificate (RC) is valid.
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="insuranceValid"
                  checked={agreements.insuranceValid}
                  onCheckedChange={(checked) => handleAgreementChange('insuranceValid', checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="insuranceValid" className="text-sm text-gray-700 cursor-pointer">
                  My vehicle has a valid and active Insurance Policy.
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="roadTaxValid"
                  checked={agreements.roadTaxValid}
                  onCheckedChange={(checked) => handleAgreementChange('roadTaxValid', checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="roadTaxValid" className="text-sm text-gray-700 cursor-pointer">
                  All applicable Road Tax, Fitness Certificate, and Permits are valid.
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="drivingLicenseValid"
                  checked={agreements.drivingLicenseValid}
                  onCheckedChange={(checked) => handleAgreementChange('drivingLicenseValid', checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="drivingLicenseValid" className="text-sm text-gray-700 cursor-pointer">
                  The Driver holds a valid Driving License.
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="legalResponsibility"
                  checked={agreements.legalResponsibility}
                  onCheckedChange={(checked) => handleAgreementChange('legalResponsibility', checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="legalResponsibility" className="text-sm text-gray-700 cursor-pointer">
                  I accept that any legal, RTO, traffic, accident, penalty, or dispute is my responsibility only (Owner/Driver).
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="platformLiability"
                  checked={agreements.platformLiability}
                  onCheckedChange={(checked) => handleAgreementChange('platformLiability', checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="platformLiability" className="text-sm text-gray-700 cursor-pointer">
                  I agree that "Chalo Sawaari" has no liability or involvement in any such matters.
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="serviceResponsibility"
                  checked={agreements.serviceResponsibility}
                  onCheckedChange={(checked) => handleAgreementChange('serviceResponsibility', checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="serviceResponsibility" className="text-sm text-gray-700 cursor-pointer">
                  I take full responsibility for providing the committed service to the customer.
                </label>
              </div>
            </div>
          </div>

          {/* Final Confirmation */}
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">Final Confirmation</h4>
            <p className="text-sm text-red-700 mb-2">
              The entire responsibility for the vehicle, driver, permits, insurance, and compliance lies with the Owner/Driver.
            </p>
            <p className="text-sm text-red-700">
              Chalo Sawaari (the platform) has no responsibility, liability, or involvement in any disputes, accidents, penalties, or legal matters.
            </p>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={!allAgreementsAccepted || isSubmitting}
              className="w-full max-w-md bg-blue-600 text-white hover:bg-blue-700 h-12 rounded-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Agreement...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept & Continue
                </>
              )}
            </Button>
          </div>

          {/* Footer Note */}
          <div className="text-center text-xs text-gray-500">
            <p>By accepting this agreement, you acknowledge that you have read, understood, and agree to be bound by these terms.</p>
            <p className="mt-1">This agreement is legally binding and will be stored in our records.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverAgreementForm;
