import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { PAYMENT_DETAILS, SUPPORT } from '@/lib/constants';
import { storage, generateId } from '@/lib/store';
import { db } from '@/lib/db';
import { ArrowLeft, Coins, Copy, CheckCircle, Upload, AlertTriangle, X, Clock, MessageCircle, Loader2, Lock, User as UserIcon, Mail, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Step = 'notice' | 'form' | 'processing' | 'choose' | 'payment' | 'upload' | 'review';
type Tier = 'online' | 'offline';
const TIER_PRICES: Record<Tier, number> = { online: 6700, offline: 8700 };

const BuyRPC: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [step, setStep] = useState<Step>('form');
  const [tier, setTier] = useState<Tier>('online');
  const price = TIER_PRICES[tier];
  const [showWhatsAppWarning, setShowWhatsAppWarning] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [copied, setCopied] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [referenceId] = useState(`REF${generateId()}`);
  const [rpcCode] = useState(isAdmin ? 'RPC6098' : 'RPC6097');
  const [depositId, setDepositId] = useState<string | null>(null);
  const [depositStatus, setDepositStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [adminNote, setAdminNote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleProceed = () => {
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error('Please fill in all fields');
      return;
    }
    setStep('processing');
    setTimeout(() => {
      setStep('choose');
    }, 2000);
  };

  const handleChooseTier = (t: Tier) => {
    if (t === 'offline') {
      window.open(SUPPORT.telegram, '_blank');
      return;
    }
    setTier(t);
    setStep('payment');
  };

  const handlePaymentMade = async () => {
    if (!screenshot) {
      toast.error('Please upload payment screenshot');
      return;
    }
    if (!user?.id) return;
    setSubmitting(true);

    // Upload screenshot to receipts bucket
    let screenshotUrl: string | null = null;
    const ext = screenshot.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${referenceId}.${ext}`;
    const { error: upErr } = await db.storage.from('receipts').upload(path, screenshot, {
      upsert: true, contentType: screenshot.type,
    });
    if (upErr) {
      setSubmitting(false);
      toast.error('Upload failed: ' + upErr.message);
      return;
    }
    screenshotUrl = path;

    // Local records
    storage.addRpcPayment({
      userId: user.id, amount: price, reference: referenceId, status: 'pending', rpcCode,
    });
    storage.addTransaction({
      userId: user.id, type: 'rpc_purchase', amount: price, status: 'pending',
      description: 'RPC Purchase', reference: referenceId,
    });

    // Admin queue
    const { data, error } = await db.from('deposits').insert({
      user_id: user.id,
      user_email: user.email,
      user_name: `${user.firstName} ${user.lastName}`,
      amount: price,
      reference: referenceId,
      bank_name: PAYMENT_DETAILS.bankName,
      note: 'RPC Purchase',
      status: 'pending',
      screenshot_url: screenshotUrl,
    }).select('id').single();

    setSubmitting(false);
    if (error) {
      toast.error('Submit failed: ' + error.message);
      return;
    }
    setDepositId(data.id);
    setDepositStatus('pending');
    setStep('review');
  };

  // Poll deposit status while under review
  useEffect(() => {
    if (step !== 'review' || !depositId) return;
    let alive = true;
    const check = async () => {
      const { data } = await db.from('deposits')
        .select('status, admin_note').eq('id', depositId).single();
      if (!alive || !data) return;
      setDepositStatus(data.status);
      setAdminNote(data.admin_note);
    };
    check();
    const iv = setInterval(check, 5000);
    return () => { alive = false; clearInterval(iv); };
  }, [step, depositId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      toast.success('Screenshot uploaded');
    }
  };

  if (!user) {
    navigate('/');
    return null;
  }

  if (isAdmin) {
    return (
      <PageContainer>
        <div className="p-4 space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 rounded-lg bg-card hover:bg-muted transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold">Buy RPC</h1>
              <p className="text-sm text-muted-foreground">Admin</p>
            </div>
          </div>

          <div className="space-y-6 animate-scale-in text-center py-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-green-500">Payment Confirmed</h2>
              <p className="text-muted-foreground">Your RPC is</p>
            </div>
            <div className="glass-card rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-center gap-2">
                <div className="text-3xl font-mono font-bold text-primary">RPC6098</div>
                <button onClick={() => copyToClipboard('RPC6098', 'RPC code')}>
                  {copied === 'RPC code' ? <CheckCircle size={18} className="text-success" /> : <Copy size={18} className="text-muted-foreground" />}
                </button>
              </div>
            </div>
            <Button size="lg" className="w-full" onClick={() => navigate('/admin')}>
              Back to Admin Panel
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => step === 'form' ? navigate('/dashboard') : setStep('form')} 
            className="p-2 rounded-lg bg-card hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">
              {step === 'review' && depositStatus === 'approved' ? 'Payment confirmed' : 'Buy RPC'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === 'review' && depositStatus === 'approved' ? 'Your RPC code is active and ready to use!' : 'RedPay Credits'}
            </p>
          </div>
        </div>

        {step === 'form' && (
          <div className="space-y-5 animate-fade-in">
            {/* Hero Amount Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 via-red-600 to-red-800 p-6 shadow-xl">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-yellow-300/10 blur-2xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold mb-3">
                  <Sparkles size={12} /> RedPay Credit
                </div>
                <p className="text-white/80 text-sm">Amount to Pay</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-extrabold text-white">₦{price.toLocaleString()}</span>
                  <span className="text-white/70 text-xs">one-time</span>
                </div>
                <div className="flex items-center gap-2 mt-4 text-white/90 text-xs">
                  <ShieldCheck size={14} /> Secure • Verified • Instant activation
                </div>
              </div>
            </div>

            {/* Referral / ID chips */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-card border border-border p-3">
                <p className="text-[11px] text-muted-foreground mb-1">Referral Code</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-primary text-sm truncate">{user.referralCode}</span>
                  <button onClick={() => copyToClipboard(user.referralCode, 'Referral code')}>
                    {copied === 'Referral code' ? <CheckCircle size={14} className="text-success" /> : <Copy size={14} className="text-muted-foreground" />}
                  </button>
                </div>
              </div>
              <div className="rounded-2xl bg-card border border-border p-3">
                <p className="text-[11px] text-muted-foreground mb-1">User ID</p>
                <span className="font-mono text-xs text-foreground">{user.id.slice(0, 12)}…</span>
              </div>
            </div>

            {/* Form card */}
            <div className="rounded-3xl bg-card border border-border p-5 space-y-4">
              <div>
                <h3 className="font-bold text-foreground">Confirm your details</h3>
                <p className="text-xs text-muted-foreground">We use this to activate your RPC code.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Full Name</label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9 h-12 rounded-xl bg-background"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      className="pl-9 h-12 rounded-xl bg-background"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="tel"
                      className="pl-9 h-12 rounded-xl bg-background"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="080..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-14 rounded-2xl text-base font-bold bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-lg shadow-red-500/30"
              onClick={handleProceed}
            >
              Proceed to Payment
            </Button>
          </div>
        )}


        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-fade-in">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-foreground">Processing...</h2>
              <p className="text-muted-foreground">Please wait while we prepare your payment details</p>
            </div>
          </div>
        )}

        {step === 'choose' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-foreground">Buy RPC</h2>
              <p className="text-sm text-muted-foreground">Choose your purchase method</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleChooseTier('online')}
                className="gradient-card rounded-2xl p-6 text-center border-2 border-primary/40 hover:border-primary transition-all hover:scale-[1.02]"
              >
                <Coins className="w-10 h-10 mx-auto mb-3 text-primary" />
                <div className="text-lg font-bold text-foreground">Buy Online</div>
                <div className="text-xs text-muted-foreground mb-3">Online</div>
                <div className="text-2xl font-extrabold text-primary">₦6,700</div>
              </button>
              <button
                onClick={() => handleChooseTier('offline')}
                className="gradient-card rounded-2xl p-6 text-center border-2 border-border hover:border-primary transition-all hover:scale-[1.02]"
              >
                <Coins className="w-10 h-10 mx-auto mb-3 text-foreground" />
                <div className="text-lg font-bold text-foreground">Buy Offline</div>
                <div className="text-xs text-muted-foreground mb-3">Offline</div>
                <div className="text-2xl font-extrabold text-foreground">₦8,700</div>
              </button>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-6 animate-fade-in">
            {/* Payment Details */}
            <div className="gradient-card rounded-2xl p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Amount to Pay</p>
              <div className="text-3xl font-bold text-foreground mb-4">₦{price.toLocaleString()}</div>
            </div>

            <div className="bg-card rounded-xl p-4 space-y-4">
              <h3 className="font-semibold text-foreground">Bank Transfer Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Bank Name</span>
                  <span className="font-medium">{PAYMENT_DETAILS.bankName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Account Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{PAYMENT_DETAILS.accountNumber}</span>
                    <button onClick={() => copyToClipboard(PAYMENT_DETAILS.accountNumber, 'Account number')}>
                      {copied === 'Account number' ? <CheckCircle size={14} className="text-success" /> : <Copy size={14} className="text-muted-foreground" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Account Name</span>
                  <span className="font-medium">{PAYMENT_DETAILS.accountName}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Reference ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-primary">{referenceId}</span>
                    <button onClick={() => copyToClipboard(referenceId, 'Reference ID')}>
                      {copied === 'Reference ID' ? <CheckCircle size={14} className="text-success" /> : <Copy size={14} className="text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Screenshot */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground block">Upload Payment Screenshot</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors bg-card">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  {screenshot ? screenshot.name : 'Click to upload payment proof'}
                </span>
                <span className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>

            <Button size="lg" className="w-full" onClick={handlePaymentMade} disabled={submitting}>
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : 'I Have Made Payment'}
            </Button>
          </div>
        )}

        {step === 'review' && depositStatus === 'pending' && (
          <div className="space-y-6 animate-scale-in text-center py-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-10 h-10 text-yellow-500 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Processing — Under Review</h2>
              <p className="text-muted-foreground">
                Your payment has been submitted. An admin will review it shortly.
              </p>
            </div>
            <div className="glass-card rounded-xl p-6 space-y-2">
              <p className="text-sm text-muted-foreground">Reference ID</p>
              <div className="text-lg font-mono font-bold text-primary">{referenceId}</div>
            </div>
            <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        )}

        {step === 'review' && depositStatus === 'approved' && (
          <div className="space-y-5 animate-scale-in py-4">
            {/* Access Code Card */}
            <div className="bg-red-50 rounded-2xl p-5 space-y-3 border border-red-100">
              <p className="text-sm text-center text-red-500 font-medium">Your RPC Access Code:</p>
              <div className="flex items-center justify-center gap-3">
                <div className="bg-white rounded-xl px-5 py-3 shadow-sm flex items-center gap-2">
                  <span className="text-2xl font-mono font-bold text-black">{rpcCode}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(rpcCode, 'RPC code')}
                  className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {copied === 'RPC code' ? <CheckCircle size={20} className="text-green-500" /> : <Copy size={20} className="text-gray-600" />}
                </button>
              </div>
            </div>

            {/* Activation Required Card */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-5 border border-yellow-200">
              <div className="flex items-center justify-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-bold text-red-500 uppercase tracking-wide">Activation Required</h3>
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              
              <div className="bg-white/80 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-red-500 text-lg leading-none">🚫</span>
                  <p className="text-sm text-red-500 font-medium">
                    Your RPC code will <span className="font-bold underline">NOT WORK</span> until activated!
                  </p>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  You <span className="text-red-500 font-bold">won't be credited</span> and <span className="text-red-500 font-bold">cannot withdraw</span> until your code is activated on our portal.
                </p>
              </div>
              
              <button
                onClick={() => window.open('https://v0-red-pay-activation-app-tr.vercel.app/', '_blank')}
                className="mt-4 w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-opacity"
              >
                <Lock className="w-5 h-5" />
                TAP HERE TO ACTIVATE NOW
              </button>
              
              <p className="text-xs text-red-500 text-center mt-3 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                Activate immediately to start earning!
              </p>
            </div>

            <Button size="lg" className="w-full bg-red-600 hover:bg-red-700" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        )}

        {step === 'review' && depositStatus === 'rejected' && (
          <div className="space-y-6 animate-scale-in text-center py-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
              <X className="w-10 h-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-destructive">Payment Rejected</h2>
              <p className="text-muted-foreground">
                {adminNote || 'Your payment could not be verified. Please contact support.'}
              </p>
            </div>
            <div className="glass-card rounded-xl p-6 space-y-2">
              <p className="text-sm text-muted-foreground">Reference ID</p>
              <div className="text-lg font-mono font-bold text-primary">{referenceId}</div>
              <Button size="lg" className="w-full mt-3" onClick={() => setShowWhatsAppWarning(true)}>
                <MessageCircle className="w-5 h-5 mr-2" />
                Contact Support
              </Button>
            </div>
            <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        )}


        {/* WhatsApp Warning Dialog */}
        <Dialog open={showWhatsAppWarning} onOpenChange={setShowWhatsAppWarning}>
          <DialogContent className="bg-card border-border max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-8 h-8" />
                Important Warning!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
                <p className="text-lg font-semibold text-center text-foreground">
                  Make sure you send a screenshot of your payment to the support to avoid being blocked!
                </p>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Contacting support without proof of payment may result in your account being blocked.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button 
                size="lg" 
                className="w-full"
                onClick={() => {
                  setShowWhatsAppWarning(false);
                  window.open(`https://wa.me/${SUPPORT.whatsapp.replace('+', '')}?text=Hello, I just made an RPC payment. Reference ID: ${referenceId}`, '_blank');
                }}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                I Understand, Open WhatsApp
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full"
                onClick={() => setShowWhatsAppWarning(false)}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
};

export default BuyRPC;
