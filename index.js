// FFmpeg patch'ini çalıştır
try {
  require('./patch-ffmpeg.js');
} catch (e) {
  console.error('FFmpeg patch yüklenemedi:', e);
}

// Dotenv'i en başta yükle, config.js buna bağlı çalışıyor
require('dotenv').config();
const config = require('./config.js');

if (config.shardManager.shardStatus === true) {
    const { ShardingManager } = require('discord.js');
    const primaryToken = config.TOKENS[0];
    const manager = new ShardingManager('./bot.js', { token: primaryToken });
    manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`));
    manager.spawn();
} else {
    const tokens = config.TOKENS;
    if (!tokens || tokens.length === 0) {
        console.error('Hiçbir token bulunamadı! .env dosyasında BOT_TOKENS değişkenini kontrol edin.');
        process.exit(1);
    }
    tokens.forEach(token => {
        require("./bot.js")(token);
    });
}
