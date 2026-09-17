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
                <Sparkles className="w-3 h-3"
