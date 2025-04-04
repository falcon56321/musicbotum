const { EmbedBuilder } = require('discord.js');
const db = require("../mongoDB");

module.exports = {
  name: "ffmpeg",
  description: "FFmpeg hakkında bilgi ve kurulum talimatları verir.",
  permissions: "0x0000000000000800",
  options: [],
  run: async (client, interaction) => {
    let lang = await db?.musicbot?.findOne({ guildID: interaction.guild.id })
    lang = lang?.language || client.language
    lang = require(`../languages/${lang}.js`);

    try {
      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle("FFmpeg ve YouTube Sorunları Rehberi")
        .setDescription("Müzik botunun çalışması için iki önemli gereksinim vardır: FFmpeg kurulumu ve YouTube'un bot kontrollerinden geçmek.")
        .addFields(
          { name: "Windows için FFmpeg Kurulumu", value: "1) [FFmpeg web sitesini](https://ffmpeg.org/download.html#build-windows) ziyaret edin\n2) 'Windows Builds' bölümünden indirin\n3) Dosyaları çıkartın ve `C:\\ffmpeg` klasörüne yerleştirin\n4) Sistem Ortam Değişkenlerinde PATH'e `C:\\ffmpeg\\bin` yolunu ekleyin" },
          { name: "Linux için FFmpeg Kurulumu", value: "```bash\n# Ubuntu/Debian için\nsudo apt update\nsudo apt install ffmpeg\n\n# CentOS/RHEL için\nsudo yum install ffmpeg ffmpeg-devel\n```" },
          { name: "macOS için FFmpeg Kurulumu", value: "```bash\n# Homebrew ile\nbrew install ffmpeg\n```" },
          { name: "FFmpeg Kurulumu Sonrası", value: "Kurulum tamamlandıktan sonra Discord botunu yeniden başlatmanız gerekir. Komut satırında `ffmpeg -version` yazarak kurulumun başarılı olup olmadığını kontrol edebilirsiniz." },
          { name: "YouTube 'Sign in to confirm you're not a bot' Sorunu", value: "YouTube, botları tespit ettiğinde müzik çalmayı engelleyebilir. Bu sorunla karşılaşırsanız şu çözümleri deneyebilirsiniz:" },
          { name: "Çözüm 1: YouTube API Kullanımı", value: "Bot sahibiyseniz, YouTube Data API v3 kullanarak bir API anahtarı alabilir ve botu güncelleme seçeneğiniz vardır." },
          { name: "Çözüm 2: Cookie Kullanımı", value: "YouTube hesabınızdan cookie bilgilerini alıp bot konfigürasyonuna ekleyebilirsiniz. Bot geliştiricisinin yapması gereken bir işlemdir." },
          { name: "Çözüm 3: Alternatif Müzik Kaynakları", value: "YouTube yerine Spotify veya SoundCloud gibi alternatif platformları kullanabilirsiniz. `/play` komutunu kullanırken Spotify veya SoundCloud linkleri deneyin." }
        )
        .setFooter({ text: "ATI Network | Müzik Botu" });

      return interaction.reply({ embeds: [embed] });
    } catch (e) {
      console.error("FFmpeg komut hatası:", e);
      return interaction.reply({ content: "FFmpeg bilgisi gösterilirken bir hata oluştu.", ephemeral: true });
    }
  },
}; 