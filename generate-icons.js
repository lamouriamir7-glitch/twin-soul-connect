import sharp from 'sharp';

const inputImage = './public/Brain_raw.png'; 

async function prepareIcons() {
    try {
        // 1. توليد أيقونة الموقع الأساسية (للمتصفح)
        await sharp(inputImage).resize(180, 180).toFile('./public/apple-touch-icon.png');
        
        // 2. أهم خطوة: إنشاء ملف icon.png في المجلد الرئيسي ليراه الأندرويد
        // أداة Capacitor ستستخدم هذا الملف لصنع كل أيقونات التطبيق تلقائياً
        await sharp(inputImage).toFile('./icon.png');
        
        console.log("✅ العقل الذهبي جاهز في المجلد الرئيسي كـ icon.png");
    } catch (error) {
        console.error("❌ خطأ في معالجة الصورة:", error);
    }
}
prepareIcons();
