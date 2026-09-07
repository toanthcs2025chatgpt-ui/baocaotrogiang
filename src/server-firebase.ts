import { initializeApp, applicationDefault, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

let firestore: ReturnType<typeof getFirestore> | null = null;
let isFirestoreAvailable = true;
let hasLoggedWarning = false;

try {
  let projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        projectId = config.projectId;
      }
    } catch (err) {
      console.warn("Could not read firebase-applet-config.json:", err);
    }
  }

  const app = getApps().length > 0 ? getApp() : initializeApp({
    credential: applicationDefault(),
    projectId: projectId || "gen-lang-client-0545405593"
  });

  const databaseId = "ai-studio-clbtonthythnghth-5703903c-3494-4364-abf2-fadc70800711";
  try {
    firestore = getFirestore(app, databaseId);
  } catch (err) {
    firestore = getFirestore(app);
  }
} catch(e) {
  isFirestoreAvailable = false;
  console.info("Firebase Admin not configured or optional:", e);
}

export async function safeSetFirestoreDoc(collectionName: string, docId: string, data: any): Promise<boolean> {
  if (!firestore || !isFirestoreAvailable) return false;
  try {
    await firestore.collection(collectionName).doc(docId).set(data);
    return true;
  } catch (err: any) {
    const msg = (err.message || "").toLowerCase();
    const code = err.code || err.status || 0;
    if (
      code === 7 ||
      msg.includes("permission_denied") ||
      msg.includes("has not been used in project") ||
      msg.includes("disabled") ||
      msg.includes("not found")
    ) {
      isFirestoreAvailable = false;
      if (!hasLoggedWarning) {
        hasLoggedWarning = true;
        console.info("[Firestore Admin] Cloud Firestore API is not enabled in this GCP project. Operating with local file-backed persistence & real-time SSE memory sync.");
      }
    } else {
      console.warn("[Firestore Admin] Warning:", err.message);
    }
    return false;
  }
}

export async function safeGetFirestoreDoc(collectionName: string, docId: string): Promise<any | null> {
  if (!firestore || !isFirestoreAvailable) return null;
  try {
    const doc = await firestore.collection(collectionName).doc(docId).get();
    if (doc.exists) {
      return doc.data();
    }
    return null;
  } catch (err: any) {
    const msg = (err.message || "").toLowerCase();
    const code = err.code || err.status || 0;
    if (
      code === 7 ||
      msg.includes("permission_denied") ||
      msg.includes("has not been used in project") ||
      msg.includes("disabled") ||
      msg.includes("not found")
    ) {
      isFirestoreAvailable = false;
      if (!hasLoggedWarning) {
        hasLoggedWarning = true;
        console.info("[Firestore Admin] Cloud Firestore API is not enabled in this GCP project. Operating with local file-backed persistence & real-time SSE memory sync.");
      }
    }
    return null;
  }
}

export { firestore, isFirestoreAvailable };
