import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/store';
import { BANKS, MIN_WITHDRAWAL, COUNTRIES, VALID_RPC_CODE } from '@/lib/constants';
import {
  ArrowLeft,
  ChevronDown,
  Wallet,
  CheckCircle,
  Loader2,
  AlertCircle,
  Send,
  Building2,
  Hash,
  UserIcon,
  KeyRound,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
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
    if (rpcCode !== VALID_RPC_CODE) {
      toast.error('Invalid RPC code');
      setStep('failed');
      return;
    }

    setStep('processing');

    setTimeout(() => {
      updateUser({ balance: user.balance - amountNum });
      storage.addWithdrawal({
        userId: user.id,
        amount: amountNum,
        bankName: selectedBankData?.name || '',
        accountNumber,
        accountName,
        status: 'processing',
      });
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

  const quickAmounts = [5000, 10000, 25000, 50000];

  return (
    <PageContainer showNav={false}>
      <div className="p-4 space-y-5">
        {step === 'form' && (
          <>
            {/* Header */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold">Withdraw Funds</h1>
                <p className="text-xs text-muted-foreground">Transfer straight to your bank</p>
              </div>
            </div>

            {/* Balance hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 via-red-600 to-red-800 p-6 shadow-xl">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-yellow-300/10 blur-2xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold mb-3">
                  <Sparkles size={12} /> Available Balance
                </div>
                <div className="flex items-baseline gap-2">
                  <Wallet className="w-6 h-6 text-white" />
                  <span className="text-4xl font-extrabold text-white">
                    {currency}{user.balance.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-4 text-white/90 text-xs">
                  <ShieldCheck size={14} /> Min withdrawal {currency}{MIN_WITHDRAWAL.toLocaleString()} • Instant processing
                </div>
              </div>
            </div>

            {/* Form card */}
            <div className="rounded-3xl bg-card border border-border p-5 space-y-5">
              {/* Amount */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                  Amount ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-primary">
                    {currency}
                  </span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10 h-14 rounded-xl bg-background text-xl font-bold"
                  />
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {quickAmounts.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmount(a.toString())}
                      className="px-3 py-1.5 rounded-full bg-muted text-xs font-semibold text-foreground hover:bg-primary/15 hover:text-primary transition-colors"
                    >
                      {currency}{(a / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Bank</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowBankSelect(!showBankSelect)}
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-background flex items-center justify-between text-foreground"
                  >
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <span className={selectedBankData ? 'font-medium' : 'text-muted-foreground'}>
                      {selectedBankData?.name || 'Select your bank'}
                    </span>
                    <ChevronDown size={18} className="text-muted-foreground" />
                  </button>
                  {showBankSelect && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto">
                      {BANKS.map((bank) => (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => {
                            setSelectedBank(bank.id);
                            setShowBankSelect(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-muted transition-colors text-sm"
                        >
                          {bank.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Account Number */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Account Number</label>
                <div className="relative">
                  <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="10-digit account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="pl-9 h-12 rounded-xl bg-background"
                  />
                </div>
              </div>

              {/* Account Name */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Account Name</label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Account holder name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="pl-9 h-12 rounded-xl bg-background"
                  />
                </div>
              </div>

              {/* RPC code */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">RPC Code</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Enter your RPC code"
                    value={rpcCode}
                    onChange={(e) => setRpcCode(e.target.value.toUpperCase())}
                    className="pl-9 h-12 rounded-xl bg-background font-mono tracking-widest"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Required to authorize this withdrawal.
                </p>
              </div>
            </div>

            <Button
              size="lg"
              onClick={handleWithdraw}
              className="w-full h-14 rounded-2xl text-base font-bold bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-lg shadow-red-500/30"
            >
              <Send size={18} className="mr-2" /> Withdraw Now
            </Button>
          </>
        )}

        {step === 'processing' && (
          <div className="min-h-[80vh] flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mb-6 shadow-xl shadow-red-500/40 animate-pulse">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Processing Withdrawal</h2>
            <p className="text-muted-foreground">Securely sending funds to your bank…</p>
          </div>
        )}

        {step === 'success' && (
          <div className="min-h-[80vh] flex flex-col items-center justify-center text-center animate-scale-in">
            <div className="w-24 h-24 rounded-full bg-green-500/15 flex items-center justify-center mb-6">
              <CheckCircle className="w-14 h-14 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Withdrawal Successful</h2>
            <p className="text-muted-foreground mb-6">Funds will arrive within 24 hours.</p>
            <div className="rounded-2xl bg-card border border-border p-5 w-full max-w-sm space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold">{currency}{parseFloat(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bank</span>
                <span className="font-semibold">{selectedBankData?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Account</span>
                <span className="font-mono">{accountNumber}</span>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full max-w-sm h-14 rounded-2xl bg-gradient-to-r from-red-500 to-red-700"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        )}

        {step === 'failed' && (
          <div className="min-h-[80vh] flex flex-col items-center justify-center text-center animate-scale-in">
            <div className="w-24 h-24 rounded-full bg-destructive/15 flex items-center justify-center mb-6">
              <AlertCircle className="w-14 h-14 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Withdrawal Failed</h2>
            <p className="text-muted-foreground mb-8 px-6">
              Invalid RPC code. Please check your code and try again.
            </p>
            <Button
              size="lg"
              className="w-full max-w-sm h-14 rounded-2xl bg-gradient-to-r from-red-500 to-red-700"
              onClick={() => setStep('form')}
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Withdraw;
