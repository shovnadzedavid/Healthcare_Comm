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
  Send
} from 'lucide-react';

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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
    fetchDiscussion();
    fetchComments();
  }, [id]);

  const fetchDiscussion = async () => {
    const { data, error } = await supabase
      .from('discussions')
      .select(`
        *,
        author:profiles(id, full_name, profession, workplace, verified_badge)
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
        author:profiles(id, full_name, profession, workplace, verified_badge)
      `)
      .eq('discussion_id', id)
      .order('created_at', { ascending: true });

    if (data) setComments(data);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth');
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    const { error } = await supabase
      .from('discussion_comments')
      .insert({
        discussion_id: id,
        author_id: user.id,
        content: newComment.trim(),
      });

    setSubmitting(false);
    if (!error) {
      setNewComment('');
      fetchComments();
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
      <Link
        href="/discussions"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> ყველა დისკუსია
      </Link>

      <article className="bg-white dark:bg-navy-900 border border-slate-300 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-lg space-y-6">
        {/* Author Header — Clickable */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => discussion.author && setSelectedAuthor(discussion.author)}
            className="flex items-center gap-3.5 text-left group cursor-pointer hover:opacity-90 transition-opacity"
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
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {discussion.author?.profession} {discussion.author?.workplace ? `• ${discussion.author.workplace}` : ''}
              </p>
            </div>
          </button>

          <span className="text-xs text-slate-400 font-semibold">
            {new Date(discussion.created_at).toLocaleDateString('ka-GE')}
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

      <section className="bg-white dark:bg-navy-900 border border-slate-300 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-lg space-y-6">
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
            className="w-full p-4 text-sm sm:text-base bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white font-medium disabled:opacity-50 shadow-sm"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!user || !newComment.trim() || submitting}
              className="px-6 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-cyan-600/20 disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
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
            comments.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  {/* Clickable Comment Author */}
                  <button
                    type="button"
                    onClick={() => c.author && setSelectedAuthor(c.author)}
                    className="flex items-center gap-2 font-bold text-slate-900 dark:text-white hover:text-cyan-500 transition-colors text-left cursor-pointer"
                    title="დააჭირეთ ავტორის სანახავად / დასამატებლად"
                  >
                    <span>{c.author?.full_name}</span>
                    {c.author?.verified_badge && <CheckCircle className="w-3.5 h-3.5 text-cyan-500" />}
                    <span className="text-slate-400 font-normal">• {c.author?.profession}</span>
                  </button>

                  <span className="text-slate-400 text-xs">
                    {new Date(c.created_at).toLocaleDateString('ka-GE')}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                  {c.content}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Author Profile Quick Action Modal */}
      <UserCardModal
        isOpen={!!selectedAuthor}
        onClose={() => setSelectedAuthor(null)}
        user={selectedAuthor}
      />
    </div>
  );
}
