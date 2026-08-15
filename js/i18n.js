// Simple client-side i18n module
const I18N_KEY = 'tibbiya_lang';
const i18n = (function(){
  const DEFAULT = 'ar';
  const dict = {
    ar: {
      site_title: 'طبيّة',
      settings_title: 'الإعدادات',
      signature_heading: 'توقيع الحساب',
      signature_sub: 'حمل توقيعك ليظهر أسفل المحاضرات والمواد',
      upload_sig: 'رفع توقيع جديد',
      app_hero_title: 'طبيّة — منصة تعليمية تفاعلية لطلاب طب الأسنان',
      app_hero_desc: 'تطبيق تعليمي من إعداد: {author} — مخصص لطلاب {university}، يجمع المواد، المحاضرات، والمراجع بطريقة مرتبة وعصرية.',
      subjects_head: 'مواد طب الأسنان',
      subjects_sub: 'اختر المواد التي تريد التفاعل معها (سيتم حفظ اختياراتك محلياً)',
      added_subject: 'تمت إضافة المادة إلى اختياراتك',
      removed_subject: 'تمت إزالة المادة من اختياراتك',
      saved_sig: 'تم حفظ التوقيع محلياً',
      contact_us: 'تواصل معنا',
      telegram_channel: 'قناة التليجرام الرسمية',
      footer_copy: '© {year} طبيّة — جميع الحقوق محفوظة',
      lang_label: 'English',
      auth_title: 'منصة طبيّة 🩺',
      auth_sub: 'بوابتك للتعلم الطبي الشامل والمتكامل',
      login_tab: 'دخول',
      student_tab: 'حساب طالب',
      teacher_tab: 'انضم كأستاذ',
      email_label: 'البريد الإلكتروني',
      password_label: 'كلمة المرور',
      full_name_label: 'الاسم الكامل',
      specialty_label: 'التخصص',
      terms_accept: 'أوافق على',
      terms_link: 'شروط الاستخدام',
      login_button: 'دخول',
      student_register_button: 'إنشاء حساب طالب',
      teacher_register_button: 'إرسال طلب الانضمام',
      join_teacher_success: '✅ تم الإرسال! سيتم إشعار الإدارة بطلبك وسنقوم بتفعيل حسابك قريباً.',
      live_students: '{count} طالب مسجّل بالمنصة',
      // additional keys
      loading: 'جاري التحميل...',
      no_subjects: 'لا توجد مواد بعد',
      no_lectures: 'لا توجد محاضرات بعد',
      no_materials: 'لا توجد ملازم بعد',
      welcome: 'مرحباً بك!',
      start_learning: 'ابدأ رحلة التعلم الطبي وتصفح المواد الدراسية.',
      lectures_label: 'محاضرات',
      materials_label: 'ملازم',
      video_label: 'فيديو',
      pdf_label: 'PDF',
      confirm_accept_teacher: 'هل تريد قبول طلب الانضمام كأستاذ؟',
      confirm_reject_teacher: 'هل تريد رفض هذا الطلب؟',
      accepted_request_msg: '✅ تم قبول الطلب وترقية الحساب كأستاذ',
      rejected_request_msg: 'تم رفض الطلب',
      delete_subject_confirm: 'هل تريد حذف مادة "{title}"؟ سيتم حذف كل محاضراتها وملازمها أيضاً.',
      delete_lecture_confirm: 'هل تريد حذف هذه المحاضرة؟',
      delete_material_confirm: 'هل تريد حذف هذا الملف؟',
      add_subject_button: 'أضف للمواد',
      selected_label: 'مشترك',
      logout_title: 'تسجيل الخروج',
      no_my_lectures: 'لم تنشر محاضرات في هذه المادة بعد',
      no_my_materials: 'لم تنشر ملازم في هذه المادة بعد',
      lecture_published: '✅ تم نشر المحاضرة بنجاح',
      file_published: '✅ تم نشر الملف بنجاح'
    },
    en: {
      site_title: 'Tibbiya',
      settings_title: 'Settings',
      signature_heading: 'Account signature',
      signature_sub: 'Upload your signature to appear under lectures and materials',
      upload_sig: 'Upload new signature',
      app_hero_title: 'Tibbiya — Interactive learning platform for dental students',
      app_hero_desc: 'Educational app by {author} — for {university} students, gathering materials, lectures and resources in a modern organized way.',
      subjects_head: 'Dental Subjects',
      subjects_sub: 'Select the subjects you want to engage with (choices are saved locally)',
      added_subject: 'Subject added to your selections',
      removed_subject: 'Subject removed from your selections',
      saved_sig: 'Signature saved locally',
      contact_us: 'Contact us',
      telegram_channel: 'Official Telegram channel',
      footer_copy: '© {year} Tibbiya — All rights reserved',
      lang_label: 'العربية',
      auth_title: 'Tibbiya Platform 🩺',
      auth_sub: 'Your gateway to comprehensive medical learning',
      login_tab: 'Login',
      student_tab: 'Student account',
      teacher_tab: 'Join as teacher',
      email_label: 'Email',
      password_label: 'Password',
      full_name_label: 'Full name',
      specialty_label: 'Specialty',
      terms_accept: 'I agree to the',
      terms_link: 'terms of use',
      login_button: 'Login',
      student_register_button: 'Create student account',
      teacher_register_button: 'Send join request',
      join_teacher_success: '✅ Sent successfully! The admin will review your request and activate your account soon.',
      live_students: '{count} registered students',
      loading: 'Loading...',
      no_subjects: 'No subjects yet',
      no_lectures: 'No lectures yet',
      no_materials: 'No materials yet',
      welcome: 'Welcome!',
      start_learning: 'Start your medical learning journey and browse study subjects.',
      lectures_label: 'Lectures',
      materials_label: 'Materials',
      video_label: 'Video',
      pdf_label: 'PDF',
      confirm_accept_teacher: 'Do you want to accept this teacher request?',
      confirm_reject_teacher: 'Do you want to reject this request?',
      accepted_request_msg: '✅ Request accepted and upgraded to teacher',
      rejected_request_msg: 'Request rejected',
      delete_subject_confirm: 'Delete subject "{title}"? All lectures and materials will be removed.',
      delete_lecture_confirm: 'Delete this lecture?',
      delete_material_confirm: 'Delete this material?',
      add_subject_button: 'Add subject',
      selected_label: 'Selected',
      logout_title: 'Logout',
      no_my_lectures: 'No lectures published for this subject yet',
      no_my_materials: 'No materials published for this subject yet',
      lecture_published: '✅ Lecture published successfully',
      file_published: '✅ File published successfully'
    }
  };

  function get(){
    const l = localStorage.getItem(I18N_KEY) || DEFAULT;
    return dict[l] ? l : DEFAULT;
  }
  function set(lang){
    if(dict[lang]){
      localStorage.setItem(I18N_KEY, lang);
      translatePage();
    }
  }
  function t(key, vars){
    const lang = get();
    let s = (dict[lang] && dict[lang][key]) || '';
    if(vars){
      for(const k in vars) s = s.replace('{'+k+'}', vars[k]);
    }
    return s;
  }

  function translatePage(){
    const lang = get();
    document.documentElement.setAttribute('lang', lang === 'ar' ? 'ar' : 'en');
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    // translate elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const attr = el.getAttribute('data-i18n-attr');
      const text = t(key, {author: 'عبدالله فاضل', university: 'جامعة أهل البيت', year: new Date().getFullYear()});
      if(attr) el.setAttribute(attr, text);
      else el.innerHTML = text;
    });
    // translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', t(key));
    });
    // update language toggle labels
    document.querySelectorAll('[data-i18n-lang-label]').forEach(el => {
      el.textContent = t('lang_label');
    });
  }

  // auto-translate on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', translatePage);

  return { get, set, t, translatePage };
})();

window.I18N = i18n;