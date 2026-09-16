# HealthcareComm — Healthcare Community Platform

პროფესიული დახურული ქომუნითი ჯანდაცვის პოლიტიკის, მენეჯმენტის, ეპიდემიოლოგიისა და კვლევების სპეციალისტებისთვის.

## ტექნოლოგიური სტეკი
- **Framework:** Next.js 14 (React, TypeScript, App Router)
- **Styling:** Tailwind CSS (Luxury Academic Slate/Navy, Full Responsive)
- **Database & Auth:** Supabase (PostgreSQL, RLS, Realtime Messaging)
- **Icons:** Lucide React

## პროექტის გაშვება ლოკალურად

1. შექმენით ფაილი `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

2. დააინსტალირეთ ბიბლიოთეკები:
```bash
npm install
```

3. გაუშვით დეველოპმენტ სერვერი:
```bash
npm run dev
```
გახსენით: `http://localhost:3000`
