import { User, Transaction, RpcPayment, Withdrawal } from '@/types';
import { WELCOME_BONUS, CLAIM_AMOUNT, REFERRAL_BONUS } from './constants';

const STORAGE_KEYS = {
  USER: 'redpay_user',
  TRANSACTIONS: 'redpay_transactions',
  RPC_PAYMENTS: 'redpay_rpc_payments',
  WITHDRAWALS: 'redpay_withdrawals',
  USERS: 'redpay_all_users',
};

export const generateId = () => Math.random().toString(36).substring(2, 9).toUpperCase();
export const generateReferralCode = () => 'RP' + Math.random().toString(36).substring(2, 8).toUpperCase();
export const generateUserId = () => 'USER' + Math.random().toString(36).substring(2, 8).toUpperCase();

export const storage = {
  getUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  checkEmailExists: (email: string): boolean => {
    const allUsers = storage.getAllUsers();
    return allUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
  },

  getUserByEmail: (email: string): User | null => {
    const allUsers = storage.getAllUsers();
    return allUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  updateUserPassword: (email: string, newPassword: string): boolean => {
    const allUsers = storage.getAllUsers();
    const userIndex = allUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (userIndex >= 0) {
      allUsers[userIndex].password = newPassword;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(allUsers));
      // Update current user if it's the same
      const currentUser = storage.getUser();
      if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase()) {
        currentUser.password = newPassword;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      }
      return true;
    }
    return false;
  },

  setUser: (user: User) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    // Also add to all users list
    const allUsers = storage.getAllUsers();
    const existingIndex = allUsers.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      allUsers[existingIndex] = user;
    } else {
      allUsers.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(allUsers));
  },

  getAllUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },

  clearUser: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  getTransactions: (userId?: string): Transaction[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const transactions: Transaction[] = data ? JSON.parse(data) : [];
    return userId ? transactions.filter(t => t.userId === userId) : transactions;
  },

  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const transactions = storage.getTransactions();
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
      createdAt: Date.now(),
    };
    transactions.unshift(newTransaction);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return newTransaction;
  },

  getRpcPayments: (userId?: string): RpcPayment[] => {
    const data = localStorage.getItem(STORAGE_KEYS.RPC_PAYMENTS);
    const payments: RpcPayment[] = data ? JSON.parse(data) : [];
    return userId ? payments.filter(p => p.userId === userId) : payments;
  },

  addRpcPayment: (payment: Omit<RpcPayment, 'id' | 'createdAt'>) => {
    const payments = storage.getRpcPayments();
    const newPayment: RpcPayment = {
      ...payment,
      id: generateId(),
      createdAt: Date.now(),
    };
    payments.unshift(newPayment);
    localStorage.setItem(STORAGE_KEYS.RPC_PAYMENTS, JSON.stringify(payments));
    return newPayment;
  },

  updateRpcPayment: (id: string, updates: Partial<RpcPayment>) => {
    const payments = storage.getRpcPayments();
    const index = payments.findIndex(p => p.id === id);
    if (index >= 0) {
      payments[index] = { ...payments[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.RPC_PAYMENTS, JSON.stringify(payments));
    }
  },

  getWithdrawals: (userId?: string): Withdrawal[] => {
    const data = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
    const withdrawals: Withdrawal[] = data ? JSON.parse(data) : [];
    return userId ? withdrawals.filter(w => w.userId === userId) : withdrawals;
  },

  addWithdrawal: (withdrawal: Omit<Withdrawal, 'id' | 'createdAt'>) => {
    const withdrawals = storage.getWithdrawals();
    const newWithdrawal: Withdrawal = {
      ...withdrawal,
      id: generateId(),
      createdAt: Date.now(),
    };
    withdrawals.unshift(newWithdrawal);
    localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(withdrawals));
    return newWithdrawal;
  },

  updateWithdrawal: (id: string, updates: Partial<Withdrawal>) => {
    const withdrawals = storage.getWithdrawals();
    const index = withdrawals.findIndex(w => w.id === id);
    if (index >= 0) {
      withdrawals[index] = { ...withdrawals[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(withdrawals));
    }
  },

  createUser: (userData: Omit<User, 'id' | 'referralCode' | 'balance' | 'rpcBalance' | 'hasClaimedWelcome' | 'claimCount' | 'createdAt'>): User => {
    const user: User = {
      ...userData,
      password: userData.password,
      id: generateUserId(),
      referralCode: generateReferralCode(),
      balance: WELCOME_BONUS,
      rpcBalance: 0,
      hasClaimedWelcome: false,
      claimCount: 0,
      createdAt: Date.now(),
    };

    // Handle referral bonus
    if (userData.referredBy) {
      const allUsers = storage.getAllUsers();
      const referrer = allUsers.find(u => u.referralCode === userData.referredBy);
      if (referrer) {
        referrer.balance += REFERRAL_BONUS;
        storage.setUser(referrer);
        storage.addTransaction({
          userId: referrer.id,
          type: 'referral',
          amount: REFERRAL_BONUS,
          status: 'completed',
          description: `Referral bonus from ${user.firstName}`,
        });
      }
    }

    storage.setUser(user);
    storage.addTransaction({
      userId: user.id,
      type: 'bonus',
      amount: WELCOME_BONUS,
      status: 'completed',
      description: 'Welcome bonus',
    });

    return user;
  },

  claimBonus: (userId: string): boolean => {
    const user = storage.getUser();
    if (!user || user.id !== userId) return false;

    user.balance += CLAIM_AMOUNT;
    user.lastClaimTime = Date.now();
    user.claimCount += 1;
    storage.setUser(user);

    storage.addTransaction({
      userId: user.id,
      type: 'bonus',
      amount: CLAIM_AMOUNT,
      status: 'completed',
      description: `Claim bonus #${user.claimCount}`,
    });

    return true;
  },
};
