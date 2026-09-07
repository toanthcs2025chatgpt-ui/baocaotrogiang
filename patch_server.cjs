const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

const firebaseImport = `
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let firestore = null;
try {
  const app = initializeApp({
    credential: applicationDefault(),
    projectId: "gen-lang-client-0912196626"
  });
  // firebase-admin >= 12 supports passing databaseId to getFirestore
  firestore = getFirestore(app, "ai-studio-clbtonthythnghth-5703903c-3494-4364-abf2-fadc70800711");
  console.log("Firebase Admin initialized");
} catch(e) {
  console.warn("Firebase admin initialization warning:", e.message);
}
`;

serverCode = serverCode.replace(
  'dotenv.config();',
  'dotenv.config();\n' + firebaseImport
);

const pullLogic = `
// Try loading existing stored snapshot on server start
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(SHARED_STORE_FILE)) {
    const raw = fs.readFileSync(SHARED_STORE_FILE, "utf-8");
    if (raw) {
      sharedCloudStore = JSON.parse(raw);
    }
  }
} catch (e) {
  console.warn("Could not read shared_cloud_store.json:", e);
}

// Load from Firestore async
if (firestore) {
  firestore.collection('cloudSync').doc('sharedStore').get()
    .then(doc => {
      if (doc.exists) {
        const data = doc.data();
        if (data && data.version > sharedCloudStore.version) {
          sharedCloudStore = data;
          console.log("Loaded newer sharedCloudStore from Firebase Firestore");
        }
      }
    })
    .catch(err => console.warn("Could not load from Firestore:", err.message));
}
`;

serverCode = serverCode.replace(
  /try \{\s*if \(\!fs\.existsSync\(DATA_DIR\)\) \{[\s\S]*?\} catch \(e\) \{\s*console\.warn\("Could not read shared_cloud_store\.json:", e\);\s*\}/,
  pullLogic
);

const pushLogicReplaced = `
      // Persist to local disk cache
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(SHARED_STORE_FILE, JSON.stringify(sharedCloudStore, null, 2), "utf-8");
      } catch (err) {
        console.warn("Could not write to shared_cloud_store.json:", err);
      }

      // Persist to Firebase Firestore
      if (firestore) {
        firestore.collection('cloudSync').doc('sharedStore').set(sharedCloudStore)
          .catch(err => console.warn("Failed to push to Firestore:", err.message));
      }
`;

serverCode = serverCode.replace(
  /try \{\s*if \(\!fs\.existsSync\(DATA_DIR\)\) \{[\s\S]*?console\.warn\("Could not write to shared_cloud_store\.json:", err\);\s*\}/,
  pushLogicReplaced
);

fs.writeFileSync('server.ts', serverCode, 'utf8');
console.log("Patched server.ts");
