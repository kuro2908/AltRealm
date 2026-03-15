import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { auth, firestore } from "./firebase";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Firestore data structure ───────────────────────────────────────────────
// users/{uid}                       → { email, displayName, bgTheme }
// stories/{storyId}                 → { id, title, ..., authorId }
// nodes/{storyId}                   → { data: [...] }
// feed/{storyId}                    → { id, title, upvotedBy[], ... }
// comments/{storyId}                → { data: [...] }
// explore/{uid}_{storyId}           → { revealed[], chosenAt{} }
// ────────────────────────────────────────────────────────────────────────────

function uid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.uid;
}

export const db = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  async login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  },

  async signup(email: string, password: string, displayName: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await setDoc(doc(firestore, "users", cred.user.uid), {
      email,
      displayName,
      bgTheme: "default",
    });
    return cred.user;
  },

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const ref = doc(firestore, "users", cred.user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        email: cred.user.email,
        displayName: cred.user.displayName,
        bgTheme: "default",
      });
    }
    return cred.user;
  },

  async logout() {
    await signOut(auth);
  },

  // ── User profile ──────────────────────────────────────────────────────────
  async getUser() {
    const user = auth.currentUser;
    if (!user) return null;
    const snap = await getDoc(doc(firestore, "users", user.uid));
    if (!snap.exists()) return { email: user.email, displayName: user.displayName };
    return snap.data();
  },

  async saveUser(data: any) {
    await setDoc(doc(firestore, "users", uid()), data, { merge: true });
  },

  // ── Community feed ────────────────────────────────────────────────────────
  async getFeed() {
    const snap = await getDocs(collection(firestore, "feed"));
    return snap.docs.map(d => d.data());
  },

  async saveFeed(data: any[]) {
    const existing = await getDocs(collection(firestore, "feed"));
    const newIds = new Set(data.map(s => s.id));
    const batch = writeBatch(firestore);
    existing.docs.forEach(d => { if (!newIds.has(d.id)) batch.delete(d.ref); });
    data.forEach(item => { batch.set(doc(firestore, "feed", item.id), item); });
    await batch.commit();
  },

  // ── My stories ────────────────────────────────────────────────────────────
  async getMyStories() {
    const authorId = uid();
    const q = query(collection(firestore, "stories"), where("authorId", "==", authorId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  },

  async saveMyStories(data: any[]) {
    const authorId = uid();
    const q = query(collection(firestore, "stories"), where("authorId", "==", authorId));
    const existing = await getDocs(q);
    const newIds = new Set(data.map(s => s.id));
    const batch = writeBatch(firestore);
    existing.docs.forEach(d => { if (!newIds.has(d.id)) batch.delete(d.ref); });
    data.forEach(story => {
      batch.set(doc(firestore, "stories", story.id), { ...story, authorId });
    });
    await batch.commit();
  },

  // ── Story nodes ───────────────────────────────────────────────────────────
  async getStoryNodes(storyId: string) {
    const snap = await getDoc(doc(firestore, "nodes", storyId));
    return snap.exists() ? snap.data().data : null;
  },

  async saveStoryNodes(storyId: string, nodes: any) {
    await setDoc(doc(firestore, "nodes", storyId), { data: nodes });
  },

  // ── Explore state (fog-of-war) ────────────────────────────────────────────
  async getExploreState(storyId: string) {
    const snap = await getDoc(doc(firestore, "explore", `${uid()}_${storyId}`));
    return snap.exists() ? snap.data() : null;
  },

  async saveExploreState(storyId: string, data: { revealed: string[]; chosenAt: Record<string, number[]> }) {
    await setDoc(doc(firestore, "explore", `${uid()}_${storyId}`), data);
  },

  // ── Comments ──────────────────────────────────────────────────────────────
  async getComments(storyId: string) {
    const snap = await getDoc(doc(firestore, "comments", storyId));
    return snap.exists() ? snap.data().data : [];
  },

  async saveComments(storyId: string, comments: any[]) {
    await setDoc(doc(firestore, "comments", storyId), { data: comments });
  },
};
