'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  LogOut, 
  LogIn, 
  Moon, 
  Sun,
  Plus
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
    { name: '🔥 ჰაბი', href: '/' },
    { name: '💡 დისკუსიები', href: '/discussions' },
    { name: '📑 ბლოგი & Briefs', href: '/blog' },
    { name: '💬 ჩატი', href: '/messages' },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#0c101c]/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Playful Tech Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-[2px] shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-sm text-transparent bg-clip-text bg-gradient-to-tr from-indigo-300 via-purple-200 to-cyan-300">
                  H+
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Healthcare<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-400">Comm</span>
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  Academic Network
                </span>
              </div>
            </Link>
          </div>

          {/* Nav Pills */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100/80 dark:bg-[#14192b]/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            {/* Quick Search Pill */}
            <Link
              href="/discussions"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#14192b] border border-slate-200 dark:border-slate-800 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <span>🔍 ძიება...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-slate-500">
                ⌘K
              </kbd>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              title="თემის შეცვლა"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {user ? (
              <>
                <Link
                  href="/discussions/new"
                  className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  ახალი თემა
                </Link>
                <Link
                  href="/profile"
                  className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                    pathname === '/profile'
                      ? 'border-indigo-500 text-indigo-500 bg-indigo-500/10'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-400 bg-slate-100/50 dark:bg-[#14192b]'
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-extrabold shadow-xs">
                    {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <span>{profile?.full_name ? profile.full_name.split(' ')[0] : 'პროფილი'}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                  title="გამოსვლა"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                href="/"
                className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 hover:opacity-95 transition-all"
              >
                <LogIn className="w-4 h-4" />
                შესვლა
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
