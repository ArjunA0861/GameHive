# 🎮 GameHive — Complete Viva Notes
### React + Vite + Firebase — Everything You Need to Know

---

# PART 1: WHAT IS REACT?

## What is React?
React is a **JavaScript library** created by **Meta (Facebook)** in 2013 for building **User Interfaces (UI)**.

- It breaks the UI into small reusable pieces called **Components**.
- React uses a concept called the **Virtual DOM** — instead of updating the real browser DOM directly (which is slow), React creates a virtual copy of the DOM in memory, compares what changed, and only updates the parts that need updating. This makes it very fast.
- React is NOT a full framework — it only handles the View (UI) layer. That's why we pair it with tools like React Router (for navigation) and Firebase (for the backend/database).

## Key React Concepts Used in GameHive

### 1. JSX (JavaScript XML)
JSX lets you write HTML-like code inside JavaScript. React then converts it to real HTML.

```jsx
// Example from GameHive — AdminDashboard.jsx
return (
  <div className="container">
    <h1>Admin Dashboard</h1>
    <button onClick={() => setView('users')}>Users</button>
  </div>
);
```
**Viva Answer:** "JSX is a syntax extension that lets us write HTML inside JavaScript. React's build tool (Babel/Vite) converts it to React.createElement() calls under the hood."

---

### 2. Components
A **Component** is a JavaScript function that returns JSX (UI). GameHive has many components:

| File | What It Does |
|------|-------------|
| `Navbar.jsx` | Top navigation bar shown on every page |
| `GameCard.jsx` | A single game card in the grid |
| `AdminDashboard.jsx` | The admin control panel page |
| `Profile.jsx` | A user's profile page |
| `GameDetails.jsx` | Full details page for one game |
| `Browse.jsx` | Browse/explore games page |

**Example from GameHive — `main.jsx` (the entry point):**
```jsx
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```
This is where our entire React app starts. It mounts the `<App />` component into the `<div id="root">` in our `index.html`.

---

### 3. Props (Properties)
Props are how parent components pass data down to child components. They are **read-only**.

```jsx
// In App.jsx — passing props to Navbar
<Navbar
  user={user}
  isAdmin={isAdmin}
  onSignIn={handleGoogleSignIn}
  onSignOut={handleSignOut}
/>
```
Here, `user`, `isAdmin`, `onSignIn`, and `onSignOut` are props received by the `Navbar` component.

---

### 4. State (useState Hook)
State is **data that can change over time** inside a component. When state changes, React automatically re-renders the component.

```jsx
// From AdminDashboard.jsx
const [users, setUsers] = useState([]);       // List of all users
const [loading, setLoading] = useState(true); // Loading spinner
const [view, setView] = useState('users');    // Which tab is active
const [reports, setReports] = useState([]);   // List of reports
```

**How it works:**
- `users` = the current value
- `setUsers` = the function to update it
- `useState([])` = starts as an empty array

**Viva Answer:** "useState is a React Hook that lets a functional component remember and update its own data. When we call setUsers(), React re-renders the component with the new data."

---

### 5. useEffect Hook
`useEffect` runs **side effects** — code that runs AFTER the component renders. Used for fetching data, subscribing to listeners, etc.

```jsx
// From AdminDashboard.jsx
useEffect(() => {
  if (view === 'users') {
    fetchUsers();
  } else if (view === 'reports') {
    fetchReports();
  }
}, [view]); // This runs every time 'view' changes
```

The array `[view]` is called the **Dependency Array**:
- Empty `[]` → runs only once when component mounts
- `[view]` → runs every time `view` changes
- No array → runs after EVERY render (dangerous, avoid this)

**In App.jsx — Listening to Auth State:**
```jsx
useEffect(() => {
  const unsubAuth = onAuthStateChanged(auth, async (u) => {
    // This runs whenever the user logs in or out
    if (u) {
      setUser(u);
    } else {
      setUser(null);
    }
  });

  return () => unsubAuth(); // Cleanup on unmount
}, []);
```
The `return () => unsubAuth()` is a **cleanup function** — it unsubscribes the listener when the component is destroyed, preventing memory leaks.

---

### 6. React Router (Navigation)
React Router allows us to navigate between pages without reloading the browser. GameHive uses `react-router-dom`.

```jsx
// From App.jsx
import { Routes, Route, useNavigate } from "react-router-dom";

// Define all page routes
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/browse" element={<Browse />} />
  <Route path="/search" element={<Search />} />
  <Route path="/game/:id" element={<GameDetails />} />
  <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
  <Route path="/profile/:uid" element={<Profile />} />
</Routes>
```

- `/game/:id` — the `:id` is a **URL parameter**. In `GameDetails.jsx`, we read it with `const { id } = useParams();`
- `/profile/:uid` — same concept. In `Profile.jsx`: `const { uid } = useParams();`

**Protected Route (AdminRoute):**
```jsx
// Only admins can access /admin
<Route path="/admin" element={
  <AdminRoute>
    <AdminDashboard />
  </AdminRoute>
} />
```
AdminRoute checks if the user has the `admin` role, and redirects non-admins away.

---

### 7. Lazy Loading (Code Splitting)
Instead of loading all pages at once, we load them **only when needed** — this makes the app faster to start.

```jsx
// From App.jsx
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Browse = lazy(() => import("./pages/Browse"));
const GameDetails = lazy(() => import("./pages/GameDetails"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
```

The `<Suspense>` component shows a loading spinner while a lazy page is downloading:
```jsx
<Suspense fallback={<div>Loading...</div>}>
  <Routes>...</Routes>
</Suspense>
```

**Viva Answer:** "Lazy loading splits the code into smaller chunks. Instead of downloading the entire app upfront, only the code for the current page is downloaded. This significantly improves initial load time."

---

### 8. Custom Hooks
Custom Hooks are reusable functions that contain stateful logic, starting with the word `use`.

**`useUserRole.js`** — Fetches the current logged-in user's role from Firestore:
```jsx
export default function useUserRole() {
    const [role, setRole] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const ref = doc(db, "users", currentUser.uid);
                const snap = await getDoc(ref);
                setRole(snap.data().role || "user");
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return { role, loading, user };
}
```

Used in `GameDetails.jsx`:
```jsx
const { role, user } = useUserRole();
```
This gives us the current user's role and info without repeating the authentication logic everywhere.

---

---

# PART 2: WHAT IS VITE?

## What is Vite?
Vite (pronounced "veet" — French for "fast") is a **modern build tool and development server** created by Evan You (creator of Vue.js) in 2021.

Think of Vite as the **engine/toolbox** that powers our React project. It handles:
- Starting a local development server (the `npm run dev` command)
- Bundling all our JavaScript/CSS files into one optimized file for production
- Hot Module Replacement (HMR) — instantly updating the browser when you save a file, WITHOUT a full page reload

## Why Vite Instead of Older Tools (like Create React App)?
| Feature | Create React App (Old) | Vite (We Used) |
|---------|----------------------|----------------|
| Start speed | Slow (seconds) | Near-instant (milliseconds) |
| Hot Reload | Slow | Instant (HMR) |
| Bundle size | Larger | Smaller (optimized) |
| Setup | Complex | Simple |

**Viva Answer:** "Vite is a build tool that provides extremely fast development startup and Hot Module Replacement. Unlike older tools like Webpack, Vite uses ES Modules natively in the browser during development, so it doesn't need to bundle everything before showing results."

---

## Our `vite.config.js` — GameHive's Vite Configuration
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/rawg': {
        target: 'https://api.rawg.io/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rawg/, ''),
      },
      '/api/steam': {
        target: 'https://api.steampowered.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/steam/, ''),
      },
      '/api/steam-community': {
        target: 'https://steamcommunity.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/steam-community/, ''),
      },
    },
  },
})
```

### What is this doing?
**`plugins: [react()]`** → Enables React support (JSX transformation, HMR).

**`server.proxy`** → This is a **Proxy Server** setup. It solves the **CORS (Cross-Origin Resource Sharing) problem**.

#### Why Do We Need a Proxy?
Without a proxy, when our React app (running on `http://localhost:5173`) tries to call `https://api.rawg.io`, the browser blocks it because they are on different **origins** (different domains). This is a browser security rule called **Same-Origin Policy**.

#### How the Proxy Solves It:
Instead of callings RAWG directly, our code calls `/api/rawg/...` (same origin, no CORS). Vite's dev server receives that request, forwards it to `https://api.rawg.io/api/...`, gets the response, and sends it back to our app. The browser only ever talks to our own server.

```jsx
// In GameDetails.jsx — we call our own proxy, not RAWG directly
const res = await fetch(`/api/rawg/games/${id}?key=${API_KEY}`);
// Vite translates this to: https://api.rawg.io/api/games/123?key=...
```

---

## Environment Variables (`.env` file)
Vite supports environment variables in a `.env` file. In GameHive, we use them to keep API keys secret:

```
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=gamehive.firebaseapp.com
VITE_RAWG_API_KEY=your-rawg-key-here
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-name
```

**How we access them in code:**
```jsx
const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
```

**Important Rules:**
1. ALL variables MUST start with `VITE_` — otherwise Vite won't expose them to the browser
2. The `.gitignore` file lists `.env` so it's never uploaded to GitHub (keeping keys private)

---

## `package.json` — Our Project Dependencies
```json
{
  "dependencies": {
    "firebase": "^12.6.0",
    "lucide-react": "^0.561.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.10.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.1.1",
    "vite": "^7.2.4"
  }
}
```

| Package | Purpose |
|---------|---------|
| `react` | The core React library |
| `react-dom` | Connects React to the browser DOM |
| `react-router-dom` | Client-side navigation/routing |
| `firebase` | Firebase SDK (Auth, Firestore, Storage) |
| `lucide-react` | Icon library (Shield, Star, etc.) |
| `vite` | Build tool & dev server |
| `@vitejs/plugin-react` | Vite plugin to support React/JSX |

---

---

# PART 3: WHAT IS FIREBASE?

## What is Firebase?
Firebase is a **Backend-as-a-Service (BaaS)** platform owned by **Google**. It provides a full backend without us having to code our own server.

Normally, building a web app requires:
1. A web server (Node.js, Python Django, etc.)
2. A database (MySQL, PostgreSQL, etc.)
3. Authentication system (register, login, reset password)
4. File storage

Firebase provides ALL of this as ready-made cloud services. We used 3 of them in GameHive:

| Firebase Service | What We Use It For |
|-----------------|-------------------|
| **Firebase Authentication** | Google Sign-In, user sessions |
| **Cloud Firestore** | Database (users, reviews, library, reports, followers, ratings) |
| **Firebase Storage** | NOT used (we used Cloudinary instead for profile photos) |

---

## Our Firebase Config (`src/firebase/config.js`)
```js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

**Viva Explanation:**
- `initializeApp(firebaseConfig)` → Connects our app to our specific Firebase project in the cloud
- `getAuth(app)` → Gets the Authentication service instance
- `getFirestore(app)` → Gets the Firestore database instance
- We export `auth` and `db` so any file in the project can import and use them:
  ```js
  import { auth, db } from '../firebase/config';
  ```

---

---

# PART 4: FIREBASE AUTHENTICATION

## What is Firebase Authentication?
Firebase Auth handles user identity. In GameHive, we use **Google Sign-In** — users sign in with their existing Google account. No password storage needed on our side.

## The Auth Flow in GameHive

### Step 1 — Initialize Google Provider
```jsx
// App.jsx
import { GoogleAuthProvider } from "firebase/auth";
const provider = new GoogleAuthProvider();
```

### Step 2 — Sign In With Popup
```jsx
// App.jsx
async function handleGoogleSignIn() {
  try {
    await signInWithPopup(auth, provider);
    // Firebase automatically handles the token and session
  } catch (err) {
    console.error("Sign in error:", err);
  }
}
```
When `signInWithPopup` is called, a **Google login popup** appears. The user selects their Google account, and Firebase handles everything (OAuth tokens, session cookies, etc.). After success, `onAuthStateChanged` fires automatically.

### Step 3 — Sign Out
```jsx
// App.jsx
async function handleSignOut() {
  await signOut(auth);
  navigate("/"); // Redirect to home after logout
}
```

### Step 4 — Listen to Auth State Changes (`onAuthStateChanged`)
This is the MOST IMPORTANT auth function. It runs whenever the user's login status changes (logs in, logs out, or on page refresh if already logged in).

```jsx
// App.jsx
useEffect(() => {
  const unsubAuth = onAuthStateChanged(auth, async (u) => {
    if (u) {
      // User is logged in
      const userRef = doc(db, "users", u.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const userData = snap.data();
        
        // Check if the user is banned
        if (userData.banned) {
          await signOut(auth);
          alert("Your account has been banned.");
          setUser(null);
          return;
        }
        
        setIsAdmin(userData.role === "admin");
      } else {
        // First time login — create a user document in Firestore
        await setDoc(userRef, {
          email: u.email,
          displayName: u.displayName,
          photoURL: u.photoURL,
          uid: u.uid,
          role: "user",
          banned: false,
          createdAt: new Date().toISOString()
        });
      }

      // Listen in real-time to user data changes
      const unsubSnap = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setUser({ ...u, ...docSnap.data() });
          setIsAdmin(docSnap.data().role === "admin");
        }
      });

    } else {
      // User is NOT logged in
      setUser(null);
      setIsAdmin(false);
    }
  });

  return () => unsubAuth(); // Cleanup listener on unmount
}, []);
```

### What Happens on First Login?
1. `onAuthStateChanged` fires with the user object
2. We check Firestore for a document with the user's UID
3. If it doesn't exist → first time user → we **create** a new Firestore document for them with default `role: "user"` and `banned: false`
4. If it exists → we check if they're banned → if yes, sign them out

### The `user` Object
Firebase Auth provides a `user` object with:
- `user.uid` — Unique ID (e.g., "abc123xyz")
- `user.email` — Their Gmail
- `user.displayName` — Their Google name
- `user.photoURL` — Their Google profile picture

---

---

# PART 5: CLOUD FIRESTORE DATABASE

## What is Firestore?
Firestore is a **NoSQL Cloud Database** by Firebase. Instead of SQL tables with rows and columns, Firestore uses **Collections** and **Documents**.

### Structure Concepts
- **Collection** = like a folder or table (e.g., "users", "reviews")
- **Document** = a single record inside a collection (e.g., one user's data)
- **Field** = a key-value pair inside a document

```
Firestore
├── users (collection)
│   ├── uid123abc (document)
│   │   ├── email: "user@gmail.com"
│   │   ├── name: "ArjunA"
│   │   ├── role: "user"
│   │   └── banned: false
│   └── uid456def (document)
│       └── ...
├── reviews (collection)
│   └── reviewId1 (document)
│       ├── gameId: 3328
│       ├── review: "Great game!"
│       ├── rating: 9
│       └── userId: "uid123abc"
├── followers (collection)
├── library (collection)
├── ratings (collection)
└── reported_reviews (collection)
```

## All Firestore Operations Used in GameHive

### IMPORT — Every file that uses Firestore:
```jsx
import { db } from '../firebase/config';
import { 
  collection, doc, getDoc, getDocs, addDoc, setDoc, 
  updateDoc, deleteDoc, query, where, orderBy, 
  onSnapshot, serverTimestamp, Timestamp 
} from 'firebase/firestore';
```

---

### 1. `getDoc` — Read ONE document
```jsx
// Profile.jsx — Fetch one user's data
const userRef = doc(db, "users", uid);
const userSnap = await getDoc(userRef);

if (userSnap.exists()) {
  setUserData(userSnap.data());
}
```
- `doc(db, "users", uid)` → Creates a reference to: `Firestore > users > uid`
- `getDoc(userRef)` → Fetches that specific document
- `.exists()` → Checks if the document was found
- `.data()` → Returns all the fields as a JavaScript object

---

### 2. `getDocs` — Read MULTIPLE documents (a whole collection or query)
```jsx
// AdminDashboard.jsx — Get all users
const querySnapshot = await getDocs(collection(db, "users"));
const userList = querySnapshot.docs.map(doc => ({
  id: doc.id,       // The document's auto-generated ID
  ...doc.data()     // Spread all the fields
}));
setUsers(userList);
```

---

### 3. `query` + `where` — Filter documents (like SQL WHERE clause)
```jsx
// GameDetails.jsx — Get reviews for a specific game
const q = query(
  collection(db, "reviews"),
  where("gameId", "==", Number(id)),
  orderBy("createdAt", "desc")  // Sort newest first
);
const querySnapshot = await getDocs(q);
setReviews(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
```

```jsx
// AdminDashboard.jsx — Get only pending reports
const q = query(
  collection(db, "reported_reviews"),
  where("status", "==", "pending")
);
```

```jsx
// Profile.jsx — Get followers of a user
const q = query(
  collection(db, "followers"),
  where("followingId", "==", uid)
);
```

**Viva Answer:** "The `query` function is like writing `SELECT * FROM reviews WHERE gameId = 123 ORDER BY createdAt DESC` in SQL. Firebase translates this into a Firestore query."

---

### 4. `addDoc` — Create a NEW document (auto-generated ID)
```jsx
// GameDetails.jsx — Add a new review
await addDoc(collection(db, "reviews"), {
  gameId: Number(id),
  gameTitle: game.title,
  rating: Number(rating),
  review: newReview,
  userId: auth.currentUser.uid,
  userName: auth.currentUser.displayName,
  createdAt: Timestamp.now()
});
```

```jsx
// Profile.jsx — Follow a user
await addDoc(collection(db, "followers"), {
  followerId: auth.currentUser.uid,
  followingId: uid,
  createdAt: serverTimestamp()
});
```

---

### 5. `setDoc` — Create OR Overwrite a document (you specify the ID)
```jsx
// App.jsx — Create user profile on first login
await setDoc(doc(db, "users", u.uid), {
  email: u.email,
  displayName: u.displayName,
  uid: u.uid,
  role: "user",
  banned: false,
  createdAt: new Date().toISOString()
});
```

```jsx
// Profile.jsx — Update profile with merge (don't overwrite the whole doc)
await setDoc(doc(db, "users", uid), {
  name: editName,
  status: editStatus,
  quote: editQuote,
}, { merge: true }); // ← merge:true means only update these fields
```

**Difference between `setDoc` and `setDoc { merge: true }`:**
- Without merge: **replaces** the entire document (dangerous!)
- With merge: **only updates** the fields you specified, leaves the rest untouched

---

### 6. `updateDoc` — Update SPECIFIC fields of an existing document
```jsx
// AdminDashboard.jsx — Ban a user
await updateDoc(doc(db, "users", userId), {
  banned: true
});

// AdminDashboard.jsx — Dismiss a report
await updateDoc(doc(db, "reported_reviews", reportId), {
  status: 'dismissed'
});

// GameDetails.jsx — Update a review
await updateDoc(doc(db, "reviews", editingReviewId), {
  review: editReviewText,
  rating: editReviewRating,
  updatedAt: Timestamp.now()
});
```

**Difference between `updateDoc` and `setDoc{merge:true}`:**
- Both update specific fields, but `updateDoc` will **fail** if the document doesn't exist. `setDoc{merge:true}` will create it if it doesn't exist.

---

### 7. `deleteDoc` — Delete a document
```jsx
// AdminDashboard.jsx — Delete a review
await deleteDoc(doc(db, "reviews", reviewId));

// Profile.jsx — Unfollow a user
await deleteDoc(doc(db, "followers", followDocId));

// GameDetails.jsx — Remove game from library
await deleteDoc(doc(db, "library", snapshot.docs[0].id));
```

---

### 8. `onSnapshot` — Real-Time Listener (Live Updates)
This is the most powerful Firestore feature. It listens to a document and **fires a callback** EVERY TIME the data changes in the database.

```jsx
// App.jsx — Listen to user data changes in real-time
const unsubscribeSnapshot = onSnapshot(doc(db, "users", u.uid), (docSnap) => {
  if (docSnap.exists()) {
    const data = docSnap.data();
    setUser({ ...u, ...data });       // Update local user state
    setIsAdmin(data.role === "admin");
  }
});
```

**Why we need this:** If the admin bans a user while they are logged in, this listener will immediately detect the `banned: true` change, and App.jsx will log them out without requiring a page refresh.

**Important:** Always unsubscribe when the component unmounts to prevent memory leaks:
```jsx
return () => {
  unsubscribeSnapshot(); // Stop listening when component unmounts
};
```

---

### 9. `Timestamp.now()` vs `serverTimestamp()`
Both store timestamps, but:
- `Timestamp.now()` → Uses the **client's** local time
- `serverTimestamp()` → Uses **Firebase's server time** (more accurate, even if client clock is wrong)

```jsx
// Used in reviews, ratings, library entries
createdAt: Timestamp.now()

// Used in followers — server is more reliable here
createdAt: serverTimestamp()
```

---

## All Firestore Collections in GameHive

### `users` Collection
Stores every user who has ever logged in.
```
{
  uid: "abc123",
  email: "user@gmail.com",
  name: "ArjunA",           ← GameHive username (editable)
  displayName: "Arjun",     ← Google account name
  photoURL: "https://...",
  role: "user",             ← or "admin"
  banned: false,
  status: "Online",
  quote: "I love gaming",
  zone: "EU-West",
  createdAt: "2024-01-01T..."
}
```

### `reviews` Collection
Stores all user reviews on GameDetails pages.
```
{
  gameId: 3328,
  gameTitle: "The Witcher 3",
  review: "Amazing open world RPG!",
  rating: 10,
  userId: "abc123",
  userName: "ArjunA",
  createdAt: Timestamp,
  updatedAt: Timestamp  ← only if edited
}
```

### `ratings` Collection
Stores individual game ratings (separate from reviews).
```
{
  userId: "abc123",
  gameId: 3328,
  rating: 8,
  createdAt: Timestamp
}
```

### `library` Collection
Stores games added to a user's personal library.
```
{
  userId: "abc123",
  gameId: 3328,            ← RAWG ID (null for unresolved Steam games)
  gameTitle: "Witcher 3",
  gameImage: "https://...",
  status: "Playing",       ← "Playing" | "Completed" | "Backlog" | "Dropped"
  source: "steam",         ← or undefined for manually added
  steamAppId: 292030,      ← only for Steam games
  playtime: 120,           ← hours played
  addedAt: Timestamp
}
```

### `followers` Collection
Stores follow relationships between users.
```
{
  followerId: "abc123",    ← the person who clicked "Follow"
  followingId: "xyz789",   ← the person being followed
  createdAt: Timestamp
}
```

### `reported_reviews` Collection
Stores reports submitted against reviews.
```
{
  reviewId: "rev456",
  gameId: 3328,
  gameTitle: "The Witcher 3",
  reviewText: "...",
  authorId: "baduser123",
  authorName: "ToxicUser",
  reporterId: "abc123",
  reporterName: "ArjunA",
  status: "pending",       ← "pending" | "dismissed" | "resolved"
  createdAt: Timestamp
}
```

---

---

# PART 6: KEY FEATURES — HOW THEY WORK END TO END

## Feature 1: Google Sign-In + First Time User Setup
1. User clicks "Sign In with Google" → `handleGoogleSignIn()` called
2. `signInWithPopup(auth, provider)` → Google popup opens
3. User selects Google account → Firebase handles OAuth
4. `onAuthStateChanged` fires → we get the `user` object
5. We check Firestore: `getDoc(doc(db, "users", user.uid))`
6. If no document found → first time → `setDoc()` creates their profile
7. We set up `onSnapshot` to listen for real-time changes to their user doc

## Feature 2: Posting a Review (GameDetails.jsx)
1. User types in the review textarea and clicks submit
2. `handleSubmitReview()` is called
3. Checks `auth.currentUser` (must be logged in)
4. `addDoc(collection(db, "reviews"), { ... })` writes to Firestore
5. `fetchReviews()` is called to refresh the list

## Feature 3: Banning a User (AdminDashboard.jsx)
1. Admin clicks "Ban User" button
2. `toggleBan(userId, currentStatus)` is called
3. `updateDoc(doc(db, "users", userId), { banned: true })` updates Firestore
4. The banned user's `onSnapshot` listener in App.jsx fires
5. App.jsx sees `banned: true` → calls `signOut(auth)` → user is kicked out

## Feature 4: Reporting a Review (GameDetails.jsx)
1. User clicks "Report" on another user's review
2. `handleReport(review)` verifies user is logged in and not the author
3. `addDoc(collection(db, "reported_reviews"), { ... })` creates a report
4. Admin sees it in `AdminDashboard.jsx` under Reports tab
5. Admin can Dismiss, Delete Review, or Ban User + Delete Review

## Feature 5: Follow/Unfollow (Profile.jsx)
1. User clicks "Follow" on another user's profile
2. `followUser()` first checks with `getDocs(query(...))` if already following (idempotency check)
3. If not following → `addDoc(collection(db, "followers"), { followerId, followingId })` 
4. `setFollowersCount(prev => prev + 1)` updates the count locally (optimistic update)
5. To unfollow: `deleteDoc(doc(db, "followers", followDocId))`

## Feature 6: Personal Game Library (GameDetails.jsx + Profile.jsx)
1. User clicks "Add to Library" on a game → status dropdown appears
2. `handleStatusSelect("Playing")` checks if already in library
3. If not → `addDoc(collection(db, "library"), { userId, gameId, status, ... })`
4. If yes → `updateDoc(...)` to change the status
5. On Profile page → `getDocs(query(collection(db, "library"), where("userId", "==", uid)))` fetches all library items

---

---

# PART 7: COMMON VIVA QUESTIONS & ANSWERS

**Q: What is the difference between React and ReactDOM?**
A: `react` is the library itself (components, hooks, JSX). `react-dom` specifically provides the tools to render React components into the actual browser DOM. We use `createRoot` from `react-dom/client` to mount our app.

**Q: What is the Virtual DOM?**
A: The Virtual DOM is a lightweight JavaScript copy of the actual browser DOM. When state changes, React updates the Virtual DOM first, then compares it to the previous version (this process is called "diffing"), and only updates the specific parts of the real DOM that changed. This is much faster than re-rendering the whole page.

**Q: What is the difference between SQL (like MySQL) and Firestore?**
A: SQL is relational — data is in tables with fixed columns and rows, and you join tables together. Firestore is NoSQL — data is in flexible documents inside collections. In GameHive, each user's document can have different fields. There are no joins — we manually fetch related data (like fetching a user's name when displaying their review).

**Q: What is CORS and how did we solve it?**
A: CORS (Cross-Origin Resource Sharing) is a browser security rule that blocks a web page from making requests to a different domain. Our React app is on `localhost:5173` and RAWG API is on `api.rawg.io` — different domains. We solved this using Vite's proxy configuration, which forwards requests through our own server (same origin), hiding the cross-origin nature from the browser.

**Q: What is a Firebase API Key? Is it secret?**
A: The Firebase API key is NOT a secret in the traditional sense — it's a public identifier that tells Firebase which project your app belongs to. Firebase security is enforced through **Firestore Security Rules** on the server side, not by hiding the API key. However, we still store it in `.env` to keep it out of our Git history.

**Q: What is async/await in JavaScript?**
A: `async/await` is a way to write asynchronous (non-blocking) code that looks like synchronous code. All Firebase operations (fetching data, writing data) are asynchronous — they take time. Without async/await, we'd use `.then()` callbacks (which become messy). With async/await, we can write:
```js
const snap = await getDoc(userRef); // Wait for this to complete before moving on
```

**Q: What is the difference between `getDoc` and `getDocs`?**
A: `getDoc` fetches a **single document** by its exact path (e.g., `users/abc123`). `getDocs` fetches **multiple documents** — either an entire collection or filtered results from a `query()`.

**Q: What is Cloudinary and why did you use it instead of Firebase Storage?**
A: Cloudinary is a third-party image hosting service. We used it for profile picture uploads because it offers built-in image transformations (like automatically cropping to a face) using URL parameters: `/upload/w_300,h_300,c_fill,g_face/`. Firebase Storage doesn't offer this built-in transformation capability.

**Q: What does `{ merge: true }` do in `setDoc`?**
A: Without `merge: true`, `setDoc` completely replaces the document — all existing fields are lost. With `{ merge: true }`, it behaves like `updateDoc` — only the specified fields are updated, everything else stays as-is. We use `merge: true` when updating profiles to avoid accidentally deleting fields like `role` or `banned`.

**Q: Why do we use `onAuthStateChanged` instead of just reading `auth.currentUser`?**
A: `auth.currentUser` is `null` right when the page loads, even if the user is actually logged in (Firebase needs a moment to restore the session from local storage/cookies). `onAuthStateChanged` is a listener that fires correctly after Firebase has initialized and determined the auth state. Using `auth.currentUser` directly can lead to bugs where the user appears logged out briefly on page refresh.

---

---

# PART 8: TECHNOLOGY SUMMARY TABLE

| Technology | Version | Role in GameHive |
|-----------|---------|-----------------|
| React | 19.2.0 | UI component library |
| Vite | 7.2.4 | Build tool, dev server |
| React Router DOM | 7.10.1 | Client-side routing |
| Firebase | 12.6.0 | Authentication + Database |
| Firebase Auth | - | Google Sign-In |
| Cloud Firestore | - | NoSQL Database |
| Lucide React | 0.561.0 | Icons (Shield, Star, etc.) |
| Cloudinary | CDN | Profile photo hosting |
| RAWG API | REST | Game data source |
| Steam API | REST | Steam library integration |

---

*GameHive Viva Notes — Prepared for Course Viva 2026*
