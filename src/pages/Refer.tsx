import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/store';
import { REFERRAL_BONUS, COUNTRIES } from '@/lib/constants';
import { ArrowLeft, Copy, CheckCircle, Users, Gift, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Transaction } from '@/types';

const Refer: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referralHistory, setReferralHistory] = useState<Transaction[]>([]);

  const country = COUNTRIES.find(c => c.code === user?.country);
  const currency = country?.currency || '₦';

  useEffect(() => {
    if (user) {
      const transactions = storage.getTransactions(user.id);
      setReferralHistory(transactions.filter(t => t.type === 'referral'));
    }
  }, [user]);

  const copyCode = () => {
    if (user) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareCode = () => {
    if (user && navigator.share) {
      navigator.share({
        title: 'Join RedPay',
        text: `Join RedPay and earn rewards! Use my referral code: ${user.referralCode}`,
        url: window.location.origin,
      });
    } else {
      copyCode();
    }
  };

  const totalEarnings = referralHistory.reduce((sum, t) => sum + t.amount, 0);

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <PageContainer>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-2 rounded-lg bg-card hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Refer & Earn</h1>
            <p className="text-sm text-muted-foreground">Invite friends, earn rewards</p>
          </div>
        </div>

        {/* Referral Card */}
        <div className="gradient-card rounded-2xl p-6 text-center animate-fade-in">
          <Gift className="w-12 h-12 mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground mb-2">Earn per referral</p>
          <div className="text-3xl font-bold text-foreground mb-4">
            {currency}{REFERRAL_BONUS.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">
            Share your code and earn when friends sign up
          </p>
        </div>

        {/* Referral Code */}
        <div className="bg-card rounded-xl p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">Your Referral Code</p>
          <div className="text-3xl font-mono font-bold text-primary tracking-widest">
            {user.referralCode}
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={copyCode}>
              {copied ? <CheckCircle className="mr-2" size={18} /> : <Copy className="mr-2" size={18} />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button className="flex-1" onClick={shareCode}>
              <Share2 className="mr-2" size={18} />
              Share
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-xl p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold text-foreground">{referralHistory.length}</div>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Gift className="w-6 h-6 mx-auto mb-2 text-success" />
            <div className="text-2xl font-bold text-foreground">
              {currency}{totalEarnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total Earnings</p>
          </div>
        </div>

        {/* Referral History */}
        {referralHistory.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Referral History</h3>
            <div className="space-y-2">
              {referralHistory.map((transaction) => (
                <div key={transaction.id} className="bg-card rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-foreground">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-success font-semibold">
                    +{currency}{transaction.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Refer;
