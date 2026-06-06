const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const { getBalance, addBalance, formatMoney } = require('../../utils/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Buy an item from the shop')
    .addStringOption(opt => opt.setName('item').setDescription('Item name to buy').setRequired(true))
    .addIntegerOption(opt => opt.setName('quantity').setDescription('How many to buy').setRequired(false).setMinValue(1).setMaxValue(99)),

  async execute(interaction) {
    const itemName = interaction.options.getString('item');
    const qty = interaction.options.getInteger('quantity') || 1;
    const item = db.prepare(`SELECT * FROM shop WHERE guild_id=? AND LOWER(item_name)=LOWER(?) LIMIT 1`).get(interaction.guild.id, itemName);

    if (!item) return interaction.reply({ content: `❌ No item called **${itemName}** in the shop. Check the shop for available items.`, ephemeral: true });

    const total = item.price * qty;
    const bal = getBalance(interaction.user.id, interaction.guild.id);
    if (bal < total) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFF4444).setDescription(`❌ You need ${formatMoney(total)} but only have ${formatMoney(bal)}.`)], ephemeral: true });

    addBalance(interaction.user.id, interaction.guild.id, -total);
    const existing = db.prepare(`SELECT * FROM inventory WHERE user_id=? AND guild_id=? AND item_name=?`).get(interaction.user.id, interaction.guild.id, item.item_name);
    if (existing) {
      db.prepare(`UPDATE inventory SET quantity = quantity + ? WHERE id=?`).run(qty, existing.id);
    } else {
      db.prepare(`INSERT INTO inventory (user_id, guild_id, item_name, quantity, price) VALUES (?,?,?,?,?)`).run(interaction.user.id, interaction.guild.id, item.item_name, qty, item.price);
    }

    // Give role if configured
    if (item.role_id) {
      await interaction.member.roles.add(item.role_id).catch(() => {});
    }

    return interaction.reply({ embeds: [new EmbedBuilder()
      .setTitle('🛒 Purchase Successful!')
      .setColor(0x00FF7F)
      .addFields(
        { name: '🛍️ Item', value: item.item_name, inline: true },
        { name: '🔢 Qty', value: `${qty}`, inline: true },
        { name: '💸 Paid', value: formatMoney(total), inline: true }
      )
      .setTimestamp()
    ]});
  },
};
