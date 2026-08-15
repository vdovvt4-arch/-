[15/08/2026 05:29 ص] عبدالله فاضل | Abdluh fudil .: // ============================================================
// طبيّة — firebase-client.js
// Firebase configuration & data layer. Exposes Auth and Api
// on window so every page's regular (non-module) script can use
// them once the "firebase-ready" event has fired.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider,
  OAuthProvider, signOut, updateProfile as fbUpdateAuthProfile,
  updatePassword as fbUpdatePassword, reauthenticateWithCredential,
  EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, getDoc, setDoc, updateDoc, collection,
  addDoc, getDocs, query, where, orderBy, deleteDoc,
  serverTimestamp, runTransaction, increment, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// ------------------------------------------------------------
// ⚙️ إعدادات المشروع (Firebase Config)
// ------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDB53ESSqNEKYxF7V3wgoPD9u8OB9yRrJk",
  authDomain: "x75t-96ae5.firebaseapp.com",
  projectId: "x75t-96ae5",
  storageBucket: "x75t-96ae5.firebasestorage.app",
  messagingSenderId: "18765637155",
  appId: "1:18765637155:web:8b040aada1a45abfdc7396",
  measurementId: "G-VFKV0FN12N"
};

// تهيئة التطبيق الأساسي
const app = initializeApp(firebaseConfig);

// تفعيل الإحصائيات (بشكل آمن لتجنب الأخطاء في بيئة التطوير المحلية)
analyticsSupported().then((ok) => { 
  if (ok) { 
    try { getAnalytics(app); } catch (e) { console.warn("Analytics not initialized"); } 
  } 
}).catch(() => {});

// تهيئة المصادقة والتخزين
const auth = getAuth(app);
const storage = getStorage(app);

// ------------------------------------------------------------
// 💾 تهيئة قاعدة البيانات مع دعم العمل دون اتصال (Offline Mode)
// ------------------------------------------------------------
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

/**
 * دالة مساعدة لتوليد اسم مستخدم عشوائي للطلاب الجدد
 * @returns {string} اسم مستخدم عشوائي
 */
function randomUsername() {
  return "user_" + Math.random().toString(36).slice(2, 8);
}

// ------------------------------------------------------------
// 👤 إدارة ملفات المستخدمين (Profiles)
// ------------------------------------------------------------
async function ensureUserDocs(user, extra = {}) {
  const profileRef = doc(db, "profiles", user.uid);
  const existing = await getDoc(profileRef);
  
  if (!existing.exists()) {
    const batch = writeBatch(db);
    
    // إنشاء ملف الطالب الأساسي
    batch.set(profileRef, {
      full_name: extra.full_name  user.displayName  "طالب جديد",
      username: extra.username || randomUsername(),
      email: user.email  extra.email  null,
      avatar_url: user.photoURL || null,
      academic_year: 2, // الافتراضي: المرحلة الثانية
      role: "student",
      welcomed: false,
      created_at: serverTimestamp()
    });
    
    // إنشاء ملف تتبع النشاط (Streaks)
    batch.set(doc(db, "streaks", user.uid), {
      current_streak: 0,
      longest_streak: 0,
      last_active_date: null
    });
    
    // تحديث عداد الطلاب العام
    batch.set(doc(db, "meta", "stats"), { studentCount: increment(1) }, { merge: true });
    
    await batch.commit();
  }
  return existing;
}

// ------------------------------------------------------------
// 🔐 وحدة المصادقة (Auth Module)
[15/08/2026 05:29 ص] عبدالله فاضل | Abdluh fudil .: // ------------------------------------------------------------
/** @namespace Auth */
const Auth = {
  /** تسجيل طالب جديد بالبريد وكلمة المرور */
  async signUpWithEmail(email, password, fullName, username) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await fbUpdateAuthProfile(cred.user, { displayName: fullName });
      await ensureUserDocs(cred.user, { full_name: fullName, username, email });
      return { data: cred, error: null };
    } catch (error) {
      console.error("SignUp Error:", error.message);
      return { data: null, error };
    }
  },

  /** تسجيل الدخول التقليدي */
  async signInWithEmail(email, password) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserDocs(cred.user);
      return { data: cred, error: null };
    } catch (error) {
      console.error("SignIn Error:", error.message);
      return { data: null, error };
    }
  },

  /** تسجيل الدخول السريع عبر جوجل */
  async signInWithGoogle() {
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      await ensureUserDocs(cred.user);
      return { data: cred, error: null };
    } catch (error) {
      console.error("Google Auth Error:", error.message);
      return { data: null, error };
    }
  },

  /** تسجيل الخروج من المنصة */
  async signOut() {
    return await signOut(auth);
  },

  /** مراقبة حالة تسجيل الدخول (مهمة لحماية الصفحات) */
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, (user) => callback(user));
  }
};

// ------------------------------------------------------------
// 🗄️ وحدة العمليات وقاعدة البيانات (API Module)
// ------------------------------------------------------------
/** @namespace Api */
const Api = {
  // ---------- إدارة الملازم والكورسات (Content) ----------
  
  /** جلب كل المواد الدراسية */
  async getSubjects() {
    const snap = await getDocs(query(collection(db, "subjects"), orderBy("order")));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  /** إضافة ملزمة (PDF) جديدة لمادة معينة */
  async addMaterial(subjectId, { title, file_url, published_by }) {
    return await addDoc(collection(db, "lectures"), {
      subject_id: subjectId,
      title: title || "بدون عنوان",
      content_type: "note",
      file_url: file_url || null,
      published_by: published_by || null,
      created_at: serverTimestamp()
    });
  },

  /** جلب الملازم الخاصة بمادة معينة */
  async getMaterials(subjectId) {
    try {
      const snap = await getDocs(query(collection(db, "lectures"), where("subject_id", "==", subjectId)));
      return snap.docs
        .map((d) => ({ id: d.id, content_type: "video", ...d.data() }))
        .filter((l) => l.content_type === "note")
        .sort((a, b) => (a.created_at?.seconds  0) - (b.created_at?.seconds  0));
    } catch (error) {
      console.error("Error fetching materials:", error);
      return [];
    }
  },

  // ---------- الرفع والتخزين (Storage) ----------
  
  /** رفع ملف (ملزمة أو صورة) إلى السيرفر وتتبع نسبة الرفع */
  uploadFile(path, file, onProgress) {
    return new Promise((resolve, reject) => {
      const ref = storageRef(storage, path);
      const task = uploadBytesResumable(ref, file);
      
      task.on("state_changed",
        (snap) => {
          if (onProgress) onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        },
        (error) => {
          console.error("Upload failed:", error);
          reject(error);
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        }
      );
    });
  },

  // ---------- نظام طلبات الأساتذة (Teacher Requests) ----------
  
  /** إرسال طلب انضمام كأستاذ من واجهة التسجيل */
  async submitTeacherRequest(uid, { full_name, email, specialty, bio }) {
    return await setDoc(doc(db, "teacherRequests", uid), {
      full_name: full_name || "",
      email: email || "",
      specialty: specialty || "",
      bio: bio || "",
[15/08/2026 05:29 ص] عبدالله فاضل | Abdluh fudil .: status: "pending",
      created_at: serverTimestamp()
    });
  }
};

// ------------------------------------------------------------
// 🚀 تصدير الوحدات (Exports)
// ------------------------------------------------------------
export { auth, db, storage, Auth, Api };

// إتاحة الوصول المباشر للملفات القديمة التي لا تستخدم نظام الـ Modules
window.Auth = Auth;
window.Api = Api;
window.dispatchEvent(new CustomEvent("firebase-ready", { detail: { status: "initialized" } }));