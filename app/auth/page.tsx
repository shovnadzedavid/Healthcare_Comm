'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  GraduationCap, 
  Loader2, 
  ArrowRight, 
  Check, 
  AlertCircle,
  Eye,
  EyeOff,
  Building2
} from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [profession, setProfession] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // OAuth Login (Google / LinkedIn)
  const handleOAuthLogin = async (provider: 'google' | 'linkedin_oidc') => {
    setSocialLoading(provider);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setSocialLoading(null);
      }
    } catch (err: any) {
      setErrorMsg('ავტორიზაციის შეცდომა: ' + (err.message || 'სცადეთ მოგვიანებით'));
      setSocialLoading(null);
    }
  };

  // Email / Password Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrorMsg('ელ-ფოსტა ან პაროლი არასწორია.');
          } else {
            setErrorMsg(error.message);
          }
        } else {
          router.push('/');
          router.refresh();
        }
      } else if (mode === 'signup') {
        if (!fullName.trim()) {
          setErrorMsg('გთხოვთ მიუთითოთ თქვენი სახელი და გვარი.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              profession: profession.trim(),
              workplace: workplace.trim(),
            },
          },
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data?.user) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              full_name: fullName.trim(),
              profession: profession.trim(),
              workplace: workplace.trim(),
              updated_at: new Date().toISOString(),
            });
          } catch (e) {
            console.error('Profile upsert note:', e);
          }

          if (data.session) {
            router.push('/');
            router.refresh();
          } else {
            setSuccessMsg('რეგისტრაცია წარმატებულია! გთხოვთ შეამოწმოთ თქვენი ელ-ფოსტა და დაადასტუროთ ანგარიში.');
          }
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/profile` : undefined,
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('პაროლის აღდგენის ბმული გაგზავნილია თქვენს ელ-ფოსტაზე!');
        }
      }
    } catch (err: any) {
      setErrorMsg('შეცდომა: ' + (err.message || 'სცადეთ თავიდან'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-md bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-amber-400 p-[2px] shadow-lg shadow-cyan-500/20 mb-1">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-xl text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-amber-300">
              H
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {mode === 'signin' && 'სისტემაში შესვლა'}
            {mode === 'signup' && 'საზოგადოებაში გაწევრიანება'}
            {mode === 'forgot' && 'პაროლის აღდგენა'}
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            {mode === 'signin' && 'ჯანდაცვის პოლიტიკისა და მართვის აკადემიური პლატფორმა'}
            {mode === 'signup' && 'შექმენით თქვენი აკადემიური პროფილი და ჩაერთეთ საპოლიტიკო დიალოგში'}
            {mode === 'forgot' && 'შეიყვანეთ თქვენი ელ-ფოსტა და მიიღეთ აღდგენის ბმული'}
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Social Logins */}
        {mode !== 'forgot' && (
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={!!socialLoading || loading}
              className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {socialLoading === 'google' ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
              )}
              <span>Google-ით შესვლა</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuthLogin('linkedin_oidc')}
              disabled={!!socialLoading || loading}
              className="w-full py-3 px-4 rounded-2xl bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-md shadow-[#0A66C2]/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {socialLoading === 'linkedin_oidc' ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.63 1.63 0 1 0 0-3.25 1.63 1.63 0 0 0 0 3.25m1.39 9.74V9.95H5.07v8.55h2.78z" />
                </svg>
              )}
              <span>LinkedIn-ით შესვლა</span>
            </button>

            <div className="relative flex items-center justify-center py-2">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              <span className="absolute bg-white dark:bg-navy-900 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                ან ელ-ფოსტით
              </span>
            </div>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  სრული სახელი და გვარი
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="დავით შოვნაძე"
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-slate-900 dark:text-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  სპეციალობა / აკადემიური პოზიცია
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder="მაგ. ჯანდაცვის მენეჯერი / მკვლევარი"
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-slate-900 dark:text-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ორგანიზაცია / უნივერსიტეტი
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={workplace}
                    onChange={(e) => setWorkplace(e.target.value)}
                    placeholder="მაგ. კავკასიის უნივერსიტეტი"
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-slate-900 dark:text-white transition-all"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ელ-ფოსტა
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="სახელი@ორგანიზაცია.ge"
                required
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-slate-900 dark:text-white transition-all"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  პაროლი
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline cursor-pointer"
                  >
                    დაგავიწყდათ პაროლი?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="მინიმუმ 6 სიმბოლო"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-slate-900 dark:text-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !!socialLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-teal-500 hover:opacity-95 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'signin' && 'შესვლა'}
                  {mode === 'signup' && 'რეგისტრაცია'}
                  {mode === 'forgot' && 'აღდგენის ბმულის გაგზავნა'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Mode Switcher */}
        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
          {mode === 'signin' && (
            <p>
              ჯერ არ გაქვთ პროფილი?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
              >
                დარეგისტრირდით
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p>
              უკვე დარეგისტრირებული ხართ?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
              >
                შედით სისტემაში
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <p>
              გაიხსენეთ პაროლი?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
              >
                უკან შესვლაზე
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
