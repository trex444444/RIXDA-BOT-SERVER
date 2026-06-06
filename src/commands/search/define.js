const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const https = require('https');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('define')
    .setDescription('Get the definition of a word')
    .addStringOption(opt => opt.setName('word').setDescription('Word to define').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    const word = interaction.options.getString('word');
    try {
      const data = await fetchJSON(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!Array.isArray(data) || !data[0]) throw new Error('No result');

      const entry = data[0];
      const meanings = entry.meanings?.slice(0, 2) || [];
      const embed = new EmbedBuilder()
        .setTitle(`📖 ${entry.word}`)
        .setColor(0x5865F2)
        .setURL(`https://www.merriam-webster.com/dictionary/${encodeURIComponent(word)}`);

      if (entry.phonetic) embed.addFields({ name: '🔊 Phonetic', value: entry.phonetic, inline: true });

      for (const meaning of meanings) {
        const defs = meaning.definitions?.slice(0, 2).map((d, i) => `**${i+1}.** ${d.definition}${d.example ? `\n*"${d.example}"*` : ''}`).join('\n') || 'No definition';
        embed.addFields({ name: `📝 ${meaning.partOfSpeech}`, value: defs.substring(0, 1024) });
      }

      embed.setFooter({ text: 'Source: Free Dictionary API' }).setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    } catch {
      return interaction.editReply({ content: `❌ Could not find a definition for **${word}**.` });
    }
  },
};
