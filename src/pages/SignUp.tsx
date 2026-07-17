import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { COUNTRIES } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ChevronDown, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    country: 'NG',
    status: 'individual' as 'individual' | 'business',
    referredBy: '',
  });
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<'creating' | 'almost-done' | null>(null);

  const selectedCountry = COUNTRIES.find(c => c.code === formData.country);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('creating');

    const { error, user } = await signup(formData);
    if (error) {
      setIsProcessing(false);
      if (error.toLowerCase().includes('registered') || error.toLowerCase().includes('exists')) {
        toast.error(
          <div className="space-y-1">
            <p>This email is already registered.</p>
            <p className="text-sm">
              <a href="/forgot-password" className="text-primary underline">Reset your password</a>
            </p>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.error(error);
      }
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
    setProcessingStep('almost-done');
    await new Promise(resolve => setTimeout(resolve, 800));

    toast.success('Account created successfully!');
    navigate('/welcome', { state: { user } });
  };

  // Processing overlay
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              {processingStep === 'creating' ? 'Creating your account...' : 'Your account is almost done!'}
            </h2>
            <p className="text-muted-foreground">
              {processingStep === 'creating' 
                ? 'Please wait while we set up your account' 
                : 'Just a moment more...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 rounded-lg bg-card hover:bg-muted transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <Logo size="sm" />
        </div>

        {/* Title */}
        <div className="space-y-2 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground">Join RedPay and start earning today</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">First Name</label>
              <Input
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Last Name</label>
              <Input
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Phone Number</label>
            <Input
              type="tel"
              placeholder="08012345678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Email</label>
            <Input
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Country Selector */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Country</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCountrySelect(!showCountrySelect)}
                className="w-full h-12 px-4 rounded-lg border border-border bg-input flex items-center justify-between text-foreground"
              >
                <span className="flex items-center gap-2">
                  <span className="text-xl">{selectedCountry?.flag}</span>
                  <span>{selectedCountry?.name}</span>
                </span>
                <ChevronDown size={20} className="text-muted-foreground" />
              </button>
              {showCountrySelect && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                  {COUNTRIES.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, country: country.code });
                        setShowCountrySelect(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-2 hover:bg-muted transition-colors text-left"
                    >
                      <span className="text-xl">{country.flag}</span>
                      <span>{country.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Account Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'individual' })}
                className={`h-12 rounded-lg border-2 font-medium transition-all ${
                  formData.status === 'individual'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'business' })}
                className={`h-12 rounded-lg border-2 font-medium transition-all ${
                  formData.status === 'business'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                Business
              </button>
            </div>
          </div>

          {/* Referral Code */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Referral Code (Optional)</label>
            <Input
              placeholder="Enter referral code"
              value={formData.referredBy}
              onChange={(e) => setFormData({ ...formData, referredBy: e.target.value.toUpperCase() })}
            />
          </div>

          <Button type="submit" size="lg" className="w-full mt-6">
            Create Account
          </Button>
        </form>

        {/* Sign In Link */}
        <p className="text-center text-muted-foreground">
          Already have an account?{' '}
          <Link to="/signin" className="text-primary font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
