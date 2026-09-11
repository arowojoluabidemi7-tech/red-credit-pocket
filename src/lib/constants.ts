import { Country, Bank } from '@/types';

export const COUNTRIES: Country[] = [
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: '₦' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', currency: 'XAF' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'R' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', currency: '₵' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KSh' },
];

export const BANKS: Bank[] = [
  { id: '1', name: 'Access Bank', code: 'access' },
  { id: '2', name: 'Access Bank (Diamond)', code: 'access-diamond' },
  { id: '3', name: 'ALAT by Wema', code: 'alat' },
  { id: '4', name: 'Citibank Nigeria', code: 'citi' },
  { id: '5', name: 'Ecobank Nigeria', code: 'ecobank' },
  { id: '6', name: 'Fidelity Bank', code: 'fidelity' },
  { id: '7', name: 'First Bank of Nigeria', code: 'firstbank' },
  { id: '8', name: 'First City Monument Bank (FCMB)', code: 'fcmb' },
  { id: '9', name: 'Globus Bank', code: 'globus' },
  { id: '10', name: 'Guaranty Trust Bank (GTBank)', code: 'gtbank' },
  { id: '11', name: 'Heritage Bank', code: 'heritage' },
  { id: '12', name: 'Jaiz Bank', code: 'jaiz' },
  { id: '13', name: 'Keystone Bank', code: 'keystone' },
  { id: '14', name: 'Lotus Bank', code: 'lotus' },
  { id: '15', name: 'Optimus Bank', code: 'optimus' },
  { id: '16', name: 'Parallex Bank', code: 'parallex' },
  { id: '17', name: 'Polaris Bank', code: 'polaris' },
  { id: '18', name: 'Premium Trust Bank', code: 'premiumtrust' },
  { id: '19', name: 'Providus Bank', code: 'providus' },
  { id: '20', name: 'Signature Bank', code: 'signature' },
  { id: '21', name: 'Stanbic IBTC Bank', code: 'stanbic' },
  { id: '22', name: 'Standard Chartered Bank', code: 'standardchartered' },
  { id: '23', name: 'Sterling Bank', code: 'sterling' },
  { id: '24', name: 'SunTrust Bank', code: 'suntrust' },
  { id: '25', name: 'Titan Trust Bank', code: 'titan' },
  { id: '26', name: 'Union Bank of Nigeria', code: 'union' },
  { id: '27', name: 'United Bank for Africa (UBA)', code: 'uba' },
  { id: '28', name: 'Unity Bank', code: 'unity' },
  { id: '29', name: 'Wema Bank', code: 'wema' },
  { id: '30', name: 'Zenith Bank', code: 'zenith' },
  // Microfinance & digital banks
  { id: '31', name: 'OPay', code: 'opay' },
  { id: '32', name: 'PalmPay', code: 'palmpay' },
  { id: '33', name: 'Moniepoint MFB', code: 'moniepoint' },
  { id: '34', name: 'Kuda Microfinance Bank', code: 'kuda' },
  { id: '35', name: 'VFD Microfinance Bank', code: 'vfd' },
  { id: '36', name: 'Rubies Microfinance Bank', code: 'rubies' },
  { id: '37', name: 'Sparkle Microfinance Bank', code: 'sparkle' },
  { id: '38', name: 'Fairmoney Microfinance Bank', code: 'fairmoney' },
  { id: '39', name: 'Carbon (One Finance)', code: 'carbon' },
  { id: '40', name: 'Eyowo', code: 'eyowo' },
  { id: '41', name: 'Mint MFB', code: 'mint' },
  { id: '42', name: 'Paga', code: 'paga' },
  { id: '43', name: 'PayCom (Opay legacy)', code: 'paycom' },
  { id: '44', name: 'Smartcash Payment Service Bank', code: 'smartcash' },
  { id: '45', name: 'MoMo Payment Service Bank', code: 'momo-psb' },
  { id: '46', name: '9Payment Service Bank (9PSB)', code: '9psb' },
  { id: '47', name: 'Hope Payment Service Bank', code: 'hope-psb' },
  { id: '48', name: 'Taj Bank', code: 'taj' },
  { id: '49', name: 'Coronation Merchant Bank', code: 'coronation' },
  { id: '50', name: 'Rand Merchant Bank', code: 'rmb' },
];


export const RPC_PRICE = 8500;
export const WELCOME_BONUS = 160000;
export const CLAIM_AMOUNT = 30000;
export const CLAIM_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
export const MIN_WITHDRAWAL = 5000;
export const REFERRAL_BONUS = 5000;

export const VALID_RPC_CODE = 'RPC678910';
export const INVALID_RPC_CODE = 'RPC708901';

export const PAYMENT_DETAILS = {
  bankName: 'SMARTCASH',
  accountNumber: '7055968093',
  accountName: 'MOSES GIFT',
};

export const SUPPORT = {
  telegram: 'https://t.me/Redpayagent1',
  whatsapp: '27641451346',
  
  email: 'redpay313@gmail.com',
};

export const COMMUNITY = {
  whatsapp: 'https://chat.whatsapp.com/EE0IPvPLr28JqRaHFiNbtM?mode=gi_t',
  telegram: 'https://t.me/Redpayagent1',
};
