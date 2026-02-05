import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/PageContainer';
import { SUPPORT } from '@/lib/constants';
import { ArrowLeft, MessageCircle, Send, Mail, Clock, Headphones, ExternalLink } from 'lucide-react';

const Support: React.FC = () => {
  const navigate = useNavigate();

  const openWhatsApp = () => {
    // Remove + for wa.me link format
    const cleanNumber = SUPPORT.whatsapp.replace('+', '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  const openTelegram = () => {
    window.open(SUPPORT.telegram, '_blank');
  };

  const openEmail = () => {
    window.location.href = `mailto:${SUPPORT.email}`;
  };

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
            <h1 className="text-xl font-bold">Support</h1>
            <p className="text-sm text-muted-foreground">We're here to help</p>
          </div>
        </div>

        {/* Support Card */}
        <div className="gradient-card rounded-2xl p-6 text-center animate-fade-in">
          <Headphones className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-bold text-foreground mb-2">Need Help?</h2>
          <p className="text-muted-foreground">
            Our support team is available 24/7 to assist you
          </p>
        </div>

        {/* Support Hours */}
        <div className="glass-card rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Support Hours</h3>
            <p className="text-sm text-muted-foreground">24/7 - Always available</p>
          </div>
        </div>

        {/* Contact Options */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Contact Us</h3>
          
          <button
            onClick={openWhatsApp}
            className="w-full bg-card hover:bg-muted rounded-xl p-4 flex items-center gap-4 transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-green-500" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-medium text-foreground">WhatsApp</h4>
              <p className="text-sm text-muted-foreground">{SUPPORT.whatsapp}</p>
            </div>
            <ExternalLink className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={openTelegram}
            className="w-full bg-card hover:bg-muted rounded-xl p-4 flex items-center gap-4 transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Send className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-medium text-foreground">Telegram</h4>
              <p className="text-sm text-muted-foreground">@Redpayagent1</p>
            </div>
            <ExternalLink className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={openEmail}
            className="w-full bg-card hover:bg-muted rounded-xl p-4 flex items-center gap-4 transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-medium text-foreground">Email</h4>
              <p className="text-sm text-muted-foreground">{SUPPORT.email}</p>
            </div>
            <ExternalLink className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Response Time */}
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground text-center">
            Average response time: <span className="text-foreground font-medium">Under 30 minutes</span>
          </p>
        </div>
      </div>
    </PageContainer>
  );
};

export default Support;
