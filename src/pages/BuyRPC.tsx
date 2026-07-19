import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { RPC_PRICE, PAYMENT_DETAILS, SUPPORT } from '@/lib/constants';
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

type Step = 'notice' | 'form' | 'processing' | 'payment' | 'upload' | 'success';

const BuyRPC: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('notice');
  const [showNotice, setShowNotice] = useState(true);
  const [showWhatsAppWarning, setShowWhatsAppWarning] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [copied, setCopied] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [referenceId] = useState(`REF${generateId()}`);
  const [rpcCode, setRpcCode] = useState('');

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
      setStep('payment');
    }, 3000);
  };

  const handlePaymentMade = async () => {
    if (!screenshot) {
      toast.error('Please upload payment screenshot');
      return;
    }

    // Save RPC payment (local)
    storage.addRpcPayment({
      userId: user?.id || '',
      amount: RPC_PRICE,
      reference: referenceId,
      status: 'pending',
      rpcCode: 'RPC708901',
    });

    storage.addTransaction({
      userId: user?.id || '',
      type: 'rpc_purchase',
      amount: RPC_PRICE,
      status: 'pending',
      description: 'RPC Purchase',
      reference: referenceId,
    });

    // Submit to admin queue
    if (user?.id) {
      const { error } = await db.from('deposits').insert({
        user_id: user.id,
        user_email: user.email,
        user_name: `${user.firstName} ${user.lastName}`,
        amount: RPC_PRICE,
        reference: referenceId,
        bank_name: PAYMENT_DETAILS.bankName,
        note: 'RPC Purchase',
        status: 'pending',
      });
      if (error) console.error('deposit insert', error);
    }

    setRpcCode('RPC708901');
    setStep('success');
  };

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
              <div className="text-3xl font-bold text-foreground">₦{RPC_PRICE.toLocaleString()}</div>
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

        {step === 'payment' && (
          <div className="space-y-6 animate-fade-in">
            {/* Payment Details */}
            <div className="gradient-card rounded-2xl p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Amount to Pay</p>
              <div className="text-3xl font-bold text-foreground mb-4">₦{RPC_PRICE.toLocaleString()}</div>
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

            <Button size="lg" className="w-full" onClick={handlePaymentMade}>
              I Have Made Payment
            </Button>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-6 animate-scale-in text-center py-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
              <X className="w-10 h-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-destructive">Payment Not Received</h2>
              <p className="text-muted-foreground">We didn't receive any payment from you</p>
            </div>
            <div className="glass-card rounded-xl p-6 space-y-4">
              <p className="text-sm text-muted-foreground">Reference ID</p>
              <div className="text-lg font-mono font-bold text-primary">{referenceId}</div>
              <div className="border-t border-border pt-4">
                <p className="text-sm text-foreground mb-3">
                  If you have made a payment, please contact support with your payment receipt
                </p>
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => setShowWhatsAppWarning(true)}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Contact Support
                </Button>
              </div>
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
