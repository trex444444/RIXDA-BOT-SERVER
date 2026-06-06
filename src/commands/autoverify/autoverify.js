const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoverify')
    .setDescription('Verification system for new members')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => sub
      .setName('setup')
      .setDescription('Setup the verification system')
      .addChannelOption(opt => opt.setName('channel').setDescription('Verification channel').setRequired(true))
      .addRoleOption(opt => opt.setName('role').setDescription('Role to give after verification').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('dashboard')
      .setDescription('View verification settings')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const channel = interaction.options.getChannel('channel');
      const role = interaction.options.getRole('role');

      db.prepare(`INSERT OR REPLACE INTO autoverify (guild_id, channel_id, role_id, enabled) VALUES (?,?,?,1)`)
        .run(interaction.guild.id, channel.id, role.id);

      const verifyEmbed = new EmbedBuilder()
        .setTitle('✅ Verification Required')
        .setDescription('Welcome! Click the button below to verify yourself and gain access to the server.')
        .setColor(0x00FF7F)
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('verify_button')
          .setLabel('✅ Verify Me!')
          .setStyle(ButtonStyle.Success)
      );

      await channel.send({ embeds: [verifyEmbed], components: [row] });

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x00FF7F)
          .setTitle('✅ Verification Setup Complete')
          .addFields(
            { name: '📢 Channel', value: `<#${channel.id}>`, inline: true },
            { name: '🎭 Role', value: `<@&${role.id}>`, inline: true }
          )
        ],
        ephemeral: true
      });
    }

    if (sub === 'dashboard') {
      const config = db.prepare(`SELECT * FROM autoverify WHERE guild_id=?`).get(interaction.guild.id);
      if (!config) return interaction.reply({ content: '❌ Verification not configured. Run `/autoverify setup` first.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle('🔐 Verification Dashboard')
        .setColor(0x5865F2)
        .addFields(
          { name: '📢 Channel', value: config.channel_id ? `<#${config.channel_id}>` : 'Not set', inline: true },
          { name: '🎭 Role', value: config.role_id ? `<@&${config.role_id}>` : 'Not set', inline: true },
          { name: '🟢 Status', value: config.enabled ? 'Enabled' : 'Disabled', inline: true }
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
  },
};
