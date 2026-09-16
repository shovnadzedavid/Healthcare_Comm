'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import UserCardModal from '@/components/UserCardModal';
import { 
  User as UserIcon, 
  Building2, 
  GraduationCap, 
  ShieldCheck, 
  Users, 
  Save, 
  Loader2, 
  Send, 
  Check, 
  Sparkles
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form inputs
  const [fullName, setFullName] = useState('');
  const [profession, setProfession] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [bio, setBio] = useState('');

  // Selected colleague for modal
  const [selectedColleague, setSelectedColleague] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error || !data?.user) {
        router.push('/auth');
      } else {
        setCurrentUser(data.user);
        await fetchProfileAndContacts(data.user.id);
      }
    });
  }, [router]);

  const fetchProfileAndContacts = async (userId: string) => {
    setLoading(true);
    try {
      // 1. Fetch own profile
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profData) {
        setProfile(profData);
        setFullName(profData.full_name || '');
        setProfession(profData.profession || '');
        setWorkplace(profData.workplace || '');
        setBio(profData.bio || '');
      }

      // 2. Fetch confirmed contacts
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('user_id, contact_id, status')
        .eq('status', 'accepted')
        .or(`user_id.eq.${userId},contact_id.eq.${userId}`);

      const partnerIds = new Set<string>();
      contactsData?.forEach((c: any) => {
        if (c.user_id === userId && c.contact_id !== userId) partnerIds.add(c.contact_id);
        if (c.contact_id === userId && c.user_id !== userId) partnerIds.add(c.user_id);
      });

      if (partnerIds.size > 0) {
        const { data: profilesList } = await supabase
          .from('profiles')
          .select('id, full_name, profession, workplace, verified_badge, bio')
          .in('id', Array.from(partnerIds));

        if (profilesList) {
          setContacts(profilesList);
        }
      } else {
        setContacts([]);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSaving(true);
    setFeedback(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        profession: profession.trim(),
        workplace: workplace.trim(),
        bio: bio.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentUser.id);

    setSaving(false);

    if (error) {
      setFeedback({ type: 'error', message: 'მონაცემების შენახვა ვერ მოხერხდა: ' + error.message });
    } else {
      setProfile((prev: any) => ({
        ...prev,
        full_name: fullName.trim(),
        profession: profession.trim(),
        workplace: workplace.trim(),
        bio: bio.trim(),
      }));
      setFeedback({ type: 'success', message: 'პროფილი წარმატებით განახლდა!' });
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // Completion Percentage calculation
  const completionPercentage = useMemo(() => {
    let score = 0;
    if (fullName.trim()) score += 25;
    if (profession.trim()) score += 25;
    if (workplace.trim()) score += 25;
    if (bio.trim()) score += 25;
    return score;
  }, [fullName, profession, workplace, bio]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        <p className="text-xs font-semibold">იტვირთება პროფილი...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-navy-950 to-slate-900 border border-slate-800 p-7 sm:p-10 shadow-xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-blue-600 p-[3px] shadow-lg shadow-cyan-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[21px] flex items-center justify-center font-black text-3xl sm:text-4xl text-white">
              {fullName?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>

          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {fullName || 'ანონიმური მომხმარებელი'}
              </h1>
              {profile?.verified_badge && (
                <span title="ვერიფიცირებული საზოგადოებრივი ჯანდაცვისა და პოლიტიკის ექსპერტი">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm font-semibold text-cyan-400 flex items-center justify-center sm:justify-start gap-1.5">
              <GraduationCap className="w-4 h-4" />
              <span>{profession || 'სპეციალობა მითითებული არ არის'}</span>
            </p>

            <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>{workplace || 'სამუშაო ადგილი / ინსტიტუცია მითითებული არ არის'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Profile Completion Bar */}
      <div className="p-6 bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
              პროფილის შევსების ინდიკატორი
            </h3>
          </div>
          <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
            completionPercentage === 100 
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
              : 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400'
          }`}>
            {completionPercentage}%
          </span>
        </div>

        {/* Progress Track */}
        <div className="w-full h-2.5 bg-slate-100 dark:bg-navy-950 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              completionPercentage === 100 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                : 'bg-gradient-to-r from-cyan-500 to-teal-500'
            }`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          {completionPercentage === 100 
            ? 'თქვენი პროფილი სრულყოფილად არის შევსებული. კოლეგებს აქვთ სრული წარმოდგენა თქვენს გამოცდილებაზე.' 
            : 'შეავსეთ ბიოგრაფია, სპეციალობა და სამუშაო ადგილი, რათა კოლეგებს გაუადვილდეთ თქვენთან დაკავშირება.'}
        </p>
      </div>

      {/* Grid: Edit Profile Form + Confirmed Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Edit Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <UserIcon className="w-5 h-5 text-cyan-500" />
              <h2 className="font-black text-base text-slate-900 dark:text-white">
                პროფილის რედაქტირება
              </h2>
            </div>

            {feedback && (
              <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between border ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
              }`}>
                <div className="flex items-center gap-2">
                  {feedback.type === 'success' ? <Check className="w-4 h-4" /> : '⚠️'}
                  <span>{feedback.message}</span>
                </div>
                <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100 cursor-pointer">✕</button>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  სრული სახელი და გვარი
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="მაგ. დავით შოვნაძე"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-slate-900 dark:text-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  აკადემიური წოდება / სპეციალობა
                </label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="მაგ. ჯანდაცვის მენეჯერი / მოწვეული ლექტორი"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-slate-900 dark:text-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  ორგანიზაცია / უნივერსიტეტი / ინსტიტუცია
                </label>
                <input
                  type="text"
                  value={workplace}
                  onChange={(e) => setWorkplace(e.target.value)}
                  placeholder="მაგ. კავკასიის უნივერსიტეტი / ქირურგიის ეროვნული ცენტრი"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-slate-900 dark:text-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  მოკლე ბიოგრაფია & კვლევითი ინტერესები
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="აღწერეთ თქვენი გამოცდილება, საზოგადოებრივი ჯანმრთელობისა და პოლიტიკის მიმართულებები..."
                  className="w-full p-4 text-xs sm:text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-slate-900 dark:text-white transition-all placeholder-slate-400"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-500 hover:opacity-95 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'ინახება...' : 'შენახვა'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Confirmed Contacts List */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-500" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  ჩემი კოლეგები ({contacts.length})
                </h3>
              </div>
              <Link href="/messages" className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline">
                ყველა ჩატი
              </Link>
            </div>

            {contacts.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  კონტაქტები ჯერ არ გაქვთ
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ჩაერთეთ დისკუსიებში ან ბლოგში, რათა გაიცნოთ და დაუკავშირდეთ კოლეგებს.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 bg-slate-50 dark:bg-navy-950/60 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 hover:border-cyan-500/30 transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedColleague(c)}
                      className="flex items-center gap-3 text-left min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs border border-cyan-500/30 shrink-0">
                        {c.full_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {c.full_name}
                          </span>
                          {c.verified_badge && <ShieldCheck className="w-3 h-3 text-cyan-500 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          {c.profession || c.workplace || 'სპეციალისტი'}
                        </p>
                      </div>
                    </button>

                    <Link
                      href={`/messages?user=${c.id}`}
                      className="p-2 bg-white dark:bg-navy-900 hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shrink-0"
                      title="ჩატის გახსნა"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Colleague Modal */}
      <UserCardModal
        isOpen={!!selectedColleague}
        onClose={() => setSelectedColleague(null)}
        user={selectedColleague}
      />
    </div>
  );
}
