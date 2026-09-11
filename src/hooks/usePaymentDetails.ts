import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { PAYMENT_DETAILS, SUPPORT, COMMUNITY } from '@/lib/constants';

export interface PaymentDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  onlinePrice: number;
  offlinePrice: number;
  activationPrice: number;
  activationLink: string;
  onlineEnabled: boolean;
  offlineEnabled: boolean;
  supportWhatsapp: string;
  supportTelegram: string;
  supportEmail: string;
  communityWhatsapp: string;
  communityTelegram: string;
}

export const DEFAULT_SETTINGS: PaymentDetails = {
  ...PAYMENT_DETAILS,
  onlinePrice: 8500,
  offlinePrice: 9009,
  activationPrice: 0,
  activationLink: 'https://v0-red-pay-activation-app-tr.vercel.app/',
  onlineEnabled: true,
  offlineEnabled: true,
  supportWhatsapp: SUPPORT.whatsapp,
  supportTelegram: SUPPORT.telegram,
  supportEmail: SUPPORT.email,
  communityWhatsapp: COMMUNITY.whatsapp,
  communityTelegram: COMMUNITY.telegram,
};

export const usePaymentDetails = () => {
  const [details, setDetails] = useState<PaymentDetails>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await db
        .from('site_settings')
        .select('*')
        .eq('id', 'payment')
        .maybeSingle();
      if (active && data) {
        setDetails({
          bankName: data.bank_name || DEFAULT_SETTINGS.bankName,
          accountNumber: data.account_number || DEFAULT_SETTINGS.accountNumber,
          accountName: data.account_name || DEFAULT_SETTINGS.accountName,
           onlinePrice: Number.isFinite(Number(data.online_price)) ? Number(data.online_price) : DEFAULT_SETTINGS.onlinePrice,
           offlinePrice: Number.isFinite(Number(data.offline_price)) ? Number(data.offline_price) : DEFAULT_SETTINGS.offlinePrice,
           activationPrice: Number.isFinite(Number(data.activation_price)) ? Number(data.activation_price) : DEFAULT_SETTINGS.activationPrice,
          activationLink: data.activation_link || DEFAULT_SETTINGS.activationLink,
          onlineEnabled: data.online_enabled ?? DEFAULT_SETTINGS.onlineEnabled,
          offlineEnabled: data.offline_enabled ?? DEFAULT_SETTINGS.offlineEnabled,
          supportWhatsapp: data.support_whatsapp || DEFAULT_SETTINGS.supportWhatsapp,
          supportTelegram: data.support_telegram || DEFAULT_SETTINGS.supportTelegram,
          supportEmail: data.support_email || DEFAULT_SETTINGS.supportEmail,
          communityWhatsapp: data.community_whatsapp || DEFAULT_SETTINGS.communityWhatsapp,
          communityTelegram: data.community_telegram || DEFAULT_SETTINGS.communityTelegram,
        });
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { details, loading };
};

export const useSiteSettings = usePaymentDetails;
