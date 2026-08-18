# Leo Club of Kathmandu University School of Medical Sciences (KUSMS) — Portal

A complete club management system — members, activities, verification, and QR certificates.

## Run & Operate

- `pnpm --filter @workspace/client-portal run dev` — run the frontend (port auto-assigned)
- App is at preview path `/`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter (routing), TailwindCSS
- Backend: Firebase (Auth + Firestore + Storage) — no separate server needed
- QR Codes: qrcode.react
- PDF: jsPDF + html2canvas

## Where things live

- `artifacts/client-portal/src/lib/firebase.ts` — Firebase config
- `artifacts/client-portal/src/lib/firestore.ts` — Firestore CRUD helpers
- `artifacts/client-portal/src/lib/types.ts` — Shared TypeScript types
- `artifacts/client-portal/src/contexts/AuthContext.tsx` — Auth state
- `artifacts/client-portal/src/pages/` — All pages (Home, Admin, Archive, Verify, Members)

## Firebase Setup Required

Before the app works with real data, you need to:

1. **Enable Firestore Database** in Firebase Console:
   - Go to [Firebase Console](https://console.firebase.google.com) → leo-club-kusms project
   - Click "Firestore Database" → "Create database"
   - Choose "Start in production mode"
   - Select a region and click "Enable"

2. **Set Admin Password** in Firebase Console:
   - Go to Authentication → Users
   - Add user with email: `leoclubofkusms@gmail.com` and set a password

3. **Enable Firebase Storage**:
   - Go to Storage → Get started
   - Set rules to allow admin writes

4. **Firestore Security Rules**:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /members/{memberId} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.token.email == 'leoclubofkusms@gmail.com';
       }
       match /activities/{activityId} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.token.email == 'leoclubofkusms@gmail.com';
       }
        match /events/{eventId} {
          allow read: if true;
          allow write: if request.auth != null && request.auth.token.email == 'leoclubofkusms@gmail.com';
        }
        match /awards/{awardId} {
          allow read: if true;
          allow write: if request.auth != null && request.auth.token.email == 'leoclubofkusms@gmail.com';
        }
        match /bod/{memberId} {
          allow read: if true;
          allow write: if request.auth != null && request.auth.token.email == 'leoclubofkusms@gmail.com';
        }
        match /leaderQuotes/{quoteId} {
          allow read: if true;
          allow write: if request.auth != null && request.auth.token.email == 'leoclubofkusms@gmail.com';
        }
        match /pastLeaders/{leaderId} {
          allow read: if true;
          allow write: if request.auth != null && request.auth.token.email == 'leoclubofkusms@gmail.com';
        }
        match /announcements/{announcementId} {
          allow read: if true;
          allow write: if request.auth != null && request.auth.token.email == 'leoclubofkusms@gmail.com';
        }
        match /settings/{settingId} {
          allow read: if true;
          allow write: if request.auth != null && request.auth.token.email == 'leoclubofkusms@gmail.com';
        }
     }
   }
   ```

5. **Storage Security Rules**:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.token.email == 'leoclubofkusms@gmail.com';
       }
     }
   }
   ```

## Pages & Routes

- `/` — Home page with stats and latest activities
- `/admin/login` — Admin sign-in
- `/admin` — Admin dashboard (protected): Add activities, manage members, activity list, QR generator
- `/members` — Public member search and directory
- `/archive/:year/:month` — Public archive (e.g. `/archive/2026-27/january`)
- `/verify/member/:memberId` — Public member verification page with QR code

## Member ID Format

Format: `{FACULTY}{BATCH}{NUMBER}` — e.g. `MBBS2101`
- `MBBS` = faculty
- `21` = batch number
- `01` = member sequence number (01–99)

This ensures uniqueness across faculties and batches.

## Architecture decisions

- Firebase client SDK directly in the frontend — no separate Express server needed
- Activities stored with a denormalized copy in each member's `activities` array for fast reads
- Wouter used instead of Next.js App Router (same routing UX, works with Vite)

## User preferences

- Navy (#002147) + Gold (#D4AF37) color scheme throughout
- Admin email: leoclubofkusms@gmail.com (hardcoded)
- Club name: Leo Club of Kathmandu University School of Medical Sciences (KUSMS)
- Short form: Leo Club of KUSMS
