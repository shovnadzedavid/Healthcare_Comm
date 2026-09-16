'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MessageSquare, CheckCircle, Send } from 'lucide-react';

export default function BlogDetailPage() {
  const { id } = useParams();
  const [blog, setBlog] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    supabase
      .from('blog_posts')
      .select('*, author:profiles(full_name, profession, verified_badge)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setBlog(data);
        setLoading(false);
      });
    fetchComments();
  }, [id]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('blog_comments')
      .select('*, author:profiles(full_name, profession, verified_badge)')
      .eq('blog_id', id)
      .order('created_at', { ascending: true });
    if (data) setComments(data);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    await supabase.from('blog_comments').insert({
      blog_id: id,
      author_id: user.id,
      content: newComment.trim(),
    });
    setNewComment('');
    fetchComments();
  };

  if (loading) return <div className="py-12 text-center text-slate-500 animate-pulse">იტვირთება...</div>;
  if (!blog) return <div className="py-12 text-center text-slate-500">სტატია ვერ მოიძებნა.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white">
        <ArrowLeft className="w-4 h-4" /> ყველა სტატია
      </Link>

      <article className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center font-bold">
            {blog.author?.full_name?.[0] || 'B'}
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 dark:text-white">
              <span>{blog.author?.full_name}</span>
              {blog.author?.verified_badge && <CheckCircle className="w-3.5 h-3.5 text-teal-500" />}
            </div>
            <p className="text-xs text-slate-500">{blog.author?.profession}</p>
          </div>
          <span className="text-xs text-slate-400 ml-auto">
            {new Date(blog.created_at).toLocaleDateString('ka-GE')}
          </span>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
          {blog.title}
        </h1>

        <div className="text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
          {blog.content}
        </div>
      </article>

      {/* Comments */}
      <section className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-teal-500" />
          კომენტარები ({comments.length})
        </h3>

        <form onSubmit={handleAddComment} className="space-y-2">
          <textarea
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user ? "დატოვეთ კომენტარი..." : "გაიარეთ ავტორიზაცია კომენტარისთვის..."}
            disabled={!user}
            className="w-full p-3 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white disabled:opacity-50"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!user || !newComment.trim()}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" /> გაგზავნა
            </button>
          </div>
        </form>

        <div className="space-y-3 pt-2">
          {comments.map((c) => (
            <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="flex justify-between font-semibold text-slate-900 dark:text-white">
                <span>{c.author?.full_name}</span>
                <span className="text-slate-400 font-normal">{new Date(c.created_at).toLocaleDateString('ka-GE')}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-sm">{c.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
