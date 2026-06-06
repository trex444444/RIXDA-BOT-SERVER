const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Get a user\'s avatar')
    .addUserOption(opt => opt.setName('user').setDescription('The user').setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const embed = new EmbedBuilder()
      .setTitle(`🖼️ ${user.username}'s Avatar`)
      .setImage(user.displayAvatarURL({ size: 4096, extension: 'png' }))
      .setColor(0x5865F2)
      .addFields(
        { name: '🔗 PNG', value: `[Link](${user.displayAvatarURL({ size: 4096, extension: 'png' })})`, inline: true },
        { name: '🔗 WebP', value: `[Link](${user.displayAvatarURL({ size: 4096, extension: 'webp' })})`, inline: true },
        { name: '🔗 JPEG', value: `[Link](${user.displayAvatarURL({ size: 4096, extension: 'jpg' })})`, inline: true }
      )
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  },
};
