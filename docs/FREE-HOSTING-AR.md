# نشر البورتفوليو مجاناً: Render + Neon

الخطة: واجهة Static Site على Render، وNestJS Web Service على Render بالخطة Free، وقاعدة PostgreSQL على Neon بالخطة Free. الداشبورد يعمل محلياً فقط. لا تحتاج شراء دومين ولا استضافة للداشبورد ولا Docker.

الواجهة تعرض نسخة منشورة من بياناتك اسمها `client/public/portfolio.json`. لذلك زيارة الصفحة الرئيسية وصفحات المشاريع والمقالات لا تنتظر استيقاظ NestJS. نموذج الرسائل يستخدم الباك إند وقد يتأخر عند أول إرسال بسبب نوم Render المجاني. رابط Gmail متاح مباشرة.

## 1. تجهيز الملفات والنسخة المنشورة

انسخ ملفات التحديث إلى مجلد مشروعك بنفس المسارات. لا تستبدل ملفات `.env` بملفات الأمثلة.

شغّل الباك إند المحلي كالمعتاد. من نافذة PowerShell ثانية في جذر المشروع:

```powershell
cd C:\Users\Dragon\Desktop\Hamid-portfolio
node scripts/export-portfolio.mjs
node scripts/export-portfolio.mjs --check
```

يُصدّر الأمر **المحتوى المنشور حالياً من قاعدة بياناتك**، وليس بيانات seed القديمة. يجب أن يكون Profile وSite settings بحالة Published. المسودات والرسائل لا تدخل ملف الموقع. فشل التصدير يترك النسخة السابقة كما هي.

تأكد أن صورك والـCV موجودة داخل `client/public`، وأن روابطها مثل `/images/hamid.jpg` أو `/cv.pdf`. ارفع ملفات الصور المحلية الجديدة مع Git. الرابط إلى `localhost` أو `127.0.0.1` لا يعمل عند الزوار. الصور الموجودة عند مزود خارجي تحتاج رابط HTTPS عاماً صالحاً. لا تحفظ ملفات على قرص Render المؤقت.

```powershell
git add .
git commit -m "Prepare free hosting and published content"
git push
```

ملف `portfolio.json` عام: راجع النصوص قبل نشرها. أبقِ المفاتيح وكلمات المرور في ملفات `.env` المتجاهلة من Git.

## 2. إنشاء قاعدة Neon ونقل بياناتك الحالية مرة واحدة

افتح https://neon.com واختر **Free**. أنشئ مشروعاً وقاعدة بيانات. بما أن PostgreSQL عندك إصدار 18، اختر PostgreSQL 18 للوجهة أيضاً. انسخ رابط **Direct connection** مع إعداد SSL كما يعطيك Neon. لا ترسل الرابط بالمحادثة.

للحفاظ على كل تعديلاتك والمسودات والرسائل، انقل قاعدة `portfolio` المحلية كاملة قبل أول تشغيل للباك إند المستضاف. أوقف تعديلات الداشبورد أثناء النقل. الأوامر التالية في **PowerShell**، وأدوات PostgreSQL مثبتة عندك أصلاً:

```powershell
pg_dump -h 127.0.0.1 -p 5432 -U postgres -d portfolio -Fc -f "$env:USERPROFILE\Desktop\portfolio-private.backup"
```

أدخل كلمة مرور PostgreSQL المحلية عند الطلب. هذا الملف خاص، يبقى خارج مجلد Git. بعدها:

```powershell
$env:NEON_DIRECT_URL = Read-Host "Paste your Neon Direct connection string"
pg_restore --no-owner --no-privileges --exit-on-error --dbname="$env:NEON_DIRECT_URL" "$env:USERPROFILE\Desktop\portfolio-private.backup"
Remove-Item Env:\NEON_DIRECT_URL
```

نفّذ الاستعادة على قاعدة Neon **فارغة** ولمرة واحدة. إذا ظهر خطأ توقف وافحصه؛ لا تعِد الاستعادة على قاعدة جزئية. لا تشغّل `db:seed` فوق بياناتك المنقولة. النسخة تشمل جدول ترحيلات Prisma أيضاً.

احتفظ بنسخة من إعداد الاتصال المحلي القديم خارج Git. ثم غيّر `DATABASE_URL` داخل `server/.env` إلى رابط Neon. هكذا الباك إند المحلي والباك إند المستضاف يستخدمان نفس البيانات، وتظهر رسائل الموقع في الداشبورد المحلي.

ولّد مفتاح إدارة جديداً للنشر:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

ضع نفس القيمة في `server/.env` و`admin/.env`، ولا تضعها في `client`. أعد تشغيل الباك إند والداشبورد بعد تعديل الإعدادات.

## 3. نشر NestJS على Render

من https://dashboard.render.com اختر **New > Web Service** واربط مستودع GitHub.

| الحقل | القيمة |
|---|---|
| Branch | main |
| Root Directory | server |
| Runtime | Node |
| Instance Type | Free |
| Build Command | `npm ci --include=dev && npm run db:generate && npm run db:migrate && npm run build` |
| Start Command | `npm run start:prod` |
| Health Check Path | `/api/health` |

Environment variables:

```dotenv
NODE_VERSION=24
NODE_ENV=production
DATABASE_URL=YOUR_NEON_DIRECT_CONNECTION_STRING
ADMIN_API_KEY=YOUR_NEW_SERVER_ONLY_KEY
CLIENT_URL=https://YOUR-FRONTEND.onrender.com
```

استبدل القيم المكتوبة بـYOUR بقيمك. `CLIENT_URL` رابط الواجهة الفعلي دون شرطة في النهاية؛ حدّثه بعد إنشاء الواجهة. لا تضع `/api` فيه. Render يحدد PORT تلقائياً.

بعد النشر افتح `https://YOUR-BACKEND.onrender.com/api/health`. احتفظ برابط الباك إند للخطوة التالية. لا يوجد seed في أمر البناء: بياناتك المنقولة تبقى كما عدّلتها.

## 4. نشر الواجهة على Render

اختر **New > Static Site** من نفس المستودع.

| الحقل | القيمة |
|---|---|
| Branch | main |
| Root Directory | اتركه فارغاً |
| Build Command | `node scripts/export-portfolio.mjs --check && npm --prefix client ci --include=dev && npm --prefix client run build` |
| Publish Directory | `client/dist` |

Environment variables:

```dotenv
VITE_CONTENT_MODE=snapshot
VITE_API_URL=https://YOUR-BACKEND.onrender.com/api
NODE_VERSION=24
```

لا تضف مفتاح الإدارة ولا رابط قاعدة البيانات إلى الواجهة.

من Redirects/Rewrites أضف:

| Source | Destination | Action |
|---|---|---|
| `/projects/*` | `/index.html` | Rewrite |
| `/articles/*` | `/index.html` | Rewrite |

حدث `CLIENT_URL` في خدمة الباك إند برابط Static Site الحقيقي واحفظه. شارك **رابط الواجهة** مع الشركات.

يوجد أيضاً `render.yaml` لتعريف الخدمتين؛ لا ينشئ قاعدة Render مدفوعة ولا يستضيف الداشبورد. يحتاج متغيرات البيئة السابقة، ويحتاج تصدير بياناتك قبل بناء الواجهة.

## 5. كيف أعدل المحتوى والصور بعد النشر؟

اترك `admin/.env` متصلاً بالباك إند المحلي:

```dotenv
PORTFOLIO_API_URL=http://127.0.0.1:3000/api
ADMIN_PORT=4310
ADMIN_API_KEY=YOUR_NEW_SERVER_ONLY_KEY
```

الباك إند المحلي يستخدم قاعدة Neon في `server/.env`، لذلك يرى نفس البيانات والرسائل التي يراها الباك إند المستضاف. تحميل الصور من الداشبورد يحفظها محلياً داخل `client/public/images/uploads`؛ تصعد مع نشر الواجهة، ولا تحتاج S3 لهذه الطريقة. ضع CV يدوياً داخل `client/public` واربطه مثل `/cv.pdf`؛ زر رفع CV البعيد يحتاج تخزين S3 منفصلاً، فاتركه بهذه الخطة.

شغّل محلياً:

```powershell
# نافذة 1، من مجلد server
npm run start:dev
```

```powershell
# نافذة 2، من مجلد admin؛ البناء أول مرة وبعد أي تعديل في كود الداشبورد
npm run build
npm start
```

افتح `http://127.0.0.1:4310`. عدّل واحفظ وانشر المحتوى المطلوب. لمعاينة الموقع مع البيانات الحية شغّل `npm run dev` من مجلد client، واترك `VITE_CONTENT_MODE=api` محلياً.

**الحفظ في الداشبورد لا يحدّث النسخة الثابتة تلقائياً.** بعد الانتهاء، من جذر المشروع:

```powershell
node scripts/export-portfolio.mjs
node scripts/export-portfolio.mjs --check
git add .
git commit -m "Update published portfolio content"
git push
```

Render يعيد بناء الواجهة من GitHub. بعد نجاح النشر تظهر التعديلات والصور الجديدة. حذف مقال أو مشروع من الداشبورد يحتاج أيضاً إعادة تصدير ونشر ليختفي من النسخة العامة. المسودات لا تُصدّر. أثناء غياب كمبيوترك يبقى الموقع والباك إند المستضاف يعملان؛ تحتاج الكمبيوتر فقط للتحرير ونشر نسخة جديدة. الرسائل الجديدة لا تحتاج إعادة نشر لتظهر في الداشبورد.

## 6. التحقق قبل مشاركة الرابط

- افتح رابط الواجهة من نافذة خاصة وعلى الموبايل، وجرّب CV والإيميل وروابط المشاريع.
- افتح رابط مشروع ومقال مباشرة ثم حدث الصفحة، للتأكد من Rewrite.
- اترك NestJS ينام أو احجب عنوان الباك إند من أدوات المتصفح: المحتوى والصور المحلية يجب أن يبقيا ظاهرين.
- جرّب إرسال رسالة وانتظر استيقاظ Render إذا لزم، ثم تأكد من وصولها إلى Messages في الداشبورد المحلي.
- API الإدارة يرفض الطلبات دون المفتاح؛ واجهة الإدارة لا تُرفع على Static Site.
- الصور الخارجية تبقى معتمدة على مزودها؛ الأفضل استخدام ملفات public للصور المهمة.

الخدمات المجانية لها حدود استخدام وليست ضمان توافر دائم. Render Free ينام بعد 15 دقيقة خمول وقد يستغرق قرابة دقيقة للاستيقاظ؛ Static Site لا يعتمد على استيقاظه لعرض المحتوى. لا نستخدم Render Free Postgres لأنه ينتهي بعد 30 يوماً. Neon Free ضمن حصصه مجاني دون بطاقة، وفق الصفحات الرسمية عند إعداد الدليل.

المراجع: https://render.com/docs/free — https://render.com/docs/static-sites — https://render.com/docs/blueprint-spec — https://neon.com/pricing — https://neon.com/docs/import/migrate-from-postgres
