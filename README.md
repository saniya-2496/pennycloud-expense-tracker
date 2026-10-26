# PennyCloud — Cloud-Based Expense Tracker

A beginner-friendly Cloud Computing mini-project using plain HTML, CSS, JavaScript, Firebase Authentication, Cloud Firestore, Firebase Hosting and Chart.js.

## Features
- Email/password registration, login and logout
- Add, edit and delete expense records
- Categories, date, payment method and notes
- Monthly totals, transaction count and largest expense
- Category-wise doughnut chart
- Month selector, category filter and search
- Export visible filtered expenses to CSV
- Firestore rules restricting users to their own records
- Responsive layout for desktop and mobile

## Project structure
```
cloud_expense_tracker/
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── firebase.json
├── firestore.rules
├── .firebaserc.example
└── README.md
```

## What you need to do manually

### Step 1 — Install the tools
1. Install Google Chrome or another modern browser.
2. Install VS Code: https://code.visualstudio.com/
3. Install Node.js LTS: https://nodejs.org/ (needed for Firebase command-line tools).
4. Open a terminal and install Firebase CLI:
   ```
   npm install -g firebase-tools
   ```
5. Sign in:
   ```
   firebase login
   ```

### Step 2 — Create a Firebase project
1. Go to https://console.firebase.google.com/
2. Click **Create a project** and give it a name such as `pennycloud-expense-tracker`.
3. Google Analytics is not required for this project; you can skip it.
4. In Project Overview, click **Add app** and choose the Web (`</>`) icon.
5. Register the app (for example, `PennyCloud Web`).
6. Copy the Firebase web configuration object shown in the console.

### Step 3 — Add Firebase config
1. Open `public/app.js` in VS Code.
2. Find `const firebaseConfig = { ... }` near the top.
3. Replace every `PASTE_...` placeholder with the matching value from your Firebase web app config.
4. Save the file. Keep the property names as they are.

The Firebase web config is intended to be used by a browser app; it is not a server password. Database security must be enforced by Firestore Security Rules. Never place a service-account private key or other server secret in this file.

### Step 4 — Enable authentication
1. Firebase Console → **Build → Authentication**.
2. Click **Get started**.
3. Open **Sign-in method**.
4. Enable **Email/Password** and save.

### Step 5 — Create Firestore database
1. Firebase Console → **Build → Firestore Database**.
2. Click **Create database**.
3. Choose a location close to your intended users, and remember that database location usually cannot be changed later.
4. If the wizard asks for a starting mode, complete the setup and then publish the rules from this project's `firestore.rules`.
5. In the Firestore Rules tab, replace the existing rules with the contents of `firestore.rules` and click **Publish**.

Do not leave the database in test mode. These rules use the signed-in user's UID to isolate each user's records.

### Step 6 — Run locally
From a terminal, change directory to the project folder, then run:
```
firebase emulators:start
```
This command requires Firebase Emulator Suite setup and is optional. The easiest first local test is to serve the `public` folder over HTTP. Do not open `index.html` by double-clicking it because browser module imports can fail under `file://`.

A simple alternative is the VS Code **Live Server** extension: right-click `public/index.html` → **Open with Live Server**. Firebase Authentication and Firestore will use your real development Firebase project, so test only with dummy expense data.

### Step 7 — Deploy to Firebase Hosting
From the project root:
1. Log in if necessary:
   ```
   firebase login
   ```
2. Select your Firebase project:
   ```
   firebase use --add
   ```
   Choose the project you created and assign the alias `default`.
3. Initialize Hosting if prompted:
   ```
   firebase init hosting
   ```
   Choose **Use an existing project**, select your Firebase project, set public directory to `public`, configure as a single-page app **No**, and do not overwrite `public/index.html`.
   If asked about GitHub deployment, choose No for now.
4. Deploy:
   ```
   firebase deploy --only hosting
   ```
5. The terminal prints a Hosting URL. Open it, register an account, and test the app.

To deploy Firestore rules from the CLI too, run:
```
firebase deploy --only firestore:rules
```
This requires the Firebase project to be selected with `firebase use --add`.

### Step 8 — Test the project
- Register a test account and log in.
- Add at least 5 dummy expenses across different categories and dates.
- Check monthly total, transaction count, largest expense and chart.
- Edit one expense, delete another, and test search/category filtering.
- Export a CSV and open it in a spreadsheet app.
- Refresh the page and verify the expenses remain.
- Sign out and sign in again.
- If possible, sign in to the same account on another device/browser and confirm the same records appear.
- Create a second test account and verify it cannot see the first account's expenses.

## Common issues
- **Firebase setup incomplete:** confirm the config values in `public/app.js` are correct.
- **auth/operation-not-allowed:** enable Email/Password under Authentication → Sign-in method.
- **Missing or insufficient permissions:** publish the `firestore.rules` rules and confirm the user is signed in.
- **Page is blank on local file:** serve through Live Server or Firebase Hosting; don't open via `file://`.
- **Email already in use:** log in instead, or use a different test email.
- **First load feels slow:** free hosting services can have cold starts; Firebase Hosting is static hosting, so the web files themselves are served from Firebase.

## Security and scope notes
- Firestore rules restrict access to the signed-in user's UID path and validate key fields.
- Do not use real financial account details or bank passwords; this app does not connect to banks.
- This project stores basic expense entries, not bank transactions.
- Keep all credentials private and do not share your test password.
- Firebase pricing and free quotas may change; check the console's plan and usage before deployment.
- CSV export runs in the browser and exports the currently selected month and filters.

## Mini-project synopsis
**Title:** PennyCloud: Cloud-Based Personal Expense Tracker

**Problem statement:** Manual expense tracking is inconvenient and provides limited access to spending information across devices. The project provides a cloud-hosted web application where authenticated users can record, organize, search and analyze their personal expenses.

**Objectives:**
1. Build a responsive web interface for expense management.
2. Store expense data in a cloud-hosted database.
3. Implement authentication and user-level data isolation.
4. Generate monthly totals and category-wise spending charts.
5. Deploy the application so it can be accessed from different devices.

**Scope:** Individual expense management, cloud data persistence, basic analytics and CSV export. Bank integrations, payment processing and automated receipt scanning are outside the initial scope.

**Expected outcome:** A deployed website where users can securely manage their own expense records and view monthly summaries.

## Viva talking points
- Cloud computing: delivering computing/storage services over the internet.
- Cloud Firestore: managed NoSQL document database.
- Firebase Authentication: verifies user identity.
- Firebase Hosting: hosts the website's static assets.
- Security rules: enforce per-user access control.
- CRUD: Create, Read, Update and Delete.
- Scalability: managed cloud services can support growth within service quotas and design limits.
- Limitation: app requires connectivity for cloud operations; free-plan quotas and service terms apply.
