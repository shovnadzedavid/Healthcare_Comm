'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, CheckCircle, Briefcase, GraduationCap, Link as LinkIcon, Edit3, Save } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [fullName, setFullName] = useState('');
  const [profession, setProfession] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [bio, setBio] = useState('');
  const [orcidId, setOrcidId] = useState('');
  const [scholarUrl, setScholarUrl] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push('/auth');
      } else {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (prof) {
          setProfile(prof);
          setFullName(prof.full_name || '');
          setProfession(prof.profession || '');
          setWorkplace(prof.workplace || '');
          setBio(prof.bio || '');
          setOrcidId(prof.orcid_id || '');
          setScholarUrl(prof.google_scholar_url || '');
        }
        setLoading(false);
      }
    });
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        profession,
        workplace,
        bio,
        orcid_id: orcidId,
        google_scholar_url: scholarUrl,
      })
      .eq('id', profile.id);

    setSaving(false);
    if (!error) {
      setProfile({
        ...profile,
        full_name: fullName,
        profession,
        workplace,
        bio,
        orcid_id: orcidId,
        google_scholar_url: scholarUrl,
      });
      setIsEditing(false);
    } else {
      alert('შეცდომა: ' + error.message);
    }
  };

  if (loading) return <div className="py-12 text-center text-slate-500 animate-pulse">იტვირთება...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-600 to-teal-400 text-slate-950 font-bold text-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              {profile?.full_name?.[0] || 'H'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {profile?.full_name}
                </h1>
                {profile?.verified_badge && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">@{profile?.username} • {profile?.email}</p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="self-start sm:self-center px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-cyan-500 flex items-center gap-1.5 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditing ? 'გაუქმება' : 'რედაქტირება'}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 pt-6">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">სახელი და გვარი</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-cyan-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">სპეციალობა / მიმართულება</label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-cyan-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">სამუშაო ადგილი / ორგანიზაცია</label>
              <input
                type="text"
                value={workplace}
                onChange={(e) => setWorkplace(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-cyan-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">მოკლე ბიოგრაფია (Bio)</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-3 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-cyan-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">ORCID ID</label>
                <input
                  type="text"
                  value={orcidId}
                  onChange={(e) => setOrcidId(e.target.value)}
                  placeholder="0000-0002-1825-0097"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Google Scholar პროფილი</label>
                <input
                  type="text"
                  value={scholarUrl}
                  onChange={(e) => setScholarUrl(e.target.value)}
                  placeholder="https://scholar.google.com/..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all"
              >
                <Save className="w-4 h-4" />
                {saving ? 'ინახება...' : 'შენახვა'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 pt-6 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-cyan-500" /> სპეციალობა
                </span>
                <p className="font-semibold text-slate-900 dark:text-white">{profile?.profession || 'არ არის მითითებული'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-cyan-500" /> ორგანიზაცია
                </span>
                <p className="font-semibold text-slate-900 dark:text-white">{profile?.workplace || 'არ არის მითითებული'}</p>
              </div>
            </div>

            {profile?.bio && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">ბიოგრაფია</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Academic Profiles */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">
                აკადემიური იდენტიფიკატორები & პუბლიკაციები
              </span>
              <div className="flex flex-wrap gap-4 text-xs">
                {profile?.orcid_id ? (
                  <a
                    href={`https://orcid.org/${profile.orcid_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                  >
                    <LinkIcon className="w-3.5 h-3.5" /> ORCID: {profile.orcid_id}
                  </a>
                ) : (
                  <span className="text-slate-400">ORCID არ არის მითითებული</span>
                )}

                {profile?.google_scholar_url ? (
                  <a
                    href={profile.google_scholar_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-medium hover:underline"
                  >
                    <LinkIcon className="w-3.5 h-3.5" /> Google Scholar პროფილი
                  </a>
                ) : (
                  <span className="text-slate-400">Google Scholar არ არის მითითებული</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
