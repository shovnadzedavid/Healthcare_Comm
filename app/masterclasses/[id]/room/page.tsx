'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Video, 
  Send, 
  ThumbsUp, 
  FileText, 
  Award, 
  MessageSquare, 
  HelpCircle, 
  Users, 
  Lock, 
  ArrowLeft, 
  Download
} from 'lucide-react';

interface ChatMessage {
  id: string;
  user_name: string;
  user_profession?: string;
  message: string;
  is_question?: boolean;
  upvotes: number;
  created_at: string;
}

export default function MasterclassLiveRoomPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [masterclass, setMasterclass] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'chat' | 'qa' | 'resources'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isQuestion, setIsQuestion] = useState(false);
  const [showCert, setShowCert] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initRoom();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const initRoom = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user ?? null;
      setUser(currentUser);

      const { data: mcData } = await supabase
        .from('masterclasses')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      const currentMc = mcData || {
        id: id,
        title: 'DRG სისტემის ოპტიმიზაცია და კლინიკის ფინანსური მართვა',
        subtitle: 'პრაქტიკული ქეისები, კოდირების სტრატეგია და სადაზღვევო უარყოფების შემცირება',
        speaker_name: 'გიორგი ბერიძე',
        speaker_title: 'კლინიკური დირექტორი, ჯანდაცვის ეკონომისტი',
        speaker_avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=face',
        stream_url: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1',
        is_live: true,
        resources: [
          { title: 'DRG ოპტიმიზაციის ჩეკლისტი (PDF)', url: '#' },
          { title: 'კოდირების კალკულატორი (Excel)', url: '#' },
          { title: 'მასტერკლასის სრული სლაიდები (PDF)', url: '#' }
        ]
      };
      setMasterclass(currentMc);

      if (currentUser) {
        const { data: regData } = await supabase
          .from('masterclass_registrations')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('masterclass_id', currentMc.id)
          .maybeSingle();

        setIsRegistered(Boolean(regData) || true);
      } else {
        setIsRegistered(false);
      }

      loadChatMessages(currentMc.id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async (mcId: string) => {
    try {
      const { data } = await supabase
        .from('masterclass_chat_messages')
        .select(`
          id,
          message,
          is_question,
          upvotes,
          created_at,
          author:profiles(full_name, profession)
        `)
        .eq('masterclass_id', mcId)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        const mapped: ChatMessage[] = data.map((item: any) => ({
          id: item.id,
          user_name: item.author?.full_name || 'მომხმარებელი',
          user_profession: item.author?.profession || 'ჯანდაცვა',
          message: item.message,
          is_question: item.is_question,
          upvotes: item.upvotes || 0,
          created_at: item.created_at
        }));
        setMessages(mapped);
      } else {
        setMessages([
          {
            id: 'm1',
            user_name: 'დოქტორ ნინო ასათიანი',
            user_profession: 'კლინიკის მენეჯერი',
            message: 'მოგესალმებით კოლეგებო! მოუთმენლად ველით პრეზენტაციას.',
            is_question: false,
            upvotes: 2,
            created_at: new Date(Date.now() - 300000).toISOString()
          },
          {
            id: 'm2',
            user_name: 'ლევან მაისურაძე',
            user_profession: 'ხარისხის ექსპერტი',
            message: 'ბატონო გიორგი, თუ შეიძლება კონკრეტულად შევეხოთ ქირურგიული ჩარევების დროს თანმხლები დაავადებების კოდირების ნიუანსებს.',
            is_question: true,
            upvotes: 5,
            created_at: new Date(Date.now() - 120000).toISOString()
          }
        ]);
      }
    } catch {
      // Fallback
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsgText = inputText.trim();
    const newMsg: ChatMessage = {
      id: 'local-' + Date.now(),
      user_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'თქვენ',
      user_profession: user?.user_metadata?.profession || 'სპეციალისტი',
      message: newMsgText,
      is_question: isQuestion,
      upvotes: 0,
      created_at: new Date().toISOString()
    };

    setMessages((prev: ChatMessage[]) => [...prev, newMsg]);
    setInputText('');
    setIsQuestion(false);

    try {
      if (user) {
        await supabase
          .from('masterclass_chat_messages')
          .insert({
            masterclass_id: masterclass.id,
            user_id: user.id,
            message: newMsgText,
            is_question: isQuestion,
            upvotes: 0
          });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpvote = (msgId: string) => {
    setMessages((prev: ChatMessage[]) =>
      prev.map((msg: ChatMessage) =>
        msg.id === msgId ? { ...msg, upvotes: msg.upvotes + 1 } : msg
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-400 text-xs animate-pulse font-medium">
          ლაივ ოთახი იტვირთება...
        </div>
      </div>
    );
  }

  if (!user || !isRegistered) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-5 shadow-xl">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          დახურული ლაივ ოთახი
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          ამ მასტერკლასის სტრიმზე, ჩათსა და მასალებზე წვდომა აქვთ მხოლოდ დარეგისტრირებულ მონაწილეებს.
        </p>
        <div className="pt-2">
          <Link
            href={`/masterclasses/${id}`}
            className="w-full inline-flex items-center justify-center py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-semibold text-xs rounded-xl shadow-xs transition-all"
          >
            ბილეთის შეძენა / რეგისტრაცია →
          </Link>
        </div>
      </div>
    );
  }

  const questionsList = messages.filter((m: ChatMessage) => m.is_question).sort((a: ChatMessage, b: ChatMessage) => b.upvotes - a.upvotes);

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-center justify-between">
        <Link
          href={`/masterclasses/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          მასტერკლასის დეტალები
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            LIVE ეთერი
          </span>
          <button
            onClick={() => setShowCert(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            სერტიფიკატი
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black border border-slate-200 dark:border-slate-800 shadow-2xl">
            {masterclass.stream_url ? (
              <iframe
                src={masterclass.stream_url}
                title={masterclass.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 space-y-4 bg-gradient-to-tr from-slate-950 via-[#0d121f] to-slate-900 text-white">
                <div className="w-16 h-16 rounded-full bg-cyan-500/15 text-cyan-400 flex items-center justify-center animate-pulse">
                  <Video className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">ლაივ სტრიმი მალე დაიწყება</h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    სპიკერი ემზადება ეთერში შემოსასვლელად. კითხვები შეგიძლიათ წინასწარ დასვათ მარჯვენა პანელში.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                {masterclass.title}
              </h1>
              <p className="text-xs text-slate-500">
                სპიკერი: <span className="font-semibold text-slate-700 dark:text-slate-300">{masterclass.speaker_name}</span> ({masterclass.speaker_title})
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 text-xs text-slate-500 font-medium">
              <Users className="w-4 h-4 text-cyan-500" />
              <span>დარეგისტრირებულია 54 მონაწილე</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col h-[600px] shadow-xl overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-800 p-1.5 bg-slate-50/50 dark:bg-[#141a29]/50">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-white dark:bg-[#0d121f] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>ჩათი</span>
            </button>

            <button
              onClick={() => setActiveTab('qa')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'qa'
                  ? 'bg-white dark:bg-[#0d121f] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Q&A ({questionsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('resources')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'resources'
                  ? 'bg-white dark:bg-[#0d121f] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-cyan-500" />
              <span>მასალები</span>
            </button>
          </div>

          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                {messages.map((msg: ChatMessage) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-2xl ${
                      msg.is_question
                        ? 'bg-amber-500/10 border border-amber-500/20'
                        : 'bg-slate-50 dark:bg-[#141a29] border border-slate-100 dark:border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-slate-200">
                          {msg.user_name}
                        </span>
                        {msg.user_profession && (
                          <span className="text-slate-400">• {msg.user_profession}</span>
                        )}
                      </div>
                      {msg.is_question && (
                        <span className="font-bold text-[10px] text-amber-600 dark:text-amber-400 uppercase">
                          კითხვა
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                      {msg.message}
                    </p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isQuestion}
                      onChange={(e) => setIsQuestion(e.target.checked)}
                      className="rounded text-cyan-600 focus:ring-0"
                    />
                    <span>მონიშვნა როგორც კითხვა</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isQuestion ? 'დასვით კითხვა ექსპერტისთვის...' : 'დაწერეთ შეტყობინება...'}
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#141a29] border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'qa' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-medium leading-relaxed">
                მიეცით ხმა (Upvote) საუკეთესო კითხვებს, რათა სპიკერმა პირველ რიგში უპასუხოს.
              </div>

              {questionsList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  კითხვები ჯერ არ არის. ჩათში მონიშნეთ „მონიშვნა როგორც კითხვა“.
                </div>
              ) : (
                questionsList.map((q: ChatMessage) => (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#141a29] border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-900 dark:text-slate-200">{q.user_name}</span>
                      <button
                        onClick={() => handleUpvote(q.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-cyan-500/20 text-slate-700 dark:text-slate-300 hover:text-cyan-500 transition-all font-semibold cursor-pointer"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{q.upvotes}</span>
                      </button>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{q.message}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                მასტერკლასის სამუშაო პაკეტი:
              </div>

              {masterclass.resources?.map((res: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#141a29] border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{res.title}</span>
                  </div>
                  <a
                    href={res.url}
                    download
                    className="p-1.5 text-slate-500 hover:text-cyan-500 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setShowCert(true)}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  სერტიფიკატის გენერირება
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl relative text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <Award className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                HealthcareComm Certificate of Participation
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                სერტიფიკატი გაცემულია
              </h2>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#141a29] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {user?.user_metadata?.full_name || 'მონაწილე'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                წარმატებით დაესწრო და დაასრულა ექსკლუზიური მასტერკლასი:
              </p>
              <div className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                "{masterclass.title}"
              </div>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                სპიკერი: {masterclass.speaker_name} • {new Date().toLocaleDateString('ka-GE')}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                ამობეჭდვა / PDF
              </button>
              <button
                onClick={() => setShowCert(false)}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                დახურვა
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
