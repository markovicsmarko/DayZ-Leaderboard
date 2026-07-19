// Modded PlayerBase to track kills, deaths, playtimes, hits, and session records.
modded class PlayerBase
{
    float m_SessionLongestHit = 0.0;
    int m_SessionJoinTime = 0; // Epoch timestamp of player connection

    override void EEHitBy(TotalDamageResult damageResult, int damageType, EntityAI source, int component, string dmgZone, string ammo, vector modelPos, float speedCoef)
    {
        super.EEHitBy(damageResult, damageType, source, component, dmgZone, ammo, modelPos, speedCoef);

        if (!GetGame().IsServer())
            return;

        if (source)
        {
            PlayerBase attackerPlayer = PlayerBase.Cast(source.GetHierarchyRootPlayer());
            // Attacker must be a player, not ourselves, and have an identity
            if (attackerPlayer && attackerPlayer != this && attackerPlayer.GetIdentity() && this.GetIdentity())
            {
                float distance = vector.Distance(this.GetPosition(), attackerPlayer.GetPosition());
                
                // Track hit record in-memory first to avoid network spam
                if (distance > attackerPlayer.m_SessionLongestHit)
                {
                    attackerPlayer.m_SessionLongestHit = distance;
                    
                    // Sync new record to API
                    string payload = "{";
                    payload += "\"attackerSteamId\":\"" + attackerPlayer.GetIdentity().GetPlainId() + "\",";
                    payload += "\"attackerBohemiaId\":\"" + attackerPlayer.GetIdentity().GetId() + "\",";
                    payload += "\"attackerName\":\"" + attackerPlayer.GetIdentity().GetName() + "\",";
                    payload += "\"victimSteamId\":\"" + this.GetIdentity().GetPlainId() + "\",";
                    payload += "\"victimBohemiaId\":\"" + this.GetIdentity().GetId() + "\",";
                    payload += "\"victimName\":\"" + this.GetIdentity().GetName() + "\",";
                    payload += "\"distance\":" + distance.ToString();
                    payload += "}";
                    DayZLeaderboardAPI.SendPost("/event/hit", payload);
                }
            }
        }
    }

    override void EEKilled(Object killer)
    {
        super.EEKilled(killer);

        if (!GetGame().IsServer())
            return;

        string killerSteamId = "";
        string killerBohemiaId = "";
        string killerName = "";
        string weaponName = "Unknown";
        float distance = 0.0;
        bool isSuicide = false;
        bool isKillerAi = false;

        EntityAI killerEntity = EntityAI.Cast(killer);
        if (killerEntity)
        {
            PlayerBase killerPlayer = PlayerBase.Cast(killerEntity.GetHierarchyRootPlayer());
            if (killerPlayer)
            {
                if (killerPlayer == this)
                {
                    isSuicide = true;
                }
                else
                {
                    // Check if killer is Expansion AI or a normal player
                    if (!killerPlayer.GetIdentity() && (killerPlayer.ClassName().Contains("eAI") || killerPlayer.ClassName() == "eAIBase"))
                    {
                        isKillerAi = true;
                        killerName = "Expansion AI (" + killerPlayer.ClassName() + ")";
                        killerSteamId = "AI";
                        killerBohemiaId = "AI=";
                    }
                    else if (killerPlayer.GetIdentity())
                    {
                        killerSteamId = killerPlayer.GetIdentity().GetPlainId();
                        killerBohemiaId = killerPlayer.GetIdentity().GetId();
                        killerName = killerPlayer.GetIdentity().GetName();
                    }

                    distance = vector.Distance(this.GetPosition(), killerPlayer.GetPosition());

                    EntityAI handItem = killerPlayer.GetHumanInventory().GetEntityInHands();
                    if (handItem)
                    {
                        weaponName = handItem.GetType();
                    }
                }
            }
        }

        // Determine if victim is AI
        bool isVictimAi = false;
        string victimSteamId = "";
        string victimBohemiaId = "";
        string victimName = "";

        if (!this.GetIdentity() && (this.ClassName().Contains("eAI") || this.ClassName() == "eAIBase"))
        {
            isVictimAi = true;
            victimName = "Expansion AI (" + this.ClassName() + ")";
            victimSteamId = "AI";
            victimBohemiaId = "AI=";
        }
        else if (this.GetIdentity())
        {
            victimSteamId = this.GetIdentity().GetPlainId();
            victimBohemiaId = this.GetIdentity().GetId();
            victimName = this.GetIdentity().GetName();
        }

        // Send Kill event (only if victim is actual player, or if victim is AI and we want to track AI kills)
        // If victim is AI, we log it if the killer was a player
        if (isVictimAi && !killerSteamId.Contains("AI") && killerSteamId != "")
        {
            // Player killed an AI
            string aiPayload = "{";
            aiPayload += "\"killerSteamId\":\"" + killerSteamId + "\",";
            aiPayload += "\"killerBohemiaId\":\"" + killerBohemiaId + "\",";
            aiPayload += "\"killerName\":\"" + killerName + "\",";
            aiPayload += "\"targetType\":\"ai\",";
            aiPayload += "\"className\":\"" + this.ClassName() + "\"";
            aiPayload += "}";
            DayZLeaderboardAPI.SendPost("/event/kill-pve", aiPayload);
            return;
        }

        // Normal player death
        if (!isVictimAi && victimSteamId != "")
        {
            string payload = "{";
            payload += "\"victimSteamId\":\"" + victimSteamId + "\",";
            payload += "\"victimBohemiaId\":\"" + victimBohemiaId + "\",";
            payload += "\"victimName\":\"" + victimName + "\",";
            payload += "\"killerSteamId\":\"" + killerSteamId + "\",";
            payload += "\"killerBohemiaId\":\"" + killerBohemiaId + "\",";
            payload += "\"killerName\":\"" + killerName + "\",";
            payload += "\"weapon\":\"" + weaponName + "\",";
            payload += "\"distance\":" + distance.ToString() + ",";
            payload += "\"isSuicide\":" + isSuicide.ToString() + ",";
            payload += "\"isAi\":" + isKillerAi.ToString();
            payload += "}";
            DayZLeaderboardAPI.SendPost("/event/kill", payload);
        }
    }
}

// Modded ZombieBase to track zombie kills by players
modded class ZombieBase
{
    override void EEKilled(Object killer)
    {
        super.EEKilled(killer);

        if (!GetGame().IsServer())
            return;

        EntityAI killerEntity = EntityAI.Cast(killer);
        if (killerEntity)
        {
            PlayerBase killerPlayer = PlayerBase.Cast(killerEntity.GetHierarchyRootPlayer());
            if (killerPlayer && killerPlayer.GetIdentity())
            {
                string killerSteamId = killerPlayer.GetIdentity().GetPlainId();
                string killerBohemiaId = killerPlayer.GetIdentity().GetId();
                string killerName = killerPlayer.GetIdentity().GetName();
                
                string payload = "{";
                payload += "\"killerSteamId\":\"" + killerSteamId + "\",";
                payload += "\"killerBohemiaId\":\"" + killerBohemiaId + "\",";
                payload += "\"killerName\":\"" + killerName + "\",";
                payload += "\"targetType\":\"zombie\",";
                payload += "\"className\":\"" + this.GetType() + "\"";
                payload += "}";
                DayZLeaderboardAPI.SendPost("/event/kill-pve", payload);
            }
        }
    }
}

// Modded AnimalBase to track animal kills by players
modded class AnimalBase
{
    override void EEKilled(Object killer)
    {
        super.EEKilled(killer);

        if (!GetGame().IsServer())
            return;

        EntityAI killerEntity = EntityAI.Cast(killer);
        if (killerEntity)
        {
            PlayerBase killerPlayer = PlayerBase.Cast(killerEntity.GetHierarchyRootPlayer());
            if (killerPlayer && killerPlayer.GetIdentity())
            {
                string killerSteamId = killerPlayer.GetIdentity().GetPlainId();
                string killerBohemiaId = killerPlayer.GetIdentity().GetId();
                string killerName = killerPlayer.GetIdentity().GetName();
                
                string payload = "{";
                payload += "\"killerSteamId\":\"" + killerSteamId + "\",";
                payload += "\"killerBohemiaId\":\"" + killerBohemiaId + "\",";
                payload += "\"killerName\":\"" + killerName + "\",";
                payload += "\"targetType\":\"animal\",";
                payload += "\"className\":\"" + this.GetType() + "\"";
                payload += "}";
                DayZLeaderboardAPI.SendPost("/event/kill-pve", payload);
            }
        }
    }
}
