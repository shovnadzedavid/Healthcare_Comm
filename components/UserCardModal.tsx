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
  Loader2 
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
  const [isContact, setIsContact] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !user) return;

    supabase.auth.getUser().then(async ({ data }) => {
      const myId = data?.user?.id || null;
      setCurrentUserId(myId);

      if (myId && user.id) {
        const { data: contactData } = await supabase
          .from('contacts')
          .select('id')
          .eq('user_id', myId)
          .eq('contact_id', user.id)
          .maybeSingle();

        setIsContact(!!contactData);
      }
    });
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const isMe = currentUserId === user.id;

  const handleToggleContact = async () => {
    if (!currentUserId) {
      router.push('/auth');
      return;
    }

    setLoading(true);
    if (isContact) {
      await supabase
        .from('contacts')
        .delete()
        .eq('user_id', currentUserId)
        .eq('contact_id', user.id);
      setIsContact(false);
    } else {
      await supabase
        .from('contacts')
        .insert({
          user_id: currentUserId,
          contact_id: user.id,
        });
      setIsContact(true);
    }
    setLoading(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
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
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-600 to-teal-400 p-[3px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-white dark:bg-navy-950 rounded-[21px] flex items-center justify-center font-black text-2xl text-slate-900 dark:text-white">
              {user.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5 font-extrabold text-lg text-slate-900 dark:text-white">
              <span>{user.full_name}</span>
              {user.verified_badge && (
                <ShieldCheck className="w-4 h-4 text-cyan-500" title="ვერიფიცირებული" />
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

        {!isMe ? (
          <div className="space-y-2.5 pt-2">
            <Link
              href={`/messages?user=${user.id}`}
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-cyan-600/20 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              პირადი შეტყობინება (ჩატი)
            </Link>

            <button
              onClick={handleToggleContact}
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                isContact
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-500'
                  : 'bg-slate-100 dark:bg-navy-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-cyan-500'
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
              ) : isContact ? (
                <>
                  <Check className="w-4 h-4" /> კონტაქტებშია (წაშლა)
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> კონტაქტებში დამატება
                </>
              )}
            </button>
          </div>
        ) : (
          <p className="text-center text-xs text-slate-400 py-2">
            ეს თქვენი საკუთარი პროფილია
          </p>
        )}
      </div>
    </div>
  );
}
