const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOrCreate, addBalance, setLastAction, getBalance, formatMoney } = require('../../utils/economy');

const COOLDOWN = 60000 * 30;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('crime')
    .setDescription('Commit a crime for coins (risky!)'),

  async execute(interaction) {
    const row = getOrCreate(interaction.user.id, interaction.guild.id);
    if (row.last_crime) {
      const diff = Date.now() - new Date(row.last_crime + ' UTC').getTime();
      if (diff < COOLDOWN) {
        const remaining = Math.ceil((COOLDOWN - diff) / 60000);
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFF4444).setDescription(`⏰ You need to lay low for **${remaining} more minutes**.`)], ephemeral: true });
      }
    }

    setLastAction(interaction.user.id, interaction.guild.id, 'last_crime');
    const success = Math.random() > 0.45;

    if (success) {
      const gain = Math.floor(Math.random() * 800) + 200;
      addBalance(interaction.user.id, interaction.guild.id, gain);
      const crimes = ['robbed a bank vault', 'hacked a corporate server', 'sold counterfeit goods', 'stole a rare artifact'];
      const crime = crimes[Math.floor(Math.random() * crimes.length)];
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle('🦹 Crime Successful!').setColor(0x00FF7F).setDescription(`You ${crime} and got away with ${formatMoney(gain)}!`).setTimestamp()] });
    } else {
      const fine = Math.floor(Math.random() * 300) + 100;
      const bal = getBalance(interaction.user.id, interaction.guild.id);
      const actualFine = Math.min(fine, bal);
      addBalance(interaction.user.id, interaction.guild.id, -actualFine);
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle('🚔 Caught!').setColor(0xFF4444).setDescription(`You were caught and fined ${formatMoney(actualFine)}!`).setTimestamp()] });
    }
  },
};
