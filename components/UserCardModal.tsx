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
  UserCheck
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [relation, setRelation] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    setFeedback(null);
    setLoading(true);

    supabase.auth.getUser().then(async ({ data }) => {
      const myId = data?.user?.id || null;
      setCurrentUserId(myId);

      if (myId && user.id && myId !== user.id) {
        await fetchRelation(myId, user.id);
      }
      setLoading(false);
    });
  }, [isOpen, user]);

  const fetchRelation = async (myId: string, targetId: string) => {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .or(`and(user_id.eq.${myId},contact_id.eq.${targetId}),and(user_id.eq.${targetId},contact_id.eq.${myId})`)
      .maybeSingle();

    setRelation(data || null);
  };

  if (!isOpen || !user) return null;

  const isMe = currentUserId === user.id;

  const handleSendRequest = async () => {
    if (!currentUserId) {
      router.push('/auth');
      return;
    }
    setActionLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        user_id: currentUserId,
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
    }
    setActionLoading(false);
  };

  const handleAcceptRequest = async () => {
    if (!relation) return;
    setActionLoading(true);
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
      setFeedback('მოთხოვნა გაუქმდა');
    }
    setActionLoading(false);
  };

  const isAccepted = relation?.status === 'accepted';
  const isPendingByMe = relation?.status === 'pending' && relation.user_id === currentUserId;
  const isPendingByThem = relation?.status === 'pending' && relation.contact_id === currentUserId;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-blue-600 p-[3px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-white dark:bg-navy-950 rounded-[21px] flex items-center justify-center font-black text-2xl text-slate-900 dark:text-white">
              {user.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5 font-extrabold text-lg text-slate-900 dark:text-white">
              <span>{user.full_name}</span>
              {user.verified_badge && (
                <span title="ვერიფიცირებული">
                  <ShieldCheck className="w-4 h-4 text-cyan-500" />
                </span>
              )}
            </div>

            {user.profession && (
              <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 mt-1 flex items-center justify-center gap-1">
                <Stethoscope className="w-3.5 h-3.5" />
                {user.profession}
              </p>
            )}

            {user.workplace && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {user.workplace}
              </p>
            )}
          </div>
        </div>

        {feedback && (
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-300 text-xs text-center font-semibold">
            {feedback}
          </div>
        )}

        {loading ? (
          <div className="py-4 flex items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
            <span className="text-xs">მოწმდება სტატუსი...</span>
          </div>
        ) : isMe ? (
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-navy-950 text-center text-xs text-slate-500 dark:text-slate-400">
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
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:opacity-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  პირადი მიმოწერა (ჩატი)
                </Link>

                <button
                  onClick={handleDeleteRelation}
                  disabled={actionLoading}
                  className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  კონტაქტიდან წაშლა
                </button>
              </>
            )}

            {isPendingByMe && (
              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>მოთხოვნა გაგზავნილია (მოლოდინში)</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-center space-y-1 opacity-75">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>ჩატი დაბლოკილია</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    ჩატი გაიხსნება მას შემდეგ, რაც კოლეგა დაადასტურებს თქვენს მოთხოვნას.
                  </p>
                </div>

                <button
                  onClick={handleDeleteRelation}
                  disabled={actionLoading}
                  className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
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
                    className="flex-1 py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
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
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:opacity-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>კონტაქტებში დამატება</span>
                </button>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-950/80 border border-slate-200 dark:border-slate-800/80 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>ჩატი დაცულია</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    მიმოწერის დაწყება შესაძლებელია მხოლოდ ორმხრივი თანხმობის შემდეგ.
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
