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
  Plus
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
      setUser(data.user);
      if (data.user) {
        fetchNotifications(data.user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchNotifications(session.user.id);
      }
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      authListener.subscription.unsubscribe();
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

    if (data) {
      setNotifications(data);
    }
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
    { name: 'მიმოხილვა', href: '/', icon: Home },
    { name: 'დისკუსიები', href: '/discussions', icon: MessageSquare },
    { name: 'ბლოგი', href: '/blog', icon: BookOpen },
    { name: 'ჩატი', href: '/messages', icon: Send },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full bg-[#142136] dark:bg-[#0e1726] text-white border-b border-[#23334b] shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#23354d] border border-[#ffb454]/40 flex items-center justify-center font-black text-xl text-[#ffb454] shadow-xs group-hover:border-[#ffb454] transition-all">
              H
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
                Healthcare<span className="text-[#ffb454]">Comm</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#a9b8cd] font-semibold">
                პროფესიული სივრცე · N17
              </span>
            </div>
          </Link>

          {user && (
            <div className="hidden lg:flex items-center gap-1.5 bg-[#0b1320] p-1 rounded-xl border border-[#23334b]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[#ffb454] text-[#142136] shadow-xs font-bold'
                        : 'text-[#c0cce0] hover:bg-[#23334b] hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setShowNotifPopover(!showNotifPopover)}
                  className="relative p-2.5 rounded-xl text-[#c0cce0] hover:text-white hover:bg-[#23334b] transition-colors cursor-pointer"
                  title="შეტყობინებები"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#ffb454] rounded-full ring-2 ring-[#142136] animate-pulse" />
                  )}
                </button>

                {showNotifPopover && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-[#142136] border border-[#dbe3ec] dark:border-[#23354d] text-[#17283e] dark:text-white rounded-2xl shadow-xl p-4 z-50">
                    <div className="flex items-center justify-between pb-3 border-b border-[#dbe3ec] dark:border-[#23354d]">
                      <h3 className="font-bold text-sm">
                        შეტყობინებები
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-[#06745c] dark:text-[#ffb454] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> წაკითხულად მონიშვნა
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-[#dbe3ec] dark:divide-[#23354d] mt-2">
                      {notifications.length === 0 ? (
                        <p className="text-center text-xs text-[#63728a] dark:text-[#a9b8cd] py-6">
                          ახალი შეტყობინებები არ არის
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 rounded-lg transition-colors ${
                              !n.is_read ? 'bg-[#f1f5f9] dark:bg-[#23354d]/50 font-semibold' : 'text-[#63728a] dark:text-[#c0cce0]'
                            }`}
                          >
                            <p className="text-xs leading-snug">{n.content}</p>
                            <span className="text-[10px] text-[#63728a] dark:text-[#a9b8cd] block mt-1">
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
              className="p-2.5 rounded-xl text-[#c0cce0] hover:text-white hover:bg-[#23334b] transition-colors cursor-pointer"
              title="თემის გადართვა (Light / Dark)"
            >
              {isDark ? <Sun className="w-5 h-5 text-[#ffb454]" /> : <Moon className="w-5 h-5 text-[#ffb454]" />}
            </button>

            {user ? (
              <>
                <Link
                  href="/discussions/new"
                  className="hidden sm:inline-flex items-center gap-2 bg-[#ffb454] hover:bg-[#e59f44] text-[#142136] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  ახალი თემა
                </Link>
                <Link
                  href="/profile"
                  className={`hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                    pathname === '/profile'
                      ? 'border-[#ffb454] text-[#ffb454] bg-[#ffb454]/10'
                      : 'border-[#23334b] text-[#c0cce0] hover:border-[#ffb454]/50 hover:text-white'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  პროფილი
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-2.5 text-[#a9b8cd] hover:text-[#b63540] hover:bg-[#b63540]/10 rounded-xl transition-colors cursor-pointer"
                  title="გასვლა"
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
