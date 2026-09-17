'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogIn, UserPlus, AlertCircle, CheckCircle2, Shield } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [profession, setProfession] = useState('საზოგადოებრივი ჯანდაცვა');
  const [workplace, setWorkplace] = useState('');

  // თუ მომხმარებელი უკვე შესულია, გადაიყვანს დისკუსიებზე
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        router.push('/discussions');
      }
    });
  }, [router]);

  const handleOAuthLogin = async (provider: 'google' | 'linkedin_oidc') => {
    try {
      setSocialLoading(provider);
      setErrorMsg('');
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/discussions` : undefined;
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
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        router.push('/discussions');
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
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 p-6 sm:p-8 bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl transition-all">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 text-cyan-500 mb-3">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Healthcare<span className="text-cyan-500">Comm</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          დახურული სივრცე ჯანდაცვის სფეროს სპეციალისტებისთვის
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Social Login Buttons (Google & LinkedIn) */}
      <div className="mb-5 space-y-2.5">
        <button
          type="button"
          onClick={() => handleOAuthLogin('google')}
          disabled={!!socialLoading || loading}
          className="w-full py-2.5 px-4 bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
          </svg>
          <span>{socialLoading === 'google' ? 'გადამისამართება Google-ზე...' : 'Google-ით ავტორიზაცია'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleOAuthLogin('linkedin_oidc')}
          disabled={!!socialLoading || loading}
          className="w-full py-2.5 px-4 bg-[#0A66C2] hover:bg-[#004182] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.63 1.63 0 1 0 0-3.25 1.63 1.63 0 0 0 0 3.25m1.39 9.74V9.95H5.07v8.55h2.78z" />
          </svg>
          <span>{socialLoading === 'linkedin_oidc' ? 'გადამისამართება LinkedIn-ზე...' : 'LinkedIn-ით ავტორიზაცია'}</span>
        </button>

        <div className="relative flex items-center justify-center my-4">
          <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          <span className="absolute bg-white dark:bg-navy-900 px-3 text-[11px] text-slate-400 uppercase tracking-wider">
            ან ელ-ფოსტით
          </span>
        </div>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        {!isLogin && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                სახელი და გვარი *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="მაგ. გიორგი ბერიძე"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                მომხმარებლის სახელი (USERNAME) *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="giorgi_beridze"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                დაბადების თარიღი (კალენდარი) *
              </label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                მიმართულება / სპეციალობა *
              </label>
              <select
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
              >
                <option value="საზოგადოებრივი ჯანდაცვა">საზოგადოებრივი ჯანდაცვა</option>
                <option value="ჯანდაცვის პოლიტიკა">ჯანდაცვის პოლიტიკა</option>
                <option value="ჯანდაცვის მენეჯმენტი">ჯანდაცვის მენეჯმენტი</option>
                <option value="ეპიდემიოლოგია და ბიოსტატისტიკა">ეპიდემიოლოგია და ბიოსტატისტიკა</option>
                <option value="კვლევა და ანალიტიკა">კვლევა და ანალიტიკა</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                სამუშაო ადგილი / ორგანიზაცია
              </label>
              <input
                type="text"
                value={workplace}
                onChange={(e) => setWorkplace(e.target.value)}
                placeholder="მაგ. უნივერსიტეტი, კვლევითი ცენტრი"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            ელ-ფოსტა *
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@health.ge"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            პაროლი *
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
          />
        </div>

        {!isLogin && (
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              პაროლის დადასტურება *
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <span className="animate-pulse">მუშავდება...</span>
          ) : isLogin ? (
            <>
              <LogIn className="w-4 h-4" />
              შესვლა პლატფორმაზე
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              რეგისტრაციის დასრულება
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        {isLogin ? (
          <button
            type="button"
            onClick={() => { setIsLogin(false); setErrorMsg(''); setSuccessMsg(''); }}
            className="text-xs text-slate-500 hover:text-cyan-500 transition-colors cursor-pointer"
          >
            არ გაქვთ ანგარიში? <span className="font-semibold text-cyan-600 dark:text-cyan-400">გაიარეთ რეგისტრაცია</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { setIsLogin(true); setErrorMsg(''); setSuccessMsg(''); }}
            className="text-xs text-slate-500 hover:text-cyan-500 transition-colors cursor-pointer"
          >
            უკვე გაქვთ ანგარიში? <span className="font-semibold text-cyan-600 dark:text-cyan-400">შედით სისტემაში</span>
          </button>
        )}
      </div>
    </div>
  );
}
