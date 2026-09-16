'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  X, 
  MessageSquare, 
  UserPlus, 
  Check, 
  ShieldCheck, 
  Building2, 
  Stethoscope, 
  Loader2, 
  Lock, 
  Clock, 
  UserCheck,
  FileText,
  MessageCircle
} from 'lucide-react';

interface UserCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    full_name?: string;
    profession?: string;
    workplace?: string;
    verified_badge?: boolean;
    bio?: string;
  } | null;
}

export default function UserCardModal({ isOpen, onClose, user }: UserCardModalProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [relation, setRelation] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const [stats, setStats] = useState<{ discussions: number; comments: number }>({ discussions: 0, comments: 0 });
  const [userBio, setUserBio] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    setFeedback(null);
    setConfirmDelete(false);
    setLoading(true);

    supabase.auth.getUser().then(async ({ data }) => {
      const myUser = data?.user || null;
      setCurrentUser(myUser);

      if (user.id) {
        fetchUserStats(user.id);

        if (myUser && myUser.id !== user.id) {
          await fetchRelation(myUser.id, user.id);
        }
      }
      setLoading(false);
    });
  }, [isOpen, user]);

  const fetchUserStats = async (targetId: string) => {
    try {
      if (user?.bio) {
        setUserBio(user.bio);
      } else {
        const { data: prof } = await supabase
          .from('profiles')
          .select('bio')
          .eq('id', targetId)
          .maybeSingle();
        if (prof?.bio) setUserBio(prof.bio);
      }

      const { count: discCount } = await supabase
        .from('discussions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetId);

      const { count: commCount } = await supabase
        .from('discussion_comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetId);

      setStats({
        discussions: discCount || 0,
        comments: commCount || 0,
      });
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  };

  const fetchRelation = async (myId: string, targetId: string) => {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .or(`and(user_id.eq.${myId},contact_id.eq.${targetId}),and(user_id.eq.${targetId},contact_id.eq.${myId})`)
      .maybeSingle();

    setRelation(data || null);
  };

  if (!isOpen || !user) return null;

  const isMe = currentUser?.id === user.id;

  const handleSendRequest = async () => {
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    setActionLoading(true);
    setFeedback(null);

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        user_id: currentUser.id,
        contact_id: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      setFeedback('მოთხოვნის გაგზავნა ვერ მოხერხდა');
    } else {
      setRelation(data);
      setFeedback('მოთხოვნა გაგზავნილია!');

      try {
        const myName = currentUser.user_metadata?.full_name || 'კოლეგამ';
        await supabase.from('notifications').insert({
          user_id: user.id,
          content: `${myName} გამოგიგზავნათ კონტაქტის მოთხოვნა`,
          is_read: false,
        });
      } catch (notifErr) {
        console.error('Notification error:', notifErr);
      }
    }
    setActionLoading(false);
  };

  const handleAcceptRequest = async () => {
    if (!relation || !currentUser) return;
    setActionLoading(true);
    setFeedback(null);

    const { data, error } = await supabase
      .from('contacts')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', relation.id)
      .select()
      .single();

    if (error) {
      setFeedback('დადასტურება ვერ მოხერხდა');
    } else {
      setRelation(data);
      setFeedback('კონტაქტი დადასტურებულია! ჩატი განბლოკილია.');

      try {
        const myName = currentUser.user_metadata?.full_name || 'კოლეგამ';
        await supabase.from('notifications').insert({
          user_id: relation.user_id,
          content: `${myName} დაადასტურა თქვენი კონტაქტის მოთხოვნა`,
          is_read: false,
        });
      } catch (notifErr) {
        console.error('Notification error:', notifErr);
      }
    }
    setActionLoading(false);
  };

  const handleDeleteRelation = async () => {
    if (!relation) return;
    setActionLoading(true);
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', relation.id);

    if (!error) {
      setRelation(null);
      setConfirmDelete(false);
      setFeedback('კონტაქტი გაუქმდა');
    }
    setActionLoading(false);
  };

  const isAccepted = relation?.status === 'accepted';
  const isPendingByMe = relation?.status === 'pending' && relation.user_id === currentUser?.id;
  const isPendingByThem = relation?.status === 'pending' && relation.contact_id === currentUser?.id;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-colors cursor-pointer active:scale-95"
          aria-label="დახურვა"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-3 pt-1">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-blue-600 p-[3px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-white dark:bg-navy-950 rounded-[21px] flex items-center justify-center font-black text-2xl text-slate-900 dark:text-white">
              {user.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 font-extrabold text-lg text-slate-900 dark:text-white">
              <span>{user.full_name}</span>
              {user.verified_badge && (
                <span title="ვერიფიცირებული სპეციალისტი">
                  <ShieldCheck className="w-4 h-4 text-cyan-500 drop-shadow-sm" />
                </span>
              )}
            </div>

            {user.profession && (
              <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 flex items-center justify-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <span>{user.profession}</span>
              </p>
            )}

            {user.workplace && (
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 leading-snug">
                <Building2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span>{user.workplace}</span>
              </p>
            )}
          </div>
        </div>

        {userBio && (
          <div className="p-3 bg-slate-50 dark:bg-navy-950/70 border border-slate-100 dark:border-slate-800/80 rounded-2xl text-center">
            <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed line-clamp-3">
              "{userBio}"
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-navy-950/50 border border-slate-100 dark:border-slate-800/60 flex items-center justify-center gap-2 text-center">
            <FileText className="w-3.5 h-3.5 text-cyan-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {stats.discussions} <span className="text-[11px] font-medium text-slate-400">თემა</span>
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-navy-950/50 border border-slate-100 dark:border-slate-800/60 flex items-center justify-center gap-2 text-center">
            <MessageCircle className="w-3.5 h-3.5 text-teal-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {stats.comments} <span className="text-[11px] font-medium text-slate-400">პასუხი</span>
            </span>
          </div>
        </div>

        {feedback && (
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs text-center font-bold animate-in fade-in duration-150">
            {feedback}
          </div>
        )}

        {loading ? (
          <div className="py-3 flex items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
            <span className="text-xs">მოწმდება კავშირი...</span>
          </div>
        ) : isMe ? (
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-navy-950 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            ეს თქვენი პროფილია
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {isAccepted && (
              <>
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <UserCheck className="w-4 h-4" />
                  <span>დადასტურებული კონტაქტი</span>
                </div>

                <Link
                  href={`/messages?user=${user.id}`}
                  onClick={onClose}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:opacity-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  პირადი მიმოწერა (ჩატი)
                </Link>

                {confirmDelete ? (
                  <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2 animate-in fade-in duration-150">
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 text-center font-bold">
                      ნამდვილად გსურთ კონტაქტის გაუქმება?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteRelation}
                        disabled={actionLoading}
                        className="flex-1 py-1.5 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-500 cursor-pointer transition-all"
                      >
                        დიახ, წაშლა
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer transition-all"
                      >
                        გაუქმება
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={actionLoading}
                    className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    კონტაქტიდან წაშლა
                  </button>
                )}
              </>
            )}

            {isPendingByMe && (
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold">
                  <Clock className="w-4 h-4" />
                  <span>მოთხოვნა გაგზავნილია (მოლოდინში)</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200 dark:border-slate-800/80 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>ჩატი გაიხსნება დადასტურების შემდეგ</span>
                  </div>
                </div>

                <button
                  onClick={handleDeleteRelation}
                  disabled={actionLoading}
                  className="w-full py-1.5 text-center text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  მოთხოვნის გაუქმება
                </button>
              </div>
            )}

            {isPendingByThem && (
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs text-center font-bold">
                  კოლეგამ გამოგიგზავნათ კონტაქტის მოთხოვნა
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAcceptRequest}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    დადასტურება
                  </button>
                  <button
                    onClick={handleDeleteRelation}
                    disabled={actionLoading}
                    className="py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-navy-800 hover:bg-rose-500/10 hover:text-rose-500 text-slate-500 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    უარყოფა
                  </button>
                </div>
              </div>
            )}

            {!relation && (
              <div className="space-y-3">
                <button
                  onClick={handleSendRequest}
                  disabled={actionLoading}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:opacity-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>კონტაქტებში დამატება</span>
                </button>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200 dark:border-slate-800/80 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>ორმხრივი დაცული სისტემა</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    მიმოწერა შესაძლებელია მხოლოდ ორმხრივი თანხმობის შემდეგ.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
