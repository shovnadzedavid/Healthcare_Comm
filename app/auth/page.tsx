'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [profession, setProfession] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleOAuthLogin = async (provider: 'google' | 'linkedin_oidc') => {
    setSocialLoading(provider);
    setErrorMsg(null);
    setSuccessMsg(null);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message.includes('Invalid login') ? 'ელ-ფოსტა ან პაროლი არასწორია.' : error.message);
        setLoading(false);
      } else {
        router.push('/');
        router.refresh();
      }
    } else if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMsg('გთხოვთ მიუთითოთ სახელი და გვარი.');
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
        setLoading(false);
      } else if (data?.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            profession: profession.trim(),
            workplace: workplace.trim(),
            updated_at: new Date().toISOString(),
          });
        } catch (err) {
          console.error(err);
        }

        if (data.session) {
          router.push('/');
          router.refresh();
        } else {
          setSuccessMsg('რეგისტრაცია წარმატებულია! შეამოწმეთ ელ-ფოსტა ანგარიშის დასადასტურებლად.');
          setLoading(false);
        }
      }
    } else if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/profile` : undefined,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('აღდგენის ბმული გაგზავნილია თქვენს ელ-ფოსტაზე!');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-md bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl space-y-6">
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

        {mode !== 'forgot' && (
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={!!socialLoading || loading}
              className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {
