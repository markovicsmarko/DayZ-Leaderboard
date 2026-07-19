// Mission Server hooks to handle server lifecycle, players connecting/disconnecting, and periodic sync.

modded class MissionServer
{
    ref DayZLeaderboardConfig m_LeaderboardConfig;

    override void OnInit()
    {
        super.OnInit();
        
        if (GetGame().IsServer())
        {
            m_LeaderboardConfig = new DayZLeaderboardConfig();
            m_LeaderboardConfig.Load();
            
            // Initialize API Client
            DayZLeaderboardAPI.Init(m_LeaderboardConfig);

            // Start periodic sync timer
            float syncIntervalSeconds = m_LeaderboardConfig.sync_interval_minutes * 60;
            if (syncIntervalSeconds < 60)
            {
                syncIntervalSeconds = 300; // minimum 5 mins fallback for safety
            }
            
            GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(SyncOnlinePlayers, syncIntervalSeconds * 1000, true);
            Print("[DayZLeaderboard] Periodic synchronization timer started. Interval: " + m_LeaderboardConfig.sync_interval_minutes.ToString() + " minutes.");
        }
    }

    override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)
    {
        super.InvokeOnConnect(player, identity);

        if (player && identity)
        {
            // Store player connection time in seconds since server start
            player.m_SessionJoinTime = GetGame().GetTime() / 1000;
            
            // Initial player registration sync (0 added playtime)
            DayZLeaderboard_SyncPlayer(player, identity, 0);
        }
    }

    override void InvokeOnDisconnect(PlayerBase player)
    {
        if (player && player.GetIdentity())
        {
            // Calculate final session playtime
            int currentTime = GetGame().GetTime() / 1000;
            int sessionSeconds = currentTime - player.m_SessionJoinTime;
            if (sessionSeconds < 0)
            {
                sessionSeconds = 0;
            }

            // Sync final stats on disconnect
            DayZLeaderboard_SyncPlayer(player, player.GetIdentity(), sessionSeconds);
        }

        super.InvokeOnDisconnect(player);
    }

    // Timer callback to sync all currently online players
    void SyncOnlinePlayers()
    {
        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);
        
        int currentTime = GetGame().GetTime() / 1000;

        for (int i = 0; i < players.Count(); ++i)
        {
            PlayerBase player = PlayerBase.Cast(players.Get(i));
            if (player && player.GetIdentity())
            {
                int sessionSeconds = currentTime - player.m_SessionJoinTime;
                if (sessionSeconds < 0)
                {
                    sessionSeconds = 0;
                }

                // Sync current playtime interval, position, and bank balance
                DayZLeaderboard_SyncPlayer(player, player.GetIdentity(), sessionSeconds);
                
                // Reset join time reference to the current sync time to avoid double counting
                player.m_SessionJoinTime = currentTime;
            }
        }
    }

    void DayZLeaderboard_SyncPlayer(PlayerBase player, PlayerIdentity identity, int sessionPlayTimeSeconds)
    {
        if (!player || !identity)
            return;

        int bankBalance = 0;
        if (m_LeaderboardConfig.track_expansion_bank)
        {
            bankBalance = DayZLeaderboardIntegrations.GetPlayerBankBalance(player);
        }

        vector pos = player.GetPosition();
        string posStr = pos[0].ToString() + " " + pos[1].ToString() + " " + pos[2].ToString();

        string payload = "{";
        payload += "\"steamId\":\"" + identity.GetPlainId() + "\",";
        payload += "\"bohemiaId\":\"" + identity.GetId() + "\",";
        payload += "\"playerName\":\"" + identity.GetName() + "\",";
        payload += "\"addedPlayTime\":" + sessionPlayTimeSeconds.ToString() + ",";
        payload += "\"bankBalance\":" + bankBalance.ToString() + ",";
        payload += "\"position\":\"" + posStr + "\"";
        payload += "}";

        DayZLeaderboardAPI.SendPost("/sync", payload);
    }
}
