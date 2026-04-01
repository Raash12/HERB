import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Save report to Firestore
 * @param {string} collectionName - collection-ka lagu keydinayo
 * @param {object} reportData - xogta report-ka
 */
export async function saveReport(collectionName, reportData) {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...reportData,
      savedAt: serverTimestamp(),
    });
    console.log(`Report saved with ID: ${docRef.id}`);
    return docRef.id;
  } catch (err) {
    console.error("Error saving report:", err);
    throw err;
  }
}