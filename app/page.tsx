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
  CheckCircle,
  Video,
  Sparkles,
  TrendingUp,
  Award,
  Search,
  Filter,
  ShieldCheck,
  Calendar
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Feed data
  const [topDiscussions, setTopDiscussions] = useState<any[]>([]);
  const [topBlogs, setTopBlogs] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string>('ყველა');

  // Auth states
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
          .limit(8),
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
          .limit(8)
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-xs tracking-wider">
          სისტემა იტვირთება...
        </p>
      </div>
    );
  }

  // ==============================================================
  // VIEW 1: EDITORIAL SPLIT-SCREEN AUTH VIEW (თუ არ არის შესული)
  // ==============================================================
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center py-6 sm:py-12">
        <div className="w-full max-w-5xl bg-white dark:bg-[#0f172a] border border-stone-200/90 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* მარცხენა სვეტი: აკადემიური პრეზენტაცია (Canva Editorial Style) */}
          <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-indigo-200 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                პროფესიული დახურული ქსელი
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                  Healthcare<span className="text-indigo-400 font-normal">Comm</span>
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  საქართველოს ჯანდაცვის მენეჯმენტის, პოლიტიკის, ეკონომიკისა და საზოგადოებრივი ჯანდაცვის პროფესიული აკადემიური სივრცე.
                </p>
              </div>

              {/* 3 ძირითადი ღირებულება */}
              <div className="space-y-4 pt-4 border-t border-white/10 text-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/10 text-indigo-300 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Policy Briefs & ანალიტიკა</h3>
                    <p className="text-slate-300">მტკიცებულებებზე დაფუძნებული პოლიტიკის დოკუმენტები და სტრატეგიული მიმოხილვები.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/10 text-indigo-300 shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">DRG და ჰოსპიტალური ეკონომიკა</h3>
                    <p className="text-slate-300">პრაქტიკული გამოცდილების გაცვლა ტარიფებზე, კოდირებასა და დაფინანსების მოდელებზე.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/10 text-indigo-300 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">სამეცნიერო თანამშრომლობა</h3>
                    <p className="text-slate-300">საერთაშორისო გრანტები, თანაავტორობა და კვლევითი პარტნიორობა.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 text-xs text-slate-400 border-t border-white/10 flex items-center justify-between">
              <span>აკადემიური სანდოობა</span>
              <span>ვერიფიცირებული წევრები</span>
            </div>
          </div>

          {/* მარჯვენა სვეტი: ავტორიზაციის & რეგისტრაციის ფორმა */}
          <div className="lg:col-span-6 p-7 sm:p-10 flex flex-col justify-center bg-white dark:bg-[#0d121f]">
            <div className="max-w-md w-full mx-auto space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {isLogin ? 'სისტემაში შესვლა' : 'რეგისტრაცია'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isLogin ? 'გაიარეთ ავტორიზაცია თქვენი ანგარიშით' : 'შეუერთდით პროფესიულ საზოგადოებას'}
                  </p>
                </div>
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => { setIsLogin(true); setErrorMsg(''); }}
                    className={`px-3 py-1.5 rounded-lg transition-all ${isLogin ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-500'}`}
                  >
                    შესვლა
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsLogin(false); setErrorMsg(''); }}
                    className={`px-3 py-1.5 rounded-lg transition-all ${!isLogin ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-500'}`}
                  >
                    რეგისტრაცია
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* OAuth სოციალური ღილაკები */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={!!socialLoading || authLoading}
                  className="py-2.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthLogin('linkedin_oidc')}
                  disabled={!!socialLoading || authLoading}
                  className="py-2.5 px-3 bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-semibold rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.63 1.63 0 1 0 0-3.25 1.63 1.63 0 0 0 0 3.25m1.39 9.74V9.95H5.07v8.55h2.78z" />
                  </svg>
                  <span>LinkedIn</span>
                </button>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                <span className="absolute bg-white dark:bg-[#0d121f] px-3 text-[11px] text-slate-400 font-medium">
                  ან ელ-ფოსტით
                </span>
              </div>

              <form onSubmit={handleAuth} className="space-y-3.5">
                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        სახელი და გვარი *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="გიორგი ბერიძე"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        მომხმარებლის სახელი (Username) *
                      </label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="giorgi_beridze"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          დაბადების თარიღი *
                        </label>
                        <input
                          type="date"
                          required
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          სპეციალობა *
                        </label>
                        <select
                          value={profession}
                          onChange={(e) => setProfession(e.target.value)}
                          className="w-full px-2 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 dark:text-white"
                        >
                          <option value="საზოგადოებრივი ჯანდაცვა">საზოგადოებრივი ჯანდაცვა</option>
                          <option value="ჯანდაცვის პოლიტიკა">ჯანდაცვის პოლიტიკა</option>
                          <option value="ჯანდაცვის მენეჯმენტი">ჯანდაცვის მენეჯმენტი</option>
                          <option value="ეპიდემიოლოგია და ბიოსტატისტიკა">ეპიდემიოლოგია / ბიოსტატი</option>
                          <option value="კვლევა და ანალიტიკ
