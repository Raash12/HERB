// utils/auth.js
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Get user role by UID
 */
export const getUserRole = async (uid) => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data().role;
};

/**
 * Find user by email OR full name
 */
export const findUserByEmailOrName = async (identifier) => {
  const usersRef = collection(db, "users");

  // Query by email
  let q = query(usersRef, where("email", "==", identifier));
  let querySnap = await getDocs(q);

  if (querySnap.empty) {
    // Query by fullName
    q = query(usersRef, where("fullName", "==", identifier));
    querySnap = await getDocs(q);
  }

  if (querySnap.empty) return null;
  return { uid: querySnap.docs[0].id, ...querySnap.docs[0].data() };
};