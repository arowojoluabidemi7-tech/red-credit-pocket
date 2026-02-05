import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { COUNTRIES, VALID_RPC_CODE } from '@/lib/constants';
import { storage } from '@/lib/store';
import { ArrowLeft, Phone, Wifi, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

type ServiceType = 'airtime' | 'data';

const Broadcast: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser, refreshUser } = useAuth();
  const [serviceType, setServiceType] = useState<ServiceType>('airtime');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [rpcCode, setRpcCode] = useState('');

  const country = COUNTRIES.find(c => c.code === user?.country);
  const currency = country?.currency || '₦';

  const handlePurchase = () => {
    if (!phone || !amount || !rpcCode) {
      toast.error('Please fill in all fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (rpcCode !== VALID_RPC_CODE) {
      toast.error('Invalid RPC code');
      return;
    }

    if (!user || user.balance < amountNum) {
      toast.error('Insufficient balance');
      return;
    }

    // Deduct balance and create transaction
    updateUser({ balance: user.balance - amountNum });
    
    storage.addTransaction({
      userId: user.id,
      type: serviceType,
      amount: amountNum,
      status: 'completed',
      description: `${serviceType === 'airtime' ? 'Airtime' : 'Data'} purchase for ${phone}`,
    });

    toast.success(`${serviceType === 'airtime' ? 'Airtime' : 'Data'} purchased successfully!`);
    refreshUser();
    navigate('/dashboard');
  };

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
            <h1 className="text-xl font-bold">Broadcast</h1>
            <p className="text-sm text-muted-foreground">Buy Airtime & Data</p>
          </div>
        </div>

        {/* Balance Display */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Available Balance</span>
            <span className="text-xl font-bold text-foreground">
              {currency}{user.balance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Service Toggle */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setServiceType('airtime')}
            className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
              serviceType === 'airtime'
                ? 'gradient-red shadow-red'
                : 'bg-card hover:bg-muted'
            }`}
          >
            <Phone className={`w-6 h-6 ${serviceType === 'airtime' ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
            <span className={`font-medium ${serviceType === 'airtime' ? 'text-primary-foreground' : 'text-foreground'}`}>
              Airtime
            </span>
          </button>
          <button
            onClick={() => setServiceType('data')}
            className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
              serviceType === 'data'
                ? 'gradient-red shadow-red'
                : 'bg-card hover:bg-muted'
            }`}
          >
            <Wifi className={`w-6 h-6 ${serviceType === 'data' ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
            <span className={`font-medium ${serviceType === 'data' ? 'text-primary-foreground' : 'text-foreground'}`}>
              Data
            </span>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 animate-fade-in">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Phone Number</label>
            <Input
              type="tel"
              placeholder="08012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Amount ({currency})</label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">RPC Access Code</label>
            <Input
              placeholder="Enter your RPC code"
              value={rpcCode}
              onChange={(e) => setRpcCode(e.target.value.toUpperCase())}
            />
          </div>

          {/* Warning */}
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-warning">
              RPC code is required to complete this purchase. Buy RPC if you don't have one.
            </p>
          </div>

          <Button size="lg" className="w-full" onClick={handlePurchase}>
            Purchase {serviceType === 'airtime' ? 'Airtime' : 'Data'}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};

export default Broadcast;
