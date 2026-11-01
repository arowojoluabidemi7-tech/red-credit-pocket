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

// All site details come from src/lib/constants.ts so they can be edited
// directly in the GitHub repository — no database involved.
export const DEFAULT_SETTINGS: PaymentDetails = {
  ...PAYMENT_DETAILS,
  supportWhatsapp: SUPPORT.whatsapp,
  supportTelegram: SUPPORT.telegram,
  supportEmail: SUPPORT.email,
  communityWhatsapp: COMMUNITY.whatsapp,
  communityTelegram: COMMUNITY.telegram,
};

export const usePaymentDetails = () => {
  return { details: DEFAULT_SETTINGS, loading: false };
};

export const useSiteSettings = usePaymentDetails;
