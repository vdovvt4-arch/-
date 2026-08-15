خطوات النشر والرفع (للجهاز المحلي - Windows PowerShell)

المتطلبات:
- تثبيت Git: https://git-scm.com/downloads
- تثبيت Node.js و npm (لـ firebase-tools): https://nodejs.org/
- تثبيت Firebase CLI: npm install -g firebase-tools
- تسجيل الدخول إلى Firebase: firebase login

خطوات سريعة (نسخ/لصق في PowerShell من داخل مجلد المشروع):

1) تهيئة مستودع Git (إن لم يكن مُهيأً):
   cd "C:\Users\Forde_RETER\OneDrive\Desktop\tibbiya_v3\tibbiya final"
   git init
   git add -A
   git commit -F COMMIT_MESSAGE.txt

2) إضافة الريموت ودفع التغييرات:
   git remote add origin https://github.com/<username>/<repo>.git
   git branch -M main
   git push -u origin main

3) إعداد Firebase & نشر القواعد والـ Hosting:
   # تأكد أن لديك firebase.json و .firebaserc صحيحين
   firebase login
   firebase init   # اختر Firestore و Hosting إن لم تفعل ذلك من قبل
   # ضع قواعد Firestore المعدلة (firestore.rules أو firestore-teacher-subject.rules)
   firebase deploy --only hosting,firestore:rules

ملاحظات مهمة:
- ملف firestore-teacher-subject.rules في المشروع هو مقتطف يفرض أن المدرّس يمكنه إنشاء محتوى فقط للمواد المضافة إلى ملفه الشخصي. راجع أسماء مجموعات/مستندات (profiles vs users) وعدّل المسارات في القواعد إذا كانت بنية مشروعك مختلفة.
- الصور في assets/ مُدمجة كملفات SVG بسيطة (تجنب الاعتماد على الإنترنت). إذا ترغب بصور حقيقية عالية الدقة، حمّلها وضعها في assets/ ثم عدّل المسارات.
- إن واجهت خطأ عند git push، تأكد من صلاحيات الوصول (PAT أو SSH) وأن الرابط remote صحيح.

ملف سكربت جاهز: deploy_and_push.ps1
- شغّل: .\deploy_and_push.ps1
- السكربت يسألك رابط المستودع، يؤكد قبل الدفع، ويطلب تأكيدًا قبل نشر Firebase.

إذا واجهت مشاكل أثناء أي خطوة أرسِل لي رسالة الخطأ وسأساعدك بحلها.