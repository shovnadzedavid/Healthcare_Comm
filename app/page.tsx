'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  MessageSquare, 
  BookOpen, 
  Flame, 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  Users, 
  FileText,
  Shield,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Briefcase
} from 'lucide-react';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Auth Gate states (when not logged in)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authBirthDate, setAuthBirthDate] = useState('');
  const [authProfession, setAuthProfession] = useState('საზოგადოებრივი ჯანდაცვა');
  const [authWorkplace, setAuthWorkplace] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Feed Data (when logged in)
  const [topDiscussions, setTopDiscussions] = useState<any[]>([]);
  const [topBlogs, setTopBlogs] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoadingUser(false);
      if (data.user) {
        fetchFeed();
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchFeed();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchFeed = async () => {
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
        .limit(5),
    ]);

    if (discRes.data) setTopDiscussions(discRes.data);
    if (blogRes.data) setTopBlogs(blogRes.data);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
      } else {
        if (authPassword !== authConfirmPassword) {
          throw new Error('პაროლები არ ემთხვევა ერთმანეთს');
        }
        if (!authBirthDate) {
          throw new Error('მიუთითეთ დაბადების თარიღი');
        }

        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              username: authUsername,
              full_name: authFullName,
              birth_date: authBirthDate,
              profession: authProfession,
              workplace: authWorkplace,
            },
          },
        });
        if (error) throw error;

        if (data.session) {
          setUser(data.session.user);
        } else {
          setAuthSuccess('რეგისტრაცია წარმატებით დასრულდა! ახლა გაიარეთ ავტორიზაცია.');
          setAuthMode('login');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'დაფიქსირდა შეცდომა');
    } finally {
      setAuthLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-400 text-base animate-pulse font-semibold">სისტემა იტვირთება...</div>
      </div>
    );
  }

  // =========================================================================
  // 1. NOT LOGGED IN -> SPACIOUS AUTH CARD
  // =========================================================================
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto my-8 sm:my-14 px-2">
        <div className="bg-white dark:bg-navy-900 border border-slate-300 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-xl transition-all">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 rounded-3xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 mb-4 shadow-sm">
              <Shield className="w-11 h-11" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Healthcare<span className="text-cyan-600 dark:text-cyan-400">Comm</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 font-semibold">
              დახურული სივრცე ჯანდაცვის სფეროს სპეციალისტებისთვის
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="font-medium">{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="font-medium">{authSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            {authMode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    სახელი და გვარი *
                  </label>
                  <input
                    type="text"
                    required
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    placeholder="მაგ. გიორგი ბერიძე"
                    className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white font-medium shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    მომხმარებლის სახელი (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    placeholder="giorgi_beridze"
                    className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white font-medium shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    დაბადების თარიღი (კალენდარი) *
                  </label>
                  <input
                    type="date"
                    required
                    value={authBirthDate}
                    onChange={(e) => setAuthBirthDate(e.target.value)}
                    className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white font-medium shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    მიმართულება / სპეციალობა *
                  </label>
                  <select
                    value={authProfession}
                    onChange={(e) => setAuthProfession(e.target.value)}
                    className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white font-medium shadow-sm cursor-pointer"
                  >
                    <option value="საზოგადოებრივი ჯანდაცვა">საზოგადოებრივი ჯანდაცვა</option>
                    <option value="ჯანდაცვის პოლიტიკა">ჯანდაცვის პოლიტიკა</option>
                    <option value="ჯანდაცვის მენეჯმენტი">ჯანდაცვის მენეჯმენტი</option>
                    <option value="ეპიდემიოლოგია და ბიოსტატისტიკა">ეპიდემიოლოგია და ბიოსტატისტიკა</option>
                    <option value="კვლევა და ანალიტიკა">კვლევა და ანალიტიკა</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    სამუშაო ადგილი / ორგანიზაცია
                  </label>
                  <input
                    type="text"
                    value={authWorkplace}
                    onChange={(e) => setAuthWorkplace(e.target.value)}
                    placeholder="მაგ. უნივერსიტეტი, კვლევითი ცენტრი"
                    className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white font-medium shadow-sm"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                ელ-ფოსტა *
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="example@health.ge"
                className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white font-medium shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                პაროლი *
              </label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white font-medium shadow-sm"
              />
            </div>

            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  პაროლის დადასტურება *
                </label>
                <input
                  type="password"
                  required
                  value={authConfirmPassword}
                  onChange={(e) => setAuthConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white font-medium shadow-sm"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-base shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {authLoading ? (
                <span className="animate-pulse">მუშავდება...</span>
              ) : authMode === 'login' ? (
                <>
                  <LogIn className="w-5 h-5" />
                  შესვლა პლატფორმაზე
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  რეგისტრაციის დასრულება
                </>
              )}
            </button>
          </form>

          {/* Switch link */}
          <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
            {authMode === 'login' ? (
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
                არ გაქვთ ანგარიში?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className="font-extrabold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer ml-1"
                >
                  გაიარეთ რეგისტრაცია
                </button>
              </p>
            ) : (
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
                უკვე გაქვთ ანგარიში?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className="font-extrabold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer ml-1"
                >
                  შედით სისტემაში
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. LOGGED IN -> FULL COMMUNITY DASHBOARD / SPATIAL CARDS
  // =========================================================================
  return (
    <div className="space-y-10">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-navy-900 to-slate-900 border border-slate-800 p-8 sm:p-12 shadow-xl text-white">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs sm:text-sm font-extrabold">
            <Sparkles className="w-4 h-4" />
            პროფესიული სივრცე
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Healthcare<span className="text-cyan-400">Comm</span>
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
            დახურული ქომუნითი ჯანდაცვის პოლიტიკის, მენეჯმენტის, ეპიდემიოლოგიისა და კვლევების სპეციალისტებისთვის. გაუზიარეთ მიგნებები და ითანამშრომლეთ კოლეგებთან.
          </p>
          <div className="pt-3 flex flex-wrap gap-4">
            <Link
              href="/discussions/new"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-3 rounded-2xl text-sm font-extrabold transition-all shadow-md shadow-cyan-500/20"
            >
              + გახსენით დისკუსია
            </Link>
            <Link
              href="/blog/new"
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-5 py-3 rounded-2xl text-sm font-bold transition-all"
            >
              + გამოაქვეყნეთ ბლოგი
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Spacious, High-Contrast Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Top 5 Discussions */}
        <section className="space-y-5">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-500">
                <Flame className="w-6 h-6 text-amber-500" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                ტოპ-5 აქტიური დისკუსია
              </h2>
            </div>
            <Link
              href="/discussions"
              className="text-sm font-extrabold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1.5"
            >
              ყველა დისკუსია <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {topDiscussions.length === 0 ? (
              <div className="p-10 text-center bg-white dark:bg-navy-900 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-sm text-slate-600 dark:text-slate-400 text-base font-medium">
                დისკუსიები ჯერ არ არის. იყავით პირველი, ვინც წამოიწყებს თემას!
              </div>
            ) : (
              topDiscussions.map((item: any) => (
                <Link
                  key={item.id}
                  href={`/discussions/${item.id}`}
                  className="block p-6 bg-white dark:bg-navy-900 border border-slate-300 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500/60 rounded-3xl transition-all shadow-sm hover:shadow-md group"
                >
                  <div className="flex items-center gap-2.5 mb-2.5 text-xs sm:text-sm">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">
                      {item.author?.full_name || 'მომხმარებელი'}
                    </span>
                    {item.author?.verified_badge && (
                      <CheckCircle className="w-4 h-4 text-cyan-500" />
                    )}
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">{item.author?.profession}</span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2 mb-3 leading-snug">
                    {item.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    {item.topics?.map((topic: string) => (
                      <span
                        key={topic}
                        className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                      >
                        {topic}
                      </span>
                    ))}

                    {item.is_policy_brief && (
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-500/30 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Policy Brief
                      </span>
                    )}

                    {item.seeking_collaborators && (
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> თანამშრომლობა
                      </span>
                    )}

                    <div className="ml-auto text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" />
                      {item.comments?.[0]?.count || 0} პასუხი
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Top 5 Blogs */}
        <section className="space-y-5">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                ტოპ-5 ბლოგ-პოსტი & ანალიტიკა
              </h2>
            </div>
            <Link
              href="/blog"
              className="text-sm font-extrabold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1.5"
            >
              ყველა ბლოგი <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {topBlogs.length === 0 ? (
              <div className="p-10 text-center bg-white dark:bg-navy-900 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-sm text-slate-600 dark:text-slate-400 text-base font-medium">
                ბლოგ-სტატიები ჯერ არ არის. გაუზიარეთ თქვენი ანალიტიკური სტატია კოლეგებს!
              </div>
            ) : (
              topBlogs.map((item: any) => (
                <Link
                  key={item.id}
                  href={`/blog/${item.id}`}
                  className="block p-6 bg-white dark:bg-navy-900 border border-slate-300 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500/60 rounded-3xl transition-all shadow-sm hover:shadow-md group"
                >
                  <div className="flex items-center gap-2.5 mb-2.5 text-xs sm:text-sm">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">
                      {item.author?.full_name || 'ავტორი'}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">{item.author?.profession}</span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2 mb-3 leading-snug">
                    {item.title}
                  </h3>

                  <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span>{new Date(item.created_at).toLocaleDateString('ka-GE')}</span>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" />
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
