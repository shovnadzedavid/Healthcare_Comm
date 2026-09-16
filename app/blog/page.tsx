'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BookOpen, PlusCircle, CheckCircle, MessageSquare } from 'lucide-react';

export default function BlogListPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        content,
        created_at,
        author:profiles(full_name, profession, verified_badge),
        comments:blog_comments(count)
      `)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setBlogs(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            ბლოგი და აკადემიური ანალიტიკა
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            სტატიები, მოსაზრებები და სიახლეები ჯანდაცვის სფეროში
          </p>
        </div>
        <Link
          href="/blog/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-500/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          სტატიის გამოქვეყნება
        </Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 animate-pulse">იტვირთება...</div>
      ) : blogs.length === 0 ? (
        <div className="py-12 text-center bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 text-sm">
          სტატიები ჯერ არ არის გამოქვეყნებული.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogs.map((b) => (
            <Link
              key={b.id}
              href={`/blog/${b.id}`}
              className="p-6 bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500/50 rounded-2xl transition-all shadow-sm hover:shadow-md flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-200">
                    {b.author?.full_name}
                  </span>
                  {b.author?.verified_badge && <CheckCircle className="w-3.5 h-3.5 text-teal-500" />}
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">{b.author?.profession}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-500 transition-colors line-clamp-2">
                  {b.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {b.content}
                </p>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <span>{new Date(b.created_at).toLocaleDateString('ka-GE')}</span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {b.comments?.[0]?.count || 0} კომენტარი
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
