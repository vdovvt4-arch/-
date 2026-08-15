<#
PowerShell helper: initialize git, commit changes, push to remote, and optionally deploy to Firebase.
Run this from the project root in PowerShell (not as admin):
  cd "C:\Users\Forde_RETER\OneDrive\Desktop\tibbiya_v3\tibbiya final"
  .\deploy_and_push.ps1

Prerequisites (must be installed on your machine):
- Git (https://git-scm.com/downloads)
- Firebase CLI (npm i -g firebase-tools) and you must run `firebase login` before deploying
#>

function ExitWith($msg){ Write-Host $msg -ForegroundColor Yellow; exit 1 }

# check availability
$git = Get-Command git -ErrorAction SilentlyContinue
$firebase = Get-Command firebase -ErrorAction SilentlyContinue
if(-not $git){ ExitWith "Git غير مثبت أو ليس في PATH. ثبت Git ثم أعد المحاولة: https://git-scm.com/downloads" }

Write-Host "Git موجود: $($git.Path)" -ForegroundColor Green

# ask for repo URL
$repoUrl = Read-Host 'أدخل رابط مستودع GitHub (مثال: https://github.com/username/repo.git) أو اتركه فارغاً لتخطي إضافة remote'
$branch = Read-Host 'اسم الفرع الذي تريد الدفع إليه (الافتراضي: main)'
if([string]::IsNullOrWhiteSpace($branch)){ $branch = 'main' }

# init git if needed
if(-not (Test-Path ".git")){
  git init
  Write-Host "تم تهيئة مستودع Git محلي." -ForegroundColor Green
} else { Write-Host ".git موجود؛ سيتم استخدام المستودع الحالي." -ForegroundColor Cyan }

# stage changes
git add -A

# commit using COMMIT_MESSAGE.txt if exists
if(Test-Path "COMMIT_MESSAGE.txt"){
  git commit -F COMMIT_MESSAGE.txt
  if($LASTEXITCODE -ne 0){ Write-Host "خطأ أثناء تنفيذ git commit. تأكد من إعداد اسم المستخدم والبريد: git config --global user.name 'You' && git config --global user.email 'you@example.com'" -ForegroundColor Red; exit 1 }
} else {
  $msg = Read-Host 'أدخل رسالة الـ commit قصيرة (بالعربي مقترحة: تحسين صفحة الإعدادات والمواد)'
  if([string]::IsNullOrWhiteSpace($msg)){ $msg = 'تحسين صفحة الإعدادات والمواد' }
  git commit -m $msg
}

if($repoUrl -and -not [string]::IsNullOrWhiteSpace($repoUrl)){
  # add remote if not present
  $remotes = git remote
  if(-not ($remotes -match 'origin')){ git remote add origin $repoUrl }
  git branch -M $branch
  Write-Host "سيتم الدفع إلى origin/$branch" -ForegroundColor Cyan
  $confirm = Read-Host 'تأكيد: هل تريد الدفع الآن إلى GitHub؟ (y/N)'
  if($confirm -match '^[yY]'){
    git push -u origin $branch
    if($LASTEXITCODE -ne 0){ Write-Host "فشل git push — تحقق من بيانات الاعتماد ووجود الفرع البعيد" -ForegroundColor Red; exit 1 }
    Write-Host "تم الدفع إلى GitHub بنجاح." -ForegroundColor Green
  } else { Write-Host "تخطيت خطوة الدفع." -ForegroundColor Yellow }
} else { Write-Host "تخطيت إضافة remote والدفع إلى GitHub." -ForegroundColor Yellow }

# Firebase deploy (optional)
if($firebase){
  Write-Host "Firebase CLI موجود: $($firebase.Path)" -ForegroundColor Green
  $hasFirebaseRc = Test-Path ".firebaserc"
  if($hasFirebaseRc){
    Write-Host ".firebaserc موجود. محتواه:" -ForegroundColor Cyan
    Get-Content .firebaserc | Write-Host
  } else { Write-Host ".firebaserc غير موجود. تأكد من firebase init قبل النشر." -ForegroundColor Yellow }

  $confirmDeploy = Read-Host 'هل تريد نشر الملفات (Firestore rules + Hosting) الآن عبر firebase deploy؟ (y/N)'
  if($confirmDeploy -match '^[yY]'){
    # recommend login
    Write-Host "تأكد أنك مسجل دخول في Firebase CLI (firebase login)" -ForegroundColor Cyan
    $proc = Start-Process -FilePath firebase -ArgumentList 'deploy','--only','hosting,firestore:rules' -NoNewWindow -Wait -PassThru
    if($proc.ExitCode -ne 0){ Write-Host "فشل النشر عبر Firebase CLI. راجع الرسائل أعلاه." -ForegroundColor Red; exit 1 }
    Write-Host "تم نشر الملفات على Firebase (hosting + firestore rules)" -ForegroundColor Green
  } else { Write-Host "تخطيت خطوة نشر Firebase." -ForegroundColor Yellow }
} else {
  Write-Host "Firebase CLI غير مثبت أو ليس في PATH. لتثبيته: npm i -g firebase-tools" -ForegroundColor Yellow
}

Write-Host "الخطوات اكتملت محلياً. راجع GitHub وFirebase console للتحقق." -ForegroundColor Green
