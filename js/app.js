// ============================================================
// طبيّة — app.js
// Powers app.html: student home (subjects grid) + the
// lectures/materials modal for a selected subject.
// ============================================================

import { showToast, escapeHtml } from './utils.js';

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

let currentUser = null;
let currentProfile = null;
let currentSubject = null;



// ---------- subjects grid ----------
const TILE_COLORS = ["#14304A", "#3FA796", "#F4A340", "#C1440E"];
function renderSubjects(subjects) {
  const grid = document.getElementById("subjectsGrid");
  grid.innerHTML = "";
  if (!subjects.length) {
    const noSubjects = (window.I18N && I18N.t('no_subjects')) || 'لا توجد مواد بعد';
    const noSubDesc = (window.I18N && I18N.t('start_learning')) || 'راح تظهر المواد الدراسية هنا أول ما تضيفها الإدارة.';
    grid.innerHTML = `<div class="empty-state">
      <div class="e-icon">📚</div>
      <p class="e-title">${noSubjects}</p>
      <p class="e-sub">${noSubDesc}</p>
    </div>`;
    return;
  }
  subjects.forEach((s, i) => {
    const card = document.createElement("button");
    card.className = "subject-card";
    card.innerHTML = `
      <div class="tile-icon" style="background:${escapeHtml(s.color || TILE_COLORS[i % 4])}22; color:${escapeHtml(s.color || TILE_COLORS[i % 4])}">
        ${escapeHtml(s.icon || "📘")}
      </div>
      <div class="tile-title">${escapeHtml(s.title)}</div>
      <div class="tile-meta">${s.lectureCount ?? 0} محاضرة · ${s.materialCount ?? 0} ملزمة</div>
    `;
    card.addEventListener("click", () => openSubjectModal(s));
    grid.appendChild(card);
  });
}

// ---------- subject modal (المحاضرات / الملازم) ----------
const subjectModal = document.getElementById("subjectModal");
const modalTitle = document.getElementById("modalTitle");

function switchModalTab(tabId) {
  document.querySelectorAll(".admin-tab[data-msubtab]").forEach((b) => b.classList.toggle("active", b.dataset.msubtab === tabId));
  document.querySelectorAll(".modal-body.admin-subtab").forEach((p) => p.classList.toggle("active", p.id === tabId));
}
document.querySelectorAll(".admin-tab[data-msubtab]").forEach((btn) => {
  btn.addEventListener("click", () => switchModalTab(btn.dataset.msubtab));
});

function contentLink(item) {
  return item.file_url || item.youtube_url || item.url || "#";
}

async function openSubjectModal(subject) {
  currentSubject = subject;
  modalTitle.textContent = subject.title;
  switchModalTab("sub-lec");
  subjectModal.style.display = "flex";

  const lecEl = document.getElementById("modalLecturesList");
  const matEl = document.getElementById("modalMaterialsList");
  const loadingText = (window.I18N && I18N.t('loading')) || 'جاري التحميل...';
  lecEl.innerHTML = `<div class="admin-loading">${loadingText}</div>`;
  matEl.innerHTML = `<div class="admin-loading">${loadingText}</div>`;

  if (currentUser) window.Api.logActivity(currentUser.id, "subject_open", subject.id);

  try {
    const [lectures, materials] = await Promise.all([
      window.Api.getLecturesForSubject(subject.id),
      window.Api.getMaterialsForSubject(subject.id)
    ]);

    const lectureLabel = (window.I18N && I18N.t('lectures_label')) || 'محاضرات';
    const materialLabel = (window.I18N && I18N.t('materials_label')) || 'ملازم';
    const videoLabel = (window.I18N && I18N.t('video_label')) || 'فيديو';
    const pdfLabel = (window.I18N && I18N.t('pdf_label')) || 'PDF';

    lecEl.innerHTML = lectures.length
      ? `<div class="lecture-list">${lectures.map((l) => `
          <a class="lecture-item" href="${escapeHtml(contentLink(l))}" target="_blank" rel="noopener">
            <div class="l-icon">🎬</div>
            <div><p class="l-title">${escapeHtml(l.title) || "محاضرة"}</p><p class="l-meta">${videoLabel}</p></div>
          </a>`).join("")}</div>`
      : `<div class="empty-state"><div class="e-icon">📘</div><p class="e-title">${(window.I18N && I18N.t('no_lectures'))||'لا توجد محاضرات بعد'}</p><p class="e-sub">${(window.I18N && I18N.t('start_learning'))||'راح تظهر هنا أول ما يرفعها الأستاذ.'}</p></div>`;

    matEl.innerHTML = materials.length
      ? `<div class="lecture-list">${materials.map((m) => `
          <a class="material-item" href="${escapeHtml(contentLink(m))}" target="_blank" rel="noopener">
            <div class="l-icon">📑</div>
            <div><p class="l-title">${escapeHtml(m.title) || "ملزمة"}</p><p class="l-meta">${pdfLabel}</p></div>
            <span class="dl-arrow">⬇</span>
          </a>`).join("")}</div>`
      : `<div class="empty-state"><div class="e-icon">📑</div><p class="e-title">${(window.I18N && I18N.t('no_materials'))||'لا توجد ملازم بعد'}</p><p class="e-sub">${(window.I18N && I18N.t('start_learning'))||'راح تظهر هنا أول ما يرفعها الأستاذ.'}</p></div>`;
  } catch (e) {
    lecEl.innerHTML = `<div class="admin-error">تعذر تحميل المحتوى</div>`;
    matEl.innerHTML = `<div class="admin-error">تعذر تحميل المحتوى</div>`;
  }
}

function closeSubjectModal() {
  subjectModal.style.display = "none";
  currentSubject = null;
}
document.getElementById("closeModal").addEventListener("click", closeSubjectModal);
subjectModal.addEventListener("click", (e) => { if (e.target === subjectModal) closeSubjectModal(); });

// ---------- header: user avatar / name / logout ----------
function paintUser(profile) {
  const nameEl = document.getElementById("userName");
  const avatarEl = document.getElementById("userAvatar");
  const welcomeEl = document.getElementById("welcomeText");
  const initial = (profile.full_name || "ط").trim().charAt(0);

  nameEl.textContent = profile.full_name || "طالب";
  welcomeEl.textContent = `مرحباً بك، ${profile.full_name || "بيك"}! 👋`;

  if (profile.avatar_url) {
    avatarEl.innerHTML = `<img src="${escapeHtml(profile.avatar_url)}" alt="">`;
  } else {
    avatarEl.textContent = initial;
  }
}

function renderSmartInsights(profile) {
  const root = document.getElementById("smartInsights");
  if (!root || !window.OfflineAI) return;

  const leaderboard = window.OfflineAI.leaderboard();
  const userRank = leaderboard.findIndex((item) => item.id === profile.id || item.uid === profile.uid || item.name === (profile.full_name || profile.email)) + 1;
  const score = window.OfflineAI.scoreProfile(profile);
  const role = window.OfflineAI.classifyRole(profile, profile.role || "student");

  root.innerHTML = `
    <div class="smart-panel">
      <div class="smart-head">
        <span>🤖 الذكاء المحلي</span>
        <strong>${role === "teacher" ? "أستاذ" : role === "admin" ? "مسؤول" : "طالب"}</strong>
      </div>
      <div class="smart-grid">
        <div><small>نقاط التفاعل</small><b>${score}</b></div>
        <div><small>المركز</small><b>#${userRank || 1}</b></div>
        <div><small>التصنيف</small><b>${role === "teacher" ? "معلم" : role === "admin" ? "إدارة" : "متعلم"}</b></div>
      </div>
    </div>
  `;
}

document.getElementById("btnLogout").addEventListener("click", async () => {
  await window.Auth.signOut();
  window.location.href = "index.html";
});

// ---------- bootstrap ----------
async function bootstrap() {
  currentUser = await window.Auth.getUser();
  if (!currentUser) {
    window.location.href = "index.html";
    return;
  }

  const profile = await window.Api.getProfile(currentUser.id);
  currentProfile = profile;
  if (!profile) {
    showToast("تعذر تحميل بيانات الحساب", "error");
    return;
  }

  // Teachers/admins landing on app.html are redirected to their own dashboards.
  if (profile.role === "admin") { window.location.href = "admin.html"; return; }
  if (profile.role === "teacher") { window.location.href = "teacher.html"; return; }

  // inform visitor-counter about current role
  try { const vc = await import('./visitor-counter.js'); vc.setVisitorRole(profile.role || 'student'); } catch(e){}

  paintUser(profile);
  renderSmartInsights(profile);
  window.Api.logActivity(currentUser.id, "login");

  document.getElementById("authGuard").style.display = "none";
  document.getElementById("appShell").style.display = "block";

  try {
    const subjects = await window.Api.getSubjectsWithLectureCounts();
    renderSubjects(subjects);
  } catch (e) {
    document.getElementById("subjectsGrid").innerHTML = `<div class="admi"n-error">تعذر تحميل المواد</div>`;
  }
}

if (window.Api && window.Auth) {
  bootstrap();
} else {
  window.addEventListener("firebase-ready", bootstrap, { once: true });
}
