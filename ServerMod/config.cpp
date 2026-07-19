class CfgPatches
{
	class DayZLeaderboard
	{
		units[]={};
		weapons[]={};
		requiredAddons[]=
		{
			"DZ_Data",
			"DZ_Scripts"
		};
	};
};

class CfgMods
{
	class DayZLeaderboard
	{
		dir="@DayZ Leaderboard";
		picture="";
		action="";
		name="DayZ Leaderboard";
		credits="";
		author="Marko";
		authorID="0";
		version="1.0";
		extra=0;
		type="mod";
		dependencies[]=
		{
			"Game",
			"World",
			"Mission"
		};
		class defs
		{
			class gameScriptModule
			{
				value="";
				files[]=
				{
					"DayZLeaderboard/scripts/3_Game"
				};
			};
			class worldScriptModule
			{
				value="";
				files[]=
				{
					"DayZLeaderboard/scripts/4_World"
				};
			};
			class missionScriptModule
			{
				value="";
				files[]=
				{
					"DayZLeaderboard/scripts/5_Mission"
				};
			};
		};
	};
};
