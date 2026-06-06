const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOrCreate, addBalance, setLastAction, formatMoney } = require('../../utils/economy');

const BEG_COOLDOWN = 60000 * 5; // 5 min

module.exports = {
  data: new SlashCommandBuilder()
    .setName('beg')
    .setDescription('Beg for some coins'),

  async execute(interaction) {
    const row = getOrCreate(interaction.user.id, interaction.guild.id);
    if (row.last_beg) {
      const diff = Date.now() - new Date(row.last_beg + ' UTC').getTime();
      if (diff < BEG_COOLDOWN) {
        const remaining = Math.ceil((BEG_COOLDOWN - diff) / 1000);
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFF4444).setDescription(`⏰ You begged too recently! Wait **${remaining}s**.`)], ephemeral: true });
      }
    }

    const success = Math.random() > 0.35;
    setLastAction(interaction.user.id, interaction.guild.id, 'last_beg');

    if (!success) {
      const fails = ['No one gave you anything 😢', 'They ignored you.', 'Someone threw a coin at you… but it bounced away!'];
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFF4444).setDescription(`🚫 ${fails[Math.floor(Math.random() * fails.length)]}`)], ephemeral: true });
    }

    const amount = Math.floor(Math.random() * 80) + 10;
    addBalance(interaction.user.id, interaction.guild.id, amount);
    const givers = ['A kind stranger', 'A wealthy merchant', 'A passing knight', 'An old wizard'];
    const giver = givers[Math.floor(Math.random() * givers.length)];
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFFD700).setDescription(`🙏 ${giver} gave you ${formatMoney(amount)}!`).setTimestamp()] });
  },
};
