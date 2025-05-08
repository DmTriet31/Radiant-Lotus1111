const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

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

    // Tạo embed chứa thông tin đối tác
    const embed = new EmbedBuilder()
      .setColor(0x00AEFF)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setImage(serverBanner)
      .setDescription(`**Đại diện:** ${user}\n**Link:** [Bấm vào đây để join](${link})`)
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

      // Tạo nút tham gia với link
      const joinButton = new ButtonBuilder()
        .setLabel('Bấm vào đây để join')
        .setStyle(5) // Tạo nút liên kết
        .setURL(link);

      // Tạo ActionRow chứa nút
      const actionRow = new ActionRowBuilder().addComponents(joinButton);

      // Gửi tin nhắn: link nằm ngoài embed → có JOIN button
      await channel.send({
        content: `Đối tác mới: ${user.tag}`, // Gửi thông tin người đại diện
        embeds: [embed],
        components: [actionRow] // Thêm nút tham gia
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
