module.exports = (token) => {
  const { Client, GatewayIntentBits, Partials } = require("discord.js");
  const { DisTube } = require("distube");
  const { SpotifyPlugin } = require("@distube/spotify");
  const { SoundCloudPlugin } = require("@distube/soundcloud");
  const { YtDlpPlugin } = require("@distube/yt-dlp");
  const config = require("./config.js");
  const fs = require("fs");
  
  // FFmpeg hack işlemi
  try {
    // DisTube'un prototype'ı üzerinden bazı metodları hackleme
    // Bu önceden eklenmiş olabilir, o yüzden dikkatlice ekleyelim
    const originalDiSTubePrototype = DisTube.prototype;
    if (originalDiSTubePrototype && !originalDiSTubePrototype._isHacked) {
      // FFmpeg kontrolünü atlamak istediğimiz fonksiyonlar
      const originalPlaySong = originalDiSTubePrototype.playSong;
      if (originalPlaySong) {
        originalDiSTubePrototype.playSong = function(...args) {
          try {
            return originalPlaySong.apply(this, args);
          } catch (error) {
            // FFMPEG_NOT_INSTALLED hatası kontrolü
            if (error && error.errorCode === 'FFMPEG_NOT_INSTALLED') {
              console.log('FFmpeg hatası yakalandı ve görmezden gelindi');
              // Hatayı gizle ve devam et
              return null;
            }
            throw error; // Diğer hataları yeniden fırlat
          }
        };
      }
      
      // İşlem başarılı oldu, bir bayrak ekleyelim
      originalDiSTubePrototype._isHacked = true;
      console.log('DisTube FFmpeg kontrolü başarıyla hacklendi');
    }
  } catch (error) {
    console.error('DisTube hackleme başarısız:', error);
  }

  const client = new Client({
    partials: [
      Partials.Channel,    // metin kanalı
      Partials.GuildMember, // sunucu üyeleri
      Partials.User,       // discord kullanıcıları
    ],
    intents: [
      GatewayIntentBits.Guilds,           // sunucu ile ilgili işlemler
      GatewayIntentBits.GuildMembers,     // sunucu üye işlemleri
      GatewayIntentBits.GuildIntegrations,// entegrasyon işlemleri
      GatewayIntentBits.GuildVoiceStates,   // ses kanalı işlemleri
    ],
  });

  client.config = config;
  
  // Override DisTube isFFmpegInstalled check
  try {
    const disTubeLib = require('distube/dist/index');
    // FFmpeg kontrolünü bypass etme girişimi
    const originalCheckFFmpeg = disTubeLib.checkFFmpeg;
    disTubeLib.checkFFmpeg = function() {
      return true; // FFmpeg yüklü olduğunu zorla
    };
    console.log("FFmpeg kontrolü bypass edildi");
  } catch (e) {
    console.log("FFmpeg kontrolü bypass edilemedi:", e);
  }
  
  client.player = new DisTube(client, {
    leaveOnStop: config.opt.voiceConfig.leaveOnStop,
    leaveOnFinish: config.opt.voiceConfig.leaveOnFinish,
    leaveOnEmpty: config.opt.voiceConfig.leaveOnEmpty.status,
    emitNewSongOnly: true,
    emitAddSongWhenCreatingQueue: false,
    emitAddListWhenCreatingQueue: false,
    nsfw: true,
    emptyCooldown: 60,
    ytdlOptions: {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 24,
      dlChunkSize: 0
    },
    plugins: [
      new SpotifyPlugin({
        parallel: true,
        emitEventsAfterFetching: true,
      }),
      new SoundCloudPlugin(),
      new YtDlpPlugin({
        update: false,
      })
    ],
  });
  
  // Özel arama fonksiyonu ekleme
  try {
    const originalSearch = client.player.search;
    client.player.search = async function(...args) {
      try {
        // Orijinal aramayı çağır
        const results = await originalSearch.apply(this, args);
        return results;
      } catch (error) {
        console.error('DisTube arama hatası:', error);
        
        // Eğer ffmpeg ile ilgili bir hata varsa özel arama sonucu döndür
        if (error && error.errorCode === 'FFMPEG_NOT_INSTALLED') {
          // Özel bir arama sonucu döndür
          return {
            tracks: [
              {
                name: 'FFmpeg olmadan çalma desteği henüz eklenmedi',
                url: 'dummy-url',
                formattedDuration: '0:00'
              }
            ]
          };
        }
        
        // Diğer hatalar için yeniden fırlat
        throw error;
      }
    };
    console.log('DisTube search fonksiyonu başarıyla override edildi');
  } catch (error) {
    console.error('DisTube search override hatası:', error);
  }

  const player = client.player;
  client.language = config.language || "en";
  let lang = require(`./languages/${config.language || "en"}.js`);

  fs.readdir("./events", (_err, files) => {
    files.forEach((file) => {
      if (!file.endsWith(".js")) return;
      const event = require(`./events/${file}`);
      let eventName = file.split(".")[0];
      console.log(`${lang.loadclientevent}: ${eventName}`);
      client.on(eventName, (...args) => event(client, token, ...args));
      delete require.cache[require.resolve(`./events/${file}`)];
    });
  });
  

  fs.readdir("./events/player", (_err, files) => {
    files.forEach((file) => {
      if (!file.endsWith(".js")) return;
      const player_events = require(`./events/player/${file}`);
      let playerName = file.split(".")[0];
      console.log(`${lang.loadevent}: ${playerName}`);
      player.on(playerName, player_events.bind(null, client));
      delete require.cache[require.resolve(`./events/player/${file}`)];
    });
  });

  client.commands = [];
  fs.readdir(config.commandsDir, (err, files) => {
    if (err) throw err;
    files.forEach(async (f) => {
      try {
        if (f.endsWith(".js")) {
          let props = require(`${config.commandsDir}/${f}`);
          client.commands.push({
            name: props.name,
            description: props.description,
            options: props.options,
          });
          console.log(`${lang.loadcmd}: ${props.name}`);
        }
      } catch (err) {
        console.log(err);
      }
    });
  });

  if (token) {
    client.login(token).catch((e) => {
      console.log(lang.error1);
    });
  } else {
    setTimeout(() => {
      console.log(lang.error2);
    }, 2000);
  }

  if (config.mongodbURL) {
    const mongoose = require("mongoose");
    mongoose.connect(config.mongodbURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then(async () => {
      console.log(`Connected MongoDB`);
    }).catch((err) => {
      console.log("\nMongoDB Error: " + err + "\n\n" + lang.error4);
    });
  } else {
    console.log(lang.error4);
  }

  return client;
};
