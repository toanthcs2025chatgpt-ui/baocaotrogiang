import { getFirebaseInstance } from "../services/firebase";

const { db: firestoreDb } = getFirebaseInstance();

export const db = firestoreDb;
export const app = null; // app is not needed directly if we have db
