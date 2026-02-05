import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { COMMUNITY } from '@/lib/constants';
import { ArrowLeft, MessageCircle, Send, Users, ExternalLink } from 'lucide-react';

const Community: React.FC = () => {
  const navigate = useNavigate();

  const openWhatsApp = () => {
    window.open(COMMUNITY.whatsapp, '_blank');
  };

  const openTelegram = () => {
    window.open(COMMUNITY.telegram, '_blank');
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
            <h1 className="text-xl font-bold">Community</h1>
            <p className="text-sm text-muted-foreground">Join our community</p>
          </div>
        </div>

        {/* Community Card */}
        <div className="gradient-card rounded-2xl p-6 text-center animate-fade-in">
          <Users className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-bold text-foreground mb-2">Join the RedPay Family</h2>
          <p className="text-muted-foreground">
            Connect with other users, get updates, and learn tips to maximize your earnings
          </p>
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <button
            onClick={openWhatsApp}
            className="w-full bg-card hover:bg-muted rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-green-500" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-foreground">WhatsApp Group</h3>
              <p className="text-sm text-muted-foreground">Join our WhatsApp community</p>
            </div>
            <ExternalLink className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={openTelegram}
            className="w-full bg-card hover:bg-muted rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Send className="w-7 h-7 text-blue-500" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-foreground">Telegram Channel</h3>
              <p className="text-sm text-muted-foreground">Follow us on Telegram</p>
            </div>
            <ExternalLink className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Benefits */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Community Benefits</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Exclusive promotions and bonuses</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Early access to new features</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Direct support from admins</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Tips to maximize earnings</span>
            </li>
          </ul>
        </div>
      </div>
    </PageContainer>
  );
};

export default Community;
