import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Tournament Rules",
  description: "Global Tournament Rules for Zenith Esports.",
};

export default function RulesPage() {
  return (
    <>
      <h2>Global Tournament Rules</h2>
      <p className="text-[var(--color-text-faint)]">Last Updated: January 1, 2026</p>
      <p>
        <em>Note: Each specific tournament will have its own detailed rulebook. The following are the overarching global rules that apply to all Zenith Esports events.</em>
      </p>

      <h3>1. Player Accounts</h3>
      <ul>
        <li>Players must use their own registered game accounts. Smurfing or account sharing is strictly prohibited.</li>
        <li>In-game names (IGNs) must remain consistent throughout the duration of a tournament.</li>
        <li>Inappropriate, offensive, or sponsor-conflicting IGNs are not allowed.</li>
      </ul>

      <h3>2. Rosters & Substitutions</h3>
      <ul>
        <li>Rosters lock 24 hours before the first match of a tournament.</li>
        <li>Teams are allowed a specific number of substitutes (usually 1 or 2, depending on the game). Substitutes must be registered on the roster prior to the lock.</li>
        <li>Emergency substitutions outside the registered roster require direct admin approval and will incur penalty points or draft bans.</li>
      </ul>

      <h3>3. Match Punctuality</h3>
      <ul>
        <li>Teams must be present in the designated lobby or voice channel 15 minutes prior to the scheduled match time.</li>
        <li>A grace period of 10 minutes is allowed. Failure to field a full roster after the grace period will result in a forfeit loss for that map/match.</li>
      </ul>

      <h3>4. Technical Issues & Pauses</h3>
      <ul>
        <li>If a player disconnects, the team must immediately request a tactical pause (if the game supports it) or notify an admin in the Discord channel.</li>
        <li>Each team has a limited pause time pool per match (e.g., 10 minutes total in Valorant). Once the time is exhausted, the team must play on down a man or forfeit.</li>
        <li>Matches will not be completely restarted due to individual player internet or hardware issues unless the server itself crashes.</li>
      </ul>

      <h3>5. Communication</h3>
      <ul>
        <li>All official communication, disputes, and score reporting must occur on the official Zenith Esports Discord server.</li>
        <li>Teams must treat admins and opponents with respect. Admin decisions are final.</li>
      </ul>
    </>
  );
}
