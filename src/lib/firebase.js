import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDf-HfVsB0Tp4v3nI60FMBEXXkvnIDIKeA",
  authDomain: "study-sketch-88ad0.firebaseapp.com",
  projectId: "study-sketch-88ad0",
  storageBucket: "study-sketch-88ad0.firebasestorage.app",
  messagingSenderId: "589677069539",
  appId: "1:589677069539:web:b9c182148b9e2ec3b1f1d6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
