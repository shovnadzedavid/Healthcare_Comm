'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import UserCardModal from '@/components/UserCardModal';
import { 
  MessageSquare, 
  PlusCircle, 
  Search, 
  FileText, 
  Users, 
  CheckCircle, 
  ShieldCheck, 
  GraduationCap, 
  Sparkles, 
  ArrowRight, 
  Loader2,
  Link as LinkIcon
} from 'lucide-react';

function formatRelativeTime(dateStr: string) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'ახლახან';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} წუთის წინ`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} საათის წინ`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} დღის წინ`;
  return date.toLocaleDateString('ka-GE', { day: 'numeric', month: 'short' });
}

const POLICY_CATEGORIES = [
  { id: 'all', label: 'ყველა თემა' },
  { id: 'policy_brief', label: '📜 Policy Briefs' },
  { id: 'collaborators', label: '🤝 თანამშრომლობა' },
  { id: 'policy_law', label: '🏛️ პოლიტიკა & კანონმდებლობა' },
  { id: 'finance_drg', label: '📊 დაფინანსება & DRG' },
  { id: 'public_health', label: '🌍 საზოგადოებრივი ჯანმრთელობა' },
  { id: 'hospital_mgmt', label: '🏥 ჰოსპიტალური მენეჯმენტი' },
  { id: 'primary_care', label: '🩺 პირველადი ჯანდაცვა' },
];

export default function DiscussionsPage() {
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedAuthor, setSelectedAuthor] = useState<any>(null);

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('discussions')
        .select(`
          *,
          author:profiles(id, full_name, profession, workplace, verified_badge, bio),
          comments:discussion_comments(count)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setDiscussions(data);
      }
    } catch (e) {
      console.error('Error fetching discussions:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredDiscussions = useMemo(() => {
    return discussions.filter((d) => {
      if (activeCategory === 'policy_brief' && !d.is_policy_brief) return false;
      if (activeCategory === 'collaborators' && !d.seeking_collaborators) return false;
      if (activeCategory === 'policy_law' && !d.topics?.some((t: string) => t.toLowerCase().includes('პოლიტიკ') || t.toLowerCase().includes('კანონ'))) return false;
      if (activeCategory === 'finance_drg' && !d.topics?.some((t: string) => t.toLowerCase().includes('დაფინანსებ') || t.toLowerCase().includes('drg') || t.toLowerCase().includes('ეკონომიკ'))) return false;
      if (activeCategory === 'public_health' && !d.topics?.some((t: string) => t.toLowerCase().includes('საზოგადოებრივ') || t.toLowerCase().includes('who') || t.toLowerCase().includes('პრევენცი'))) return false;
      if (activeCategory === 'hospital_mgmt' && !d.topics?.some((t: string) => t.toLowerCase().includes('ჰოსპიტალ') || t.toLowerCase().includes('მენეჯმენტ') || t.toLowerCase().includes('მართვ') || t.toLowerCase().includes('აკრედიტაცი'))) return false;
      if (activeCategory === 'primary_care' && !d.topics?.some((t: string) => t.toLowerCase().includes('პირველად') || t.toLowerCase().includes('ამბულატორი'))) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const titleMatch = d.title?.toLowerCase().includes(q);
      const contentMatch = d.content?.toLowerCase().includes(q);
      const authorMatch = d.author?.full_name?.toLowerCase().includes(q);
      const topicMatch = d.topics?.some((t: string) => t.toLowerCase().includes(q));

      return titleMatch || contentMatch || authorMatch || topicMatch;
    });
  }, [discussions, activeCategory, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Hero Think Tank Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-navy-950 to-slate-900 border border-slate-800 p-8 sm:p-10 shadow-2xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              ჯანდაცვის პოლიტიკისა და მართვის Think Tank
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              სისტემური დიალოგი & რეფორმები
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              მტკიცებულებებზე დაფუძნებული საპოლიტიკო ბრიფები, ჯანდაცვის დაფინანსების ანალიზი, საზოგადოებრივი ჯანმრთელობის სტრატეგიები და პროფესიული თანამშრომლობა.
            </p>
          </div>

          <Link
            href="/discussions/new"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:opacity-95 text-white font-extrabold text-xs sm:text-sm px-5 py-3.5 rounded-2xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ახალი თემა / Policy Brief</span>
          </Link>
        </div>
      </div>

      {/* Search & Category Filter Section */}
      <div className="space-y-4 bg-white dark:bg-navy-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-cyan-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="მოძებნეთ თემა, საკვანძო სიტყვა, ავტორი ან საპოლიტიკო საკითხი..."
            className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {POLICY_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                    : 'bg-slate-100 dark:bg-navy-950 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Discussions Feed */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          <p className="text-xs font-semibold">იტვირთება დისკუსიები...</p>
        </div>
      ) : filteredDiscussions.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 p-6">
          <FileText className="w-12 h-12 mx-auto text-slate-400 opacity-50" />
          <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-200">
            თემა ვერ მოიძებნა
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            სცადეთ სხვა საძიებო სიტყვა ან შეცვალეთ კატეგორიის ფილტრი.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDiscussions.map((d) => {
            const commentsCount = d.comments?.[0]?.count || 0;

            return (
              <article
                key={d.id}
                className="group relative bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-200 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => d.author && setSelectedAuthor(d.author)}
                    className="flex items-center gap-3 text-left group/author cursor-pointer"
                    title="დააჭირეთ კოლეგის სანახავად / დასამატებლად"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 p-[2px] shadow-xs group-hover/author:scale-105 transition-transform shrink-0">
                      <div className="w-full h-full bg-white dark:bg-navy-950 rounded-[14px] flex items-center justify-center font-black text-sm text-cyan-600 dark:text-cyan-400">
                        {d.author?.full_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover/author:text-cyan-500 transition-colors">
                          {d.author?.full_name}
                        </span>
                        {d.author?.verified_badge && (
                          <span title="ვერიფიცირებული ექსპერტი">
                            <ShieldCheck className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium truncate max-w-[200px] sm:max-w-none">
                        {d.author?.profession || 'ჯანდაცვის მკვლევარი'}
                        {d.author?.workplace ? ` • ${d.author.workplace}` : ''}
                      </p>
                    </div>
                  </button>

                  <span className="text-xs text-slate-400 font-semibold shrink-0">
                    {formatRelativeTime(d.created_at)}
                  </span>
                </div>

                <div className="space-y-2">
                  <Link href={`/discussions/${d.id}`} className="block group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                      {d.title}
                    </h2>
                  </Link>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed font-normal">
                    {d.is_policy_brief ? (d.policy_problem || d.content) : d.content}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {d.is_policy_brief && (
                    <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> Policy Brief
                    </span>
                  )}

                  {d.seeking_collaborators && (
                    <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1.5">
                      <Users className="w-3 h-3" /> თანამშრომლობა
                    </span>
                  )}

                  {d.topics?.map((t: string) => (
                    <span
                      key={t}
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-navy-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-slate-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-500" />
                      {commentsCount} პასუხი
                    </span>

                    {d.doi_or_link && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
                        <LinkIcon className="w-3 h-3 text-teal-500" />
                        სამეცნიერო რესურსი
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/discussions/${d.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform"
                  >
                    <span>განხილვა</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <UserCardModal
        isOpen={!!selectedAuthor}
        onClose={() => setSelectedAuthor(null)}
        user={selectedAuthor}
      />
    </div>
  );
}
