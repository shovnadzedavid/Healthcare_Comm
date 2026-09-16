-- 1. contacts ცხრილი status-ის ველით (pending, accepted, declined)
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_user_contact UNIQUE (user_id, contact_id),
    CONSTRAINT check_not_self CHECK (user_id != contact_id)
);

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'status'
    ) THEN 
        ALTER TABLE public.contacts ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined'));
    END IF;
END $$;

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can add contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;

-- ნახვა შეუძლია გამგზავნსაც და მიმღებსაც
CREATE POLICY "Users can view contacts"
    ON public.contacts FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = contact_id);

-- მოთხოვნის გაგზავნა
CREATE POLICY "Users can add contacts"
    ON public.contacts FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- მოთხოვნის დადასტურება (მიმღების მიერ)
CREATE POLICY "Users can update contacts"
    ON public.contacts FOR UPDATE TO authenticated
    USING (auth.uid() = contact_id OR auth.uid() = user_id);

-- წაშლა ორივე მხარის მიერ
CREATE POLICY "Users can delete their own contacts"
    ON public.contacts FOR DELETE TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = contact_id);
