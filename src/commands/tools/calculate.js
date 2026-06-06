const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function safeEval(expr) {
  // Only allow safe math characters
  if (!/^[\d\s+\-*/().,^%!sqrtpielog]+$/i.test(expr.replace(/\s/g, ''))) {
    throw new Error('Invalid characters in expression');
  }

  // Replace ^ with ** for exponentiation
  let safe = expr
    .replace(/\^/g, '**')
    .replace(/sqrt\(/g, 'Math.sqrt(')
    .replace(/sin\(/g, 'Math.sin(')
    .replace(/cos\(/g, 'Math.cos(')
    .replace(/tan\(/g, 'Math.tan(')
    .replace(/log\(/g, 'Math.log10(')
    .replace(/ln\(/g, 'Math.log(')
    .replace(/pi/gi, 'Math.PI')
    .replace(/e(?!\d)/g, 'Math.E');

  // Use Function constructor to evaluate safely
  const result = new Function(`"use strict"; return (${safe})`)();
  return result;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('calculate')
    .setDescription('Evaluate a math expression')
    .addStringOption(opt => opt.setName('expression').setDescription('Math expression (e.g. 2+2, sqrt(16), sin(45))').setRequired(true)),

  async execute(interaction) {
    const expr = interaction.options.getString('expression');
    try {
      const result = safeEval(expr);
      if (typeof result !== 'number' || !isFinite(result)) throw new Error('Invalid result');
      const embed = new EmbedBuilder()
        .setTitle('🧮 Calculator')
        .setColor(0x5865F2)
        .addFields(
          { name: '📥 Expression', value: `\`${expr}\`` },
          { name: '📤 Result', value: `\`${result}\`` }
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    } catch (err) {
      return interaction.reply({ content: `❌ Could not evaluate: \`${expr}\`. Make sure it's a valid math expression.`, ephemeral: true });
    }
  },
};
