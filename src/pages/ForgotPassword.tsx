import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { ArrowLeft, Mail, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { storage } from '@/lib/store';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'code' | 'newPassword' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    // Check if email exists
    if (!storage.checkEmailExists(email)) {
      toast.error('No account found with this email address');
      return;
    }

    setIsLoading(true);
    
    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const code = generateVerificationCode();
    setGeneratedCode(code);
    
    // In a real app, this would send an email. For now, we'll show the code in a toast
    toast.success(
      <div className="space-y-1">
        <p>Verification code sent!</p>
        <p className="text-sm font-mono bg-muted px-2 py-1 rounded">Code: {code}</p>
      </div>,
      { duration: 10000 }
    );
    
    setIsLoading(false);
    setStep('code');
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode) {
      toast.error('Please enter the verification code');
      return;
    }

    if (verificationCode !== generatedCode) {
      toast.error('Invalid verification code');
      return;
    }

    setStep('newPassword');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const success = storage.updateUserPassword(email, newPassword);
    
    if (success) {
      setIsLoading(false);
      setStep('success');
    } else {
      toast.error('Failed to update password. Please try again.');
      setIsLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Password Reset!</h2>
            <p className="text-muted-foreground">Your password has been successfully updated</p>
          </div>
          <Button onClick={() => navigate('/signin')} className="w-full max-w-xs">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/signin" className="p-2 rounded-lg bg-card hover:bg-muted transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <Logo size="sm" />
        </div>

        {/* Step: Email */}
        {step === 'email' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Forgot Password</h1>
              <p className="text-muted-foreground">Enter your email to receive a verification code</p>
            </div>

            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Email Address</label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-10"
                  />
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </Button>
            </form>

            <p className="text-center text-muted-foreground">
              Remember your password?{' '}
              <Link to="/signin" className="text-primary font-medium hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        )}

        {/* Step: Verification Code */}
        {step === 'code' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Enter Verification Code</h1>
              <p className="text-muted-foreground">We sent a 6-digit code to {email}</p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Verification Code</label>
                <Input
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                />
              </div>

              <Button type="submit" className="w-full">
                Verify Code
              </Button>

              <button
                type="button"
                onClick={() => {
                  const code = generateVerificationCode();
                  setGeneratedCode(code);
                  toast.success(
                    <div className="space-y-1">
                      <p>New code sent!</p>
                      <p className="text-sm font-mono bg-muted px-2 py-1 rounded">Code: {code}</p>
                    </div>,
                    { duration: 10000 }
                  );
                }}
                className="w-full text-primary hover:underline text-sm"
              >
                Resend Code
              </button>
            </form>
          </div>
        )}

        {/* Step: New Password */}
        {step === 'newPassword' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Create New Password</h1>
              <p className="text-muted-foreground">Enter your new password below</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">New Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
