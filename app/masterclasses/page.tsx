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
    price: 59,
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
      price: 49,
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

      const payload = {
        title: editingItem.title.trim(),
        subtitle: editingItem.subtitle?.trim() || '',
        description: editingItem.description?.trim() || '',
        speaker_name: editingItem.speaker_name.trim(),
        speaker_title: editingItem.speaker_title?.trim() || '',
        speaker_avatar_url: editingItem.speaker_avatar_url?.trim() || '',
        price: Number(editingItem.price) || 49,
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
      const updatedLocal: Masterclass = {
        id: fallbackId,
        title: editingItem.title || '',
        subtitle: editingItem.subtitle || '',
        description: editingItem.description || '',
        speaker_name: editingItem.speaker_name || '',
        speaker_title: editingItem.speaker_title || '',
        speaker_avatar_url: editingItem.speaker_avatar_url,
        price: Number(editingItem.price) || 49,
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
              ინტერაქტიული ლაივ სტრიმი (Variant B)
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
