'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { MessageSquare, PlusCircle, Search, Filter, CheckCircle, FileText, Users } from 'lucide-react';

const TOPICS = [
  'ყველა',
  'საზოგადოებრივი ჯანდაცვა',
  'ჯანდაცვის პოლიტიკა',
  'ჯანდაცვის მენეჯმენტი',
  'ეპიდემიოლოგია და ბიოსტატისტიკა',
  'კვლევა',
];

export default function DiscussionsPage() {
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('ყველა');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscussions();
  }, [selectedTopic]);

  const fetchDiscussions = async () => {
    setLoading(true);
    let query = supabase
      .from('discussions')
      .select(`
        id,
        title,
        content,
        topics,
        is_policy_brief,
        seeking_collaborators,
        created_at,
        author:profiles(full_name, profession, verified_badge),
        comments:discussion_comments(count)
      `)
      .order('created_at', { ascending: false });

    if (selectedTopic !== 'ყველა') {
      query = query.contains('topics', [selectedTopic]);
    }

    const { data, error } = await query;
    if (!error && data) {
      setDiscussions(data);
    }
    setLoading(false);
  };

  const filteredDiscussions = discussions.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            პროფესიული დისკუსიები
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            განიხილეთ საზოგადოებრივი ჯანდაცვის, პოლიტიკისა და კვლევების აქტუალური საკითხები
          </p>
        </div>
        <Link
          href="/discussions/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          თემის წამოწყება
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="მოძებნეთ დისკუსია სათაურით ან შინაარსით..."
            className="w-full text-sm bg-transparent text-slate-900 dark:text-white focus:outline-none placeholder-slate-400"
          />
        </div>

        {/* Topic Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`text-xs px-3.5 py-1.5 rounded-full border transition-all whitespace-nowrap font-medium ${
                selectedTopic === topic
                  ? 'bg-cyan-600 text-white border-cyan-600 dark:bg-cyan-500 dark:text-slate-950 dark:border-cyan-500 shadow-sm'
                  : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Discussion List */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm animate-pulse">
          იტვირთება დისკუსიები...
        </div>
      ) : filteredDiscussions.length === 0 ? (
        <div className="py-12 text-center bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 text-sm">
          არჩეული ფილტრით დისკუსიები ვერ მოიძებნა.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDiscussions.map((item) => (
            <Link
              key={item.id}
              href={`/discussions/${item.id}`}
              className="block p-6 bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500/50 rounded-2xl transition-all shadow-sm hover:shadow-md group"
            >
              <div className="flex items-center gap-2 mb-2 text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {item.author?.full_name || 'ანონიმური'}
                </span>
                {item.author?.verified_badge && (
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-500" />
                )}
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">{item.author?.profession}</span>
                <span className="text-slate-400 ml-auto">
                  {new Date(item.created_at).toLocaleDateString('ka-GE')}
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors mb-2">
                {item.title}
              </h2>

              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                {item.content}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                {item.topics?.map((topic: string) => (
                  <span
                    key={topic}
                    className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    {topic}
                  </span>
                ))}

                {item.is_policy_brief && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Policy Brief
                  </span>
                )}

                {item.seeking_collaborators && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <Users className="w-3 h-3" /> თანამშრომლობა
                  </span>
                )}

                <div className="ml-auto text-xs text-slate-400 flex items-center gap-1 font-medium">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {item.comments?.[0]?.count || 0} გამოხმაურება
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
