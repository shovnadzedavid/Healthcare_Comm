'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Video, 
  Calendar, 
  Clock, 
  Users, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  PlayCircle, 
  Tag, 
  Award, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  ShieldCheck 
} from 'lucide-react';

interface Masterclass {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  speaker_name: string;
  speaker_title: string;
  speaker_avatar_url?: string;
  price: number;
  currency: string;
  scheduled_at: string;
  duration_minutes: number;
  stream_url?: string;
  recording_url?: string;
  is_live: boolean;
  is_completed: boolean;
  learning_points?: string[];
}

const DEFAULT_MASTERCLASSES: Masterclass[] = [
  {
    id: 'drg-financial-management',
    title: 'DRG სისტემის ოპტიმიზაცია და კლინიკის ფინანსური მართვა',
    subtitle: 'პრაქტიკული ქეისები, კოდირების სტრატეგია და სადაზღვევო უარყოფების (Denials) შემცირება',
    description: 'როგორ მოვარგოთ კლინიკის ფინანსური მოდელი DRG დაფინანსებას, შევამციროთ სადაზღვევო უარყოფები და გავზარდოთ რენტაბელობა ხარისხის დაუცემლად.',
    speaker_name: 'გიორგი ბერიძე',
    speaker_title: 'კლინიკური დირექტორი, ჯანდაცვის ეკონომისტი',
    speaker_avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=face',
    price: 49,
    currency: 'GEL',
    scheduled_at: new Date(Date.now() + 86400000 * 3).toISOString(),
    duration_minutes: 90,
    stream_url: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1',
    is_live: true,
    is_completed: false,
    learning_points: [
      'DRG კოდირების ყველაზე ხშირი შეცდომები და მათი პრევენცია',
      'სადაზღვევო უარყოფების (Claims Denials) 30%-ით შემცირების სტრატეგია',
      'საწოლფონდის დაყოვნების საშუალო ხანგრძლივობის (ALOS) ოპტიმიზაცია'
    ]
  },
  {
    id: 'medical-grants-publishing',
    title: 'საერთაშორისო სამედიცინო გრანტების მოპოვება (Horizon Europe, NIH)',
    subtitle: 'იდეიდან დაფინანსებულ პროექტამდე: აპლიკაციის მომზადების პრაქტიკული გზამკვლევი',
    description: 'როგორ მოვიპოვოთ ევროპული და ამერიკული კვლევითი გრანტები საქართველოდან, როგორ შევკრათ საერთაშორისო კონსორციუმი და დავწეროთ გამარჯვებული პროექტი.',
    speaker_name: 'პროფ. ელენე მესხი',
    speaker_title: 'ეპიდემიოლოგიის პროფესორი, საერთაშორისო მკვლევარი',
    speaker_avatar_url: 'https://images.unsplash.com/photo-1594824813511-2e6900f074d7?w=200&h=200&fit=crop&crop=face',
    price: 0,
    currency: 'GEL',
    scheduled_at: new Date(Date.now() + 86400000 * 9).toISOString(),
    duration_minutes: 120,
    is_live: false,
    is_completed: false,
    learning_points: [
      'დონორთა პრიორიტეტების გაშიფვრა და საკვლევი კითხვის ფორმულირება',
      'ბიუჯეტირება და ევროპულ პარტნიორებთან მოლაპარაკება',
      'წარმატებული საგრანტო აპლიკაციების რეალური ნიმუშების გარჩევა'
    ]
  }
];

export default function MasterclassesPage() {
  const [masterclasses, setMasterclasses] = useState<Masterclass[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'archive'>('all');

  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Masterclass> | null>(null);
  const [learningPointsInput, setLearningPointsInput] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    loadMasterclasses();
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user;
      if (currentUser) {
        if (currentUser.email === 'shovnadzedavid@gmail.com') {
          setIsAdmin(true);
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', currentUser.id)
            .maybeSingle();

          if (profile?.is_admin) {
            setIsAdmin(true);
          }
        }
      }
    } catch {
      // Fallback
    }
  };

  const loadMasterclasses = async () => {
    try {
      const { data, error } = await supabase
        .from('masterclasses')
        .select('*')
        .order('scheduled_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setMasterclasses(DEFAULT_MASTERCLASSES);
      } else {
        setMasterclasses(data);
      }
    } catch {
      setMasterclasses(DEFAULT_MASTERCLASSES);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    const nextWeek = new Date(Date.now() + 86400000 * 7);
    setEditingItem({
      title: '',
      subtitle: '',
      description: '',
      speaker_name: '',
      speaker_title: '',
      speaker_avatar_url: '',
      price: 0,
      currency: 'GEL',
      scheduled_at: nextWeek.toISOString().slice(0, 16),
      duration_minutes: 90,
      stream_url: '',
      is_live: false,
      is_completed: false,
      learning_points: []
    });
    setLearningPointsInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Masterclass) => {
    const dt = new Date(item.scheduled_at);
    const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    setEditingItem({
      ...item,
      scheduled_at: localIso
    });
    setLearningPointsInput(item.learning_points ? item.learning_points.join('\n') : '');
    setIsModalOpen(true);
  };

  const handleSaveMasterclass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.title || !editingItem?.speaker_name) {
      alert('სათაური და სპიკერის სახელი სავალდებულოა');
      return;
    }

    setSaveLoading(true);

    try {
      const pointsArray = learningPointsInput
        .split('\n')
        .map((p: string) => p.trim())
        .filter((p: string) => Boolean(p));

      const parsedPrice = editingItem.price === '' || isNaN(Number(editingItem.price)) ? 0 : Number(editingItem.price);

      const payload = {
        title: editingItem.title.trim(),
        subtitle: editingItem.subtitle?.trim() || '',
        description: editingItem.description?.trim() || '',
        speaker_name: editingItem.speaker_name.trim(),
        speaker_title: editingItem.speaker_title?.trim() || '',
        speaker_avatar_url: editingItem.speaker_avatar_url?.trim() || '',
        price: parsedPrice,
        currency: 'GEL',
        scheduled_at: new Date(editingItem.scheduled_at || Date.now()).toISOString(),
        duration_minutes: Number(editingItem.duration_minutes) || 90,
        stream_url: editingItem.stream_url?.trim() || '',
        is_live: Boolean(editingItem.is_live),
        is_completed: Boolean(editingItem.is_completed),
        learning_points: pointsArray
      };

      if (editingItem.id && !editingItem.id.startsWith('drg-') && !editingItem.id.startsWith('medical-')) {
        const { error } = await supabase
          .from('masterclasses')
          .update(payload)
          .eq('id', editingItem.id);

        if (error) throw error;

        setMasterclasses((prev: Masterclass[]) =>
          prev.map((m: Masterclass) => (m.id === editingItem.id ? { ...m, ...payload } : m))
        );
      } else {
        const { data, error } = await supabase
          .from('masterclasses')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setMasterclasses((prev: Masterclass[]) => [data, ...prev]);
        }
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      const fallbackId = editingItem.id || 'mc-' + Date.now();
      const pointsArray = learningPointsInput.split('\n').filter((p: string) => Boolean(p.trim()));
      const parsedPrice = editingItem.price === '' || isNaN(Number(editingItem.price)) ? 0 : Number(editingItem.price);

      const updatedLocal: Masterclass = {
        id: fallbackId,
        title: editingItem.title || '',
        subtitle: editingItem.subtitle || '',
        description: editingItem.description || '',
        speaker_name: editingItem.speaker_name || '',
        speaker_title: editingItem.speaker_title || '',
        speaker_avatar_url: editingItem.speaker_avatar_url,
        price: parsedPrice,
        currency: 'GEL',
        scheduled_at: new Date(editingItem.scheduled_at || Date.now()).toISOString(),
        duration_minutes: Number(editingItem.duration_minutes) || 90,
        stream_url: editingItem.stream_url,
        is_live: Boolean(editingItem.is_live),
        is_completed: Boolean(editingItem.is_completed),
        learning_points: pointsArray
      };

      setMasterclasses((prev: Masterclass[]) => {
        const exists = prev.some((m: Masterclass) => m.id === fallbackId);
        if (exists) {
          return prev.map((m: Masterclass) => (m.id === fallbackId ? updatedLocal : m));
        }
        return [updatedLocal, ...prev];
      });

      setIsModalOpen(false);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteMasterclass = async (item: Masterclass) => {
    if (!window.confirm(`დარწმუნებული ხართ, რომ გსურთ მასტერკლასის წაშლა: "${item.title}"?`)) {
      return;
    }

    try {
      await supabase.from('masterclasses').delete().eq('id', item.id);
      setMasterclasses((prev: Masterclass[]) => prev.filter((m: Masterclass) => m.id !== item.id));
    } catch (err) {
      console.error(err);
      setMasterclasses((prev: Masterclass[]) => prev.filter((m: Masterclass) => m.id !== item.id));
    }
  };

  const filtered = masterclasses.filter((m: Masterclass) => {
    if (activeTab === 'upcoming') return !m.is_completed;
    if (activeTab === 'archive') return m.is_completed;
    return true;
  });

  return (
    <div className="space-y-10 pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              პროფესიული განათლება & მასტერკლასები
            </div>

            {isAdmin && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                ადმინ-რეჟიმი აქტიურია
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Healthcare<span className="text-cyan-400">Comm</span> Masterclasses
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            დახურული, მაღალპრაქტიკული ლაივ-სესიები დარგის წამყვან ექსპერტებთან. მიიღეთ რეალური ჰოსპიტალური გამოცდილება, საექსპერტო მასალები და სერტიფიკატი.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <Video className="w-4 h-4 text-cyan-400" />
              ინტერაქტიული ლაივ სტრიმი
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <Award className="w-4 h-4 text-emerald-400" />
              ციფრული სერტიფიკატი
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <Users className="w-4 h-4 text-purple-400" />
              დახურული Q&A ექსპერტთან
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white dark:bg-cyan-500 dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            ყველა მასტერკლასი
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-slate-900 text-white dark:bg-cyan-500 dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            დაგეგმილი / ლაივ
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'archive'
                ? 'bg-slate-900 text-white dark:bg-cyan-500 dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            ვიდეოარქივი (VOD)
          </button>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + ახალი მასტერკლასი
            </button>
          )}

          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            სულ: {filtered.length} სესია
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 animate-pulse text-sm">
          მასტერკლასები იტვირთება...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#0d121f] rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
          მასტერკლასები ამ კატეგორიაში ჯერ არ არის.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item: Masterclass) => {
            const isPast = item.is_completed;
            const dateObj = new Date(item.scheduled_at);
            const dateStr = dateObj.toLocaleDateString('ka-GE', {
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={item.id}
                className="relative bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between shadow-xs transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    {item.is_live ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        LIVE ახლა
                      </span>
                    ) : isPast ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        <PlayCircle className="w-3.5 h-3.5" />
                        ჩანაწერი
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        <Calendar className="w-3.5 h-3.5" />
                        {dateStr}
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-slate-900 dark:text-white font-extrabold text-base">
                        {Number(item.price) === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            უფასო
                          </span>
                        ) : (
                          <>
                            <Tag className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                            <span>{item.price} {item.currency}</span>
                          </>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-cyan-500/20 text-slate-600 dark:text-slate-300 hover:text-cyan-500 transition-colors cursor-pointer"
                            title="სწრაფი რედაქტირება"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMasterclass(item)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/20 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                            title="წაშლა"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {item.subtitle || item.description}
                  </p>

                  {item.learning_points && item.learning_points.length > 0 && (
                    <div className="space-y-1.5 mb-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      {item.learning_points.slice(0, 2).map((point: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{point}</span>
                        </div>
                      ))}
                    </div>
                  )}
