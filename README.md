# 🤖 Discord Bot — Full Setup Guide

## 📋 Features

### 🎮 Activity Commands (Voice)
| Command | Description |
|---------|-------------|
| `/activity-blazing8s` | Start Blazing 8s in voice |
| `/activity-bobble` | Start Bobble League in voice |
| `/activity-checkers` | Start Checkers in the Park |
| `/activity-chess` | Start Chess in the Park |
| `/activity-knowwhat` | Start Know What I Meme |
| `/activity-landio` | Start Land-io |
| `/activity-letterleague` | Start Letter League |
| `/activity-poker` | Start Poker Night |
| `/activity-puttparty` | Start Putt Party |
| `/activity-sketch` | Start Sketch Heads |
| `/activity-spellcast` | Start SpellCast |
| `/activity-youtube` | Start Watch Together |

### 🏛️ Community Commands
| Command | Description |
|---------|-------------|
| `/app-admin setup` | Configure application system |
| `/app-admin dashboard` | View application stats |
| `/app-admin list` | List pending applications |
| `/app-admin review` | Approve/deny an application |
| `/apply submit` | Submit an application |
| `/apply status` | Check your application status |
| `/apply list` | List your applications |
| `/autorole add/remove/list` | Auto-assign roles on join |
| `/autoverify setup/dashboard` | Verification button system |

### 🛡️ Moderation
| Command | Description |
|---------|-------------|
| `/ban` | Ban a member |
| `/cases` | View moderation cases |

### 💰 Economy
| Command | Description |
|---------|-------------|
| `/balance` | Check balance |
| `/daily` | Claim daily reward (200-700 coins) |
| `/beg` | Beg for coins (5 min cooldown) |
| `/crime` | Commit crime, risk/reward (30 min cooldown) |
| `/buy` | Buy items from shop |
| `/claim` | Claim reward codes |

### 🎂 Birthday System
| Command | Description |
|---------|-------------|
| `/birthday set` | Set your birthday |
| `/birthday info` | View someone's birthday |
| `/birthday list` | List all birthdays |
| `/birthday next` | See next upcoming birthdays |
| `/birthday remove` | Remove your birthday |
| `/birthday setchannel` | Set announcement channel |

### 🔧 Tools & Utility
| Command | Description |
|---------|-------------|
| `/avatar` | Get user avatar |
| `/baseconvert` | Convert number between bases |
| `/calculate` | Evaluate math expressions |
| `/countdown create/list` | Create/view countdowns |
| `/define` | Define a word (Dictionary API) |

### 🎟️ Tickets
| Command | Description |
|---------|-------------|
| `/close` | Close a ticket channel |

### ⚙️ Core
| Command | Description |
|---------|-------------|
| `/bug` | Submit a bug report |

---

## 🚀 Setup Guide

### Step 1 — Create a Discord Bot

1. Go to [https://discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** → give it a name
3. Go to **Bot** tab → click **Add Bot**
4. Under **Privileged Gateway Intents**, enable:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Copy your **Bot Token**

### Step 2 — Invite the Bot

Go to **OAuth2 → URL Generator**:
- Scopes: `bot`, `applications.commands`
- Bot Permissions: `Administrator` (or select individual perms)
- Copy and open the generated URL to invite the bot

### Step 3 — Configure .env

```bash
cp .env.example .env
```

Edit `.env`:
```
TOKEN=your_bot_token_here
CLIENT_ID=your_application_id
GUILD_ID=your_server_id
```

- **CLIENT_ID** = Your Application ID (found on the General Information page)
- **GUILD_ID** = Right-click your server → Copy Server ID (enable Developer Mode in Discord settings first)

### Step 4 — Install & Run

```bash
npm install
node src/deploy-commands.js   # Register slash commands (run once)
npm start                     # Start the bot
```

---

## 🌐 Hosting Without Railway

Since Railway has issues, here are free alternatives:

### Option 1: Render (Free)
1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. New → Web Service → Connect your repo
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add environment variables (TOKEN, CLIENT_ID, GUILD_ID)
7. ⚠️ Free tier sleeps after 15 min inactivity — use a cron ping service like [UptimeRobot](https://uptimerobot.com) to keep it awake

### Option 2: Fly.io (Free)
```bash
npm install -g flyctl
fly auth signup
fly launch
fly secrets set TOKEN=xxx CLIENT_ID=xxx GUILD_ID=xxx
fly deploy
```

### Option 3: Oracle Cloud (Always Free)
- Free ARM VM with 4 cores, 24GB RAM
- Never sleeps, runs 24/7
- Perfect for Discord bots

### Option 4: Run Locally (Simple)
```bash
npm start
```
Keep the terminal open. Use [ngrok](https://ngrok.com) if needed.

---

## 🏪 Adding Shop Items (for /buy command)

Use SQLite directly or add an admin command. Example:
```sql
INSERT INTO shop (guild_id, item_name, price, description, role_id)
VALUES ('YOUR_GUILD_ID', 'VIP Role', 1000, 'Get the VIP role!', 'ROLE_ID_HERE');
```

---

## 🎁 Demo Reward Codes (for /claim)
- `WELCOME100` → 100 coins
- `BONUS500` → 500 coins  
- `DISCORD2024` → 250 coins

---

## 📁 Project Structure

```
discord-bot/
├── src/
│   ├── index.js              # Main entry point
│   ├── deploy-commands.js    # Command deployer
│   ├── commands/
│   │   ├── activity/         # Voice activities (12 commands)
│   │   ├── admin/            # app-admin
│   │   ├── apply/            # Application system
│   │   ├── autorole/         # Auto-role management
│   │   ├── autoverify/       # Verification system
│   │   ├── birthday/         # Birthday system
│   │   ├── core/             # bug report
│   │   ├── economy/          # balance, daily, beg, crime, buy, claim
│   │   ├── moderation/       # ban, cases
│   │   ├── search/           # define
│   │   ├── ticket/           # close
│   │   ├── tools/            # baseconvert, calculate, countdown
│   │   └── utility/          # avatar
│   ├── events/
│   │   ├── ready.js
│   │   ├── interactionCreate.js
│   │   ├── buttonHandler.js
│   │   └── guildMemberAdd.js
│   └── utils/
│       ├── database.js       # SQLite setup
│       └── economy.js        # Economy helpers
├── data/                     # SQLite database (auto-created)
├── .env.example
├── package.json
└── README.md
```
buy rixda