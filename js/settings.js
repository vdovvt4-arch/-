// Settings page behavior: upload signature and store in localStorage
const SIG_KEY = 'tibbiya_signature_dataurl';
const PROFILE_KEY = 'tibbiya_current_profile';
const SITE_SETTINGS_KEY = 'tibbiya_site_settings';
const PASSWORD_KEY = 'tibbiya_user_password';

const SUBJECTS = [
  { id: 'anat', title: { ar: 'تشريح الفم', en: 'Oral Anatomy' }, img: 'assets/subj_anat.jpg' },
  { id: 'materials', title: { ar: 'مواد طب الأسنان', en: 'Dental Materials' }, img: 'assets/subj_materials.jpg' },
  { id: 'ortho', title: { ar: 'تقويم الأسنان', en: 'Orthodontics' }, img: 'assets/subj_ortho.jpg' },
  { id: 'pedo', title: { ar: 'طب أسنان الأطفال', en: 'Pediatric Dentistry' }, img: 'assets/subj_pedo.jpg' },
  { id: 'surgery', title: { ar: 'جراحة الفم والفكين', en: 'Oral & Maxillofacial Surgery' }, img: 'assets/subj_surgery.jpg' },
  { id: 'path', title: { ar: 'أمراض الفم والأنسجة', en: 'Oral Pathology' }, img: 'assets/subj_path.jpg' }
];

function readSiteSettings() {
  try {
    const raw = localStorage.getItem(SITE_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {
      siteTitle: 'طبيّة',
      primaryColor: '#14304A',
      footerText: '© 2026 طبيّة — جميع الحقوق محفوظة',
      telegramLink: 'https://t.me/FordeReter',
      whatsappLink: 'https://wa.me/201069821311',
      logoUrl: '',
      themeMode: 'light'
    };
  } catch (e) {
    return { siteTitle: 'طبيّة', primaryColor: '#14304A', footerText: '© 2026 طبيّة — جميع الحقوق محفوظة', telegramLink: 'https://t.me/FordeReter', whatsappLink: 'https://wa.me/201069821311', logoUrl: '', themeMode: 'light' };
  }
}

function writeSiteSettings(settings) {
  const safe = { ...readSiteSettings(), ...settings };
  localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(safe));
  if (window.Api && typeof window.Api.saveSiteSettings === 'function') {
    window.Api.saveSiteSettings(safe).catch(() => {});
  }
  return safe;
}

function loadSignature(){
  const data = localStorage.getItem(SIG_KEY);
  const img = document.getElementById('signatureImg');
  if(data && img){ img.src = data; }
}

function readProfile(){
  try{
    const raw = localStorage.getItem(PROFILE_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch(e){ return null; }
}

function writeProfile(profile){
  try{ localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }
  catch(e){ console.error('Cannot save profile', e); }
}

function ensureProfile(){
  let p = readProfile();
  if(!p){
    p = { id: 'local_user', name: 'عبدالله فاضل', subjects: [] };
    writeProfile(p);
  }
  return p;
}

function renderAppInfo(){
  const nameEl = document.querySelector('.sig-name');
  const roleEl = document.querySelector('.sig-role');
  if(nameEl) nameEl.textContent = 'عبدالله فاضل';
  if(roleEl) roleEl.textContent = 'خاص بطلاب جامعة أهل البيت';
}

function renderSubjects(){
  const grid = document.getElementById('subjectsGrid');
  if(!grid) return;
  const profile = ensureProfile();
  grid.innerHTML = '';
  SUBJECTS.forEach(s => {
    const inProfile = Array.isArray(profile.subjects) && profile.subjects.includes(s.id);
    const card = document.createElement('div');
    card.className = 'subject-card';
    const lang = (window.I18N && I18N.get()) || 'ar';
    const title = (s.title && (s.title[lang] || s.title['ar'])) || '';
    card.innerHTML = `
      <img src="${s.img}" alt="${title}" loading="lazy">
      <div class="subject-title">${title}</div>
      <div class="subject-actions">
        <button class="btn-subject ${inProfile ? 'secondary' : ''}" data-id="${s.id}">${inProfile ? (lang==='ar'?'مشترك':'Selected') : (lang==='ar'?'أضف للمواد':'Add')}</button>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll('.btn-subject').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      toggleSubject(id);
    });
  });
}

function toggleSubject(id){
  const profile = ensureProfile();
  profile.subjects = profile.subjects || [];
  const idx = profile.subjects.indexOf(id);
  let msgKey = '';
  if(idx === -1){
    profile.subjects.push(id);
    msgKey = 'added_subject';
  } else {
    profile.subjects.splice(idx,1);
    msgKey = 'removed_subject';
  }
  writeProfile(profile);
  renderSubjects();
  const msg = (window.I18N && I18N.t(msgKey)) || (msgKey === 'added_subject' ? 'تمت إضافة المادة إلى اختياراتك' : 'تمت إزالة المادة من اختياراتك');
  if(window.showToast) showToast(msg);
  else alert(msg);
}

function updateSiteSettingsForm() {
  const settings = readSiteSettings();
  const title = document.getElementById('siteTitleInput');
  const color = document.getElementById('sitePrimaryColor');
  const footer = document.getElementById('siteFooterText');
  const telegram = document.getElementById('siteTelegramLink');
  const whatsapp = document.getElementById('siteWhatsappLink');
  const logo = document.getElementById('siteLogoUrl');
  const theme = document.getElementById('siteThemeMode');

  if (title) title.value = settings.siteTitle || 'طبيّة';
  if (color) color.value = settings.primaryColor || '#14304A';
  if (footer) footer.value = settings.footerText || '© 2026 طبيّة — جميع الحقوق محفوظة';
  if (telegram) telegram.value = settings.telegramLink || 'https://t.me/FordeReter';
  if (whatsapp) whatsapp.value = settings.whatsappLink || 'https://wa.me/201069821311';
  if (logo) logo.value = settings.logoUrl || '';
  if (theme) theme.value = settings.themeMode || 'light';
}

function applySiteSettingsToDOM() {
  const settings = readSiteSettings();
  const root = document.documentElement;
  root.style.setProperty('--primary', settings.primaryColor || '#14304A');
  root.style.setProperty('--accent', settings.primaryColor || '#14304A');

  const brandNameEls = document.querySelectorAll('[data-site-title]');
  brandNameEls.forEach((el) => { el.textContent = settings.siteTitle || 'طبيّة'; });

  const footerEls = document.querySelectorAll('[data-site-footer]');
  footerEls.forEach((el) => { el.textContent = settings.footerText || '© 2026 طبيّة — جميع الحقوق محفوظة'; });

  const telegramEls = document.querySelectorAll('[data-site-telegram]');
  telegramEls.forEach((el) => { el.href = settings.telegramLink || 'https://t.me/FordeReter'; });

  const whatsappEls = document.querySelectorAll('[data-site-whatsapp]');
  whatsappEls.forEach((el) => { el.href = settings.whatsappLink || 'https://wa.me/201069821311'; });

  const logoEls = document.querySelectorAll('[data-site-logo]');
  logoEls.forEach((el) => {
    if (settings.logoUrl) el.src = settings.logoUrl;
  });

  // Apply theme
  if (window.ThemeManager) {
    window.ThemeManager.setTheme(settings.themeMode || 'light');
  } else {
    root.setAttribute('data-theme', settings.themeMode || 'light');
  }
}

// Password management functions
function changePassword(){
  const current = document.getElementById('currentPassword')?.value || '';
  const newPass = document.getElementById('newPassword')?.value || '';
  const confirm = document.getElementById('confirmPassword')?.value || '';

  if (!current || !newPass || !confirm) {
    if(window.showToast) showToast('⚠️ يرجى ملء جميع الحقول', 'error');
    return;
  }

  if (newPass.length < 6) {
    if(window.showToast) showToast('⚠️ كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل', 'error');
    return;
  }

  if (newPass !== confirm) {
    if(window.showToast) showToast('⚠️ كلمة المرور الجديدة غير متطابقة', 'error');
    return;
  }

  const storedPassword = localStorage.getItem(PASSWORD_KEY) || 'password123';
  if (current !== storedPassword) {
    if(window.showToast) showToast('❌ كلمة المرور الحالية غير صحيحة', 'error');
    return;
  }

  localStorage.setItem(PASSWORD_KEY, newPass);
  document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  
  if(window.showToast) showToast('✅ تم تحديث كلمة المرور بنجاح');
}

window.togglePass = function(fieldId, btn) {
  const input = document.getElementById(fieldId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
};

function initSettings(){
  loadSignature();
  renderAppInfo();
  renderSubjects();
  updateSiteSettingsForm();
  applySiteSettingsToDOM();

  const saveBtn = document.getElementById('saveSiteSettingsBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const settings = {
        siteTitle: (document.getElementById('siteTitleInput')?.value || 'طبيّة').trim() || 'طبيّة',
        primaryColor: document.getElementById('sitePrimaryColor')?.value || '#14304A',
        footerText: (document.getElementById('siteFooterText')?.value || '© 2026 طبيّة — جميع الحقوق محفوظة').trim() || '© 2026 طبيّة — جميع الحقوق محفوظة',
        telegramLink: (document.getElementById('siteTelegramLink')?.value || 'https://t.me/FordeReter').trim() || 'https://t.me/FordeReter',
        whatsappLink: (document.getElementById('siteWhatsappLink')?.value || 'https://wa.me/201069821311').trim() || 'https://wa.me/201069821311',
        logoUrl: (document.getElementById('siteLogoUrl')?.value || '').trim(),
        themeMode: document.getElementById('siteThemeMode')?.value || 'light'
      };
      writeSiteSettings(settings);
      applySiteSettingsToDOM();
      if (window.showToast) showToast('✅ تم حفظ إعدادات الموقع');
    });
  }

  const changePassBtn = document.getElementById('changePasswordBtn');
  if (changePassBtn) {
    changePassBtn.addEventListener('click', changePassword);
  }

  const input = document.getElementById('signatureFile');
  if(!input) return;
  input.addEventListener('change', () => {
    const f = input.files && input.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = function(e){
      try{ localStorage.setItem(SIG_KEY, e.target.result); }
      catch(e){ console.error('Cannot store signature', e); }
      loadSignature();
      const toastMsg = (window.I18N && I18N.t('saved_sig')) || 'تم حفظ التوقيع محلياً';
      if(window.showToast) showToast(toastMsg);
    };
    reader.readAsDataURL(f);
  });
}

window.addEventListener('DOMContentLoaded', initSettings);