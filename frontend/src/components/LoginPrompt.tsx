import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Lock, ArrowRight } from 'lucide-react';

interface LoginPromptProps {
  title?: string;
  description?: string;
  showRegister?: boolean;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ 
  title = "Login Required", 
  description = "Please login to access this feature",
  showRegister = true 
}) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link to="/auth" className="w-full">
            <Button className="w-full" size="lg">
              <User className="w-4 h-4 mr-2" />
              Login to Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          
          {showRegister && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Don't have an account?
              </p>
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  Create Account
                </Button>
              </Link>
            </div>
          )}
          
          <div className="text-center">
            <Link to="/" className="text-sm text-primary hover:underline">
              ← Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPrompt;
