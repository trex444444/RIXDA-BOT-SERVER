const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cases')
    .setDescription('View moderation cases')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt => opt.setName('user').setDescription('User to view cases for').setRequired(false))
    .addIntegerOption(opt => opt.setName('case-id').setDescription('Specific case ID').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const caseId = interaction.options.getInteger('case-id');

    if (caseId) {
      const c = db.prepare(`SELECT * FROM moderation WHERE id=? AND guild_id=?`).get(caseId, interaction.guild.id);
      if (!c) return interaction.reply({ content: '❌ Case not found.', ephemeral: true });
      const embed = new EmbedBuilder()
        .setTitle(`Case #${c.id}`)
        .setColor(0x5865F2)
        .addFields(
          { name: '⚡ Action', value: c.action.toUpperCase(), inline: true },
          { name: '👤 User', value: `<@${c.user_id}>`, inline: true },
          { name: '🛡️ Moderator', value: `<@${c.moderator_id}>`, inline: true },
          { name: '📝 Reason', value: c.reason || 'No reason' },
          { name: '📅 Date', value: `<t:${Math.floor(new Date(c.timestamp).getTime()/1000)}:F>` }
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (target) {
      const cases = db.prepare(`SELECT * FROM moderation WHERE guild_id=? AND user_id=? ORDER BY id DESC LIMIT 15`).all(interaction.guild.id, target.id);
      if (!cases.length) return interaction.reply({ content: `📭 No cases found for ${target.tag}.`, ephemeral: true });
      const embed = new EmbedBuilder()
        .setTitle(`📋 Cases for ${target.tag}`)
        .setColor(0xFF8C00)
        .setThumbnail(target.displayAvatarURL())
        .setDescription(cases.map(c => `\`#${c.id}\` **${c.action.toUpperCase()}** by <@${c.moderator_id}> — ${c.reason || 'No reason'} — <t:${Math.floor(new Date(c.timestamp).getTime()/1000)}:R>`).join('\n'))
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    const cases = db.prepare(`SELECT * FROM moderation WHERE guild_id=? ORDER BY id DESC LIMIT 10`).all(interaction.guild.id);
    if (!cases.length) return interaction.reply({ content: '📭 No cases found.', ephemeral: true });
    const embed = new EmbedBuilder()
      .setTitle('📋 Recent Cases')
      .setColor(0x5865F2)
      .setDescription(cases.map(c => `\`#${c.id}\` **${c.action.toUpperCase()}** <@${c.user_id}> by <@${c.moderator_id}> — <t:${Math.floor(new Date(c.timestamp).getTime()/1000)}:R>`).join('\n'))
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  },
};
