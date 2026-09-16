'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ReactionsBar from '@/components/ReactionsBar';
import UserCardModal from '@/components/UserCardModal';
import { 
  ArrowLeft, 
  MessageSquare, 
  CheckCircle, 
  FileText, 
  Users, 
  Link as LinkIcon,
  Send,
  Share2,
  Check,
  Reply
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

export default function DiscussionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [discussion, setDiscussion] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });
    fetchDiscussion();
    fetchComments();
  }, [id]);

  const fetchDiscussion = async () => {
    const { data, error } = await supabase
      .from('discussions')
      .select(`
        *,
        author:profiles(id, full_name, profession, workplace, verified_badge, bio)
      `)
      .eq('id', id)
      .single();

    if (!error && data) {
      setDiscussion(data);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('discussion_comments')
      .select(`
        id,
        content,
        created_at,
        author:profiles(id, full_name, profession, workplace, verified_badge, bio)
      `)
      .eq('discussion_id', id)
      .order('created_at', { ascending: true });

    if (data) setComments(data);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth');
      return;
    }
    if (!newComment.trim()) return;

    const commentText = newComment.trim();
    setNewComment('');
    setSubmitting(true);

    const optimisticComment = {
      id: `temp-${Date.now()}`,
      content: commentText,
      created_at: new Date().toISOString(),
      author: {
        id: user.id,
        full_name: user.user_metadata?.full_name || 'მე',
        profession: user.user_metadata?.profession || '',
        workplace: user.user_metadata?.workplace || '',
        verified_badge: false,
      },
    };
    setComments((prev) => [...prev, optimisticComment]);

    const { data, error } = await supabase
      .from('discussion_comments')
      .insert({
        discussion_id: id,
        author_id: user.id,
        content: commentText,
      })
      .select(`
        id,
        content,
        created_at,
        author:profiles(id, full_name, profession, workplace, verified_badge, bio)
      `)
      .single();

    setSubmitting(false);

    if (error) {
      console.error('Error adding comment:', error);
      setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id));
      setNewComment(commentText);
    } else if (data) {
      setComments((prev) => prev.map((c) => (c.id === optimisticComment.id ? data : c)));

      if (discussion?.author?.id && discussion.author.id !== user.id) {
        try {
          const myName = user.user_metadata?.full_name || 'კოლეგამ';
          await supabase.from('notifications').insert({
            user_id: discussion.author.id,
            content: `${myName} დააკომენტარა თქვენს დისკუსიაზე: "${discussion.title.slice(0, 30)}..."`,
            is_read: false,
          });
        } catch (notifErr) {
          console.error('Notification error:', notifErr);
        }
      }
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-500 animate-pulse font-semibold">იტვირთება...</div>;
  }

  if (!discussion) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-slate-500">დისკუსია ვერ მოიძებნა.</p>
        <Link href="/discussions" className="text-cyan-500 text-sm hover:underline font-bold">უკან დაბრუნება</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/discussions"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> ყველა დისკუსია
        </Link>

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 shadow-xs transition-all cursor-pointer active:scale-95"
          title="ბმულის კოპირება"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-cyan-500" />}
          <span>{copied ? 'ბმული დაკოპირდა!' : 'გაზიარება'}</span>
        </button>
      </div>

      <article className="bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-lg space-y-6">
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => discussion.author && setSelectedAuthor(discussion.author)}
            className="flex items-center gap-3.5 text-left group cursor-pointer hover:opacity-95 transition-opacity"
            title="დააჭირეთ ავტორის სანახავად / დასამატებლად"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 p-[2px] shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full bg-white dark:bg-navy-950 rounded-[14px] flex items-center justify-center font-black text-lg text-cyan-600 dark:text-cyan-400">
                {discussion.author?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors">
                  {discussion.author?.full_name}
                </span>
                {discussion.author?.verified_badge && (
                  <CheckCircle className="w-4 h-4 text-cyan-500" />
                )}
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/20">
                  ავტორი
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {discussion.author?.profession} {discussion.author?.workplace ? `• ${discussion.author.workplace}` : ''}
              </p>
            </div>
          </button>

          <span className="text-xs text-slate-400 font-semibold">
            {formatRelativeTime(discussion.created_at)}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-snug">
          {discussion.title}
        </h1>

        <div className="flex flex-wrap gap-2">
          {discussion.topics?.map((topic: string) => (
            <span
              key={topic}
              className="text-xs font-extrabold px-3.5 py-1 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30"
            >
              {topic}
            </span>
          ))}

          {discussion.is_policy_brief && (
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-500/30 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Policy Brief
            </span>
          )}

          {discussion.seeking_collaborators && (
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> თანამშრომლობა
            </span>
          )}
        </div>

        {discussion.is_policy_brief ? (
          <div className="space-y-4 pt-2">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1.5">
                1. პრობლემა & კონტექსტი
              </h3>
              <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                {discussion.policy_problem || discussion.content}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1.5">
                2. მტკიცებულებები & კვლევა
              </h3>
              <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                {discussion.policy_evidence}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1.5">
                3. რეკომენდაციები
              </h3>
              <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                {discussion.policy_recommendations}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-base sm:text-lg text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap pt-2 font-normal">
            {discussion.content}
          </div>
        )}

        {discussion.doi_or_link && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 text-xs sm:text-sm">
            <LinkIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="text-slate-500 font-semibold">სამეცნიერო რესურსი:</span>
            <a
              href={discussion.doi_or_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline truncate"
            >
              {discussion.doi_or_link}
            </a>
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            პროფესიული რეაქციები:
          </span>
          <ReactionsBar targetId={discussion.id} targetType="discussion" />
        </div>
      </article>

      <section className="bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-lg space-y-6">
        <div className="flex items-center gap-2.5 text-lg font-black text-slate-900 dark:text-white">
          <MessageSquare className="w-5 h-5 text-cyan-500" />
          <span>გამოხმაურებები ({comments.length})</span>
        </div>

        <form onSubmit={handleAddComment} className="space-y-3">
          <textarea
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user ? "გამოხატეთ თქვენი პროფესიული მოსაზრება..." : "გაიარეთ ავტორიზაცია პასუხის დასატოვებლად..."}
            disabled={!user || submitting}
            className="w-full p-4 text-sm sm:text-base bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-slate-900 dark:text-white font-medium disabled:opacity-50 shadow-xs placeholder-slate-400 transition-all"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!user || !newComment.trim() || submitting}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:opacity-95 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-cyan-600/20 disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'იგზავნება...' : 'პასუხი'}
            </button>
          </div>
        </form>

        <div className="space-y-4 pt-2">
          {comments.length === 0 ? (
            <p className="text-center text-xs sm:text-sm text-slate-400 py-6 font-medium">
              ჯერ არ არის კომენტარები. დააფიქსირეთ თქვენი პოზიცია პირველმა!
            </p>
          ) : (
            comments.map((c) => {
              const isAuthor = discussion.author?.id && c.author?.id === discussion.author.id;

              return (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-slate-50/70 dark:bg-navy-950/60 border border-slate-200/90 dark:border-slate-800/80 space-y-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-700/80"
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <button
                      type="button"
                      onClick={() => c.author && setSelectedAuthor(c.author)}
                      className="flex items-center gap-2 font-bold text-slate-900 dark:text-white hover:text-cyan-500 transition-colors text-left cursor-pointer"
                      title="დააჭირეთ ავტორის სანახავად / დასამატებლად"
                    >
                      <span>{c.author?.full_name}</span>
                      {c.author?.verified_badge && <CheckCircle className="w-3.5 h-3.5 text-cyan-500" />}
                      {isAuthor && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
                          ავტორი
                        </span>
                      )}
                      <span className="text-slate-400 font-normal hidden sm:inline">• {c.author?.profession}</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-xs">
                        {formatRelativeTime(c.created_at)}
                      </span>
                      {user && (
                        <button
                          type="button"
                          onClick={() => {
                            const mention = `@${c.author?.full_name || 'კოლეგა'} `;
                            setNewComment((prev) => (prev.startsWith(mention) ? prev : mention + prev));
                          }}
                          className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                        >
                          <Reply className="w-3 h-3" />
                          <span>პასუხი</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                    {c.content}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>

      <UserCardModal
        isOpen={!!selectedAuthor}
        onClose={() => setSelectedAuthor(null)}
        user={selectedAuthor}
      />
    </div>
  );
}
