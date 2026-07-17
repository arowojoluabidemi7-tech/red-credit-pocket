import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  Wallet,
  Activity,
  UserCheck,
  UserX,
  Ban,
  Shield,
  ShieldOff,
  LogOut,
  Search,
  Plus,
  Minus,
  Trash2,
  KeyRound,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface AdminProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  balance: number;
  account_status: 'active' | 'suspended' | 'banned';
  referral_code: string;
  created_at: string;
  last_login: string | null;
}

interface RoleRow {
  user_id: string;
  role: 'admin' | 'user';
}

interface AuditRow {
  id: string;
  admin_id: string | null;
  action: string;
  target_user_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

type Tab = 'overview' | 'users' | 'audit';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, loading, logout, session } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');

  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  const [selected, setSelected] = useState<AdminProfile | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletReason, setWalletReason] = useState('');
  const [walletMode, setWalletMode] = useState<'credit' | 'debit'>('credit');

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      navigate('/signin');
      return;
    }
    load();
  }, [isAdmin, loading, navigate]);

  const load = async () => {
    const [{ data: p }, { data: r }, { data: a }] = await Promise.all([
      db.from('profiles').select('*').order('created_at', { ascending: false }),
      db.from('user_roles').select('user_id, role'),
      db.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200),
    ]);
    setProfiles((p as AdminProfile[]) || []);
    setRoles((r as RoleRow[]) || []);
    setAudits((a as AuditRow[]) || []);
  };

  const logAction = async (action: string, target?: string, details?: Record<string, unknown>) => {
    if (!session?.user) return;
    await db.from('audit_log').insert({
      admin_id: session.user.id,
      action,
      target_user_id: target ?? null,
      details: details ?? null,
    });
  };

  const isAdminUser = (uid: string) => roles.some((r) => r.user_id === uid && r.role === 'admin');

  const stats = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const total = profiles.length;
    const active = profiles.filter((p) => p.account_status === 'active').length;
    const suspended = profiles.filter((p) => p.account_status === 'suspended').length;
    const banned = profiles.filter((p) => p.account_status === 'banned').length;
    const admins = roles.filter((r) => r.role === 'admin').length;
    const balanceSum = profiles.reduce((s, p) => s + Number(p.balance || 0), 0);
    const newToday = profiles.filter((p) => now - new Date(p.created_at).getTime() < dayMs).length;

    // last 7 days registrations
    const days: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * dayMs);
      const key = d.toLocaleDateString(undefined, { weekday: 'short' });
      const count = profiles.filter((p) => {
        const t = new Date(p.created_at).getTime();
        return t >= new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() &&
               t < new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() + dayMs;
      }).length;
      days.push({ day: key, count });
    }

    return { total, active, suspended, banned, admins, balanceSum, newToday, days };
  }, [profiles, roles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.email?.toLowerCase().includes(q) ||
        p.first_name?.toLowerCase().includes(q) ||
        p.last_name?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q),
    );
  }, [profiles, search]);

  const setStatus = async (u: AdminProfile, status: 'active' | 'suspended' | 'banned') => {
    setBusy(true);
    const { error } = await db.from('profiles').update({ account_status: status }).eq('id', u.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    await logAction(`set_status_${status}`, u.id, { email: u.email });
    toast.success(`User ${status}`);
    load();
  };

  const deleteUser = async (u: AdminProfile) => {
    if (!confirm(`Delete ${u.email}? This removes their profile permanently.`)) return;
    setBusy(true);
    const { error } = await db.from('profiles').delete().eq('id', u.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    await logAction('delete_user', u.id, { email: u.email });
    toast.success('User deleted');
    load();
  };

  const resetPassword = async (u: AdminProfile) => {
    const { error } = await db.auth.resetPasswordForEmail(u.email, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) return toast.error(error.message);
    await logAction('send_password_reset', u.id, { email: u.email });
    toast.success(`Password reset email sent to ${u.email}`);
  };

  const toggleAdmin = async (u: AdminProfile) => {
    const isA = isAdminUser(u.id);
    if (isA) {
      const { error } = await db.from('user_roles').delete().eq('user_id', u.id).eq('role', 'admin');
      if (error) return toast.error(error.message);
      await logAction('demote_admin', u.id, { email: u.email });
      toast.success('Admin removed');
    } else {
      const { error } = await db.from('user_roles').insert({ user_id: u.id, role: 'admin' });
      if (error) return toast.error(error.message);
      await logAction('promote_admin', u.id, { email: u.email });
      toast.success('Promoted to admin');
    }
    load();
  };

  const openWallet = (u: AdminProfile, mode: 'credit' | 'debit') => {
    setSelected(u);
    setWalletMode(mode);
    setWalletAmount('');
    setWalletReason('');
    setWalletOpen(true);
  };

  const submitWallet = async () => {
    if (!selected) return;
    const raw = parseFloat(walletAmount);
    if (isNaN(raw) || raw <= 0) return toast.error('Enter a positive amount');
    const signed = walletMode === 'credit' ? raw : -raw;
    const newBalance = Number(selected.balance) + signed;
    if (newBalance < 0) return toast.error('Insufficient balance for debit');

    setBusy(true);
    const { error: eUpd } = await db.from('profiles').update({ balance: newBalance }).eq('id', selected.id);
    if (eUpd) { setBusy(false); return toast.error(eUpd.message); }
    await db.from('wallet_adjustments').insert({
      user_id: selected.id,
      admin_id: session?.user.id,
      amount: signed,
      reason: walletReason || null,
    });
    await logAction(`wallet_${walletMode}`, selected.id, { amount: signed, reason: walletReason });
    setBusy(false);
    setWalletOpen(false);
    toast.success(`Wallet ${walletMode === 'credit' ? 'credited' : 'debited'}`);
    load();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const fmt = (n: number) => `₦${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const StatCard: React.FC<{ label: string; value: string | number; icon: React.ElementType; tone?: string }> = ({
    label, value, icon: Icon, tone = 'text-primary',
  }) => (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className={`w-4 h-4 ${tone}`} />
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </div>
  );

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Dashboard', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'audit', label: 'Audit Log', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-3 md:p-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">ADMIN</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={20} className="text-muted-foreground" />
          </button>
        </div>
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 whitespace-nowrap text-sm transition-colors ${
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-3 md:p-6 space-y-6">
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Total Users" value={stats.total} icon={Users} />
              <StatCard label="Active" value={stats.active} icon={UserCheck} tone="text-green-500" />
              <StatCard label="Suspended" value={stats.suspended} icon={UserX} tone="text-yellow-500" />
              <StatCard label="Banned" value={stats.banned} icon={Ban} tone="text-red-500" />
              <StatCard label="New Today" value={stats.newToday} icon={TrendingUp} />
              <StatCard label="Admins" value={stats.admins} icon={Shield} />
              <StatCard label="Total Balance" value={fmt(stats.balanceSum)} icon={Wallet} />
              <StatCard label="Recent Actions" value={audits.length} icon={Activity} />
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-4 text-foreground">Registrations — last 7 days</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3 text-foreground">Recent Activity</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {audits.slice(0, 15).map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm py-2 border-b border-border/50">
                    <span className="text-foreground font-medium">{a.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
                {audits.length === 0 && (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                )}
              </div>
            </div>
          </>
        )}

        {tab === 'users' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left text-xs uppercase text-muted-foreground">
                      <th className="px-3 py-3">User</th>
                      <th className="px-3 py-3">Phone</th>
                      <th className="px-3 py-3">Balance</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Role</th>
                      <th className="px-3 py-3">Joined</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((u) => {
                      const admin = isAdminUser(u.id);
                      return (
                        <tr key={u.id} className="hover:bg-muted/30">
                          <td className="px-3 py-3">
                            <div className="font-medium text-foreground">
                              {u.first_name} {u.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">{u.phone || '—'}</td>
                          <td className="px-3 py-3 font-semibold">{fmt(Number(u.balance))}</td>
                          <td className="px-3 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                u.account_status === 'active'
                                  ? 'bg-green-500/15 text-green-500'
                                  : u.account_status === 'suspended'
                                  ? 'bg-yellow-500/15 text-yellow-500'
                                  : 'bg-red-500/15 text-red-500'
                              }`}
                            >
                              {u.account_status}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            {admin ? (
                              <span className="text-xs text-primary font-semibold">ADMIN</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">user</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-1 justify-end">
                              <Button size="sm" variant="outline" onClick={() => openWallet(u, 'credit')} disabled={busy}>
                                <Plus size={14} />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => openWallet(u, 'debit')} disabled={busy}>
                                <Minus size={14} />
                              </Button>
                              {u.account_status !== 'active' && (
                                <Button size="sm" variant="outline" onClick={() => setStatus(u, 'active')} disabled={busy}>
                                  <UserCheck size={14} />
                                </Button>
                              )}
                              {u.account_status !== 'suspended' && (
                                <Button size="sm" variant="outline" onClick={() => setStatus(u, 'suspended')} disabled={busy}>
                                  <UserX size={14} />
                                </Button>
                              )}
                              {u.account_status !== 'banned' && (
                                <Button size="sm" variant="outline" onClick={() => setStatus(u, 'banned')} disabled={busy}>
                                  <Ban size={14} />
                                </Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => resetPassword(u)} disabled={busy} title="Send reset email">
                                <KeyRound size={14} />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => toggleAdmin(u)} disabled={busy} title={admin ? 'Demote' : 'Promote to admin'}>
                                {admin ? <ShieldOff size={14} /> : <Shield size={14} />}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteUser(u)} disabled={busy}>
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-12 text-center text-muted-foreground">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'audit' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-3">When</th>
                  <th className="px-3 py-3">Action</th>
                  <th className="px-3 py-3">Target</th>
                  <th className="px-3 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {audits.map((a) => (
                  <tr key={a.id}>
                    <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 font-medium text-foreground">{a.action}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground font-mono">
                      {a.target_user_id?.slice(0, 8) || '—'}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {a.details ? JSON.stringify(a.details) : '—'}
                    </td>
                  </tr>
                ))}
                {audits.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-12 text-center text-muted-foreground">
                      No audit events yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Dialog open={walletOpen} onOpenChange={setWalletOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {walletMode === 'credit' ? 'Credit Wallet' : 'Debit Wallet'}
            </DialogTitle>
            <DialogDescription>
              {selected?.first_name} {selected?.last_name} — Current: {selected ? fmt(Number(selected.balance)) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Amount (₦)</label>
              <Input
                type="number"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Reason (optional)</label>
              <Textarea
                value={walletReason}
                onChange={(e) => setWalletReason(e.target.value)}
                placeholder="Note for audit log"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWalletOpen(false)}>Cancel</Button>
            <Button onClick={submitWallet} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (walletMode === 'credit' ? 'Credit' : 'Debit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
