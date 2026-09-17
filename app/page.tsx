'use client';
import { useState, useEffect } from 'react';
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

        const { data, error } = await supabase.auth.signUp({
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

  // ==========================================
  // VIEW 1: AUTH VIEW (თუ არ არის შესული)
  // ==========================================
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

          {/* Social OAuth Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={!!socialLoading || authLoading}
              className="w-full py-2.5 px-4 bg-white dark:bg-[#141a29] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span>{socialLoading === 'google' ? 'მიმდინარეობს ავტორიზაცია...' : 'Google-ით ავტორიზაცია'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuthLogin('linkedin_oidc')}
              disabled={!!socialLoading || authLoading}
              className="w-full py-2.5 px-4 bg-[#0A66C2] hover:bg-[#004182] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.63 1.63 0 1 0 0-3.25 1.63 1.63 0 0 0 0 3.25m1.39 9.74V9.95H5.07v8.55h2.78z" />
              </svg>
              <span>{socialLoading === 'linkedin_oidc' ? 'მიმდინარეობს ავტორიზაცია...' : 'LinkedIn-ით ავტორიზაცია'}</span>
            </button>

            <div className="relative flex items-center justify-center my-3">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              <span className="absolute bg-white dark:bg-[#0d121f] px-3 text-[11px] text-slate-400 font-medium">
                ან ელექტრონული ფოსტით
              </span>
            </div>
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
                    placeholder="მაგ. გიორგი ბერიძე"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#141a29] border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400 text-slate-900 dark:text-white"
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
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#141a29] border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    დაბადების თარიღი *
                  </label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#141a29] border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    მიმართულება / სპეციალობა *
                  </label>
                  <select
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#141a29] border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400 text-slate-900 dark:text-white"
                  >
                    <option value="საზოგადოებრივი ჯანდაცვა">საზოგადოებრივი ჯანდაცვა</option>
                    <option value="ჯანდაცვის პოლიტიკა">ჯანდაცვის პოლიტიკა</option>
                    <option value="ჯანდაცვის მენეჯმენტი">ჯანდაცვის მენეჯმენტი</option>
                    <option value="ეპიდემიოლოგია და ბიოსტატისტიკა">ეპიდემიოლოგია და ბიოსტატისტიკა</option>
                    <option value="კვლევა და ანალიტიკა">კვლევა და ანალიტიკა</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    სამუშაო ადგილი / ორგანიზაცია
                  </label>
                  <input
                    type="text"
                    value={workplace}
                    onChange={(e) => setWorkplace(e.target.value)}
                    placeholder="მაგ. უნივერსიტეტი, კლინიკა, კვლევითი ცენტრი"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#141a29] border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400 text-slate-900 dark:text-white"
                  />
                </div>
              </>
            )}

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

            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  პაროლის დადასტურება *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#141a29] border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400 text-slate-900 dark:text-white"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-semibold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {authLoading ? (
                <span className="animate-pulse">მიმდინარეობს დამუშავება...</span>
              ) : isLogin ? (
                <>
                  <LogIn className="w-4 h-4" />
                  შესვლა
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  რეგისტრაციის დასრულება
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            {isLogin ? (
              <button
                type="button"
                onClick={() => { setIsLogin(false); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                არ გაქვთ ანგარიში? <span className="font-semibold text-indigo-600 dark:text-indigo-400">გაიარეთ რეგისტრაცია</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setIsLogin(true); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                უკვე გაქვთ ანგარიში? <span className="font-semibold text-indigo-600 dark:text-indigo-400">ავტორიზაცია</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ORIGINAL 2-COLUMN STRUCTURE (MAIN HUB)
  // ==========================================
  return (
    <div className="space-y-8">
      {/* 1. Banner / Welcome (Original Structure) */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl space-y-2.5">
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            პროფესიული სივრცე
          </span>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Healthcare<span className="text-indigo-600 dark:text-indigo-400 font-medium">Comm</span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
            დახურული ქომუნითი ჯანდაცვის პოლიტიკის, მენეჯმენტის, ეპიდემიოლოგიისა და კვლევების სპეციალისტებისთვის. გაუზიარეთ მიგნებები და ითანამშრომლეთ კოლეგებთან.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/discussions/new"
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              + გახსენით დისკუსია
            </Link>
            <Link
              href="/blog/new"
              className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-[#141a29] hover:bg-slate-200 dark:hover:bg-[#1a2236] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              + გამოაქვეყნეთ ბლოგი
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Grid: Top Discussions & Top Blogs (Original Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* სვეტი 1: ტოპ-5 აქტიური დისკუსია */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                ტოპ-5 აქტიური დისკუსია
              </h2>
            </div>
            <Link
              href="/discussions"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              ყველა დისკუსია <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {loadingFeed ? (
              <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
                იტვირთება...
              </div>
            ) : topDiscussions.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#0d121f] rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                დისკუსიები ჯერ არ არის. იყავით პირველი, ვინც წამოიწყებს თემას!
              </div>
            ) : (
              topDiscussions.map((item) => (
                <Link
                  key={item.id}
                  href={`/discussions/${item.id}`}
                  className="block p-5 bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800/80 hover:border-slate-400 dark:hover:border-slate-600 rounded-2xl transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs group"
                >
                  <div className="flex items-center gap-2 mb-2 text-xs">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {item.author?.full_name || 'მომხმარებელი'}
                    </span>
                    {item.author?.verified_badge && (
                      <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 dark:text-slate-400">{item.author?.profession || 'ჯანდაცვა'}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mb-2">
                    {item.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    {item.topics?.map((topic: string) => (
                      <span
                        key={topic}
                        className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300"
                      >
                        {topic}
                      </span>
                    ))}

                    {item.is_policy_brief && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Policy Brief
                      </span>
                    )}

                    {item.seeking_collaborators && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
                        <Users className="w-3 h-3" /> თანამშრომლობა
                      </span>
                    )}

                    <div className="ml-auto text-xs text-რომლობა
                      </span>
                    )}

                    <div className="ml-auto text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {item.comments?.[0]?.count || 0} პასუხი
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* სვეტი 2: ტოპ-5 ბლოგ-პოსტი & ანალიტიკა */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                ტოპ-5 ბლოგ-პოსტი & ანალიტიკა
              </h2>
            </div>
            <Link
              href="/blog"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              ყველა ბლოგი <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {loadingFeed ? (
              <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
                იტვირთება...
              </div>
            ) : topBlogs.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#0d121f] rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                ბლოგ-სტატიები ჯერ არ არის. გაუზიარეთ თქვენი ანალიტიკური სტატია კოლეგებს!
              </div>
            ) : (
              topBlogs.map((item) => (
                <Link
                  key={item.id}
                  href={`/blog/${item.id}`}
                  className="block p-5 bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800/80 hover:border-slate-400 dark:hover:border-slate-600 rounded-2xl transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs group"
                >
                  <div className="flex items-center gap-2 mb-2 text-xs">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {item.author?.full_name || 'ავტორი'}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 dark:text-slate-400">{item.author?.profession || 'სპეციალისტი'}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2 mb-2">
                    {item.title}
                  </h3>

                  <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span>{new Date(item.created_at).toLocaleDateString('ka-GE')}</span>
                    <div className="flex items-center gap-1 font-medium">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {item.comments?.[0]?.count || 0} კომენტარი
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
