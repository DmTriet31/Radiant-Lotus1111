const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('partner')
    .setDescription('Gửi thông tin đối tác')
    .addUserOption(option =>
      option.setName('đại_diện')
        .setDescription('Người đại diện cho đối tác')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('link')
        .setDescription('Link mời đến server đối tác')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles), // Chỉ cho staff

  async execute(interaction) {
    const user = interaction.options.getUser('đại_diện');
    const link = interaction.options.getString('link');
    const guild = interaction.guild;

    const partnerChannelId = '1367120844878254202'; // ID kênh gửi đối tác
    const partnerRoleId = '1367120701869260941';   // Role cấp cho đại diện

    // Lấy banner hoặc icon server (ảnh nền embed)
    const serverBanner = guild.bannerURL({ size: 1024 }) 
                      || guild.iconURL({ dynamic: true, size: 1024 }) 
                      || 'https://i.imgur.com/Z8e2Trs.png';

    const embed = new EmbedBuilder()
      .setColor(0x00AEFF)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setImage(serverBanner)
      .setDescription(`**Đại diện:** ${user}\n**Link:** *(xem ở trên)*`)
      .setFooter({
        text: `Đại diện bên mình: ${interaction.user.tag} | ${new Date().toLocaleString()}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    try {
      const channel = guild.channels.cache.get(partnerChannelId);
      if (!channel) {
        return interaction.reply({ content: '❌ Không tìm thấy kênh đối tác!', ephemeral: true });
      }

      // Gửi tin nhắn: link nằm ngoài embed → có JOIN button
      await channel.send({
        content: link,      // 👈 Bắt buộc để Discord tạo preview + nút Tham gia
        embeds: [embed]
      });

      const member = await guild.members.fetch(user.id);
      await member.roles.add(partnerRoleId);

      await interaction.reply({
        content: `✅ Đã đăng thông tin đối tác và cấp role cho ${user.tag}!`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Lỗi khi xử lý đối tác:', error);
      await interaction.reply({
        content: '❌ Đã xảy ra lỗi khi xử lý đối tác.',
        ephemeral: true
      });
    }
  },
};
