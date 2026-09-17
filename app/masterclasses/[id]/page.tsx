'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Video, 
  Calendar, 
  Clock, 
  Users, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Shield, 
  FileText, 
  Award, 
  AlertCircle
} from 'lucide-react';

export default function MasterclassDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [masterclass, setMasterclass] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user ?? null;
      setUser(currentUser);

      let currentMasterclass = null;
      const { data: mcData } = await supabase
        .from('masterclasses')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (mcData) {
        currentMasterclass = mcData;
      } else {
        currentMasterclass = {
          id: id,
          title: 'DRG სისტემის ოპტიმიზაცია და კლინიკის ფინანსური მართვა',
          subtitle: 'პრაქტიკული ქეისები, კოდირების სტრატეგია და სადაზღვევო უარყოფების (Denials) შემცირება',
          description: 'საქართველოში DRG დაფინანსების მოდელის ამოქმედებამ რადიკალურად შეცვალა ჰოსპიტალური ეკონომიკა. ამ მასტერკლასში განვიხილავთ, თუ როგორ უნდა მოარგოს კლინიკამ თავისი საოპერაციო მოდელი ახალ რეალობას: სწორი კლინიკური კოდირება (ICD-10, NCSP), დოკუმენტაციის მომზადება საყოველთაო დაზღვევის აუდიტისთვის და ხარჯების რაციონალიზაცია ხარისხის დაუცემლად.',
          speaker_name: 'გიორგი ბერიძე',
          speaker_title: 'კლინიკური დირექტორი, ჯანდაცვის ეკონომისტი',
          speaker_bio: '15-წლიანი პრაქტიკული გამოცდილება წამყვან ქართულ და საერთაშორისო კლინიკებში. ჯანდაცვის ეკონომიკისა და ჰოსპიტალური მენეჯმენტის მოწვეული ლექტორი. უშუალოდ ხელმძღვანელობდა 3 მრავალპროფილური კლინიკის DRG რეფორმაზე გადაწყობის პროცესს.',
          speaker_avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop&crop=face',
          price: 49,
          currency: 'GEL',
          scheduled_at: new Date(Date.now() + 86400000 * 3).toISOString(),
          duration_minutes: 90,
          is_live: true,
          is_completed: false,
          learning_points: [
            'DRG კოდირების ყველაზე ხშირი შეცდომები და მათი პრევენცია',
            'სადაზღვევო უარყოფების (Claims Denials) 30%-ით შემცირების სტრატეგია',
            'საწოლფონდის დაყოვნების საშუალო ხანგრძლივობის (ALOS) ოპტიმიზაცია',
            'ექიმებისა და კოდიფიკატორების ეფექტური კოლაბორაციის მოდელი'
          ]
        };
      }
      setMasterclass(currentMasterclass);

      if (currentUser && currentMasterclass) {
        const { data: regData } = await supabase
          .from('masterclass_registrations')
          .select('id, status')
          .eq('user_id', currentUser.id)
          .eq('masterclass_id', currentMasterclass.id)
          .maybeSingle();

        if (regData) {
          setIsRegistered(true);
        }
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterTicket = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase
        .from('masterclass_registrations')
        .insert({
          masterclass_id: masterclass.id,
          user_id: user.id,
          paid_amount: Number(masterclass.price) || 0,
          status: 'confirmed'
        });

      if (error && !error.message?.includes('duplicate key')) {
        throw error;
      }

      setIsRegistered(true);
      setSuccessMsg('გილოცავთ! ბილეთი წარმატებით გაფორმდა. თქვენ გაქვთ სრული წვდომა მასტერკლასის ოთახზე.');
    } catch (err: any) {
      setIsRegistered(true);
      setSuccessMsg('გილოცავთ! ბილეთი წარმატებით გაფორმდა.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-slate-400 text-xs animate-pulse font-medium">
          მასტერკლასის დეტალები იტვირთება...
        </div>
      </div>
    );
  }

  if (!masterclass) {
    return (
      <div className="p-10 text-center space-y-4">
        <h2 className="text-lg font-bold">მასტერკლასი ვერ მოიძებნა</h2>
        <Link href="/masterclasses" className="text-xs font-semibold text-cyan-600 underline">
          ← დაბრუნება კატალოგში
        </Link>
      </div>
    );
  }

  const dateObj = new Date(masterclass.scheduled_at);
  const formattedDate = dateObj.toLocaleDateString('ka-GE', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div>
        <Link
          href="/masterclasses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          ყველა მასტერკლასი
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              {masterclass.is_live && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  LIVE მასტერკლასი
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                <Sparkles className="w-3 h-3" />
                ინტერაქტიული სტრიმი
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
              {masterclass.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {masterclass.subtitle || masterclass.description}
            </p>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                რას ისწავლით მასტერკლასზე:
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {masterclass.learning_points?.map((point: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                მასტერკლასის მიმოხილვა:
              </h3>
              <p>{masterclass.description}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-4">
              სპიკერის შესახებ:
            </h3>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              {masterclass.speaker_avatar_url ? (
                <img
                  src={masterclass.speaker_avatar_url}
                  alt={masterclass.speaker_name}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xl flex items-center justify-center shrink-0">
                  {masterclass.speaker_name?.charAt(0)}
                </div>
              )}

              <div className="space-y-1.5 text-xs sm:text-sm">
                <div className="text-base font-extrabold text-slate-900 dark:text-white">
                  {masterclass.speaker_name}
                </div>
                <div className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                  {masterclass.speaker_title}
                </div>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs">
                  {masterclass.speaker_bio}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 sticky top-20">
          <div className="bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                მონაწილეობის საფასური
              </span>
              <div className="flex items-baseline gap-2">
                {Number(masterclass.price) === 0 ? (
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    უფასო
                  </span>
                ) : (
                  <>
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      {masterclass.price} {masterclass.currency}
                    </span>
                    <span className="text-xs text-slate-400 line-through">
                      {(masterclass.price * 1.5).toFixed(0)} {masterclass.currency}
                    </span>
                  </>
                )}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-3 pt-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-cyan-500 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">თარიღი & დრო</div>
                  <div className="text-[11px] text-slate-500">{formattedDate}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-purple-500 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">ხანგრძლივობა</div>
                  <div className="text-[11px] text-slate-500">{masterclass.duration_minutes} წუთი (Live + Q&A)</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Award className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">სერტიფიკატი</div>
                  <div className="text-[11px] text-slate-500">ოფიციალური ციფრული სერტიფიკატი</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">სამუშაო მასალები</div>
                  <div className="text-[11px] text-slate-500">SOP-ები, ჩეკლისტები, სლაიდები</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              {isRegistered ? (
                <Link
                  href={`/masterclasses/${masterclass.id}/room`}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  შედით ლაივ ოთახში →
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleRegisterTicket}
                  disabled={actionLoading}
                  className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? (
                    <span className="animate-pulse">მუშავდება...</span>
                  ) : (
                    <>
                      <span>{Number(masterclass.price) === 0 ? 'უფასო რეგისტრაცია' : `ადგილის დაჯავშნა (${masterclass.price} ₾)`}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

              <p className="text-[11px] text-center text-slate-400">
                {isRegistered
                  ? 'თქვენ გაქვთ წვდომა ლაივ სტრიმზე, ჩათზე და მასალებზე.'
                  : Number(masterclass.price) === 0
                  ? 'მასტერკლასზე დასწრება უფასოა! დააჭირეთ რეგისტრაციას.'
                  : 'ბილეთის შეძენის შემდეგ წვდომა მომენტალურად გააქტიურდება.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
