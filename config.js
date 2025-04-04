require('dotenv').config();

// DJ komutlarını string'den diziye çevirme
const parseCommands = (commandsString) => {
    return commandsString ? commandsString.split(',') : [];
};

// Owner ID'leri virgülle ayrılmış string'den diziye çevirme
const parseOwnerIds = (ownerIdsString) => {
    return ownerIdsString ? ownerIdsString.split(',') : [];
};

// Tokens'ı virgülle ayrılmış string'den diziye çevirme
const parseTokens = (tokensString) => {
    return tokensString ? tokensString.split(',') : [];
};

// Boolean değerlerini string'den boolean'a çevirme
const parseBoolean = (value) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
};

// Sayısal değerleri string'den sayıya çevirme
const parseNumber = (value) => {
    return value ? parseInt(value) : 0;
};

module.exports = {
    TOKENS: parseTokens(process.env.BOT_TOKENS),
    ownerID: parseOwnerIds(process.env.OWNER_IDS), // Discord kullanıcı ID'leri örnek: ["id"] veya ["id1","id2"]
    botInvite: process.env.BOT_INVITE || "", // Discord bot davet linkiniz
    supportServer: process.env.SUPPORT_SERVER || "", // Discord destek sunucu davetiniz
    mongodbURL: process.env.MONGODB_URL || "", // MongoDB URL'iniz
    status: process.env.BOT_STATUS || "",
    commandsDir: process.env.COMMANDS_DIR || './commands', // Lütfen değiştirmeyin
    language: process.env.LANGUAGE || "en", // ar, de, en, es, fr, id, it, ja, nl, pt, ru, tr, zh_TW
    embedColor: process.env.EMBED_COLOR || "ffa954", // hex renk kodu
    errorLog: process.env.ERROR_LOG || "", // Discord hata log kanal ID'niz

    playlistSettings: {
        maxPlaylist: parseNumber(process.env.MAX_PLAYLIST) || 10, // maks playlist sayısı
        maxMusic: parseNumber(process.env.MAX_MUSIC) || 75, // maks müzik sayısı
    },

    opt: {
        DJ: {
            commands: parseCommands(process.env.DJ_COMMANDS) || ['back', 'clear', 'filter', 'loop', 'pause', 'resume', 'skip', 'stop', 'volume', 'shuffle'] // Lütfen değiştirmeyin
        },

        voiceConfig: {
            leaveOnStop: parseBoolean(process.env.LEAVE_ON_STOP) || false, // Bu değişken "true" ise, bot müzik durdurulduğunda kanalı terk eder
            leaveOnFinish: parseBoolean(process.env.LEAVE_ON_FINISH) || false, // Bu değişken "true" ise, bot müzik bittiğinde kanalı terk eder

            leaveOnEmpty: { // leaveOnEnd değişkeni bu sistemi kullanmak için "false" olmalıdır
                status: parseBoolean(process.env.LEAVE_ON_EMPTY_STATUS) || true, // Bu değişken "true" ise, bot çevrimdışı olduğunda kanalı terk eder
                cooldown: parseNumber(process.env.LEAVE_ON_EMPTY_COOLDOWN) || 10000000, // 1000 = 1 saniye
            },
        },

        maxVol: parseNumber(process.env.MAX_VOL) || 200, // Maksimum ses seviyesini belirleyebilirsiniz
    },

    sponsor: {
        status: parseBoolean(process.env.SPONSOR_STATUS) || true, // true veya false
        url: process.env.SPONSOR_URL || "", // Discord sponsor URL'iniz
    },

    voteManager: { // isteğe bağlı
        status: parseBoolean(process.env.VOTE_STATUS) || false, // true veya false
        api_key: process.env.VOTE_API_KEY || "", // top.gg API anahtarınızı yazın
        vote_commands: parseCommands(process.env.VOTE_COMMANDS) || ["back", "channel", "clear", "dj", "filter", "loop", "nowplaying", "pause", "play", "playlist", "queue", "resume", "save", "search", "skip", "stop", "time", "volume"], // oy ile kullanacağınız komutları yazın
        vote_url: process.env.VOTE_URL || "", // top.gg oy URL'inizi yazın
    },

    shardManager: {
        shardStatus: parseBoolean(process.env.SHARD_STATUS) || false // Botunuz 1000'den fazla sunucuda varsa, bu kısmı true olarak değiştirin
    },
}
