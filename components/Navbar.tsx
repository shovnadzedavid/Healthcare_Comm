'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Home, 
  MessageSquare, 
  BookOpen, 
  Send, 
  LogOut, 
  LogIn, 
  Moon, 
  Sun,
  Plus,
  Search
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isDark, setIsDark] = useState<boolean>(true);

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
        supabase.from('profiles').select('full_name, profession, verified_badge').eq('id', data.user.id).single().then(({ data: p }) => {
          if (p) setProfile(p);
        });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('profiles').select('full_name, profession, verified_badge').eq('id', session.user.id).single().then(({ data: p }) => {
          if (p) setProfile(p);
        });
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-[#090d16]/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center font-bold text-sm tracking-tighter transition-transform group-hover:scale-105">
                HC
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Healthcare<span className="text-indigo-600 dark:text-indigo-400 font-medium">Comm</span>
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                  Health Policy & Management
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links (მთავარი, დისკუსიები, ბლოგი, ჩატი) */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2.5">
            {/* Quick Search */}
            <Link
              href="/discussions"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>ძიება...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-slate-400">
                ⌘K
              </kbd>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="თემის შეცვლა"
            >
              {isDark ? <Sun className="w-4 h-4 text-slate-300" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {user ? (
              <>
                <Link
                  href="/discussions/new"
                  className="hidden sm:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  ახალი დისკუსია
                </Link>
                <Link
                  href="/profile"
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    pathname === '/profile'
                      ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 text-[10px] font-bold">
                    {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <span>{profile?.full_name ? profile.full_name.split(' ')[0] : 'პროფილი'}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                  title="გამოსვლა"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                შესვლა
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
