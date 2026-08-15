// Settings page behavior: upload signature and store in localStorage
const SIG_KEY = 'tibbiya_signature_dataurl';
const PROFILE_KEY = 'tibbiya_current_profile';

const SUBJECTS = [
  { id: 'anat', title: { ar: 'تشريح الفم', en: 'Oral Anatomy' }, img: 'assets/subj_anat.jpg' },
  { id: 'materials', title: { ar: 'مواد طب الأسنان', en: 'Dental Materials' }, img: 'assets/subj_materials.jpg' },
  { id: 'ortho', title: { ar: 'تقويم الأسنان', en: 'Orthodontics' }, img: 'assets/subj_ortho.jpg' },
  { id: 'pedo', title: { ar: 'طب أسنان الأطفال', en: 'Pediatric Dentistry' }, img: 'assets/subj_pedo.jpg' },
  { id: 'surgery', title: { ar: 'جراحة الفم والفكين', en: 'Oral & Maxillofacial Surgery' }, img: 'assets/subj_surgery.jpg' },
  { id: 'path', title: { ar: 'أمراض الفم والأنسجة', en: 'Oral Pathology' }, img: 'assets/subj_path.jpg' }
];

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
  // signature-meta elements
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

  // attach handlers
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
  // re-render
  renderSubjects();
  const msg = (window.I18N && I18N.t(msgKey)) || (msgKey === 'added_subject' ? 'تمت إضافة المادة إلى اختياراتك' : 'تمت إزالة المادة من اختياراتك');
  if(window.showToast) showToast(msg);
  else alert(msg);
}

function initSettings(){
  loadSignature();
  renderAppInfo();
  renderSubjects();

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