'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Send, 
  CheckCircle, 
  MessageSquare, 
  Loader2, 
  Lock, 
  Users, 
  ShieldCheck 
} from 'lucide-react';

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTargetUserId = searchParams.get('user');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isContactAccepted, setIsContactAccepted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        router.push('/auth');
      } else {
        setCurrentUser(data.user);
        fetchConfirmedContacts(data.user.id, initialTargetUserId);
      }
    });
  }, [router, initialTargetUserId]);

  const fetchConfirmedContacts = async (myId: string, targetId: string | null) => {
    setLoading(true);
    try {
      const partnerIds = new Set<string>();

      const { data: contactsData } = await supabase
        .from('contacts')
        .select('user_id, contact_id, status')
        .eq('status', 'accepted')
        .or(`user_id.eq.${myId},contact_id.eq.${myId}`);

      contactsData?.forEach((c: any) => {
        if (c.user_id === myId && c.contact_id !== myId) partnerIds.add(c.contact_id);
        if (c.contact_id === myId && c.user_id !== myId) partnerIds.add(c.user_id);
      });

      if (partnerIds.size === 0 && !targetId) {
        setProfiles([]);
        setSelectedUser(null);
        setLoading(false);
        return;
      }

      let isTargetAccepted = false;
      if (targetId && targetId !== myId) {
        isTargetAccepted = partnerIds.has(targetId);
        partnerIds.add(targetId);
      }

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, profession, verified_badge')
        .in('id', Array.from(partnerIds));

      if (profilesData && profilesData.length > 0) {
        setProfiles(profilesData);
        if (targetId) {
          const match = profilesData.find((p) => p.id === targetId);
          setSelectedUser(match || profilesData[0]);
          setIsContactAccepted(isTargetAccepted);
        } else {
          setSelectedUser(profilesData[0]);
          setIsContactAccepted(true);
        }
      } else {
        setProfiles([]);
        setSelectedUser(null);
      }
    } catch (err) {
      console.error('Error in fetchConfirmedContacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && selectedUser) {
      checkRelationStatus(currentUser.id, selectedUser.id);
    }
  }, [currentUser, selectedUser]);

  const checkRelationStatus = async (myId: string, targetId: string) => {
    const { data } = await supabase
      .from('contacts')
      .select('status')
      .eq('status', 'accepted')
      .or(`and(user_id.eq.${myId},contact_id.eq.${targetId}),and(user_id.eq.${targetId},contact_id.eq.${myId})`)
      .maybeSingle();

    setIsContactAccepted(!!data);
  };

  useEffect(() => {
    if (currentUser && selectedUser && isContactAccepted) {
      fetchMessages();

      const channel = supabase
        .channel(`chat:${currentUser.id}-${selectedUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
          },
          (payload) => {
            const msg = payload.new;
            if (
              (msg.sender_id === currentUser.id && msg.receiver_id === selectedUser.id) ||
              (msg.sender_id === selectedUser.id && msg.receiver_id === currentUser.id)
            ) {
              setMessages((prev) => [...prev, msg]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser, selectedUser, isContactAccepted]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    if (!currentUser || !selectedUser) return;
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .or(
        `and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`
      )
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !selectedUser || !isContactAccepted) return;

    const content = newMessage.trim();
    setNewMessage('');

    await supabase.from('direct_messages').insert({
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content,
    });
  };

  return (
    <div className="h-[calc(100vh-140px)] min-h-[520px] bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row">
      <div className="w-full md:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-500" />
            დადასტურებული კონტაქტები
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {loading ? (
            <div className="p-8 flex items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
              <span className="text-xs">იტვირთება...</span>
            </div>
          ) : profiles.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                კონტაქტები ჯერ არ გაქვთ
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                დისკუსიებში ან ბლოგში დააჭირეთ ავტორის სახელს და გაუგზავნეთ კონტაქტის მოთხოვნა.
              </p>
            </div>
          ) : (
            profiles.map((p) => {
              const isSelected = selectedUser?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedUser(p)}
                  className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/10 dark:bg-cyan-500/15'
                      : 'hover:bg-slate-50 dark:hover:bg-navy-950'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-navy-800 text-slate-700 dark:text-cyan-400 flex items-center justify-center font-bold text-sm shrink-0">
                    {p.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="truncate flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {p.full_name}
                      </span>
                      {p.verified_badge && <CheckCircle className="w-3.5 h-3.5 text-cyan-500 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{p.profession || 'სპეციალისტი'}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-navy-950/50">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold text-sm">
                  {selectedUser.full_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    <span>{selectedUser.full_name}</span>
                    {selectedUser.verified_badge && <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />}
                  </div>
                  <p className="text-[10px] text-slate-500">{selectedUser.profession || 'სპეციალისტი'}</p>
                </div>
              </div>

              {isContactAccepted ? (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  დადასტურებული
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> მოლოდინი
                </span>
              )}
            </div>

            {!isContactAccepted ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                  ჩატი დაბლოკილია
                </h3>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  ამ კოლეგასთან მიმოწერის დასაწყებად აუცილებელია, რომ ორივემ დაადასტუროთ კონტაქტებში დამატების მოთხოვნა.
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      დაიწყეთ პირადი მიმოწერა კოლეგასთან...
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender_id === currentUser?.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                              isMe
                                ? 'bg-cyan-600 text-white rounded-br-none shadow-sm'
                                : 'bg-white dark:bg-navy-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/60 rounded-bl-none shadow-sm'
                            }`}
                          >
                            <p>{m.content}</p>
                            <span className="text-[9px] block text-right mt-1 opacity-70">
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-navy-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="დაწერეთ შეტყობინება..."
                    className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl disabled:opacity-40 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-slate-400 space-y-2">
            <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <p>აირჩიეთ დადასტურებული კონტაქტი ჩათის გასახსნელად.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="h-64 flex items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
