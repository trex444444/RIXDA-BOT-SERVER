const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const ACTIVITIES = {
  blazing8s:    { id: '832025144389533716', name: 'Blazing 8s' },
  bobble:       { id: '947957217959759964', name: 'Bobble League' },
  checkers:     { id: '832013003968348200', name: 'Checkers in the Park' },
  chess:        { id: '832012774040141894', name: 'Chess in the Park' },
  knowwhat:     { id: '1122751745687593020', name: 'Know What I Meme' },
  landio:       { id: '903769130790969345', name: 'Land-io' },
  'letter-league': { id: '879863686565621790', name: 'Letter League' },
  poker:        { id: '755827207812677713', name: 'Poker Night' },
  puttparty:    { id: '945737671223947305', name: 'Putt Party' },
  sketch:       { id: '902271654783242291', name: 'Sketch Heads' },
  spellcast:    { id: '852509694341283871', name: 'SpellCast' },
  youtube:      { id: '880218394199220334', name: 'Watch Together' },
};

function buildCommand(key, info) {
  return {
    data: new SlashCommandBuilder()
      .setName(`activity-${key === 'letter-league' ? 'letter-league' : key}`)
      .setDescription(`Start ${info.name} in a voice channel`)
      .addChannelOption(opt =>
        opt.setName('channel')
          .setDescription('The voice channel to start the activity in')
          .setRequired(false)
      ),

    async execute(interaction) {
      await interaction.deferReply();
      const member = interaction.member;
      const voiceChannel = interaction.options.getChannel('channel') || member?.voice?.channel;

      if (!voiceChannel) {
        return interaction.editReply({ content: '❌ You need to be in a voice channel, or specify one!' });
      }

      if (!voiceChannel.isVoiceBased()) {
        return interaction.editReply({ content: '❌ That is not a voice channel!' });
      }

      try {
        const invite = await voiceChannel.createInvite({
          targetType: 2,
          targetApplication: info.id,
          maxAge: 86400,
        });

        const embed = new EmbedBuilder()
          .setTitle(`🎮 ${info.name}`)
          .setDescription(`[Click here to join ${info.name}!](${invite.url})`)
          .addFields({ name: '📢 Channel', value: voiceChannel.name })
          .setColor(0x5865F2)
          .setFooter({ text: 'Activity invite expires in 24 hours' })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        return interaction.editReply({ content: `❌ Failed to create activity invite: ${err.message}` });
      }
    }
  };
}

// Export one mega-file with all activities
// We'll export each as separate files below — this is the factory
module.exports = { buildCommand, ACTIVITIES };
