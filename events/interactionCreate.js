const fs = require('fs');
const path = require('path');
const { categories } = require('../config.json');
const lang = require('./loadLanguage');
const client = require('../main');

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const VerificationConfig = require('../models/gateVerification/verificationConfig');
const verificationCodes = new Map();
const SuggestionVote = require('../models/suggestions/SuggestionVote');
const truths = require('../data/truthordare/truth.json');
const dares = require('../data/truthordare/dare.json');
const DisabledCommand = require('../models/commands/DisabledCommands');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // BUTTON HANDLERS
    if (interaction.isButton()) {
      const { customId, user } = interaction;

      // Verification
      if (customId === 'verify_button') {
        const code = Math.random().toString(36).slice(2, 8).toUpperCase();
        verificationCodes.set(user.id, code);

        const modal = new ModalBuilder()
          .setCustomId('verify_modal')
          .setTitle('Verification')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('verify_input')
                .setLabel(`Enter this code: ${code}`)
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            )
          );

        return interaction.showModal(modal);
      }

      // Truth or Dare
      if (customId.startsWith('tod_')) {
        await interaction.deferUpdate();

        let result;
        if (customId === 'tod_truth') {
          result = `🧠 **Truth:** ${truths[Math.floor(Math.random() * truths.length)]}`;
        } else if (customId === 'tod_dare') {
          result = `🔥 **Dare:** ${dares[Math.floor(Math.random() * dares.length)]}`;
        } else {
          const pool = Math.random() < 0.5 ? truths : dares;
          const label = pool === truths ? '🧠 **Truth:**' : '🔥 **Dare:**';
          result = `${label} ${pool[Math.floor(Math.random() * pool.length)]}`;
        }

        const embed = new EmbedBuilder()
          .setTitle('🎲 Your Truth or Dare!')
          .setDescription(result)
          .setColor('#00ccff')
          .setFooter({ text: `${user.username} picked this`, iconURL: user.displayAvatarURL() })
          .setTimestamp();

        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('tod_truth').setLabel('Truth 🧠').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('tod_dare').setLabel('Dare 🔥').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('tod_random').setLabel('Random 🎲').setStyle(ButtonStyle.Secondary)
        );

        return interaction.channel.send({ embeds: [embed], components: [buttons] });
      }

      // Suggestion vote
      if (['suggestion_yes', 'suggestion_no'].includes(customId)) {
        const messageId = interaction.message.id;
        const voteType = customId === 'suggestion_yes' ? 'yes' : 'no';

        try {
          await SuggestionVote.findOneAndUpdate(
            { messageId, userId: user.id },
            { vote: voteType, votedAt: new Date() },
            { upsert: true }
          );

          const allVotes = await SuggestionVote.find({ messageId });
          const yesVotes = allVotes.filter(v => v.vote === 'yes').length;
          const noVotes = allVotes.filter(v => v.vote === 'no').length;

          const embed = EmbedBuilder.from(interaction.message.embeds[0])
            .setFields(
              { name: 'Submitted by', value: interaction.message.embeds[0].fields[0].value, inline: true },
              { name: '👍 Yes Votes', value: `${yesVotes}`, inline: true },
              { name: '👎 No Votes', value: `${noVotes}`, inline: true }
            );

          return interaction.update({ embeds: [embed] });
        } catch (err) {
          console.error('❌ Suggestion vote error:', err);
          return interaction.reply({ content: '⚠️ Could not register your vote.', ephemeral: true });
        }
      }

      // Ticket buttons
      if (customId === 'mua_hang' || customId === 'bao_hanh' || customId === 'lien_he') {
        const modal = new ModalBuilder().setTitle('Ticket').setCustomId(`form_${customId}`);
        const inputs = [];

        if (customId === 'mua_hang') {
          inputs.push(
            new TextInputBuilder().setCustomId('muagi').setLabel('Bạn muốn mua gì?').setStyle(TextInputStyle.Paragraph).setRequired(true),
            new TextInputBuilder().setCustomId('thanhtoan').setLabel('Thanh toán bằng gì?').setStyle(TextInputStyle.Short).setRequired(true)
          );
        } else if (customId === 'bao_hanh') {
          inputs.push(
            new TextInputBuilder().setCustomId('damua').setLabel('Sản phẩm cần bảo hành?').setStyle(TextInputStyle.Paragraph).setRequired(true)
          );
        } else {
          inputs.push(
            new TextInputBuilder().setCustomId('noidung').setLabel('Bạn cần gì?').setStyle(TextInputStyle.Paragraph).setRequired(true)
          );
        }

        const rows = inputs.map(input => new ActionRowBuilder().addComponents(input));
        modal.addComponents(...rows);
        return interaction.showModal(modal);
      }
    }

    // MODAL HANDLERS
    if (interaction.isModalSubmit()) {
      const { customId } = interaction;

      if (customId === 'verify_modal') {
        const input = interaction.fields.getTextInputValue('verify_input');
        const code = verificationCodes.get(interaction.user.id);
        if (!code) return interaction.reply({ content: 'Verification expired!', ephemeral: true });

        if (input !== code) return interaction.reply({ content: 'Wrong code!', ephemeral: true });

        const config = await VerificationConfig.findOne({ guildId: interaction.guild.id });
        const member = interaction.guild.members.cache.get(interaction.user.id);
        if (!config || !member) return;

        const unverified = interaction.guild.roles.cache.get(config.unverifiedRoleId);
        const verified = interaction.guild.roles.cache.get(config.verifiedRoleId);
        if (!verified) return interaction.reply({ content: 'Verified role not found.', ephemeral: true });

        if (unverified) await member.roles.remove(unverified);
        await member.roles.add(verified);
        verificationCodes.delete(interaction.user.id);

        await interaction.reply({ content: '✅ Verified successfully!', ephemeral: true });
        await member.send('🎉 Bạn đã được xác minh và có quyền truy cập server.');
      }

      // Ticket forms
      else if (customId === 'form_mua_hang') {
        const mua = interaction.fields.getTextInputValue('muagi');
        const tt = interaction.fields.getTextInputValue('thanhtoan');
        return interaction.reply({ content: `**Ticket Mua Hàng:**\nSản phẩm: ${mua}\nThanh toán: ${tt}`, ephemeral: true });

      } else if (customId === 'form_bao_hanh') {
        const sp = interaction.fields.getTextInputValue('damua');
        return interaction.reply({ content: `**Ticket Bảo hành:**\nSản phẩm: ${sp}`, ephemeral: true });

      } else if (customId === 'form_lien_he') {
        const msg = interaction.fields.getTextInputValue('noidung');
        return interaction.reply({ content: `**Ticket Liên hệ:**\nNội dung: ${msg}`, ephemeral: true });
      }
    }

    // SELECT MENU
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'shop_select') {
        let embed;

        switch (interaction.values[0]) {
          case 'spotify':
            embed = new EmbedBuilder()
              .setTitle('Spotify Premium')
              .setDescription('1 tháng: 200k\n2 tháng: 400k\n3 tháng: 600k\nThanh toán: PayPal, Swish, Thẻ cào')
              .setColor(0x1DB954);
            break;

          case 'netflix':
            embed = new EmbedBuilder()
              .setTitle('Netflix Premium')
              .setDescription('1 tháng: 250k\n3 tháng: 700k\nThanh toán: PayPal, Swish, Thẻ cào')
              .setColor(0xe50914);
            break;

          case 'garena':
            embed = new EmbedBuilder()
              .setTitle('Thẻ Garena')
              .setDescription('20k = 16kr\n50k = 35kr\nMua tại [ticket](https://discord.com/channels/YOUR_GUILD_ID/1367671205926146122)')
              .setColor(0xe67e22);
            break;
        }

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }

    // SLASH COMMAND HANDLER
    if (!interaction.isCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const sub = interaction.options.getSubcommand(false);
    const isDisabled = await DisabledCommand.findOne({
      guildId: interaction.guild.id,
      commandName: interaction.commandName,
      ...(sub ? { subcommandName: sub } : {})
    });

    if (isDisabled || !categories[command.category || 'undefined']) {
      return interaction.reply({ content: lang.commandDisabled, ephemeral: true }).catch(() => {});
    }

    try {
      await command.execute(interaction, client);
    } catch (error) {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: lang.error, ephemeral: true }).catch(() => {});
      }
      console.error(error);
    }
  }
};

// Load commands
const commandsPath = path.join(__dirname, '../commands');
const commandFiles = fs.readdirSync(commandsPath).reduce((files, folder) => {
  const folderPath = path.join(commandsPath, folder);
  fs.readdirSync(folderPath).forEach(file => {
    if (file.endsWith('.js')) {
      const command = require(path.join(folderPath, file));
      command.category = folder;
      files.set(command.name, command);
    }
  });
  return files;
}, new Map());

client.commands = commandFiles;
