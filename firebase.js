/* =============================================
   FOOD EXPRESS — firebase.js
   Firebase Auth + Firestore Integration
   =============================================

   SETUP INSTRUCTIONS:
   1. Go to https://console.firebase.google.com
   2. Click "Add project" → name it "food-express"
   3. Go to Project Settings → General → Your apps → Web app (</>)
   4. Register app and copy the firebaseConfig object below
   5. Enable Authentication:
      - Firebase Console → Authentication → Sign-in method
      - Enable "Email/Password"
   6. Enable Firestore:
      - Firebase Console → Firestore Database → Create database
      - Start in "test mode" for development
   7. Replace the placeholder config below with your real config
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ─── YOUR FIREBASE CONFIG ─── */
/* Replace this with your actual Firebase project config */
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

/* ─── Initialize Firebase ─── */
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

/* =============================================
   AUTH FUNCTIONS
   ============================================= */

/**
 * Register a new user
 * Creates Firebase Auth account + Firestore user document
 */
export async function registerUser({ firstName, lastName, email, phone, password }) {
  try {
    // 1. Create auth account
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // 2. Set display name
    await updateProfile(cred.user, {
      displayName: `${firstName} ${lastName}`
    });

    // 3. Save extra user info to Firestore
    await setDoc(doc(db, "users", cred.user.uid), {
      uid:       cred.user.uid,
      firstName,
      lastName,
      email,
      phone,
      createdAt: serverTimestamp(),
      role:      "customer"
    });

    return { success: true, user: cred.user };
  } catch (err) {
    return { success: false, error: friendlyError(err.code) };
  }
}

/**
 * Login existing user
 */
export async function loginUser({ email, password }) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: cred.user };
  } catch (err) {
    return { success: false, error: friendlyError(err.code) };
  }
}

/**
 * Logout current user
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Listen to auth state changes
 * callback(user) — user is null when logged out
 */
export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current logged-in user
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/* =============================================
   CART FUNCTIONS (Firestore)
   ============================================= */

/**
 * Save full cart to Firestore for a user
 */
export async function saveCartToFirestore(userId, cartItems) {
  try {
    await setDoc(doc(db, "carts", userId), {
      items:     cartItems,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Load cart from Firestore for a user
 */
export async function loadCartFromFirestore(userId) {
  try {
    const snap = await getDoc(doc(db, "carts", userId));
    if (snap.exists()) {
      return { success: true, items: snap.data().items || [] };
    }
    return { success: true, items: [] };
  } catch (err) {
    return { success: false, error: err.message, items: [] };
  }
}

/**
 * Clear cart in Firestore
 */
export async function clearCartInFirestore(userId) {
  try {
    await setDoc(doc(db, "carts", userId), { items: [], updatedAt: serverTimestamp() });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* =============================================
   ORDER FUNCTIONS (Firestore)
   ============================================= */

/**
 * Place a new order
 * Saves order to Firestore "orders" collection
 */
export async function placeOrder({ userId, userEmail, userName, items, subtotal, delivery, tax, total }) {
  try {
    const orderRef = await addDoc(collection(db, "orders"), {
      userId,
      userEmail,
      userName,
      items,
      pricing: { subtotal, delivery, tax, total },
      status:    "confirmed",
      createdAt: serverTimestamp(),
      estimatedDelivery: "30 minutes"
    });
    return { success: true, orderId: orderRef.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Get all orders for a user
 */
export async function getUserOrders(userId) {
  try {
    const q    = query(collection(db, "orders"), where("userId", "==", userId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, orders };
  } catch (err) {
    return { success: false, error: err.message, orders: [] };
  }
}

/* =============================================
   CONTACT FORM (Firestore)
   ============================================= */

/**
 * Save contact form submission to Firestore
 */
export async function submitContactForm({ name, email, message }) {
  try {
    await addDoc(collection(db, "contacts"), {
      name,
      email,
      message,
      createdAt: serverTimestamp(),
      read:      false
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* =============================================
   USER PROFILE (Firestore)
   ============================================= */

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(userId) {
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (snap.exists()) return { success: true, profile: snap.data() };
    return { success: false, error: "Profile not found" };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, data) {
  try {
    await updateDoc(doc(db, "users", userId), { ...data, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ─── Helper: Human-readable error messages ─── */
function friendlyError(code) {
  const map = {
    "auth/email-already-in-use":    "This email is already registered. Try logging in.",
    "auth/invalid-email":           "Please enter a valid email address.",
    "auth/weak-password":           "Password must be at least 6 characters.",
    "auth/user-not-found":          "No account found with this email.",
    "auth/wrong-password":          "Incorrect password. Please try again.",
    "auth/too-many-requests":       "Too many attempts. Please try again later.",
    "auth/network-request-failed":  "Network error. Check your connection.",
    "auth/invalid-credential":      "Invalid email or password."
  };
  return map[code] || "Something went wrong. Please try again.";
}

export { auth, db };
