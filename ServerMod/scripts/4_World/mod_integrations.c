// Mod integrations for DayZ Expansion Banking and DNA Keycards

class DayZLeaderboardIntegrations
{
    // Fetches the player's bank balance from DayZ Expansion Bank if available
    static int GetPlayerBankBalance(PlayerBase player)
    {
        if (!player || !player.GetIdentity())
            return 0;

        typename bankModuleType = "ExpansionBankModule".ToType();
        if (bankModuleType)
        {
            CF_ModuleCore module = GetModuleManager().GetModule(bankModuleType);
            if (module)
            {
                Class account;
                GetGame().GameScript.CallFunction(module, "GetPlayerAccount", account, player.GetIdentity().GetPlainId());
                if (account)
                {
                    int money = 0;
                    GetGame().GameScript.CallFunction(account, "GetMoney", money, null);
                    return money;
                }
            }
        }
        return 0;
    }

    // Handles logging DNA Keycard events and sends them to the API
    static void LogDnaAction(PlayerBase player, string actionName, Object target)
    {
        if (!player || !player.GetIdentity())
            return;

        string targetClass = "Unknown";
        if (target)
        {
            targetClass = target.GetType();
        }

        vector pos = player.GetPosition();
        string posStr = pos[0].ToString() + " " + pos[1].ToString() + " " + pos[2].ToString();

        string payload = "{";
        payload += "\"steamId\":\"" + player.GetIdentity().GetPlainId() + "\",";
        payload += "\"bohemiaId\":\"" + player.GetIdentity().GetId() + "\",";
        payload += "\"playerName\":\"" + player.GetIdentity().GetName() + "\",";
        payload += "\"action\":\"" + actionName + "\",";
        payload += "\"targetClass\":\"" + targetClass + "\",";
        payload += "\"position\":\"" + posStr + "\"";
        payload += "}";

        DayZLeaderboardAPI.SendPost("/event/dna", payload);
    }
}

// Modded ActionBase to dynamically catch DNA Keycard actions without hard compile-time dependencies.
// This matches any actions related to keycards or DNASafehouses.
modded class ActionBase
{
    override void OnStartServer(ActionData action_data)
    {
        super.OnStartServer(action_data);

        if (!action_data || !action_data.m_Player)
            return;

        string actionName = this.ClassName();
        // Catch any keycard/safehouse actions dynamically by name
        if (actionName.Contains("Keycard") || actionName.Contains("KeyCard") || actionName.Contains("DNASafehouse"))
        {
            DayZLeaderboardIntegrations.LogDnaAction(action_data.m_Player, actionName, action_data.m_Target.GetObject());
        }
    }
}
