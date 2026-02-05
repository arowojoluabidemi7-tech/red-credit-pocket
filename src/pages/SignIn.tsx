import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    const success = login(email, password);
    if (success) {
      toast.success('Welcome back!');
      // Check if admin login
      if (email === 'admin@redpay.com') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      toast.error('Invalid email or password');
    }
  };

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
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to continue to RedPay</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Email</label>
            <Input
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot Password?
              </Link>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full">
            Sign In
          </Button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
