'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Home, 
  MessageSquare, 
  BookOpen, 
  Send, 
  User as UserIcon, 
  LogOut, 
  Moon, 
  Sun,
  Bell,
  Check,
  PlusCircle
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isDark, setIsDark] = useState<boolean>(true);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifPopover, setShowNotifPopover] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'light') {
        setIsDark(false);
        document.documentElement.classList.remove('dark');
      } else {
        setIsDark(true);
        document.documentElement.classList.add('dark');
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
      if (data?.user) fetchNotifications(data.user.id);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchNotifications(session.user.id);
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      authListener?.subscription?.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) setNotifications(data);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const navItems = [
    { name: 'მთავარი', href: '/', icon: Home },
    { name: 'დისკუსიები', href: '/discussions', icon: MessageSquare },
    { name: 'ბლოგი', href: '/blog', icon: BookOpen },
    { name: 'ჩატი', href: '/messages', icon: Send },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-navy-950/90 backdrop-blur-xl shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-amber-400 p-[2px] shadow-lg shadow-cyan-500/15 group-hover:scale-105 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-xl text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-amber-300">
                H
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                Healthcare<span className="text-cyan-600 dark:text-cyan-400">Comm</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-400 font-bold">
                Academic & Policy Society
              </span>
            </div>
          </Link>

          {user && (
            <div className="hidden lg:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[15px] font-bold transition-all ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setShowNotifPopover(!showNotifPopover)}
                  className="relative p-2.5 sm:p-3 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="შეტყობინებები"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-navy-950 animate-pulse" />
                  )}
                </button>

                {showNotifPopover && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        შეტყობინებები
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> წაკითხულად მონიშვნა
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
                      {notifications.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-6">
                          ახალი შეტყობინებები არ არის
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 rounded-xl transition-colors ${
                              !n.is_read ? 'bg-cyan-500/5 font-semibold' : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <p className="text-xs leading-snug">{n.content}</p>
                            <span className="text-[10px] text-slate-400 block mt-1">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="p-2.5 sm:p-3 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="თემის გადართვა"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>

            {user ? (
              <>
                <Link
                  href="/discussions/new"
                  className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:opacity-95 text-white px-5 py-2.5 rounded-2xl text-sm font-extrabold shadow-md shadow-cyan-500/20 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  ახალი თემა
                </Link>
                <Link
                  href="/profile"
                  className={`hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border ${
                    pathname === '/profile'
                      ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10'
                      : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  პროფილი
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-2.5 sm:p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-2xl transition-colors cursor-pointer"
                  title="გამოსვლა"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
