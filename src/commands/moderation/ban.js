const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt => opt.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for ban').setRequired(false))
    .addIntegerOption(opt => opt.setName('delete-days').setDescription('Days of messages to delete (0-7)').setMinValue(0).setMaxValue(7).setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply();
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete-days') ?? 0;

    if (target.id === interaction.user.id) return interaction.editReply({ content: '❌ You cannot ban yourself.' });
    if (target.id === interaction.client.user.id) return interaction.editReply({ content: '❌ I cannot ban myself.' });

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (member) {
      if (!member.bannable) return interaction.editReply({ content: '❌ I cannot ban this user (higher role or owner).' });
      if (member.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.editReply({ content: '❌ You cannot ban someone with an equal or higher role.' });
      }
    }

    try {
      await target.send({ embeds: [new EmbedBuilder()
        .setTitle(`You were banned from ${interaction.guild.name}`)
        .setColor(0xFF4444)
        .addFields({ name: '📝 Reason', value: reason })
        .setTimestamp()
      ]}).catch(() => {});

      await interaction.guild.bans.create(target.id, { reason, deleteMessageDays: deleteDays });

      db.prepare(`INSERT INTO moderation (guild_id, user_id, moderator_id, action, reason) VALUES (?,?,?,?,?)`)
        .run(interaction.guild.id, target.id, interaction.user.id, 'ban', reason);

      const embed = new EmbedBuilder()
        .setTitle('🔨 User Banned')
        .setColor(0xFF4444)
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: '👤 User', value: `${target.tag} (${target.id})`, inline: true },
          { name: '🛡️ Moderator', value: interaction.user.tag, inline: true },
          { name: '📝 Reason', value: reason }
        )
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      return interaction.editReply({ content: `❌ Failed to ban: ${err.message}` });
    }
  },
};
