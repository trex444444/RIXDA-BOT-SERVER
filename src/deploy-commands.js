// ============================================================
//  deploy-commands.js  (v2.0)
//  Registers ALL slash commands to Discord via REST API.
//  Run once: node src/deploy-commands.js
// ============================================================
require('dotenv').config();
const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const commands = [];
const seen     = new Set();

// ─── 1. Collect commands from files ───────────────────────
function collectFromFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFromFiles(fullPath);
    } else if (entry.name.endsWith('.js') && !entry.name.startsWith('_')) {
      try {
        const cmd = require(fullPath);
        if (cmd?.data?.name && !seen.has(cmd.data.name)) {
          seen.add(cmd.data.name);
          commands.push(cmd.data.toJSON());
          console.log(`📦 From file: /${cmd.data.name}`);
        }
      } catch (e) {
        console.warn(`⚠️  Skipping ${fullPath}: ${e.message}`);
      }
    }
  }
}

collectFromFiles(path.join(__dirname, 'commands'));

// ─── 2. Inline commands (defined in index.js directly) ────
//        We duplicate their SlashCommandBuilder definitions
//        here so deploy-commands.js is self-contained.

const inlineCommands = [

  // /clan
  new SlashCommandBuilder()
    .setName('clan')
    .setDescription('Clan system')
    .addSubcommand(s => s
      .setName('create')
      .setDescription('Create a new clan')
      .addStringOption(o => o.setName('name').setDescription('Clan name').setRequired(true).setMaxLength(32))
    )
    .addSubcommand(s => s
      .setName('join')
      .setDescription('Join an existing clan')
      .addStringOption(o => o.setName('name').setDescription('Clan name to join').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('info')
      .setDescription('Display your clan details')
    ),

  // /joinvc
  new SlashCommandBuilder()
    .setName('joinvc')
    .setDescription('Make the bot join your voice channel'),

  // /leavevc
  new SlashCommandBuilder()
    .setName('leavevc')
    .setDescription('Make the bot leave the voice channel'),

  // /help
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Browse all bot commands by category'),

  // /send-selfrole
  new SlashCommandBuilder()
    .setName('send-selfrole')
    .setDescription('Deploy the self-role selector to a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addChannelOption(o => o
      .setName('channel')
      .setDescription('Channel to send the self-role embed to')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
    )
    .addStringOption(o => o
      .setName('message_id')
      .setDescription('Existing message ID to attach menus to instead of sending a new one')
      .setRequired(false)
    ),
];

for (const cmd of inlineCommands) {
  if (!seen.has(cmd.name)) {
    seen.add(cmd.name);
    commands.push(cmd.toJSON());
    console.log(`📦 Inline:     /${cmd.name}`);
  }
}

// ─── 3. Deploy ────────────────────────────────────────────
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`\n🚀 Deploying ${commands.length} commands to guild ${process.env.GUILD_ID}...\n`);
    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );
    console.log(`\n✅ Successfully deployed ${data.length} commands!\n`);
    console.table(data.map(c => ({ name: c.name, id: c.id })));
  } catch (err) {
    console.error('❌ Deploy failed:', err);
    process.exit(1);
  }
})();
