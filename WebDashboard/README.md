# DayZ Leaderboard & Real-Time Stats API

A server-side-only DayZ mod and companion Next.js web application that captures and displays real-time player statistics, PvP metrics, bank wealth, and custom mod achievements on a beautiful, interactive web dashboard.

---

## 🚀 Key Features

*   **Server-Side Only Mod**: Load it as `-servermod=@DayZLeaderboard`. **No client downloads required** from the Steam Workshop.
*   **Zero Performance Impact**: Communication between the DayZ mod and Web API is handled via non-blocking asynchronous REST callbacks (`RestContext`).
*   **Dynamic Setup Wizard**: Easily configure your database connection parameters (MySQL) and security keys via a web interface upon first launch.
*   **Vanilla Player Metrics**:
    *   PvP Kills & Deaths (tracked with killer/victim names, SteamID, Bohemia UID, weapon, and distance).
    *   Record shooting ranges (separately tracks **Longest Hit** and **Longest Kill**).
    *   Infected (Zombie) kills and Playtime metrics.
    *   Animal kills detailed by species (e.g. Bear, Wolf, Deer, Boar, etc.).
*   **DayZ Expansion Mod Integrations**:
    *   **Expansion AI**: Tracks players hunting AI patrols/NPCs (filtering `eAIBase`).
    *   **Expansion Bank**: Automatically syncs bank card, safe, and pocket cash balances.
*   **DNA Keycards Mod Integrations**:
    *   Logs keycard entries, crate unlocks, and safehouse burglaries (e.g. Red, Blue, Purple, Green vaults).
*   **Live Activity Feed**: Real-time ticker stream detailing server activity, PvP battles, and accomplishments.

---

## 🛠️ Project Structure

```
├── dayz_mod/               # Server-side DayZ PBO Scripts (Enforce Script)
│   ├── config.cpp          # Mod initialization and module mappings
│   └── scripts/            # Core hooks (3_Game, 4_World, 5_Mission)
└── web_app/                # Unified Web API and Frontend Dashboard (Next.js)
    ├── prisma/             # Schema definitions and database models
    ├── src/app/api/        # REST API endpoints for DayZ mod synchronization
    └── src/app/            # Responsive web layout pages and Setup Wizard
```

---

## ⚙️ Installation & Deployment

### Step 1: Pack the DayZ Mod
1. Open **DayZ Tools** via Steam and open the **Addon Builder** utility.
2. Select `dayz_mod` as the source directory.
3. Build the addon into a folder named `@DayZ Leaderboard\Addons` on your server.
4. Launch your DayZ Server adding the `-servermod=@DayZ Leaderboard` launch parameter.

### Step 2: Deploy the Web Application
1. Upload the `web_app` folder to your web server, VPS, or deploy directly to platforms like **Vercel** or **Render**.
2. Run installation commands in the directory:
   ```bash
   npm install
   npm run build
   npm run start
   ```
3. Open the website URL in your browser (e.g., `http://your-server-ip:3000`).
4. The site will automatically launch the **Database Setup Wizard**. Enter your MySQL server details, click **Generate API Key**, and submit. The application will test the connection and automatically build the database tables.

### Step 3: Configure the Mod on the Game Server
1. Inside your DayZ Server's profiles directory, find the generated folder: `DayZLeaderboard/config.json`.
2. Edit the config, replacing the API URL and adding the API Key generated in **Step 2**:
   ```json
   {
     "api_url": "https://your-website.com/api/v1",
     "api_key": "YOUR_GENERATED_API_KEY",
     "track_dna": true,
     "track_expansion_ai": true,
     "track_expansion_bank": true,
     "sync_interval_minutes": 5
   }
   ```
3. Restart the server to initialize synchronization.

---

## 📄 License
This project is licensed under the MIT License.
