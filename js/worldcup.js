/* ============================================================================
   WORLD CUP MODE
   ----------------------------------------------------------------------------
   A national-team tournament that runs alongside the Champions League and My
   Club modes. 48 nations, 12 groups of 4 (single round-robin), the top two of
   each group plus the eight best third-placed teams advance to a 32-team
   single-elimination bracket (R32 -> R16 -> QF -> SF -> Final). Knockout ties
   are one leg with extra time and penalties; group games can be drawn.

   The mode reuses the shared match engine (preparePlayerMatch / beginMatch /
   endMatch) by registering each nation in TEAM_ROSTERS, FIFA_RANKINGS and
   teamColors, and by routing match completion through wcEndMatch() from
   engine.js when currentMode === "worldcup".
   ============================================================================ */

/* ---------------------------------------------------------------- data ---- */

/* Each nation: name, 3-letter code, primary shirt colour, world rank (1 = best)
   and an XI given as [GK, DF x4, MF x3, AT x3] surnames. Overall ratings are
   derived from the rank at load time so the field spreads from ~87 to ~66. */
const WC_NATIONS = [
  { name: "France", code: "FRA", color: "#0055A4", rank: 1, xi: ["Maignan", "Saliba", "Upamecano", "Kounde", "Theo Hernandez", "Tchouameni", "Camavinga", "Griezmann", "Mbappe", "Dembele", "Kolo Muani"] },
  { name: "Argentina", code: "ARG", color: "#6CACE4", rank: 2, xi: ["E. Martinez", "Molina", "Romero", "Otamendi", "Tagliafico", "De Paul", "Enzo Fernandez", "Mac Allister", "Messi", "J. Alvarez", "Lautaro"] },
  { name: "Spain", code: "ESP", color: "#C60B1E", rank: 3, xi: ["Simon", "Carvajal", "Le Normand", "Laporte", "Cucurella", "Rodri", "Pedri", "Olmo", "Yamal", "Morata", "N. Williams"] },
  { name: "Brazil", code: "BRA", color: "#FFDF00", rank: 4, xi: ["Alisson", "Marquinhos", "Militao", "Danilo", "Wendell", "Casemiro", "Guimaraes", "Paqueta", "Vinicius", "Rodrygo", "Raphinha"] },
  { name: "England", code: "ENG", color: "#FFFFFF", rank: 5, xi: ["Pickford", "Walker", "Stones", "Guehi", "Trippier", "Rice", "Bellingham", "Foden", "Saka", "Kane", "Watkins"] },
  { name: "Portugal", code: "POR", color: "#006600", rank: 6, xi: ["D. Costa", "Cancelo", "R. Dias", "Pepe", "Mendes", "Palhinha", "B. Fernandes", "B. Silva", "Ronaldo", "Leao", "G. Ramos"] },
  { name: "Netherlands", code: "NED", color: "#FF6200", rank: 7, xi: ["Verbruggen", "Dumfries", "Van Dijk", "De Ligt", "Ake", "De Jong", "Reijnders", "X. Simons", "Depay", "Gakpo", "Weghorst"] },
  { name: "Germany", code: "GER", color: "#1A1A1A", rank: 8, xi: ["Neuer", "Kimmich", "Rudiger", "Tah", "Raum", "Andrich", "Musiala", "Wirtz", "Havertz", "Gnabry", "Fullkrug"] },
  { name: "Belgium", code: "BEL", color: "#E30613", rank: 9, xi: ["Casteels", "Castagne", "Faes", "Theate", "De Cuyper", "Tielemans", "De Bruyne", "Onana", "Doku", "Lukaku", "Trossard"] },
  { name: "Italy", code: "ITA", color: "#1E478A", rank: 10, xi: ["Donnarumma", "Di Lorenzo", "Bastoni", "Calafiori", "Dimarco", "Barella", "Jorginho", "Frattesi", "Chiesa", "Retegui", "Scamacca"] },
  { name: "Croatia", code: "CRO", color: "#FF0000", rank: 11, xi: ["Livakovic", "Stanisic", "Gvardiol", "Sutalo", "Sosa", "Modric", "Kovacic", "Majer", "Kramaric", "Pasalic", "Budimir"] },
  { name: "Morocco", code: "MAR", color: "#C1272D", rank: 12, xi: ["Bono", "Hakimi", "Aguerd", "Saiss", "Mazraoui", "Amrabat", "Ounahi", "Ziyech", "En-Nesyri", "Boufal", "Brahim Diaz"] },
  { name: "Colombia", code: "COL", color: "#FCD116", rank: 13, xi: ["Vargas", "Munoz", "Sanchez", "Lucumi", "Mojica", "Lerma", "Uribe", "J. Rodriguez", "L. Diaz", "Cortes", "Borre"] },
  { name: "Uruguay", code: "URU", color: "#5CBFEB", rank: 14, xi: ["Rochet", "Araujo", "Gimenez", "Caceres", "Olivera", "Valverde", "Ugarte", "De la Cruz", "Nunez", "Pellistri", "Maxi Gomez"] },
  { name: "Japan", code: "JPN", color: "#000080", rank: 15, xi: ["Suzuki", "Sugawara", "Tomiyasu", "Itakura", "Ito", "Endo", "Kamada", "Kubo", "Mitoma", "Minamino", "Ueda"] },
  { name: "Denmark", code: "DEN", color: "#C60C30", rank: 16, xi: ["Schmeichel", "Christensen", "Andersen", "Vestergaard", "Kristiansen", "Hojbjerg", "Eriksen", "Hjulmand", "Damsgaard", "Hojlund", "Skov Olsen"] },
  { name: "Mexico", code: "MEX", color: "#006847", rank: 17, xi: ["Ochoa", "Sanchez", "Montes", "Vasquez", "Gallardo", "E. Alvarez", "Romo", "Chavez", "Lozano", "S. Gimenez", "H. Martin"] },
  { name: "United States", code: "USA", color: "#3C3B6E", rank: 18, xi: ["Turner", "Dest", "Richards", "Ream", "Robinson", "Adams", "McKennie", "Musah", "Pulisic", "Weah", "Balogun"] },
  { name: "Senegal", code: "SEN", color: "#00853F", rank: 19, xi: ["E. Mendy", "Sabaly", "Koulibaly", "Diallo", "Jakobs", "Gueye", "Ciss", "Sarr", "Mane", "Jackson", "Diatta"] },
  { name: "Switzerland", code: "SUI", color: "#FF0000", rank: 20, xi: ["Sommer", "Widmer", "Akanji", "Schar", "Rodriguez", "Xhaka", "Freuler", "Aebischer", "Shaqiri", "Embolo", "Ndoye"] },
  { name: "Serbia", code: "SRB", color: "#C6363C", rank: 21, xi: ["Rajkovic", "Pavlovic", "Milenkovic", "Veljkovic", "Zivkovic", "Milinkovic-Savic", "Gudelj", "Tadic", "Vlahovic", "Mitrovic", "Kostov"] },
  { name: "Austria", code: "AUT", color: "#ED2939", rank: 22, xi: ["Pentz", "Posch", "Danso", "Lienhart", "Mwene", "Sabitzer", "Laimer", "Seiwald", "Baumgartner", "Arnautovic", "Gregoritsch"] },
  { name: "Turkey", code: "TUR", color: "#E30A17", rank: 23, xi: ["Cakir", "Muldur", "Bardakci", "Akaydin", "Kadioglu", "Calhanoglu", "Yuksek", "Guler", "Yildiz", "Kokcu", "Yilmaz"] },
  { name: "Nigeria", code: "NGA", color: "#008751", rank: 24, xi: ["Nwabali", "Aina", "Troost-Ekong", "Ajayi", "Bassey", "Iwobi", "Onyeka", "Chukwueze", "Osimhen", "Lookman", "Iheanacho"] },
  { name: "Poland", code: "POL", color: "#DC143C", rank: 25, xi: ["Szczesny", "Cash", "Kiwior", "Bednarek", "Zalewski", "Zielinski", "Szymanski", "Slisz", "Lewandowski", "Swiderski", "Buksa"] },
  { name: "Ecuador", code: "ECU", color: "#FFD100", rank: 26, xi: ["Dominguez", "Preciado", "Torres", "Hincapie", "Estupinan", "Caicedo", "Franco", "Paez", "Valencia", "Sarmiento", "G. Rodriguez"] },
  { name: "Egypt", code: "EGY", color: "#C8102E", rank: 27, xi: ["El Shenawy", "Hafez", "Hegazi", "Abdelmonem", "Hamdi", "Elneny", "Fathi", "Trezeguet", "Salah", "Marmoush", "Zizo"] },
  { name: "Algeria", code: "ALG", color: "#007A3D", rank: 28, xi: ["Mandrea", "Mandi", "Bensebaini", "Tougai", "Ait-Nouri", "Bennacer", "Zerrouki", "Amoura", "Mahrez", "Slimani", "Belaid"] },
  { name: "Ivory Coast", code: "CIV", color: "#FF8200", rank: 29, xi: ["Fofana", "Aurier", "Kossounou", "Ndicka", "Konan", "Kessie", "Sangare", "Seri", "Haller", "Gradel", "Diakite"] },
  { name: "South Korea", code: "KOR", color: "#C60C30", rank: 30, xi: ["Jo", "Seol", "Kim Min-jae", "Kim Young-gwon", "Kim Jin-su", "Hwang In-beom", "Park", "Lee Jae-sung", "Son", "Hwang Hee-chan", "Cho"] },
  { name: "Iran", code: "IRN", color: "#239F40", rank: 31, xi: ["Beiranvand", "Moharrami", "Kanaanizadegan", "Hosseini", "Mohammadi", "Ezatolahi", "Ghoddos", "Hajsafi", "Taremi", "Azmoun", "Jahanbakhsh"] },
  { name: "Norway", code: "NOR", color: "#BA0C2F", rank: 32, xi: ["Nyland", "Pedersen", "Ajer", "Ostigard", "Ryerson", "Odegaard", "Berge", "Strandberg", "Haaland", "Sorloth", "Nusa"] },
  { name: "Cameroon", code: "CMR", color: "#007A5E", rank: 33, xi: ["Onana", "Castelletto", "Nkoulou", "Wooh", "Tolo", "Anguissa", "Ntcham", "Mbeumo", "Aboubakar", "Choupo-Moting", "Toko Ekambi"] },
  { name: "Ghana", code: "GHA", color: "#006B3F", rank: 34, xi: ["Ati-Zigi", "Lamptey", "Salisu", "Djiku", "Mensah", "Partey", "Kudus", "Sulemana", "J. Ayew", "Semenyo", "Williams"] },
  { name: "Scotland", code: "SCO", color: "#0065BF", rank: 35, xi: ["Gunn", "Hendry", "Porteous", "McKenna", "Robertson", "McTominay", "McGinn", "Gilmour", "Christie", "Adams", "Dykes"] },
  { name: "Canada", code: "CAN", color: "#FF0000", rank: 36, xi: ["Crepeau", "Johnston", "Miller", "Vitoria", "Davies", "Kone", "Eustaquio", "Buchanan", "David", "Larin", "Shaffelburg"] },
  { name: "Australia", code: "AUS", color: "#FFCD00", rank: 37, xi: ["Ryan", "Souttar", "Rowles", "Atkinson", "Behich", "Irvine", "Baccus", "McGree", "Boyle", "Duke", "Borrello"] },
  { name: "Tunisia", code: "TUN", color: "#E70013", rank: 38, xi: ["Dahmen", "Kechrida", "Talbi", "Bronn", "Abdi", "Skhiri", "Laidouni", "Msakni", "Jaziri", "Khazri", "Ben Romdhane"] },
  { name: "Costa Rica", code: "CRC", color: "#002B7F", rank: 39, xi: ["Navas", "Fuller", "Calvo", "Vargas", "Oviedo", "Aguilera", "Borges", "Tejeda", "Campbell", "Contreras", "Ugalde"] },
  { name: "Saudi Arabia", code: "KSA", color: "#006C35", rank: 40, xi: ["Al-Owais", "Al-Bulaihi", "Al-Tambakti", "Al-Amri", "Al-Boushal", "Kanno", "Al-Faraj", "Al-Najei", "Al-Dawsari", "Al-Shehri", "Al-Buraikan"] },
  { name: "Qatar", code: "QAT", color: "#8A1538", rank: 41, xi: ["Barsham", "Miguel", "Khoukhi", "Salman", "Hassan", "Boudiaf", "Waad", "Hatem", "Afif", "Almoez Ali", "Abdurisag"] },
  { name: "Iraq", code: "IRQ", color: "#CE1126", rank: 42, xi: ["Jalal", "Bayesh", "Rebin", "Zaid", "Merchas", "Al-Rasan", "Amyn", "Jasim", "Hussein", "Aymen", "Mohanad"] },
  { name: "Uzbekistan", code: "UZB", color: "#1EB53A", rank: 43, xi: ["Yusupov", "Khusanov", "Eshmuradov", "Ashurmatov", "Abdullaev", "Urunov", "Fayzullaev", "Masharipov", "Shomurodov", "Ikromov", "Tukhtasinov"] },
  { name: "Jamaica", code: "JAM", color: "#009B3A", rank: 44, xi: ["Blake", "Lowe", "King", "Pinnock", "Leigh", "Nicholson", "Hector", "Johnson", "Bailey", "Gray", "Decordova-Reid"] },
  { name: "Panama", code: "PAN", color: "#005293", rank: 45, xi: ["Mosquera", "Murillo", "Escobar", "Andrade", "Davis", "Godoy", "Martinez", "Carrasquilla", "Fajardo", "Quintero", "Thomas"] },
  { name: "DR Congo", code: "COD", color: "#007FFF", rank: 46, xi: ["Mpasi", "Mbemba", "Masuaku", "Batubinsika", "Kayembe", "Moutoussamy", "Mukiele", "Bongonda", "Bakambu", "Wissa", "Kalulu"] },
  { name: "Chile", code: "CHI", color: "#D52B1E", rank: 47, xi: ["Bravo", "Isla", "Medel", "Maripan", "Suazo", "Vidal", "Pulgar", "Nunez", "Sanchez", "Vargas", "Brereton"] },
  { name: "New Zealand", code: "NZL", color: "#1A1A1A", rank: 48, xi: ["Crocombe", "Stamenic", "Boxall", "Payne", "Cacace", "Bell", "Garbett", "Lewis", "Wood", "Waine", "Just"] }
];

const WC_POS_ROLE = { GK: "goalkeeper", DF: "defender", MF: "midfielder", AT: "attacker" };
const WC_XI_PLAN = ["GK", "DF", "DF", "DF", "DF", "MF", "MF", "MF", "AT", "AT", "AT"];
const WC_OVR_OFFSET = { GK: 2, DF: -1, MF: 1, AT: 3 };

function wcHash(str) {
  let h = 2166136261;
  const s = String(str);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0);
}

function wcBaseOvr(rank) {
  const v = Math.round(87 - (rank - 1) * 0.45);
  return Math.max(64, Math.min(87, v));
}

/* Register every nation with the shared systems: a roster for the match engine,
   a colour for the kits, a code for scorelines, and a world rank for strength. */
(function wcRegisterNations() {
  for (const nat of WC_NATIONS) {
    const base = wcBaseOvr(nat.rank);
    const roster = { defenders: [], midfielders: [], attackers: [], goalkeeper: null };
    for (let i = 0; i < WC_XI_PLAN.length; i++) {
      const pos = WC_XI_PLAN[i];
      const role = WC_POS_ROLE[pos];
      const name = nat.xi[i] || (pos + (i + 1));
      const jitter = (wcHash(nat.name + name + i) % 5) - 2;
      const ovr = Math.max(48, Math.min(94, base + WC_OVR_OFFSET[pos] + jitter));
      const p = makeRatedPlayer(name, ovr, role);
      if (pos === "GK") roster.goalkeeper = p;
      else if (pos === "DF") roster.defenders.push(p);
      else if (pos === "MF") roster.midfielders.push(p);
      else roster.attackers.push(p);
    }
    TEAM_ROSTERS[nat.name] = roster;
    if (typeof makeSquadDepth === "function") {
      const depth = makeSquadDepth(roster, nat.name);
      roster.bench = depth.bench;
      roster.reserves = depth.reserves;
    }
    teamColors[nat.name] = nat.color;
    if (typeof FIFA_CODES !== "undefined") FIFA_CODES[nat.name] = nat.code;
    FIFA_RANKINGS[nat.name] = nat.rank;
  }
  if (typeof myClubCardSeq !== "undefined" && !myClubCardSeq) { /* no-op */ }
})();

const WC_NATION_BY_NAME = {};
for (const nat of WC_NATIONS) WC_NATION_BY_NAME[nat.name] = nat;

const WC_GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const WC_KO_ROUNDS = [
  { key: "roundOf32", title: "Round of 32", ties: 16 },
  { key: "roundOf16", title: "Round of 16", ties: 8 },
  { key: "quarterfinals", title: "Quarter-finals", ties: 4 },
  { key: "semifinals", title: "Semi-finals", ties: 2 },
  { key: "final", title: "Final", ties: 1 }
];
const WC_STORAGE_KEY = "wcTournament_v1";

/* ---------------------------------------------------------------- state --- */

let wcState = null;      // the tournament
let wcContext = null;    // the live match context ({ opponent }), read by engine.js
let wcMidMatch = false;  // hub opened while a live match is in progress

function wcSave() {
  try { localStorage.setItem(WC_STORAGE_KEY, JSON.stringify(wcState)); } catch (e) {}
}

function wcNews(head, body) {
  if (!wcState) return;
  if (!Array.isArray(wcState.news)) wcState.news = [];
  wcState.news.unshift({ head: head, body: body });
  if (wcState.news.length > 8) wcState.news.length = 8;
}

function wcLoad() {
  try {
    const raw = localStorage.getItem(WC_STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !Array.isArray(s.groups) || !s.selectedNation) return null;
    return s;
  } catch (e) { return null; }
}

function wcClearSave() {
  try { localStorage.removeItem(WC_STORAGE_KEY); } catch (e) {}
}

/* ------------------------------------------------------------- setup UI --- */

function startModeWorldCup() {
  currentMode = "worldcup";
  if (typeof TeamEdits !== "undefined" && TeamEdits.exitCareer) TeamEdits.exitCareer();
  document.getElementById("modeSelectScreen").style.display = "none";
  const saved = wcLoad();
  if (saved) { wcState = saved; wcShowHub(); }
  else { wcShowSetup(); }
}

function wcShowSetup() {
  const body = document.getElementById("wcBody");
  if (!body) return;
  document.getElementById("gameScreen").style.display = "none";
  document.getElementById("bracketScreen").style.display = "none";
  const title = document.getElementById("wcTitle");
  if (title) title.textContent = "World Cup";
  const sub = document.getElementById("wcSubtitle");
  if (sub) sub.textContent = "Pick your nation and lead them to the trophy.";
  body.innerHTML = `
    <div class="wcSetup">
      <div class="wcSetupName">
        <label for="wcNameInput">YOUR NAME</label>
        <input id="wcNameInput" type="text" maxlength="16" placeholder="Enter your name...">
      </div>
      <div class="wcNationHead">Choose your nation</div>
      <div class="wcNationGrid">
        ${WC_NATIONS.map(n => `
          <button class="wcNationBtn" data-nation="${n.name}" onclick="wcChooseNation('${n.name.replace(/'/g, "\\'")}')">
            <span class="wcNationCode">${n.code}</span>
            <span class="wcNationName">${n.name}</span>
          </button>`).join("")}
      </div>
      <div class="wcSetupMsg" id="wcSetupMsg"></div>
      <div class="wcSetupActions">
        <button class="wcPrimaryBtn" onclick="wcBeginFromSetup()">Start World Cup</button>
        <button class="wcGhostBtn" onclick="wcQuitToMenu()">Back</button>
      </div>
    </div>`;
  document.getElementById("worldCupScreen").style.display = "block";
  if (typeof enterScreen === "function") enterScreen("worldCupScreen", "block");
}

function wcChooseNation(name) {
  if (!WC_NATION_BY_NAME[name]) return;
  wcSelectedNation = name;
  document.querySelectorAll(".wcNationBtn").forEach(b =>
    b.classList.toggle("sel", b.getAttribute("data-nation") === name));
  const msg = document.getElementById("wcSetupMsg");
  if (msg) msg.textContent = "";
}

let wcSelectedNation = null;

function wcBeginFromSetup() {
  const msg = document.getElementById("wcSetupMsg");
  if (!wcSelectedNation) { if (msg) msg.textContent = "Pick a nation first."; return; }
  const input = document.getElementById("wcNameInput");
  const name = input ? input.value.trim() : "";
  wcStartTournament(wcSelectedNation, name || "YOU");
}

/* --------------------------------------------------------- tournament ----- */

function wcStartTournament(nation, playerName2) {
  const field = shuffle([...WC_NATIONS.map(n => n.name)]);
  const groups = [];
  for (let g = 0; g < 12; g++) {
    const teamsInGroup = field.slice(g * 4, g * 4 + 4);
    groups.push(wcBuildGroup(WC_GROUP_LETTERS[g], teamsInGroup));
  }
  wcState = {
    v: 1,
    selectedNation: nation,
    playerName: playerName2,
    groups: groups,
    knockout: [],
    stage: "groups",
    champion: null,
    eliminated: false,
    news: [{ head: nation + " begin their World Cup campaign", body: "The squad has arrived at the tournament and the group-stage fixtures are set." }],
    createdAt: Date.now()
  };
  selectedTeam = nation;
  wcSave();
  wcShowHub();
}

function wcBuildGroup(letter, teamsInGroup) {
  const pairs = [
    [[0, 1], [2, 3]],
    [[0, 2], [1, 3]],
    [[0, 3], [1, 2]]
  ];
  const matches = [];
  for (let r = 0; r < pairs.length; r++) {
    for (const [a, b] of pairs[r]) {
      const m = createMatch(teamsInGroup[a], teamsInGroup[b]);
      m.round = r + 1;
      matches.push(m);
    }
  }
  return { name: letter, teams: [...teamsInGroup], matches: matches };
}

/* ------------------------------------------------------ group standings --- */

function wcGroupStandings(group) {
  return computeGroupStandings(group);
}

function wcGroupOf(team) {
  return (wcState.groups || []).find(g => g.teams.includes(team)) || null;
}

function wcAllGroupMatchesPlayed() {
  return (wcState.groups || []).every(g => g.matches.every(m => m.played));
}

function wcBestThirds() {
  const thirds = [];
  for (const g of wcState.groups) {
    const st = wcGroupStandings(g);
    if (st[2]) thirds.push(st[2]);
  }
  thirds.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
  return thirds.slice(0, 8).map(r => r.team);
}

/* Build the 32-team single-elimination bracket from the completed groups.
   Seeds: group winners (best record first), then runners-up, then the eight
   best third-placed teams. Standard 1 v 32, 2 v 31, ... seeding, with a light
   shuffle to avoid two teams from the same group meeting in the first round. */
function wcBuildKnockout() {
  const winners = [], runners = [], thirds = [];
  for (const g of wcState.groups) {
    const st = wcGroupStandings(g);
    if (st[0]) winners.push({ team: st[0].team, ...st[0] });
    if (st[1]) runners.push({ team: st[1].team, ...st[1] });
    if (st[2]) thirds.push({ team: st[2].team, ...st[2], group: g.name });
  }
  const byRecord = (a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf;
  winners.sort(byRecord);
  runners.sort(byRecord);
  thirds.sort(byRecord);
  const bestThirds = thirds.slice(0, 8);

  const seeds = [
    ...winners.map(r => r.team),
    ...runners.map(r => r.team),
    ...bestThirds.map(r => r.team)
  ];

  const ties = [];
  for (let i = 0; i < 16; i++) ties.push({ team1: seeds[i], team2: seeds[31 - i], score1: null, score2: null, winner: null, played: false });
  wcAvoidSameGroup(ties, seeds);

  const knockout = [];
  for (const def of WC_KO_ROUNDS) {
    const roundTies = [];
    for (let i = 0; i < def.ties; i++) {
      const isFirst = def.key === "roundOf32";
      roundTies.push({
        team1: isFirst ? ties[i].team1 : null,
        team2: isFirst ? ties[i].team2 : null,
        score1: null, score2: null, winner: null, played: false,
        pens1: null, pens2: null, decidedBy: null
      });
    }
    knockout.push({ key: def.key, title: def.title, ties: roundTies });
  }
  wcState.knockout = knockout;
  wcState.stage = "knockout";
}

/* Swap first-round opponents until no tie pits two teams from the same group. */
function wcAvoidSameGroup(ties, seeds) {
  const groupOf = {};
  for (const g of wcState.groups) for (const t of g.teams) groupOf[t] = g.name;
  const clash = t => t.team1 && t.team2 && groupOf[t.team1] === groupOf[t.team2];
  for (let pass = 0; pass < 40; pass++) {
    const bad = ties.find(clash);
    if (!bad) return;
    const i = ties.indexOf(bad);
    let swapped = false;
    for (let j = 0; j < ties.length && !swapped; j++) {
      if (j === i) continue;
      const other = ties[j];
      const a = bad.team2, b = other.team2;
      if (groupOf[bad.team1] !== groupOf[b] && groupOf[other.team1] !== groupOf[a]) {
        bad.team2 = b; other.team2 = a; swapped = true;
      }
    }
    if (!swapped) return;
  }
}

function wcRoundIndex(key) {
  return WC_KO_ROUNDS.findIndex(r => r.key === key);
}

function wcRoundByKey(key) {
  return (wcState.knockout || []).find(r => r.key === key) || null;
}

/* When a round is fully played, fill the next round's slots from its winners. */
function wcFillNextRound(roundKey) {
  const idx = wcRoundIndex(roundKey);
  if (idx < 0 || idx >= WC_KO_ROUNDS.length - 1) return;
  const round = wcRoundByKey(roundKey);
  if (!round || !round.ties.every(t => t.played)) return;
  const next = wcRoundByKey(WC_KO_ROUNDS[idx + 1].key);
  if (!next) return;
  for (let j = 0; j < next.ties.length; j++) {
    const t1 = round.ties[j * 2], t2 = round.ties[j * 2 + 1];
    if (t1 && t1.winner && !next.ties[j].team1) next.ties[j].team1 = t1.winner;
    if (t2 && t2.winner && !next.ties[j].team2) next.ties[j].team2 = t2.winner;
  }
}

/* Simulate every knockout tie that is ready and does not involve the user. */
function wcSimRemainingKnockout() {
  let progressed = true;
  let guard = 0;
  while (progressed && guard++ < 20) {
    progressed = false;
    for (const def of WC_KO_ROUNDS) {
      const round = wcRoundByKey(def.key);
      if (!round) continue;
      for (const tie of round.ties) {
        if (tie.played) continue;
        if (!tie.team1 || !tie.team2) continue;
        if (tie.team1 === wcState.selectedNation || tie.team2 === wcState.selectedNation) continue;
        wcSimTie(tie);
        progressed = true;
      }
      wcFillNextRound(def.key);
    }
  }
  const fin = wcRoundByKey("final");
  if (fin && fin.ties[0] && fin.ties[0].played) {
    wcState.champion = fin.ties[0].winner;
    wcState.stage = "complete";
  }
}

function wcSimTie(tie) {
  const m = { team1: tie.team1, team2: tie.team2, score1: null, score2: null, winner: null, played: false };
  simulateMatch(m);
  tie.score1 = m.score1;
  tie.score2 = m.score2;
  tie.winner = m.winner;
  tie.played = true;
}

/* --------------------------------------------------------- match lookup --- */

/* The user's next unplayed fixture, as { kind, match, opponent, round } or null. */
function wcCurrentMatch() {
  if (!wcState) return null;
  if (wcState.eliminated || wcState.champion) return null;
  if (wcState.stage === "groups") {
    const group = wcGroupOf(wcState.selectedNation);
    if (!group) return null;
    let best = null;
    for (const m of group.matches) {
      if (m.played) continue;
      if (m.team1 !== wcState.selectedNation && m.team2 !== wcState.selectedNation) continue;
      if (!best || (m.round || 1) < (best.round || 1)) best = m;
    }
    if (!best) return null;
    const opp = best.team1 === wcState.selectedNation ? best.team2 : best.team1;
    return { kind: "group", match: best, opponent: opp, round: best.round || 1 };
  }
  if (wcState.stage === "knockout") {
    for (const def of WC_KO_ROUNDS) {
      const round = wcRoundByKey(def.key);
      if (!round) continue;
      const tie = round.ties.find(t => !t.played && t.team1 && t.team2 &&
        (t.team1 === wcState.selectedNation || t.team2 === wcState.selectedNation));
      if (tie) {
        const opp = tie.team1 === wcState.selectedNation ? tie.team2 : tie.team1;
        return { kind: "ko", match: tie, opponent: opp, roundKey: def.key, roundTitle: def.title };
      }
    }
  }
  return null;
}

function wcIsGroupMatch() {
  const cur = wcCurrentMatch();
  return !!(cur && cur.kind === "group");
}

/* ---------------------------------------------------------- match flow ---- */

function wcPlayNext() {
  const cur = wcCurrentMatch();
  if (!cur) { wcShowHub(); return; }
  if (typeof matchRunning !== "undefined" && (matchRunning || awaitingStart)) return;
  selectedTeam = wcState.selectedNation;
  playerName = wcState.playerName || "YOU";
  wcContext = { opponent: cur.opponent };
  document.getElementById("worldCupScreen").style.display = "none";
  document.getElementById("gameScreen").style.display = "none";
  enterScreen("gameScreen", "block");
  preparePlayerMatch();
  kickoffIntro = KICKOFF_INTRO_WAIT;
  beginMatch();
}

function wcResumeMatch() {
  wcMidMatch = false;
  document.getElementById("worldCupScreen").style.display = "none";
  enterScreen("gameScreen", "block");
  matchRunning = true;
  startTimer();
}

function wcSimNext() {
  const cur = wcCurrentMatch();
  if (!cur) { wcShowHub(); return; }
  if (cur.kind === "group") {
    simulateGroupMatch(cur.match);
    wcSimRestOfRound(cur.round);
  } else {
    wcSimTie(cur.match);
    wcFillNextRound(cur.roundKey);
    wcAfterUserKnockout(cur);
  }
  wcSave();
  wcShowHub();
}

function wcSimRestOfRound(round) {
  for (const g of wcState.groups) {
    for (const m of g.matches) {
      if (m.played) continue;
      if ((m.round || 1) !== round) continue;
      if (m.team1 === wcState.selectedNation || m.team2 === wcState.selectedNation) continue;
      simulateGroupMatch(m);
    }
  }
}

/* Called from engine.js when a live World Cup match reaches full time. */
function wcEndMatch() {
  const cur = wcCurrentMatch();
  wcContext = null;
  if (!cur) { wcShowHub(); return; }
  const m = cur.match;
  const opp = cur.opponent;
  const me = wcState.selectedNation;

  if (cur.kind === "group") {
    if (m.team1 === me) { m.score1 = blueScore; m.score2 = redScore; }
    else { m.score1 = redScore; m.score2 = blueScore; }
    m.played = true;
    wcSimRestOfRound(cur.round);
    wcSave();
    const scoreLine = `${me} ${blueScore} \u2014 ${redScore} ${opp}`;
    let resultText;
    if (blueScore > redScore) resultText = `${me} beat ${opp} ${blueScore}-${redScore}! Group stage win.`;
    else if (blueScore < redScore) resultText = `${me} lost to ${opp} ${redScore}-${blueScore}. Work to do.`;
    else resultText = `${me} drew ${blueScore}-${blueScore} with ${opp}.`;
    if (wcAllGroupMatchesPlayed()) resultText += " The group stage is complete.";
    wcNews(scoreLine, resultText);
    wcSave();
    showEndScreen(resultText, scoreLine, () => wcShowHub(), { blue: me, red: opp });
    return;
  }

  // Knockout, one leg.
  let winner;
  if (blueScore !== redScore) winner = blueScore > redScore ? me : opp;
  else winner = (penaltyWinner === "blue") ? me : opp;
  if (m.team1 === me) { m.score1 = blueScore; m.score2 = redScore; }
  else { m.score1 = redScore; m.score2 = blueScore; }
  if (typeof penaltyScore !== "undefined" && penaltyScore && blueScore === redScore) {
    if (m.team1 === me) { m.pens1 = penaltyScore.blue; m.pens2 = penaltyScore.red; }
    else { m.pens1 = penaltyScore.red; m.pens2 = penaltyScore.blue; }
    m.decidedBy = "penalties";
  }
  m.winner = winner;
  m.played = true;
  wcFillNextRound(cur.roundKey);
  wcNews(me + " " + blueScore + "-" + redScore + " " + opp, winner === me ? me + " advanced from the " + cur.roundTitle + "." : opp + " knocked " + me + " out of the " + cur.roundTitle + ".");
  wcSave();
  const pensTxt = m.decidedBy === "penalties" ? ` (${m.pens1}-${m.pens2} on penalties)` : "";
  const scoreLine = `${me} ${blueScore} \u2014 ${redScore} ${opp}${pensTxt}`;

  if (cur.roundKey === "final") {
    wcState.champion = winner;
    wcState.stage = "complete";
    wcSave();
    showEndScreen(
      winner === me
        ? `WORLD CHAMPIONS! ${me} won the World Cup, beating ${opp} in the final!${pensTxt}`
        : `${me} lost the final to ${opp}. ${winner} lift the trophy.`,
      scoreLine, () => wcShowHub(), { blue: me, red: opp }, winner === me ? "World Cup" : null);
    return;
  }

  if (winner !== me) {
    wcState.eliminated = true;
    wcSimRemainingKnockout();
    wcSave();
    const champ = wcState.champion;
    showEndScreen(
      `${me} was knocked out in the ${cur.roundTitle} by ${opp}.${pensTxt} ` +
        (champ ? `${champ} went on to win the World Cup.` : "The tournament continues without you."),
      scoreLine, () => wcShowHub(), { blue: me, red: opp });
    return;
  }

  wcSimRemainingKnockout();
  wcSave();
  const nextIdx = wcRoundIndex(cur.roundKey) + 1;
  const nextTitle = WC_KO_ROUNDS[nextIdx] ? WC_KO_ROUNDS[nextIdx].title : "next round";
  showEndScreen(`${me} won and advanced to the ${nextTitle}!`, scoreLine, () => wcShowHub(), { blue: me, red: opp });
}

function wcAfterUserKnockout(cur) {
  const tie = cur.match;
  if (tie.winner !== wcState.selectedNation) {
    wcState.eliminated = true;
    wcSimRemainingKnockout();
  } else {
    wcSimRemainingKnockout();
  }
}

/* ---------------------------------------------------------------- hub ----- */

function wcShowHub() {
  if (!wcState) { wcShowSetup(); return; }
  selectedTeam = wcState.selectedNation;
  playerName = wcState.playerName || "YOU";
  const body = document.getElementById("wcBody");
  if (!body) return;
  // If the group stage just finished, build the bracket.
  if (wcState.stage === "groups" && wcAllGroupMatchesPlayed()) {
    wcBuildKnockout();
    const qualified = wcState.knockout[0] && wcState.knockout[0].ties.some(t => t.team1 === wcState.selectedNation || t.team2 === wcState.selectedNation);
    if (!qualified) wcState.eliminated = true;
    wcSimRemainingKnockout();
    wcSave();
  } else if (wcState.stage === "knockout" && !wcState.champion && !wcState.eliminated) {
    wcSimRemainingKnockout();
  }
  if (typeof matchRunning !== "undefined" && matchRunning) {
    matchRunning = false;
    try { clearInterval(timerInterval); } catch (e) {}
    wcMidMatch = true;
  } else {
    wcMidMatch = false;
  }
  document.getElementById("gameScreen").style.display = "none";
  document.getElementById("bracketScreen").style.display = "none";
  const title = document.getElementById("wcTitle");
  const sub = document.getElementById("wcSubtitle");
  const cur = wcCurrentMatch();
  const me = wcState.selectedNation;

  if (wcState.champion && wcState.champion === me) {
    if (title) title.textContent = "World Champions";
    if (sub) sub.textContent = "You lifted the trophy!";
  } else if (wcState.champion) {
    if (title) title.textContent = "Tournament Over";
    if (sub) sub.textContent = `${wcState.champion} won the World Cup.`;
  } else if (wcState.eliminated) {
    if (title) title.textContent = "Eliminated";
    if (sub) sub.textContent = "Your World Cup is over. The tournament plays on without you.";
  } else if (cur && cur.kind === "group") {
    if (title) title.textContent = `${me} \u2014 World Cup`;
    if (sub) sub.textContent = `Group stage, matchday ${cur.round} of 3. Next: ${me} vs ${cur.opponent}.`;
  } else if (cur) {
    if (title) title.textContent = `${me} \u2014 World Cup`;
    if (sub) sub.textContent = `${cur.roundTitle}: ${me} vs ${cur.opponent}.`;
  } else {
    if (title) title.textContent = `${me} \u2014 World Cup`;
    if (sub) sub.textContent = "Awaiting the next round.";
  }

  const canPlay = !!cur;
  let actions = "";
  if (wcMidMatch) {
    actions = `<button class="wcPrimaryBtn" onclick="wcResumeMatch()">Resume Match</button>`;
  } else if (canPlay) {
    actions = `
      <button class="wcPrimaryBtn" onclick="wcPlayNext()">Play Next Match</button>
      <button class="wcGhostBtn" onclick="wcSimNext()">Simulate It</button>`;
  } else if (wcState.champion || wcState.eliminated) {
    actions = `<button class="wcPrimaryBtn" onclick="wcNewTournament()">New Tournament</button>`;
  }
  actions += `<button class="wcGhostBtn" onclick="baseSquadOpen()">Squad & Formation</button>`;
  actions += `<button class="wcGhostBtn" onclick="wcQuitToMenu()">Quit to Menu</button>`;

  const bracketHTML = wcState.knockout && wcState.knockout.length ? wcBracketHTML() : "";
  body.innerHTML = `
    <div class="wcHubActions">${actions}</div>
    ${wcState.champion ? `<div class="wcChampion">World Champions: <b>${wcState.champion}</b></div>` : ""}
    <div class="wcHubCols">
      <div class="wcGroupsCol">${wcGroupsHTML()}</div>
      <div class="wcBracketCol">${bracketHTML || `<div class="wcBracketPending">The knockout bracket appears once the group stage is complete.</div>`}</div>
    </div>`;
  document.getElementById("worldCupScreen").style.display = "block";
  if (typeof enterScreen === "function") enterScreen("worldCupScreen", "block");
}

function wcGroupsHTML() {
  const cur = wcCurrentMatch();
  return wcState.groups.map(g => {
    const st = wcGroupStandings(g);
    const rows = st.map((row, i) => `
      <tr class="${row.team === wcState.selectedNation ? "playerRow" : ""} ${i < 2 ? "qualRow" : (i === 2 ? "playoffRow" : "outRow")}">
        <td class="rank">${i + 1}</td>
        <td class="team">${wcFlag(row.team)} ${row.team}</td>
        <td class="gd">${row.gd > 0 ? "+" : ""}${row.gd}</td>
        <td class="pts">${row.points}</td>
      </tr>`).join("");
    return `
      <div class="round leagueTableWrap">
        <h3>Group ${g.name}</h3>
        <div class="match tableCard">
          <table class="leagueTable">
            <thead><tr><th>#</th><th>Nation</th><th>GD</th><th>Pts</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  }).join("");
}

function wcFlag(team) {
  const nat = WC_NATION_BY_NAME[team];
  return nat ? `<span class="wcCode">${nat.code}</span>` : "";
}

function wcBracketHTML() {
  const rounds = wcState.knockout || [];
  const cols = rounds.map(round => {
    const ties = round.ties.map(tie => {
      const a = tie.team1 || "TBD", b = tie.team2 || "TBD";
      const aWin = tie.played && tie.winner === a ? "clWin" : "";
      const bWin = tie.played && tie.winner === b ? "clWin" : "";
      const aYou = a === wcState.selectedNation ? "clYou" : "";
      const bYou = b === wcState.selectedNation ? "clYou" : "";
      let score = "TBD";
      if (tie.played && tie.score1 != null) {
        score = `${tie.score1}\u2013${tie.score2}`;
        if (tie.decidedBy === "penalties") score += ` <i>${tie.pens1}-${tie.pens2}p</i>`;
      }
      return `
        <div class="clBracketTie">
          <div class="clBracketTeam ${aWin} ${aYou}">${a}</div>
          <span class="clBracketScore">${score}</span>
          <div class="clBracketTeam ${bWin} ${bYou}">${b}</div>
        </div>`;
    }).join("");
    return `<div class="clBracketRound"><div class="clBracketRoundTitle">${round.title}</div>${ties}</div>`;
  }).join("");
  return `<div class="clBracket">${cols}</div>`;
}

function wcNewTournament() {
  wcClearSave();
  wcState = null;
  wcSelectedNation = null;
  wcShowSetup();
}

function wcQuitToMenu() {
  wcContext = null;
  const screen = document.getElementById("worldCupScreen");
  if (screen) screen.style.display = "none";
  quitToMenu();
}
