Deployment steps — make the site live on Firebase Hosting

Prerequisites (on your machine):
- Node.js + npm installed (https://nodejs.org)
- Firebase CLI installed: npm install -g firebase-tools

1) Login to Firebase from your terminal
   firebase login

2) From the project folder (this folder contains firebase.json):
   cd "C:\Users\Forde_RETER\OneDrive\Desktop\tibbiya_v3\tibbiya final"

3) (Optional) Initialize Hosting if you want to reconfigure interactively
   firebase init hosting
   - Select the existing project (x75t-96ae5) or provide your actual project id
   - When asked for the public directory, choose: .
   - Configure as single-page app: Yes (rewrite all URLs to /index.html)

4) Deploy to Firebase Hosting
   firebase deploy --only hosting

5) After successful deploy you will get a hosting URL like https://<your-project>.web.app
   Open that URL to verify the site is live.

Checklist in Firebase Console (one-time setup):
- Authentication → Sign-in method → enable Email/Password (and Google/Apple if desired)
- Firestore → Create database (in production or test mode)
- Storage → Enable and set rules (storage.rules already included in the repo)
- Add your hosting domain to Authorized Domains if you plan to sign in from a custom domain

Notes & troubleshooting:
- The app has an offline/local fallback (localStorage) so it will work if Firestore/Storage are not available.
- Make sure the firebaseConfig in js/firebase-client.js matches the Firebase project you deploy to. Current config uses projectId: "x75t-96ae5".
- If you want me to run the deploy from here I need a CI token or interactive Firebase login on this machine — I cannot perform interactive login on your account without you running the commands or providing credentials.

If you'd like, I can:
- Update firebase-client.js with a different project ID you provide
- Create CI workflow for automatic deploys via GitHub Actions (requires repo access)
- Walk you through each command step-by-step in your terminal
