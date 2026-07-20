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
  CheckCircle2,
  XCircle,
  CreditCard,
  Clock,
  Sparkles,
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

interface RoleRow { user_id: string; role: 'admin' | 'user'; }
interface AuditRow {
  id: string; admin_id: string | null; action: string;
  target_user_id: string | null; details: Record<string, unknown> | null; created_at: string;
}
interface Deposit {
  id: string; user_id: string; user_email: string | null; user_name: string | null;
  amount: number; reference: string; bank_name: string | null; note: string | null;
  status: 'pending' | 'approved' | 'rejected'; admin_note: string | null;
  reviewed_at: string | null; created_at: string; screenshot_url: string | null;
}

type Tab = 'overview' | 'users' | 'payments' | 'audit';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, loading, logout, session } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');

  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [receiptUrls, setReceiptUrls] = useState<Record<string, string>>({});
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  const [selected, setSelected] = useState<AdminProfile | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletReason, setWalletReason] = useState('');
  const [walletMode, setWalletMode] = useState<'credit' | 'debit'>('credit');

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectDep, setRejectDep] = useState<Deposit | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) { navigate('/signin'); return; }
    load();
  }, [isAdmin, loading, navigate]);

  const load = async () => {
    const [{ data: p }, { data: r }, { data: a }, { data: d }] = await Promise.all([
      db.from('profiles').select('*').order('created_at', { ascending: false }),
      db.from('user_roles').select('user_id, role'),
      db.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200),
      db.from('deposits').select('*').order('created_at', { ascending: false }).limit(500),
    ]);
    setProfiles((p as AdminProfile[]) || []);
    setRoles((r as RoleRow[]) || []);
    setAudits((a as AuditRow[]) || []);
    const deps = (d as Deposit[]) || [];
    setDeposits(deps);

    // Generate signed URLs for receipts
    const urls: Record<string, string> = {};
    await Promise.all(deps.filter((x) => x.screenshot_url).map(async (x) => {
      const { data: signed } = await db.storage.from('receipts').createSignedUrl(x.screenshot_url!, 3600);
      if (signed?.signedUrl) urls[x.id] = signed.signedUrl;
    }));
    setReceiptUrls(urls);
  };

  const logAction = async (action: string, target?: string, details?: Record<string, unknown>) => {
    if (!session?.user) return;
    await db.from('audit_log').insert({
      admin_id: session.user.id, action, target_user_id: target ?? null, details: details ?? null,
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
    const pendingPay = deposits.filter((d) => d.status === 'pending').length;
    const approvedSum = deposits.filter((d) => d.status === 'approved').reduce((s, d) => s + Number(d.amount), 0);

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
    return { total, active, suspended, banned, admins, balanceSum, newToday, pendingPay, approvedSum, days };
  }, [profiles, roles, deposits]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) =>
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
    const { error } = await db.auth.resetPasswordForEmail(u.email, { redirectTo: `${window.location.origin}/` });
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
    setSelected(u); setWalletMode(mode); setWalletAmount(''); setWalletReason(''); setWalletOpen(true);
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
      user_id: selected.id, admin_id: session?.user.id, amount: signed, reason: walletReason || null,
    });
    await logAction(`wallet_${walletMode}`, selected.id, { amount: signed, reason: walletReason });
    setBusy(false); setWalletOpen(false);
    toast.success(`Wallet ${walletMode === 'credit' ? 'credited' : 'debited'}`);
    load();
  };

  const approveDeposit = async (d: Deposit) => {
    setBusy(true);
    const target = profiles.find((p) => p.id === d.user_id);
    const newBal = Number(target?.balance ?? 0) + Number(d.amount);
    const { error: e1 } = await db.from('deposits').update({
      status: 'approved', admin_id: session?.user.id, reviewed_at: new Date().toISOString(),
    }).eq('id', d.id);
    if (e1) { setBusy(false); return toast.error(e1.message); }
    if (target) {
      await db.from('profiles').update({ balance: newBal }).eq('id', target.id);
      await db.from('wallet_adjustments').insert({
        user_id: target.id, admin_id: session?.user.id, amount: Number(d.amount),
        reason: `Deposit approved (${d.reference})`,
      });
    }
    await logAction('approve_deposit', d.user_id, { amount: d.amount, reference: d.reference });
    setBusy(false); toast.success('Payment approved & wallet credited'); load();
  };

  const openReject = (d: Deposit) => { setRejectDep(d); setRejectNote(''); setRejectOpen(true); };

  const submitReject = async () => {
    if (!rejectDep) return;
    setBusy(true);
    const { error } = await db.from('deposits').update({
      status: 'rejected', admin_id: session?.user.id,
      reviewed_at: new Date().toISOString(), admin_note: rejectNote || null,
    }).eq('id', rejectDep.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    await logAction('reject_deposit', rejectDep.user_id, { reference: rejectDep.reference, note: rejectNote });
    setRejectOpen(false); toast.success('Payment rejected'); load();
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  const fmt = (n: number) => `₦${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const StatCard: React.FC<{
    label: string; value: string | number; icon: React.ElementType;
    tint?: string; sub?: string;
  }> = ({ label, value, icon: Icon, tint = 'from-primary/20 to-primary/5', sub }) => (
    <div className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${tint} p-4 backdrop-blur`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</span>
        <div className="p-2 rounded-lg bg-background/40">
          <Icon className="w-4 h-4 text-foreground" />
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard, badge: stats.pendingPay },
    { id: 'audit', label: 'Audit', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative max-w-7xl mx-auto p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[11px] font-bold tracking-wider text-primary">ADMIN CONSOLE</span>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-lg bg-card hover:bg-muted transition-colors" aria-label="Sign out">
              <LogOut size={18} className="text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Welcome back, Admin</h1>
            <p className="text-sm text-muted-foreground">
              {stats.pendingPay > 0
                ? `${stats.pendingPay} payment${stats.pendingPay > 1 ? 's' : ''} awaiting your review`
                : 'All payments reviewed. Nice work.'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 -mb-px overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium whitespace-nowrap transition-all ${
                  tab === t.id
                    ? 'bg-background text-foreground border border-b-background border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <t.icon size={15} />
                {t.label}
                {t.badge ? (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold min-w-[18px] text-center">
                    {t.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-3 md:p-6 space-y-6">
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Total Users" value={stats.total} icon={Users} tint="from-blue-500/20 to-blue-500/5" sub={`${stats.newToday} new today`} />
              <StatCard label="Active" value={stats.active} icon={UserCheck} tint="from-green-500/20 to-green-500/5" />
              <StatCard label="Suspended" value={stats.suspended} icon={UserX} tint="from-yellow-500/20 to-yellow-500/5" />
              <StatCard label="Banned" value={stats.banned} icon={Ban} tint="from-red-500/20 to-red-500/5" />
              <StatCard label="Pending Payments" value={stats.pendingPay} icon={Clock} tint="from-orange-500/20 to-orange-500/5" />
              <StatCard label="Approved Total" value={fmt(stats.approvedSum)} icon={CheckCircle2} tint="from-emerald-500/20 to-emerald-500/5" />
              <StatCard label="Wallet Balance" value={fmt(stats.balanceSum)} icon={Wallet} tint="from-primary/20 to-primary/5" />
              <StatCard label="Admins" value={stats.admins} icon={Shield} tint="from-purple-500/20 to-purple-500/5" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Registrations — last 7 days</h3>
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.days}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button className="w-full justify-start" variant="outline" onClick={() => setTab('payments')}>
                    <CreditCard className="w-4 h-4 mr-2" /> Review Payments
                    {stats.pendingPay > 0 && (
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                        {stats.pendingPay}
                      </span>
                    )}
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => setTab('users')}>
                    <Users className="w-4 h-4 mr-2" /> Manage Users
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => setTab('audit')}>
                    <Shield className="w-4 h-4 mr-2" /> View Audit Log
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-3 text-foreground">Recent Activity</h3>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {audits.slice(0, 15).map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0">
                    <span className="text-foreground font-medium">{a.action.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                  </div>
                ))}
                {audits.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
              </div>
            </div>
          </>
        )}

        {tab === 'users' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name, email, phone, ID..." value={search}
                onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
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
                            <div className="font-medium text-foreground">{u.first_name} {u.last_name}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">{u.phone || '—'}</td>
                          <td className="px-3 py-3 font-semibold">{fmt(Number(u.balance))}</td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              u.account_status === 'active' ? 'bg-green-500/15 text-green-500'
                              : u.account_status === 'suspended' ? 'bg-yellow-500/15 text-yellow-500'
                              : 'bg-red-500/15 text-red-500'
                            }`}>{u.account_status}</span>
                          </td>
                          <td className="px-3 py-3">
                            {admin ? <span className="text-xs text-primary font-semibold">ADMIN</span>
                              : <span className="text-xs text-muted-foreground">user</span>}
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-1 justify-end">
                              <Button size="sm" variant="outline" onClick={() => openWallet(u, 'credit')} disabled={busy} title="Credit"><Plus size={14} /></Button>
                              <Button size="sm" variant="outline" onClick={() => openWallet(u, 'debit')} disabled={busy} title="Debit"><Minus size={14} /></Button>
                              {u.account_status !== 'active' && <Button size="sm" variant="outline" onClick={() => setStatus(u, 'active')} disabled={busy} title="Activate"><UserCheck size={14} /></Button>}
                              {u.account_status !== 'suspended' && <Button size="sm" variant="outline" onClick={() => setStatus(u, 'suspended')} disabled={busy} title="Suspend"><UserX size={14} /></Button>}
                              {u.account_status !== 'banned' && <Button size="sm" variant="outline" onClick={() => setStatus(u, 'banned')} disabled={busy} title="Ban"><Ban size={14} /></Button>}
                              <Button size="sm" variant="outline" onClick={() => resetPassword(u)} disabled={busy} title="Reset password"><KeyRound size={14} /></Button>
                              <Button size="sm" variant="outline" onClick={() => toggleAdmin(u)} disabled={busy} title={admin ? 'Demote' : 'Promote'}>
                                {admin ? <ShieldOff size={14} /> : <Shield size={14} />}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteUser(u)} disabled={busy} title="Delete"><Trash2 size={14} /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} className="px-3 py-12 text-center text-muted-foreground">No users found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'payments' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Pending" value={deposits.filter((d) => d.status === 'pending').length} icon={Clock} tint="from-orange-500/20 to-orange-500/5" />
              <StatCard label="Approved" value={deposits.filter((d) => d.status === 'approved').length} icon={CheckCircle2} tint="from-green-500/20 to-green-500/5" />
              <StatCard label="Rejected" value={deposits.filter((d) => d.status === 'rejected').length} icon={XCircle} tint="from-red-500/20 to-red-500/5" />
            </div>

            <div className="space-y-3">
              {deposits.length === 0 && (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                  <CreditCard className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No payments submitted yet.</p>
                </div>
              )}
              {deposits.map((d) => (
                <div key={d.id} className="bg-card border border-border rounded-2xl p-4 md:p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-foreground">{d.user_name || 'Unknown user'}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                          d.status === 'pending' ? 'bg-orange-500/15 text-orange-500'
                          : d.status === 'approved' ? 'bg-green-500/15 text-green-500'
                          : 'bg-red-500/15 text-red-500'
                        }`}>{d.status}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{d.user_email}</div>
                      <div className="flex items-center gap-3 flex-wrap mt-2 text-xs text-muted-foreground">
                        <span className="font-mono">{d.reference}</span>
                        {d.bank_name && <span>• {d.bank_name}</span>}
                        <span>• {new Date(d.created_at).toLocaleString()}</span>
                      </div>
                      {d.admin_note && (
                        <div className="mt-2 text-xs text-red-400 italic">Note: {d.admin_note}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">{fmt(Number(d.amount))}</div>
                    </div>
                  </div>

                  {receiptUrls[d.id] && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-2">Payment receipt</p>
                      <button
                        onClick={() => setViewReceipt(receiptUrls[d.id])}
                        className="block rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                      >
                        <img src={receiptUrls[d.id]} alt="Payment receipt" className="max-h-48 w-auto object-contain bg-black/30" />
                      </button>
                    </div>
                  )}

                  {d.status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => approveDeposit(d)} disabled={busy}>
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                      </Button>
                      <Button variant="outline" className="flex-1 border-red-500/40 text-red-500 hover:bg-red-500/10" onClick={() => openReject(d)} disabled={busy}>
                        <XCircle className="w-4 h-4 mr-2" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'audit' && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
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
                    <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(a.created_at).toLocaleString()}</td>
                    <td className="px-3 py-3 font-medium text-foreground">{a.action}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground font-mono">{a.target_user_id?.slice(0, 8) || '—'}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{a.details ? JSON.stringify(a.details) : '—'}</td>
                  </tr>
                ))}
                {audits.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-12 text-center text-muted-foreground">No audit events yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Wallet dialog */}
      <Dialog open={walletOpen} onOpenChange={setWalletOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{walletMode === 'credit' ? 'Credit Wallet' : 'Debit Wallet'}</DialogTitle>
            <DialogDescription>
              {selected?.first_name} {selected?.last_name} — Current: {selected ? fmt(Number(selected.balance)) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Amount (₦)</label>
              <Input type="number" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Reason (optional)</label>
              <Textarea value={walletReason} onChange={(e) => setWalletReason(e.target.value)} placeholder="Note for audit log" rows={3} />
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

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              {rejectDep?.user_name} — {rejectDep ? fmt(Number(rejectDep.amount)) : ''}
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Reason (optional)</label>
            <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="e.g. Payment not received" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={submitReject} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
