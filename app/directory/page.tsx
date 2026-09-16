'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  UserPlus, 
  Check, 
  Shield, 
  MessageSquare, 
  Search, 
  Users, 
  Trash2, 
  Loader2, 
  Building2, 
  Sparkles 
} from 'lucide-react';

export default function DirectoryPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
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
        setFeedback({ type: 'success', message: 'კონტაქტი უკვე თქვენს სიაშია.' });
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
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter((u) => 
      u.full_name?.toLowerCase().includes(q) ||
      u.profession?.toLowerCase().includes(q) ||
      u.workplace?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-navy-900 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            პროფესიული ქსელი
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-cyan-400" />
            კოლეგების დირექტორია
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            მოძებნეთ ჯანდაცვის სფეროს სპეციალისტები, დაიმატეთ თქვენს კონტაქტებში და გაააქტიურეთ მათთან პირადი მიმოწერა.
          </p>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between border transition-all animate-in fade-in duration-200 ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100 font-bold ml-4">✕</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ძიება სახელით, პროფესიით ან ორგანიზაციით..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
          <span>სულ: <strong>{users.length}</strong> კოლეგა</span>
          <span>•</span>
          <span>დამატებული: <strong className="text-cyan-600 dark:text-cyan-400">{contacts.length}</strong></span>
        </div>
      </div>

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          <p className="text-xs">იტვირთება კოლეგების სია...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 space-y-2">
          <Users className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">კოლეგები ვერ მოიძებნა</h3>
          <p className="text-xs text-slate-400">საძიებო სიტყვით შედეგი არ არის.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.map((u) => {
            const isAdded = contacts.includes(u.id);
            const isActing = actionLoading === u.id;

            return (
              <div
                key={u.id}
                className="p-5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-3xl flex flex-col justify-between gap-4 shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600/10 to-teal-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-black text-base shrink-0 group-hover:scale-105 transition-transform">
                    {u.full_name?.[0] || 'U'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {u.full_name}
                      </span>
                      {u.verified_badge && (
                        <Shield className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {u.profession || 'სპეციალისტი'}
                    </p>
                    {u.workplace && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                        <Building2 className="w-3 h-3 shrink-0" />
                        {u.workplace}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 gap-2">
                  <Link
                    href={`/messages?user=${u.id}`}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors flex items-center gap-1.5"
                    title="პირადი შეტყობინება"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>ჩატი</span>
                  </Link>

                  <div className="flex items-center gap-2">
                    {isAdded ? (
                      <>
                        <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> კონტაქტშია
                        </span>
                        <button
                          onClick={() => removeContact(u.id)}
                          disabled={isActing}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="კონტაქტიდან წაშლა"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => addContact(u.id)}
                        disabled={isActing}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-teal-500 hover:opacity-95 text-white shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isActing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                        <span>დამატება</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
