const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Close the current ticket')
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for closing').setRequired(false)),

  async execute(interaction) {
    const ticket = db.prepare(`SELECT * FROM tickets WHERE channel_id=? AND status='open'`).get(interaction.channel.id);
    if (!ticket) return interaction.reply({ content: '❌ This is not an open ticket channel.', ephemeral: true });

    const isOwner = ticket.user_id === interaction.user.id;
    const isStaff = interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);
    if (!isOwner && !isStaff) return interaction.reply({ content: '❌ Only the ticket owner or staff can close this.', ephemeral: true });

    const reason = interaction.options.getString('reason') || 'No reason provided';
    db.prepare(`UPDATE tickets SET status='closed', closed_at=datetime('now') WHERE id=?`).run(ticket.id);

    const embed = new EmbedBuilder()
      .setTitle('🔒 Ticket Closed')
      .setColor(0xFF4444)
      .addFields(
        { name: '👤 Closed by', value: interaction.user.tag, inline: true },
        { name: '📝 Reason', value: reason }
      )
      .setFooter({ text: 'Channel will be deleted in 5 seconds.' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    setTimeout(async () => {
      await interaction.channel.delete().catch(() => {});
    }, 5000);
  },
};
