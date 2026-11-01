// Do not edit values here — edit the files in src/config/ instead.
// This file only maps those settings to the names the app uses internally.
import { PAYMENT_ACCOUNT, ACTIVATION_LINK, RPC_CODES, PRICES, PURCHASE_OPTIONS, REWARDS, WITHDRAWAL, SUPPORT, COMMUNITY } from '@/config';

export { BANKS, COUNTRIES, SUPPORT, COMMUNITY } from '@/config';

export const RPC_PRICE = PRICES.onlinePrice;
export const WELCOME_BONUS = REWARDS.welcomeBonus;
export const CLAIM_AMOUNT = REWARDS.claimAmount;
export const CLAIM_INTERVAL = REWARDS.claimIntervalMinutes * 60 * 1000;
export const MIN_WITHDRAWAL = WITHDRAWAL.minAmount;
export const REFERRAL_BONUS = REWARDS.referralBonus;

export const VALID_RPC_CODE = RPC_CODES.validCode;
export const INVALID_RPC_CODE = RPC_CODES.invalidCode;

export const PAYMENT_DETAILS = {
  ...PAYMENT_ACCOUNT,
  ...PRICES,
  ...PURCHASE_OPTIONS,
  activationLink: ACTIVATION_LINK,
};

// Convert a local WhatsApp number (e.g. 08152339810) to wa.me international format (2348152339810)
export const normalizeWhatsapp = (raw: string): string => {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.startsWith('234')) return digits;
  if (digits.startsWith('0')) return '234' + digits.slice(1);
  return digits;
};
