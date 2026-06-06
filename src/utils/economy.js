const db = require('./database');

function getOrCreate(userId, guildId) {
  let row = db.prepare('SELECT * FROM economy WHERE user_id=? AND guild_id=?').get(userId, guildId);
  if (!row) {
    db.prepare('INSERT INTO economy (user_id, guild_id, balance) VALUES (?,?,?)').run(userId, guildId, 0);
    row = db.prepare('SELECT * FROM economy WHERE user_id=? AND guild_id=?').get(userId, guildId);
  }
  return row;
}

function addBalance(userId, guildId, amount) {
  getOrCreate(userId, guildId);
  db.prepare('UPDATE economy SET balance = balance + ? WHERE user_id=? AND guild_id=?').run(amount, userId, guildId);
}

function getBalance(userId, guildId) {
  return getOrCreate(userId, guildId).balance;
}

function setLastAction(userId, guildId, field) {
  db.prepare(`UPDATE economy SET ${field}=datetime('now') WHERE user_id=? AND guild_id=?`).run(userId, guildId);
}

function getCooldown(userId, guildId, field) {
  const row = getOrCreate(userId, guildId);
  return row[field];
}

function formatMoney(n) {
  return `💰 **${Number(n).toLocaleString()}** coins`;
}

module.exports = { getOrCreate, addBalance, getBalance, setLastAction, getCooldown, formatMoney };
