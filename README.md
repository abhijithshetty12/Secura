# Secura — Document Organizer (Firebase)

Clean document storage UI with Firebase Auth + Firestore + Storage.

## Local dev
1. Create a Firebase project.
2. Enable **Email/Password** auth.
3. Enable Firestore + Storage.
4. Create a Firebase Web app and copy config.
5. Create `.env` in the project root (use Vite `VITE_` prefix):

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

6. Install deps:
```bash
npm install
```
7. Run:
```bash
npm run dev
```
Open the printed localhost URL.

## Firebase data model (planned)
- Firestore collection: `users/{uid}/documents`
  - `category`: string (Aadhaar, PAN, Voter ID, Other)
  - `originalName`: string
  - `storagePath`: string
  - `contentType`: string
  - `createdAt`: timestamp

## Notes
- Landing page + Dashboard UI are present.
- Firebase upload/listing wiring and security rules are next steps.

