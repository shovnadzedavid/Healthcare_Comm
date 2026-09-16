'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { UserPlus, Check, Shield } from 'lucide-react';

export default function DirectoryPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push('/auth');
      } else {
        setCurrentUserId(data.user.id);
        await fetchAllData(data.user.id);
      }
    });
  }, [router]);

  const fetchAllData = async (myId: string) => {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, profession, verified_badge')
      .neq('id', myId);

    if (profilesData) setUsers(profilesData);

    const { data: contactsData } = await supabase
      .from('contacts')
      .select('contact_id')
      .eq('user_id', myId);

    if (contactsData) {
      setContacts(contactsData.map((c: any) => c.contact_id));
    }
  };

  const addContact = async (targetId: string) => {
    if (!currentUserId) return;
    const { error } = await supabase.from('contacts').insert({
      user_id: currentUserId,
      contact_id: targetId,
    });
    
    if (error) {
      alert("შეცდომა ბაზაში ჩაწერისას: " + error.message);
    } else {
      setContacts((prev) => [...prev, targetId]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">კოლეგების დირექტორია</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((u) => {
          const isAdded = contacts.includes(u.id);
          return (
            <div key={u.id} className="p-4 bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 dark:text-white">
                  <span>{u.full_name}</span>
                  {u.verified_badge && <Shield className="w-3.5 h-3.5 text-cyan-500" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{u.profession}</p>
              </div>
              <button
                onClick={() => !isAdded && addContact(u.id)}
                disabled={isAdded}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isAdded
                    ? 'bg-emerald-500/10 text-emerald-500 cursor-default'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> კონტაქტშია
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" /> დამატება
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
