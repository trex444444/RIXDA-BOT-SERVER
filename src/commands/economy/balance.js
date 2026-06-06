const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBalance, formatMoney } = require('../../utils/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your or another user\'s balance')
    .addUserOption(opt => opt.setName('user').setDescription('User to check').setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const bal = getBalance(user.id, interaction.guild.id);
    const embed = new EmbedBuilder()
      .setTitle(`💳 ${user.username}'s Balance`)
      .setDescription(formatMoney(bal))
      .setColor(0xFFD700)
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  },
};
