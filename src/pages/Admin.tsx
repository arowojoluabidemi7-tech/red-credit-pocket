import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/store';
import { User, Transaction, RpcPayment, Withdrawal } from '@/types';
import { Logo } from '@/components/Logo';
import { 
  LogOut, 
  Users, 
  Wallet, 
  CreditCard, 
  ArrowDownCircle, 
  CheckCircle, 
  XCircle,
  Image,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'users' | 'rpc' | 'withdrawals';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [rpcPayments, setRpcPayments] = useState<RpcPayment[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/signin');
      return;
    }
    loadData();
  }, [isAdmin, navigate]);

  const loadData = () => {
    setUsers(storage.getAllUsers());
    setRpcPayments(storage.getRpcPayments());
    setWithdrawals(storage.getWithdrawals());
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleUpdateBalance = (userId: string) => {
    const amount = parseFloat(newBalance);
    if (isNaN(amount)) {
      toast.error('Invalid amount');
      return;
    }

    const allUsers = storage.getAllUsers();
    const userIndex = allUsers.findIndex(u => u.id === userId);
    if (userIndex >= 0) {
      allUsers[userIndex].balance = amount;
      localStorage.setItem('redpay_all_users', JSON.stringify(allUsers));
      
      // Update current user if it's them
      const currentUser = storage.getUser();
      if (currentUser?.id === userId) {
        storage.setUser({ ...currentUser, balance: amount });
      }
      
      toast.success('Balance updated');
      setEditingUser(null);
      setNewBalance('');
      loadData();
    }
  };

  const handleApproveRpc = (paymentId: string) => {
    storage.updateRpcPayment(paymentId, { status: 'approved', rpcCode: 'RPC678910' });
    toast.success('RPC payment approved');
    loadData();
  };

  const handleRejectRpc = (paymentId: string) => {
    storage.updateRpcPayment(paymentId, { status: 'rejected' });
    toast.success('RPC payment rejected');
    loadData();
  };

  const handleApproveWithdrawal = (withdrawalId: string) => {
    storage.updateWithdrawal(withdrawalId, { status: 'completed' });
    toast.success('Withdrawal approved');
    loadData();
  };

  const handleRejectWithdrawal = (withdrawalId: string) => {
    storage.updateWithdrawal(withdrawalId, { status: 'failed' });
    toast.success('Withdrawal rejected');
    loadData();
  };

  const filteredUsers = users.filter(user => 
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'users' as Tab, label: 'Users', icon: Users, count: users.length },
    { id: 'rpc' as Tab, label: 'RPC Payments', icon: CreditCard, count: rpcPayments.filter(p => p.status === 'pending').length },
    { id: 'withdrawals' as Tab, label: 'Withdrawals', icon: ArrowDownCircle, count: withdrawals.filter(w => w.status === 'pending').length },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded">Admin</span>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <LogOut size={20} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto flex overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all ${
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon size={18} />
              <span>{t.label}</span>
              {t.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4">
        {tab === 'users' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Users Table */}
            <div className="bg-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">User</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Balance</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">{user.id}</td>
                        <td className="px-4 py-3">
                          {editingUser === user.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={newBalance}
                                onChange={(e) => setNewBalance(e.target.value)}
                                className="w-32 h-8"
                              />
                              <Button size="sm" onClick={() => handleUpdateBalance(user.id)}>Save</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingUser(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <span className="font-semibold">₦{user.balance.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingUser !== user.id && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setEditingUser(user.id);
                                setNewBalance(user.balance.toString());
                              }}
                            >
                              Edit Balance
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'rpc' && (
          <div className="space-y-4">
            {rpcPayments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No RPC payments</div>
            ) : (
              rpcPayments.map((payment) => (
                <div key={payment.id} className="bg-card rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">User: {payment.userId}</p>
                    <p className="text-sm text-muted-foreground">
                      ₦{payment.amount.toLocaleString()} • Ref: {payment.reference}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    payment.status === 'pending' ? 'bg-warning/20 text-warning' :
                    payment.status === 'approved' ? 'bg-success/20 text-success' :
                    'bg-destructive/20 text-destructive'
                  }`}>
                    {payment.status}
                  </div>
                  {payment.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="success" onClick={() => handleApproveRpc(payment.id)}>
                        <CheckCircle size={16} className="mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectRpc(payment.id)}>
                        <XCircle size={16} className="mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'withdrawals' && (
          <div className="space-y-4">
            {withdrawals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No withdrawals</div>
            ) : (
              withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="bg-card rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowDownCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">₦{withdrawal.amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {withdrawal.bankName} • {withdrawal.accountNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">{withdrawal.accountName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(withdrawal.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    withdrawal.status === 'pending' || withdrawal.status === 'processing' ? 'bg-warning/20 text-warning' :
                    withdrawal.status === 'completed' ? 'bg-success/20 text-success' :
                    'bg-destructive/20 text-destructive'
                  }`}>
                    {withdrawal.status}
                  </div>
                  {(withdrawal.status === 'pending' || withdrawal.status === 'processing') && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="success" onClick={() => handleApproveWithdrawal(withdrawal.id)}>
                        <CheckCircle size={16} className="mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectWithdrawal(withdrawal.id)}>
                        <XCircle size={16} className="mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
