# DayZ Leaderboard & Real-Time Statistics System

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-Database-blue?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Steam Workshop](https://img.shields.io/badge/Steam_Workshop-Subscribe-blue?style=for-the-badge&logo=steam&logoColor=white)](https://steamcommunity.com/sharedfiles/filedetails/?id=3767782283)

A premium, open-source, real-time player statistics tracker and web leaderboard dashboard for **DayZ Standalone** servers. This project combines a high-performance **Next.js 14** web application and a compile-safe **DayZ server-side mod** to deliver real-time rankings, PvP metrics, bank wealth, and activity logs.

Designed for server owners who want to boost player engagement, this system tracks everything from long-distance sniper shots to loot container raids without causing server lag or crashes.

---

## 🌟 Key Features

*   **🏆 Complete Leaderboard:** Rank players dynamically by Playtime, Bank Wealth, PvP K/D Ratio, Infected Kills, AI Kills, DNA Keycard Openings, Longest Kill, and Longest Hit.
*   **📡 Live Event Feed:** An instant, real-time activity wall logging PvP deaths (including weapon and distance), PvE hunts, and safehouse raids.
*   **🤖 Expansion AI Integration:** Tracks AI kills (from DayZ Expansion AI) as separate stats to avoid skewing PvP stats.
*   **💰 Expansion Bank Integration:** Real-time bank balance synchronization for wealth-based leaderboard rankings.
*   **🔑 DNA Keycards Integration:** Automatically logs safehouse keypad unlocks and loot crate openings.
*   **🔒 Privacy-Focused PvP Settings:** Hide player last known positions and raid coordinates directly from the dashboard configurations to prevent stream-sniping and base-camping.
*   **⚙️ Zero-Database configuration**: Customize which columns to display or track through a single `settings.json` file.
*   **🛡️ Crash-Resistant Mod Scripts:** Engine-level null-pointer safeguards (e.g., AI deaths, entity hit logic) and query-parameter fallbacks to bypass DayZ's custom HTTP header limitations.

---

## 📁 Repository Structure

*   `WebDashboard/`: Next.js web application codebase.
*   `ServerMod/`: DayZ server-side script mod source files.

---

## 🚀 Web Dashboard Setup (Next.js)

### 1. Database Initialization
Ensure you have a **MySQL** database running. 
You can initialize the required tables by running the Prisma push command:
```bash
npx prisma db push
```
*(Or if you are on shared web hosting, you can run the provided helper script `db_setup.php` on your host to execute the raw DDL queries).*

The database contains the following tables:
*   `Player`: Stores persistent player stats (playtime, bank wealth, records).
*   `Kill`: Logs PvP kills, suicides, and AI kills.
*   `PveKill`: Logs infected, animal, and AI kills by players.
*   `HitLog`: Tracks player bullet hits for longest hit calculations.
*   `DnaLog`: Logs DNA Keycard crate and safehouse locks.

### 2. Configuration & Environment Variables
Create a `.env` file in the `WebDashboard/` directory based on the `.env.example` file:
```ini
DATABASE_URL="mysql://username:password@host:port/database"
API_KEY="your_secret_api_key_here"
```

### 3. Self-Hosting / Running Locally (Node.js)
1.  Navigate to the `WebDashboard` directory:
    ```bash
    cd WebDashboard
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Build the production application:
    ```bash
    npm run build
    ```
4.  Start the production server:
    ```bash
    npm run start
    ```
    *(I recommend using `pm2` to keep the application running in the background).*

### 4. Alternative Hosting Option: Vercel
1.  Push the `WebDashboard/` code to a private or public GitHub repository.
2.  Import the repository into **Vercel**.
3.  Add `DATABASE_URL` and `API_KEY` as environment variables in the Vercel Dashboard settings.
4.  Deploy! The build will automatically compile and optimize the routes.

### 5. Customizing Features (`settings.json`)
You can easily toggle which statistics are shown on the leaderboard and profile pages by editing `WebDashboard/src/config/settings.json`:
*   Set any feature to `false` (e.g., `bank` or `dna`) to hide its columns and sorting buttons.
*   Disable position tracking under the `privacy` section to hide coordinates on player profiles.

---

## 🎮 DayZ Server Mod Setup

### 1. Install the Server Mod
You have two options to install the server-side mod:

#### Option A: Subscribe on Steam Workshop (Recommended)
1. Subscribe to the compiled server mod directly on the [Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=3767782283).
2. Copy the `@DayZ Leaderboard - Real-Time Stats` folder from your local Steam workshop directory to your server's root folder.
3. Add the mod to your server's startup parameters: `-serverMod=@DayZ Leaderboard - Real-Time Stats`.

#### Option B: Compile from Source (Advanced)
1. Open the **DayZ Addon Builder**.
2. Select the `ServerMod/` folder as the source directory.
3. Compile it into a `.pbo` file and place it in a custom mod folder on your server (e.g., `@DayZLeaderboard/Addons/DayZLeaderboard.pbo`).
4. Add the mod to your server's startup parameters: `-serverMod=@DayZLeaderboard`.

### 2. Configuration
Upon the first server startup, the mod will generate a default configuration file in your server profiles folder under `profiles/DayZLeaderboard/config.json`.

Update it with your web URL and API Key:
```json
{
  "api_url": "https://your-project-domain.com/api/v1",
  "api_key": "your_secret_api_key_here",
  "track_dna": 1,
  "track_expansion_ai": 1,
  "track_expansion_bank": 1,
  "sync_interval_minutes": 5
}
```
*Restart the DayZ server after saving the configuration.*

---

## ⚖️ Legal Disclaimer

This website and mod are community-developed projects. They are **not** affiliated with, authorized, sponsored, or endorsed by Bohemia Interactive a.s. 

DayZ, Bohemia Interactive, and their respective logos are trademarks or registered trademarks of Bohemia Interactive a.s.
