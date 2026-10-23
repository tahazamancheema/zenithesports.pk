/**
 * Rules content: the website rules, the rules shared by every Zenith tournament,
 * and one rulebook per game. Game rulebooks follow each publisher's official
 * esports rules (sources listed with each), adapted to Zenith's online and LAN
 * events. A tournament page can set its own details (format, maps, roster size);
 * where it does, the tournament page applies.
 */

export type RuleSection = { id: string; title: string; intro?: string; items: string[] }
export type Source = { label: string; url: string }

export const RULES_UPDATED = '24 October 2026'

// ─── website rules ──────────────────────────────────────────────────────────

export const WEBSITE_RULES: RuleSection[] = [
  {
    id: 'scope',
    title: 'What these rules cover',
    items: [
      'These rules apply to everyone who uses zenithesports.pk and its platforms: ZenithRegistrations, ZenithAntiCheat, ZenithProduction, ZenithPoints and Looking for Team.',
      'Competitions also follow the tournament rules and the rules of the specific game. The Terms of service and Privacy policy apply alongside these rules.',
      'If you are under 18, you need a parent or guardian’s permission to create an account or register for a tournament.',
    ],
  },
  {
    id: 'accounts',
    title: 'Your account',
    items: [
      'Sign in with your own Google account or email address. One person, one account.',
      'Keep your sign-in private. Never share your account, and never sign in as someone else.',
      'For your security, you are signed out after two hours of inactivity. Staff consoles sign out after one hour.',
      'Your name and photo come from your sign-in provider. Use a name that is not offensive or misleading.',
    ],
  },
  {
    id: 'registering',
    title: 'Registering for tournaments',
    items: [
      'Everything you enter must be true: team name, players, in-game names, game IDs and contact numbers.',
      'Only register players who have agreed to play and to share their details with the organisers.',
      'A player can be on one active entry per tournament. Duplicate players are refused automatically.',
      'You can correct names and IDs from your account until registration closes. After that, ask the organisers.',
      'If you can no longer play, withdraw from your account so the slot goes to another team.',
    ],
  },
  {
    id: 'lft',
    title: 'Looking for Team',
    items: [
      'Listings must describe you honestly: your real rank, roles and availability.',
      'Your contact details stay private until you choose to share them with a team that asked.',
      'Do not send repeated requests to the same player, and do not use listings for anything other than finding a team.',
    ],
  },
  {
    id: 'reports',
    title: 'AntiCheat reports',
    items: [
      'Report only what you genuinely believe is cheating, with real, unedited screenshots.',
      'Every report is reviewed by a person. A report is never a verdict on its own, and reviewers may ask you for more evidence.',
      'Do not publicly accuse or harass a reported player while a report is under review.',
      'Knowingly false or edited reports are treated as misconduct and can lead to action against the reporter.',
    ],
  },
  {
    id: 'content',
    title: 'Content you upload',
    items: [
      'Upload only images you have the right to share: team logos, posters and evidence screenshots.',
      'No explicit, violent, hateful or misleading content, and no personal information about other people beyond what a form asks for.',
      'Large images are shrunk in your browser before upload. Files that are not images are refused.',
    ],
  },
  {
    id: 'conduct',
    title: 'Behaviour',
    items: [
      'Treat players, staff and other visitors with respect, on the site and in Zenith’s community channels.',
      'Harassment, hate speech, threats, impersonation and spam are not allowed.',
      'Messages to Zenith through the contact, booking and inquiry forms should be genuine. Bulk or automated messages are blocked.',
    ],
  },
  {
    id: 'security',
    title: 'Security and fair use',
    items: [
      'Do not try to access staff consoles, other people’s registrations or data that is not shown to you.',
      'Do not scrape the site, run bots or automated submissions, or try to bypass rate limits and spam protection.',
      'Found a security problem? Tell us through the contact page instead of testing it further. We will thank you, not punish you.',
    ],
  },
  {
    id: 'enforcement',
    title: 'Enforcement and appeals',
    items: [
      'Depending on how serious a breach is, Zenith may warn you, remove content, reject or cancel registrations, suspend your account, or ban you from future events.',
      'Integrity breaches can be recorded as a ZenithAntiCheat flag, which is checked when you register for future Zenith competitions.',
      'You can appeal any decision through the contact page within 14 days. A different staff member reviews appeals.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes to these rules',
    items: ['We may update these rules. The date at the top shows when they last changed, and important changes are announced on our channels.'],
  },
]

// ─── tournament rules shared by every game ──────────────────────────────────

export const TOURNAMENT_RULES: RuleSection[] = [
  {
    id: 'order',
    title: 'Which rules apply',
    items: [
      'Every Zenith tournament follows, in this order: the tournament’s own page, the rulebook for its game, then these general tournament rules.',
      'Each game rulebook is based on that game’s official esports rules and adapted for Zenith events.',
      'Organisers interpret the rules. Their decision on match day is final, subject to appeal afterwards.',
    ],
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    items: [
      'Players must meet the eligibility shown on the tournament page, such as region, age or rank.',
      'Each player must play on their own game account. The game ID registered must belong to the player using it.',
      'A player may appear on only one active entry per tournament, including as a substitute.',
      'Players with an active ZenithAntiCheat flag for the same game may be refused or removed after review.',
    ],
  },
  {
    id: 'registration',
    title: 'Registration and rosters',
    items: [
      'Register before the deadline with the full roster the format needs. Substitutes are optional unless the tournament page says otherwise.',
      'Entries may need organiser approval. Rejections always come with a reason, and full tournaments can use a waitlist.',
      'Roster changes after registration closes need organiser approval and must not add a player already on another entry.',
      'Team names, tags and logos must not be offensive or imitate another team or brand.',
    ],
  },
  {
    id: 'matchday',
    title: 'Match day',
    items: [
      'Check in when asked and be in the lobby at the time shown. Room details are shared with registered captains only, and must not be passed on.',
      'Lateness: a team or player not ready 10 minutes after the scheduled start forfeits that match or game, unless the organisers have agreed a delay.',
      'Captains are the contact for their team on match day and must stay reachable on the channel the organisers set.',
      'Settings, maps and formats must match the game rulebook and the tournament page. Report any mistake before the match starts.',
    ],
  },
  {
    id: 'integrity',
    title: 'Fair play',
    items: [
      'Cheats, modified game clients, macros, scripts and unauthorised third-party software are prohibited.',
      'Deliberately using bugs or exploits, playing on another person’s account, teaming with opponents, match fixing and betting on your own matches are prohibited.',
      'Organisers may ask any player to share their screen, record their play or show their device and settings, before or after a match.',
      'Breaches lead to disqualification, loss of prizes and a ZenithAntiCheat flag that is checked against future registrations.',
    ],
  },
  {
    id: 'conduct',
    title: 'Conduct',
    items: [
      'Respect opponents, organisers, casters and viewers in game chat, voice, social media and on stream.',
      'Harassment, hate speech, threats and discrimination lead to removal from the competition.',
      'Follow organiser instructions promptly. Arguing with a decision during a match delays everyone; raise it afterwards.',
    ],
  },
  {
    id: 'results',
    title: 'Results, disputes and prizes',
    items: [
      'Results are confirmed by the organisers. Keep screenshots of every result and scoreboard until the tournament ends.',
      'Raise a dispute within 15 minutes of the match ending, with evidence. Late disputes are not considered unless they concern cheating.',
      'Prizes are shown on the tournament page and paid only to eligible teams that finished in good standing, to the captain or the account they nominate.',
    ],
  },
  {
    id: 'broadcast',
    title: 'Broadcast and media',
    items: [
      'Matches may be streamed and recorded by Zenith. Taking part means your name, team logo and gameplay may appear in Zenith broadcasts and posts.',
      'Players may stream their own point of view only if the tournament page allows it, with a delay of at least 3 minutes.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes and cancellation',
    items: [
      'Organisers may change schedules, formats or maps for reasons such as game updates or server problems. Registered teams are told first.',
      'If a tournament is cancelled, the reason is shown on its page.',
    ],
  },
]

// ─── game rulebooks ─────────────────────────────────────────────────────────

export type GameRulebook = { gameId: string; name: string; summary: string; sources: Source[]; sections: RuleSection[] }

export const GAME_RULES: GameRulebook[] = [
  {
    gameId: 'pubg-mobile',
    name: 'PUBG Mobile',
    summary: 'Squad battle royale on mobile, scored on placement and finishes.',
    sources: [
      { label: 'PUBG MOBILE Official Competition Rulebook, version 1.7.0 (30 January 2026)', url: 'https://esports.pubgmobile.com/static/doc/Competition_Rulebook_PUBGM_-_Version_1.7.0.pdf' },
      { label: 'PUBG Mobile Global Championship 2025 format and scoring', url: 'https://liquipedia.net/pubgmobile/PUBG_Mobile_Global_Championship/2025' },
    ],
    sections: [
      {
        id: 'format',
        title: 'Format',
        items: [
          'Squads of 4 players, with the number of substitutes set on the tournament page.',
          'Matches are played in custom rooms. Maps and their order for each match day are listed on the tournament page.',
          'Results are added up over all matches in a stage. The tournament page says how many matches each stage has and how many teams advance.',
        ],
      },
      {
        id: 'scoring',
        title: 'Scoring',
        intro: 'Placement points follow the PUBG Mobile Global Championship table.',
        items: [
          'Placement points per match: 1st 10, 2nd 6, 3rd 5, 4th 4, 5th 3, 6th 2, 7th 1, 8th 1, 9th and below 0.',
          'Finish points: 1 point for every enemy eliminated. There is no cap.',
          'Ties are broken by, in order: most Winner Winner Chicken Dinners, most placement points, most finish points, then the better placement in the most recent match.',
        ],
      },
      {
        id: 'devices',
        title: 'Devices and settings',
        items: [
          'Play only on a mobile phone running Android or iOS. Emulators and PC play are not allowed.',
          'Controllers, triggers, adapters, keyboards and mice are not allowed unless an organiser approves them before the match.',
          'Aim assist and sound visualisation must be turned off.',
          'Your character must stay fully clothed after leaving the lobby. Changing outfits for effect inside a match is not allowed.',
        ],
      },
      {
        id: 'room',
        title: 'Joining the room',
        items: [
          'Room ID and password are sent to captains shortly before each match. Do not share them with anyone outside your team.',
          'Join the correct slot for your team. Joining the wrong slot or a slot that is not yours can lead to removal from that match.',
          'A team that does not join before the room starts plays with the players present. A team with nobody in the room scores 0 for that match.',
        ],
      },
      {
        id: 'disconnects',
        title: 'Disconnections and rematches',
        items: [
          'Players who disconnect should reconnect straight away. The match is not paused or restarted for an individual disconnection.',
          'A match may be restarted only if a server problem affects many teams before the first elimination, or if the organisers judge it unplayable.',
          'Report any problem to the organisers immediately with a screenshot. Problems reported after the match ends are not grounds for a rematch.',
        ],
      },
      {
        id: 'prohibited',
        title: 'Prohibited',
        items: [
          'Modified game clients, cheat programs and signalling devices.',
          'Teaming: any agreement with players from another team not to compete, including sharing positions or avoiding each other.',
          'Intentionally using bugs or game functions that are not working as intended.',
          'Ringing: playing on another person’s account, or letting someone else play on yours.',
          'Knowingly playing public matches with a cheater in the 72 hours before an event can also lead to sanctions.',
        ],
      },
    ],
  },
  {
    gameId: 'free-fire',
    name: 'Free Fire',
    summary: 'Battle royale and Clash Squad on mobile, following the Free Fire World Series rules.',
    sources: [{ label: 'Free Fire World Series MEA 2025 Official Competition Rulebook (Garena)', url: 'https://liquipedia.net/commons/images/b/bf/FFWS_MEA_2025_Rulebook_(English).pdf' }],
    sections: [
      {
        id: 'format',
        title: 'Format',
        items: [
          'Squads of 4 players, with a roster of up to 5 unless the tournament page allows more.',
          'Battle royale matches rotate through Bermuda, Alpine, Kalahari, Nexterra, Purgatory and Solara. The order for each match day is on the tournament page.',
          'Finals may use Champion Rush: the first team to reach the points threshold shown on the tournament page and then win a Booyah is champion. If nobody does by the last match, the team with most points wins.',
        ],
      },
      {
        id: 'scoring',
        title: 'Scoring',
        items: [
          'Placement points per match: 1st 12, 2nd 9, 3rd 8, 4th 7, 5th 6, 6th 5, 7th 4, 8th 3, 9th 2, 10th 1, 11th and 12th 0.',
          'Elimination points: 1 point per elimination.',
          'Ties are broken by, in order: most Booyahs, most eliminations, then placement in the last match of the series.',
        ],
      },
      {
        id: 'settings',
        title: 'Room settings and characters',
        items: [
          'Room settings: no weapon attributes, revival on, death cam on, safe zone moving on, high-tier loot zones off. Whether loadouts are allowed is shown on the tournament page.',
          'Every player in a team must use a different active skill.',
          'Characters and pets are limited to the list on the tournament page, which follows the current Free Fire World Series list.',
          'Look Changer emotes are not allowed.',
        ],
      },
      {
        id: 'devices',
        title: 'Devices',
        items: [
          'Play only on a mobile phone. Emulators and PC play are not allowed.',
          'Peripherals such as controllers or triggers are not allowed unless an organiser approves them before the match.',
        ],
      },
      {
        id: 'remakes',
        title: 'Disconnections and remakes',
        items: [
          'A match counts once all players have loaded and the plane has entered the drop zone. After that, restarts are allowed only in limited cases.',
          'A remake is offered for a game-breaking bug only when all of these are true: it happened within the first 5 minutes, a referee was told straight away, no player had been eliminated yet, and the player did not cause it on purpose.',
          'Game-breaking bugs include being stuck in objects, falling through the floor, dying on landing and unexpected vehicle deaths.',
          'Quitting the game counts as an intentional disconnection, whatever the reason.',
        ],
      },
      {
        id: 'prohibited',
        title: 'Prohibited bugs and behaviour',
        items: [
          'Placing a gloo wall where you have no direct line of sight to trap or kill players through a building.',
          'Hiding in water while prone or crouched to shoot without being seen.',
          'Abusing the Falco pet skill to glide further, or landing in spots where you cannot be seen or reached.',
          'Abusing invisible floors to climb or shoot.',
          'Hacks, account sharing, teaming and watching other players’ phones or spectator screens.',
        ],
      },
    ],
  },
  {
    gameId: 'valorant',
    name: 'VALORANT',
    summary: '5v5 tactical shooter, following the VALORANT Champions Tour competition rules.',
    sources: [{ label: 'VALORANT Champions Tour Official Competition Ruleset (Riot Games, VCT EMEA 2024)', url: 'https://liquipedia.net/commons/images/4/40/VCT_2024_EMEA_Official_Competiton_Rulebook.pdf' }],
    sections: [
      {
        id: 'format',
        title: 'Format and lobby',
        items: [
          'Teams of 5 players. Substitutes and coaches are allowed as shown on the tournament page.',
          'Lobbies use Tournament mode with Overtime: Win by Two.',
          'Servers are chosen by the organisers for the lowest fair ping for both teams.',
          'Newly released agents are not allowed until two weeks after they reach the live Competitive queue.',
        ],
      },
      {
        id: 'maps',
        title: 'Map selection',
        intro: 'The map pool is the current Competitive pool of seven maps. The better-seeded team (or the coin-toss winner) chooses to be Team A or Team B. Bans cannot be skipped, and no map is played twice in a match.',
        items: [
          'Best of one: A bans, B bans, A bans, B bans, A bans, B bans. The last map is played and Team A picks the side.',
          'Best of three: A bans, B bans, A picks map 1 (B picks side), B picks map 2 (A picks side), A bans, B bans. The last map is map 3 and Team A picks the side.',
          'Best of five: A bans, B bans, then maps are picked in turn, with the other team choosing the side each time. The last remaining map is the decider.',
        ],
      },
      {
        id: 'timeouts',
        title: 'Timeouts and pauses',
        items: [
          'Each team has two 60-second tactical timeouts per map in regulation, and one more in overtime. Unused timeouts do not carry over to overtime.',
          'Timeouts must be called in the first 20 seconds of a buy phase. Later calls are moved to the next round.',
          'During any timeout or pause, players may not move or use abilities.',
          'Technical pauses are for real problems only, such as a disconnect, a frozen game or a failed peripheral. Tell the organisers the reason. Audio adjustments are not a valid reason.',
          'Each team has one emergency pause per map, up to 10 minutes in total across the match.',
        ],
      },
      {
        id: 'disconnects',
        title: 'Disconnections and restarts',
        items: [
          'If a player disconnects, the game is paused at the end of the round, or straight away if an organiser can do so, and the player reconnects.',
          'If a player disconnects before any damage is dealt in the first round, the map can be restarted.',
          'If a round cannot be completed fairly because of a server problem or a known bug, the organisers decide whether to replay from the last completed round or continue.',
        ],
      },
      {
        id: 'prohibited',
        title: 'Prohibited',
        items: [
          'Exploiting bugs, including agent and map exploits listed by Riot for the current patch.',
          'Cheats, macros, modified clients and unauthorised software.',
          'Playing on another person’s account, ghosting (getting information from the broadcast) and coaching during live rounds, except during timeouts.',
        ],
      },
    ],
  },
  {
    gameId: 'honor-of-kings',
    name: 'Honor of Kings',
    summary: '5v5 MOBA on mobile, following the Honor of Kings World Cup rules.',
    sources: [{ label: '2025 Honor of Kings World Cup Official Rulebook (Level Infinite / TiMi)', url: 'https://www.honorofkings.com/esports/kwc/rule.html' }],
    sections: [
      {
        id: 'format',
        title: 'Format and roster',
        items: [
          'Teams play 5 starters, with up to 2 substitutes. The roster is locked once submitted.',
          'Games are played on Hero’s Gorge in tournament rooms. The tournament page shows whether each match is best of 1, 3, 5 or 7.',
          'Substitutions between games must be agreed with a referee no later than 5 minutes after the previous game ends. Substitutions during a game are allowed only for emergencies.',
          'Surrendering is not allowed. Play every game to the end.',
        ],
      },
      {
        id: 'draft',
        title: 'Draft (ban and pick)',
        items: [
          'Order: Blue ban, Red ban, Blue ban, Red ban; Blue pick, Red picks 2, Blue picks 2, Red pick; Red ban, Blue ban, Red ban, Blue ban; Red pick, Blue picks 2, Red pick; then hero trades.',
          'Each action has 30 seconds, the final picks have 45 seconds, and hero trades have 20 seconds.',
          'Global Ban&Pick: a hero a team has used in an earlier game of the match cannot be picked by that team again in the same match.',
          'The Help Pick feature is not allowed. Mistakes during the draft, such as a wrong tap or a missed timer, are not reset.',
        ],
      },
      {
        id: 'sides',
        title: 'Sides',
        items: [
          'Game 1 sides are decided by coin toss.',
          'For each later game, the team that lost the previous game chooses Blue or Red within 2 minutes. If they do not, the organisers decide.',
        ],
      },
      {
        id: 'pauses',
        title: 'Pauses and remakes',
        items: [
          'Valid reasons to pause: a disconnection from the game or voice chat, ping of 100 ms or higher, or sudden illness or injury.',
          'Ask for a pause straight away and tell the organisers why. Players cannot unpause the game themselves.',
          'If a game is remade, statistics from before the remake are discarded and the organisers decide whether the draft is kept.',
          'Deliberate disconnections never justify a pause.',
        ],
      },
      {
        id: 'devices',
        title: 'Devices',
        items: [
          'Play on a phone or tablet. Emulators on PC or any non-handheld device are not allowed.',
          'Controllers, keyboards, mice and adapters need organiser approval.',
          'Organisers may restrict heroes, skins or items with known bugs for the current version.',
        ],
      },
      {
        id: 'lateness',
        title: 'Lateness',
        items: [
          'Up to 5 minutes late: warning.',
          '5 to 15 minutes late: the team loses its bans in the first game.',
          'More than 15 minutes late: the team forfeits the first game. More than 30 minutes late: the team forfeits the match.',
        ],
      },
      {
        id: 'prohibited',
        title: 'Prohibited',
        items: [
          'Cheating, modified clients, signalling devices and any gesture that gives an unfair advantage.',
          'Using bugs or abusing game mechanics on purpose.',
          'Playing on another person’s account, boosting, collusion and match fixing.',
          'Insulting or harassing anyone in game chat.',
        ],
      },
    ],
  },
  {
    gameId: 'tekken-8',
    name: 'TEKKEN 8',
    summary: '1v1 fighting, following the TEKKEN World Tour official rules.',
    sources: [{ label: 'TEKKEN World Tour Official Rules (Bandai Namco Entertainment)', url: 'https://www.bandainamcoent.com/legal/community-events/official-rules-twt' }],
    sections: [
      {
        id: 'format',
        title: 'Format',
        items: [
          'Double elimination. A player who loses in the winners bracket drops to the losers bracket; a second loss eliminates them.',
          'Matches are best of 3 games. From the top 8 onwards (winners semi-finals, losers bracket from round 1 of top 8, winners final, losers final and grand final) matches are best of 5.',
          'Grand final: if the player from the losers bracket wins the first best-of-5, a second best-of-5 is played to decide the champion.',
          'Played on the latest version of TEKKEN 8 on the platform shown on the tournament page (PlayStation 5, Xbox Series X|S or PC).',
        ],
      },
      {
        id: 'settings',
        title: 'Game settings',
        items: [
          'Versus mode, Tournament settings on Default, with In-Battle Status Settings on.',
          'Rounds: 3 out of 5. Time limit: 60 seconds per round. Stage: random.',
          'Special Style is allowed. Character customisations are off; preset costumes are allowed.',
          'If a game ends in a draw from a double KO or time out, it does not count and is replayed with the same characters.',
        ],
      },
      {
        id: 'characters',
        title: 'Characters and sides',
        items: [
          'The winner of a game must keep the same character. The loser may change character, which brings a new random stage.',
          'Either player can ask for a blind pick for the first game: both tell an organiser their character privately before choosing.',
          'Players agree on sides (player 1 or 2). If they cannot, best-of-3 rock, paper, scissors decides, and the choice holds for the whole match.',
        ],
      },
      {
        id: 'pausing',
        title: 'Pausing and interruptions',
        items: [
          'Pausing the game, on purpose or by accident (including unplugging your controller), loses you the current round.',
          'If the interruption is outside the players’ control, such as a game crash or another controller, the game restarts at the same round count.',
          'If a round was already decided when the pause happened (the final hit had landed with no more inputs possible), the round stands.',
        ],
      },
      {
        id: 'controllers',
        title: 'Controllers',
        items: [
          'Bring your own controller. Turbo, macros and programmable functions are not allowed.',
          'One button may not trigger several inputs, or a direction and an attack together. Organisers may inspect controllers.',
          'For online events, play on a wired internet connection. The lobby host is the higher seed unless both players agree otherwise.',
        ],
      },
      {
        id: 'coaching',
        title: 'Coaching and timing',
        items: [
          'Coaching is allowed only between games, only for the player who lost the previous game, once per match for up to one minute.',
          'Coaching during a live game forfeits that game after one warning.',
          'Be ready within 10 minutes of being called, or the match is forfeited.',
        ],
      },
    ],
  },
  {
    gameId: 'ea-fc',
    name: 'EA SPORTS FC',
    summary: '1v1 football, following the EA SPORTS FC Pro competition rules.',
    sources: [
      { label: 'EA SPORTS FC Pro Open 26 Event Rules (Electronic Arts)', url: 'https://www.ea.com/games/ea-sports-fc/fc-pro/ea-sports-fc-pro-open-26-event-rules' },
      { label: 'EA SPORTS FC Pro Open Cups 26 Event Rules (Electronic Arts)', url: 'https://www.ea.com/games/ea-sports-fc/fc-pro/ea-sports-fc-pro-open-cups-26-event-rules' },
    ],
    sections: [
      {
        id: 'format',
        title: 'Format',
        items: [
          '1v1 on the current EA SPORTS FC. The tournament page shows the game mode, platform and whether cross-play is used.',
          'Each match is a single game of two halves. Group stages give 3 points for a win, 1 for a draw and 0 for a loss.',
          'In knockout matches, a draw goes to extra time and then penalties.',
          'Group ties are broken by goals scored, then head-to-head, goal difference between the tied players, goals scored between them, and finally a rematch.',
        ],
      },
      {
        id: 'settings',
        title: 'Match settings',
        items: [
          'Half length: 9 minutes, unless the tournament page says otherwise. Game 1 tiebreaker: extra time.',
          'Home team kicks off. The higher seed hosts in knockout matches; in groups the organisers set who hosts.',
          'Kit clashes: the home player has priority.',
          'Play on a wired controller and connection. Macros, turbo functions and modified hardware or software are not allowed.',
        ],
      },
      {
        id: 'pausing',
        title: 'Pausing',
        items: [
          'Up to 3 pauses per player per half, and only when the ball is out of play.',
          'Pausing to waste time or break the opponent’s rhythm is not allowed and can be penalised.',
        ],
      },
      {
        id: 'disconnects',
        title: 'Disconnections',
        items: [
          'If a match disconnects, take a screenshot showing the score and the minute, and tell the organisers straight away.',
          'A disconnection in the first 10 in-game minutes restarts the match from 0–0. After that, the match is replayed for the remaining time with the score kept.',
          'A player who disconnects on purpose forfeits the match.',
          'If a match is played past half time with the wrong settings before anyone reports it, the result stands.',
        ],
      },
      {
        id: 'results',
        title: 'Results and forfeits',
        items: [
          'Both players report the score with a screenshot of the full-time screen.',
          'A player who does not show up in time forfeits. A forfeit counts as a 3–0 win for the opponent.',
          'A player found breaking the rules loses the match 3–0, or by the margin they were behind when it was reported if that is larger.',
          'Each player uses only their own EA account. Sharing logins is not allowed.',
        ],
      },
    ],
  },
]

export const gameRulebook = (id: string) => GAME_RULES.find((g) => g.gameId === id) ?? null
