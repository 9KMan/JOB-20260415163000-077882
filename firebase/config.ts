import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  Unsubscribe,
  DocumentData,
  QuerySnapshot,
  Query,
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

export const initFirebase = (): { app: FirebaseApp; db: Firestore; auth: Auth } => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  }

  return { app, db, auth };
};

export const getFirebaseApp = (): FirebaseApp => {
  if (!app) {
    initFirebase();
  }
  return app;
};

export const getDb = (): Firestore => {
  if (!db) {
    initFirebase();
  }
  return db;
};

export const getAuthInstance = (): Auth => {
  if (!auth) {
    initFirebase();
  }
  return auth;
};

export const subscribeToCollection: <T = DocumentData>(
  collectionName: string,
  callbacks: {
    onNext: (snapshot: QuerySnapshot<T>) => void;
    onError: (error: Error) => void;
  },
  constraints?: {
    where?: [string, string, unknown][];
    orderBy?: [string, 'asc' | 'desc'][];
    limit?: number;
  }
) => Unsubscribe = (collectionName, callbacks, constraints) => {
  const db = getDb();
  let q: Query = collection(db, collectionName);

  if (constraints?.where) {
    constraints.where.forEach(([field, op, value]) => {
      q = query(q, where(field, op, value));
    });
  }

  if (constraints?.orderBy) {
    constraints.orderBy.forEach(([field, direction]) => {
      q = query(q, orderBy(field, direction));
    });
  }

  if (constraints?.limit) {
    q = query(q, where('__name__', '>', ''));
  }

  return onSnapshot(
    q as Query<DocumentData>,
    (snapshot) => {
      callbacks.onNext(snapshot as QuerySnapshot<T>);
    },
    (error) => {
      callbacks.onError(error);
    }
  );
};

export const createAuthContext = () => {
  const auth = getAuthInstance();

  const subscribe: (
    callback: (user: User | null) => void
  ) => Unsubscribe = (callback) => {
    return onAuthStateChanged(auth, callback);
  };

  const signIn = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    return firebaseSignOut(auth);
  };

  return {
    subscribe,
    signIn,
    signUp,
    signOut,
    currentUser: auth.currentUser,
  };
};

export { collection, onSnapshot, query, where, orderBy };
export type { Unsubscribe, DocumentData, QuerySnapshot, Query } from 'firebase/firestore';
export type { User } from 'firebase/auth';