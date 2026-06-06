const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('baseconvert')
    .setDescription('Convert a number between bases')
    .addStringOption(opt => opt.setName('number').setDescription('The number to convert').setRequired(true))
    .addIntegerOption(opt => opt.setName('from').setDescription('Source base (2-36)').setRequired(true).setMinValue(2).setMaxValue(36))
    .addIntegerOption(opt => opt.setName('to').setDescription('Target base (2-36)').setRequired(true).setMinValue(2).setMaxValue(36)),

  async execute(interaction) {
    const num = interaction.options.getString('number');
    const from = interaction.options.getInteger('from');
    const to = interaction.options.getInteger('to');

    try {
      const decimal = parseInt(num, from);
      if (isNaN(decimal)) return interaction.reply({ content: `❌ \`${num}\` is not a valid base-${from} number.`, ephemeral: true });
      const result = decimal.toString(to).toUpperCase();

      const embed = new EmbedBuilder()
        .setTitle('🔢 Base Converter')
        .setColor(0x5865F2)
        .addFields(
          { name: `Base ${from} Input`, value: `\`${num.toUpperCase()}\``, inline: true },
          { name: `Base ${to} Output`, value: `\`${result}\``, inline: true },
          { name: 'Decimal (Base 10)', value: `\`${decimal}\``, inline: true }
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    } catch (err) {
      return interaction.reply({ content: `❌ Conversion error: ${err.message}`, ephemeral: true });
    }
  },
};
