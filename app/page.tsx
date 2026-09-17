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
  Edit2,
  Trash2,
  X,
  Save,
  ShieldCheck,
  Check
} from 'lucide-react';

// ==========================================
// 1. INLINE EDITABLE TEXT COMPONENT (CMS)
// ==========================================
interface EditableTextProps {
  contentKey: string;
  defaultText: string;
  isAdmin?: boolean;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

function EditableText({
  contentKey,
  defaultText,
  isAdmin = false,
  className = '',
  as: Component = 'span'
}: EditableTextProps) {
  const [text, setText] = useState(defaultText);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(defaultText);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`site_text_${contentKey}`);
      if (saved) {
        setText(saved);
        setDraft(saved);
      }
    }
  }, [contentKey]);

  const handleSave = () => {
    setText(draft);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`site_text_${contentKey}`, draft);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(text);
    setIsEditing(false);
  };

  if (!isAdmin) {
    return <Component className={className}>{text}</Component>;
  }

  if (isEditing) {
    return (
      <span className="inline-flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-cyan-500 rounded-lg shadow-sm">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="px-2 py-0.5 text-xs bg-transparent border-b border-cyan-500 text-slate-900 dark:text-white focus:outline-none"
          autoFocus
        />
        <button
          type="button"
          onClick={handleSave}
          className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded cursor-pointer"
          title="შენახვა"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="p-1 text-slate-400 hover:bg-slate-500/10 rounded cursor-pointer"
          title="გაუქმება"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </span>
    );
  }

  return (
    <span className="group/edit inline-flex items-center gap-1.5">
      <Component className={className}>{text}</Component>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover/edit:opacity-100 p-1 text-cyan-500 hover:bg-cyan-500/10 rounded transition-opacity cursor-pointer"
        title="ტექსტის შეცვლა"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}

// ==========================================
// 2. MAIN HOMEPAGE COMPONENT
// ==========================================
interface EditModalState {
  isOpen: boolean;
  type: 'discussion' | 'blog';
  item: any | null;
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Feed data
  const [topDiscussions, setTopDiscussions] = useState<any[]>([]);
  const [topBlogs, setTopBlogs] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

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

  // Admin Card Editing Modal State
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    type: 'discussion',
    item: null,
  });
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const currentUser = data?.user ?? null;
      setUser(currentUser);
      checkAdminRole(currentUser);
      setLoadingUser(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      checkAdminRole(currentUser);
    });

    loadData();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAdminRole = async (currentUser: any) => {
    if (!currentUser) {
      setIsAdmin(false);
      return;
    }
    if (currentUser.email === 'shovnadzedavid@gmail.com') {
      setIsAdmin(true);
      return;
    }
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', currentUser.id)
        .maybeSingle();
      if (profile?.is_admin) {
        setIsAdmin(true);
      }
    } catch {
      // Fallback
    }
  };

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

  // ==========================================
  // ADMIN ACTIONS (EDIT & DELETE FOR CARDS)
  // ==========================================
  const handleOpenEditCard = (e: React.MouseEvent, type: 'discussion' | 'blog', item: any) => {
    e.preventDefault();
    e.stopPropagation();
    setEditModal({ isOpen: true, type, item });
    setModalTitle(item.title || '');
    setModalContent(item.content || '');
  };

  const handleSaveCardModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.item) return;
    setModalSaving(true);

    const table = editModal.type === 'discussion' ? 'discussions' : 'blog_posts';
    try {
      const { error } = await supabase
        .from(table)
        .update({
          title: modalTitle.trim(),
          content: modalContent.trim(),
        })
        .eq('id', editModal.item.id);

      if (error) throw error;

      if (editModal.type === 'discussion') {
        setTopDiscussions((prev) =>
          prev.map((d) => (d.id === editModal.item.id ? { ...d, title: modalTitle, content: modalContent } : d))
        );
      } else {
        setTopBlogs((prev) =>
          prev.map((b) => (b.id === editModal.item.id ? { ...b, title: modalTitle, content: modalContent } : b))
        );
      }
      setEditModal({ isOpen: false, type: 'discussion', item: null });
    } catch (err: any) {
      console.error(err);
      alert('ცვლილების შენახვისას მოხდა შეცდომა: ' + (err.message || ''));
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeleteCard = async (e: React.MouseEvent, type: 'discussion' | 'blog', id: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`დარწმუნებული ხართ, რომ გსურთ წაშალოთ: "${title}"?`)) {
      return;
    }

    const table = type === 'discussion' ? 'discussions' : 'blog_posts';
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;

      if (type === 'discussion') {
        setTopDiscussions((prev) => prev.filter((d) => d.id !== id));
      } else {
        setTopBlogs((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err: any) {
      console.error(err);
      alert('წაშლისას დაფიქსირდა შეცდომა: ' + (err.message || ''));
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
  // VIEW 1: AUTH VIEW (არაავტორიზებული რეჟიმი)
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

  // ==========================================
  // VIEW 2: LOGGED IN FEED VIEW (WITH ADMIN CMS)
  // ==========================================
  return (
    <>
      <div className="space-y-8 pb-12">
        {/* 1. Banner / Welcome With Admin Editing */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
          <div className="max-w-3xl space-y-2.5">
            <div className="flex items-center gap-2">
              <EditableText
                contentKey="home_banner_badge"
                defaultText="პროფესიული სივრცე"
                isAdmin={isAdmin}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider"
              />
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 text-[10px] font-bold border border-amber-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  ადმინ-რეჟიმი
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Healthcare<span className="text-indigo-600 dark:text-indigo-400 font-medium">Comm</span>
            </h1>

            <EditableText
              contentKey="home_banner_desc"
              defaultText="დახურული ქომუნითი ჯანდაცვის პოლიტიკის, მენეჯმენტის, ეპიდემიოლოგიისა და კვლევების სპეციალისტებისთვის. გაუზიარეთ მიგნებები და ითანამშრომლეთ კოლეგებთან."
              isAdmin={isAdmin}
              as="p"
              className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed block"
            />

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

        {/* 2. Grid: Top Discussions & Top Blogs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* სვეტი 1: ტოპ-5 აქტიური დისკუსია */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <EditableText
                  contentKey="home_section_disc_title"
                  defaultText="ტოპ-5 აქტიური დისკუსია"
                  isAdmin={isAdmin}
                  as="h2"
                  className="text-base font-bold text-slate-900 dark:text-white"
                />
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
                  <div
                    key={item.id}
                    className="relative block p-5 bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800/80 hover:border-slate-400 dark:hover:border-slate-600 rounded-2xl transition-all duration-150 shadow-2xs group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.author?.full_name || 'მომხმარებელი'}
                        </span>
                        {item.author?.verified_badge && (
                          <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
                        )}
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 dark:text-slate-400">{item.author?.profession || 'ჯანდაცვა'}</span>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditCard(e, 'discussion', item)}
                            className="p-1 text-slate-600 dark:text-slate-300 hover:text-cyan-500 transition-colors cursor-pointer"
                            title="ქარდის რედაქტირება"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCard(e, 'discussion', item.id, item.title)}
                            className="p-1 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                            title="ქარდის წაშლა"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <Link href={`/discussions/${item.id}`} className="block">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mb-2">
                        {item.title}
                      </h3>
                    </Link>

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

                      <div className="ml-auto text-xs text-slate-400 flex items-center gap-1 font-medium">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {(item.comments && item.comments[0] ? item.comments[0].count : 0)} პასუხი
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* სვეტი 2: ტოპ-5 ბლოგ-პოსტი & ანალიტიკა */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <EditableText
                  contentKey="home_section_blog_title"
                  defaultText="ტოპ-5 ბლოგ-პოსტი & ანალიტიკა"
                  isAdmin={isAdmin}
                  as="h2"
                  className="text-base font-bold text-slate-900 dark:text-white"
                />
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
                  <div
                    key={item.id}
                    className="relative block p-5 bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800/80 hover:border-slate-400 dark:hover:border-slate-600 rounded-2xl transition-all duration-150 shadow-2xs group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.author?.full_name || 'ავტორი'}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 dark:text-slate-400">{item.author?.profession || 'სპეციალისტი'}</span>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditCard(e, 'blog', item)}
                            className="p-1 text-slate-600 dark:text-slate-300 hover:text-teal-500 transition-colors cursor-pointer"
                            title="სტატიის რედაქტირება"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCard(e, 'blog', item.id, item.title)}
                            className="p-1 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                            title="სტატიის წაშლა"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <Link href={`/blog/${item.id}`} className="block">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2 mb-2">
                        {item.title}
                      </h3>
                    </Link>

                    <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <span>{new Date(item.created_at).toLocaleDateString('ka-GE')}</span>
                      <div className="flex items-center gap-1 font-medium">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {(item.comments && item.comments[0] ? item.comments[0].count : 0)} კომენტარი
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </div>

      {/* ========================================== */}
      {/* 3. ADMIN QUICK EDIT MODAL                  */}
      {/* ========================================== */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-500">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {editModal.type === 'discussion' ? 'დისკუსიის რედაქტირება' : 'ბლოგის რედაქტირება'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditModal({ isOpen: false, type: 'discussion', item: null })}
                className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCardModal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  სათაური *
                </label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#141a29] border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  შინაარსი / აღწერა
                </label>
                <textarea
                  rows={4}
                  value={modalContent}
                  onChange={(e) => setModalContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#141a29] border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, type: 'discussion', item: null })}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {modalSaving ? 'ინახება...' : 'შენახვა'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
