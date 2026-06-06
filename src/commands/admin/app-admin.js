const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('app-admin')
    .setDescription('Manage applications for your community')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => sub
      .setName('setup')
      .setDescription('Configure the application system')
      .addChannelOption(opt => opt.setName('review-channel').setDescription('Channel where applications are sent').setRequired(true))
      .addStringOption(opt => opt.setName('questions').setDescription('Questions separated by | (max 5)').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('dashboard')
      .setDescription('View application statistics')
    )
    .addSubcommand(sub => sub
      .setName('list')
      .setDescription('List all pending applications')
    )
    .addSubcommand(sub => sub
      .setName('review')
      .setDescription('Review a specific application')
      .addIntegerOption(opt => opt.setName('id').setDescription('Application ID').setRequired(true))
      .addStringOption(opt => opt.setName('action').setDescription('Approve or deny').setRequired(true).addChoices(
        { name: 'Approve', value: 'approved' },
        { name: 'Deny', value: 'denied' }
      ))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const channel = interaction.options.getChannel('review-channel');
      const questionsRaw = interaction.options.getString('questions');
      const questions = questionsRaw.split('|').map(q => q.trim()).slice(0, 5);

      db.prepare(`INSERT OR REPLACE INTO app_config (guild_id, review_channel_id, questions) VALUES (?,?,?)`)
        .run(interaction.guild.id, channel.id, JSON.stringify(questions));

      const embed = new EmbedBuilder()
        .setTitle('✅ Application System Configured')
        .setColor(0x00FF7F)
        .addFields(
          { name: '📋 Review Channel', value: `<#${channel.id}>` },
          { name: '❓ Questions', value: questions.map((q, i) => `**${i + 1}.** ${q}`).join('\n') }
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'dashboard') {
      const total = db.prepare(`SELECT COUNT(*) as c FROM applications WHERE guild_id=?`).get(interaction.guild.id);
      const pending = db.prepare(`SELECT COUNT(*) as c FROM applications WHERE guild_id=? AND status='pending'`).get(interaction.guild.id);
      const approved = db.prepare(`SELECT COUNT(*) as c FROM applications WHERE guild_id=? AND status='approved'`).get(interaction.guild.id);
      const denied = db.prepare(`SELECT COUNT(*) as c FROM applications WHERE guild_id=? AND status='denied'`).get(interaction.guild.id);

      const embed = new EmbedBuilder()
        .setTitle('📊 Application Dashboard')
        .setColor(0x5865F2)
        .addFields(
          { name: '📝 Total', value: `${total.c}`, inline: true },
          { name: '⏳ Pending', value: `${pending.c}`, inline: true },
          { name: '✅ Approved', value: `${approved.c}`, inline: true },
          { name: '❌ Denied', value: `${denied.c}`, inline: true }
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'list') {
      const apps = db.prepare(`SELECT * FROM applications WHERE guild_id=? AND status='pending' ORDER BY id DESC LIMIT 10`).all(interaction.guild.id);
      if (!apps.length) return interaction.reply({ content: '📭 No pending applications.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle('📋 Pending Applications')
        .setColor(0xFFA500)
        .setDescription(apps.map(a => `**#${a.id}** — <@${a.user_id}> — \`${a.position}\` — <t:${Math.floor(new Date(a.submitted_at).getTime()/1000)}:R>`).join('\n'))
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'review') {
      const id = interaction.options.getInteger('id');
      const action = interaction.options.getString('action');
      const app = db.prepare(`SELECT * FROM applications WHERE id=? AND guild_id=?`).get(id, interaction.guild.id);
      if (!app) return interaction.reply({ content: '❌ Application not found.', ephemeral: true });

      db.prepare(`UPDATE applications SET status=?, reviewed_by=?, reviewed_at=datetime('now') WHERE id=?`)
        .run(action, interaction.user.id, id);

      const answers = JSON.parse(app.answers);
      const config = db.prepare(`SELECT * FROM app_config WHERE guild_id=?`).get(interaction.guild.id);
      const questions = config ? JSON.parse(config.questions) : [];

      const embed = new EmbedBuilder()
        .setTitle(`${action === 'approved' ? '✅ Approved' : '❌ Denied'} — Application #${id}`)
        .setColor(action === 'approved' ? 0x00FF7F : 0xFF4444)
        .addFields(
          { name: '👤 Applicant', value: `<@${app.user_id}>`, inline: true },
          { name: '📌 Position', value: app.position, inline: true },
          { name: '🛡️ Reviewed by', value: `<@${interaction.user.id}>`, inline: true },
          ...questions.slice(0, 5).map((q, i) => ({ name: `Q${i+1}: ${q}`, value: answers[i] || 'No answer' }))
        )
        .setTimestamp();

      // DM the applicant
      try {
        const member = await interaction.guild.members.fetch(app.user_id);
        await member.send({ embeds: [new EmbedBuilder()
          .setTitle(`Your application was ${action}`)
          .setColor(action === 'approved' ? 0x00FF7F : 0xFF4444)
          .setDescription(`Your application for **${app.position}** in **${interaction.guild.name}** was **${action}** by a moderator.`)
          .setTimestamp()
        ]}).catch(() => {});
      } catch {}

      return interaction.reply({ embeds: [embed] });
    }
  },
};
