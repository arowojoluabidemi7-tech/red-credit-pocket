export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  country: string;
  status: 'individual' | 'business';
  referralCode: string;
  referredBy?: string;
  balance: number;
  rpcBalance: number;
  hasClaimedWelcome: boolean;
  lastClaimTime?: number;
  claimCount: number;
  createdAt: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'bonus' | 'rpc_purchase' | 'airtime' | 'data' | 'withdrawal' | 'referral';
  amount: number;
  status: 'pending' | 'approved' | 'completed' | 'failed';
  description: string;
  createdAt: number;
  reference?: string;
}

export interface RpcPayment {
  id: string;
  userId: string;
  amount: number;
  reference: string;
  screenshotUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  rpcCode?: string;
  createdAt: number;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: number;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
}

export interface Bank {
  id: string;
  name: string;
  code: string;
}
