import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/store';
import { COUNTRIES } from '@/lib/constants';
import { Transaction } from '@/types';
import { ArrowLeft, Gift, Coins, Phone, Wifi, ArrowDownCircle, Users, Clock, CheckCircle, XCircle } from 'lucide-react';

const typeIcons = {
  bonus: Gift,
  rpc_purchase: Coins,
  airtime: Phone,
  data: Wifi,
  withdrawal: ArrowDownCircle,
  referral: Users,
};

const typeColors = {
  bonus: 'text-yellow-500 bg-yellow-500/10',
  rpc_purchase: 'text-blue-500 bg-blue-500/10',
  airtime: 'text-green-500 bg-green-500/10',
  data: 'text-purple-500 bg-purple-500/10',
  withdrawal: 'text-red-500 bg-red-500/10',
  referral: 'text-cyan-500 bg-cyan-500/10',
};

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  completed: CheckCircle,
  failed: XCircle,
};

const statusColors = {
  pending: 'text-warning',
  approved: 'text-success',
  completed: 'text-success',
  failed: 'text-destructive',
};

const History: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<string>('all');

  const country = COUNTRIES.find(c => c.code === user?.country);
  const currency = country?.currency || '₦';

  useEffect(() => {
    if (user) {
      const allTransactions = storage.getTransactions(user.id);
      setTransactions(allTransactions);
    }
  }, [user]);

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filter);

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'bonus', label: 'Bonus' },
    { value: 'rpc_purchase', label: 'RPC' },
    { value: 'airtime', label: 'Airtime' },
    { value: 'withdrawal', label: 'Withdraw' },
  ];

  if (!user) {
    navigate('/');
    return null;
  }

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
            <h1 className="text-xl font-bold">Transaction History</h1>
            <p className="text-sm text-muted-foreground">{transactions.length} transactions</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === f.value
                  ? 'gradient-red text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => {
              const Icon = typeIcons[transaction.type];
              const StatusIcon = statusIcons[transaction.status];
              const colorClass = typeColors[transaction.type];
              const statusColor = statusColors[transaction.status];
              const isPositive = ['bonus', 'referral'].includes(transaction.type);

              return (
                <div
                  key={transaction.id}
                  className="bg-card rounded-xl p-4 flex items-center gap-4 animate-fade-in"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{transaction.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                      <div className={`flex items-center gap-1 ${statusColor}`}>
                        <StatusIcon size={12} />
                        <span className="text-xs capitalize">{transaction.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`font-semibold ${isPositive ? 'text-success' : 'text-foreground'}`}>
                    {isPositive ? '+' : '-'}{currency}{transaction.amount.toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default History;
