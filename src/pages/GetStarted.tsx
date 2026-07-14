import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { COUNTRIES } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronDown, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const GetStarted: React.FC = () => {
  const navigate = useNavigate();
  const { signup, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'signup' | 'signin'>('signup');

  const [signUpData, setSignUpData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    country: 'NG',
    status: 'individual' as 'individual' | 'business',
    referredBy: '',
  });

  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<'creating' | 'almost-done' | null>(null);

  const selectedCountry = COUNTRIES.find(c => c.code === signUpData.country);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signUpData.firstName || !signUpData.lastName || !signUpData.phone || !signUpData.email || !signUpData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    const { storage } = await import('@/lib/store');
    if (storage.checkEmailExists(signUpData.email)) {
      toast.error(
        <div className="space-y-1">
          <p>This email is already registered.</p>
          <p className="text-sm">
            <a href="/forgot-password" className="text-primary underline">Click here to reset your password</a>
          </p>
        </div>,
        { duration: 5000 }
      );
      return;
    }

    setIsProcessing(true);
    setProcessingStep('creating');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProcessingStep('almost-done');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = signup(signUpData);
    toast.success('Account created successfully!');
    navigate('/welcome', { state: { user } });
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();

    if (!signInData.email || !signInData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    const success = login(signInData.email, signInData.password);
    if (success) {
      toast.success('Welcome back!');
      if (signInData.email === 'admin@redpay.com') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      toast.error('Invalid email or password');
    }
  };

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
    <div className="min-h-screen bg-background flex flex-col items-center px-6 py-8">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo and tagline */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo size="sm" />
          </div>
          <p className="text-muted-foreground text-sm">
            Your gateway to seamless payments
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-3xl p-6 shadow-card space-y-6 animate-slide-up">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Get Started</h1>
            <p className="text-muted-foreground text-sm">
              Create an account or sign in to continue
            </p>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'signup'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('signin')}
              className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'signin'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
          </div>

          {activeTab === 'signup' ? (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-foreground font-medium mb-1.5 block">First Name</label>
                  <Input
                    placeholder="John"
                    value={signUpData.firstName}
                    onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                    className="h-12 rounded-xl bg-input border-0"
                  />
                </div>
                <div>
                  <label className="text-sm text-foreground font-medium mb-1.5 block">Last Name</label>
                  <Input
                    placeholder="Doe"
                    value={signUpData.lastName}
                    onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                    className="h-12 rounded-xl bg-input border-0"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-foreground font-medium mb-1.5 block">Phone Number</label>
                <Input
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={signUpData.phone}
                  onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                  className="h-12 rounded-xl bg-input border-0"
                />
              </div>

              <div>
                <label className="text-sm text-foreground font-medium mb-1.5 block">Email</label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={signUpData.email}
                  onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                  className="h-12 rounded-xl bg-input border-0"
                />
              </div>

              <div>
                <label className="text-sm text-foreground font-medium mb-1.5 block">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    className="h-12 rounded-xl bg-input border-0 pr-10"
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

              <div>
                <label className="text-sm text-foreground font-medium mb-1.5 block">Country</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCountrySelect(!showCountrySelect)}
                    className="w-full h-12 px-4 rounded-xl bg-input flex items-center justify-between text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-xl">{selectedCountry?.flag}</span>
                      <span>{selectedCountry?.name}</span>
                    </span>
                    <ChevronDown size={20} className="text-muted-foreground" />
                  </button>
                  {showCountrySelect && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-10 overflow-hidden">
                      {COUNTRIES.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            setSignUpData({ ...signUpData, country: country.code });
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

              <div>
                <label className="text-sm text-foreground font-medium mb-1.5 block">Status</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSignUpData({ ...signUpData, status: signUpData.status === 'individual' ? 'business' : 'individual' })}
                    className="w-full h-12 px-4 rounded-xl bg-input flex items-center justify-between text-foreground"
                  >
                    <span className="capitalize">{signUpData.status}</span>
                    <ChevronDown size={20} className="text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-foreground font-medium mb-1.5 block">Referral Code (Optional)</label>
                <Input
                  placeholder="Enter code"
                  value={signUpData.referredBy}
                  onChange={(e) => setSignUpData({ ...signUpData, referredBy: e.target.value.toUpperCase() })}
                  className="h-12 rounded-xl bg-input border-0"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Have a referral code? Add it to earn rewards.
                </p>
              </div>

              <Button type="submit" size="lg" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-red">
                Create Account
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="text-sm text-foreground font-medium mb-1.5 block">Email</label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={signInData.email}
                  onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                  className="h-12 rounded-xl bg-input border-0"
                />
              </div>

              <div>
                <label className="text-sm text-foreground font-medium mb-1.5 block">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    className="h-12 rounded-xl bg-input border-0 pr-10"
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

              <Button type="submit" size="lg" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-red">
                Sign In
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default GetStarted;
