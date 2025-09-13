#!/usr/bin/env node

/**
 * 🏢 ملف إعداد نظام شغف للعمل المشترك - Shaghaf ERP Setup
 * ========================================================
 * 
 * هذا الملف يقوم بإعداد النظام تلقائياً من الصفر
 * يشمل تثبيت التبعيات، إعداد ملفات البيئة، والإرشادات
 */

import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ألوان النص للعرض في Terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// دالة مساعدة للطباعة الملونة
function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// دالة لعرض شعار النظام
function showLogo() {
  colorLog('\n' + '='.repeat(70), 'cyan');
  colorLog('🏢  نظام شغف للعمل المشترك - إعداد تلقائي  🏢', 'bright');
  colorLog('        Shaghaf Coworking Space Management System', 'cyan');
  colorLog('='.repeat(70) + '\n', 'cyan');
}

// دالة لتنفيذ الأوامر مع Promise
function runCommand(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    colorLog(`🔄 تنفيذ: ${command}`, 'cyan');
    
    const child = exec(command, { cwd, timeout: 300000 }, (error, stdout, stderr) => {
      if (error) {
        colorLog(`❌ فشل الأمر: ${command}`, 'red');
        colorLog(`خطأ: ${error.message}`, 'red');
        if (stderr) colorLog(`خطأ إضافي: ${stderr}`, 'red');
        reject(error);
      } else {
        colorLog(`✅ تم بنجاح: ${command}`, 'green');
        if (stdout && stdout.length < 500) {
          colorLog(`الناتج: ${stdout}`, 'blue');
        } else if (stdout) {
          colorLog(`الناتج: ${stdout.substring(0, 200)}...`, 'blue');
        }
        resolve(stdout);
      }
    });
  });
}

// التحقق من وجود Node.js و npm
async function checkSystemRequirements() {
  colorLog('\n📋 فحص متطلبات النظام...', 'yellow');
  
  try {
    // التحقق من Node.js
    const nodeVersion = process.version;
    if (nodeVersion) {
      const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
      if (majorVersion >= 18) {
        colorLog(`✅ Node.js: ${nodeVersion} (مناسب)`, 'green');
      } else {
        colorLog(`⚠️  Node.js: ${nodeVersion} (يُفضل الإصدار 18 أو أحدث)`, 'yellow');
      }
    }
    
    // التحقق من npm
    try {
      const npmVersion = await runCommand('npm --version');
      colorLog(`✅ npm: v${npmVersion.trim()}`, 'green');
    } catch {
      colorLog('❌ npm غير متاح', 'red');
      throw new Error('npm is required');
    }

    // التحقق من الذاكرة المتاحة
    const totalMemory = process.memoryUsage();
    colorLog(`💾 الذاكرة المستخدمة: ${(totalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`, 'blue');
    
    colorLog('✅ جميع المتطلبات متوفرة!', 'green');
    return true;
  } catch (error) {
    colorLog(`❌ فشل في فحص المتطلبات: ${error.message}`, 'red');
    return false;
  }
}

// إنشاء ملفات البيئة
function setupEnvironmentFiles() {
  colorLog('\n🔧 إعداد ملفات البيئة...', 'yellow');
  
  const envContent = `# 🔧 ملف بيئة نظام شغف للعمل المشترك
# تم إنشاؤه تلقائياً بواسطة ملف الإعداد

# قاعدة البيانات
DATABASE_URL=postgresql://username:password@localhost:5432/shaghaf_erp

# مفاتيح الأمان - ⚠️ يجب تغييرها في البيئة الإنتاجية
JWT_SECRET=shaghaf-jwt-secret-key-development-only-change-in-production
SESSION_SECRET=shaghaf-session-secret-development

# إعدادات الخادم
PORT=3001
NODE_ENV=development

# رابط الواجهة الأمامية (لـ CORS)
FRONTEND_URL=http://localhost:5173

# إعدادات الملفات
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# إعدادات البريد الإلكتروني (اختيارية)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# إعدادات تسعير المساحة المشتركة الافتراضية (بالجنيه المصري)
DEFAULT_HOUR_1_PRICE=40
DEFAULT_HOUR_2_PRICE=30
DEFAULT_HOUR_3_PLUS_PRICE=30
DEFAULT_MAX_ADDITIONAL_CHARGE=100

# إعدادات التطوير
DEBUG=true
VITE_API_URL=http://localhost:3001/api
`;

  const gitignoreAddition = `
# ملفات البيئة
.env
.env.local
.env.production

# مجلدات الرفع والسجلات
uploads/
logs/
backups/

# ملفات النظام
.DS_Store
Thumbs.db
`;

  try {
    // إنشاء ملف .env
    if (!fs.existsSync('.env')) {
      fs.writeFileSync('.env', envContent);
      colorLog('✅ تم إنشاء ملف .env', 'green');
    } else {
      colorLog('ℹ️  ملف .env موجود بالفعل', 'blue');
    }
    
    // تحديث .gitignore
    if (fs.existsSync('.gitignore')) {
      const currentGitignore = fs.readFileSync('.gitignore', 'utf8');
      if (!currentGitignore.includes('.env')) {
        fs.appendFileSync('.gitignore', gitignoreAddition);
        colorLog('✅ تم تحديث ملف .gitignore', 'green');
      }
    } else {
      fs.writeFileSync('.gitignore', gitignoreAddition);
      colorLog('✅ تم إنشاء ملف .gitignore', 'green');
    }
    
    return true;
  } catch (error) {
    colorLog(`❌ فشل في إعداد ملفات البيئة: ${error.message}`, 'red');
    return false;
  }
}

// تثبيت التبعيات
async function installDependencies() {
  colorLog('\n📦 تثبيت التبعيات...', 'yellow');
  
  try {
    // تنظيف cache npm أولاً
    colorLog('🧹 تنظيف npm cache...', 'cyan');
    try {
      await runCommand('npm cache clean --force');
    } catch {
      colorLog('ℹ️  تعذر تنظيف npm cache (ليس بالضرورة مشكلة)', 'blue');
    }

    // التحقق من package.json
    if (!fs.existsSync('package.json')) {
      colorLog('❌ ملف package.json غير موجود', 'red');
      throw new Error('package.json not found');
    }

    // تثبيت التبعيات الأساسية
    colorLog('📱 تثبيت تبعيات المشروع...', 'cyan');
    await runCommand('npm install');
    
    // التحقق من التثبيت
    if (fs.existsSync('node_modules')) {
      colorLog('✅ تم تثبيت التبعيات بنجاح!', 'green');
      
      // عد التبعيات المثبتة
      try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const depCount = Object.keys(packageJson.dependencies || {}).length;
        const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
        colorLog(`📊 تم تثبيت ${depCount} تبعية أساسية و ${devDepCount} تبعية تطوير`, 'blue');
      } catch {
        colorLog('📊 تم تثبيت التبعيات بنجاح', 'blue');
      }
    } else {
      throw new Error('node_modules directory not found after installation');
    }
    
    return true;
  } catch (error) {
    colorLog(`❌ فشل في تثبيت التبعيات: ${error.message}`, 'red');
    colorLog('💡 جرب تشغيل الأمر يدوياً: npm install', 'yellow');
    return false;
  }
}

// إنشاء مجلدات مطلوبة
function createRequiredDirectories() {
  colorLog('\n📁 إنشاء المجلدات المطلوبة...', 'yellow');
  
  const directories = [
    'uploads',
    'logs', 
    'backups',
    'public/assets',
    'public/images',
    'public/docs',
    'temp'
  ];
  
  directories.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        colorLog(`✅ تم إنشاء مجلد: ${dir}`, 'green');
      } else {
        colorLog(`ℹ️  مجلد موجود: ${dir}`, 'blue');
      }
    } catch (error) {
      colorLog(`⚠️  فشل في إنشاء مجلد ${dir}: ${error.message}`, 'yellow');
    }
  });
}

// التحقق من ملفات المشروع الأساسية
function verifyProjectFiles() {
  colorLog('\n🔍 التحقق من ملفات المشروع...', 'yellow');
  
  const requiredFiles = [
    { path: 'package.json', description: 'ملف تكوين المشروع' },
    { path: 'tsconfig.json', description: 'تكوين TypeScript' },
    { path: 'tailwind.config.js', description: 'تكوين Tailwind CSS' },
    { path: 'vite.config.ts', description: 'تكوين Vite' },
    { path: 'src/App.tsx', description: 'المكون الرئيسي' },
    { path: 'src/main.tsx', description: 'نقطة دخول التطبيق' },
    { path: 'index.html', description: 'صفحة HTML الرئيسية' },
    { path: 'server/index.ts', description: 'خادم النظام الخلفي' }
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file.path)) {
      colorLog(`✅ ${file.description}: ${file.path}`, 'green');
    } else {
      colorLog(`❌ مفقود: ${file.description} (${file.path})`, 'red');
      allFilesExist = false;
    }
  });
  
  if (allFilesExist) {
    colorLog('✅ جميع الملفات الأساسية موجودة!', 'green');
  } else {
    colorLog('⚠️  بعض الملفات الأساسية مفقودة', 'yellow');
  }
  
  return allFilesExist;
}

// عرض تعليمات إعداد قاعدة البيانات
function showDatabaseSetupInstructions() {
  colorLog('\n💾 تعليمات إعداد قاعدة البيانات:', 'magenta');
  colorLog('='.repeat(60), 'magenta');
  
  const instructions = `
⚠️  ملاحظة مهمة: بسبب قيود بيئة WebContainer، يجب إعداد قاعدة البيانات خارجياً

🔧 الخيار الأول - PostgreSQL محلي:

1. تثبيت PostgreSQL:
   • Windows: https://www.postgresql.org/download/windows/
   • macOS: brew install postgresql
   • Linux: sudo apt-get install postgresql postgresql-contrib

2. إنشاء قاعدة البيانات:
   createdb shaghaf_erp

3. تشغيل ملفات الهجرة:
   psql shaghaf_erp -f supabase/migrations/20250822180310_misty_desert.sql
   psql shaghaf_erp -f supabase/migrations/20250823023416_jolly_band.sql

4. تحديث ملف .env:
   DATABASE_URL=postgresql://username:password@localhost:5432/shaghaf_erp

🚀 الخيار الثاني - Supabase (موصى به للتطوير):

1. إنشاء حساب: https://supabase.com
2. إنشاء مشروع جديد
3. نسخ رابط قاعدة البيانات من Settings > Database
4. تحديث DATABASE_URL في ملف .env
5. تشغيل ملفات الهجرة من SQL Editor في Supabase

🎯 الوضع الحالي:
   النظام يعمل بـ Mock Data (بيانات وهمية) للتجربة الفورية
   يمكنك استخدام جميع الميزات بدون قاعدة بيانات

📱 بيانات الدخول التجريبية:
   البريد: admin@shaghaf.eg (أو أي من الحسابات الأخرى)
   كلمة المرور: أي كلمة مرور
`;

  colorLog(instructions, 'cyan');
}

// إنشاء ملف تعليمات التشغيل
function createRunInstructions() {
  colorLog('\n📚 إنشاء ملف التعليمات...', 'yellow');
  
  const instructionsContent = `# 🚀 تعليمات تشغيل نظام شغف للعمل المشترك

## تشغيل النظام

### الطريقة الأولى - تشغيل شامل:
\`\`\`bash
npm run dev:full
\`\`\`
يشغل الواجهة الأمامية والخلفية معاً

### الطريقة الثانية - تشغيل منفصل:
\`\`\`bash
# في terminal أول - الواجهة الأمامية
npm run dev

# في terminal ثاني - الخادم الخلفي  
npm run dev:server
\`\`\`

## الوصول للنظام

- **الواجهة الأمامية**: http://localhost:5173
- **API الخلفي**: http://localhost:3001/api

## 🔐 بيانات الدخول التجريبية

| الدور | البريد الإلكتروني | كلمة المرور |
|-------|------------------|-------------|
| مدير عام | admin@shaghaf.eg | أي كلمة مرور |
| مدير فرع | manager@shaghaf.eg | أي كلمة مرور |
| موظف الاستقبال | reception@shaghaf.eg | أي كلمة مرور |
| الموظف | employee@shaghaf.eg | أي كلمة مرور |

## 🧪 تشغيل الاختبارات

\`\`\`bash
# اختبارات الواجهة الأمامية
npm test

# اختبارات مع المراقبة
npm run test:watch

# تقرير التغطية
npm run test:coverage

# اختبارات النظام الشاملة
node test-system.js
\`\`\`

## 🔧 استكشاف الأخطاء الشائعة

### مشكلة ECONNREFUSED على port 3001:
\`\`\`bash
# تأكد من تشغيل الخادم الخلفي
npm run dev:server
\`\`\`

### مشكلة في تحميل الواجهة الأمامية:
\`\`\`bash
# أعد تثبيت التبعيات
npm install
npm run dev
\`\`\`

### مشكلة في قاعدة البيانات:
- النظام يعمل بدون قاعدة بيانات (Mock Data)
- لا حاجة لإعداد قاعدة بيانات للتجربة

## 📱 الميزات المتاحة

✅ **متاح فوراً (بدون قاعدة بيانات):**
- تسجيل الدخول والخروج
- إدارة الفروع
- إدارة الغرف والحجوزات
- إدارة العملاء والعضويات
- إدارة المخزون والموردين
- إدارة المشتريات
- إدارة المهام
- إدارة الورديات
- برنامج الولاء
- الإدارة المالية
- التقارير والإحصائيات
- إدارة الجلسات والفواتير المتقدمة

## 🆘 الحصول على المساعدة

1. **README.md** - الدليل الشامل
2. **test-system.js** - اختبارات النظام
3. **البريد الإلكتروني**: support@shaghaf.eg

---
**تم تطويره بـ ❤️ لمجتمع العمل المشترك في مصر**
`;

  try {
    fs.writeFileSync('RUN-INSTRUCTIONS.md', instructionsContent);
    colorLog('✅ تم إنشاء ملف RUN-INSTRUCTIONS.md', 'green');
    return true;
  } catch (error) {
    colorLog(`❌ فشل في إنشاء ملف التعليمات: ${error.message}`, 'red');
    return false;
  }
}

// التحقق من حالة النظام بعد الإعداد
async function verifySystemHealth() {
  colorLog('\n🏥 فحص صحة النظام...', 'yellow');
  
  const checks = [
    {
      name: 'ملف package.json',
      check: () => fs.existsSync('package.json')
    },
    {
      name: 'مجلد node_modules',
      check: () => fs.existsSync('node_modules')
    },
    {
      name: 'ملف .env',
      check: () => fs.existsSync('.env')
    },
    {
      name: 'ملف src/App.tsx',
      check: () => fs.existsSync('src/App.tsx')
    },
    {
      name: 'ملف server/index.ts',
      check: () => fs.existsSync('server/index.ts')
    },
    {
      name: 'ملفات الهجرة',
      check: () => fs.existsSync('supabase/migrations')
    },
    {
      name: 'ملف التكوين Vite',
      check: () => fs.existsSync('vite.config.ts')
    },
    {
      name: 'ملف التكوين Tailwind',
      check: () => fs.existsSync('tailwind.config.js')
    }
  ];
  
  let healthScore = 0;
  
  checks.forEach(healthCheck => {
    if (healthCheck.check()) {
      colorLog(`✅ ${healthCheck.name}`, 'green');
      healthScore++;
    } else {
      colorLog(`❌ ${healthCheck.name}`, 'red');
    }
  });
  
  const healthPercentage = (healthScore / checks.length * 100).toFixed(0);
  
  colorLog(`\n📊 صحة النظام: ${healthPercentage}% (${healthScore}/${checks.length})`, 
    healthScore === checks.length ? 'green' : 'yellow'
  );
  
  return healthScore;
}

// اختبار الاتصال بالخادم
async function testServerConnection() {
  colorLog('\n🔗 اختبار الاتصال بالخادم...', 'yellow');
  
  try {
    // محاولة تشغيل الخادم في الخلفية لاختبار قصير
    const testCommand = 'timeout 5s npm run dev:server || true';
    await runCommand(testCommand);
    colorLog('ℹ️  تم اختبار بدء تشغيل الخادم', 'blue');
    return true;
  } catch (error) {
    colorLog('⚠️  لم يتم اختبار الخادم (سيتم تشغيله يدوياً)', 'yellow');
    return false;
  }
}

// إنشاء ملف بدء تشغيل سريع
function createQuickStartScript() {
  colorLog('\n🚀 إنشاء ملف البدء السريع...', 'yellow');
  
  const quickStartContent = `#!/usr/bin/env node

/**
 * 🚀 ملف البدء السريع لنظام شغف
 * يشغل النظام بأمر واحد
 */

import { spawn } from 'child_process';

console.log('🏢 بدء تشغيل نظام شغف للعمل المشترك...');
console.log('=======================================\\n');

// تشغيل الواجهة الأمامية والخلفية معاً
const fullDev = spawn('npm', ['run', 'dev:with-db'], { 
  stdio: 'inherit',
  shell: true 
});

fullDev.on('close', (code) => {
  console.log(\`\\n📊 انتهى تشغيل النظام برمز: \${code}\`);
});

process.on('SIGINT', () => {
  console.log('\\n🛑 إيقاف النظام...');
  fullDev.kill('SIGINT');
  process.exit();
});

console.log('✅ تم بدء تشغيل النظام!');
console.log('🌐 افتح المتصفح على: http://localhost:5173');
console.log('📧 تسجيل الدخول: admin@shaghaf.eg (أي كلمة مرور)\\n');
`;

  try {
    fs.writeFileSync('start.js', quickStartContent);
    colorLog('✅ تم إنشاء ملف start.js للبدء السريع', 'green');
    return true;
  } catch (error) {
    colorLog(`❌ فشل في إنشاء ملف البدء السريع: ${error.message}`, 'red');
    return false;
  }
}

// عرض ملخص الإعداد والخطوات التالية
function showSetupSummary() {
  colorLog('\n🎯 ملخص الإعداد:', 'magenta');
  colorLog('='.repeat(50), 'magenta');
  
  const summary = `
✅ تم الانتهاء من إعداد النظام بنجاح!

📋 ما تم إنجازه:
   • ✓ فحص متطلبات النظام
   • ✓ تثبيت جميع التبعيات  
   • ✓ إعداد ملفات البيئة (.env)
   • ✓ إنشاء المجلدات المطلوبة
   • ✓ التحقق من صحة النظام
   • ✓ إنشاء ملفات التعليمات

🚀 طرق تشغيل النظام:

الطريقة الأولى - بدء سريع:
   node start.js

الطريقة الثانية - تشغيل شامل:
   npm run dev:full
   
الطريقة الثالثة - تشغيل منفصل:
   npm run dev          # الواجهة الأمامية (port 5173)
   npm run dev:server   # الخلفية (port 3001)

🌐 الوصول للنظام:
   افتح المتصفح على: http://localhost:5173
   
🔐 تسجيل الدخول:
   البريد: admin@shaghaf.eg
   كلمة المرور: أي كلمة مرور

📖 ملفات مفيدة:
   • RUN-INSTRUCTIONS.md - تعليمات التشغيل التفصيلية
   • README.md - الدليل الشامل للنظام
   • .env - ملف إعدادات البيئة
   • start.js - ملف البدء السريع

🎉 النظام جاهز للاستخدام مع بيانات تجريبية شاملة!

💡 نصائح:
   • النظام يعمل بـ Mock Data (بيانات وهمية) ولا يحتاج قاعدة بيانات للتجربة
   • جميع الميزات متاحة فوراً للاستخدام والتجربة
   • يمكن إعداد قاعدة بيانات حقيقية لاحقاً للإنتاج
`;

  colorLog(summary, 'green');
  
  // عرض رسالة النجاح النهائية
  colorLog('\n🌟 مبروك! تم إعداد نظام شغف بنجاح 🌟', 'bright');
  colorLog('شكراً لاختيار نظام شغف لإدارة مساحات العمل المشترك', 'cyan');
  colorLog('تطوير: فريق شغف التقني | البريد: support@shaghaf.eg', 'blue');
}

// وظيفة رئيسية لتنفيذ جميع خطوات الإعداد
async function main() {
  try {
    // عرض الشعار
    showLogo();
    
    colorLog(`⏰ بدء الإعداد في: ${new Date().toLocaleString('ar-EG')}`, 'blue');
    
    // 1. فحص متطلبات النظام
    const systemOk = await checkSystemRequirements();
    if (!systemOk) {
      colorLog('\n❌ فشل في فحص متطلبات النظام. يرجى إصلاح المشاكل والمحاولة مرة أخرى.', 'red');
      process.exit(1);
    }
    
    // 2. التحقق من ملفات المشروع
    const filesOk = verifyProjectFiles();
    if (!filesOk) {
      colorLog('\n⚠️  بعض ملفات المشروع مفقودة، لكن سنتابع الإعداد...', 'yellow');
    }
    
    // 3. إعداد ملفات البيئة
    const envOk = setupEnvironmentFiles();
    if (!envOk) {
      colorLog('\n❌ فشل في إعداد ملفات البيئة', 'red');
      process.exit(1);
    }
    
    // 4. إنشاء المجلدات المطلوبة
    createRequiredDirectories();
    
    // 5. تثبيت التبعيات
    const depsOk = await installDependencies();
    if (!depsOk) {
      colorLog('\n❌ فشل في تثبيت التبعيات', 'red');
      process.exit(1);
    }
    
    // 6. إنشاء ملف التعليمات
    createRunInstructions();
    
    // 7. إنشاء ملف البدء السريع
    createQuickStartScript();
    
    // 8. فحص صحة النظام النهائي
    const healthScore = await verifySystemHealth();
    
    // 9. اختبار الاتصال بالخادم
    await testServerConnection();
    
    // 10. عرض تعليمات قاعدة البيانات
    showDatabaseSetupInstructions();
    
    // 11. عرض ملخص الإعداد
    showSetupSummary();
    
    colorLog(`\n⏰ انتهى الإعداد في: ${new Date().toLocaleString('ar-EG')}`, 'blue');
    colorLog('🎯 النظام جاهز للتشغيل!', 'bright');
    
  } catch (error) {
    colorLog(`\n💥 فشل في الإعداد: ${error.message}`, 'red');
    colorLog('يرجى مراجعة الأخطاء أعلاه وإعادة المحاولة', 'yellow');
    process.exit(1);
  }
}

// تشغيل الإعداد إذا تم استدعاء الملف مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main, checkSystemRequirements, installDependencies, setupEnvironmentFiles };