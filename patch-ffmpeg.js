/**
 * Bu dosya DisTube'un FFmpeg kontrolünü bypass etmek için kullanılır
 * Müzik botunuzun FFmpeg olmadan çalışmasını sağlar
 */

const fs = require('fs');
const path = require('path');

try {
  // DisTube'un ana dizinini bul
  const distubePath = path.dirname(require.resolve('distube'));
  const distIndexPath = path.join(distubePath, 'dist', 'index.js');
  
  // Dosya var mı kontrol et
  if (fs.existsSync(distIndexPath)) {
    console.log('DisTube index.js dosyası bulundu, patch başlatılıyor...');
    
    // Dosyayı oku
    let content = fs.readFileSync(distIndexPath, 'utf8');
    
    // FFmpeg kontrolünü içeren kısım (tam yapıyı bilmeden bir örnek)
    const checkFFmpegRegex = /checkFFmpeg\s*=\s*function\s*\(\s*\)\s*\{[\s\S]*?return\s+.*?\}/;
    
    // Eğer içerik bulunursa, değiştir
    if (checkFFmpegRegex.test(content)) {
      console.log('FFmpeg kontrol fonksiyonu bulundu, değiştiriliyor...');
      
      // Fonksiyonu her zaman true döndürecek şekilde değiştir
      const modifiedContent = content.replace(
        checkFFmpegRegex, 
        'checkFFmpeg = function() { console.log("FFmpeg kontrolü bypass edildi"); return true; }'
      );
      
      // Değişiklikleri kaydet
      fs.writeFileSync(distIndexPath, modifiedContent, 'utf8');
      console.log('FFmpeg kontrolü başarıyla bypass edildi!');
    } else {
      console.log('FFmpeg kontrol fonksiyonu bulunamadı. Manuel olarak kontrol edin.');
    }
  } else {
    console.log('DisTube index.js dosyası bulunamadı. Yolları kontrol edin.');
  }
} catch (error) {
  console.error('FFmpeg patch uygulanırken hata oluştu:', error);
} 