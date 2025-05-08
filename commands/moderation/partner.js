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

    const partnerRoleId = '1367120701869260941';   // Role cấp cho đại diện

    // Lấy banner hoặc icon server (ảnh nền embed) từ link (mặc định là một banner từ server bạn)
    const serverBanner = 'https://i.imgur.com/Z8e2Trs.png'; // Placeholder banner URL

    // Tạo embed chứa thông tin đối tác
    const embed = new EmbedBuilder()
      .setColor(0x00AEFF)
      .setThumbnail(user.displayAvatarURL({ dynamic: true })) // Avatar của người đại diện
      .setImage(serverBanner) // Banner của server đối tác
      .setDescription(`**Đại diện:** ${user}\n**Link:** [Bấm vào đây để join](${link})`)
      .setFooter({
        text: `Đại diện bên mình: ${interaction.user.tag} | ${new Date().toLocaleString()}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    try {
      const channel = guild.channels.cache.get('1367120844878254202'); // ID kênh gửi đối tác
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

      // Gửi tin nhắn chỉ với embed (bao gồm thông tin người đại diện và banner server đối tác)
      await channel.send({
        embeds: [embed],
        components: [actionRow] // Thêm nút tham gia
      });

      // Cấp quyền cho người đại diện
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
