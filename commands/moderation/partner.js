const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('partner')
    .setDescription('Tạo thông tin đối tác và cấp quyền')
    .addUserOption(option =>
      option.setName('đại_diện')
        .setDescription('Người đại diện cho đối tác')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('link')
        .setDescription('Link mời đến server đối tác')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles), // Chỉ staff dùng

  async execute(interaction) {
    const user = interaction.options.getUser('đại_diện');
    const link = interaction.options.getString('link');
    const guild = interaction.guild;

    const partnerChannelId = '1367120844878254202';
    const partnerRoleId = '1367120701869260941';

    // Lấy avatar của server đối tác
    const serverAvatar = guild.iconURL({ dynamic: true, size: 1024 }) || 'https://example.com/default-avatar.png';

    const embed = new EmbedBuilder()
      .setTitle(`🤝 Đại diện: ${user.tag}`)
      .setColor(0x00AEFF)
      .addFields(
        { name: 'Đại diện', value: `@${user.tag}`, inline: false },
        { name: 'Server', value: `<a:RL_arrow:1367510296020783184> ${link}`, inline: false }
      )
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setImage(serverAvatar)  // Thêm avatar của server đối tác
      .setFooter({ 
        text: `Lệnh được thực hiện bởi ${interaction.user.tag} | Thời gian: ${new Date().toLocaleString()}`, 
        iconURL: interaction.user.displayAvatarURL() 
      })
      .setTimestamp();

    try {
      const channel = guild.channels.cache.get(partnerChannelId);
      if (!channel) return interaction.reply({ content: 'Không tìm thấy kênh đối tác!', ephemeral: true });
      await channel.send({ embeds: [embed] });

      const member = await guild.members.fetch(user.id);
      await member.roles.add(partnerRoleId);

      await interaction.reply({ content: `Đã đăng thông tin đối tác và cấp role cho ${user.tag}!`, ephemeral: true });
    } catch (error) {
      console.error('Lỗi khi xử lý đối tác:', error);
      await interaction.reply({ content: 'Đã xảy ra lỗi khi xử lý đối tác.', ephemeral: true });
    }
  },
};
