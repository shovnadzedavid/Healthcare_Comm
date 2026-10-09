'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  TrendingUp, 
  Search, 
  Filter, 
  ShieldCheck, 
  Bookmark, 
  Share2, 
  Flame, 
  Clock, 
  ArrowUpRight,
  Check,
  Compass
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [topDiscussions, setTopDiscussions] = useState<any[]>([]);
  const [topBlogs, setTopBlogs] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'discussions' | 'policy' | 'blogs' | 'collab'>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('ყველა');
  const [sortBy, setSortBy] = useState<'recent' | 'trending'>('recent');

  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isLogin, setIsLogin] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

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
          .limit(20),
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
          .limit(10)
      ]);

      if (discRes.data) {
        setTopDiscussions(discRes.data);
      }
      if (blogRes.data) {
        setTopBlogs(blogRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFeed(false);
    }
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSavedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleShare = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/discussions/${id}`;
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'linkedin_oidc') => {
    try {
      setSocialLoading(provider);
      setErrorMsg('');
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectUrl },
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

  const filteredDiscussions = useMemo(() => {
    return topDiscussions
      .filter((item) => {
        if (activeTab === 'policy' && !item.is_policy_brief) return false;
        if (activeTab === 'collab' && !item.seeking_collaborators) return false;

        if (selectedTopic !== 'ყველა' && !item.topics?.includes(selectedTopic)) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title?.toLowerCase().includes(q);
          const matchAuthor = item.author?.full_name?.toLowerCase().includes(q);
          const matchContent = item.content?.toLowerCase().includes(q);
          const matchTopic = item.topics?.some((t: string) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchAuthor && !matchContent && !matchTopic) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'trending') {
          const aCount = a.comments?.[0]?.count || 0;
          const bCount = b.comments?.[0]?.count || 0;
          return bCount - aCount;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [topDiscussions, activeTab, selectedTopic, searchQuery, sortBy]);

  const policyCount = topDiscussions.filter(d => d.is_policy_brief).length;
  const collabCount = topDiscussions.filter(d => d.seeking_collaborators).length;

  if (loadingUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-[#142136] dark:border-[#ffb454] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#63728a] dark:text-[#a9b8cd] font-medium text-xs tracking-wider">
          სისტემა იტვირთება...
        </p>
      </div>
    );
  }

  // ==============================================================
  // VIEW 1: AUTH VIEW (N17 Exact Intro & Authbox Split)
  // ==============================================================
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-6 sm:py-10">
        <div className="w-full max-w-5xl bg-white dark:bg-[#0e1726] border border-[#dbe3ec] dark:border-[#23354d] rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
          
          <div className="bg-[#142136] p-8 sm:p-14 text-white flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Healthcare<b className="text-[#ffb454]">Comm</b>
                </div>
                <div className="text-xs text-[#a9b8cd] mt-1.5 font-normal">
                  საქართველოს ჯანდაცვის პოლიტიკისა და მენეჯმენტის სივრცე
                </div>
              </div>

              <span className="text-[#ffb454] text-xs font-bold uppercase tracking-wider block">
                დახურული პროფესიული ქსელი
              </span>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                მტკიცებულებებზე დაფუძნებული ჯანდაცვის მართვა.
              </h1>

              <p className="text-sm text-[#bdcbe0] leading-relaxed">
                შექმენი Policy Brief, გააანალიზე DRG სისტემა და ითანამშრომლე კოლეგებთან საერთაშორისო სამეცნიერო გრანტებზე — ერთ ქართულ სამუშაო სივრცეში.
              </p>

              <div className="pt-4 border-t border-white/10 space-y-3.5 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#ffb454] mt-1.5 shrink-0"></div>
                  <div>
                    <strong className="text-white block font-semibold">Policy Briefs & ანალიტიკა</strong>
                    <span className="text-[#bdcbe0]">მტკიცებულებებზე დაფუძნებული პოლიტიკის დოკუმენტები.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#ffb454] mt-1.5 shrink-0"></div>
                  <div>
                    <strong className="text-white block font-semibold">DRG და ჰოსპიტალური ეკონომიკა</strong>
                    <span className="text-[#bdcbe0]">ტარიფების, კოდირებისა და ფინანსური მართვის ქეისები.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#ffb454] mt-1.5 shrink-0"></div>
                  <div>
                    <strong className="text-white block font-semibold">სამეცნიერო თანამშრომლობა</strong>
                    <span className="text-[#bdcbe0]">საერთაშორისო გრანტები და კვლევითი პარტნიორობა.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 text-xs text-[#a9b8cd] border-t border-white/10 mt-8">
              HealthcareComm · მონაცემები დაცულია · N17
            </div>
          </div>

          <div className="p-8 sm:p-12 flex flex-col justify-center bg-white dark:bg-[#0e1726]">
            <div className="w-full max-w-md mx-auto space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-[#dbe3ec] dark:border-[#23354d]">
                <div>
                  <h2 className="text-xl font-extrabold text-[#17283e] dark:text-white">
                    {isLogin ? 'სისტემაში შესვლა' : 'ანგარიშის შექმნა'}
                  </h2>
                  <p className="text-xs text-[#63728a] dark:text-[#a9b8cd] mt-0.5">
                    {isLogin ? 'გაიარეთ ავტორიზაცია თქვენი მონაცემებით' : 'შეუერთდით პროფესიულ საზოგადოებას'}
                  </p>
                </div>
                <div className="flex p-1 bg-[#f1f5f9] dark:bg-[#142136] rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => { setIsLogin(true); setErrorMsg(''); }}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      isLogin 
                        ? 'bg-[#142136] text-white dark:bg-[#ffb454] dark:text-[#142136] shadow-xs' 
                        : 'text-[#63728a] dark:text-[#a9b8cd]'
                    }`}
                  >
                    შესვლა
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsLogin(false); setErrorMsg(''); }}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      !isLogin 
                        ? 'bg-[#142136] text-white dark:bg-[#ffb454] dark:text-[#142136] shadow-xs' 
                        : 'text-[#63728a] dark:text-[#a9b8cd]'
                    }`}
                  >
                    რეგისტრაცია
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-[#fce6e8] border border-[#b63540]/30 text-[#b63540] text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-[#ddf4eb] border border-[#06745c]/30 text-[#06745c] text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={!!socialLoading || authLoading}
                  className="py-2.5 px-3 bg-white dark:bg-[#142136] border border-[#bdcad9] dark:border-[#23354d] hover:border-[#142136] dark:hover:border-[#ffb454] text-[#17283e] dark:text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
                  className="py-2.5 px-3 bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.63 1.63 0 1 0 0-3.25 1.63 1.63 0 0 0 0 3.25m1.39 9.74V9.95H5.07v8.55h2.78z" />
                  </svg>
                  <span>LinkedIn</span>
                </button>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-[#dbe3ec] dark:border-[#23354d]"></div>
                <span className="absolute bg-white dark:bg-[#0e1726] px-3 text-[11px] text-[#63728a] font-medium">
                  ან ელ-ფოსტით
                </span>
              </div>

              <form onSubmit={handleAuth} className="space-y-3">
                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[#17283e] dark:text-[#f1f5f9] mb-1">
                        სახელი და გვარი *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="გიორგი ბერიძე"
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-[#142136] border border-[#bdcad9] dark:border-[#23354d] rounded-lg focus:outline-none focus:border-[#ffb454] text-[#17283e] dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#17283e] dark:text-[#f1f5f9] mb-1">
                        მომხმარებლის სახელი *
                      </label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="giorgi_beridze"
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-[#142136] border border-[#bdcad9] dark:border-[#23354d] rounded-lg focus:outline-none focus:border-[#ffb454] text-[#17283e] dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#17283e] dark:text-[#f1f5f9] mb-1">
                          დაბადების თარიღი *
                        </label>
                        <input
                          type="date"
                          required
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-[#142136] border border-[#bdcad9] dark:border-[#23354d] rounded-lg focus:outline-none focus:border-[#ffb454] text-[#17283e] dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#17283e] dark:text-[#f1f5f9] mb-1">
                          სპეციალობა *
                        </label>
                        <select
                          value={profession}
                          onChange={(e) => setProfession(e.target.value)}
                          className="w-full px-2 py-2 text-xs bg-white dark:bg-[#142136] border border-[#bdcad9] dark:border-[#23354d] rounded-lg focus:outline-none focus:border-[#ffb454] text-[#17283e] dark:text-white"
                        >
                          <option value="საზოგადოებრივი ჯანდაცვა">საზოგადოებრივი ჯანდაცვა</option>
                          <option value="ჯანდაცვის პოლიტიკა">ჯანდაცვის პოლიტიკა</option>
                          <option value="ჯანდაცვის მენეჯმენტი">ჯანდაცვის მენეჯმენტი</option>
                          <option value="ეპიდემიოლოგია და ბიოსტატისტიკა">ეპიდემიოლოგია / ბიოსტატი</option>
                          <option value="კვლევა და ანალიტიკა">კვლევა და ანალიტიკა</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#17283e] dark:text-[#f1f5f9] mb-1">
                        სამუშაო ადგილი / ორგანიზაცია
                      </label>
                      <input
                        type="text"
                        value={workplace}
                        onChange={(e) => setWorkplace(e.target.value)}
                        placeholder="მაგ. უნივერსიტეტი, კლინიკა, NCDC"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-[#142136] border border-[#bdcad9] dark:border-[#23354d] rounded-lg focus:outline-none focus:border-[#ffb454] text-[#17283e] dark:text-white"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#17283e] dark:text-[#f1f5f9] mb-1">
                    ელ-ფოსტა *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#142136] border border-[#bdcad9] dark:border-[#23354d] rounded-lg focus:outline-none focus:border-[#ffb454] text-[#17283e] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17283e] dark:text-[#f1f5f9] mb-1">
                    პაროლი *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="მინიმუმ 10 სიმბოლო"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#142136] border border-[#bdcad9] dark:border-[#23354d] rounded-lg focus:outline-none focus:border-[#ffb454] text-[#17283e] dark:text-white"
                  />
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-xs font-bold text-[#17283e] dark:text-[#f1f5f9] mb-1">
                      პაროლის დადასტურება *
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="გაიმეორეთ პაროლი"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#142136] border border-[#bdcad9] dark:border-[#23354d] rounded-lg focus:outline-none focus:border-[#ffb454] text-[#17283e] dark:text-white"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-[#142136] dark:bg-[#ffb454] hover:bg-[#253b59] dark:hover:bg-[#e59f44] text-white dark:text-[#142136] font-bold text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {authLoading ? (
                    <span className="animate-pulse">მუშავდება...</span>
                  ) : isLogin ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      სისტემაში შესვლა
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      ანგარიშის შექმნა
                    </>
                  )}
                </button>
              </form>

            </div>
          </div>

        </div>
      </div>
    );
  }

  // ==============================================================
  // VIEW 2: LOGGED-IN WORKSPACE (N17 Exact Layout & Styling)
  // ==============================================================
  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. TOP HEADER (N17 .top) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dbe3ec] dark:border-[#23354d]">
        <div>
          <p className="text-xs text-[#63728a] dark:text-[#a9b8cd] font-medium mb-1">
            {new Date().toLocaleDateString('ka-GE', { day: 'numeric', month: 'long', year: 'numeric' })} · პროფესიული სივრცე
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17283e] dark:text-white tracking-tight">
            მიმოხილვა
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/discussions/new"
            className="inline-flex items-center gap-2 bg-[#142136] dark:bg-[#ffb454] hover:bg-[#253b59] dark:hover:bg-[#e59f44] text-white dark:text-[#142136] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            ახალი დისკუსია
          </Link>

          <Link
            href="/discussions/new?type=policy"
            className="inline-flex items-center gap-2 bg-[#fff0d8] dark:bg-[#ffb454]/15 hover:bg-[#ffe2b5] text-[#86501b] dark:text-[#ffb454] border border-[#f4cf85] dark:border-[#ffb454]/40 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all"
          >
            <FileText className="w-4 h-4" />
            Policy Brief
          </Link>

          <Link
            href="/blog/new"
            className="inline-flex items-center gap-2 bg-white dark:bg-[#142136] hover:bg-[#f4f7fa] dark:hover:bg-[#23354d] text-[#17283e] dark:text-white border border-[#dbe3ec] dark:border-[#23354d] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all"
          >
            <BookOpen className="w-4 h-4 text-[#1b5d9d] dark:text-[#79b7ff]" />
            ბლოგი
          </Link>
        </div>
      </div>

      {/* 2. METRIC CARDS (N17 .cards & .card.highlight) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Highlighted Navy Card */}
        <div className="bg-[#142136] text-white border border-[#142136] rounded-2xl p-5.5 shadow-sm">
          <div className="text-xs text-[#c0cce0] font-semibold">აქტიური დისკუსიები</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#ffb454] my-2 leading-none">
            {topDiscussions.length}
          </div>
          <div className="text-xs text-[#a9b8cd]">კოლეგების მიერ განხილული საკითხები</div>
        </div>

        {/* Card 2: Policy Briefs */}
        <div className="bg-white dark:bg-[#142136] text-[#17283e] dark:text-white border border-[#dbe3ec] dark:border-[#23354d] rounded-2xl p-5.5 shadow-xs">
          <div className="text-xs text-[#63728a] dark:text-[#a9b8cd] font-semibold">Policy Briefs</div>
          <div className="text-2xl sm:text-3xl font-extrabold my-2 leading-none">
            {policyCount}
          </div>
          <div className="text-xs text-[#63728a] dark:text-[#a9b8cd]">მტკიცებულებითი რეკომენდაციები</div>
        </div>

        {/* Card 3: Research Articles */}
        <div className="bg-white dark:bg-[#142136] text-[#17283e] dark:text-white border border-[#dbe3ec] dark:border-[#23354d] rounded-2xl p-5.5 shadow-xs">
          <div className="text-xs text-[#63728a] dark:text-[#a9b8cd] font-semibold">სამეცნიერო ბლოგები</div>
          <div className="text-2xl sm:text-3xl font-extrabold my-2 leading-none">
            {topBlogs.length}
          </div>
          <div className="text-xs text-[#63728a] dark:text-[#a9b8cd]">ანალიტიკური სტატიები</div>
        </div>

        {/* Card 4: Collaborations */}
        <div className="bg-white dark:bg-[#142136] text-[#17283e] dark:text-white border border-[#dbe3ec] dark:border-[#23354d] rounded-2xl p-5.5 shadow-xs">
          <div className="text-xs text-[#63728a] dark:text-[#a9b8cd] font-semibold">კვლევითი კოლაბორაცია</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#06745c] dark:text-emerald-400 my-2 leading-none">
            {collabCount}
          </div>
          <div className="text-xs text-[#63728a] dark:text-[#a9b8cd]">პარტნიორობის ღია მოთხოვნები</div>
        </div>

      </div>

      {/* 3. TWO-COLUMN LAYOUT (N17 .columns 1.4fr 1fr) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left main panel 8 cols */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white dark:bg-[#142136] border border-[#dbe3ec] dark:border-[#23354d] rounded-2xl p-5 sm:p-6 shadow-xs">
            
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#dbe3ec] dark:border-[#23354d]">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#17283e] dark:text-white">
                  პროფესიული დისკუსიები
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-[#eef2f8] dark:bg-[#23354d] text-[#1b5d9d] dark:text-[#ffb454] text-xs font-bold">
                  {filteredDiscussions.length}
                </span>
              </div>
              <Link
                href="/discussions"
                className="text-xs font-bold text-[#1b65b5] dark:text-[#ffb454] hover:underline"
              >
                ყველას ნახვა
              </Link>
            </div>

            {/* N17 Toolbar: Search & Select */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
              <div className="sm:col-span-8 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#63728a]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="მოძებნე დისკუსია, თემა ან ავტორი..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-[#bdcad9] dark:border-[#23354d] bg-white dark:bg-[#0e1726] rounded-lg focus:outline-none focus:border-[#ffb454] text-[#17283e] dark:text-white"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={activeTab}
                  onChange={(e: any) => setActiveTab(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-[#bdcad9] dark:border-[#23354d] bg-white dark:bg-[#0e1726] rounded-lg focus:outline-none focus:border-[#ffb454] text-[#17283e] dark:text-white"
                >
                  <option value="all">ყველა ტიპი</option>
                  <option value="policy">Policy Briefs</option>
                  <option value="collab">კოლაბორაცია</option>
                </select>
              </div>
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-[#dbe3ec] dark:border-[#23354d] scrollbar-none">
              {['ყველა', 'ჯანდაცვის პოლიტიკა', 'ჰოსპიტალური მენეჯმენტი', 'DRG და ეკონომიკა', 'საზოგადოებრივი ჯანდაცვა'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTopic(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedTopic === t
                      ? 'bg-[#142136] text-white dark:bg-[#ffb454] dark:text-[#142136]'
                      : 'bg-[#f1f5f9] dark:bg-[#0e1726] text-[#63728a] dark:text-[#a9b8cd] hover:text-[#17283e]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Discussions Rows (N17 .row) */}
            <div className="divide-y divide-[#dbe3ec] dark:divide-[#23354d]">
              {loadingFeed ? (
                <div className="p-8 text-center text-xs text-[#63728a]">
                  იტვირთება...
                </div>
              ) : filteredDiscussions.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#63728a]">
                  ჩანაწერები არ მოიძებნა.
                </div>
              ) : (
                filteredDiscussions.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <Link href={`/discussions/${item.id}`}>
                        <h3 className="text-sm font-bold text-[#17283e] dark:text-white group-hover:text-[#1b65b5] dark:group-hover:text-[#ffb454] transition-colors leading-snug">
                          {item.title}
                        </h3>
                      </Link>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#63728a] dark:text-[#a9b8cd]">
                        <span className="font-semibold text-[#17283e] dark:text-white">
                          {item.author?.full_name || 'მომხმარებელი'}
                        </span>
                        <span>·</span>
                        <span>{item.author?.profession || 'სპეციალისტი'}</span>
                        <span>·</span>
                        <span>{new Date(item.created_at).toLocaleDateString('ka-GE')}</span>

                        {item.is_policy_brief && (
                          <span className="px-2 py-0.5 rounded bg-[#fff0d8] text-[#86501b] font-bold text-[10px]">
                            Policy Brief
                          </span>
                        )}

                        {item.seeking_collaborators && (
                          <span className="px-2 py-0.5 rounded bg-[#ddf4eb] text-[#09644f] font-bold text-[10px]">
                            კოლაბორაცია
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-[#63728a] dark:text-[#a9b8cd] font-semibold">
                        {(item.comments && item.comments[0] ? item.comments[0].count : 0)} პასუხი
                      </span>
                      <Link
                        href={`/discussions/${item.id}`}
                        className="px-3 py-1.5 rounded-lg border border-[#bdcad9] dark:border-[#23354d] text-xs font-semibold hover:border-[#142136] dark:hover:border-[#ffb454] transition-all"
                      >
                        გახსნა
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* Blogs Panel */}
          {topBlogs.length > 0 && (
            <div className="bg-white dark:bg-[#142136] border border-[#dbe3ec] dark:border-[#23354d] rounded-2xl p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#dbe3ec] dark:border-[#23354d]">
                <h2 className="text-base font-bold text-[#17283e] dark:text-white">
                  ანალიტიკური სტატიები და ბლოგები
                </h2>
                <Link href="/blog" className="text-xs font-bold text-[#1b65b5] dark:text-[#ffb454] hover:underline">
                  ყველას ნახვა
                </Link>
              </div>

              <div className="divide-y divide-[#dbe3ec] dark:divide-[#23354d]">
                {topBlogs.slice(0, 4).map((b) => (
                  <div key={b.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div>
                      <Link href={`/blog/${b.id}`}>
                        <h3 className="text-sm font-bold text-[#17283e] dark:text-white hover:text-[#1b65b5] dark:hover:text-[#ffb454] transition-colors line-clamp-1">
                          {b.title}
                        </h3>
                      </Link>
                      <span className="text-xs text-[#63728a] dark:text-[#a9b8cd]">
                        {b.author?.full_name} · {new Date(b.created_at).toLocaleDateString('ka-GE')}
                      </span>
                    </div>

                    <Link
                      href={`/blog/${b.id}`}
                      className="px-2.5 py-1 rounded-lg border border-[#bdcad9] dark:border-[#23354d] text-xs font-semibold hover:border-[#142136] dark:hover:border-[#ffb454] transition-all shrink-0"
                    >
                      კითხვა
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right sidebar 4 cols */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Panel 1: Masterclasses with N17 Pricing/Ticket Accent */}
          <div className="bg-white dark:bg-[#142136] border border-[#dbe3ec] dark:border-[#23354d] rounded-2xl p-5 shadow-xs border-t-4 border-t-[#ffb454] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#ffb454]">
                Live მასტერკლასი
              </span>
              <span className="px-2 py-0.5 rounded bg-[#ddf4eb] text-[#09644f] text-[10px] font-bold">
                რეგისტრაცია ღიაა
              </span>
            </div>

            <h3 className="text-sm font-bold text-[#17283e] dark:text-white leading-snug">
              DRG სისტემის ოპტიმიზაცია და კლინიკის ფინანსური მართვა
            </h3>

            <p className="text-xs text-[#63728a] dark:text-[#a9b8cd] leading-relaxed">
              პრაქტიკული ქეისები, კოდირების სტრატეგია და სადაზღვევო უარყოფების (Denials) შემცირება.
            </p>

            <div className="pt-2 border-t border-[#dbe3ec] dark:border-[#23354d] flex items-center justify-between text-xs">
              <span className="font-semibold text-[#17283e] dark:text-white">გიორგი ბერიძე</span>
              <Link
                href="/masterclasses"
                className="px-3 py-1.5 bg-[#142136] dark:bg-[#ffb454] text-white dark:text-[#142136] rounded-lg font-bold text-xs hover:opacity-90 transition-all"
              >
                დეტალები
              </Link>
            </div>
          </div>

          {/* Panel 2: Discussions Progress Movement (N17 .bar & .row) */}
          <div className="bg-white dark:bg-[#142136] border border-[#dbe3ec] dark:border-[#23354d] rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[#17283e] dark:text-white">
              დისკუსიების მოძრაობა
            </h3>

            {[
              { label: 'ჯანდაცვის პოლიტიკა', count: topDiscussions.filter(d => d.topics?.includes('ჯანდაცვის პოლიტიკა')).length || 4, pct: 45 },
              { label: 'DRG და ეკონომიკა', count: topDiscussions.filter(d => d.topics?.includes('DRG და ეკონომიკა')).length || 3, pct: 30 },
              { label: 'ჰოსპიტალური მენეჯმენტი', count: topDiscussions.filter(d => d.topics?.includes('ჰოსპიტალური მენეჯმენტი')).length || 3, pct: 25 },
              { label: 'საზოგადოებრივი ჯანდაცვა', count: topDiscussions.filter(d => d.topics?.includes('საზოგადოებრივი ჯანდაცვა')).length || 2, pct: 20 },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#63728a] dark:text-[#a9b8cd] font-medium">{stat.label}</span>
                  <strong className="text-[#17283e] dark:text-white">{stat.count}</strong>
                </div>
                <div className="h-2 bg-[#edf1f6] dark:bg-[#0e1726] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#142136] dark:bg-[#ffb454] rounded-full"
                    style={{ width: `${stat.pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Panel 3: Collaboration Alert (N17 Notice) */}
          <div className="bg-[#fff3dd] dark:bg-[#23354d]/60 border border-[#f4cf85] dark:border-[#ffb454]/40 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#86501b] dark:text-[#ffb454]">
              <Users className="w-4 h-4" />
              კვლევითი კოლაბორაცია
            </div>
            <p className="text-xs text-[#86501b] dark:text-[#bdcbe0] leading-relaxed">
              ეძებთ თანაავტორს ან ბიოსტატისტიკოსს? შექმენით დისკუსია „კოლაბორაციის“ მონიშვნით.
            </p>
            <Link
              href="/discussions/new"
              className="inline-block text-xs font-bold text-[#86501b] dark:text-[#ffb454] hover:underline pt-1"
            >
              განაცხადის შექმნა →
            </Link>
          </div>

        </aside>

      </div>

      {/* FOOTER (N17 Style) */}
      <footer className="pt-6 border-t border-[#dbe3ec] dark:border-[#23354d] text-center text-xs text-[#63728a] dark:text-[#a9b8cd]">
        HealthcareComm · ჯანდაცვის პოლიტიკისა და მენეჯმენტის პროფესიული ქსელი · N17 Design
      </footer>

    </div>
  );
}
