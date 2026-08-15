// ============================================================
// طبيّة — firebase-client.js
// Firebase configuration & data layer. Exposes `Auth` and `Api`
// on window so every page's regular (non-module) script can use
// them once the "firebase-ready" event has fired.
//
// Loaded as an ES module:
// <script type="module" src="js/firebase-client.js"></script>
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider,
  OAuthProvider, signOut, updateProfile as fbUpdateAuthProfile,
  updatePassword as fbUpdatePassword, reauthenticateWithCredential,
  EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, collection,
  addDoc, getDocs, query, where, orderBy, deleteDoc,
  serverTimestamp, runTransaction, increment, writeBatch
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import {
  getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDB53ESSqNEKYxF7V3wgoPD9u8OB9yRrJk",
  authDomain: "x75t-96ae5.firebaseapp.com",
  databaseURL: "https://x75t-96ae5-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "x75t-96ae5",
  storageBucket: "x75t-96ae5.firebasestorage.app",
  messagingSenderId: "18765637155",
  appId: "1:18765637155:web:1323bab53d71972adc7396",
  measurementId: "G-FC1LSMTF9G"
};

const isLocalFileMode = window.location.protocol === "file:";
const isOfflineMode = isLocalFileMode || !navigator.onLine;

function randomId(prefix = "id") {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return prefix + "_" + window.crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  }
  return prefix + "_" + Math.random().toString(36).slice(2, 10);
}

const app = isOfflineMode ? null : initializeApp(firebaseConfig);
let analyticsReady = false;
if (!isOfflineMode) {
  analyticsSupported().then((ok) => {
    if (!ok) return;
    try {
      getAnalytics(app);
      analyticsReady = true;
    } catch (e) {
      // noop
    }
  }).catch(() => {});
}

const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const storage = app ? getStorage(app) : null;

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

function ensureOfflineSeedData() {
  const profiles = readStorage("tibbiya_profiles", []);
  if (!profiles.length) {
    const demoProfiles = [
      { id: "demo_admin", uid: "demo_admin", full_name: "مسؤول التطبيق", email: "admin@tibbiya.local", username: "admin_demo", role: "admin", avatar_url: "", created_at: new Date().toISOString(), welcomed: true },
      { id: "demo_teacher", uid: "demo_teacher", full_name: "د. سارة أحمد", email: "teacher@tibbiya.local", username: "teacher_demo", role: "teacher", avatar_url: "", created_at: new Date().toISOString(), welcomed: true },
      { id: "demo_student", uid: "demo_student", full_name: "أحمد محمد", email: "student@tibbiya.local", username: "student_demo", role: "student", avatar_url: "", created_at: new Date().toISOString(), welcomed: true }
    ];
    writeStorage("tibbiya_profiles", demoProfiles);
  }

  const subjects = readStorage("tibbiya_subjects", []);
  if (!subjects.length) {
    const demoSubjects = [
      { id: "bio", title: "الأحياء", icon: "🧬", color: "#3FA796", order: 1, description: "الخلية والوراثة والطبيعة" },
      { id: "anat", title: "التشريح", icon: "🦴", color: "#14304A", order: 2, description: "هياكل الجسم والأنسجة" },
      { id: "bioch", title: "الكيمياء الحيوية", icon: "🧪", color: "#F4A340", order: 3, description: "التفاعلات الحيوية في الجسم" },
      { id: "path", title: "المرضيات", icon: "🩺", color: "#C1440E", order: 4, description: "أساسيات الأمراض والنتائج" }
    ];
    writeStorage("tibbiya_subjects", demoSubjects);
  }

  if (!readStorage("tibbiya_lectures", []).length) {
    const defaultLectures = [
      { id: "lec_1", subject_id: "anat", title: "مقدمة في التشريح", youtube_url: "https://youtube.com/watch?v=example", file_url: "", content_type: "video", published_by: "demo_teacher", created_at: new Date().toISOString() },
      { id: "lec_2", subject_id: "bio", title: "مقدمة في الأحياء", youtube_url: "", file_url: "https://example.com/demo-biology.pdf", content_type: "video", published_by: "demo_teacher", created_at: new Date().toISOString() }
    ];
    writeStorage("tibbiya_lectures", defaultLectures);
  }

  if (!readStorage("tibbiya_materials", []).length) {
    const defaultMaterials = [
      { id: "mat_1", subject_id: "anat", title: "ملزمة التشريح", file_url: "https://example.com/anatomy.pdf", content_type: "note", published_by: "demo_teacher", created_at: new Date().toISOString() },
      { id: "mat_2", subject_id: "bio", title: "ملزمة الأحياء", file_url: "https://example.com/bio.pdf", content_type: "note", published_by: "demo_teacher", created_at: new Date().toISOString() }
    ];
    writeStorage("tibbiya_materials", defaultMaterials);
  }

  if (!readStorage("tibbiya_teacher_requests", []).length) {
    writeStorage("tibbiya_teacher_requests", []);
  }

  if (!readStorage("tibbiya_activity_log", []).length) {
    writeStorage("tibbiya_activity_log", []);
  }

  const stats = readStorage("tibbiya_stats", {});
  if (!stats.studentCount) {
    const totalStudents = readStorage("tibbiya_profiles", []).filter((p) => p.role === "student").length;
    writeStorage("tibbiya_stats", { studentCount: totalStudents });
  }
}

ensureOfflineSeedData();

const OfflineAI = {
  classifyRole(profile, candidateRole = "") {
    const text = `${profile?.full_name || ""} ${profile?.email || ""} ${candidateRole || profile?.role || ""}`.toLowerCase();
    if (candidateRole === "admin" || /admin|مسؤول|owner|manager/.test(text)) return "admin";
    if (candidateRole === "teacher" || /أستاذ|د\.|دكتور|doctor|teacher|faculty|professor/.test(text)) return "teacher";
    if (candidateRole === "student" || /student|طالب|learner/.test(text)) return "student";
    return "student";
  },
  scoreProfile(profile = {}) {
    const score = (profile.streak || 0) * 25 + (profile.points || 0) + (profile.activity_count || 0) * 6 + (profile.role === "teacher" ? 20 : profile.role === "admin" ? 30 : 10);
    return Math.max(10, Math.min(100, score));
  },
  leaderboard() {
    const profiles = readStorage("tibbiya_profiles", []).map((profile) => {
      const aiRole = OfflineAI.classifyRole(profile, profile.role || "student");
      const score = OfflineAI.scoreProfile({
        role: aiRole,
        streak: profile.streak || 0,
        activity_count: profile.activity_count || 0,
        points: profile.points || 0
      });
      return { ...profile, ai_role: aiRole, ai_score: score };
    }).sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));

    return profiles.map((item, index) => ({
      id: item.id,
      uid: item.uid,
      name: item.full_name || item.email || `User ${index + 1}`,
      role: item.ai_role,
      score: item.ai_score,
      rank: index + 1
    }));
  }
};

function normalizeUserId(userId) {
  return String(userId ?? "").trim();
}

function buildDefaultProfile(userId, source = {}) {
  const uid = normalizeUserId(userId);
  const email = String(source.email || "").trim();
  const fullName = String(source.full_name || source.displayName || (email ? email.split("@")[0] : "طالب جديد")).trim() || "طالب جديد";
  const role = source.role || OfflineAI.classifyRole({ full_name: fullName, email }, "student");
  const username = String(source.username || `user_${uid.slice(-6) || randomId("user")}`).trim();

  return {
    id: uid,
    uid,
    full_name: fullName,
    username,
    email: email || null,
    avatar_url: source.avatar_url || source.photoURL || "",
    academic_year: Number(source.academic_year || 2),
    role,
    welcomed: Boolean(source.welcomed),
    created_at: source.created_at || new Date().toISOString(),
    streak: Number(source.streak || 0),
    points: Number(source.points || 0),
    activity_count: Number(source.activity_count || 0),
    subjects: Array.isArray(source.subjects) ? source.subjects : []
  };
}

function ensureLocalProfileRecord(userId, source = {}) {
  const uid = normalizeUserId(userId);
  if (!uid) return null;

  const profiles = readStorage("tibbiya_profiles", []);
  const existing = profiles.find((item) => item.uid === uid || item.id === uid);
  if (existing) {
    return { ...existing, id: existing.id || uid, uid: existing.uid || uid };
  }

  const profile = buildDefaultProfile(uid, source);
  profiles.push(profile);
  writeStorage("tibbiya_profiles", profiles);
  return profile;
}

async function hydrateMissingProfile(userId, source = {}) {
  const uid = normalizeUserId(userId);
  if (!uid) return null;

  const localProfile = ensureLocalProfileRecord(uid, source);
  if (isOfflineMode || !db) return localProfile;

  try {
    const profile = buildDefaultProfile(uid, source);
    await setDoc(doc(db, "profiles", uid), profile);
    return profile;
  } catch (e) {
    return localProfile;
  }
}

function ensureUserDocs(user, extra = {}) {
  const profileRef = doc(db, "profiles", user.uid);
  return getDoc(profileRef).then((existing) => {
    if (!existing.exists()) {
      return setDoc(profileRef, {
        full_name: extra.full_name || user.displayName || "طالب جديد",
        username: extra.username || randomId("user"),
        email: user.email || extra.email || null,
        avatar_url: user.photoURL || null,
        academic_year: 2,
        role: "student",
        welcomed: false,
        created_at: serverTimestamp()
      }).then(() => setDoc(doc(db, "streaks", user.uid), {
        current_streak: 0,
        longest_streak: 0,
        last_active_date: null
      })).then(() => setDoc(doc(db, "meta", "stats"), { studentCount: increment(1) }, { merge: true }));
    }
    return existing;
  }).catch(() => Promise.resolve(null));
}

const Auth = {
  async signUpWithEmail(email, password, fullName, roleHint = "student") {
    if (isOfflineMode || !auth || !db) {
      const exists = readStorage("tibbiya_profiles", []).find((profile) => (profile.email || "").toLowerCase() === String(email).trim().toLowerCase());
      if (exists) {
        return { data: null, error: { code: "auth/email-already-in-use", message: "البريد مستخدم بالفعل" } };
      }
      const uid = randomId("local");
      const profile = {
        id: uid,
        uid,
        full_name: fullName || "طالب جديد",
        email: String(email).trim(),
        username: randomId("user"),
        avatar_url: "",
        role: OfflineAI.classifyRole({ full_name: fullName || "طالب جديد", email: String(email).trim() }, roleHint || "student"),
        academic_year: 2,
        welcomed: false,
        created_at: new Date().toISOString(),
        streak: 0,
        points: 0,
        activity_count: 0
      };
      const profiles = readStorage("tibbiya_profiles", []);
      profiles.push(profile);
      writeStorage("tibbiya_profiles", profiles);
      writeStorage("tibbiya_current_user", uid);
      return { data: { user: { uid, id: uid, email: String(email).trim(), displayName: fullName || "طالب جديد" } }, error: null };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await fbUpdateAuthProfile(cred.user, { displayName: fullName });
      await ensureUserDocs(cred.user, { full_name: fullName, username: roleHint || "user", email });
      return { data: cred, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async signInWithEmail(email, password) {
    if (isOfflineMode || !auth || !db) {
      const profiles = readStorage("tibbiya_profiles", []);
      const profile = profiles.find((item) => (item.email || "").toLowerCase() === String(email).trim().toLowerCase());
      if (!profile) {
        return { data: null, error: { code: "auth/user-not-found", message: "لا يوجد حساب بهذا البريد" } };
      }
      if (String(password).trim() === "") {
        return { data: null, error: { code: "auth/wrong-password", message: "كلمة المرور غير صحيحة" } };
      }
      writeStorage("tibbiya_current_user", profile.uid);
      return { data: { user: { uid: profile.uid, id: profile.uid, email: profile.email, displayName: profile.full_name } }, error: null };
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserDocs(cred.user);
      return { data: cred, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async signInWithGoogle() {
    if (isOfflineMode || !auth) {
      return { data: { user: { uid: "local_guest", email: "guest@local" } }, error: null };
    }
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      await ensureUserDocs(cred.user);
      return { data: cred, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async signInWithApple() {
    if (isOfflineMode || !auth) {
      return { data: { user: { uid: "local_guest", email: "guest@local" } }, error: null };
    }
    try {
      const cred = await signInWithPopup(auth, new OAuthProvider("apple.com"));
      await ensureUserDocs(cred.user);
      return { data: cred, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async signOut() {
    if (isOfflineMode || !auth) {
      writeStorage("tibbiya_current_user", null);
      return true;
    }
    return await signOut(auth);
  },

  async changePassword(currentPassword, newPassword) {
    if (isOfflineMode || !auth) {
      return { error: null };
    }
    try {
      const user = auth.currentUser;
      if (!user || !user.email) return { error: { message: "لا يمكن تغيير كلمة السر لهذا نوع الحساب" } };
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
      await fbUpdatePassword(user, newPassword);
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  async getUser() {
    if (isOfflineMode || !auth) {
      const currentId = readStorage("tibbiya_current_user", null);
      if (!currentId) return null;
      const profile = readStorage("tibbiya_profiles", []).find((item) => item.uid === currentId) || null;
      return profile ? { id: profile.uid, uid: profile.uid, email: profile.email } : null;
    }

    return new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (user) => {
        unsub();
        resolve(user ? { id: user.uid, uid: user.uid, email: user.email } : null);
      });
    });
  },

onAuthStateChanged(callback) {
    if (isOfflineMode || !auth) {
      callback(this.getUser());
      return () => {};
    }
    return onAuthStateChanged(auth, (user) => callback(user));
  }
};

const Api = {
  async getProfile(userId) {
    const uid = normalizeUserId(userId);
    if (!uid) return null;

    if (isOfflineMode || !db) {
      const profiles = readStorage("tibbiya_profiles", []);
      const profile = profiles.find((item) => item.uid === uid || item.id === uid);
      if (profile) return { id: uid, uid, ...profile };

      const authUser = auth?.currentUser && auth.currentUser.uid === uid ? auth.currentUser : null;
      const fallback = buildDefaultProfile(uid, {
        email: authUser?.email || "",
        displayName: authUser?.displayName || "",
        photoURL: authUser?.photoURL || "",
        role: "student"
      });
      return ensureLocalProfileRecord(uid, fallback);
    }

    try {
      const snap = await getDoc(doc(db, "profiles", uid));
      if (snap.exists()) {
        return { id: uid, uid, ...snap.data() };
      }

      const authUser = auth?.currentUser && auth.currentUser.uid === uid ? auth.currentUser : null;
      return await hydrateMissingProfile(uid, {
        email: authUser?.email || "",
        full_name: authUser?.displayName || "",
        displayName: authUser?.displayName || "",
        avatar_url: authUser?.photoURL || "",
        photoURL: authUser?.photoURL || "",
        role: "student"
      });
    } catch (e) {
      const authUser = auth?.currentUser && auth.currentUser.uid === uid ? auth.currentUser : null;
      return ensureLocalProfileRecord(uid, {
        email: authUser?.email || "",
        full_name: authUser?.displayName || "",
        displayName: authUser?.displayName || "",
        avatar_url: authUser?.photoURL || "",
        photoURL: authUser?.photoURL || "",
        role: "student"
      });
    }
  },

  async getProfileOffline(userId) {
    const uid = normalizeUserId(userId);
    if (!uid) return null;

    const profiles = readStorage("tibbiya_profiles", []);
    const profile = profiles.find((item) => item.uid === uid || item.id === uid);
    if (profile) return { id: uid, uid, ...profile };

    const authUser = auth?.currentUser && auth.currentUser.uid === uid ? auth.currentUser : null;
    return ensureLocalProfileRecord(uid, {
      email: authUser?.email || "",
      full_name: authUser?.displayName || "",
      displayName: authUser?.displayName || "",
      avatar_url: authUser?.photoURL || "",
      photoURL: authUser?.photoURL || "",
      role: "student"
    });
  },

  async updateProfile(userId, fields) {
    if (isOfflineMode || !db) {
      const profiles = readStorage("tibbiya_profiles", []);
      const index = profiles.findIndex((item) => item.uid === userId || item.id === userId);
      if (index >= 0) {
        profiles[index] = { ...profiles[index], ...fields };
        writeStorage("tibbiya_profiles", profiles);
      }
      return Promise.resolve();
    }
    return await updateDoc(doc(db, "profiles", userId), fields);
  },

  async getStreak(userId) {
    if (isOfflineMode || !db) {
      const profiles = readStorage("tibbiya_profiles", []);
      const profile = profiles.find((item) => item.uid === userId || item.id === userId);
      return { current_streak: profile?.streak || 0, longest_streak: profile?.streak || 0 };
    }
    const snap = await getDoc(doc(db, "streaks", userId));
    return snap.exists() ? snap.data() : { current_streak: 0, longest_streak: 0 };
  },

  async markWelcomed(userId) {
    return await Api.updateProfile(userId, { welcomed: true });
  },

  async uploadAvatar(userId, file, onProgress) {
    if (isOfflineMode || !storage) {
      if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
        if (onProgress) onProgress(100);
        return URL.createObjectURL(file);
      }
      return "https://placehold.co/120x120/14304A/FFFFFF?text=" + encodeURIComponent("ط");
    }
    const path = `avatars/${userId}/${Date.now()}_${file.name}`;
    const url = await Api.uploadFile(path, file, onProgress);
    await updateDoc(doc(db, "profiles", userId), { avatar_url: url });
    return url;
  },

  async getStudentCount() {
    if (isOfflineMode || !db) {
      const profiles = readStorage("tibbiya_profiles", []);
      return profiles.filter((p) => OfflineAI.classifyRole(p, p.role || "student") === "student").length;
    }
    try {
      const snap = await getDoc(doc(db, "meta", "stats"));
      return snap.exists() ? (snap.data().studentCount || 0) : 0;
    } catch (e) {
      return 0;
    }
  },

  async getSubjects() {
    if (isOfflineMode || !db) {
      const subjects = readStorage("tibbiya_subjects", []);
      return [...subjects].sort((a, b) => (a.order || 99) - (b.order || 99));
    }
    const snap = await getDocs(query(collection(db, "subjects"), orderBy("order")));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async getSubjectsWithLectureCounts() {
    if (isOfflineMode || !db) {
      const subjects = await Api.getSubjects();
      const lectures = readStorage("tibbiya_lectures", []);
      const materials = readStorage("tibbiya_materials", []);
      return subjects.map((subject) => ({
        ...subject,
        lectureCount: lectures.filter((item) => item.subject_id === subject.id).length,
        materialCount: materials.filter((item) => item.subject_id === subject.id).length
      }));
    }

    const [subjSnap, lecSnap] = await Promise.all([
      getDocs(query(collection(db, "subjects"), orderBy("order"))),
      getDocs(collection(db, "lectures"))
    ]);
    const content = lecSnap.docs.map((d) => d.data());
    return subjSnap.docs.map((d) => {
      const s = { id: d.id, ...d.data() };
      s.lectureCount = content.filter((c) => c.subject_id === d.id && c.content_type !== "note").length;
      s.materialCount = content.filter((c) => c.subject_id === d.id && c.content_type === "note").length;
      return s;
    });
  },

  async addSubject(data) {
    if (isOfflineMode || !db) {
      const item = { id: randomId("subject"), ...data, created_at: new Date().toISOString() };
      const subjects = readStorage("tibbiya_subjects", []);
      subjects.push(item);
      writeStorage("tibbiya_subjects", subjects);
      return item;
    }
    return await addDoc(collection(db, "subjects"), data);
  },

  async updateSubject(id, data) {
    if (isOfflineMode || !db) {
      const subjects = readStorage("tibbiya_subjects", []);
      const index = subjects.findIndex((item) => item.id === id);
      if (index >= 0) {
        subjects[index] = { ...subjects[index], ...data };
        writeStorage("tibbiya_subjects", subjects);
      }
      return Promise.resolve();
    }
    return await updateDoc(doc(db, "subjects", id), data);
  },

  async deleteSubject(id) {
    if (isOfflineMode || !db) {
      let subjects = readStorage("tibbiya_subjects", []);
      subjects = subjects.filter((item) => item.id !== id);
      writeStorage("tibbiya_subjects", subjects);
      let lectures = readStorage("tibbiya_lectures", []);
      lectures = lectures.filter((item) => item.subject_id !== id);
      writeStorage("tibbiya_lectures", lectures);
      let materials = readStorage("tibbiya_materials", []);
      materials = materials.filter((item) => item.subject_id !== id);
      writeStorage("tibbiya_materials", materials);
      return Promise.resolve();
    }

    const lecSnap = await getDocs(query(collection(db, "lectures"), where("subject_id", "==", id)));
    const batch = writeBatch(db);
    lecSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, "subjects", id));
    await batch.commit();
  },

  async getLectures(subjectId) {
    if (isOfflineMode || !db) {
      return readStorage("tibbiya_lectures", []).filter((item) => item.subject_id === subjectId && item.content_type !== "note");
    }
    const snap = await getDocs(query(collection(db, "lectures"), where("subject_id", "==", subjectId)));
    return snap.docs.map((d) => ({ id: d.id, content_type: "video", ...d.data() })).filter((l) => (l.content_type || "video") === "video");
  },

  async getMaterials(subjectId) {
    if (isOfflineMode || !db) {
      return readStorage("tibbiya_materials", []).filter((item) => item.subject_id === subjectId && item.content_type === "note");
    }
    const snap = await getDocs(query(collection(db, "lectures"), where("subject_id", "==", subjectId)));
    return snap.docs.map((d) => ({ id: d.id, content_type: "video", ...d.data() })).filter((l) => l.content_type === "note");
  },

  async getLecturesForSubject(subjectId) { return Api.getLectures(subjectId); },
  async getMaterialsForSubject(subjectId) { return Api.getMaterials(subjectId); },

  // helper: ensure teacher is allowed to post to this subject
  async _canPostToSubject(userId, subjectId) {
    try {
      if (!userId) return false;
      if (isOfflineMode || !db) {
        const profiles = readStorage("tibbiya_profiles", []);
        const p = profiles.find((u) => u.uid === userId || u.id === userId);
        if (!p) return false;
        if (p.role === "admin") return true;
        if (p.role === "teacher") {
          const subs = p.subjects || [];
          return subs.length ? subs.includes(subjectId) : true; // if no subjects assigned, allow (admin can assign later)
        }
        return false;
      }

      const snap = await getDoc(doc(db, "profiles", userId));
      if (!snap.exists()) return false;
      const p = snap.data();
      if (p.role === "admin") return true;
      if (p.role === "teacher") {
        const subs = p.subjects || [];
        return subs.length ? subs.includes(subjectId) : true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  async addLecture(subjectId, data) {
    // check permissions first (if published_by provided)
    const publisher = data.published_by || null;
    if (publisher) {
      const ok = await Api._canPostToSubject(publisher, subjectId);
      if (!ok) return Promise.reject(new Error("ليس لديك صلاحية نشر محاضرات على هذه المادة"));
    }

    if (isOfflineMode || !db) {
      const item = {
        id: randomId("lecture"),
        subject_id: subjectId,
        title: data.title || "محاضرة",
        content_type: "video",
        youtube_url: data.youtube_url || null,
        file_url: data.file_url || null,
        published_by: data.published_by || null,
        created_at: new Date().toISOString()
      };
      const lectures = readStorage("tibbiya_lectures", []);
      lectures.push(item);
      writeStorage("tibbiya_lectures", lectures);
      return item;
    }

    return await addDoc(collection(db, "lectures"), {
      subject_id: subjectId,
      title: data.title || "بدون عنوان",
      content_type: "video",
      youtube_url: data.youtube_url || null,
      file_url: data.file_url || null,
      published_by: data.published_by || null,
      created_at: serverTimestamp()
    });
  },

  async addMaterial(subjectId, data) {
    const publisher = data.published_by || null;
    if (publisher) {
      const ok = await Api._canPostToSubject(publisher, subjectId);
      if (!ok) return Promise.reject(new Error("ليس لديك صلاحية نشر ملفات على هذه المادة"));
    }

    if (isOfflineMode || !db) {
      const item = {
        id: randomId("material"),
        subject_id: subjectId,
        title: data.title || "ملزمة",
        content_type: "note",
        file_url: data.file_url || null,
        published_by: data.published_by || null,
        created_at: new Date().toISOString()
      };
      const materials = readStorage("tibbiya_materials", []);
      materials.push(item);
      writeStorage("tibbiya_materials", materials);
      return item;
    }

    return await addDoc(collection(db, "lectures"), {
      subject_id: subjectId,
      title: data.title || "بدون عنوان",
      content_type: "note",
      file_url: data.file_url || null,
      published_by: data.published_by || null,
      created_at: serverTimestamp()
    });
  },


  async deleteLecture(subjectId, id) {
    if (isOfflineMode || !db) {
      const lectures = readStorage("tibbiya_lectures", []).filter((item) => item.id !== id);
      writeStorage("tibbiya_lectures", lectures);
      return Promise.resolve();
    }
    return await deleteDoc(doc(db, "lectures", id));
  },

  async deleteMaterial(subjectId, id) {
    if (isOfflineMode || !db) {
      const materials = readStorage("tibbiya_materials", []).filter((item) => item.id !== id);
      writeStorage("tibbiya_materials", materials);
      return Promise.resolve();
    }
    return await deleteDoc(doc(db, "lectures", id));
  },

  uploadFile(path, file, onProgress) {
    if (isOfflineMode || !storage) {
      return new Promise((resolve) => {
        if (onProgress) onProgress(100);
        if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
          resolve(URL.createObjectURL(file));
          return;
        }
        resolve("https://example.com/" + encodeURIComponent(path));
      });
    }

    return new Promise((resolve, reject) => {
      const ref = storageRef(storage, path);
      const task = uploadBytesResumable(ref, file);
      task.on("state_changed",
        (snap) => {
          if (onProgress) onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        },
        (error) => reject(error),
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        }
      );
    });
  },

  async submitTeacherRequest(uid, data) {
    if (isOfflineMode || !db) {
      const requests = readStorage("tibbiya_teacher_requests", []);
      const item = { id: uid, uid, full_name: data.full_name || "", email: data.email || "", specialty: data.specialty || "", bio: data.bio || "", status: "pending", created_at: new Date().toISOString() };
      const index = requests.findIndex((request) => request.uid === uid);
      if (index >= 0) requests[index] = item; else requests.push(item);
      writeStorage("tibbiya_teacher_requests", requests);
      return item;
    }
    return await setDoc(doc(db, "teacherRequests", uid), {
      full_name: data.full_name || "",
      email: data.email || "",
      specialty: data.specialty || "",
      bio: data.bio || "",
      status: "pending",
      created_at: serverTimestamp()
    });
  },

  async getTeacherRequests() {
    if (isOfflineMode || !db) {
      const requests = readStorage("tibbiya_teacher_requests", []);
      return requests.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }
    const snap = await getDocs(collection(db, "teacherRequests"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
  },

  async approveTeacherRequest(uid) {
    if (isOfflineMode || !db) {
      const requests = readStorage("tibbiya_teacher_requests", []);
      const profiles = readStorage("tibbiya_profiles", []);
      const indexReq = requests.findIndex((r) => r.uid === uid || r.id === uid);
      if (indexReq >= 0) requests[indexReq].status = "approved";
      const indexUser = profiles.findIndex((u) => u.uid === uid || u.id === uid);
      if (indexUser >= 0) profiles[indexUser].role = "teacher";
      writeStorage("tibbiya_teacher_requests", requests);
      writeStorage("tibbiya_profiles", profiles);
      return Promise.resolve();
    }
    await updateDoc(doc(db, "teacherRequests", uid), { status: "approved" });
    return await updateDoc(doc(db, "profiles", uid), { role: "teacher" });
  },

  async rejectTeacherRequest(uid) {
    if (isOfflineMode || !db) {
      const requests = readStorage("tibbiya_teacher_requests", []);
      const index = requests.findIndex((r) => r.uid === uid || r.id === uid);
      if (index >= 0) requests[index].status = "rejected";
      writeStorage("tibbiya_teacher_requests", requests);
      return Promise.resolve();
    }
    return await updateDoc(doc(db, "teacherRequests", uid), { status: "rejected" });
  },

  async getAllUsers() {
    if (isOfflineMode || !db) {
      return readStorage("tibbiya_profiles", []); 
    }
    const snap = await getDocs(collection(db, "profiles"));
    return snap.docs.map((d) => ({ id: d.id, uid: d.id, ...d.data() }));
  },

  async setUserRole(uid, role) {
    if (isOfflineMode || !db) {
      const profiles = readStorage("tibbiya_profiles", []);
      const index = profiles.findIndex((item) => item.uid === uid || item.id === uid);
      if (index >= 0) profiles[index].role = role;
      writeStorage("tibbiya_profiles", profiles);
      return Promise.resolve();
    }
    return await updateDoc(doc(db, "profiles", uid), { role });
  },

  async logActivity(userId, activity_type, ref_id = null) {
    if (isOfflineMode || !db) {
      const logs = readStorage("tibbiya_activity_log", []);
      logs.push({ user_id: userId, activity_type, ref_id, created_at: new Date().toISOString() });
      writeStorage("tibbiya_activity_log", logs);
      return Promise.resolve();
    }
    await addDoc(collection(db, "activity_log"), {
      user_id: userId,
      activity_type,
      ref_id,
      created_at: serverTimestamp()
    });
    const streakRef = doc(db, "streaks", userId);
    const today = new Date().toISOString().slice(0, 10);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(streakRef);
      const s = snap.exists() ? snap.data() : { current_streak: 0, longest_streak: 0, last_active_date: null };
      if (s.last_active_date === today) return;
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const current = s.last_active_date === yesterday ? (s.current_streak || 0) + 1 : 1;
      tx.set(streakRef, { current_streak: current, longest_streak: Math.max(s.longest_streak || 0, current), last_active_date: today }, { merge: true });
    });
  },

  async getSavedItems(userId) {
    return [];
  },

  async saveItem(userId, item_type, ref_id, title) {
    return Promise.resolve({ id: randomId("saved") });
  },

  async removeSavedItem(id) {
    return Promise.resolve();
  },

  async recordAttendance(sessionId, userId) {
    return Promise.resolve();
  }
};

window.Auth = Auth;
window.Api = Api;
window.OfflineAI = OfflineAI;
window.dispatchEvent(new Event("firebase-ready"));