// ============================================================
// طبيّة — auth-page.js
// Powers index.html: tab switching (دخول / حساب طالب / انضم كأستاذ),
// email+password sign-in / sign-up, teacher-request submission,
// role-based redirect, and the live "registered students" counter.
// ============================================================

function showToast(msg, type = "info") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = "toast show " + type;
  setTimeout(() => t.classList.remove("show"), 3000);
}

const ERROR_MESSAGES = {
  "auth/email-already-in-use": "البريد الإلكتروني مستخدم بالفعل",
  "auth/invalid-email": "البريد الإلكتروني غير صحيح",
  "auth/weak-password": "كلمة المرور ضعيفة جداً",
  "auth/user-not-found": "لا يوجد حساب بهذا البريد الإلكتروني",
  "auth/wrong-password": "كلمة المرور غير صحيحة",
  "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  "auth/too-many-requests": "محاولات كثيرة جداً — حاول لاحقاً"
};
function friendlyError(err) {
  if (!err) return "حدث خطأ غير متوقع";
  return ERROR_MESSAGES[err.code] || err.message || "حدث خطأ غير متوقع";
}

// ---------- tab switching ----------
const tabs = document.querySelectorAll(".auth-tab");
const forms = {
  login: document.getElementById("form-login"),
  student: document.getElementById("form-student"),
  teacher: document.getElementById("form-teacher")
};
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    Object.entries(forms).forEach(([key, form]) => {
      form.style.display = key === tab.dataset.tab ? "block" : "none";
    });
    hideAuthNotices();
  });
});

// ---------- redirect helper: send a signed-in user to the right home ----------
async function routeUser(uid) {
  const profile = await window.Api.getProfile(uid);
  if (profile?.role === "admin") return (window.location.href = "admin.html");
  if (profile?.role === "teacher") return (window.location.href = "teacher.html");
  return (window.location.href = "app.html");
}

// ---------- login ----------
document.getElementById("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("lEmail").value.trim();
  const password = document.getElementById("lPass").value;
  const btn = document.getElementById("btnLogin");

  if (!email || !password) return showToast("يرجى ملء جميع الحقول", "error");

  btn.disabled = true; btn.textContent = "جاري الدخول...";
  const { data, error } = await window.Auth.signInWithEmail(email, password);
  if (error) {
    showToast(friendlyError(error), "error");
    if (error.code === "app/email-not-verified") showResendVerification(email, password);
    btn.disabled = false; btn.textContent = "دخول";
    return;
  }
  hideAuthNotices();
  await routeUser(data.user.uid);
});

// ---------- helper notices (built with JS so no HTML edits are needed) ----------
function hideAuthNotices() {
  const r = document.getElementById("resendVerifyBox");
  if (r) r.style.display = "none";
  const s = document.getElementById("studentVerifyNotice");
  if (s) s.style.display = "none";
}

function showResendVerification(email, password) {
  let box = document.getElementById("resendVerifyBox");
  if (!box) {
    box = document.createElement("div");
    box.id = "resendVerifyBox";
    box.className = "notice-box";
    box.style.marginTop = "16px";
    document.getElementById("form-login").appendChild(box);
  }
  box.style.display = "block";
  box.innerHTML = 'لم يصلك البريد؟ <button type="button" id="resendBtn" class="btn-primary" style="margin-top:8px;">إعادة إرسال رابط التفعيل</button>';
  document.getElementById("resendBtn").addEventListener("click", async () => {
    const rb = document.getElementById("resendBtn");
    rb.disabled = true; rb.textContent = "جاري الإرسال...";
    const { error } = await window.Auth.resendVerification(email, password);
    if (error) {
      showToast(friendlyError(error), "error");
      rb.disabled = false; rb.textContent = "إعادة إرسال رابط التفعيل";
    } else {
      showToast("✅ تم إرسال رابط التفعيل من جديد", "success");
      box.style.display = "none";
    }
  });
}

function showStudentVerifyNotice(email) {
  let box = document.getElementById("studentVerifyNotice");
  if (!box) {
    box = document.createElement("div");
    box.id = "studentVerifyNotice";
    box.className = "notice-box";
    box.style.marginTop = "16px";
    document.getElementById("form-student").appendChild(box);
  }
  box.style.display = "block";
  box.innerHTML = `✅ تم إنشاء حسابك! أرسلنا رابط تفعيل إلى <b>${email}</b>. افتح بريدك (وتحقق من الرسائل غير المرغوب فيها) وفعّل الحساب، وبعدها سجّل الدخول من تبويب "دخول".`;
}

// ---------- student sign-up ----------
document.getElementById("form-student").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fullName = document.getElementById("sName").value.trim();
  const email = document.getElementById("sEmail").value.trim();
  const password = document.getElementById("sPass").value;
  const terms = document.getElementById("sTerms").checked;
  const btn = document.getElementById("btnStudent");

  if (!fullName || !email || !password) return showToast("يرجى ملء جميع الحقول", "error");
  if (password.length < 6) return showToast("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error");
  if (!terms) return showToast("يجب الموافقة على شروط الاستخدام", "error");

  btn.disabled = true; btn.textContent = "جاري إنشاء الحساب...";
  const username = "user_" + Math.random().toString(36).slice(2, 8);
  const { data, error } = await window.Auth.signUpWithEmail(email, password, fullName, username);
  if (error) {
    showToast(friendlyError(error), "error");
    btn.disabled = false; btn.textContent = "إنشاء حساب طالب";
    return;
  }
  void data;
  // Don't let the student into the app yet — send them back to the login
  // tab once they've clicked the verification link in their inbox.
  await window.Auth.signOut();
  document.getElementById("form-student").querySelectorAll("input, .checkbox-wrap, button[type=submit]")
    .forEach((el) => (el.style.display = "none"));
  showStudentVerifyNotice(email);
  showToast("✅ تحقق من بريدك لتفعيل الحساب", "success");
});

// ---------- teacher join request ----------
document.getElementById("form-teacher").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fullName = document.getElementById("tName").value.trim();
  const email = document.getElementById("tEmail").value.trim();
  const password = document.getElementById("tPass").value;
  const specialty = document.getElementById("tSpecialty").value.trim();
  const terms = document.getElementById("tTerms").checked;
  const btn = document.getElementById("btnTeacher");

  if (!fullName || !email || !password || !specialty) return showToast("يرجى ملء جميع الحقول", "error");
  if (password.length < 6) return showToast("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error");
  if (!terms) return showToast("يجب الموافقة على شروط الاستخدام", "error");

  btn.disabled = true; btn.textContent = "جاري الإرسال...";
  try {
    const { data, error } = await window.Auth.signUpWithEmail(email, password, fullName, "");
    if (error) throw error;

    await window.Api.submitTeacherRequest(data.user.uid, { full_name: fullName, email, specialty, bio: "" });
    await window.Auth.signOut();

    document.getElementById("form-teacher").querySelectorAll("input, button[type=submit]").forEach((el) => (el.style.display = "none"));
    document.getElementById("teacherSuccess").style.display = "block";
    showToast("✅ تم إرسال طلبك بنجاح", "success");
  } catch (error) {
    showToast(friendlyError(error), "error");
    btn.disabled = false; btn.textContent = "إرسال طلب الانضمام";
  }
});

// ---------- if already signed in, skip straight to the right home ----------
function bootstrapAuthCheck() {
  window.Auth.getUser().then((user) => {
    if (user) routeUser(user.id);
  });
}
if (window.Api && window.Auth) {
  bootstrapAuthCheck();
} else {
  window.addEventListener("firebase-ready", bootstrapAuthCheck, { once: true });
}

// ---------- live "registered students" counter ----------
function animateCount(el, target) {
  const duration = 900;
  const startTime = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - startTime) / duration);
    const val = Math.round(target * p);
    el.textContent = `${val.toLocaleString("ar")} طالب مسجّل بالمنصة`;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

async function loadStudentCounter() {
  const el = document.getElementById("liveCounterText");
  if (!el || !window.Api) return;
  const count = await window.Api.getStudentCount();
  animateCount(el, count);
}

if (window.Api) {
  loadStudentCounter();
} else {
  window.addEventListener("firebase-ready", loadStudentCounter, { once: true });
}
