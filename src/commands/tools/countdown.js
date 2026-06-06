const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('countdown')
    .setDescription('Create or check a countdown')
    .addSubcommand(sub => sub
      .setName('create')
      .setDescription('Create a new countdown')
      .addStringOption(opt => opt.setName('event').setDescription('Event name').setRequired(true))
      .addStringOption(opt => opt.setName('date').setDescription('Date (YYYY-MM-DD HH:MM in UTC)').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('list')
      .setDescription('List active countdowns')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'create') {
      const event = interaction.options.getString('event');
      const dateStr = interaction.options.getString('date');
      const date = new Date(dateStr + ':00Z');

      if (isNaN(date.getTime())) return interaction.reply({ content: '❌ Invalid date format. Use `YYYY-MM-DD HH:MM`', ephemeral: true });
      if (date < new Date()) return interaction.reply({ content: '❌ That date is in the past!', ephemeral: true });

      db.prepare(`INSERT INTO countdowns (guild_id, channel_id, event_name, end_time) VALUES (?,?,?,?)`)
        .run(interaction.guild.id, interaction.channel.id, event, date.toISOString());

      const embed = new EmbedBuilder()
        .setTitle('⏰ Countdown Created')
        .setColor(0x5865F2)
        .addFields(
          { name: '🎯 Event', value: event },
          { name: '📅 Date', value: `<t:${Math.floor(date.getTime()/1000)}:F>` },
          { name: '⏳ Remaining', value: `<t:${Math.floor(date.getTime()/1000)}:R>` }
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'list') {
      const now = new Date().toISOString();
      const rows = db.prepare(`SELECT * FROM countdowns WHERE guild_id=? AND end_time > ? ORDER BY end_time ASC LIMIT 10`).all(interaction.guild.id, now);
      if (!rows.length) return interaction.reply({ content: '📭 No active countdowns.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle('⏰ Active Countdowns')
        .setColor(0x5865F2)
        .setDescription(rows.map(r => {
          const ts = Math.floor(new Date(r.end_time).getTime()/1000);
          return `**${r.event_name}** — <t:${ts}:F> (<t:${ts}:R>)`;
        }).join('\n'))
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
  },
};
