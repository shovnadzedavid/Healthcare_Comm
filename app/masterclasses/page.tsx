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
  Award
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

  useEffect(() => {
    loadMasterclasses();
  }, []);

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

  const filtered = masterclasses.filter((m: Masterclass) => {
    if (activeTab === 'upcoming') return !m.is_completed;
    if (activeTab === 'archive') return m.is_completed;
    return true;
  });

  return (
    <div className="space-y-10 pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            პროფესიული განათლება & მასტერკლასები
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

      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex gap-2">
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

        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          სულ: {filtered.length} სესია
        </span>
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
                className="bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between shadow-xs transition-all hover:-translate-y-1 hover:shadow-md"
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
                        ჩანაწერი ხელმისაწვდომია
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        <Calendar className="w-3.5 h-3.5" />
                        {dateStr}
                      </span>
                    )}

                    <div className="flex items-center gap-1 text-slate-900 dark:text-white font-extrabold text-base">
                      <Tag className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>{item.price} {item.currency}</span>
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
                </div>

                <div>
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 mb-5">
                    {item.speaker_avatar_url ? (
                      <img
                        src={item.speaker_avatar_url}
                        alt={item.speaker_name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center justify-center">
                        {item.speaker_name.charAt(0)}
                      </div>
                    )}
                    <div className="text-xs min-w-0">
                      <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {item.speaker_name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {item.speaker_title}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/masterclasses/${item.id}`}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <span>{isPast ? 'ჩანაწერის ნახვა' : 'დეტალები & რეგისტრაცია'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
