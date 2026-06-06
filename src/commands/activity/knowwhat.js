const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('activity-knowwhat')
    .setDescription('Start Know What I Meme in a voice channel')
    .addChannelOption(opt => opt.setName('channel').setDescription('Voice channel').setRequired(false)),
  async execute(interaction) {
    await interaction.deferReply();
    const voiceChannel = interaction.options.getChannel('channel') || interaction.member?.voice?.channel;
    if (!voiceChannel) return interaction.editReply({ content: '❌ Join a voice channel first, or specify one!' });
    if (!voiceChannel.isVoiceBased()) return interaction.editReply({ content: '❌ That is not a voice channel!' });
    try {
      const invite = await voiceChannel.createInvite({ targetType: 2, targetApplication: '1122751745687593020', maxAge: 86400 });
      const embed = new EmbedBuilder()
        .setTitle('🎮 Know What I Meme')
        .setDescription('[Click here to start!](' + invite.url + ')')
        .addFields({ name: '📢 Channel', value: voiceChannel.name })
        .setColor(0x5865F2).setFooter({ text: 'Invite expires in 24h' }).setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      return interaction.editReply({ content: '❌ Failed: ' + err.message });
    }
  },
};
