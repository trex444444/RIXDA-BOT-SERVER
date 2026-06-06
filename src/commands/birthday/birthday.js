const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('birthday')
    .setDescription('Birthday system')
    .addSubcommand(sub => sub
      .setName('set')
      .setDescription('Set your birthday')
      .addStringOption(opt => opt.setName('date').setDescription('Your birthday (MM-DD or YYYY-MM-DD)').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('info')
      .setDescription('View a user\'s birthday')
      .addUserOption(opt => opt.setName('user').setDescription('User to check').setRequired(false))
    )
    .addSubcommand(sub => sub
      .setName('list')
      .setDescription('List upcoming birthdays')
    )
    .addSubcommand(sub => sub
      .setName('next')
      .setDescription('See who has the next birthday')
    )
    .addSubcommand(sub => sub
      .setName('remove')
      .setDescription('Remove your birthday')
    )
    .addSubcommand(sub => sub
      .setName('setchannel')
      .setDescription('Set the birthday announcement channel')
      .addChannelOption(opt => opt.setName('channel').setDescription('Channel for birthday announcements').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const dateStr = interaction.options.getString('date');
      const match = dateStr.match(/^(\d{4}-)?(\d{2}-\d{2})$/);
      if (!match) return interaction.reply({ content: '❌ Invalid format. Use `MM-DD` or `YYYY-MM-DD`.', ephemeral: true });
      const formatted = match[1] ? dateStr : `2000-${dateStr}`;

      db.prepare(`INSERT OR REPLACE INTO birthdays (user_id, guild_id, birthday) VALUES (?,?,?)`).run(interaction.user.id, interaction.guild.id, formatted);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFFD700).setDescription(`🎂 Birthday set to **${dateStr}**!`)], ephemeral: true });
    }

    if (sub === 'info') {
      const user = interaction.options.getUser('user') || interaction.user;
      const row = db.prepare(`SELECT * FROM birthdays WHERE user_id=? AND guild_id=?`).get(user.id, interaction.guild.id);
      if (!row) return interaction.reply({ content: `📭 ${user.tag} hasn't set their birthday.`, ephemeral: true });
      const parts = row.birthday.split('-');
      const display = parts.length === 3 ? `${parts[1]}/${parts[2]}` : row.birthday;
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFFD700).setDescription(`🎂 **${user.username}'s** birthday is **${display}**`)] });
    }

    if (sub === 'list') {
      const rows = db.prepare(`SELECT * FROM birthdays WHERE guild_id=? ORDER BY birthday`).all(interaction.guild.id);
      if (!rows.length) return interaction.reply({ content: '📭 No birthdays set.', ephemeral: true });
      const embed = new EmbedBuilder()
        .setTitle('🎂 Birthday List')
        .setColor(0xFFD700)
        .setDescription(rows.map(r => {
          const p = r.birthday.split('-');
          return `<@${r.user_id}> — **${p[1]}/${p[2]}**`;
        }).join('\n'))
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'next') {
      const now = new Date();
      const rows = db.prepare(`SELECT * FROM birthdays WHERE guild_id=?`).all(interaction.guild.id);
      if (!rows.length) return interaction.reply({ content: '📭 No birthdays set.', ephemeral: true });

      const withDays = rows.map(r => {
        const parts = r.birthday.split('-');
        const month = parseInt(parts[parts.length - 2]) - 1;
        const day = parseInt(parts[parts.length - 1]);
        let next = new Date(now.getFullYear(), month, day);
        if (next < now) next.setFullYear(now.getFullYear() + 1);
        return { ...r, next, diff: next - now };
      }).sort((a, b) => a.diff - b.diff);

      const top = withDays.slice(0, 5);
      const embed = new EmbedBuilder()
        .setTitle('🎉 Upcoming Birthdays')
        .setColor(0xFFD700)
        .setDescription(top.map(r => {
          const p = r.birthday.split('-');
          return `<@${r.user_id}> — **${p[p.length-2]}/${p[p.length-1]}** — <t:${Math.floor(r.next.getTime()/1000)}:R>`;
        }).join('\n'))
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'remove') {
      const result = db.prepare(`DELETE FROM birthdays WHERE user_id=? AND guild_id=?`).run(interaction.user.id, interaction.guild.id);
      if (!result.changes) return interaction.reply({ content: '❌ You have no birthday set.', ephemeral: true });
      return interaction.reply({ content: '✅ Your birthday has been removed.', ephemeral: true });
    }

    if (sub === 'setchannel') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ You need Manage Server permission.', ephemeral: true });
      }
      const channel = interaction.options.getChannel('channel');
      db.prepare(`INSERT OR REPLACE INTO birthday_channels (guild_id, channel_id) VALUES (?,?)`).run(interaction.guild.id, channel.id);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00FF7F).setDescription(`✅ Birthday announcements will be sent to <#${channel.id}>!`)] });
    }
  },
};
