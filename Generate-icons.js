const sharp = require('sharp');
const fs = require('fs');

const inputImage = './public/brain_raw.png';
const outputFolder = './public/';

async function createIcons() {
    try {
        // أيقونة المتصفح الكبيرة
        await sharp(inputImage)
            .resize(32, 32)
            .toFile(`${outputFolder}favicon-32x32.png`);

        // أيقونة المتصفح الصغيرة
        await sharp(inputImage)
            .resize(16, 16)
            .toFile(`${outputFolder}favicon-16x16.png`);

        // أيقونة أجهزة آبل والآيفون
        await sharp(inputImage)
            .resize(180, 180)
            .toFile(`${outputFolder}apple-touch-icon.png`);

        console.log("✅ تم توليد الأيقونات بنجاح!");
    } catch (error) {
        console.error("❌ حدث خطأ أثناء معالجة الصورة:", error);
    }
}

createIcons();
