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
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export const initFirebase = (): { app: FirebaseApp; db: Firestore; auth: Auth } => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  }

  return { app: app!, db: db!, auth: auth! };
};

export const getFirebaseApp = (): FirebaseApp => {
  if (!app) initFirebase();
  return app!;
};

export const getDb = (): Firestore => {
  if (!db) initFirebase();
  return db!;
};

export const getAuthInstance = (): Auth => {
  if (!auth) initFirebase();
  return auth!;
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

export const leadCollection = (userId: string) => {
  const db = getDb();
  return collection(db, 'leads');
};

export const subscribeToLeads = (
  userId: string,
  callbacks: {
    onNext: (leads: DocumentData[]) => void;
    onError: (error: Error) => void;
  },
  filters?: { status?: string }
) => {
  const leadsRef = leadCollection(userId);
  let q: Query = leadsRef;

  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }

  q = query(q, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const leads = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      });
      callbacks.onNext(leads);
    },
    (error) => {
      callbacks.onError(error);
    }
  );
};

export const createLead = async (userId: string, leadData: Partial<DocumentData>) => {
  const leadsRef = leadCollection(userId);
  const docRef = doc(leadsRef);
  await setDoc(docRef, {
    ...leadData,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateLead = async (leadId: string, userId: string, leadData: Partial<DocumentData>) => {
  const leadsRef = leadCollection(userId);
  const docRef = doc(leadsRef, leadId);
  await updateDoc(docRef, {
    ...leadData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteLead = async (leadId: string, userId: string) => {
  const leadsRef = leadCollection(userId);
  const docRef = doc(leadsRef, leadId);
  await deleteDoc(docRef);
};

export const getLead = async (leadId: string, userId: string) => {
  const leadsRef = leadCollection(userId);
  const docRef = doc(leadsRef, leadId);
  const doc = await getDoc(docRef);
  if (doc.exists()) {
    return { id: doc.id, ...doc.data() };
  }
  return null;
};

export const createAuthContext = () => {
  const auth = getAuthInstance();

  const subscribe = (callback: (user: User | null) => void): Unsubscribe => {
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

  const updateUserProfile = async (displayName: string) => {
    if (auth.currentUser) {
      return updateProfile(auth.currentUser, { displayName });
    }
  };

  return {
    subscribe,
    signIn,
    signUp,
    signOut,
    updateUserProfile,
    currentUser: auth.currentUser,
  };
};

export { collection, onSnapshot, query, where, orderBy };
export type { Unsubscribe, DocumentData, QuerySnapshot, Query } from 'firebase/firestore';
export type { User } from 'firebase/auth';
