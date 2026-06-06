const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('apply')
    .setDescription('Application system')
    .addSubcommand(sub => sub
      .setName('submit')
      .setDescription('Submit an application')
      .addStringOption(opt => opt.setName('position').setDescription('Position you are applying for').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('status')
      .setDescription('Check your application status')
    )
    .addSubcommand(sub => sub
      .setName('list')
      .setDescription('List your submitted applications')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'submit') {
      const position = interaction.options.getString('position');
      const config = db.prepare(`SELECT * FROM app_config WHERE guild_id=?`).get(interaction.guild.id);
      if (!config) return interaction.reply({ content: '❌ Applications are not set up in this server. Ask an admin to run `/app-admin setup`.', ephemeral: true });

      const questions = JSON.parse(config.questions);
      if (!questions.length) return interaction.reply({ content: '❌ No questions configured.', ephemeral: true });

      const modal = new ModalBuilder()
        .setCustomId(`apply_modal_${position}`)
        .setTitle(`Apply for ${position}`);

      questions.slice(0, 5).forEach((q, i) => {
        modal.addComponents(new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(`answer_${i}`)
            .setLabel(q.substring(0, 45))
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(500)
        ));
      });

      await interaction.showModal(modal);

      const submitted = await interaction.awaitModalSubmit({ time: 300_000 }).catch(() => null);
      if (!submitted) return;

      const answers = questions.map((_, i) => submitted.fields.getTextInputValue(`answer_${i}`) || '');

      db.prepare(`INSERT INTO applications (guild_id, user_id, position, answers) VALUES (?,?,?,?)`)
        .run(interaction.guild.id, interaction.user.id, position, JSON.stringify(answers));

      const appRow = db.prepare(`SELECT last_insert_rowid() as id`).get();

      // Send to review channel
      const reviewEmbed = new EmbedBuilder()
        .setTitle(`📋 New Application #${appRow.id}`)
        .setColor(0xFFA500)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: '👤 Applicant', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
          { name: '📌 Position', value: position, inline: true },
          ...questions.map((q, i) => ({ name: `❓ ${q}`, value: answers[i] || 'No answer' }))
        )
        .setFooter({ text: `Application ID: ${appRow.id}` })
        .setTimestamp();

      try {
        const reviewChan = await interaction.guild.channels.fetch(config.review_channel_id);
        await reviewChan.send({ embeds: [reviewEmbed] });
      } catch {}

      return submitted.reply({ content: `✅ Application submitted! Your application ID is **#${appRow.id}**.`, ephemeral: true });
    }

    if (sub === 'status') {
      const app = db.prepare(`SELECT * FROM applications WHERE guild_id=? AND user_id=? ORDER BY id DESC LIMIT 1`)
        .get(interaction.guild.id, interaction.user.id);
      if (!app) return interaction.reply({ content: '📭 You have no applications in this server.', ephemeral: true });

      const statusColors = { pending: 0xFFA500, approved: 0x00FF7F, denied: 0xFF4444 };
      const embed = new EmbedBuilder()
        .setTitle(`Application #${app.id} Status`)
        .setColor(statusColors[app.status] || 0x5865F2)
        .addFields(
          { name: '📌 Position', value: app.position, inline: true },
          { name: '📊 Status', value: app.status.toUpperCase(), inline: true },
          { name: '📅 Submitted', value: `<t:${Math.floor(new Date(app.submitted_at).getTime()/1000)}:R>`, inline: true }
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'list') {
      const apps = db.prepare(`SELECT * FROM applications WHERE guild_id=? AND user_id=? ORDER BY id DESC LIMIT 10`)
        .all(interaction.guild.id, interaction.user.id);
      if (!apps.length) return interaction.reply({ content: '📭 You have no applications.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle('📋 Your Applications')
        .setColor(0x5865F2)
        .setDescription(apps.map(a => `**#${a.id}** — \`${a.position}\` — **${a.status.toUpperCase()}** — <t:${Math.floor(new Date(a.submitted_at).getTime()/1000)}:R>`).join('\n'))
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
