import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut as firebaseSignOut, type User } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

export const firebaseConfig: FirebaseConfig | null = import.meta.env.VITE_FIREBASE_API_KEY
  ? {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
    }
  : null

// Initialize Firebase app, Auth, and Firestore only when config is present
const app = firebaseConfig ? initializeApp(firebaseConfig) : null
const auth = app ? getAuth(app) : null
const db = app ? getFirestore(app) : null

export const firebaseConnectionLabel = firebaseConfig ? 'Firebase connected — TropoTrace' : 'Firebase not connected — demo data only'

// ── Auth helpers ──────────────────────────────────────────────────────
export const getFirebaseAuth = () => auth

export const signInWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error('Firebase Auth is not initialized')
  return signInWithEmailAndPassword(auth, email, password)
}

export const createAccount = async (email: string, password: string) => {
  if (!auth) throw new Error('Firebase Auth is not initialized')
  return createUserWithEmailAndPassword(auth, email, password)
}

export const sendPasswordReset = async (email: string) => {
  if (!auth) throw new Error('Firebase Auth is not initialized')
  return sendPasswordResetEmail(auth, email)
}

export const signOut = async () => {
  if (!auth) throw new Error('Firebase Auth is not initialized')
  return firebaseSignOut(auth)
}

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

// ── Firestore helpers ─────────────────────────────────────────────────
export const getFirebaseDb = () => db

export const saveUserProfile = async (uid: string, data: { displayName?: string; email: string; role?: string }) => {
  if (!db) return
  await setDoc(doc(db, 'users', uid), { ...data, createdAt: serverTimestamp() }, { merge: true })
}

export const getUserProfile = async (uid: string) => {
  if (!db) return null
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

export const saveAlert = async (uid: string, alert: { title: string; language: string; severity: string; area: string; message: string }) => {
  if (!db) return
  await addDoc(collection(db, 'users', uid, 'savedAlerts'), { ...alert, createdAt: serverTimestamp() })
}

export const saveScenarioRun = async (uid: string, run: { scenarioKey: string; scenarioLabel: string; lastMinute: number; mode: string }) => {
  if (!db) return
  await addDoc(collection(db, 'users', uid, 'scenarioRuns'), { ...run, startedAt: serverTimestamp() })
}

export { type User }
