const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bug')
    .setDescription('Report a bug to the bot developers'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('bug_report_modal')
      .setTitle('🐛 Bug Report');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('bug_title')
          .setLabel('Bug Title')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100)
          .setPlaceholder('Short description of the bug')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('bug_description')
          .setLabel('Description')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000)
          .setPlaceholder('Describe what happened, what you expected, and how to reproduce it')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('bug_steps')
          .setLabel('Steps to Reproduce')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(500)
          .setPlaceholder('1. Did this\n2. Then this\n3. Bug happened')
      )
    );

    await interaction.showModal(modal);

    const submitted = await interaction.awaitModalSubmit({ time: 300_000 }).catch(() => null);
    if (!submitted) return;

    const title = submitted.fields.getTextInputValue('bug_title');
    const desc = submitted.fields.getTextInputValue('bug_description');
    const steps = submitted.fields.getTextInputValue('bug_steps') || 'Not provided';

    const embed = new EmbedBuilder()
      .setTitle(`🐛 Bug Report: ${title}`)
      .setColor(0xFF4444)
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { name: '👤 Reporter', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
        { name: '🏠 Server', value: interaction.guild.name, inline: true },
        { name: '📝 Description', value: desc },
        { name: '🔁 Steps to Reproduce', value: steps }
      )
      .setTimestamp();

    await submitted.reply({ content: '✅ Bug report submitted! Thank you for helping improve the bot.', ephemeral: true });
  },
};
