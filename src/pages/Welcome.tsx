import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { Gift, PartyPopper, ArrowRight } from 'lucide-react';
import { WELCOME_BONUS, COUNTRIES } from '@/lib/constants';

const Welcome: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;
  const [displayBalance, setDisplayBalance] = useState(0);

  const country = COUNTRIES.find(c => c.code === user?.country);
  const currency = country?.currency || '₦';

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toLocaleString()}`;
  };

  useEffect(() => {
    const duration = 2200;
    const start = performance.now();
    const from = 0;
    const to = WELCOME_BONUS;

    let raf: number;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(from + (to - from) * easeOutQuart);
      setDisplayBalance(current);
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Confetti Animation */}
        <div className="relative">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce">
            <PartyPopper className="w-16 h-16 text-primary" />
          </div>
        </div>

        {/* Logo */}
        <div className="flex justify-center pt-8 animate-fade-in">
          <Logo size="lg" />
        </div>

        {/* Welcome Message */}
        <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome, {user?.firstName}! 🎉
          </h1>
          <p className="text-muted-foreground">
            Your account has been created successfully
          </p>
        </div>

        {/* Bonus Card */}
        <div className="gradient-card rounded-2xl p-6 shadow-card animate-scale-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gift className="w-8 h-8 text-primary" />
            <span className="text-lg font-medium text-muted-foreground">Welcome Bonus</span>
          </div>
          <div className="text-4xl font-bold text-gradient animate-pulse-glow rounded-lg py-2">
            {formatCurrency(displayBalance)}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Added to your wallet balance
          </p>
        </div>

        {/* User Info */}
        <div className="glass-card rounded-xl p-4 text-left space-y-2 animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="flex justify-between">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-mono font-medium">{user?.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Referral Code</span>
            <span className="font-mono font-medium text-primary">{user?.referralCode}</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="animate-slide-up" style={{ animationDelay: '0.8s' }}>
          <Button size="xl" className="w-full" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
            <ArrowRight className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
