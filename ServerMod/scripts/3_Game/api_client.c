class DayZLeaderboardConfig
{
    string api_url;
    string api_key;
    bool track_dna;
    bool track_expansion_ai;
    bool track_expansion_bank;
    int sync_interval_minutes;

    void Load()
    {
        string folder = "$profile:DayZLeaderboard";
        string path = folder + "/config.json";
        if (!FileExist(folder))
            MakeDirectory(folder);

        if (FileExist(path))
        {
            JsonFileLoader<DayZLeaderboardConfig>.JsonLoadFile(path, this);
        }
        else
        {
            api_url = "http://localhost:3000/api/v1";
            api_key = "CHANGE_ME";
            track_dna = true;
            track_expansion_ai = true;
            track_expansion_bank = true;
            sync_interval_minutes = 5;
            Save();
        }
    }

    void Save()
    {
        string path = "$profile:DayZLeaderboard/config.json";
        JsonFileLoader<DayZLeaderboardConfig>.JsonSaveFile(path, this);
    }
}

class DayZLeaderboardRestCallback : RestCallback
{
    override void OnError(int errorCode)
    {
        Print("[DayZLeaderboard] API Error: Code " + errorCode.ToString());
    }

    override void OnTimeout()
    {
        Print("[DayZLeaderboard] API Request Timed Out!");
    }

    override void OnSuccess(string data, int dataSize)
    {
        // Request succeeded, silent in production to prevent spamming server logs
    }
}

class DayZLeaderboardAPI
{
    static ref DayZLeaderboardConfig m_Config;
    static RestContext m_RestContext;
    static ref DayZLeaderboardRestCallback m_Callback;

    static void Init(DayZLeaderboardConfig config)
    {
        m_Config = config;
        m_Callback = new DayZLeaderboardRestCallback();
        
        string url = m_Config.api_url;
        
        // Ensure trailing slash is removed if present for clean routing, or handle in endpoint construction
        if (url.Length() > 0 && url.Substring(url.Length() - 1, 1) == "/")
        {
            url = url.Substring(0, url.Length() - 1);
        }

        m_RestContext = GetRestApi().GetRestContext(url);
        m_RestContext.SetHeader("Content-Type: application/json");
        m_RestContext.SetHeader("Authorization: Bearer " + m_Config.api_key);
        
        Print("[DayZLeaderboard] API Client initialized targeting: " + url);
    }

    static void SendPost(string endpoint, string jsonPayload)
    {
        if (!m_RestContext)
        {
            Print("[DayZLeaderboard] Error: RestContext not initialized! Cannot POST to " + endpoint);
            return;
        }
        
        string authEndpoint = endpoint + "?key=" + m_Config.api_key;
        m_RestContext.POST(m_Callback, authEndpoint, jsonPayload);
    }
}
