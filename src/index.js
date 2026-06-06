// ============================================================
//  FULL-FEATURED DISCORD BOT — src/index.js  (v2.0)
//  discord.js v14 | @discordjs/voice | better-sqlite3
// ============================================================
require('dotenv').config();
const {
  Client, GatewayIntentBits, Collection, Partials,
  EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder,
  PermissionFlagsBits, ChannelType, AttachmentBuilder,
} = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const fs   = require('fs');
const path = require('path');
const cron = require('node-cron');

// ─── Paths ────────────────────────────────────────────────
const CLANS_FILE = path.join(__dirname, '../data/clans.json');
const DATA_DIR   = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(CLANS_FILE)) fs.writeFileSync(CLANS_FILE, '{}');

// ─── Clan helpers ─────────────────────────────────────────
function readClans()        { return JSON.parse(fs.readFileSync(CLANS_FILE, 'utf8')); }
function writeClans(data)   { fs.writeFileSync(CLANS_FILE, JSON.stringify(data, null, 2)); }

// ─── Role definitions ─────────────────────────────────────
const REQUIRED_ROLES = [
  // Games
  { name: 'CS GO',           color: 0xF0A500 },
  { name: 'Gta V',           color: 0x00A859 },
  { name: 'Fortnite',        color: 0x6B3FA0 },
  { name: 'Rocket League',   color: 0x0099FF },
  { name: 'League Of Legends', color: 0xC89B3C },
  { name: 'Among Us',        color: 0xC51111 },
  { name: 'Valorant',        color: 0xFF4655 },
  { name: 'Minecraft',       color: 0x62B47A },
  { name: 'Genshin Impact',  color: 0x4A90D9 },
  { name: 'Plato',           color: 0xE87722 },
  // Colors
  { name: 'Red',             color: 0xFF0000 },
  { name: 'Brown',           color: 0x964B00 },
  { name: 'Gold',            color: 0xFFD700 },
  { name: 'White',           color: 0xFFFFFF },
  { name: 'Black',           color: 0x000001 },
  // Gender / Relationship
  { name: 'Man (راجل)',      color: 0x3498DB },
  { name: 'Woman (بنت)',     color: 0xFF69B4 },
  { name: 'Taken',           color: 0xFF1493 },
  { name: 'Single',          color: 0x2ECC71 },
  { name: 'Married',         color: 0xF39C12 },
];

// Self-role menu custom IDs
const SELFROLE_MENUS = {
  'selfrole_games1':        ['CS GO','Gta V','Fortnite','Rocket League','League Of Legends'],
  'selfrole_games2':        ['Among Us','Valorant','Minecraft','Genshin Impact','Plato'],
  'selfrole_colors':        ['Red','Brown','Gold','White','Black'],
  'selfrole_relationship':  ['Man (راجل)','Woman (بنت)','Taken','Single','Married'],
};

// ─── Help categories ──────────────────────────────────────
const HELP_CATEGORIES = {
  activities: {
    label: '🎮 Activities',
    description: 'Discord voice channel games',
    color: 0x5865F2,
    fields: [
      { name: '/activity-blazing8s',   value: 'Start Blazing 8s in voice channel' },
      { name: '/activity-bobble',      value: 'Start Bobble League in voice channel' },
      { name: '/activity-checkers',    value: 'Start Checkers in the Park' },
      { name: '/activity-chess',       value: 'Start Chess in the Park' },
      { name: '/activity-knowwhat',    value: 'Start Know What I Meme' },
      { name: '/activity-landio',      value: 'Start Land-io' },
      { name: '/activity-letterleague',value: 'Start Letter League' },
      { name: '/activity-poker',       value: 'Start Poker Night' },
      { name: '/activity-puttparty',   value: 'Start Putt Party' },
      { name: '/activity-sketch',      value: 'Start Sketch Heads' },
      { name: '/activity-spellcast',   value: 'Start SpellCast' },
      { name: '/activity-youtube',     value: 'Start Watch Together (YouTube)' },
    ],
  },
  community: {
    label: '🏛️ Community',
    description: 'Applications, auto-roles & verification',
    color: 0x00FF7F,
    fields: [
      { name: '/app-admin setup',     value: 'Configure the application system' },
      { name: '/app-admin dashboard', value: 'View application stats' },
      { name: '/app-admin list',      value: 'List pending applications' },
      { name: '/app-admin review',    value: 'Approve or deny an application' },
      { name: '/apply submit',        value: 'Submit a new application' },
      { name: '/apply status',        value: 'Check your application status' },
      { name: '/apply list',          value: 'List your submitted applications' },
      { name: '/autorole add/remove/list', value: 'Manage auto-assign roles on member join' },
      { name: '/autoverify setup/dashboard', value: 'Configure the verification button system' },
    ],
  },
  moderation: {
    label: '🛡️ Moderation',
    description: 'Ban, cases and moderation tools',
    color: 0xFF4444,
    fields: [
      { name: '/ban',   value: 'Ban a member from the server' },
      { name: '/cases', value: 'View moderation history and cases' },
    ],
  },
  economy: {
    label: '💰 Economy',
    description: 'Coins, daily rewards and the shop',
    color: 0xFFD700,
    fields: [
      { name: '/balance', value: 'Check your current coin balance' },
      { name: '/daily',   value: 'Claim daily reward (200–700 coins)' },
      { name: '/beg',     value: 'Beg for coins (5 min cooldown)' },
      { name: '/crime',   value: 'Commit a crime – risk/reward (30 min)' },
      { name: '/buy',     value: 'Buy items from the economy shop' },
      { name: '/claim',   value: 'Claim reward or promo codes' },
    ],
  },
  birthday: {
    label: '🎂 Birthday',
    description: 'Birthday tracking and announcements',
    color: 0xFF69B4,
    fields: [
      { name: '/birthday set',        value: 'Set your birthday' },
      { name: '/birthday info',       value: "View someone's birthday" },
      { name: '/birthday list',       value: 'List all recorded birthdays' },
      { name: '/birthday next',       value: 'See next upcoming birthdays' },
      { name: '/birthday remove',     value: 'Remove your birthday' },
      { name: '/birthday setchannel', value: 'Set the birthday announcement channel' },
    ],
  },
  utility: {
    label: '🔧 Utility',
    description: 'Tools and utility commands',
    color: 0x7289DA,
    fields: [
      { name: '/avatar',      value: "Get a user's avatar URL" },
      { name: '/baseconvert', value: 'Convert numbers between bases' },
      { name: '/calculate',   value: 'Evaluate math expressions' },
      { name: '/countdown create/list', value: 'Create or view custom countdowns' },
      { name: '/define',      value: 'Define a word using the Dictionary API' },
      { name: '/close',       value: 'Close an open ticket channel' },
      { name: '/bug',         value: 'Submit a bug report to the developers' },
    ],
  },
  clan: {
    label: '⚔️ Clan & Voice',
    description: 'Clan system and voice channel commands',
    color: 0xE67E22,
    fields: [
      { name: '/clan create [name]', value: 'Create a new clan' },
      { name: '/clan join [name]',   value: 'Join an existing clan' },
      { name: '/clan info',          value: 'Display your clan details' },
      { name: '/joinvc',             value: 'Make the bot join your voice channel' },
      { name: '/send-selfrole',      value: 'Deploy the self-role selector to a channel' },
    ],
  },
};

// ─── Client setup ─────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

client.commands = new Collection();

// ─── Recursive command loader ──────────────────────────────
function loadCommands(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommands(fullPath);
    } else if (entry.name.endsWith('.js') && !entry.name.startsWith('_')) {
      try {
        const command = require(fullPath);
        if (command?.data?.name) {
          client.commands.set(command.data.name, command);
          console.log(`✅ Loaded: /${command.data.name}`);
        }
      } catch (e) {
        console.error(`❌ Failed to load ${fullPath}:`, e.message);
      }
    }
  }
}

loadCommands(path.join(__dirname, 'commands'));

// ─── Event files ──────────────────────────────────────────
const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// ══════════════════════════════════════════════════════════
//  READY
// ══════════════════════════════════════════════════════════
client.once('ready', async () => {
  const { ActivityType } = require('discord.js');
  console.log(`\n🤖 Logged in as ${client.user.tag}`);
  console.log(`📡 Serving ${client.guilds.cache.size} guild(s)\n`);
  client.user.setActivity('/help | full-featured bot', { type: ActivityType.Watching });

  // ── Auto-create required roles in every guild ─────────
  for (const guild of client.guilds.cache.values()) {
    await ensureRoles(guild);
  }
});

async function ensureRoles(guild) {
  try {
    const existing = await guild.roles.fetch();
    const existingNames = new Set(existing.map(r => r.name.toLowerCase()));
    for (const roleDef of REQUIRED_ROLES) {
      if (!existingNames.has(roleDef.name.toLowerCase())) {
        await guild.roles.create({ name: roleDef.name, color: roleDef.color, reason: 'Auto-created by bot on startup' });
        console.log(`🎭 Created role "${roleDef.name}" in ${guild.name}`);
      }
    }
  } catch (err) {
    console.error(`Failed to ensure roles in ${guild.name}:`, err.message);
  }
}

// Also ensure roles when bot joins a new guild
client.on('guildCreate', async (guild) => {
  await ensureRoles(guild);
});

// ══════════════════════════════════════════════════════════
//  INTERACTION CREATE  (central handler)
// ══════════════════════════════════════════════════════════
client.on('interactionCreate', async (interaction) => {

  // ── Slash commands ────────────────────────────────────
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(`Error in /${interaction.commandName}:`, err);
      const errEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ An error occurred')
        .setDescription('Something went wrong while executing this command.')
        .setTimestamp();
      try {
        if (interaction.replied || interaction.deferred)
          await interaction.followUp({ embeds: [errEmbed], ephemeral: true });
        else
          await interaction.reply({ embeds: [errEmbed], ephemeral: true });
      } catch {}
    }
    return;
  }

  // ── Help select menu ──────────────────────────────────
  if (interaction.isStringSelectMenu() && interaction.customId === 'help_category') {
    const chosen = interaction.values[0];
    const cat = HELP_CATEGORIES[chosen];
    if (!cat) return interaction.reply({ content: '❌ Unknown category.', ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle(cat.label)
      .setDescription(cat.description)
      .setColor(cat.color)
      .addFields(cat.fields.map(f => ({ name: `\`${f.name}\``, value: f.value, inline: false })))
      .setFooter({ text: `Category: ${cat.label}` })
      .setTimestamp();

    return interaction.update({ embeds: [embed] });
  }

  // ── Self-role select menus (toggle logic) ─────────────
  if (interaction.isStringSelectMenu() && SELFROLE_MENUS[interaction.customId]) {
    await interaction.deferReply({ ephemeral: true });
    const selectedValue = interaction.values[0]; // role name stored as value
    const guild = interaction.guild;

    // Find role by name
    const role = guild.roles.cache.find(r => r.name === selectedValue);
    if (!role) {
      return interaction.editReply({ content: `❌ Role **${selectedValue}** not found. Ask an admin to run the bot again to recreate it.` });
    }

    const member = interaction.member;
    if (member.roles.cache.has(role.id)) {
      await member.roles.remove(role);
      return interaction.editReply({ content: `❌ Successfully removed the role: **${role.name}**` });
    } else {
      await member.roles.add(role);
      return interaction.editReply({ content: `✅ Successfully added the role: **${role.name}**` });
    }
  }

  // ── Verify button ─────────────────────────────────────
  if (interaction.isButton() && interaction.customId === 'verify_button') {
    const db = require('./utils/database');
    const config = db.prepare('SELECT * FROM autoverify WHERE guild_id=?').get(interaction.guild.id);
    if (!config?.role_id) return interaction.reply({ content: '❌ Verification role not configured.', ephemeral: true });
    const member = interaction.member;
    if (member.roles.cache.has(config.role_id))
      return interaction.reply({ content: '✅ You are already verified!', ephemeral: true });
    try {
      await member.roles.add(config.role_id);
      return interaction.reply({ content: '✅ You have been verified! Welcome to the server!', ephemeral: true });
    } catch {
      return interaction.reply({ content: '❌ Could not assign role. Please contact an admin.', ephemeral: true });
    }
  }
});

// ── Auto-role on member join ───────────────────────────────
client.on('guildMemberAdd', async (member) => {
  const db = require('./utils/database');
  const roles = db.prepare('SELECT role_id FROM autoroles WHERE guild_id=?').all(member.guild.id);
  for (const row of roles) {
    const role = member.guild.roles.cache.get(row.role_id);
    if (role) await member.roles.add(role).catch(() => {});
  }
  const verify = db.prepare('SELECT * FROM autoverify WHERE guild_id=?').get(member.guild.id);
  if (verify?.enabled && verify.role_id) {
    const role = member.guild.roles.cache.get(verify.role_id);
    if (role) await member.roles.add(role).catch(() => {});
  }
});

// ─── Birthday cron ────────────────────────────────────────
cron.schedule('0 8 * * *', async () => {
  const db = require('./utils/database');
  const today = new Date();
  const mmdd = `${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const birthdays = db.prepare('SELECT * FROM birthdays WHERE birthday LIKE ?').all(`%-${mmdd}`);
  for (const row of birthdays) {
    const chanRow = db.prepare('SELECT channel_id FROM birthday_channels WHERE guild_id=?').get(row.guild_id);
    if (!chanRow) continue;
    try {
      const guild   = await client.guilds.fetch(row.guild_id);
      const channel = await guild.channels.fetch(chanRow.channel_id);
      const member  = await guild.members.fetch(row.user_id).catch(() => null);
      if (!channel || !member) continue;
      const embed = new EmbedBuilder()
        .setTitle('🎂 Happy Birthday!')
        .setDescription(`Today is <@${row.user_id}>'s birthday! 🎉`)
        .setColor(0xFFD700).setTimestamp();
      await channel.send({ embeds: [embed] });
    } catch {}
  }
});

// ══════════════════════════════════════════════════════════
//  INLINE COMMANDS  (clan, joinvc, help, send-selfrole)
//  These are registered from within index.js so no separate
//  file is needed, but they ARE exported via client.commands.
// ══════════════════════════════════════════════════════════

// --- /clan ---------------------------------------------------
const { SlashCommandBuilder } = require('discord.js');

const clanCmd = {
  data: new SlashCommandBuilder()
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

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const clans = readClans();
    const uid   = interaction.user.id;
    const gid   = interaction.guild.id;
    const key   = gid; // per-guild clans

    if (!clans[key]) clans[key] = {};

    if (sub === 'create') {
      const name = interaction.options.getString('name').trim();
      // Check user doesn't already own one
      const alreadyOwns = Object.values(clans[key]).find(c => c.ownerId === uid);
      if (alreadyOwns) return interaction.reply({ content: `❌ You already own clan **${alreadyOwns.name}**. You must disband it first.`, ephemeral: true });
      if (clans[key][name.toLowerCase()]) return interaction.reply({ content: `❌ A clan named **${name}** already exists.`, ephemeral: true });

      clans[key][name.toLowerCase()] = {
        name,
        ownerId: uid,
        members: [uid],
        createdAt: new Date().toISOString(),
      };
      writeClans(clans);

      return interaction.reply({ embeds: [new EmbedBuilder()
        .setTitle('⚔️ Clan Created!')
        .setColor(0xE67E22)
        .addFields(
          { name: '🏷️ Name', value: name, inline: true },
          { name: '👑 Owner', value: `<@${uid}>`, inline: true },
          { name: '👥 Members', value: '1', inline: true },
        )
        .setTimestamp()
      ]});
    }

    if (sub === 'join') {
      const name = interaction.options.getString('name').trim().toLowerCase();
      const clan = clans[key][name];
      if (!clan) return interaction.reply({ content: `❌ No clan named **${name}** exists.`, ephemeral: true });
      if (clan.members.includes(uid)) return interaction.reply({ content: `❌ You are already in **${clan.name}**.`, ephemeral: true });
      // Remove from any old clan
      for (const c of Object.values(clans[key])) {
        c.members = c.members.filter(m => m !== uid);
      }
      clan.members.push(uid);
      writeClans(clans);

      return interaction.reply({ embeds: [new EmbedBuilder()
        .setTitle('⚔️ Joined Clan!')
        .setColor(0x00FF7F)
        .addFields(
          { name: '🏷️ Clan', value: clan.name, inline: true },
          { name: '👑 Owner', value: `<@${clan.ownerId}>`, inline: true },
          { name: '👥 Members', value: `${clan.members.length}`, inline: true },
        )
        .setTimestamp()
      ]});
    }

    if (sub === 'info') {
      const myClan = Object.values(clans[key]).find(c => c.members.includes(uid));
      if (!myClan) return interaction.reply({ content: '❌ You are not in any clan. Use `/clan join` or `/clan create`.', ephemeral: true });

      const memberList = myClan.members.slice(0, 10).map(m => `<@${m}>`).join('\n') || 'None';
      return interaction.reply({ embeds: [new EmbedBuilder()
        .setTitle(`⚔️ Clan: ${myClan.name}`)
        .setColor(0xE67E22)
        .addFields(
          { name: '👑 Owner', value: `<@${myClan.ownerId}>`, inline: true },
          { name: '👥 Members', value: `${myClan.members.length}`, inline: true },
          { name: '📅 Created', value: `<t:${Math.floor(new Date(myClan.createdAt).getTime()/1000)}:R>`, inline: true },
          { name: `👥 Member List (first 10)`, value: memberList },
        )
        .setTimestamp()
      ]});
    }
  },
};
client.commands.set('clan', clanCmd);

// --- /joinvc -------------------------------------------------
const { joinVoiceChannel: jvc, getVoiceConnection: gvc } = require('@discordjs/voice');

const joinvcCmd = {
  data: new SlashCommandBuilder()
    .setName('joinvc')
    .setDescription('Make the bot join your voice channel'),

  async execute(interaction) {
    const member = interaction.member;
    const vc = member?.voice?.channel;
    if (!vc) return interaction.reply({ content: '❌ You need to be in a voice channel first!', ephemeral: true });
    if (!vc.joinable) return interaction.reply({ content: '❌ I do not have permission to join that channel.', ephemeral: true });

    try {
      // Destroy existing connection if any
      const existing = gvc(interaction.guild.id);
      if (existing) existing.destroy();

      jvc({
        channelId: vc.id,
        guildId:   vc.guild.id,
        adapterCreator: vc.guild.voiceAdapterCreator,
        selfDeaf: false,
      });

      return interaction.reply({ embeds: [new EmbedBuilder()
        .setColor(0x5865F2)
        .setDescription(`🎙️ Joined **${vc.name}**! Use \`/leavevc\` to disconnect.`)
        .setTimestamp()
      ]});
    } catch (err) {
      return interaction.reply({ content: `❌ Failed to join: ${err.message}`, ephemeral: true });
    }
  },
};
client.commands.set('joinvc', joinvcCmd);

// --- /leavevc ------------------------------------------------
const leavevcCmd = {
  data: new SlashCommandBuilder()
    .setName('leavevc')
    .setDescription('Make the bot leave the voice channel'),

  async execute(interaction) {
    const conn = gvc(interaction.guild.id);
    if (!conn) return interaction.reply({ content: '❌ I am not in any voice channel.', ephemeral: true });
    conn.destroy();
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFF4444).setDescription('👋 Left the voice channel.').setTimestamp()] });
  },
};
client.commands.set('leavevc', leavevcCmd);

// --- /help ---------------------------------------------------
const helpCmd = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Browse all bot commands by category'),

  async execute(interaction) {
    const defaultCat = HELP_CATEGORIES.activities;
    const embed = new EmbedBuilder()
      .setTitle('📖 Bot Help — Select a Category')
      .setDescription('Use the dropdown below to explore commands by category.')
      .setColor(0x5865F2)
      .setFooter({ text: `${client.commands.size} commands loaded` })
      .setTimestamp();

    const menu = new StringSelectMenuBuilder()
      .setCustomId('help_category')
      .setPlaceholder('📂 Choose a category...')
      .addOptions([
        { label: '🎮 Activities',    description: 'Discord voice games',               value: 'activities',  emoji: '🎮' },
        { label: '🏛️ Community',    description: 'Applications, roles & verification', value: 'community',   emoji: '🏛️' },
        { label: '🛡️ Moderation',   description: 'Ban, kick, cases',                   value: 'moderation',  emoji: '🛡️' },
        { label: '💰 Economy',       description: 'Coins, shop & daily rewards',        value: 'economy',     emoji: '💰' },
        { label: '🎂 Birthday',      description: 'Birthday tracking & announcements',  value: 'birthday',    emoji: '🎂' },
        { label: '🔧 Utility',       description: 'Tools, avatar, calculator...',       value: 'utility',     emoji: '🔧' },
        { label: '⚔️ Clan & Voice',  description: 'Clan system and voice commands',     value: 'clan',        emoji: '⚔️' },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);
    return interaction.reply({ embeds: [embed], components: [row] });
  },
};
client.commands.set('help', helpCmd);

// --- /send-selfrole ------------------------------------------
const sendSelfroleCmd = {
  data: new SlashCommandBuilder()
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
      .setDescription('Existing message ID to attach menus to instead of sending new one')
      .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const channel   = interaction.options.getChannel('channel');
    const messageId = interaction.options.getString('message_id');

    // Build the 4 select menus
    const makeMenu = (customId, placeholder, options) =>
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(customId)
          .setPlaceholder(placeholder)
          .addOptions(options.map(name => ({
            label: name,
            value: name,
            description: `Toggle the ${name} role`,
          })))
      );

    const components = [
      makeMenu('selfrole_games1',       '🎮 Select Game Roles (Part 1)', ['CS GO','Gta V','Fortnite','Rocket League','League Of Legends']),
      makeMenu('selfrole_games2',       '🎮 Select Game Roles (Part 2)', ['Among Us','Valorant','Minecraft','Genshin Impact','Plato']),
      makeMenu('selfrole_colors',       '🎨 Select Color Roles',         ['Red','Brown','Gold','White','Black']),
      makeMenu('selfrole_relationship', '💑 Select Relationship Status', ['Man (راجل)','Woman (بنت)','Taken','Single','Married']),
    ];

    const embed = new EmbedBuilder()
      .setTitle('🎭 Server Free Roles')
      .setDescription(
        '> Pick your roles from the menus below!\n' +
        '> Selecting a role you already have will **remove** it.\n\n' +
        '🎮 **Game Roles** · 🎨 **Color Roles** · 💑 **Relationship Status**'
      )
      .setColor(0x5865F2)
      .addFields(
        { name: '🎮 Game Roles (Part 1)', value: 'CS GO · Gta V · Fortnite · Rocket League · League Of Legends', inline: false },
        { name: '🎮 Game Roles (Part 2)', value: 'Among Us · Valorant · Minecraft · Genshin Impact · Plato',       inline: false },
        { name: '🎨 Color Roles',         value: 'Red · Brown · Gold · White · Black',                              inline: false },
        { name: '💑 Relationship',        value: 'Man (راجل) · Woman (بنت) · Taken · Single · Married',            inline: false },
      )
      .setFooter({ text: 'Click a menu below to toggle a role' })
      .setTimestamp();

    try {
      if (messageId) {
        // Attach to existing message
        const msg = await channel.messages.fetch(messageId);
        await msg.edit({ components });
        return interaction.editReply({ content: `✅ Menus attached to message \`${messageId}\` in <#${channel.id}>.` });
      } else {
        await channel.send({ embeds: [embed], components });
        return interaction.editReply({ content: `✅ Self-role panel sent to <#${channel.id}>.` });
      }
    } catch (err) {
      return interaction.editReply({ content: `❌ Failed: ${err.message}` });
    }
  },
};
client.commands.set('send-selfrole', sendSelfroleCmd);

// ─── Login ────────────────────────────────────────────────
client.login(process.env.TOKEN);
