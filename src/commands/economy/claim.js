const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { addBalance, formatMoney } = require('../../utils/economy');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Claim a special reward code')
    .addStringOption(opt => opt.setName('code').setDescription('Reward code').setRequired(true)),

  async execute(interaction) {
    const code = interaction.options.getString('code').toUpperCase();
    // Simple demo codes
    const codes = {
      'WELCOME100': 100,
      'BONUS500': 500,
      'DISCORD2024': 250,
    };

    if (!codes[code]) {
      return interaction.reply({ content: '❌ Invalid or expired reward code.', ephemeral: true });
    }

    // Check if already claimed (store in DB as a special inventory item)
    const claimed = db.prepare(`SELECT * FROM inventory WHERE user_id=? AND guild_id=? AND item_name=?`).get(interaction.user.id, interaction.guild.id, `CLAIM_${code}`);
    if (claimed) return interaction.reply({ content: '❌ You already claimed this code!', ephemeral: true });

    addBalance(interaction.user.id, interaction.guild.id, codes[code]);
    db.prepare(`INSERT INTO inventory (user_id, guild_id, item_name, quantity) VALUES (?,?,?,1)`).run(interaction.user.id, interaction.guild.id, `CLAIM_${code}`);

    return interaction.reply({ embeds: [new EmbedBuilder()
      .setTitle('🎁 Code Claimed!')
      .setColor(0xFFD700)
      .setDescription(`You received ${formatMoney(codes[code])}!`)
      .setTimestamp()
    ], ephemeral: true });
  },
};
