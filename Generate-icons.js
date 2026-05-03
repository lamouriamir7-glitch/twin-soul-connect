const sharp = require('sharp');
const fs = require('fs');

// المسار للصورة التي رفعتها أنت
const inputImage = './public/brain_raw.png'; 
const outputFolder = './public/';

async function createIcons() {
    try {
        // 1. أيقونة المتصفح (Favicon 32x32)
        await sharp(inputImage)
            .resize(32, 32)
            .toFile(`${outputFolder}favicon-32x32.png`);

        // 2. أيقونة المتصفح الصغيرة (Favicon 16x16)
        await sharp(inputImage)
            .resize(16, 16)
            .toFile(`${outputFolder}favicon-16x16.png`);

        // 3. أيقونة أجهزة آبل والآيفون (Apple Touch Icon 180x180)
        await sharp(inputImage)
            .resize(180, 180)
            .toFile(`${outputFolder}apple-touch-icon.png`);

        console.log("✅ عبقري! تم تحويل العقل الذهبي إلى أيقونات بنجاح.");
    } catch (error) {
        console.error("❌ عذراً يا صديقي، حدث خطأ أثناء معالجة الصورة:", error);
    }
}

createIcons();
