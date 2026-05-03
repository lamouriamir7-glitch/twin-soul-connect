import sharp from 'sharp';
import fs from 'fs';

// المسار للصورة داخل مجلد public
const inputImage = './public/Brain_raw.png'; 
const outputFolder = './public/';

async function createIcons() {
    try {
        // تأكد من وجود المجلد
        if (!fs.existsSync(outputFolder)) {
            fs.mkdirSync(outputFolder);
        }

        // 1. أيقونة المتصفح (Favicon 32x32)
        await sharp(inputImage)
            .resize(32, 32)
            .toFile(`${outputFolder}favicon-32x32.png`);

        // 2. أيقونة المتصفح الصغيرة (Favicon 16x16)
        await sharp(inputImage)
            .resize(16, 16)
            .toFile(`${outputFolder}favicon-16x16.png`);

        // 3. أيقونة أجهزة آبل (Apple Touch Icon 180x180)
        await sharp(inputImage)
            .resize(180, 180)
            .toFile(`${outputFolder}apple-touch-icon.png`);

        console.log("✅ العقل الذهبي جاهز الآن بكل المقاسات!");
    } catch (error) {
        console.error("❌ حدث خطأ في معالجة الصورة:", error);
    }
}

createIcons();
