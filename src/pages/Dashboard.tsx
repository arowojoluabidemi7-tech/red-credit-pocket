import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/PageContainer';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/store';
import { db } from '@/lib/db';
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
  Bell,
  ShieldCheck,
  Zap,
  BadgeCheck,
  TrendingUp,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import earningBanner from '@/assets/earning-banner.jpg';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated, isAdmin, loading, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [canClaim, setCanClaim] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [bannerIndex, setBannerIndex] = useState(1);
  const [paymentPending, setPaymentPending] = useState(false);
  const [paymentCheckError, setPaymentCheckError] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [paymentCheckVersion, setPaymentCheckVersion] = useState(0);

  const country = COUNTRIES.find(c => c.code === user?.country);
  const currency = country?.currency || '₦';

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (!user) return;
    if (user.lastClaimTime) {
      const elapsed = Date.now() - user.lastClaimTime;
      if (elapsed < CLAIM_INTERVAL) {
        setCanClaim(false);
        setTimeLeft(Math.ceil((CLAIM_INTERVAL - elapsed) / 1000));
      }
    }
  }, [user, isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (loading || !user || isAdmin) {
      if (!loading) {
        setPaymentPending(false);
        setPaymentCheckError(false);
        setCheckingPayment(false);
      }
      return;
    }
    setCheckingPayment(true);
    let active = true;
    (async () => {
      const { data, error } = await db.from('deposits')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .limit(1);
      if (active) {
        setPaymentPending(!error && Boolean(data?.length));
        setPaymentCheckError(Boolean(error));
        setCheckingPayment(false);
      }
    })();
    return () => { active = false; };
  }, [loading, user, isAdmin, paymentCheckVersion]);

  useEffect(() => {
    if (timeLeft > 0) {
      const t = setInterval(() => {
        setTimeLeft(p => {
          if (p <= 1) { setCanClaim(true); return 0; }
          return p - 1;
        });
      }, 1000);
      return () => clearInterval(t);
    }
  }, [timeLeft]);

  useEffect(() => {
    const t = setInterval(() => setBannerIndex(i => (i + 1) % 4), 3500);
    return () => clearInterval(t);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const formatCurrency = (n: number) => `${currency}${n.toLocaleString()}`;

  const handleClaim = async () => {
    if (!user || !canClaim) return;
    setCanClaim(false);

    const newBalance = Number(user.balance) + CLAIM_AMOUNT;
    const { error } = await db
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', user.id);

    if (error) {
      setCanClaim(true);
      toast.error('Claim failed. Please try again.');
      return;
    }

    storage.claimBonus(user.id);
    await refreshUser();
    setTimeLeft(CLAIM_INTERVAL / 1000);
    toast.success(`${formatCurrency(CLAIM_AMOUNT)} added to your balance!`);
  };

  const menuItems = [
    { icon: Gift, label: 'Buy RPC', sub: 'Get verified', path: '/buy-rpc', color: 'bg-red-500' },
    { icon: Radio, label: 'Broadcast', sub: 'Go live', path: '/broadcast', color: 'bg-purple-500' },
    { icon: Gift, label: 'Refer & Earn', sub: 'Invite friends', path: '/refer', color: 'bg-blue-500' },
    { icon: Users, label: 'Community', sub: 'Join others', path: '/community', color: 'bg-green-500' },
    { icon: Clock, label: 'History', sub: 'View records', path: '/history', color: 'bg-orange-500' },
    { icon: Headphones, label: 'Support', sub: 'Get help', path: '/support', color: 'bg-pink-500' },
  ];

  if (!user || checkingPayment) return null;

   if (paymentPending || paymentCheckError) {
    return (
      <PageContainer showNav={false}>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 text-center space-y-5">
             <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${paymentCheckError ? 'bg-destructive/15' : 'bg-yellow-500/15'}`}>
               <Clock className={`w-8 h-8 ${paymentCheckError ? 'text-destructive' : 'text-yellow-500'}`} />
            </div>
            <div className="space-y-2">
               <h1 className="text-2xl font-bold text-foreground">
                 {paymentCheckError ? 'Unable to verify payment' : 'Payment under review'}
               </h1>
               <p className="text-muted-foreground">
                 {paymentCheckError
                   ? 'Dashboard access is paused until your payment status can be verified.'
                   : 'Your receipt must be approved or rejected before dashboard access is restored.'}
               </p>
            </div>
             <button
               onClick={() => paymentCheckError ? setPaymentCheckVersion((version) => version + 1) : navigate('/buy-rpc')}
               className="w-full rounded-2xl bg-primary py-3 font-semibold text-primary-foreground"
             >
               {paymentCheckError ? 'Try again' : 'View payment status'}
            </button>
            <button onClick={async () => { await logout(); navigate('/'); }} className="w-full rounded-2xl border border-border py-3 font-semibold text-foreground">
              Log out
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const shortId = user.id.replace(/-/g, '').slice(0, 10);

  return (
    <PageContainer showNav={false}>
      <div className="p-4 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => toast.info('No new notifications')}
              className="relative p-2"
              aria-label="Notifications"
            >
              <Bell className="w-6 h-6 text-foreground" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1">
                3
              </span>
            </button>
            <button
              onClick={() => navigate(isAdmin ? '/admin' : '/refer')}
              className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full border border-primary/60 bg-card"
              aria-label="Account"
            >
              <span className="text-sm text-foreground font-medium">
                {user.firstName || 'User'}
              </span>
              <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                {(user.firstName?.[0] || 'U').toUpperCase()}
              </span>
            </button>
            <button
              onClick={async () => { await logout(); navigate('/'); }}
              className="p-2 rounded-full bg-card border border-border hover:bg-muted transition-colors"
              aria-label="Log out"
            >
              <LogOut className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>


        {/* Trust row */}
        <div className="flex items-center justify-around py-1">
          <button
            onClick={() => isAdmin ? navigate('/admin') : toast.success('Your account is secured')}
            className="flex items-center gap-1.5 text-muted-foreground text-sm"
          >
            <ShieldCheck className="w-4 h-4 text-green-500" /> Secured
          </button>
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <Zap className="w-4 h-4 text-yellow-400" /> Instant
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <BadgeCheck className="w-4 h-4 text-blue-500" /> Verified
          </div>
        </div>

        {/* Balance card */}
        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-3xl p-5 shadow-xl">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-white" />
              <span className="text-white/90 font-medium">Total Balance</span>
            </div>
            <button
              onClick={() => toast.info('Tutorial video coming soon')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white text-xs font-medium"
            >
              <Video size={14} /> Watch
            </button>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-4xl font-extrabold text-white leading-none">
                {formatCurrency(user.balance)}
              </div>
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 text-white text-xs">
                <TrendingUp size={12} /> +₦30k
              </div>
              <div className="text-white/70 text-xs mt-2">ID: {shortId}</div>
            </div>

            <Link
              to="/refer"
              className="w-24 rounded-2xl bg-white/10 border border-white/20 p-3 flex flex-col items-center justify-center text-white"
            >
              <Users size={18} />
              <span className="text-xs mt-1">Referrals</span>
              <span className="text-xl font-bold leading-none mt-1">0</span>
            </Link>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleClaim}
              disabled={!canClaim}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-primary font-semibold disabled:opacity-60"
            >
              <Gift size={18} />
              {canClaim ? `Claim ${formatCurrency(CLAIM_AMOUNT)}` : formatTime(timeLeft)}
            </button>
            <Link to="/withdraw" className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/15 text-white font-semibold">
                <Send size={18} /> Withdraw
              </button>
            </Link>
          </div>
        </div>

        {/* Earning banner */}
        <Link to="/refer" className="block">
          <div
            className="relative rounded-2xl overflow-hidden h-40 bg-cover bg-center"
            style={{ backgroundImage: `url(${earningBanner})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
            <div className="relative p-4 h-full flex flex-col justify-center max-w-[65%]">
              <p className="text-white text-xl font-extrabold leading-tight">
                Start earning with<br />
                <span className="text-primary">RedPay</span> today!
              </p>
              <p className="text-white text-sm font-semibold mt-2 leading-tight">
                Turn your phone into<br />your money machine.
              </p>
            </div>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {[0, 1, 2, 3].map(i => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === bannerIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </Link>

        {/* Quick Actions header */}
        <div className="flex items-center justify-between pt-1">
          <h2 className="text-primary text-xl font-bold">Quick Actions</h2>
          <button
            onClick={() => toast.info('More features coming soon')}
            className="flex items-center gap-1 text-muted-foreground text-sm"
          >
            <Sparkles size={14} /> Explore features
          </button>
        </div>

        {/* Menu grid */}
        <div className="grid grid-cols-3 gap-3">
          {menuItems.map(({ icon: Icon, label, sub, path, color }) => (
            <Link
              key={path}
              to={path}
              className="bg-card rounded-2xl p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform"
            >
              <div className={`w-11 h-11 rounded-full ${color} flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground text-center">{label}</span>
              <span className="text-[11px] text-muted-foreground text-center leading-none">{sub}</span>
            </Link>
          ))}
        </div>

        {/* Bottom banner */}
        <Link to="/refer" className="block">
          <div
            className="relative rounded-2xl overflow-hidden h-40 bg-cover bg-center"
            style={{ backgroundImage: `url(${earningBanner})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
            <div className="relative p-4 h-full flex flex-col justify-center max-w-[65%]">
              <p className="text-white text-xl font-extrabold leading-tight">
                Start earning with<br />
                <span className="text-primary">RedPay</span> today!
              </p>
              <p className="text-white text-sm font-semibold mt-2 leading-tight">
                Turn your phone into<br />your money machine.
              </p>
            </div>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {[0, 1, 2, 3].map(i => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === bannerIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </Link>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
