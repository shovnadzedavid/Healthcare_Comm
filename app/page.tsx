'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  MessageSquare, 
  BookOpen, 
  Plus, 
  FileText, 
  Users,
  CheckCircle
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Feed data
  const [topDiscussions, setTopDiscussions] = useState<any[]>([]);
  const [topBlogs, setTopBlogs] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  // Auth states (თუ მომხმარებელი არ არის შესული)
  const [isLogin, setIsLogin] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [profession, setProfession] = useState('საზოგადოებრივი ჯანდაცვა');
  const [workplace, setWorkplace] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoadingUser(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    loadData();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadData = async () => {
    setLoadingFeed(true);
    try {
      const [discRes, blogRes] = await Promise.all([
        supabase
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
          .order('created_at', { ascending: false })
          .limit(5),
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
          .limit(5)
      ]);

      if (discRes.data) setTopDiscussions(discRes.data);
      if (blogRes.data) setTopBlogs(blogRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFeed(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'linkedin_oidc') => {
    try {
      setSocialLoading(provider);
      setErrorMsg('');
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'ავტორიზაცია ვერ მოხერხდა');
      setSocialLoading(null);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setAuthLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        router.refresh();
      } else {
        if (password !== confirmPassword) {
          throw new Error('პაროლები არ ემთხვევა ერთმანეთს');
        }
        if (!birthDate) {
          throw new Error('მიუთითეთ დაბადების თარიღი');
        }
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              username: username.trim(),
              full_name: fullName.trim(),
              birth_date: birthDate,
              profession,
              workplace: workplace.trim(),
            },
          },
        });
        if (error) throw error;
        setSuccessMsg('რეგისტრაცია წარმატებით დასრულდა! შეამოწმეთ ელ-ფოსტა ან შედით სისტემაში.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'დაფიქსირდა შეცდომა');
    } finally {
      setAuthLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-slate-500 dark:text-slate-400 font-medium text-xs tracking-wider animate-pulse">
          მონაცემები იტვირთება...
        </div>
      </div>
    );
  }

  // VIEW 1: AUTH VIEW (თუ მომხმარებელი არ არის შესული)
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-2xl p-7 sm:p-9 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center font-bold text-base tracking-tighter mb-2 shadow-xs">
              HC
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Healthcare<span className="text-indigo-600 dark:text-indigo-400 font-medium">Comm</span>
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              დახურული სივრცე ჯანდაცვის სფეროს სპეციალისტებისთვის
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={!!socialLoading || authLoading}
              className="w-full py-2.5 px-4 bg-white dark:bg-[#141a29] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <span>{socialLoading === 'google' ? 'მიმდინარეობს ავტორიზაცია...' : 'Google-ით ავტორიზაცია'}</span>
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ელ-ფოსტა *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@health.ge"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#141a29] border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                პაროლი *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#141a29] border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-semibold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {authLoading ? (
                <span className="animate-pulse">მიმდინარეობს დამუშავება...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  შესვლა
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // VIEW 2: FEED VIEW (ავტორიზებული მომხმარებლისთვის)
  return (
    <div className="space-y-8">
      {/* 1. Banner / Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl space-y-2.5">
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            პ
