import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { ArrowRight, Shield, Zap, Gift } from 'lucide-react';

const features = [
  { icon: Shield, text: 'Secure Transactions' },
  { icon: Zap, text: 'Instant Payments' },
  { icon: Gift, text: 'Earn Rewards' },
];

const GetStarted: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-12 animate-fade-in">
        {/* Logo Section */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Logo size="xl" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Your gateway to seamless payments
            </h1>
            <p className="text-muted-foreground">
              Buy airtime, earn rewards, and manage your money with ease
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="flex justify-center gap-8">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex flex-col items-center gap-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground text-center">{text}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Link to="/signup" className="block">
            <Button size="xl" className="w-full">
              Sign Up
              <ArrowRight className="ml-2" />
            </Button>
          </Link>
          <Link to="/signin" className="block">
            <Button variant="outline" size="xl" className="w-full">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: '0.6s' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default GetStarted;
