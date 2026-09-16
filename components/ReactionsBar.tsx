'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ReactionsBarProps {
  targetId: string;
  targetType: 'discussion' | 'blog';
}

export default function ReactionsBar({ targetId, targetType }: ReactionsBarProps) {
  const [reactions, setReactions] = useState<{ [key: string]: number }>({
    insightful: 0,
    agree: 0,
    discuss: 0,
  });
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id);
        fetchUserReaction(data.user.id);
      }
    });
    fetchReactionsCount();
  }, [targetId]);

  const fetchReactionsCount = async () => {
    const { data } = await supabase
      .from('reactions')
      .select('reaction_type')
      .eq('target_id', targetId)
      .eq('target_type', targetType);

    if (data) {
      const counts: { [key: string]: number } = { insightful: 0, agree: 0, discuss: 0 };
      data.forEach((r: any) => {
        if (counts[r.reaction_type] !== undefined) {
          counts[r.reaction_type]++;
        }
      });
      setReactions(counts);
    }
  };

  const fetchUserReaction = async (userId: string) => {
    const { data } = await supabase
      .from('reactions')
      .select('reaction_type')
      .eq('target_id', targetId)
      .eq('target_type', targetType)
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setUserReaction(data.reaction_type);
    }
  };

  const handleToggleReaction = async (type: string) => {
    if (!currentUserId) {
      alert('რეაქციის დასატოვებლად გაიარეთ ავტორიზაცია');
      return;
    }
    if (loading) return;
    setLoading(true);

    if (userReaction === type) {
      await supabase
        .from('reactions')
        .delete()
        .eq('target_id', targetId)
        .eq('target_type', targetType)
        .eq('user_id', currentUserId);

      setUserReaction(null);
      setReactions((prev) => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
    } else {
      await supabase
        .from('reactions')
        .upsert({
          target_id: targetId,
          target_type: targetType,
          user_id: currentUserId,
          reaction_type: type,
        }, { onConflict: 'user_id,target_type,target_id' });

      if (userReaction) {
        setReactions((prev) => ({
          ...prev,
          [userReaction]: Math.max(0, prev[userReaction] - 1),
          [type]: prev[type] + 1,
        }));
      } else {
        setReactions((prev) => ({ ...prev, [type]: prev[type] + 1 }));
      }
      setUserReaction(type);
    }
    setLoading(false);
  };

  const buttons = [
    { type: 'insightful', label: 'მიგნება', icon: '💡', activeColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40' },
    { type: 'agree', label: 'ვეთანხმები', icon: '🤝', activeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40' },
    { type: 'discuss', label: 'სადისკუსიოა', icon: '⚖️', activeColor: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/40' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      {buttons.map((btn) => {
        const isActive = userReaction === btn.type;
        const count = reactions[btn.type] || 0;
        return (
          <button
            key={btn.type}
            type="button"
            onClick={() => handleToggleReaction(btn.type)}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              isActive
                ? btn.activeColor
                : 'bg-slate-100/80 dark:bg-navy-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
            }`}
          >
            <span>{btn.icon}</span>
            <span>{btn.label}</span>
            {count > 0 && <span className="text-[11px] font-black opacity-90">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
