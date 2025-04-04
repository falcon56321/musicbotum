const { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require("../mongoDB");
module.exports = {
  name: "search",
  description: "Used for your music search",
  permissions: "0x0000000000000800",
  options: [{
    name: 'name',
    description: 'Type the name of the music you want to play.',
    type: ApplicationCommandOptionType.String,
    required: true
  }],
  voiceChannel: true,
  run: async (client, interaction) => {
    let lang = await db?.musicbot?.findOne({ guildID: interaction.guild.id })
    lang = lang?.language || client.language
    lang = require(`../languages/${lang}.js`);

    try {
      const name = interaction.options.getString('name')
      if (!name) return interaction.reply({ content: lang.msg73, ephemeral: true }).catch(e => { })
      
      await interaction.reply({ content: `🔍 **${lang.msg78}** \`${name}\`` }).catch(e => { })
      
      let res
      try {
        // Youtube içeriğini doğrudan arayalım
        const searchTerm = encodeURIComponent(name);
        const searchUrl = `ytsearch:${searchTerm}`;
        
        res = await client.player.search(searchUrl, {
          member: interaction.member,
          textChannel: interaction.channel,
          interaction
        });
        
        console.log("Arama sonucu:", res ? (res.tracks ? res.tracks.length : "tracks yok") : "sonuç yok");
      } catch(e) {
        console.error("Search Error:", e);
        
        // FFmpeg hatası için özel mesaj
        if (e && e.errorCode === 'FFMPEG_NOT_INSTALLED') {
          return interaction.editReply({ 
            content: "⚠️ **Sunucuda FFmpeg kurulu olmadığından arama yapılamıyor.** Kurulum hakkında bilgi için `/ffmpeg` komutunu kullanın.", 
            ephemeral: true 
          }).catch(e => { });
        }
        
        return interaction.editReply({ content: `${lang.msg60}\n\`${e.message || "Bilinmeyen hata"}\`` }).catch(e => { })
      }

      if (!res || !res.tracks || !res.tracks.length) {
        return interaction.editReply({ content: `${lang.msg74}\n\`⚠️ Arama sonuçları bulunamadı. Lütfen başka bir terim deneyin veya doğrudan bir YouTube linki girin.\`` }).catch(e => { })
      }

      const embed = new EmbedBuilder();
      embed.setColor(client.config.embedColor);
      embed.setTitle(`${lang.msg75}: ${name}`);

      const maxTracks = res.tracks.slice(0, 10);
      
      let track_button_creator = maxTracks.map((song, index) => {
        return new ButtonBuilder()
          .setLabel(`${index + 1}`)
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(`${index + 1}`)
      })

      let buttons1
      let buttons2
      if (track_button_creator.length > 10) {
        buttons1 = new ActionRowBuilder().addComponents(track_button_creator.slice(0, 5))
        buttons2 = new ActionRowBuilder().addComponents(track_button_creator.slice(5, 10))
      } else {
        if (track_button_creator.length > 5) {
          buttons1 = new ActionRowBuilder().addComponents(track_button_creator.slice(0, 5))
          buttons2 = new ActionRowBuilder().addComponents(track_button_creator.slice(5, Number(track_button_creator.length)))
        } else {
          buttons1 = new ActionRowBuilder().addComponents(track_button_creator)
        }
      }

      let cancel = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel(lang.msg81)
          .setStyle(ButtonStyle.Danger)
          .setCustomId('cancel'))

      const trackListDescription = maxTracks.map((song, i) => {
        let duration = song.formattedDuration || 'Bilinmiyor';
        let songName = song.name || song.title || 'Bilinmeyen parça';
        return `**${i + 1}**. ${songName} | \`${duration}\``;
      }).join('\n');

      embed.setDescription(`${trackListDescription}\n\n${lang.msg76.replace("{maxTracks.length}", maxTracks.length)}`);
      embed.setTimestamp();
      embed.setFooter({ text: `ATI Network | Müzik Botu` })

      let code
      if (buttons1 && buttons2) {
        code = { embeds: [embed], components: [buttons1, buttons2, cancel] }
      } else {
        code = { embeds: [embed], components: [buttons1, cancel] }
      }
      
      interaction.editReply(code).then(async Message => {
        const filter = i => i.user.id === interaction.user.id
        let collector = await Message.createMessageComponentCollector({ filter, time: 60000 })

        collector.on('collect', async (button) => {
          switch (button.customId) {
            case 'cancel': {
              embed.setDescription(`${lang.msg77}`)
              await interaction.editReply({ embeds: [embed], components: [] }).catch(e => { })
              return collector.stop();
            }
              break;
            default: {
              const selectedTrack = res.tracks[Number(button.customId) - 1];
              if (!selectedTrack) {
                return interaction.editReply({ content: `Seçilen parça bulunamadı. Lütfen tekrar deneyin.`, components: [] }).catch(e => { });
              }
              
              if (selectedTrack.thumbnail) {
                embed.setThumbnail(selectedTrack.thumbnail);
              }
              
              embed.setDescription(`**${selectedTrack.name || selectedTrack.title || 'Bilinmeyen parça'}** ${lang.msg79}`)
              await interaction.editReply({ embeds: [embed], components: [] }).catch(e => { })
              
              try {
                await client.player.play(interaction.member.voice.channel, selectedTrack.url, {
                  member: interaction.member,
                  textChannel: interaction.channel,
                  interaction
                })
              } catch (e) {
                console.error("Search play error:", e);
                
                // FFmpeg hatası için özel mesaj
                if (e && e.errorCode === 'FFMPEG_NOT_INSTALLED') {
                  return interaction.editReply({ 
                    content: "⚠️ **Sunucuda FFmpeg kurulu olmadığından müzik çalınamıyor.** Kurulum hakkında bilgi için `/ffmpeg` komutunu kullanın.", 
                    ephemeral: true 
                  }).catch(e => { });
                }
                
                await interaction.editReply({ content: `${lang.msg60}\n\`${e}\``, ephemeral: true }).catch(e => { })
              }
              return collector.stop();
            }
          }
        });

        collector.on('end', (msg, reason) => {
          if (reason === 'time') {
            embed.setDescription(lang.msg80)
            return interaction.editReply({ embeds: [embed], components: [] }).catch(e => { })
          }
        })

      }).catch(e => {
        console.error("Message edit error:", e);
      })

    } catch (e) {
      console.error("Search command error:", e);
      const errorNotifer = require("../functions.js")
      errorNotifer(client, interaction, e, lang)
    }
  },
};