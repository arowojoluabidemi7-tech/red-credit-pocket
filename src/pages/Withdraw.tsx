import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/store';
import { BANKS, MIN_WITHDRAWAL, COUNTRIES, VALID_RPC_CODE } from '@/lib/constants';
import { ArrowLeft, ChevronDown, Wallet, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

type Step = 'form' | 'processing' | 'success' | 'failed';

const Withdraw: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser, refreshUser } = useAuth();
  const [step, setStep] = useState<Step>('form');
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [rpcCode, setRpcCode] = useState('');
  const [showBankSelect, setShowBankSelect] = useState(false);

  const country = COUNTRIES.find(c => c.code === user?.country);
  const currency = country?.currency || '₦';

  const selectedBankData = BANKS.find(b => b.id === selectedBank);

  const handleWithdraw = () => {
    const amountNum = parseFloat(amount);

    if (!amount || !selectedBank || !accountNumber || !accountName || !rpcCode) {
      toast.error('Please fill in all fields');
      return;
    }

    if (isNaN(amountNum) || amountNum < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is ${currency}${MIN_WITHDRAWAL.toLocaleString()}`);
      return;
    }

    if (!user || user.balance < amountNum) {
      toast.error('Insufficient balance');
      return;
    }

    // Check RPC code
    if (rpcCode !== VALID_RPC_CODE) {
      toast.error('Invalid RPC code');
      setStep('failed');
      return;
    }

    // Show processing
    setStep('processing');

    // Simulate processing delay
    setTimeout(() => {
      // Deduct balance
      updateUser({ balance: user.balance - amountNum });

      // Create withdrawal record
      storage.addWithdrawal({
        userId: user.id,
        amount: amountNum,
        bankName: selectedBankData?.name || '',
        accountNumber,
        accountName,
        status: 'processing',
      });

      // Create transaction
      storage.addTransaction({
        userId: user.id,
        type: 'withdrawal',
        amount: amountNum,
        status: 'pending',
        description: `Withdrawal to ${selectedBankData?.name}`,
      });

      refreshUser();
      setStep('success');
    }, 3000);
  };

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <PageContainer showNav={step === 'form'}>
      <div className="p-4 space-y-6">
        {step === 'form' && (
          <>
            {/* Header */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="p-2 rounded-lg bg-card hover:bg-muted transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold">Withdraw</h1>
                <p className="text-sm text-muted-foreground">Transfer to bank</p>
              </div>
            </div>

            {/* Balance */}
            <div className="gradient-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Available Balance</span>
              </div>
              <div className="text-3xl font-bold text-foreground">
                {currency}{user.balance.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Minimum withdrawal: {currency}{MIN_WITHDRAWAL.toLocaleString()}
              </p>
            </div>

            {/* Form */}
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Amount ({currency})</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {/* Bank Selector */}
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Select Bank</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowBankSelect(!showBankSelect)}
                    className="w-full h-12 px-4 rounded-lg border border-border bg-input flex items-center justify-between text-foreground"
                  >
                    <span>{selectedBankData?.name || 'Select a bank'}</span>
                    <ChevronDown size={20} className="text-muted-foreground" />
                  </button>
                  {showBankSelect && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      {BANKS.map((bank) => (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => {
                            setSelectedBank(bank.id);
                            setShowBankSelect(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-muted transition-colors"
                        >
                          {bank.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Account Number</label>
                <Input
                  type="text"
                  placeholder="Enter account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Account Name</label>
                <Input
                  type="text"
                  placeholder="Enter account name"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">RPC Code</label>
                <Input
                  placeholder="Enter your RPC code"
                  value={rpcCode}
                  onChange={(e) => setRpcCode(e.target.value.toUpperCase())}
                />
              </div>

              <Button size="lg" className="w-full" onClick={handleWithdraw}>
                Withdraw
              </Button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="min-h-[80vh] flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full gradient-red flex items-center justify-center mb-6 animate-pulse">
              <Loader2 className="w-10 h-10 text-primary-foreground animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Processing Withdrawal</h2>
            <p className="text-muted-foreground">Please wait while we process your request...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="min-h-[80vh] flex flex-col items-center justify-center text-center animate-scale-in">
            <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Congratulations!</h2>
            <h3 className="text-xl font-semibold text-success mb-4">Withdrawal Successful</h3>
            <p className="text-muted-foreground mb-8">
              Your funds will be processed within 24 hours
            </p>
            <div className="glass-card rounded-xl p-6 w-full max-w-sm space-y-3 mb-8">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">{currency}{parseFloat(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank</span>
                <span className="font-semibold">{selectedBankData?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account</span>
                <span className="font-semibold">{accountNumber}</span>
              </div>
            </div>
            <Button size="lg" className="w-full max-w-sm" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        )}

        {step === 'failed' && (
          <div className="min-h-[80vh] flex flex-col items-center justify-center text-center animate-scale-in">
            <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center mb-6">
              <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Withdrawal Failed</h2>
            <p className="text-muted-foreground mb-8">
              Invalid RPC code. Please check your code and try again.
            </p>
            <Button size="lg" className="w-full max-w-sm" onClick={() => setStep('form')}>
              Try Again
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Withdraw;
