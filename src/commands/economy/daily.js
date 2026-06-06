const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOrCreate, addBalance, setLastAction, formatMoney } = require('../../utils/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily coins reward'),

  async execute(interaction) {
    const row = getOrCreate(interaction.user.id, interaction.guild.id);
    if (row.last_daily) {
      const last = new Date(row.last_daily + ' UTC');
      const diff = Date.now() - last.getTime();
      const cooldown = 86400000;
      if (diff < cooldown) {
        const remaining = cooldown - diff;
        const hrs = Math.floor(remaining / 3600000);
        const mins = Math.floor((remaining % 3600000) / 60000);
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0xFF4444).setDescription(`⏰ Come back in **${hrs}h ${mins}m** for your daily reward!`)],
          ephemeral: true
        });
      }
    }
    const reward = Math.floor(Math.random() * 500) + 200;
    addBalance(interaction.user.id, interaction.guild.id, reward);
    setLastAction(interaction.user.id, interaction.guild.id, 'last_daily');
    const embed = new EmbedBuilder()
      .setTitle('📅 Daily Reward!')
      .setDescription(`You claimed ${formatMoney(reward)}!`)
      .setColor(0x00FF7F)
      .setFooter({ text: 'Come back in 24 hours for more!' })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  },
};
