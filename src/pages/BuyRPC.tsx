import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { PAYMENT_DETAILS, SUPPORT } from '@/lib/constants';
import { storage, generateId } from '@/lib/store';
import { db } from '@/lib/db';
import { ArrowLeft, Coins, Copy, CheckCircle, Upload, AlertTriangle, X, Clock, MessageCircle, Loader2 } from 'lucide-react';
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

  const handleUnderstand = () => {
    setShowNotice(false);
    setStep('form');
  };

  const handleProceed = () => {
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error('Please fill in all fields');
      return;
    }
    setStep('processing');
    setTimeout(() => {
      setStep('choose');
    }, 3000);
  };

  const handleChooseTier = (t: Tier) => {
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
      {/* Payment Notice Dialog */}
      <Dialog open={showNotice} onOpenChange={setShowNotice}>
        <DialogContent className="bg-card border-border max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              Important Payment Notice
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-foreground">
            <p>
              Transfer the <strong>exact amount</strong> shown on this page.
            </p>
            <p>
              Upload a clear <strong>payment screenshot</strong> immediately after transfer.
            </p>
            <div className="flex items-start gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Avoid using Opay bank.</strong> Due to temporary network issues from Opay servers, payments made with Opay may not be confirmed. Please use <strong>any other Nigerian bank</strong> for instant confirmation.
              </p>
            </div>
            <p className="flex items-start gap-2 text-green-500">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              Payments made with other banks are confirmed within minutes.
            </p>
            <p className="flex items-start gap-2 text-destructive">
              <X className="w-5 h-5 mt-0.5 flex-shrink-0" />
              Do not dispute your payment under any circumstances — disputes delay confirmation.
            </p>
          </div>
          <Button 
            size="lg" 
            className="w-full mt-4" 
            onClick={handleUnderstand}
          >
            I Understand
          </Button>
        </DialogContent>
      </Dialog>

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
            <h1 className="text-xl font-bold">Buy RPC</h1>
            <p className="text-sm text-muted-foreground">RedPay Credits</p>
          </div>
        </div>

        {step === 'form' && (
          <div className="space-y-6 animate-fade-in">
            {/* Amount Card */}
            <div className="gradient-card rounded-2xl p-6 text-center">
              <Coins className="w-12 h-12 mx-auto mb-4 text-primary" />
              <p className="text-sm text-muted-foreground mb-2">Amount to Pay</p>
              <div className="text-3xl font-bold text-foreground">₦{price.toLocaleString()}</div>
            </div>

            {/* User Info */}
            <div className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Referral Code</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-primary">{user.referralCode}</span>
                  <button onClick={() => copyToClipboard(user.referralCode, 'Referral code')}>
                    {copied === 'Referral code' ? <CheckCircle size={14} className="text-success" /> : <Copy size={14} className="text-muted-foreground" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono">{user.id}</span>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Full Name</label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Phone Number</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <Button size="lg" className="w-full" onClick={handleProceed}>
              Proceed
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
          <div className="space-y-6 animate-scale-in text-center py-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-green-500">Payment Confirmed</h2>
              <p className="text-muted-foreground">Your RPC has been credited to your account.</p>
            </div>
            <div className="glass-card rounded-xl p-6 space-y-3">
              <p className="text-sm text-muted-foreground">Your RPC Code</p>
              <div className="flex items-center justify-center gap-2">
                <div className="text-2xl font-mono font-bold text-primary">{rpcCode}</div>
                <button onClick={() => copyToClipboard(rpcCode, 'RPC code')}>
                  {copied === 'RPC code' ? <CheckCircle size={18} className="text-success" /> : <Copy size={18} className="text-muted-foreground" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Reference: {referenceId}</p>
            </div>
            <Button size="lg" className="w-full" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
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
