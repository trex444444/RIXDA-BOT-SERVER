const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Manage roles automatically given to new members')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub => sub
      .setName('add')
      .setDescription('Add a role to auto-assign on join')
      .addRoleOption(opt => opt.setName('role').setDescription('The role to auto-assign').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('remove')
      .setDescription('Remove an auto-assign role')
      .addRoleOption(opt => opt.setName('role').setDescription('The role to remove').setRequired(true))
    )
    .addSubcommand(sub => sub
      .setName('list')
      .setDescription('List all auto-assign roles')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const role = interaction.options.getRole('role');
      if (role.managed) return interaction.reply({ content: '❌ Cannot auto-assign managed roles (bot roles).', ephemeral: true });

      try {
        db.prepare(`INSERT OR IGNORE INTO autoroles (guild_id, role_id) VALUES (?,?)`).run(interaction.guild.id, role.id);
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00FF7F).setDescription(`✅ <@&${role.id}> will now be given to all new members.`)] });
      } catch {
        return interaction.reply({ content: '❌ That role is already in the list.', ephemeral: true });
      }
    }

    if (sub === 'remove') {
      const role = interaction.options.getRole('role');
      const result = db.prepare(`DELETE FROM autoroles WHERE guild_id=? AND role_id=?`).run(interaction.guild.id, role.id);
      if (!result.changes) return interaction.reply({ content: '❌ That role is not in the auto-role list.', ephemeral: true });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFF4444).setDescription(`✅ Removed <@&${role.id}> from auto-roles.`)] });
    }

    if (sub === 'list') {
      const roles = db.prepare(`SELECT role_id FROM autoroles WHERE guild_id=?`).all(interaction.guild.id);
      const embed = new EmbedBuilder()
        .setTitle('🎭 Auto-Roles')
        .setColor(0x5865F2)
        .setDescription(roles.length ? roles.map(r => `<@&${r.role_id}>`).join('\n') : 'No auto-roles configured.')
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
  },
};
