import { Country, Bank } from '@/types';

export const COUNTRIES: Country[] = [
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: '₦' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', currency: 'XAF' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'R' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', currency: '₵' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KSh' },
];

export const BANKS: Bank[] = [
  { id: '1', name: 'UBA', code: 'uba' },
  { id: '2', name: 'OPay', code: 'opay' },
  { id: '3', name: 'PalmPay', code: 'palmpay' },
  { id: '4', name: 'Kuda', code: 'kuda' },
  { id: '5', name: 'GTBank', code: 'gtbank' },
  { id: '6', name: 'First Bank', code: 'firstbank' },
  { id: '7', name: 'Access Bank', code: 'accessbank' },
  { id: '8', name: 'Zenith Bank', code: 'zenithbank' },
  { id: '9', name: 'Fidelity Bank', code: 'fidelitybank' },
  { id: '10', name: 'Union Bank', code: 'unionbank' },
  { id: '11', name: 'Sterling Bank', code: 'sterlingbank' },
  { id: '12', name: 'Wema Bank', code: 'wemabank' },
  { id: '13', name: 'Moniepoint', code: 'moniepoint' },
  { id: '14', name: 'FCMB', code: 'fcmb' },
];

export const RPC_PRICE = 6700;
export const WELCOME_BONUS = 160000;
export const CLAIM_AMOUNT = 30000;
export const CLAIM_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
export const MIN_WITHDRAWAL = 5000;
export const REFERRAL_BONUS = 5000;

export const VALID_RPC_CODE = 'RPC678910';
export const INVALID_RPC_CODE = 'RPC708901';

export const PAYMENT_DETAILS = {
  bankName: 'SMARTCASH',
  accountNumber: '8027250263',
  accountName: 'MOSES GIFT',
};

export const SUPPORT = {
  telegram: 'https://t.me/Redpayagent1',
  whatsapp: '+2348141587030',
  
  email: 'redpay313@gmail.com',
};

export const COMMUNITY = {
  whatsapp: 'https://chat.whatsapp.com/EE0IPvPLr28JqRaHFiNbtM?mode=gi_t',
  telegram: 'https://t.me/Redpayagent1',
};
