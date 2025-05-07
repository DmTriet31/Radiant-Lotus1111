const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Gửi giao diện hỗ trợ Radiant Lotus Store'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('Radiant Lotus Store')
      .setDescription('Chào bạn! Nếu bạn cần mua hàng, bảo hành hoặc liên hệ, vui lòng chọn nút bên dưới.')
      .setImage('https://cdn.discordapp.com/attachments/1221428098927474790/1237462853215397908/A0542B66-3FB1-438E-86D1-6428EFCEE611.jpeg?ex=663cc8c6&is=663b7746&hm=de39df47cc0253f96bc47d630d830621c4cbf63b6a4e41a12a90a9ed37d0ce3a&')
      .setColor('#ff80bf');

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('mua_hang')
        .setLabel('Mua Hàng 🛒')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId('bao_hanh')
        .setLabel('Bảo hành ⚠️')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId('lien_he')
        .setLabel('Liên Hệ 📞')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setLabel('Instagram')
        .setStyle(ButtonStyle.Link)
        .setURL('https://www.instagram.com/radiant.lotus12?igsh=MXg3cW02dGEwMWhkdw==')
    );

    await interaction.reply({ embeds: [embed], components: [buttons] });
  }
};
