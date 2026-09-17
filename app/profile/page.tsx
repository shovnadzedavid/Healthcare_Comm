'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  CheckCircle, 
  Briefcase, 
  GraduationCap, 
  Link as LinkIcon, 
  Edit3, 
  Save, 
  Shield, 
  Sliders, 
  Type, 
  RotateCcw, 
  Eye, 
  Check 
} from 'lucide-react';

// საიტის ძირითადი ტექსტების ნაგულისხმევი სია
const DEFAULT_SITE_TEXTS: Record<string, string> = {
  'nav_home': 'მთავარი',
  'nav_discussions': 'დისკუსიები',
  'nav_blog': 'ბლოგი',
  'nav_directory': 'კოლეგები',
  'nav_messages': 'ჩატი',
  'home_banner_badge': 'პროფესიული სივრცე',
  'home_banner_title': 'HealthcareComm',
  'home_banner_desc': 'დახურული ქომუნითი ჯანდაცვის პოლიტიკის, მენეჯმენტის, ეპიდემიოლოგიისა და კვლევების სპეციალისტებისთვის. გაუზიარეთ მიგნებები და ითანამშრომლეთ კოლეგებთან.',
  'home_btn_discussion': '+ გახსენით დისკუსია',
  'home_btn_blog': '+ გამოაქვეყნეთ ბლოგი',
  'home_section_disc_title': 'ტოპ-5 აქტიური დისკუსია',
  'home_section_blog_title': 'ტოპ-5 ბლოგ-პოსტი & ანალიტიკა',
  'directory_title': 'კოლეგების დირექტორია',
  'directory_desc': 'მოძებნეთ და დაუკავშირდით ჯანდაცვის სფეროს სპეციალისტებს.',
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Admin Mode & CMS State
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [adminModeActive, setAdminModeActive] = useState(false);
  const [siteTexts, setSiteTexts] = useState<Record<string, string>>(DEFAULT_SITE_TEXTS);
  const [cmsSavedAlert, setCmsSavedAlert] = useState(false);

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
        router.push('/');
      } else {
        const currentUser = data.user;
        const isMasterAdmin = currentUser.email === 'shovnadzedavid@gmail.com';

        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (prof) {
          setProfile(prof);
          setFullName(prof.full_name || '');
          setProfession(prof.profession || '');
          setWorkplace(prof.workplace || '');
          setBio(prof.bio || '');
          setOrcidId(prof.orcid_id || '');
          setScholarUrl(prof.google_scholar_url || '');

          if (isMasterAdmin || prof.is_admin) {
            setIsAdminUser(true);
          }
        } else if (isMasterAdmin) {
          setIsAdminUser(true);
        }

        // Load saved admin mode and CMS texts from localStorage
        if (typeof window !== 'undefined') {
          const savedAdminMode = localStorage.getItem('hc_admin_cms_mode') === 'true';
          setAdminModeActive(savedAdminMode);

          const savedTexts = localStorage.getItem('hc_site_texts');
          if (savedTexts) {
            try {
              setSiteTexts({ ...DEFAULT_SITE_TEXTS, ...JSON.parse(savedTexts) });
            } catch {}
          }
        }
        setLoading(false);
      }
    });
  }, [router]);

  // Toggle Admin Interface
  const handleToggleAdminMode = (enable: boolean) => {
    setAdminModeActive(enable);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hc_admin_cms_mode', enable ? 'true' : 'false');
    }
  };

  // Update a specific text key in the CMS dictionary
  const handleTextChange = (key: string, value: string) => {
    const updated = { ...siteTexts, [key]: value };
    setSiteTexts(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hc_site_texts', JSON.stringify(updated));
    }
    setCmsSavedAlert(true);
    setTimeout(() => setCmsSavedAlert(false), 2000);
  };

  // Reset CMS texts to default
  const handleResetCms = () => {
    if (!window.confirm('დარწმუნებული ხართ, რომ გსურთ საიტის ყველა ტექსტის პირვანდელ მდგომარეობაში დაბრუნება?')) return;
    setSiteTexts(DEFAULT_SITE_TEXTS);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hc_site_texts', JSON.stringify(DEFAULT_SITE_TEXTS));
    }
    alert('ტექსტები დაბრუნდა პირვანდელ მდგომარეობაზე!');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
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

  if (loading) return <div className="py-12 text-center text-slate-500 animate-pulse text-xs">იტვირთება...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* 1. ADMIN MODE SELECTOR CARD (თუ ადმინია) */}
      {isAdminUser && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">ინტერფეისის & ადმინ რეჟიმის მართვა</h2>
                <p className="text-xs text-slate-300">
                  აირჩიეთ, როგორ გსურთ საიტის დათვალიერება და მართვა
                </p>
              </div>
            </div>

            {/* Mode Switch Buttons */}
            <div className="inline-flex p-1 bg-slate-950 rounded-2xl border border-slate-800 self-start sm:self-center">
              <button
                type="button"
                onClick={() => handleToggleAdminMode(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  !adminModeActive
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                მომხმარებლის ხედი
              </button>
              <button
                type="button"
                onClick={() => handleToggleAdminMode(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminModeActive
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                ადმინისტრატორი (Live CMS)
              </button>
            </div>
          </div>

          {/* VISUAL CMS TEXT MANAGER (როცა ადმინია ჩართული) */}
          {adminModeActive && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  <Type className="w-4 h-4" />
                  საიტის ტექსტების, სათაურებისა და სახელების რედაქტორი
                </div>
                <div className="flex items-center gap-3">
                  {cmsSavedAlert && (
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                      <Check className="w-3.5 h-3.5" /> შენახულია!
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleResetCms}
                    className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> ნაგულისხმევზე დაბრუნება
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300">
                ქვემოთ შეგიძლიათ შეცვალოთ საიტის ნებისმიერი ტექსტი, ღილაკი ან სათაური. ცვლილება ავტომატურად აისახება მთელ საიტზე:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
                {Object.entries(siteTexts).map(([key, value]) => (
                  <div key={key} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] text-cyan-400 font-mono block truncate">
                      {key}
                    </span>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleTextChange(key, e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. MAIN USER PROFILE CARD */}
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
            className="self-start sm:self-center px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-cyan-500 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditing ? 'გაუქმება' : 'პროფილის რედაქტირება'}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-6">
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
                className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
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
                <span className="text-xs text-slate-4
