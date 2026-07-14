import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/PageContainer';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/store';

import { COUNTRIES, CLAIM_AMOUNT, CLAIM_INTERVAL } from '@/lib/constants';
import {
  Wallet,
  Gift,
  ShoppingBag,
  Radio,
  Users,
  Clock,
  Headphones,
  Send,
  Video,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import cashInBanner from '@/assets/cash-in-banner.jpg';
import earningBanner from '@/assets/earning-banner.jpg';


const Dashboard: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [canClaim, setCanClaim] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  const country = COUNTRIES.find(c => c.code === user?.country);
  const currency = country?.currency || '₦';

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    // Check claim timer
    if (user.lastClaimTime) {
      const elapsed = Date.now() - user.lastClaimTime;
      if (elapsed < CLAIM_INTERVAL) {
        setCanClaim(false);
        setTimeLeft(Math.ceil((CLAIM_INTERVAL - elapsed) / 1000));
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setCanClaim(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toLocaleString()}`;
  };

  const handleClaim = () => {
    if (!user || !canClaim) return;
    
    const success = storage.claimBonus(user.id);
    if (success) {
      refreshUser();
      setCanClaim(false);
      setTimeLeft(CLAIM_INTERVAL / 1000);
      toast.success(`${formatCurrency(CLAIM_AMOUNT)} claimed successfully!`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { icon: ShoppingBag, label: 'BuyRPC', path: '/buy-rpc', bgColor: 'bg-red-600' },
    { icon: Radio, label: 'Broadcast', path: '/broadcast', bgColor: 'bg-purple-600' },
    { icon: Gift, label: 'Refer&Earn', path: '/refer', bgColor: 'bg-blue-600' },
    { icon: Users, label: 'Community', path: '/community', bgColor: 'bg-green-600' },
    { icon: Clock, label: 'History', path: '/history', bgColor: 'bg-orange-500' },
    { icon: Headphones, label: 'Support', path: '/support', bgColor: 'bg-cyan-500' },
  ];

  if (!user) return null;

  return (
    <PageContainer>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLogout} 
              className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center bg-card"
            >
              <span className="text-primary font-bold text-sm">RP</span>
            </button>
          </div>
        </div>

        {/* Video Button */}
        <div className="flex justify-end">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-muted-foreground/30 text-muted-foreground text-sm">
            <Video size={16} />
            Video
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-white/80" />
            <span className="text-sm text-white/80">Total Balance</span>
          </div>
          <div className="text-4xl font-bold text-white mb-1">
            {formatCurrency(user.balance)}
          </div>
          <div className="text-sm text-white/60 mb-4">
            ID: {user.id}
          </div>
          
          {/* Claim & Withdraw Buttons inside card */}
          <div className="flex gap-3">
            <button 
              onClick={handleClaim}
              disabled={!canClaim}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/20 backdrop-blur-sm text-white font-medium disabled:opacity-50 transition-all hover:bg-white/30"
            >
              <Gift size={18} />
              {canClaim ? `Claim ${formatCurrency(CLAIM_AMOUNT)}` : formatTime(timeLeft)}
            </button>
            <Link to="/withdraw" className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/20 backdrop-blur-sm text-white font-medium transition-all hover:bg-white/30">
                <Send size={18} />
                Withdraw
              </button>
            </Link>
          </div>
        </div>


        {/* Menu Grid */}
        <div className="grid grid-cols-3 gap-3 animate-slide-up">
          {menuItems.map(({ icon: Icon, label, path, bgColor }) => (
            <Link
              key={path}
              to={path}
              className="bg-card rounded-2xl p-4 flex flex-col items-center gap-3 hover:bg-muted transition-all duration-200 hover:scale-105"
            >
              <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-foreground">{label}</span>
            </Link>
          ))}
        </div>

        {/* Bottom Promo Banner */}
        <div className="relative bg-gradient-to-r from-background via-red-950/40 to-red-900/30 rounded-2xl p-5 overflow-hidden">
          <div className="max-w-[60%]">
            <p className="text-white text-lg font-semibold leading-tight">
              Start earning with <span className="text-primary">RedPay</span> today!
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Turn your phone into your money machine.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
