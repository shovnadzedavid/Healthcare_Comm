'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  UserPlus, 
  Check, 
  ShieldCheck, 
  MessageSquare, 
  Search, 
  Users, 
  Trash2, 
  Loader2, 
  Building2, 
  Sparkles,
  Stethoscope,
  Briefcase,
  UserCheck
} from 'lucide-react';

export default function DirectoryPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'contacts' | 'available'>('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push('/auth');
        return;
      }
      if (isMounted) {
        setCurrentUserId(data.user.id);
        await fetchAllData(data.user.id);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
      } else {
        router.push('/auth');
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [router]);

  const fetchAllData = async (myId: string) => {
    setLoading(true);
    try {
      const { data: profilesData, error: profError } = await supabase
        .from('profiles')
        .select('id, full_name, profession, workplace, verified_badge')
        .neq('id', myId)
        .order('full_name', { ascending: true });

      if (profError) {
        console.error('Error fetching profiles:', profError);
        setFeedback({ type: 'error', message: 'პროფილების ჩატვირთვა ვერ მოხერხდა: ' + profError.message });
      } else if (profilesData) {
        setUsers(profilesData);
      }

      const { data: contactsData, error: contError } = await supabase
        .from('contacts')
        .select('contact_id')
        .eq('user_id', myId);

      if (contError) {
        console.error('Error fetching contacts:', contError);
      } else if (contactsData) {
        setContacts(contactsData.map((c: any) => c.contact_id));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (targetId: string) => {
    let myId = currentUserId;
    if (!myId) {
      const { data } = await supabase.auth.getUser();
      myId = data?.user?.id || null;
    }

    if (!myId) {
      setFeedback({ type: 'error', message: 'ავტორიზაცია ვერ დადგინდა. გთხოვთ, შეხვიდეთ სისტემაში.' });
      return;
    }

    setActionLoading(targetId);
    setFeedback(null);

    const { error } = await supabase.from('contacts').insert({
      user_id: myId,
      contact_id: targetId,
    });

    if (error) {
      if (error.code === '23505') {
        setContacts((prev) => Array.from(new Set([...prev, targetId])));
        setFeedback({ type: 'success', message: 'კოლეგა უკვე თქვენს კონტაქტებშია.' });
      } else {
        setFeedback({ type: 'error', message: 'დამატება ვერ მოხერხდა: ' + error.message });
      }
    } else {
      setContacts((prev) => [...prev, targetId]);
      setFeedback({ type: 'success', message: 'კოლეგა წარმატებით დაემატა თქვენს კონტაქტებში!' });
      setTimeout(() => setFeedback(null), 3500);
    }
    setActionLoading(null);
  };

  const removeContact = async (targetId: string) => {
    let myId = currentUserId;
    if (!myId) {
      const { data } = await supabase.auth.getUser();
      myId = data?.user?.id || null;
    }

    if (!myId) return;

    setActionLoading(targetId);
    setFeedback(null);

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('user_id', myId)
      .eq('contact_id', targetId);

    if (error) {
      setFeedback({ type: 'error', message: 'წაშლა ვერ მოხერხდა: ' + error.message });
    } else {
      setContacts((prev) => prev.filter((id) => id !== targetId));
      setFeedback({ type: 'success', message: 'კონტაქტი ამოიშალა სიიდან.' });
      setTimeout(() => setFeedback(null), 3500);
    }
    setActionLoading(null);
  };

  const filteredUsers = useMemo(() => {
    let list = users;
    if (filterTab === 'contacts') {
      list = list.filter((u) => contacts.includes(u.id));
    } else if (filterTab === 'available') {
      list = list.filter((u) => !contacts.includes(u.id));
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((u) => 
      u.full_name?.toLowerCase().includes(q) ||
      u.profession?.toLowerCase().includes(q) ||
      u.workplace?.toLowerCase().includes(q)
    );
  }, [users, contacts, filterTab, searchQuery]);

  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-cyan-500 to-blue-600',
      'from-emerald-400 to-teal-600',
      'from-violet-500 to-purple-600',
      'from-amber-400 to-orange-500',
      'from-rose-400 to-pink-600',
    ];
    const index = (name ? name.charCodeAt(0) : 0) % gradients.length;
    return gradients[index];
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-navy-950 to-slate-900 border border-slate-800/80 p-8 sm:p-10 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
              პროფესიული ქსელი & ნეთვორქინგი
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight flex items-center gap-3.5">
              <Users className="w-8 h-8 sm:w-10 h-10 text-cyan-400" />
              კოლეგების დირექტორია
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              გაიცანით და დაუკავშირდით ჯანდაცვის პოლიტიკის, კლინიკური მენეჯმენტისა და კვლევების სპეციალისტებს. დაიმატეთ კონტაქტებში და დაიწყეთ საქმიანი დიალოგი.
            </p>
          </div>

          {/* Stats Widget */}
          <div className="flex sm:flex-col gap-3 shrink-0 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
                {users.length}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">სულ კოლეგა</p>
                <p className="text-sm font-extrabold text-white">რეგისტრირებული</p>
              </div>
            </div>
            <div className="h-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                {contacts.length}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">ჩემი კონტაქტი</p>
                <p className="text-sm font-extrabold text-emerald-400">დამატებული</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between border shadow-lg transition-all animate-in fade-in duration-300 ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300' 
            : 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <Check className="w-4 h-4" /> : '⚠️'}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-navy-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-md">
        <div className="flex items-center p-1 bg-slate-100 dark:bg-navy-950 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              filterTab === 'all'
                ? 'bg-white dark:bg-navy-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ყველა ({users.length})
          </button>
          <button
            onClick={() => setFilterTab('contacts')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              filterTab === 'contacts'
                ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 shadow-sm'
                : 'text-slate-500 hover:text-cyan-500'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            კონტაქტებში ({contacts.length})
          </button>
          <button
            onClick={() => setFilterTab('available')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              filterTab === 'available'
                ? 'bg-white dark:bg-navy-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            დასამატებელი ({users.length - contacts.length})
          </button>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-cyan-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ძიება სახელით, პროფესიით ან სამუშაო ადგილით..."
            className="w-full pl-11 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
          <p className="text-sm font-semibold">იტვირთება კოლეგების სია...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 space-y-3 shadow-sm">
          <Users className="w-12 h-12 mx-auto text-slate-400 opacity-60" />
          <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200">შედეგი არ მოიძებნა</h3>
          <p className="text-xs text-slate-400">სცადეთ სხვა საძიებო სიტყვა ან გადართეთ ფილტრის ჩანართი.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsers.map((u) => {
            const isAdded = contacts.includes(u.id);
            const isActing = actionLoading === u.id;
            const gradient = getAvatarGradient(u.full_name);

            return (
              <div
                key={u.id}
                className="relative overflow-hidden p-6 bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 rounded-3xl flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300 group"
              >
                {isAdded && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    <Check className="w-3 h-3" /> კონტაქტი
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${gradient} p-[2px] shadow-md group-hover:scale-105 transition-transform shrink-0`}>
                      <div className="w-full h-full bg-white dark:bg-navy-950 rounded-[14px] flex items-center justify-center font-black text-xl text-slate-900 dark:text-white">
                        {u.full_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                          {u.full_name}
                        </span>
                        {u.verified_badge && (
                          <ShieldCheck className="w-4 h-4 text-cyan-500 shrink-0" title="ვერიფიცირებული" />
                        )}
                      </div>

                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-cyan-700 dark:text-cyan-400 font-semibold truncate">
                        <Stethoscope className="w-3.5 h-3.5 shrink-0 opacity-80" />
                        <span className="truncate">{u.profession || 'ჯანდაცვის სპეციალისტი'}</span>
                      </div>
                    </div>
                  </div>

                  {u.workplace ? (
                    <div className="p-3 bg-slate-50 dark:bg-navy-950/70 rounded-2xl border border-slate-100 dark:border-slate-800/60 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">{u.
