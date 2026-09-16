'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, ArrowLeft, Send, Sparkles, FileText, Users, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

const AVAILABLE_TOPICS = [
  'საზოგადოებრივი ჯანდაცვა',
  'ჯანდაცვის პოლიტიკა',
  'ჯანდაცვის მენეჯმენტი',
  'ეპიდემიოლოგია და ბიოსტატისტიკა',
  'კვლევა',
];

export default function NewDiscussionPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Advanced Academic fields
  const [isPolicyBrief, setIsPolicyBrief] = useState(false);
  const [policyProblem, setPolicyProblem] = useState('');
  const [policyEvidence, setPolicyEvidence] = useState('');
  const [policyRecommendations, setPolicyRecommendations] = useState('');
  const [doiOrLink, setDoiOrLink] = useState('');
  const [seekingCollaborators, setSeekingCollaborators] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/auth');
      } else {
        setUser(data.user);
      }
    });
  }, [router]);

  // Strict Max 2 Topics logic
  const handleTopicClick = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      if (selectedTopics.length >= 2) {
        setShowLimitModal(true);
        return;
      }
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (selectedTopics.length === 0) {
      alert('გთხოვთ აირჩიოთ მინიმუმ 1 თემა');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('discussions')
      .insert({
        author_id: user.id,
        title,
        content: isPolicyBrief ? policyProblem : content,
        topics: selectedTopics,
        is_policy_brief: isPolicyBrief,
        policy_problem: isPolicyBrief ? policyProblem : null,
        policy_evidence: isPolicyBrief ? policyEvidence : null,
        policy_recommendations: isPolicyBrief ? policyRecommendations : null,
        doi_or_link: doiOrLink || null,
        seeking_collaborators: seekingCollaborators,
      })
      .select('id')
      .single();

    setLoading(false);

    if (error) {
      alert('შეცდომა დისკუსიის შექმნისას: ' + error.message);
    } else if (data) {
      router.push(`/discussions/${data.id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/discussions"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> დისკუსიებში დაბრუნება
      </Link>

      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          ახალი დისკუსიის გახსნა
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
          გააზიარეთ საკითხი ჯანდაცვის საზოგადოებასთან. აირჩიეთ მაქსიმუმ 2 თემატური მიმართულება.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              დისკუსიის სათაური *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="მაგ. ეპიდემიოლოგიური მონიტორინგის ახალი მოდელები რეგიონებში"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white font-medium"
            />
          </div>

          {/* Topics Selector (Max 2) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                დაკავშირებული თემები (მაქსიმუმ 2) *
              </label>
              <span className={`text-xs font-medium ${selectedTopics.length === 2 ? 'text-amber-500' : 'text-slate-400'}`}>
                {selectedTopics.length}/2 არჩეულია
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TOPICS.map((topic) => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <button
                    type="button"
                    key={topic}
                    onClick={() => handleTopicClick(topic)}
                    className={`text-xs px-3.5 py-2 rounded-xl border transition-all font-medium ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-navy-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '} {topic}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggle Switches: Policy Brief & Seeking Collaborators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300">
              <input
                type="checkbox"
                checked={isPolicyBrief}
                onChange={(e) => setIsPolicyBrief(e.target.checked)}
                className="mt-0.5 accent-cyan-500 rounded"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-purple-500" /> Policy Brief ფორმატი
                </span>
                <span className="text-slate-500 block mt-0.5">სტრუქტურირებული ანალიტიკური შაბლონი</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300">
              <input
                type="checkbox"
                checked={seekingCollaborators}
                onChange={(e) => setSeekingCollaborators(e.target.checked)}
                className="mt-0.5 accent-cyan-500 rounded"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-500" /> თანამშრომლობის ძიება
                </span>
                <span className="text-slate-500 block mt-0.5">მოიწვიეთ კოლეგები კვლევაში</span>
              </div>
            </label>
          </div>

          {/* Body Content */}
          {isPolicyBrief ? (
            <div className="space-y-4 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20">
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  1. პრობლემის ფორმულირება & კონტექსტი *
                </label>
                <textarea
                  required
                  rows={3}
                  value={policyProblem}
                  onChange={(e) => setPolicyProblem(e.target.value)}
                  placeholder="რა არის ძირითადი გამოწვევა ჯანდაცვის სისტემაში?"
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  2. არსებული მტკიცებულებები და მონაცემები *
                </label>
                <textarea
                  required
                  rows={3}
                  value={policyEvidence}
                  onChange={(e) => setPolicyEvidence(e.target.value)}
                  placeholder="რას გვეუბნება ეპიდემიოლოგიური ან ეკონომიკური კვლევები?"
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  3. პოლიტიკის რეკომენდაციები გადაწყვეტილების მიმღებთათვის *
                </label>
                <textarea
                  required
                  rows={3}
                  value={policyRecommendations}
                  onChange={(e) => setPolicyRecommendations(e.target.value)}
                  placeholder="რა კონკრეტული ნაბიჯები უნდა გადაიდგას მენეჯმენტის დონეზე?"
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                დისკუსიის შინაარსი *
              </label>
              <textarea
                required
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="აღწერეთ საკითხი, დასვით კითხვები კოლეგებთან..."
                className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* DOI / Scientific Link */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-cyan-500" />
              სამეცნიერო ბმული ან DOI (არასავალდებულო)
            </label>
            <input
              type="text"
              value={doiOrLink}
              onChange={(e) => setDoiOrLink(e.target.value)}
              placeholder="მაგ. https://doi.org/10.1016/... ან PubMed URL"
              className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Link
              href="/discussions"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              გაუქმება
            </Link>
            <button
              type="submit"
              disabled={loading || selectedTopics.length === 0}
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? 'ქვეყნდება...' : 'გამოქვეყნება'}
            </button>
          </div>
        </form>
      </div>

      {/* MODAL POP-UP: MAX 2 TOPICS ALERT */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-900 border border-amber-500/40 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 mx-auto flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              ლიმიტი ამოიწურა!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
              დისკუსიისთვის შესაძლებელია <span className="font-bold text-amber-500">მაქსიმუმ 2</span> დაკავშირებული თემის არჩევა. სხვა თემის მოსანიშნად, ჯერ მოხსენით მონიშვნა ერთ-ერთ უკვე არჩეულს.
            </p>
            <button
              onClick={() => setShowLimitModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
            >
              გასაგებია
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
