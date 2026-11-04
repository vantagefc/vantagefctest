
const MYCLUB_KITS = {
  "Tottenham Hotspur": "#1C2C5B", "Chelsea": "#034694", "Newcastle United": "#241F20",
  "Brighton": "#0057B8", "West Ham United": "#7A263A", "Brentford": "#E30613",
  "Fulham": "#111111", "Nottingham Forest": "#DD0000", "Crystal Palace": "#1B458F",
  "Everton": "#003399", "Wolverhampton Wanderers": "#FDB913", "AFC Bournemouth": "#DA291C",
  "Leicester City": "#003090", "Burnley": "#6C1D45", "Ipswich Town": "#00335D",
  "Sevilla": "#F43333", "Real Sociedad": "#0067B1", "Athletic Club": "#EE2523",
  "Valencia": "#191919", "Getafe": "#005999", "Celta Vigo": "#94B6D2", "Osasuna": "#A31E22",
  "Mallorca": "#E20613", "Girona": "#CD2534", "Rayo Vallecano": "#E64A1E",
  "Alaves": "#004B8F", "Espanyol": "#007FC8", "Leganes": "#003DA5", "Valladolid": "#7A263A",
  "Las Palmas": "#FFDD00", "Bayer Leverkusen": "#E32221", "Eintracht Frankfurt": "#E1000F",
  "VfL Wolfsburg": "#65B32E", "Borussia Monchengladbach": "#000000", "SC Freiburg": "#FC0101",
  "TSG Hoffenheim": "#1961B5", "Mainz 05": "#C3141F", "FC Augsburg": "#BA3733",
  "Werder Bremen": "#009E62", "Union Berlin": "#EB1923", "VfL Bochum": "#005CA9",
  "Heidenheim": "#0E2D6B", "FC St. Pauli": "#6E3A2E", "Holstein Kiel": "#1A6B40",
  "AC Milan": "#FB090B", "Juventus": "#000000", "Atalanta": "#1E71B8", "Lazio": "#87D8F7",
  "Fiorentina": "#571CFF", "Torino": "#8B0000", "Bologna": "#A21E25", "Udinese": "#111111",
  "Genoa": "#A40031", "Cagliari": "#A50E5F", "Hellas Verona": "#003087", "Lecce": "#FFD100",
  "Empoli": "#1B67A6", "Parma": "#FFE800", "Monza": "#ED1C24", "Venezia": "#FB5D21",
  "Olympique Marseille": "#2FAEE0", "AS Monaco": "#E7222C", "Olympique Lyonnais": "#DA001A",
  "OGC Nice": "#B01D2E", "Stade Rennais": "#E13026", "FC Nantes": "#F2B705",
  "Stade de Reims": "#DD0200", "RC Strasbourg": "#1597D9", "Toulouse FC": "#6B2D5C",
  "Montpellier HSC": "#E4741E", "Stade Brestois": "#DD2E29", "Le Havre AC": "#1B2C74",
  "AJ Auxerre": "#123A66", "Angers SCO": "#000000", "AS Saint-Etienne": "#1D8A4C"
};

const MYCLUB_SQUADS = {
  "Tottenham Hotspur": [["GK","Vicario",85],["DF","Porro",84],["DF","Romero",86],["DF","Van de Ven",85],["DF","Udogie",84],["MF","Bentancur",81],["MF","Maddison",85],["MF","Kulusevski",84],["AT","Johnson",82],["AT","Son",87],["AT","Odobert",80]],
  "Chelsea": [["GK","Sanchez",82],["DF","James",84],["DF","Fofana",83],["DF","Colwill",84],["DF","Cucurella",84],["MF","Enzo",85],["MF","Caicedo",87],["MF","Palmer",88],["AT","Madueke",84],["AT","Jackson",83],["AT","Nkunku",86]],
  "Newcastle United": [["GK","Pope",82],["DF","Trippier",83],["DF","Schar",83],["DF","Botman",84],["DF","Burn",81],["MF","Guimaraes",86],["MF","Tonali",84],["MF","Joelinton",82],["AT","Gordon",84],["AT","Isak",88],["AT","Barnes",81]],
  "Brighton": [["GK","Verbruggen",80],["DF","Veltman",79],["DF","Dunk",81],["DF","Van Hecke",79],["DF","Hinshelwood",78],["MF","Baleba",81],["MF","Moder",78],["MF","Mitoma",84],["AT","Minteh",81],["AT","Pedro",83],["AT","Adingra",81]],
  "West Ham United": [["GK","Areola",79],["DF","Wan-Bissaka",79],["DF","Kilman",81],["DF","Mavropanos",78],["DF","Emerson",79],["MF","Soucek",80],["MF","Alvarez",78],["MF","Paqueta",82],["AT","Bowen",84],["AT","Fullkrug",81],["AT","Kudus",82]],
  "Brentford": [["GK","Flekken",80],["DF","Collins",80],["DF","Pinnock",81],["DF","Henry",77],["DF","Roerslev",76],["MF","Norgaard",78],["MF","Jensen",79],["MF","Damsgaard",79],["AT","Mbeumo",83],["AT","Wissa",82],["AT","Schade",78]],
  "Fulham": [["GK","Leno",81],["DF","Castagne",78],["DF","Andersen",80],["DF","Bassey",79],["DF","Robinson",79],["MF","Berge",79],["MF","Cairney",77],["MF","Pereira",81],["AT","Iwobi",80],["AT","Jimenez",79],["AT","Nelson",78]],
  "Nottingham Forest": [["GK","Sels",80],["DF","Aina",79],["DF","Milenkovic",81],["DF","Murillo",82],["DF","Williams",79],["MF","Gibbs-White",82],["MF","Anderson",79],["MF","Danilo",78],["AT","Hudson-Odoi",82],["AT","Wood",79],["AT","Elanga",80]],
  "Crystal Palace": [["GK","Henderson",79],["DF","Munoz",78],["DF","Guehi",82],["DF","Chalobah",78],["DF","Mitchell",76],["MF","Wharton",81],["MF","Lerma",77],["MF","Eze",84],["AT","Sarr",80],["AT","Mateta",79],["AT","Kamada",77]],
  "Everton": [["GK","Pickford",83],["DF","Patterson",75],["DF","Tarkowski",78],["DF","Branthwaite",80],["DF","Mykolenko",77],["MF","Garner",74],["MF","Gueye",75],["MF","Doucoure",77],["AT","McNeil",78],["AT","Beto",74],["AT","Harrison",75]],
  "Wolverhampton Wanderers": [["GK","Sa",78],["DF","Semedo",78],["DF","Dawson",78],["DF","Mosquera",75],["DF","Ait-Nouri",78],["MF","Lemina",76],["MF","Andre",75],["MF","Gomes",75],["AT","Cunha",85],["AT","Strand Larsen",78],["AT","Guedes",76]],
  "AFC Bournemouth": [["GK","Kepa",78],["DF","Smith",76],["DF","Zabarnyi",80],["DF","Senesi",77],["DF","Kerkez",80],["MF","Scott",77],["MF","Adams",75],["MF","Christie",74],["AT","Semenyo",79],["AT","Evanilson",76],["AT","Ouattara",77]],
  "Leicester City": [["GK","Hermansen",77],["DF","Justin",75],["DF","Faes",76],["DF","Okoli",73],["DF","Kristiansen",75],["MF","Ndidi",77],["MF","Reid",72],["MF","Winks",75],["AT","Mavididi",75],["AT","Vardy",76],["AT","Fatawu",75]],
  "Burnley": [["GK","Trafford",72],["DF","Roberts",70],["DF","Egan-Riley",70],["DF","Esteve",74],["DF","Humphreys",70],["MF","Cullen",71],["MF","Laurent",71],["MF","Brownhill",72],["AT","Koleosho",75],["AT","Pires",70],["AT","Anthony",71]],
  "Ipswich Town": [["GK","Muric",73],["DF","Tuanzebe",70],["DF","Greaves",72],["DF","Woolfenden",71],["DF","Davis",72],["MF","Morsy",70],["MF","Cajuste",70],["MF","Phillips",70],["AT","Clark",72],["AT","Delap",74],["AT","Hutchinson",74]],
  "Sevilla": [["GK","Nyland",80],["DF","Carmona",78],["DF","Bade",81],["DF","Nianzou",80],["DF","Pedrosa",79],["MF","Sow",79],["MF","Agoume",78],["MF","Saul",81],["AT","Lukebakio",83],["AT","Romero",78],["AT","Peque",76]],
  "Real Sociedad": [["GK","Remiro",84],["DF","Aramburu",78],["DF","Zubeldia",81],["DF","Aguerd",80],["DF","Lopez",76],["MF","Zubimendi",85],["MF","Mendez",80],["MF","Sucic",77],["AT","Kubo",84],["AT","Oyarzabal",84],["AT","Barrenetxea",80]],
  "Athletic Club": [["GK","Simon",87],["DF","Gorosabel",79],["DF","Vivian",82],["DF","Yeray",81],["DF","Yuri",81],["MF","De Galarreta",79],["MF","Sancet",82],["MF","Prados",78],["AT","Williams",86],["AT","Williams",89],["AT","Guruzeta",78]],
  "Valencia": [["GK","Mamardashvili",85],["DF","Correia",76],["DF","Mosquera",77],["DF","Tarrega",75],["DF","Gaya",81],["MF","Guillamon",78],["MF","Pepelu",77],["MF","Guerra",78],["AT","Lopez",76],["AT","Duro",77],["AT","Rioja",76]],
  "Getafe": [["GK","Soria",77],["DF","Iglesias",73],["DF","Alderete",77],["DF","Djene",77],["DF","Gormaz",73],["MF","Arambarri",78],["MF","Uche",73],["MF","Milla",75],["AT","Coba",73],["AT","Mayoral",80],["AT","Aleixo",71]],
  "Celta Vigo": [["GK","Guaita",77],["DF","Mingueza",79],["DF","Starfelt",76],["DF","Alonso",77],["DF","Rodriguez",72],["MF","Sotelo",75],["MF","Beltran",75],["MF","Moriba",78],["AT","Aspas",81],["AT","Iglesias",77],["AT","Swedberg",76]],
  "Osasuna": [["GK","Herrera",77],["DF","Areso",75],["DF","Catena",76],["DF","Boyomo",74],["DF","Cruz",75],["MF","Torro",77],["MF","Moncayola",78],["MF","Gomez",75],["AT","Garcia",75],["AT","Zaragoza",76],["AT","Budimir",79]],
  "Mallorca": [["GK","Greif",76],["DF","Maffeo",76],["DF","Valjent",75],["DF","Copete",73],["DF","Mojica",76],["MF","Mascarell",75],["MF","Costa",75],["MF","Morlanes",75],["AT","Sangare",74],["AT","Muriqi",78],["AT","Larin",75]],
  "Girona": [["GK","Gazzaniga",78],["DF","Arnau",75],["DF","Lopez",76],["DF","Krejci",76],["DF","Gutierrez",79],["MF","Romeu",76],["MF","Martin",78],["MF","Solis",76],["AT","Asprilla",75],["AT","Stuani",78],["AT","Danjuma",78]],
  "Rayo Vallecano": [["GK","Batalla",73],["DF","Balliu",73],["DF","Lejeune",78],["DF","Mumin",72],["DF","Chavarria",72],["MF","Ciss",73],["MF","Lopez",74],["MF","Valentin",73],["AT","Isi",78],["AT","Camello",74],["AT","De Frutos",73]],
  "Alaves": [["GK","Sivera",77],["DF","Tenaglia",72],["DF","Abqar",73],["DF","Sedlar",72],["DF","Sanchez",72],["MF","Blanco",73],["MF","Guevara",72],["MF","Jordan",73],["AT","Vicente",75],["AT","Garcia",75],["AT","Carlos",71]],
  "Espanyol": [["GK","Fernandez",73],["DF","Tejero",72],["DF","Cabrera",75],["DF","Kumbulla",72],["DF","Romero",71],["MF","Aguado",71],["MF","Gonzalez",72],["MF","Kral",71],["AT","Cardona",72],["AT","Puado",76],["AT","Vazquez",70]],
  "Leganes": [["GK","Dmitrovic",73],["DF","Rosier",70],["DF","Gonzalez",70],["DF","Nastasic",72],["DF","Rodriguez",71],["MF","Tapia",73],["MF","Cisse",70],["MF","Raba",70],["AT","Cruz",71],["AT","Miguel",70],["AT","Fuente",71]],
  "Valladolid": [["GK","Hein",70],["DF","Perez",69],["DF","Sanchez",71],["DF","Juma",68],["DF","Rosa",69],["MF","Juric",70],["MF","Perez",69],["MF","Amallah",70],["AT","Machis",71],["AT","Moro",70],["AT","Latasa",68]],
  "Las Palmas": [["GK","Cillesen",72],["DF","Viti",70],["DF","McKenna",70],["DF","Suarez",73],["DF","Cardona",71],["MF","Rodriguez",74],["MF","Munoz",72],["MF","Essugo",71],["AT","Sandro",74],["AT","McBurney",69],["AT","Moleiro",74]],
  "Bayer Leverkusen": [["GK","Hradecky",82],["DF","Mukiele",81],["DF","Tah",83],["DF","Tapsoba",83],["DF","Hincapie",83],["MF","Xhaka",85],["MF","Palacios",82],["MF","Wirtz",90],["AT","Frimpong",84],["AT","Schick",84],["AT","Adli",79]],
  "Eintracht Frankfurt": [["GK","Trapp",81],["DF","Kristensen",80],["DF","Koch",80],["DF","Theate",80],["DF","Nkounkou",76],["MF","Skhiri",80],["MF","Gotze",82],["MF","Chaibi",78],["AT","Marmoush",85],["AT","Ekitike",79],["AT","Knauff",77]],
  "VfL Wolfsburg": [["GK","Grabara",80],["DF","Fischer",77],["DF","Lacroix",78],["DF","Jenz",74],["DF","Kaminski",75],["MF","Arnold",78],["MF","Svanberg",75],["MF","Vranckx",75],["AT","Baku",80],["AT","Amoura",79],["AT","Tomas",75]],
  "Borussia Monchengladbach": [["GK","Nicolas",79],["DF","Scally",76],["DF","Itakura",80],["DF","Friedrich",72],["DF","Netz",74],["MF","Weigl",78],["MF","Stoger",76],["MF","Honorat",78],["AT","Hack",74],["AT","Kleindienst",79],["AT","Plea",79]],
  "SC Freiburg": [["GK","Atubolu",78],["DF","Kubler",75],["DF","Rosenfeld",70],["DF","Ginter",80],["DF","Makengo",76],["MF","Osterhage",76],["MF","Eggestein",76],["MF","Doan",78],["AT","Roll",71],["AT","Grifo",82],["AT","Holer",72]],
  "TSG Hoffenheim": [["GK","Baumann",79],["DF","Kabak",75],["DF","Grillitsch",76],["DF","Loosli",70],["DF","Akpoguma",73],["MF","Bischof",73],["MF","Stach",75],["MF","Becker",70],["AT","Hlozek",76],["AT","Kramaric",78],["AT","Gendrey",71]],
  "Mainz 05": [["GK","Zentner",80],["DF","Kohr",75],["DF","Bell",78],["DF","Leitsch",73],["DF","Mwene",72],["MF","Amiri",79],["MF","Lee",77],["MF","Sano",77],["AT","Nebel",77],["AT","Burkardt",81],["AT","Sieb",72]],
  "FC Augsburg": [["GK","Labrovic",73],["DF","Matsima",73],["DF","Gouweleeuw",77],["DF","Schlotterbeck",71],["DF","Giannoulis",71],["MF","Rekik",73],["MF","Komur",72],["MF","Jakic",72],["AT","Vargas",77],["AT","Claude-Maurice",74],["AT","Essende",71]],
  "Werder Bremen": [["GK","Zetterer",76],["DF","Stark",77],["DF","Friedl",77],["DF","Veljkovic",71],["DF","Agu",76],["MF","Stage",77],["MF","Lynen",74],["MF","Schmid",76],["AT","Njinmah",76],["AT","Ducksch",78],["AT","Grull",72]],
  "Union Berlin": [["GK","Ronnow",79],["DF","Doekhi",76],["DF","Vogt",75],["DF","Leite",74],["DF","Rothe",71],["MF","Tousart",77],["MF","Khedira",74],["MF","Haberer",73],["AT","Skarke",73],["AT","Jeong",75],["AT","Hollerbach",72]],
  "VfL Bochum": [["GK","Drewes",71],["DF","Passlack",69],["DF","Sissoko",70],["DF","Ordets",71],["DF","Wittek",69],["MF","Osterhage",70],["MF","Losilla",70],["MF","Bachtmann",68],["AT","Holtmann",71],["AT","Boadu",70],["AT","Daschner",68]],
  "Heidenheim": [["GK","Muller",70],["DF","Traore",69],["DF","Mainka",72],["DF","Gimber",69],["DF","Fohrenbach",68],["MF","Schoppner",68],["MF","Wanner",71],["MF","Jano",70],["AT","Honsak",72],["AT","Pieringer",68],["AT","Conteh",70]],
  "FC St. Pauli": [["GK","Vasilj",73],["DF","Wahl",70],["DF","Smith",70],["DF","Nemeth",70],["DF","Ritzka",69],["MF","Irvine",72],["MF","Boukhalfa",70],["MF","Sinani",69],["AT","Eggestein",70],["AT","Guandali",68],["AT","Tomiak",68]],
  "Holstein Kiel": [["GK","Weiner",68],["DF","Becker",66],["DF","Balboa",68],["DF","Komenda",66],["DF","Davidsen",66],["MF","Holtby",70],["MF","Knudsen",66],["MF","Rensch",65],["AT","Pichler",69],["AT","Harres",66],["AT","Gigovic",66]],
  "AC Milan": [["GK","Maignan",89],["DF","Emerson",80],["DF","Tomori",83],["DF","Thiaw",79],["DF","Hernandez",87],["MF","Fofana",82],["MF","Reijnders",85],["MF","Musah",77],["AT","Pulisic",85],["AT","Gimenez",82],["AT","Leao",88]],
  "Juventus": [["GK","Di Gregorio",84],["DF","Kalulu",81],["DF","Gatti",82],["DF","Bremer",86],["DF","Cambiaso",82],["MF","Locatelli",82],["MF","Thuram",83],["MF","Yildiz",84],["AT","Conceicao",82],["AT","Vlahovic",85],["AT","Gonzalez",83]],
  "Atalanta": [["GK","Carnesecchi",84],["DF","Bellanova",80],["DF","Djimsiti",82],["DF","Hien",79],["DF","Ruggeri",78],["MF","Ederson",85],["MF","De Roon",82],["MF","Pasalic",79],["AT","Lookman",88],["AT","Retegui",83],["AT","De Ketelaere",81]],
  "Lazio": [["GK","Provedel",81],["DF","Lazzari",77],["DF","Gila",81],["DF","Romagnoli",80],["DF","Tavares",77],["MF","Guendouzi",81],["MF","Rovella",77],["MF","Vecino",76],["AT","Isaksen",78],["AT","Castellanos",78],["AT","Zaccagni",82]],
  "Fiorentina": [["GK","De Gea",83],["DF","Dodo",77],["DF","Comuzzo",79],["DF","Ranieri",77],["DF","Gosens",78],["MF","Bove",79],["MF","Cataldi",77],["MF","Gudmundsson",82],["AT","Zaniolo",77],["AT","Kean",79],["AT","Colpani",76]],
  "Torino": [["GK","Milinkovic-Savic",79],["DF","Pedersen",75],["DF","Coco",75],["DF","Maripan",78],["DF","Sosa",75],["MF","Ricci",80],["MF","Tameze",75],["MF","Vlasic",78],["AT","Lazaro",75],["AT","Adams",77],["AT","Karamoh",72]],
  "Bologna": [["GK","Skorupski",79],["DF","Holm",77],["DF","Casale",76],["DF","Beukema",79],["DF","Miranda",75],["MF","Freuler",80],["MF","Pobega",76],["MF","Odgaard",77],["AT","Orsolini",82],["AT","Castro",77],["AT","Dallinga",77]],
  "Udinese": [["GK","Okoye",74],["DF","Ebosele",74],["DF","Bijol",78],["DF","Kabasele",74],["DF","Zemura",73],["MF","Karlstrom",75],["MF","Payero",74],["MF","Ekkelenkamp",74],["AT","Thauvin",79],["AT","Lucca",75],["AT","Pizarro",73]],
  "Genoa": [["GK","Leali",73],["DF","Zanoli",73],["DF","Bani",74],["DF","Vasquez",72],["DF","Martin",73],["MF","Badelj",74],["MF","Frendrup",74],["MF","Malinovskyi",76],["AT","Vitinha",75],["AT","Pinamonti",78],["AT","Ankeye",72]],
  "Cagliari": [["GK","Caprile",74],["DF","Zappa",72],["DF","Mina",75],["DF","Luperto",73],["DF","Augello",73],["MF","Makoumbou",73],["MF","Marin",74],["MF","Zortea",74],["AT","Luvumbo",73],["AT","Piccoli",72],["AT","Felici",71]],
  "Hellas Verona": [["GK","Montipo",72],["DF","Tchatchoua",71],["DF","Dawidowicz",72],["DF","Magnani",71],["DF","Bradaric",71],["MF","Serdar",72],["MF","Belahyane",71],["MF","Harroui",71],["AT","Suslov",73],["AT","Tengstedt",72],["AT","Kastanos",71]],
  "Lecce": [["GK","Falcone",75],["DF","Guilbert",74],["DF","Baschirotto",75],["DF","Gaspar",71],["DF","Gallo",71],["MF","Pierret",71],["MF","Ramadani",71],["MF","Helgason",69],["AT","Pierotti",70],["AT","Krstovic",75],["AT","Morente",71]],
  "Empoli": [["GK","Vasquez",70],["DF","Pezzella",70],["DF","Goglichidze",70],["DF","Viti",70],["DF","Cacace",69],["MF","Grassi",71],["MF","Henderson",70],["MF","Falcini",69],["AT","Esposito",73],["AT","Colombo",72],["AT","Gyasi",70]],
  "Parma": [["GK","Suzuki",73],["DF","Coulibaly",70],["DF","Valeri",72],["DF","Balogh",70],["DF","Delprato",72],["MF","Bernabe",72],["MF","Sohm",70],["MF","Estevez",69],["AT","Man",73],["AT","Bonny",73],["AT","Benedictczak",69]],
  "Monza": [["GK","Turati",72],["DF","Izzo",72],["DF","Mari",73],["DF","Carboni",70],["DF","Kyriakopoulos",72],["MF","Bondo",71],["MF","Pessina",76],["MF","Maric",69],["AT","Maldini",74],["AT","Mota",71],["AT","Caprari",74]],
  "Venezia": [["GK","Stankovic",69],["DF","Candela",67],["DF","Idzes",70],["DF","Svoboda",68],["DF","Zampano",70],["MF","Busio",71],["MF","Tessmann",70],["MF","Nicolussi",70],["AT","Oristanio",71],["AT","Gytkjaer",70],["AT","Kasius",67]],
  "Olympique Marseille": [["GK","Rulli",84],["DF","Lirola",77],["DF","Balerdi",82],["DF","Kondogbia",78],["DF","Merlin",78],["MF","Hojbjerg",81],["MF","Rongier",79],["MF","Rabiot",84],["AT","Greenwood",84],["AT","Maupay",78],["AT","Rowe",78]],
  "AS Monaco": [["GK","Kohn",78],["DF","Vanderson",82],["DF","Kehrer",79],["DF","Singo",80],["DF","Henrique",79],["MF","Camara",81],["MF","Zakaria",81],["MF","Akliouche",82],["AT","Embolo",81],["AT","Balogun",80],["AT","Seghir",78]],
  "Olympique Lyonnais": [["GK","Perri",74],["DF","Kumbedi",76],["DF","Caleta-Car",79],["DF","Niakhate",79],["DF","Tagliafico",80],["MF","Tolisso",79],["MF","Matic",76],["MF","Caqueret",78],["AT","Cherki",84],["AT","Lacazette",81],["AT","Nuamah",78]],
  "OGC Nice": [["GK","Bulka",80],["DF","Clauss",78],["DF","Bombito",78],["DF","Dante",77],["DF","Bard",78],["MF","Ndiaye",75],["MF","Rosario",74],["MF","Boga",77],["AT","Cho",75],["AT","Guessand",76],["AT","Bouanani",75]],
  "Stade Rennais": [["GK","Samba",81],["DF","Kalai",72],["DF","Wooh",74],["DF","Ostigard",77],["DF","Truffert",78],["MF","Goto",75],["MF","Matusiwa",75],["MF","Fofana",76],["AT","Bourigeaud",80],["AT","Kalimuendo",79],["AT","Gouiri",79]],
  "FC Nantes": [["GK","Lafont",78],["DF","Amian",73],["DF","Castelletto",73],["DF","Pallois",72],["DF","Cozza",71],["MF","Chirivella",72],["MF","Lepenant",70],["MF","Kokic",69],["AT","Simon",76],["AT","Abline",72],["AT","Mohamed",72]],
  "Stade de Reims": [["GK","Diouf",73],["DF","Buta",71],["DF","Kipre",73],["DF","Okumu",73],["DF","Akieme",72],["MF","Kone",73],["MF","Diakite",70],["MF","Munetsi",72],["AT","Itona",72],["AT","Oudin",70],["AT","Nakamura",75]],
  "RC Strasbourg": [["GK","Petrovic",75],["DF","Doue",74],["DF","Sylla",74],["DF","Oumari",73],["DF","Sarr",74],["MF","Andrey",74],["MF","Diallo",74],["MF","Lemarechal",75],["AT","Nanasi",79],["AT","Santos",74],["AT","Failing",72]],
  "Toulouse FC": [["GK","Restes",78],["DF","Sidibe",74],["DF","Costa",74],["DF","Nicolaisen",73],["DF","Roelofsen",72],["MF","Casseres",73],["MF","Sierro",72],["MF","Zajc",70],["AT","Aboukhlal",74],["AT","Babicka",72],["AT","King",71]],
  "Montpellier HSC": [["GK","Lecomte",71],["DF","Sylla",69],["DF","Omeragic",73],["DF","Kamara",73],["DF","Mincarelli",68],["MF","Ferri",70],["MF","Chotard",71],["MF","Kouyate",70],["AT","Khazri",72],["AT","Sagnan",69],["AT","Nordin",69]],
  "Stade Brestois": [["GK","Bizot",73],["DF","Lala",72],["DF","Chardonnet",75],["DF","Coulibaly",71],["DF","Haidara",70],["MF","Camara",71],["MF","Magnetti",71],["MF","Doumbia",68],["AT","Sima",72],["AT","Ajorque",72],["AT","Lage",66]],
  "Le Havre AC": [["GK","Desmas",71],["DF","Kinkoue",68],["DF","Sangante",72],["DF","Soumah",68],["DF","Operi",70],["MF","Toure",70],["MF","Diakite",67],["MF","Casimir",66],["AT","Ndiaye",69],["AT","Soumare",68],["AT","Gory",69]],
  "AJ Auxerre": [["GK","Leon",69],["DF","Joly",69],["DF","Jubal",72],["DF","Pellenard",67],["DF","Mensah",68],["MF","Danois",68],["MF","Raveloson",69],["MF","Owusu",70],["AT","Sinayoko",71],["AT","Perrin",68],["AT","Traore",69]],
  "Angers SCO": [["GK","Fofana",67],["DF","Arcus",66],["DF","Lefort",67],["DF","Biumla",67],["DF","Hountondji",66],["MF","Belkebla",68],["MF","Aholou",68],["MF","Abdelli",69],["AT","Melali",69],["AT","Dieng",68],["AT","Cherhi",66]],
  "AS Saint-Etienne": [["GK","Larsonneur",69],["DF","Appiah",67],["DF","Batubinsika",67],["DF","Briancon",71],["DF","Fofana",67],["MF","Moueffek",68],["MF","Bouchouari",67],["MF","Mouton",66],["AT","Stassin",68],["AT","Cafaro",68],["AT","Davitashvili",70]],
  "Leeds United": [["GK","Meslier",74],["DF","Bogle",69],["DF","Rodon",72],["DF","Struijk",72],["DF","Firpo",71],["MF","Tanaka",71],["MF","Rothwell",70],["MF","Ampadu",71],["AT","Gnonto",72],["AT","Aaronson",72],["AT","Piroe",73]],
  "Southampton": [["GK","Bazunu",73],["DF","Sugawara",70],["DF","Bednarek",73],["DF","Harwood-Bellis",72],["DF","Walker-Peters",74],["MF","Downes",71],["MF","Aribo",72],["MF","Smallbone",70],["AT","Cornet",71],["AT","Armstrong",74],["AT","Edozie",69]],
  "West Bromwich Albion": [["GK","Palmer",70],["DF","Furlong",69],["DF","Bartley",69],["DF","Heggem",68],["DF","Styles",67],["MF","Mowatt",70],["MF","Yokuslu",70],["MF","Morley",68],["AT","Diangana",71],["AT","Grant",70],["AT","Thomas-Asante",69]],
  "Sunderland AFC": [["GK","Patterson",69],["DF","Hume",68],["DF","Ballard",71],["DF","O'Nien",69],["DF","Cirkin",68],["MF","Neil",69],["MF","Ekwah",69],["MF","Bellingham",71],["AT","Roberts",70],["AT","Clarke",71],["AT","Isidor",69]],
  "Norwich City": [["GK","Gunn",70],["DF","Fischer",67],["DF","Hanley",68],["DF","Doyle",67],["DF","Chrisene",66],["MF","Nunez",70],["MF","Gibbs",67],["MF","McLean",68],["AT","Sainz",71],["AT","Sargent",72],["AT","Crnac",68]],
  "Middlesbrough": [["GK","Glover",67],["DF","Ayala",67],["DF","Lenihan",69],["DF","Borges",67],["DF","Engel",66],["MF","Howson",68],["MF","Morris",67],["MF","Hackney",71],["AT","Whittaker",69],["AT","Latte Lath",70],["AT","Conway",67]],
  "Coventry City": [["GK","Wilson",69],["DF","Van Ewijk",67],["DF","Kitching",67],["DF","Latibeaudiere",66],["DF","Binks",66],["MF","Sheaf",70],["MF","Eccles",68],["MF","Palmer",69],["AT","Sakamoto",70],["AT","Wright",69],["AT","Simms",70]],
  "Sheffield Wednesday": [["GK","Vasquez",66],["DF","Bernard",66],["DF","Iorfa",67],["DF","Lowe",67],["DF","Johnson",65],["MF","Charles",67],["MF","Ingelsson",65],["MF","Furlong",66],["AT","Windass",69],["AT","Musaba",66],["AT","Ubochioma",65]],
  "Watford FC": [["GK","Bond",66],["DF","Pollock",65],["DF","Porteous",67],["DF","McKenna",66],["DF","Jenkins",64],["MF","Louza",70],["MF","Dele-Bashiru",67],["MF","Kayembe",66],["AT","Baah",66],["AT","Chakvetadze",68],["AT","Rajovic",65]],
  "Bristol City": [["GK","O'Leary",67],["DF","Tanner",65],["DF","Vyner",67],["DF","Dickie",67],["DF","McCrorie",64],["MF","Knight",69],["MF","Williams",67],["MF","Armstrong",65],["AT","Twine",68],["AT","Mehmeti",66],["AT","Cornick",65]],
  "Preston North End": [["GK","Woodman",67],["DF","Storey",66],["DF","Hughes",66],["DF","Kesler-Hayden",64],["DF","Coulton",63],["MF","Whiteman",67],["MF","Ledson",66],["MF","Browne",68],["AT","Osmajic",68],["AT","Woodburn",64],["AT","Sinclair",66]],
  "Hull City": [["GK","Pandur",65],["DF","Coyle",65],["DF","Jones",65],["DF","Hughes",65],["DF","Greaves",67],["MF","Slattery",66],["MF","Morton",67],["MF","Alzate",65],["AT","Maghoma",66],["AT","Smith",64],["AT","Bola",63]],
  "Queens Park Rangers": [["GK","Kelly",66],["DF","Paal",65],["DF","Cook",66],["DF","Dunne",66],["DF","Clarke-Salter",65],["MF","Field",67],["MF","Varane",65],["MF","Smith",64],["AT","Smyth",66],["AT","Frey",65],["AT","Celar",65]],
  "Swansea City": [["GK","Vigouroux",65],["DF","Key",64],["DF","Cabango",66],["DF","Basso",64],["DF","Tymon",63],["MF","Ronald",65],["MF","Franco",65],["MF","Gyabi",64],["AT","Vipotnik",66],["AT","Eom",65],["AT","Cullen",63]],
  "Blackburn Rovers": [["GK","Pears",65],["DF","Brittain",65],["DF","Hyam",67],["DF","Carter",64],["DF","Baker",63],["MF","Tronstad",65],["MF","Travis",66],["MF","Hedges",65],["AT","Dolan",66],["AT","Cantwell",68],["AT","Gueye",64]],
  "Stoke City": [["GK","Johansson",65],["DF","Tchamadeu",63],["DF","Wilmot",66],["DF","McNally",64],["DF","Gooch",63],["MF","Burger",66],["MF","Moran",65],["MF","Manhoef",67],["AT","Bae Jun-ho",67],["AT","Al-Hamadi",64],["AT","Tezgel",62]],
  "Millwall FC": [["GK","Arnold",64],["DF","Leonard",63],["DF","Tanganga",65],["DF","Wallace",64],["DF","Romeo",63],["MF","Saville",64],["MF","Mitchell",64],["MF","Negri",63],["AT","Coburn",65],["AT","Emakhu",63],["AT","Flemming",65]],
  "Plymouth Argyle": [["GK","Hazard",64],["DF","Edwards",64],["DF","Pleguezuelo",64],["DF","Ogbeta",63],["DF","Sorinola",63],["MF","Gyabi",64],["MF","Randell",64],["MF","Houghton",64],["AT","Whittaker",66],["AT","Bundu",64],["AT","Hardie",65]],
  "Cardiff City": [["GK","Turner",64],["DF","Ng",64],["DF","Goutas",64],["DF","Fish",63],["DF","Bagan",62],["MF","Robertson",64],["MF","Sia",63],["MF","Grant",63],["AT","Robinson",65],["AT","Bowler",65],["AT","Etete",63]],
  "Luton Town": [["GK","Kaminski",66],["DF","Mengi",66],["DF","Burke",64],["DF","Walsh",63],["DF","Doughty",64],["MF","Clark",65],["MF","Rushworth",63],["MF","Lukonga",63],["AT","Adebayo",65],["AT","Morris",66],["AT","Brown",64]],
  "Wrexham AFC": [["GK","Okonkwo",62],["DF","Brunt",62],["DF","O'Connell",64],["DF","Tozer",63],["DF","Cleworth",62],["MF","Dobson",64],["MF","Cannon",63],["MF","Evans",65],["AT","Mullin",66],["AT","Fletcher",63],["AT","Palmer",63]],
  "Birmingham City": [["GK","Allsop",64],["DF","Klarer",63],["DF","Davies",63],["DF","Iwata",62],["DF","Cochrane",61],["MF","Paik",64],["MF","Peck",63],["MF","Gardner",63],["AT","Stansfield",65],["AT","Hansen",62],["AT","Jutkiewicz",61]],
  "Wycombe Wanderers": [["GK","Ward",60],["DF","Grimmer",61],["DF","Bates",61],["DF","Obita",61],["DF","Boyes",60],["MF","Scowen",61],["MF","Butcher",60],["MF","Richards",60],["AT","Kone",62],["AT","Campbell",61],["AT","Low",59]],
  "Bolton Wanderers": [["GK","Baxter",62],["DF","Forino",62],["DF","Santos",63],["DF","Toal",61],["DF","Shenton",60],["MF","Morley",62],["MF","Dempsey",61],["MF","Sheehan",63],["AT","Charles",63],["AT","Adeboyejo",62],["AT","Nlundulu",61]],
  "Derby County": [["GK","Zetterstrom",61],["DF","Nelson",61],["DF","Bradley",60],["DF","Forsyth",60],["DF","Edwards",59],["MF","Hourihane",61],["MF","Adams",61],["MF","Thompson",60],["AT","Collins",62],["AT","Washington",60],["AT","Blackett-Taylor",60]],
  "Barnsley FC": [["GK","Isted",59],["DF","Earl",60],["DF","Andersen",60],["DF","Pines",59],["DF","Williams",58],["MF","Connell",60],["MF","Phillips",59],["MF","Cotter",58],["AT","Aitchison",60],["AT","Jalo",59],["AT","Norwood",59]],
  "Charlton Athletic": [["GK","Maynard-Brewer",59],["DF","Kane",60],["DF","Jones",60],["DF","Ramsay",59],["DF","McEachran",58],["MF","Taylor",61],["MF","Anderson",59],["MF","Doherty",58],["AT","Leaburn",61],["AT","Godden",60],["AT","Aidoo",58]],
  "Huddersfield Town": [["GK","Maxwell",59],["DF","Turton",59],["DF","Ruffels",59],["DF","Spencer",58],["DF","Lees",59],["MF","Wiles",60],["MF","Kasumu",59],["MF","Hodge",58],["AT","Marshall",59],["AT","Ward",60],["AT","Healey",60]],
  "Reading FC": [["GK","Pereira",58],["DF","Mbengue",59],["DF","Long",58],["DF","Rolston",57],["DF","Holsgrove",57],["MF","Wing",59],["MF","Savage",58],["MF","Elliott",58],["AT","Ehibhatiomhan",59],["AT","Wareham",57],["AT","Knibbs",60]],
  "Peterborough United": [["GK","Burgess",59],["DF","Jones",59],["DF","Collins",59],["DF","Katongo",58],["DF","Mason",57],["MF","Kypreos",58],["MF","De Haviland",58],["MF","Davies",57],["AT","Poku",61],["AT","Jade Jones",60],["AT","Tshibangu",57]],
  "Oxford United": [["GK","Cumming",59],["DF","Long",59],["DF","Brown",59],["DF","Vaulks",59],["DF","Goodrham",57],["MF","Brannagan",60],["MF","El Mizouni",58],["MF","McGuane",57],["AT","Placheta",60],["AT","Harris",58],["AT","Rodrigues",57]],
  "Portsmouth FC": [["GK","Schmid",59],["DF","Swanson",59],["DF","Moore",58],["DF","Towler",57],["DF","Ogilvie",58],["MF","Potts",59],["MF","Moxon",58],["MF","Leigh",56],["AT","Bishop",60],["AT","Yengi",59],["AT","Kamara",57]],
  "Blackpool FC": [["GK","Maxwell",58],["DF","Casey",58],["DF","Penney",57],["DF","Thornley",57],["DF","Husband",57],["MF","Virtue",58],["MF","Carey",58],["MF","Lovelace",56],["AT","Hamilton",58],["AT","Apter",57],["AT","Morgan",56]],
  "Shrewsbury Town": [["GK","Burgoyne",57],["DF","Hoole",57],["DF","Pierre",57],["DF","Williams",56],["DF","Feeney",56],["MF","Biggins",57],["MF","Rossiter",56],["MF","Bloxham",56],["AT","Ojo",56],["AT","Udoh",57],["AT","Gnahore",55]],
  "Stevenage FC": [["GK","Ashby-Hammond",57],["DF","Wildin",57],["DF","Piergianni",58],["DF","Frecklington",56],["DF","Butler",55],["MF","Reid",56],["MF","Phillips",56],["MF","Young",55],["AT","Roberts",56],["AT","List",56],["AT","Aboh",55]],
  "Lincoln City": [["GK","Jensen",56],["DF","Jackson",56],["DF","Roughan",56],["DF","Bramall",56],["DF","Eyoma",55],["MF","Erhahon",57],["MF","Mandron",55],["MF","Smith",55],["AT","House",56],["AT","Makama",55],["AT","Gallagher",55]],
  "Exeter City": [["GK","Pierce",56],["DF","Sweeney",56],["DF","Diabate",55],["DF","Hartridge",55],["DF","Pope",54],["MF","Kite",55],["MF","Niskanen",56],["MF","Cole",54],["AT","Maggs",55],["AT","Phillips",55],["AT","Scott",54]],
  "Cambridge United": [["GK","Mannion",56],["DF","Williams",55],["DF","Bennett",55],["DF","Okoro",54],["DF","Iredale",54],["MF","Kachunga",55],["MF","Duberry",54],["MF","Gibbons",54],["AT","Lavery",55],["AT","Hogan",55],["AT","East",53]],
  "Burton Albion": [["GK","Garratt",54],["DF","Moon",54],["DF","Harper",54],["DF","Whitmore",53],["DF","Williams",53],["MF","Hopper",54],["MF","Sweeney",54],["MF","Kamwa",53],["AT","Wolstenholme",54],["AT","Orsi-Davies",54],["AT","Bassett",53]],
  "Northampton Town": [["GK","Norris",55],["DF","Guthrie",55],["DF","Dykes",54],["DF","Sherring",54],["DF","Mbete",53],["MF","Hondermarck",54],["MF","McWilliams",55],["MF","Baccus",54],["AT","Appere",55],["AT","Eisa",55],["AT","Bowie",53]],
  "Real Zaragoza": [["GK","Raton",66],["DF","Lorente",64],["DF","Lopez",65],["DF","Nieto",63],["DF","Igbekeme",63],["MF","Areso",65],["MF","Serrano",64],["MF","Gil",63],["AT","Salech",65],["AT","Qasmi",64],["AT","Bochar",63]],
  "Real Oviedo": [["GK","Miguel",64],["DF","Bolano",64],["DF","Costas",65],["DF","Moyano",63],["DF","Chema",63],["MF","Cazorla",70],["MF","Colombatto",66],["MF","Seijas",63],["AT","Ilyas",64],["AT","Ramon",63],["AT","Santi",62]],
  "Sporting Gijon": [["GK","Marcelo",63],["DF","Rosiers",63],["DF","Pierrot",64],["DF","Munoz",62],["DF","Cote",63],["MF","Campabadal",62],["MF","Nunez",63],["MF","Gonzalez",62],["AT","Carrillo",64],["AT","Cantero",62],["AT","Guerreo",61]],
  "Real Sporting": [["GK","Diego",62],["DF","Manzanara",62],["DF","Fernandez",63],["DF","Garcia",61],["DF","Vera",61],["MF","Miro",62],["MF","Val",62],["MF","Sangalli",61],["AT","Torre",63],["AT","Charly",61],["AT","Sahin",60]],
  "Deportivo La Coruna": [["GK","Parrenno",65],["DF","Lopez",64],["DF","Barreiro",64],["DF","Pablo Garcia",63],["DF","Hernandez",62],["MF","Bergantino",63],["MF","Mario Suarez",64],["MF","Yeremay",66],["AT","Asor",63],["AT","Barcia",62],["AT","Mella",62]],
  "Real Murcia": [["GK","Nacho",61],["DF","Loro",60],["DF","Pena",61],["DF","Alonso",60],["DF","Munoz",59],["MF","Parejo",61],["MF","Sanchidrian",60],["MF","Reina",59],["AT","Eloy",61],["AT","Gonzalo",60],["AT","Alejandro",59]],
  "CD Tenerife": [["GK","Ortega",62],["DF","Jose Leon",63],["DF","Alvarez",62],["DF","Serrano",61],["DF","Gonzalez",60],["MF","Aitor",62],["MF","Moises",61],["MF","Lozano",60],["AT","Naranjo",63],["AT","Cabrera",61],["AT","Salazar",60]],
  "Racing Santander": [["GK","Miquele",63],["DF","Valentin",62],["DF","Perez",63],["DF","Mantilla",61],["DF","Zalaya",60],["MF","Cobo",62],["MF","Lagreca",61],["MF","Iñigo",61],["AT","Agius",63],["AT","Suleiman",62],["AT","Gonzalez",60]],
  "CD Mirandes": [["GK","Rufea",60],["DF","Royo",60],["DF","Martinez",61],["DF","Exposito",59],["DF","Dominguez",59],["MF","Siverio",60],["MF","Camacho",60],["MF","Bouzon",59],["AT","Ekain",61],["AT","Latasa",60],["AT","Hernani",58]],
  "Albacete Balompie": [["GK","Gonzalez",60],["DF","Pena",60],["DF","Garcia",61],["DF","Rodri",59],["DF","Ruano",58],["MF","Zapater",61],["MF","Omar",60],["MF","Fernandez",59],["AT","Herve",60],["AT","Nunez",59],["AT","Vazquez",58]],
  "Granada CF": [["GK","Fuzato",65],["DF","Briceno",63],["DF","Ingason",64],["DF","Pellistri",62],["DF","Neva",62],["MF","Gonzalez",63],["MF","Martin",63],["MF","Puertas",64],["AT","Boyé",66],["AT","Castillejo",64],["AT","Soriano",61]],
  "Levante UD": [["GK","Andres",63],["DF","Ivan",63],["DF","Duarte",64],["DF","Clemente",62],["DF","Ander",61],["MF","Pablo",63],["MF","Rochina",63],["MF","Carlos Alvarez",64],["AT","Semi",64],["AT","Brugui",63],["AT","Espi",61]],
  "Elche CF": [["GK","San Roman",63],["DF","Banacolocha",62],["DF","Pepelu",63],["DF","Chino",61],["DF","Alberto",61],["MF","Guti",63],["MF","Boye",62],["MF","Rico",62],["AT","Moha",64],["AT","Lusamba",63],["AT","Casas",60]],
  "Real Valladolid B": [["GK","Fernandez",59],["DF","Garcia",59],["DF","Martin",58],["DF","Diego",58],["DF","Sergio",57],["MF","Mario",59],["MF","Iker",58],["MF","Pablo",57],["AT","Adrian",59],["AT","Jordan",58],["AT","Ivo",56]],
  "Burgos CF": [["GK","Cortina",61],["DF","Ruso",61],["DF","Mendez",62],["DF","Lopez",60],["DF","Ortiz",59],["MF","Santamaria",61],["MF","Mumu",60],["MF","Olabarrieta",59],["AT","Calle",61],["AT","Ferrari",60],["AT","Borja",59]],
  "Eibar": [["GK","Ruben",63],["DF","Alonso",62],["DF","Pomares",63],["DF","Berrocal",61],["DF","Soberon",60],["MF","Gonzalez",62],["MF","Salvachua",61],["MF","Matheus",61],["AT","Enrique",63],["AT","Sergio",61],["AT","Santos",60]],
  "Huesca": [["GK","Requena",61],["DF","Miguel",61],["DF","Garrido",62],["DF","Luis Garcia",60],["DF","Javi",59],["MF","Piriz",61],["MF","Aguado",60],["MF","Sergio",59],["AT","Raba",62],["AT","Embulla",60],["AT","Juanan",59]],
  "Cordoba CF": [["GK","Antonio",61],["DF","Carrillo",61],["DF","Rodri",62],["DF","Calderon",60],["DF","Vazquez",59],["MF","Adrian",61],["MF","Kike",60],["MF","Ronaldo",59],["AT","Juan",62],["AT","Bassey",60],["AT","Zarza",59]],
  "Malaga CF": [["GK","Casilla",63],["DF","Rinaudo",62],["DF","Gonzalez",63],["DF","Bustinza",61],["DF","Reyes",60],["MF","Zalazar",62],["MF","Ivan",61],["MF","Ramon",60],["AT","Dion",64],["AT","Lombini",61],["AT","Otts",59]],
  "FC Cartagena": [["GK","Gonzalez",60],["DF","Lillo",60],["DF","Alonso",61],["DF","Andujar",59],["DF","Torres",58],["MF","Ander",60],["MF","Jesus",59],["MF","Lago",58],["AT","Edu",61],["AT","Ruben",59],["AT","Sergio",58]],
  "Hamburger SV": [["GK","Heuer Ferner",68],["DF","Schmidt",66],["DF","Vuskovic",68],["DF","Jans",65],["DF","Muheim",65],["MF","Meffert",66],["MF","Reis",66],["MF","Meuer",64],["AT","Dompe",67],["AT","Glatzel",68],["AT","Uzun",70]],
  "FC Koln": [["GK","Schwabe",68],["DF","Hubers",67],["DF","Kilian",66],["DF","Chabot",67],["DF","Heintz",65],["MF","Huseinbasic",66],["MF","Martel",65],["MF","Ljubicic",66],["AT","Thielmann",66],["AT","Maina",67],["AT","Selke",68]],
  "Fortuna Dusseldorf": [["GK","Kastenmeier",65],["DF","Sohn",64],["DF","Iwu",64],["DF","Hoffmann",63],["DF","Sobottka",63],["MF","Berber",62],["MF","Niemiec",62],["MF","Gyau",61],["AT","Kownacki",65],["AT","Mustafa",64],["AT","Camara",63]],
  "1. FC Kaiserslautern": [["GK","Krahl",65],["DF","Zimmer",64],["DF","Sirchyk",63],["DF","Buballa",62],["DF","Klewin",62],["MF","Hanslik",63],["MF","Niehues",63],["MF","Ritter",62],["AT","Ceesay",64],["AT","Alario",65],["AT","Wunderlich",62]],
  "Hannover 96": [["GK","Zieler",67],["DF","Dehm",64],["DF","Neumann",64],["DF","Erik",63],["DF","Schmoll",62],["MF","Kaiser",65],["MF","Dabrowski",63],["MF","Ernst",63],["AT","Teuchert",65],["AT","Nyemann",62],["AT","Weydandt",62]],
  "1. FC Nurnberg": [["GK","Kallas",64],["DF","Volkmer",63],["DF","Gebauer",62],["DF","Soares",62],["DF","Handwerker",61],["MF","Castrop",64],["MF","Schleimer",62],["MF","Frantz",61],["AT","Duc",62],["AT","Tzolis",63],["AT","Behrens",63]],
  "SV Darmstadt 98": [["GK","Wiese",63],["DF","Bredow",62],["DF","Zimmer",62],["DF","Mellich",61],["DF","Pretzlaff",60],["MF","Holland",62],["MF","Justvan",63],["MF","Truelic",61],["AT","Pfeiffer",63],["AT","Vilhelmsson",62],["AT","Celic",61]],
  "Karlsruher SC": [["GK","Wein",63],["DF","Hecker",62],["DF","Francke",62],["DF","Kobald",62],["DF","Sigle",61],["MF","Wanitzek",63],["MF","Rapp",62],["MF","Pinto",61],["AT","Batmaz",63],["AT","Diamantakos",64],["AT","Schleusener",62]],
  "SC Paderborn 07": [["GK","Hespe",63],["DF","Curda",62],["DF","Hansen",62],["DF","Collins",61],["DF","Obermair",61],["MF","Klement",63],["MF","Gueye",62],["MF","Bilbija",63],["AT","Muslija",64],["AT","Conteh",63],["AT","Mamba",62]],
  "SpVgg Greuther Furth": [["GK","Sahin",62],["DF","Mohr",62],["DF","Jelinek",61],["DF","Sorescu",61],["DF","Sanchez",60],["MF","Ibrahim",62],["MF","Fonin",60],["MF","Hachadi",60],["AT","Hrgota",63],["AT","Srbeny",62],["AT","Lemperle",61]],
  "Hertha BSC": [["GK","Ernst",64],["DF","Mladenovic",62],["DF","Leistner",64],["DF","Dardai",63],["DF","Karbownik",63],["MF","Cuisance",64],["MF","Winkler",62],["MF","Zeefuik",61],["AT","Jovic",64],["AT","Cher",63],["AT","Ejuke",63]],
  "1. FC Magdeburg": [["GK","Reimann",62],["DF","Muller",61],["DF","Teixeira",61],["DF","Kruger",60],["DF","Jakel",60],["MF","Krempicki",62],["MF","El Hankouri",61],["MF","Ito",61],["AT","Lescano",62],["AT","Musonda",61],["AT","Atik",60]],
  "Eintracht Braunschweig": [["GK","Grahl",61],["DF","Gasda",61],["DF","Wiebe",60],["DF","Ba",60],["DF","Otubamjo",59],["MF","Kaufman",61],["MF","Behrens",60],["MF","Henning",60],["AT","Multhaup",61],["AT","Ujah",61],["AT","Gomez",60]],
  "SSV Ulm 1846": [["GK","Hild",61],["DF","Higl",61],["DF","Stojanovic",60],["DF","Lang",60],["DF","Rottweiler",59],["MF","Rottenthaler",60],["MF","Beyer",60],["MF","Glaser",59],["AT","Seufert",60],["AT","Dzabic",60],["AT","Aydin",59]],
  "Jahn Regensburg": [["GK","Meyer",60],["DF","Hein",60],["DF","Sauer",59],["DF","Gimber",59],["DF","Schnell",58],["MF","Pröger",59],["MF","Besuschkow",59],["MF","Sachse",58],["AT","Kother",60],["AT","Otto",60],["AT","Niasse",59]],
  "SV Elversberg": [["GK","Krist",61],["DF","Fechner",61],["DF","Baumgartner",60],["DF","Jungkurth",59],["DF","Soklar",59],["MF","Wanner",60],["MF","Shahin",60],["MF","Neudecker",61],["AT","Dams",60],["AT","Fahlstedt",59],["AT","Simic",58]],
  "Preussen Munster": [["GK","Seidel",59],["DF","Benger",59],["DF","Köhler",58],["DF","Goldan",58],["DF","Scherder",57],["MF","Dombrowka",59],["MF","Gersbach",58],["MF","Heldmann",57],["AT","Lokotsch",59],["AT","Bischof",58],["AT","Pidde",57]],
  "Schalke 04": [["GK","Fährmann",66],["DF","Bulut",65],["DF","Kaminski",64],["DF","Sylla",64],["DF","Bekkali",62],["MF","Kabadayı",64],["MF","Bachmann",63],["MF","Ofori",62],["AT","Karaman",66],["AT","Aygün",64],["AT","Lasme",62]],
  "Sassuolo": [["GK","Pigliacelli",67],["DF","Toljan",66],["DF","Viti",65],["DF","Muharemovic",64],["DF","Missaoi",63],["MF","Boloca",65],["MF","Moro",64],["MF","Lipani",63],["AT","Berardi",74],["AT","Mulattieri",70],["AT","Antiste",63]],
  "US Cremonese": [["GK","Sarr",63],["DF","Varnier",64],["DF","Bianchetti",63],["DF","Rillo",62],["DF","Fornari",61],["MF","Castagnetti",64],["MF","Bertagnoli",63],["MF","Parisi",62],["AT","Okwonkwo",63],["AT","Cervi",63],["AT","Antonucci",62]],
  "Pisa SC": [["GK","Torriani",63],["DF","Canestrelli",63],["DF","Carvalho",63],["DF","Quignoz",62],["DF","Birindelli",62],["MF","Drager",63],["MF","Marin",63],["MF","Tramoni",63],["AT","Mlakar",64],["AT","Moreo",62],["AT","Guie Gneba",61]],
  "Brescia Calcio": [["GK","Carrara",62],["DF","Cistana",62],["DF","Merkaj",61],["DF","Olzer",60],["DF","Bertoli",59],["MF","Folorunsho",63],["MF","Dessena",61],["MF","Riviera",60],["AT","Gallo",62],["AT","Bonfanti",61],["AT","Bianchi",60]],
  "Sampdoria": [["GK","Conti",63],["DF","Romagna",63],["DF","Ioannou",62],["DF","Pedersen",62],["DF","Ferrari",61],["MF","Jankto",62],["MF","Rincon",62],["MF","Depaoli",61],["AT","Ntcham",63],["AT","Coda",62],["AT","La Gumina",61]],
  "Palermo FC": [["GK","Desplanches",63],["DF","Valerio",62],["DF","Mikic",61],["DF","Vasic",61],["DF","Broh",60],["MF","Palumbo",62],["MF","Gomes",63],["MF","Segre",61],["AT","Di Mariano",62],["AT","Soleri",63],["AT","Di Francesco",62]],
  "Modena FC": [["GK","Gomis",62],["DF","Colombo",62],["DF","Battistella",61],["DF","Secchi",61],["DF","Cittadini",60],["MF","Magnino",62],["MF","Bolley",61],["MF","Obeng",61],["AT","Fantini",63],["AT","Di Pardo",61],["AT","Gyasi",62]],
  "SSC Bari": [["GK","Perisan",61],["DF","Mattiello",61],["DF","Vukotic",60],["DF","Mancin",60],["DF","Mayewski",59],["MF","Piccinini",61],["MF","Bisoli",61],["MF","Folorunsho",62],["AT","Sibilli",62],["AT","Alarcon",60],["AT","Brosco",59]],
  "Catanzaro": [["GK","Rocca",60],["DF","Pipoli",61],["DF","Brighenti",60],["DF","Vitale",59],["DF","Curcio",59],["MF","Gargiulo",61],["MF","Pontisso",60],["MF","Fazio",59],["AT","Pierno",61],["AT","Martinelli",60],["AT","Biancone",59]],
  "Spezia Calcio": [["GK","Berardi",60],["DF","Caldirola",61],["DF","Hasic",60],["DF","Reca",60],["DF","Bertola",59],["MF","Fofana",61],["MF","Bourabia",60],["MF","Zarzana",61],["AT","Nzola",62],["AT","Verre",60],["AT","Reinthaler",59]],
  "Frosinone Calcio": [["GK","Turati",61],["DF","Marchizza",60],["DF","Valeri",60],["DF","Montero",61],["DF","Oyono",59],["MF","Kiyine",60],["MF","Mazzitelli",61],["MF","Cassei",59],["AT","Falletti",61],["AT","Garritano",60],["AT","Hasa",59]],
  "Reggina 1914": [["GK","Fragapane",58],["DF","Ravelli",58],["DF","Mazzarani",57],["DF","Camilleri",57],["DF","Riva",56],["MF","Crisetig",60],["MF","Botturi",57],["MF","Fumagalli",58],["AT","Di Chiara",58],["AT","Cinque",57],["AT","Carlini",57]],
  "Ascoli Calcio": [["GK","Favali",57],["DF","Fai",58],["DF","Vetri",57],["DF","Masciale",56],["DF","Sarkic",55],["MF","Cocchi",57],["MF","Casini",56],["MF","Biondi",56],["AT","Fallo",57],["AT","Ferri",56],["AT","Petrelli",55]],
  "Ternana Calcio": [["GK","Contini",56],["DF","Lucchesi",56],["DF","Sgarra",55],["DF","Pirani",55],["DF","Ferrante",54],["MF","Ciano",57],["MF","Capuano",55],["MF","Cabrera",55],["AT","Fisichella",56],["AT","Tumminello",56],["AT","Peralta",54]],
  "Perugia Calcio": [["GK","Seri",56],["DF","Di Crescenzo",57],["DF","Martella",56],["DF","Longoni",55],["DF","Santoro",54],["MF","Bottini",56],["MF","Del Prato",56],["MF","Cavasin",54],["AT","Picello",55],["AT","Konate",55],["AT","Gyasi",54]],
  "Cosenza Calcio": [["GK","Festa",56],["DF","Rizzo",57],["DF","Clemente",55],["DF","Ghazoini",54],["DF","Driussi",53],["MF","Rocca",56],["MF","Coppola",55],["MF","Tiriticello",54],["AT","Cianci",55],["AT","Verna",55],["AT","Bianchini",54]],
  "SPAL": [["GK","Begic",56],["DF","Fiori",55],["DF","Botturi",54],["DF","Missori",55],["DF","Fiordaliso",53],["MF","Mancuso",55],["MF","Pettinari",54],["MF","Cocomello",54],["AT","Cerri",56],["AT","Lapena",54],["AT","Mancini",53]],
  "Benevento Calcio": [["GK","Cragno",55],["DF","Leveratto",54],["DF","Rullo",54],["DF","Sarri",53],["DF","Venditti",53],["MF","Tello",55],["MF","Riggio",54],["MF","Insigne",55],["AT","Piccolo",54],["AT","Tufano",53],["AT","Moncini",55]],
  "Calcio Lecco 1912": [["GK","Gabellini",54],["DF","Ioniță",54],["DF","Zambataro",53],["DF","Bianchi",53],["DF","Pascali",52],["MF","Majer",54],["MF","Bottone",53],["MF","Signori",52],["AT","Galieni",54],["AT","Marcandalli",53],["AT","Careccia",52]],
  "Sudtirol": [["GK","Poluzzi",55],["DF","Miangue",55],["DF","Bettini",54],["DF","Rossi",53],["DF","Merlini",53],["MF","Tolo",54],["MF","Peralta",53],["MF","Fischnaller",55],["AT","Camaj",55],["AT","Fall",53],["AT","Voltan",52]],
  "Virtus Entella": [["GK","Parlanti",52],["DF","Turchetta",51],["DF","Ceccarelli",52],["DF","Pozzoni",50],["DF","Zarbana",50],["MF","Grossi",52],["MF","Bruzzo",51],["MF","Nebbia",50],["AT","Caponi",52],["AT","Sibilli",50],["AT","Guidi",49]],
  "Cesena FC": [["GK","Merlini",54],["DF","Toledo",54],["DF","Ferrari",55],["DF","Ciambrich",53],["DF","Favilla",52],["MF","Calò",54],["MF","Bertolo",53],["MF","Castellano",54],["AT","Zerbin",55],["AT","Santini",53],["AT","Obeng",52]],
  "Padova": [["GK","Bordin",52],["DF","Ruffo",52],["DF","Fantoni",51],["DF","Basso",51],["DF","Pinna",50],["MF","Rada",52],["MF","Mazzetto",51],["MF","Perrotta",51],["AT","Borrelli",52],["AT","Cocuzza",51],["AT","Tundo",50]],
  "Vicenza": [["GK","Russo",54],["DF","Di Piazza",53],["DF","Sabo",54],["DF","Giordani",52],["DF","Martinelli",52],["MF","Iori",54],["MF","Carraro",53],["MF","Modolo",52],["AT","Marcellusi",54],["AT","Pio Loco",53],["AT","Biressi",51]],
  "Carrarese": [["GK","Viviani",51],["DF","Pradelli",51],["DF","Meconi",51],["DF","Fontana",50],["DF","Pandolfi",50],["MF","Casarini",51],["MF","Zampano",51],["MF","Schettino",52],["AT","Tavano",53],["AT","Cerri",50],["AT","Boccardi",49]],
  "Juventus Next Gen": [["GK","Daffara",53],["DF","Ravanello",52],["DF","Sekhon",52],["DF","Miretti",54],["DF","Bianco",51],["MF","Hasa",53],["MF","Coudert",52],["MF","Turicchia",52],["AT","Mbangula",58],["AT","Yıldırım",53],["AT","Licini",50]],
  "Atalanta U23": [["GK","Perri",52],["DF","Fiordaliso",52],["DF","Casisa",51],["DF","Kossounou",52],["DF","Bordin",50],["MF","Buljic",52],["MF","Vismara",53],["MF","Cassei",51],["AT","Djuipty",52],["AT","Mercerin",53],["AT","Olzer",50]],
  "Pescara Calcio": [["GK","Scarperia",52],["DF","Lucchesi",52],["DF","Quintana",51],["DF","Moro",51],["DF","Fragetta",50],["MF","Sgarra",52],["MF","Drudi",51],["MF","Sapone",50],["AT","Sibilli",53],["AT","Pellegrini",52],["AT","Fumagalli",50]],
  "Avellino": [["GK","Gallo",54],["DF","Rizzo",54],["DF","Camporese",53],["DF","Sarr",52],["DF","Mazzone",52],["MF","Piccinini",53],["MF","D'Alterio",52],["MF","Tello",53],["AT","Castellano",53],["AT","Bianchini",52],["AT","Palumbo",51]],
  "Audace Cerignola": [["GK","Del Grosso",51],["DF","Vitiello",51],["DF","Mazza",51],["DF","Verzini",50],["DF","Pinto",50],["MF","Forte",51],["MF","Basso",51],["MF","Soprano",50],["AT","Santoro",52],["AT","Volpe",51],["AT","Guadagni",49]],
  "Monterosi Tuscia": [["GK","Marino",50],["DF","Grasso",50],["DF","D'Orazio",50],["DF","Santini",49],["DF","Rinaldi",49],["MF","Rada",50],["MF","Mancini",50],["MF","Ruggiero",49],["AT","Corsetti",50],["AT","Espinosa",50],["AT","Palumbo",48]],
  "Potenza Calcio": [["GK","Cuneo",50],["DF","Forte",50],["DF","Grosu",50],["DF","Nocerino",50],["DF","Ruggiero",49],["MF","Rigoni",51],["MF","Muraglia",50],["MF","Torraca",51],["AT","Cinque",50],["AT","Riviera",50],["AT","Fallo",49]],
  "Feralpisalo": [["GK","Marcandalli",52],["DF","Martella",52],["DF","Bettini",51],["DF","Lombardo",51],["DF","Majer",50],["MF","Petrelli",52],["MF","Faggioli",51],["MF","Strambelli",51],["AT","Santoro",52],["AT","Comi",51],["AT","Galieni",50]],
  "Triestina": [["GK","Pugliese",52],["DF","Pezzuto",52],["DF","Rada",51],["DF","Strefanizza",51],["DF","Grosu",50],["MF","Cocchi",52],["MF","Botturi",51],["MF","Pichi",51],["AT","Fisichella",52],["AT","Bianchini",51],["AT","Longoni",50]],
  "Gubbio": [["GK","De Sanctis",50],["DF","Tuccio",50],["DF","Brisac",50],["DF","Camilleri",50],["DF","Sgarra",49],["MF","Coco",50],["MF","Ciarlantini",50],["MF","Piccinini",49],["AT","Sibilli",50],["AT","Rovella",50],["AT","Ferrari",48]],
  "Rimini FC": [["GK","Rocca",52],["DF","Tito",51],["DF","Latombe",51],["DF","Trittau",51],["DF","Ferretti",50],["MF","Giaccheri",51],["MF","Lagreca",51],["MF","Palmieri",51],["AT","Riviera",52],["AT","Di Chiara",51],["AT","Santoro",50]],
  "Ancona-Matelica": [["GK","Romano",50],["DF","Palmieri",50],["DF","Dell'Orco",50],["DF","Ferrara",50],["DF","Mancini",49],["MF","Biancone",50],["MF","Carraro",50],["MF","Boccardi",49],["AT","Tumminello",51],["AT","Cinque",50],["AT","Peralta",49]],
  "Lucchese": [["GK","Piacitelli",50],["DF","Bottone",50],["DF","Turchetta",50],["DF","Becchi",50],["DF","Zampano",49],["MF","Fantoni",50],["MF","Ciambrich",50],["MF","Guidi",49],["AT","Tavano",51],["AT","Borrelli",50],["AT","Tundo",49]],
  "Pineto": [["GK","Parlanti",49],["DF","Ruffo",50],["DF","Ceccarelli",50],["DF","Meconi",49],["DF","Favilla",49],["MF","Casarini",50],["MF","Pradelli",50],["MF","Zampano",49],["AT","Cocuzza",50],["AT","Boccardi",50],["AT","Caponi",48]],
  "Sorrento": [["GK","Viviani",50],["DF","Pinna",50],["DF","Fantoni",49],["DF","Sgarra",49],["DF","Rinaldi",48],["MF","Rada",50],["MF","Mancini",49],["MF","Ruggiero",49],["AT","Corsetti",50],["AT","Espinosa",49],["AT","Volpe",48]],
  "FC Metz": [["GK","Oukidja",65],["DF","Sy",61],["DF","Latombe",61],["DF","Diallo",60],["DF","Kechid",59],["MF","Camara",61],["MF","Ndour",60],["MF","Jallow",59],["AT","Mafouta",62],["AT","Amenallah",60],["AT","Boakye",60]],
  "FC Lorient": [["GK","Mvogo",64],["DF","Le Goff",60],["DF","Tangbo",60],["DF","Loric",61],["DF","Mendy",59],["MF","Abergel",61],["MF","Savage",60],["MF","Fayad",59],["AT","Sylvain",60],["AT","Kanga",61],["AT","Bakayoko",60]],
  "AS Nancy Lorraine": [["GK","Couto",58],["DF","Ciss",58],["DF","Lahmer",57],["DF","Boudjemaa",58],["DF","Karim",57],["MF","Dembélé",58],["MF","Gibot",57],["MF","Roux",57],["AT","Chahiri",59],["AT","Brun",58],["AT","Bassou",57]],
  "Paris FC": [["GK","Lopes",62],["DF","Ducasse",60],["DF","Seydi",60],["DF","Kebbal",59],["DF","Marteau",59],["MF","Camara",61],["MF","Bakker",60],["MF","Tchokounté",61],["AT","Guillaume",60],["AT","Bakari",61],["AT","Cadiou",59]],
  "Rodez AF": [["GK","Bvouma",57],["DF","Mendy",57],["DF","Boyer",57],["DF","Raux-Yao",58],["DF","Bouali",56],["MF","Dembele",57],["MF","Youssouf",57],["MF","Ravelomanantsoa",56],["AT","Nkada",58],["AT","Kerouedan",57],["AT","Bougou",56]],
  "EA Guingamp": [["GK","Mady",58],["DF","Soppy",58],["DF","Le Roux",59],["DF","Luvambo",57],["DF","Koita",57],["MF","Picouleau",58],["MF","Marie",58],["MF","Gomis",57],["AT","Boudraa",58],["AT","Guitoun",58],["AT","Duku",57]],
  "Stade Lavallois": [["GK","Petrucci",57],["DF","Titeur",56],["DF","Chaveriat",56],["DF","Lopes",57],["DF","Karamoh",56],["MF","Pelmard",57],["MF","Da Silva",56],["MF","Arib",56],["AT","Bouaddi",58],["AT","Sayoud",57],["AT","Lusamba",56]],
  "AC Ajaccio": [["GK","Solič",57],["DF","Avom",57],["DF","Konaté",57],["DF","Bofunda",56],["DF","Botué",56],["MF","Nouri",57],["MF","Berre",56],["MF","Ikahecheg",56],["AT","Coulibaly",58],["AT","Semande",57],["AT","Gomis",56]],
  "Amiens SC": [["GK","Diaw",58],["DF","Kanku",58],["DF","Opoku",57],["DF","Traoré",57],["DF","Dibassy",57],["MF","Monke",58],["MF","Fofana",58],["MF","Kacem",57],["AT","Lusamba",59],["AT","Charlton",58],["AT","Willy",57]],
  "SM Caen": [["GK","Reulet",58],["DF","Abdoulie",57],["DF","Vergos",57],["DF","Gomis",58],["DF","Mendy",57],["MF","Banga",58],["MF","Thomas",58],["MF","Ndiaye",57],["AT","Mendy",59],["AT","Gory",58],["AT","Coulibaly",57]],
  "USL Dunkerque": [["GK","Verberne",57],["DF","Rodrigues",57],["DF","Georgin",56],["DF","Seydi",57],["DF","Batoum",56],["MF","Keïta",57],["MF","Timmerman",57],["MF","Babik",56],["AT","Berthomier",58],["AT","Kouamé",57],["AT","Kouassi",56]],
  "Pau FC": [["GK","Ollivier",56],["DF","Batisse",56],["DF","Kandé",56],["DF","Camara",55],["DF","Grain",55],["MF","Mons",56],["MF","Boussouf",56],["MF","Ntcham",57],["AT","D'Almeida",56],["AT","Labeau",55],["AT","Garita",55]],
  "Red Star FC": [["GK","Mercier",56],["DF","Dunquet",56],["DF","Bouchard",55],["DF","Mensah",56],["DF","Sané",55],["MF","Nkosi",56],["MF","Guitoun",55],["MF","Bouchet",55],["AT","Boateng",57],["AT","Sy",56],["AT","Millaud",55]],
  "FC Annecy": [["GK","Mendy",56],["DF","Pelmard",56],["DF","Baradji",55],["DF","Konaté",56],["DF","Diallo",55],["MF","Roux",56],["MF","Khalil",55],["MF","Dermaj",55],["AT","Balić",57],["AT","Sahin",56],["AT","Bengui",55]],
  "Grenoble Foot 38": [["GK","Leroy",56],["DF","Monrose",56],["DF","Sabor",56],["DF","Perozzi",55],["DF","Jovin",55],["MF","Bakayoko",56],["MF","Ravet",56],["MF","Bodiger",56],["AT","Seydi",57],["AT","Tchouatcha",56],["AT","Kouakou",55]],
  "SC Bastia": [["GK","Placide",57],["DF","Bouden",56],["DF","Mendy",56],["DF","Rouiller",56],["DF","Seydi",55],["MF","Peybernes",56],["MF","Trépagnier",56],["MF","Giannelli",56],["AT","Quéré",57],["AT","Lenzini",56],["AT","Millaud",55]],
  "US Quevilly-Rouen": [["GK","Lembet",55],["DF","Yattara",55],["DF","Ba",55],["DF","Diarra",55],["DF","Fofana",55],["MF","Soumaré",56],["MF","D'Almeida",55],["MF","Zouaoui",55],["AT","Tshipamba",56],["AT","Gelmain",55],["AT","Sow",55]],
  "Valenciennes FC": [["GK","Carpentier",55],["DF","Kaba",55],["DF","Deketelaere",56],["DF","Buatu",56],["DF","Ponceau",55],["MF","Lopez",56],["MF","Rabillard",55],["MF","Van den Bossche",56],["AT","Noubi",56],["AT","Arib",55],["AT","Haouari",55]]
};

const MYCLUB_POS = { GK: "goalkeeper", DF: "defender", MF: "midfielder", AT: "attacker" };

function makeMyClubExtraClubs() {
  for (const league of MYCLUB_LEAGUES) {
    for (const club of league.clubs) {
      if (TEAM_ROSTERS[club]) continue;
      if (MYCLUB_KITS[club]) teamColors[club] = MYCLUB_KITS[club];
      const rows = MYCLUB_SQUADS[club];
      if (!rows) continue;
      const defs = [], mids = [], atts = []; let gk = null;
      for (const row of rows) {
        const pos = row[0], name = row[1], ovr = row[2];
        const p = makeRatedPlayer(name, ovr, MYCLUB_POS[pos]);
        if (pos === "GK") gk = p;
        else if (pos === "DF") defs.push(p);
        else if (pos === "MF") mids.push(p);
        else atts.push(p);
      }
      TEAM_ROSTERS[club] = { defenders: defs, midfielders: mids, attackers: atts, goalkeeper: gk };
      if (typeof makeSquadDepth === "function") {
        const depth = makeSquadDepth(TEAM_ROSTERS[club], club);
        TEAM_ROSTERS[club].bench = depth.bench;
        TEAM_ROSTERS[club].reserves = depth.reserves;
      }
    }
  }
}

makeMyClubExtraClubs();

// The blue human. This stays the BLUE attacker on every client (host and guest
// alike) so that all of the simulation's `=== player` gates resolve identically
// on both peers. During a lockstep tick we TEMPORARILY rebind it to each human in
// a fixed canonical order, so the *sequence* of operations - not the identity of
// `player` - is what both clients agree on. `localPlayer` is the human the local
// keyboard actually drives, and is used only for camera, drawing and hotkeys.
let player = createPlayer(1425, 750, "#168cff", "blue", "attacker");
player.human = true;

// The human THIS client is steering. Equals `player` for a solo/host match; the
// red attacker for an online guest. Never used by the simulation.
let localPlayer = player;

let teammates = [

  // Defenders

  createPlayer(525, 300, "#42a5ff", "blue", "defender"),

  createPlayer(525, 600, "#42a5ff", "blue", "defender"),

  createPlayer(525, 900, "#42a5ff", "blue", "defender"),

  createPlayer(525, 1200, "#42a5ff", "blue", "defender"),



  // Midfielders

  createPlayer(975, 450, "#42a5ff", "blue", "midfielder"),

  createPlayer(975, 750, "#42a5ff", "blue", "midfielder"),

  createPlayer(975, 1050, "#42a5ff", "blue", "midfielder"),



  // Attackers (the human plays the third, central attacker above)

  createPlayer(1425, 450, "#42a5ff", "blue", "attacker"),

  createPlayer(1425, 1050, "#42a5ff", "blue", "attacker"),



  // Goalkeeper

  createPlayer(225, 750, "#42a5ff", "blue", "goalkeeper")

];

 

let opponents = [

  // Defenders

  createPlayer(field.x + field.width - 435, 300, "#e63946", "red", "defender"),

  createPlayer(field.x + field.width - 435, 600, "#e63946", "red", "defender"),

  createPlayer(field.x + field.width - 435, 900, "#e63946", "red", "defender"),

  createPlayer(field.x + field.width - 435, 1200, "#e63946", "red", "defender"),



  // Midfielders

  createPlayer(field.x + field.width - 885, 450, "#e63946", "red", "midfielder"),

  createPlayer(field.x + field.width - 885, 750, "#e63946", "red", "midfielder"),

  createPlayer(field.x + field.width - 885, 1050, "#e63946", "red", "midfielder"),



  // Attackers

  createPlayer(field.x + field.width - 1335, 450, "#ff5964", "red", "attacker"),

  createPlayer(field.x + field.width - 1335, 750, "#ff5964", "red", "attacker"),

  createPlayer(field.x + field.width - 1335, 1050, "#ff5964", "red", "attacker"),



  // Goalkeeper

  createPlayer(field.x + field.width - 135, 750, "#e63946", "red", "goalkeeper")

];

 

 

const referee = createPlayer(PITCH_CX, PITCH_CY, "#f7c325", "neutral", "referee");

const allPlayers = [player, ...teammates, ...opponents, referee]; 

// ---------------------------------------------------------------------------
// Lockstep human registry
// ---------------------------------------------------------------------------
// In a 1v1 online match BOTH teams are human-driven: blue is steered locally on
// the host, red is steered locally on the guest. Every client simulates the same
// 22 bodies; the only asymmetry is which human's keyboard is read.
//
// `simHumans` is the canonical, deterministic iteration order. Both peers walk
// it in exactly this sequence and rebind `player`/`teammates`/`opponents` before
// each entry, so the simulation reads identical values on both sides and stays
// bit-for-bit reproducible. A solo match has a single entry and behaves exactly
// as it always has.
let simHumans = [player];
let netGuestHuman = null;   // the red human, only present when this is a guest

function simHumanIndex(h) {
  for (let i = 0; i < simHumans.length; i++) if (simHumans[i] === h) return i;
  return -1;
}

// True when this client is running a true-simultaneous online match (i.e. there
// is more than one human to drive). Solo play and the legacy host-authoritative
// online path both return false and are untouched.
function netLockstepActive() {
  return simHumans.length > 1;
}

// Rebind the simulation globals onto `h`. `blueSquad`/`redSquad` keep the real
// squad lists so we can flip the team-relative view without losing them.
let blueSquad = teammates;
let redSquad = opponents;

function bindSimHuman(h) {
  player = h;
  if (h.team === "blue") { teammates = blueSquad; opponents = redSquad; }
  else { teammates = redSquad; opponents = blueSquad; }
}

// Reusable input frame. moveHuman reads exactly five key codes off the module
// scope `keys` object plus five booleans off `vInput`. `keys` is a const object
// so we mutate its properties and snapshot them; `vInput` is a `let` so we swap
// the reference wholesale. Each human owns a persistent frame, so held state
// (charging a shot, running) survives correctly across ticks.
function makeInputFrame() {
  return {
    keys: { up: false, down: false, left: false, right: false, shift: false, lb: false, rb: false, lt: false },
    stick: { x: 0, y: 0 },
    act: { shoot: false, pass: false, request: false, tackle: false, nudge: false, dribble: false, switch: false },
    prevAct: { shoot: false, pass: false, request: false, tackle: false, nudge: false, dribble: false, switch: false },
    press: { pass: false, request: false, tackle: false, nudge: false, dribble: false, switch: false },
  };
}

const NET_KEY_CODES = {
  up: ["w", "arrowup"], down: ["s", "arrowdown"],
  left: ["a", "arrowleft"], right: ["d", "arrowright"],
  shift: ["shift"], lb: ["g"], rb: ["r"], lt: ["q"],
};

// Snapshot the live keyboard into `f` (the local human's frame).
function frameFromLocal(f) {
  for (const dir in NET_KEY_CODES) {
    // The pad's sprint lives in vInput.sprint (there is no vInput.shift), so
    // the "shift" slot folds it in here or it never reaches the sim frame and
    // applyFrameToInput would zero it before every moveHuman().
    f.keys[dir] = NET_KEY_CODES[dir].some((c) => keys[c]) ||
      (dir === "shift" ? !!vInput.sprint : !!vInput[dir]);
  }
  f.stick.x = (typeof vInput.rsx === "number") ? vInput.rsx : 0;
  f.stick.y = (typeof vInput.rsy === "number") ? vInput.rsy : 0;
  return f;
}

// Push `f` into the live input globals. `sav` receives the prior values.
function applyFrameToInput(f, sav) {
  for (const dir in NET_KEY_CODES) {
    for (const c of NET_KEY_CODES[dir]) {
      sav[c] = keys[c];
      keys[c] = !!f.keys[dir];
    }
  }
  for (const dir in NET_KEY_CODES) sav["v:" + dir] = vInput[dir];
  vInput.up = f.keys.up; vInput.down = f.keys.down;
  vInput.left = f.keys.left; vInput.right = f.keys.right;
  vInput.sprint = f.keys.shift;
  vInput.lb = f.keys.lb; vInput.rb = f.keys.rb; vInput.lt = f.keys.lt;
  sav["v:rsx"] = vInput.rsx; sav["v:rsy"] = vInput.rsy;
  vInput.rsx = f.stick.x; vInput.rsy = f.stick.y;
}

function restoreInput(sav) {
  for (const dir in NET_KEY_CODES) {
    for (const c of NET_KEY_CODES[dir]) keys[c] = sav[c];
  }
  for (const dir in NET_KEY_CODES) vInput[dir] = sav["v:" + dir];
  vInput.rsx = sav["v:rsx"]; vInput.rsy = sav["v:rsy"];
}

let netInsideTick = false;

// In a lockstep match the only thing allowed to fire a human action is the
// simulation itself, driven from the replicated input frame while the correct
// `player` is bound. The live keyboard/touch/gamepad handlers call these same
// functions, so they are gated out here - otherwise every action would fire
// twice (once from the key handler, once from the tick) and the peers would
// immediately disagree.
function netActionAllowed() {
  return !netLockstepActive() || netInsideTick;
}

// Drive one human for one tick from `frame` instead of the live keyboard.
// Rebinds the simulation globals, injects the input, fires the edge-triggered
// actions, runs moveHuman, then restores everything so a simulated remote human
// can never leak into the local player's turn.
function stepHumanWithInput(h, frame) {
  const prevPlayer = player;
  const prevTeam = teammates, prevOpp = opponents;
  const prevInside = netInsideTick;
  const sav = netInputSave;

  bindSimHuman(h);
  applyFrameToInput(frame, sav);
  netInsideTick = true;

  // In a lockstep match the tick is the ONLY thing allowed to fire actions (the
  // live handlers are gated off), because the frame is replicated and both
  // peers must fire on the same tick. In solo play the live key handlers own
  // the actions and the frame only carries movement, so firing here too would
  // double up. Shoot held-state lives per human so the charging/release edges
  // fire once over the button's lifetime, exactly the same on both peers.
  if (netLockstepActive()) {
    if (frame.act.shoot && !h.shootHeld) startChargingShot();
    else if (!frame.act.shoot && h.shootHeld) releaseShot();
    h.shootHeld = !!frame.act.shoot;

    if (frame.press.pass) passBall();
    if (frame.press.request) requestBall();
    if (frame.press.tackle) tryTackle();
    if (frame.press.nudge) nudgeBall();
    if (frame.press.dribble) dribbleTouch();
  }

  moveHuman();

  netInsideTick = prevInside;
  restoreInput(sav);
  player = prevPlayer;
  teammates = prevTeam; opponents = prevOpp;
}

const netInputSave = {};
let netLocalFrame = makeInputFrame();

// Track possession loss for whichever human is currently bound. Runs per-human
// (not once for the local player) because indicatorText/hadBall are replicated
// simulation state: if only the local human were updated, the two peers would
// write different values and desync.
// Drive the human taking a set piece. Uses the same injected-input path as the
// open-play tick, so whichever human is the taker is steered by that human's own
// (replicated) input on BOTH peers - no client-local divergence.
function stepSetPieceHuman(taker) {
  if (!taker || !taker.human) { moveHuman(); return; }
  stepHumanWithInput(taker, taker.netFrame || makeInputFrame());
}

// ---------------------------------------------------------------------------
// One simulation step. This is the whole per-frame match advance, factored out
// of gameLoop so it can be driven either by the render loop (solo play, where
// frame rate is whatever the machine manages) or by a fixed 60Hz accumulator
// (online lockstep, where both peers MUST advance the same number of identical
// steps or they desync).
// ---------------------------------------------------------------------------
function stepMatchSim() {
  if (currentMode === "practice" && practiceDrill) {
    stepPracticeDrill();
  }
  if (goalPhase === "celebrate") {
    stepCelebration();
  } else if (goalPhase === "replay") {
    // Slow-motion replay of the stored goal frames; each snapshot is
    // held on screen for REPLAY_SLOWMO frames before the next one.
    replayHold++;
    if (replayHold >= REPLAY_SLOWMO) {
      replayHold = 0;
      if (goalReplayIndex < goalReplay.length) {
        applySnapshot(goalReplay[goalReplayIndex]);
        goalReplayIndex++;
      } else {
        // Replay finished: hand over to the celebration, then back to play.
        goalPhase = "celebrate";
        startCelebration();
        resetPositions();
      }
    }
  } else if (offsideReplay) {
    // Slow-motion replay of an offside goal, exactly like a real goal replay.
    // When the frames run out the referee awards the indirect free kick.
    replayHold++;
    if (replayHold >= REPLAY_SLOWMO) {
      replayHold = 0;
      if (goalReplayIndex < offsideReplay.frames.length) {
        applySnapshot(offsideReplay.frames[goalReplayIndex]);
        goalReplayIndex++;
      } else {
        const r = offsideReplay;
        offsideReplay = null;
        goalReplayIndex = 0;
        if (r.team) {
          startFreekick(r.team, r.spotX, r.spotY, null, null,
                        { kind: "freeKick", wait: 120, addStoppage: false });
        }
      }
    }
  } else if (breakPhase) {
    // 10-second break: players hold their kickoff positions, clock paused.
  } else if (postGoalPause > 0) {
    // Short breather after a goal: everyone is back in position but
    // the next play hasn't started yet. The wall-clock countdown is
    // shown on the pitch and ticks down as the pause drains.
    postGoalPause--;
    const secs = Math.max(1, Math.ceil(postGoalPause / 60));
    if (countdownSeconds !== secs) {
      countdownSeconds = secs;
    }
  } else if (freekick) {
    // A foul/card has stopped play. The ball is pinned at the spot and
    // everyone backs off down the field until the taker strikes it.
    stepFreekick();
  } else if (matchPenalty) {
    // A foul/card in the box: wait, run-up, then a one-on-one with the
    // keeper from the spot before play carries on.
    stepMatchPenalty();
  } else {
    recordSnapshot();
    stepSimHumans();
    moveTeammates();
    moveOpponents();
    moveReferee();
    updateShotCharge();

    for (const p of allPlayers) {
      if (p.sentOff) continue;
      collideWithBall(p);
    }

    updateBall();

    // Lockstep owns the counter decay: once per tick, identically on both
    // peers. (Solo play keeps the original per-render-frame decay in gameLoop.)
    if (netLockstepActive()) {
      for (const p of allPlayers) {
        if (p.indicatorFrames > 0) p.indicatorFrames--;
        if (p.kickAnim > 0) p.kickAnim--;
        if (p.tackleAnim > 0) p.tackleAnim--;
        if (p.tackleCooldown > 0) p.tackleCooldown--;
      }
      for (const h of simHumans) {
        if (h.passLockT > 0) h.passLockT--;
      }
    }
  }
}

const NET_TICK_HZ = 60;
const NET_TICK_MS = 1000 / NET_TICK_HZ;
let netAccum = 0;

// Drive the match. Offline this is a straight passthrough, preserving the
// original variable-frame behaviour exactly. Online it runs a fixed 60Hz
// accumulator so the simulation advances in whole, equal-sized steps.
function netRunFixedSteps() {
  if (!netLockstepActive()) {
    // Solo (or legacy online): one step per rendered frame, reading the live
    // keyboard for the local human. This is the original behaviour. Actions are
    // owned by the live key handlers, so only movement is fed in here - the
    // replicated-action block in stepHumanWithInput is skipped when not in a
    // lockstep match.
    netHoldStallMs = 0;
    netHoldBannerHide();
    const h = simHumans[0];
    if (!h.netFrame) h.netFrame = makeInputFrame();
    frameFromLocal(h.netFrame);
    stepMatchSim();
    return;
  }
  const now = performance.now();
  if (!netLastStepAt) { netLastStepAt = now; return; }
  let elapsed = now - netLastStepAt;
  netLastStepAt = now;
  if (elapsed > 250) elapsed = 250;           // never try to catch up a huge stall
  netAccum += elapsed;
  let advancedAny = false;
  while (netAccum >= NET_TICK_MS) {
    netAccum -= NET_TICK_MS;
    if (!netAdvanceTick()) break;             // stalled: wait for remote input
    advancedAny = true;
    // The tick gate only proves both peers have the inputs for this tick; the
    // deterministic simulation itself still has to RUN here, exactly once, in
    // the same fixed-tick cadence on both clients.
    stepMatchSim();
  }
  // A peer that keeps running while its window is backgrounded/occluded stops
  // sending input, so both sides stall on the drained input buffer. Track that
  // wall-time stall on the visible side and surface it instead of feezing
  // silently. DOM-only; nothing here is replicated.
  netHoldStallMs = advancedAny ? 0 : netHoldStallMs + elapsed;
  netHoldBanner();
}
let netLastStepAt = 0;
let netHoldStallMs = 0;
let netHoldEl = null;
function netHoldEnsureEl() {
  if (netHoldEl) return netHoldEl;
  netHoldEl = document.createElement("div");
  netHoldEl.id = "lockstepHold";
  netHoldEl.style.cssText = "position:fixed;left:50%;bottom:26%;transform:translateX(-50%);z-index:9999;background:rgba(6,12,20,0.92);border:1px solid rgba(255,170,60,0.8);color:#ffd9a0;padding:10px 18px;border-radius:10px;font:700 13px/1.35 Arial, sans-serif;text-align:center;display:none;max-width:440px;pointer-events:none;box-shadow:0 6px 24px rgba(0,0,0,0.5)";
  document.body.appendChild(netHoldEl);
  return netHoldEl;
}
function netHoldBanner() {
  const el = (typeof document !== "undefined") ? netHoldEnsureEl() : null;
  if (!el) return;
  if (!netLockstepActive() || !matchRunning || netHoldStallMs <= 0 || netHoldStallMs < 900) {
    el.style.display = "none";
    return;
  }
  const s = Math.round(netHoldStallMs / 1000);
  el.innerHTML = s >= 4
    ? ("Match on hold - waiting on the opponent for " + s + "s.<br>Keep both game windows visible, then check the connection.")
    : "Match on hold - waiting on the opponent's window.<br>Keep both game windows visible and focused.";
  el.style.display = "block";
}
function netHoldBannerHide() { if (netHoldEl) netHoldEl.style.display = "none"; }
if (typeof document !== "undefined" && document.addEventListener) {
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) { netLastStepAt = performance.now(); netHoldStallMs = 0; netHoldBannerHide(); }
  });
  // Browsers block audio until a real user gesture, so the crowd's AudioContext
  // is created on the first click/key/tap instead of at load.
  document.addEventListener("pointerdown", function () { sfxUnlock(); }, { once: false, passive: true });
  document.addEventListener("keydown", function () { sfxUnlock(); }, { once: false });
}

// One lockstep tick. Returns false if we are waiting on an input for this tick,
// in which case the sim must not advance at all - advancing without the peer's
// input is precisely how a lockstep match desyncs.
function netAdvanceTick() {
  if (!netLockstepActive()) return true;
  const n = netTick;
  if (netLocalQueue[n] === undefined || netRemoteAct[n] === undefined) {
    netStalledTicks++;
    return false;
  }
  netApplyInputsForTick(n);
  // Advance the match clock on a fixed 60-tick second, derived from the tick
  // counter rather than elapsed wall time.
  netClockTick++;
  if (netClockTick >= NET_TICK_HZ) { netClockTick = 0; netAdvanceClockSecond(); }
  netTick++;
  netStalledTicks = 0;
  return true;
}

// ---------------------------------------------------------------------------
// Lockstep input transport
// ---------------------------------------------------------------------------
// Each client owns exactly one human. Every tick it publishes that human's
// *held* input to its peer. Action edges are then derived identically on BOTH
// peers by comparing each tick's held state against the previous tick's - so
// "pass pressed on tick 412" is the same event everywhere, and a key event that
// happens to fall between ticks can never be missed or double-counted.
//
// NET_INPUT_DELAY buys slack so ordinary jitter doesn't stall play: a frame is
// sent NET_INPUT_DELAY ticks before it is needed. A tick is simulated only once
// both peers' held-state for it has arrived, which is what keeps the two
// simulations in lockstep.
const NET_INPUT_DELAY = 3;
// How many ticks ahead of simulation each client publishes its input. Three
// frames is enough to ride out ordinary jitter without the control feeling
// noticeably remote.
let netInputDelay = NET_INPUT_DELAY;

let netTick = 0;
let netLocalQueue = {};       // tick -> our held state for that tick
let netRemoteAct = {};        // tick -> peer's held state for that tick
let netSendTick = 0;
let netStalledTicks = 0;
let netLastSentKey = "";
let netClockTick = 0;

// The five human actions, in the fixed order used by the wire format. Both
// peers must agree on this ordering or the packed arrays would mean different
// things to each side.
const NET_ACT_FIELDS = ["shoot", "pass", "request", "tackle", "nudge", "dribble", "switch"];

// Pack a frame's held state into the compact arrays used on the wire.
// k[0..7] = up, down, left, right, sprint, LB, RB, LT.
// s[0..1] = right-stick direction as -1/0/1 (tri-state, enough for a touch).
function netHeldToWire(f) {
  const a = [];
  for (const k of NET_ACT_FIELDS) a.push(f.act[k] ? 1 : 0);
  return {
    k: [f.keys.up ? 1 : 0, f.keys.down ? 1 : 0, f.keys.left ? 1 : 0,
        f.keys.right ? 1 : 0, f.keys.shift ? 1 : 0,
        f.keys.lb ? 1 : 0, f.keys.rb ? 1 : 0, f.keys.lt ? 1 : 0],
    s: [netStickEnc(f.stick.x), netStickEnc(f.stick.y)],
    a: a,
  };
}

function netStickEnc(v) {
  if (!v || Math.abs(v) < 0.3) return 1;
  return v > 0 ? 2 : 0;
}

function netStickDec(e) {
  if (e === 2) return 1;
  if (e === 0) return -1;
  return 0;
}

// Read the local human's currently-held controls as a wire frame.
function netCaptureLocal() {
  const f = netLocalFrame;
  frameFromLocal(f);
  f.act.shoot = !!(keys[" "] || keys["space"] || keys["enter"]);
  f.act.pass = !!keys["b"];
  f.act.request = !!keys["e"];
  f.act.tackle = !!keys["v"];
  f.act.nudge = !!keys["z"];
  f.act.dribble = !!keys["x"];
  f.act.switch = !!(keys["f"] || vInput.lb);
  return netHeldToWire(f);
}

// Record the current held state against the tick DELAY frames in the future and
// push anything the peer hasn't received to it yet.
//
// The local input for tick N must be sampled once, well before tick N is
// simulated, and then replayed from the queue. Sampling it "live" at simulation
// time would not be safe: this client might reach tick N at a different moment
// than the peer did, so the two would feed in different inputs for the same
// tick. Buffering makes the input a property of the tick, not of wall time.
function netPumpInput() {
  if (!netLockstepActive() || !onl) return;
  const target = netTick + netInputDelay;
  netLocalQueue[target] = netCaptureLocal();
  if (target < netTick - 240) delete netLocalQueue[netTick - 240];
  while (netSendTick < target) {
    const w = netLocalQueue[netSendTick];
    if (w === undefined) break;
    const key = netSendTick + ":" + JSON.stringify(w);
    if (key !== netLastSentKey) {
      netLastSentKey = key;
      onlWire({ type: "inp", tick: netSendTick, f: w });
    }
    netSendTick++;
  }
}

// Turn held-state transitions into edge-triggered `press` flags. Pure function
// of (this tick, previous tick) held state, so both peers compute it the same.
function netDerivePress(f) {
  for (const k of ["pass", "request", "tackle", "nudge", "dribble", "switch"]) {
    f.press[k] = !!f.act[k] && !f.prevAct[k];
  }
  for (const k of NET_ACT_FIELDS) f.prevAct[k] = !!f.act[k];
}

// Build this tick's frame for every human from the buffered held state.
function netApplyInputsForTick(n) {
  const local = netLocalQueue[n];
  const remote = netRemoteAct[n];
  for (let i = 0; i < simHumans.length; i++) {
    const h = simHumans[i];
    if (!h.netFrame) h.netFrame = makeInputFrame();
    const f = h.netFrame;
    // simHumans is walked in the same canonical order on both peers, so the
    // SEQUENCE of operations matches. Which buffer a human reads from differs
    // by design - and only by which side of the match this client is on.
    const w = (h === localPlayer) ? local : remote;
    const known = !!w;
    if (known) {
      f.keys.up = !!w.k[0]; f.keys.down = !!w.k[1];
      f.keys.left = !!w.k[2]; f.keys.right = !!w.k[3];
      f.keys.shift = !!w.k[4];
      f.keys.lb = !!w.k[5]; f.keys.rb = !!w.k[6]; f.keys.lt = !!w.k[7];
      f.stick.x = netStickDec(w.s ? w.s[0] : 1);
      f.stick.y = netStickDec(w.s ? w.s[1] : 1);
      for (let a = 0; a < NET_ACT_FIELDS.length; a++) f.act[NET_ACT_FIELDS[a]] = !!w.a[a];
    } else {
      // No frame for this tick: go neutral rather than repeat the last input, so
      // a missing packet can never make a player run forever.
      for (const k of NET_ACT_FIELDS) f.act[k] = false;
      f.keys.up = f.keys.down = f.keys.left = f.keys.right = f.keys.shift = false;
      f.keys.lb = f.keys.rb = f.keys.lt = false;
      f.stick.x = 0; f.stick.y = 0;
    }
    netDerivePress(f);
  }
}

// Peer -> us: a held-state frame the other client produced.
function netOnRemoteFrame(tick, wire) {
  if (!wire || tick < 0) return;
  netRemoteAct[tick] = wire;
  if (tick < netTick - 240) delete netRemoteAct[tick];
}

// Reset all lockstep state. Called when a match starts or is torn down.
function netResetLockstep(seed) {
  netTick = 0;
  netLocalQueue = {};
  netRemoteAct = {};
  netSendTick = 0;
  netStalledTicks = 0;
  netLastSentKey = "";
  netLastStepAt = 0;
  netAccum = 0;
netClockTick = 0;
  for (const h of simHumans) { h.shootHeld = false; h.netFrame = makeInputFrame(); }
  // Seed the first DELAY ticks with a neutral frame. Without this the match
  // would deadlock at tick 0 waiting for a local input that is only recorded
  // DELAY ticks ahead of the tick being simulated.
  if (netLockstepActive()) {
    const neutral = {
      k: [0, 0, 0, 0, 0],
      a: NET_ACT_FIELDS.map(() => 0),
    };
    for (let t = 0; t < netInputDelay; t++) netLocalQueue[t] = neutral;
  }
}

function updateHumanPossession() {
  const hasBallNow = ballCarrier === player ||
    ((player.stumble || 0) <= 0 && distance(player, ball) < player.radius + ball.radius + 12);
  if (player.hadBall && !hasBallNow && (player.kickAnim || 0) <= 0 && player.indicatorText !== "TACKLED!") {
    player.indicatorText = "LOST!";
    player.indicatorFrames = 34;
  }
  player.hadBall = hasBallNow;
}

// The human-driven simulation tick. Walks the canonical human order so both
// peers execute the identical sequence of operations. Inputs are whatever
// netApplyInputsForTick installed for this tick (live for the local human,
// received for the remote one).
function stepSimHumans() {
  // A switch requested by a replicated input frame is applied BEFORE the drive
  // loop, never inside it: the swap rewrites `simHumans` itself, so mutating it
  // mid-iteration would silently skip a human for that tick. Doing it up front
  // also lets the incoming man be driven by this very tick's stick, so a
  // direction held across the switch keeps running.
  if (netLockstepActive()) {
    for (let i = 0; i < simHumans.length; i++) {
      const f = simHumans[i].netFrame;
      // Only OUR human's request may move our man - a remote switch press must
      // not make this client switch as well.
      if (f && f.press && f.press.switch && simHumans[i] === localPlayer) {
        // switchPlayer() is guarded by netActionAllowed(), which is only open
        // while a human is being driven; this pre-pass is outside that window.
        netInsideTick = true;
        switchPlayer();
        netInsideTick = false;
        break;
      }
    }
  }

 for (let i = 0; i < simHumans.length; i++) {
const h = simHumans[i];
  stepHumanWithInput(h, h.netFrame || makeInputFrame());
  updateHumanPossession();
}
updateEnergyBar();
}

const ball = { 

  x: PITCH_CX, 

  y: PITCH_CY, 

  radius: 12, 

  vx: 0, 

  vy: 0, 

  // Loft model. z/vz fake the ball's height so chips, lobs, crosses and
  // bicycle kicks can fly over heads; spin bends a struck ball sideways over
  // its flight; airT counts the frames left that a ball cannot be controlled
  // in. All four are ordinary replicated simulation state - both peers compute
  // them from the same inputs and the same netRand calls.
  z: 0,

  vz: 0,

  spin: 0,

  airT: 0,

  lastToucher: null, 

  lastFieldToucher: null,

  lastBlueFieldToucher: null,

  lastRedFieldToucher: null, 

  prevBlueFieldToucher: null,

  prevRedFieldToucher: null 

}; 

// A ball higher than this can't be taken by a player on the ground: chips,
// lobs and lofted crosses simply fly over everyone until they drop back down.
const BALL_CONTROL_HEIGHT = 26;
const BALL_GRAVITY = 0.34;
const BALL_MAX_Z = 190;

function ballInAir() {
  return ball.z > BALL_CONTROL_HEIGHT;
}

// Put the ball back on the deck: any new strike starts grounded.
function ballGroundReset() {
  ball.z = 0;
  ball.vz = 0;
  ball.spin = 0;
  ball.airT = 0;
}

// Launch the ball into the air. vz is the upward impulse, spin the sideways
// bend (positive curves right of travel), airT how long it stays untouchable.
function ballLaunch(vz, spin, airT) {
  ball.z = Math.max(ball.z, 1);
  ball.vz = vz;
  ball.spin = spin || 0;
  ball.airT = airT || 0;
}

let ballCarrier = null; 

 

/* ------------------------------ 

   Team selection 

------------------------------ */ 

 

const teamButtons = document.getElementById("teamButtons"); 

 

const FIFA_CODES = {
 "Real Madrid": "RMA",
 "Barcelona": "BAR",
 "Atletico Madrid": "ATM",
 "Villarreal": "VIL",
 "Real Betis": "BET",
 "Paris Saint-Germain": "PSG",
 "Bayern Munich": "BAY",
 "Borussia Dortmund": "BVB",
 "RB Leipzig": "RBL",
 "VfB Stuttgart": "STU",
 "Inter Milan": "INT",
 "Napoli": "NAP",
 "Manchester City": "MCI",
 "Arsenal": "ARS",
 "Liverpool": "LIV",
 "Manchester United": "MUN",
 "Aston Villa": "AVL",
 "AS Roma": "ROM",
 "Como": "COM",
 "Porto": "POR",
 "Sporting CP": "SCP",
 "PSV Eindhoven": "PSV",
 "Feyenoord": "FEY",
 "Club Brugge": "BRU",
 "Lille": "LIL",
 "RC Lens": "RCL",
 "Galatasaray": "GAL",
 "Fenerbahce": "FEN",
 "Shakhtar Donetsk": "SHK",
 "Slavia Prague": "SLP",
 "Slovan Bratislava": "SLB",
 "Bodo/Glimt": "BOD",
 "Viking": "VIK",
 "AEK Athens": "AEK",
 "LASK": "LIN",
 "Sabah FC": "SAB",

};teams.forEach(team => {
  const button = document.createElement("button");
  button.className = "teamButton";

  const rank = FIFA_RANKINGS[team] || "?";
  const fifaCode = FIFA_CODES[team] || "???";

  button.style.setProperty("--team-color", teamColors[team] || "#667788");
  button.innerHTML = `
    <span class="selectedBadge">SELECTED</span>
    <span class="teamNameLine">
      <span class="teamFlag">${fifaCode}</span>
      <span>${team}</span>
    </span>
    <span class="teamRank">FIFA RANKING #${rank}</span>
  `;

  button.onclick = () => {
    selectedTeam = team;

    document.querySelectorAll(".teamButton").forEach(b => {
      b.classList.remove("selected");
    });

    button.classList.add("selected");
    document.getElementById("startButton").disabled = false;
    loadClubStateFor(team);
    refreshSponsorSection();
    updateSponsorUi();
    const mm = document.getElementById("marketMenuButton");
    if (mm) {
      mm.disabled = false;
      mm.textContent = "Transfer Market & Squad (" + formatMoney(playerCoins) + ")";
    }
  };

  teamButtons.appendChild(button);
});

/* ------------------------------ 

   Tournament setup 

------------------------------ */ 

 

function shuffle(array) { 

  return [...array].sort(() => Math.random() - 0.5); 

} 

 

function createMatch(team1, team2) { 

  return { 

    team1, 

    team2, 

    score1: null, 

    score2: null, 

    winner: null, 

    played: false 

  }; 

} 

 

function poisson(lambda) {

  const l = Math.exp(-lambda);

  let k = 0;

  let p = 1;

  do {

    k++;

    p *= Math.random();

  } while (p > l);

  return k - 1;

}

function myClubLineupStrength(team) {
  if (team !== selectedTeam) return null;
  const roster = TEAM_ROSTERS[team];
  if (!roster) return null;
  const slots = (currentMode === "myclub") ? myClubSlotList() : MARKET_SLOTS;
  let sum = 0, n = 0;
  for (const s of slots) {
    const pd = getSlotData(roster, s.key);
    if (pd) {
      sum += calculateOverall(buffedPlayerView(pd, s.role), s.role);
      n++;
    }
  }
  if (!n) return null;
  let avg = sum / n;
  if (currentMode === "myclub") avg *= myClubCareerBuff(getMyClubCareer(myClubLeague));
  return avg;
}

// ---- My Club form buffs ----
// Ongoing: a slight buff/nerf from the club's CURRENT league position - front
// runners play a touch above their rating, cellar dwellers a touch below. It
// mirrors the ranking-buff the Champions League mode already uses.
function myClubSeasonBuff(c) {
  if (!c || !Array.isArray(c.fixtures) || !c.fixtures.some(m => m && m.played)) return 1;
  try {
    const standings = computeGroupStandings({ teams: myClubLeagueClubs(c), matches: c.fixtures });
    const n = standings.length;
    if (!n) return 1;
    const rank = standings.findIndex(row => row.team === selectedTeam) + 1;
    if (rank <= 0) return 1;
    return 1 + ((n + 1) / 2 - rank) * 0.012;
  } catch (e) {
    return 1;
  }
}

// Momentum: a bigger buff/nerf that carries into the NEXT season when the club
// finished higher/lower than the season before it. Inactive after season 1 -
// there was no earlier season to compare against.
function myClubMomentumBuff(prev, prevPrev) {
  if (typeof prev !== "number" || typeof prevPrev !== "number") return 1;
  const diff = prevPrev - prev;
  return Math.max(0.92, Math.min(1.15, 1 + diff * 0.012));
}

function myClubCareerBuff(c) {
  if (!c) return 1;
  const eos = typeof c.eosMomentum === "number" && c.eosMomentum > 0 ? c.eosMomentum : 1;
  return myClubSeasonBuff(c) * eos;
}

function myClubFormLabel(c) {
  if (!c) return "";
  const bits = [];
  const sb = myClubSeasonBuff(c);
  if (sb !== 1) {
    const pct = Math.round((sb - 1) * 100);
    bits.push((pct > 0 ? "+" + pct : "" + pct) + "% form");
  }
  const eos = typeof c.eosMomentum === "number" && c.eosMomentum > 0 ? c.eosMomentum : 1;
  if (eos !== 1) {
    const pct = Math.round((eos - 1) * 100);
    bits.push((pct > 0 ? "+" + pct : "" + pct) + "% momentum");
  }
  return bits.join("  ");
}

// ==================== Immersive AI squads & transfer window ====================
// AI clubs keep a persistent, evolving squad of players. Squads are seeded from
// each club's static roster and expanded with young depth. At the end of every
// season a transfer window runs: clubs at the top poach talent from the bottom,
// clubs replace losses from the academy, and older players retire. The squads
// are stored in myClubCareerData.aiSquads (keyed by club name) and feed into
// getTeamStrength so transfers actually change match results.
const AI_SQUAD_TARGET = 20;
const AI_SQUAD_MIN = 15;
const AI_PER_CLUB_DEAL_CAP = 3;

function aiClamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function aiTagForOvr(ovr) {
  return ovr >= 84 ? "GOLD" : (ovr >= 74 ? "SILVER" : "BRONZE");
}

function aiSquadStore() {
  if (!myClubCareerData || typeof myClubCareerData !== "object" || Array.isArray(myClubCareerData)) {
    myClubCareerData = { v: 1, careers: {} };
  }
  if (!myClubCareerData.aiSquads || typeof myClubCareerData.aiSquads !== "object" || Array.isArray(myClubCareerData.aiSquads)) {
    myClubCareerData.aiSquads = {};
  }
  return myClubCareerData.aiSquads;
}

function getAiSquad(club) {
  if (!club) return null;
  const s = aiSquadStore()[club];
  return Array.isArray(s) && s.length ? s : null;
}

function aiSquadOvr(p) {
  return calculateOverall(p, p.role || "attacker");
}

function aiSquadAvg(club) {
  const s = getAiSquad(club);
  if (!s) return null;
  let sum = 0;
  for (const p of s) sum += aiSquadOvr(p);
  return sum / s.length;
}

function wrapStaticAiPlayer(st, role, season) {
  const p = Object.assign({}, st);
  p.role = role;
  p.pos = myClubPackPos(role);
  p.nation = randNation();
  p.age = 20 + Math.floor(Math.random() * 13);
  if (typeof p.name !== "string" || !p.name) p.name = "AI Player";
  p.contractEnd = season + 1 + Math.floor(Math.random() * 4);
  p.tag = aiTagForOvr(aiSquadOvr(p));
  p.variant = p.tag;
  return p;
}

function makeAiDepthPlayer(role, baseOvr, season) {
  const ovr = aiClamp(Math.round(baseOvr + (Math.random() * 9) - 5), 56, 90);
  const p = makeRatedPlayer("", ovr, role);
  p.role = role;
  p.pos = myClubPackPos(role);
  p.nation = randNation();
  p.age = 16 + Math.floor(Math.random() * 14);
  p.contractEnd = season + 1 + Math.floor(Math.random() * 4);
  p.tag = aiTagForOvr(ovr);
  p.variant = p.tag;
  return p;
}

function uniqueAiName(existing) {
  const sq = Array.isArray(existing) ? existing : (getAiSquad(existing) || []);
  for (let tries = 0; tries < 40; tries++) {
    const n = pickRand(BASE_FIRST) + " " + pickRand(BASE_LAST);
    if (!sq.some(p => p && p.name === n)) return n;
  }
  return pickRand(BASE_FIRST) + " " + pickRand(BASE_LAST) + " Jr";
}

function staticRosterPlayers(club, season) {
  const r = TEAM_ROSTERS[club];
  const out = [];
  if (!r) return out;
  if (Array.isArray(r.defenders)) for (const st of r.defenders) out.push(wrapStaticAiPlayer(st, "defender", season));
  if (Array.isArray(r.midfielders)) for (const st of r.midfielders) out.push(wrapStaticAiPlayer(st, "midfielder", season));
  if (Array.isArray(r.attackers)) for (const st of r.attackers) out.push(wrapStaticAiPlayer(st, "attacker", season));
  if (r.goalkeeper) out.push(wrapStaticAiPlayer(r.goalkeeper, "goalkeeper", season));
  // Match-day bench and reserves are real club depth too - include them so AI
  // squads carry the same extra bodies the user's club has (and so the transfer
  // market can draw on them).
  if (Array.isArray(r.bench)) for (const st of r.bench) if (st) out.push(wrapStaticAiPlayer(st, st.role || "midfielder", season));
  if (Array.isArray(r.reserves)) for (const st of r.reserves) if (st) out.push(wrapStaticAiPlayer(st, st.role || "midfielder", season));
  return out;
}

function buildAiSquad(club, c) {
  const season = (c && c.season) || 1;
  const sq = staticRosterPlayers(club, season);
  let base = 70;
  if (sq.length) {
    let sum = 0;
    for (const p of sq) sum += aiSquadOvr(p);
    base = Math.round(sum / sq.length);
  } else if (typeof FIFA_RANKINGS[club] === "number") {
    base = aiClamp(Math.round(88 - (FIFA_RANKINGS[club] || 49) * 0.75), 60, 88);
  }
  const target = AI_SQUAD_TARGET;
  const depthPool = [
    "defender", "midfielder", "attacker", "midfielder", "defender", "attacker",
    "defender", "midfielder", "attacker", "goalkeeper", "defender", "midfielder",
    "attacker", "defender", "midfielder", "attacker", "defender", "attacker",
    "midfielder", "goalkeeper"
  ];
  let guard = 0;
  while (sq.length < target && guard++ < 200) {
    const p = makeAiDepthPlayer(depthPool[sq.length % depthPool.length], base, season);
    p.name = uniqueAiName(sq);
    sq.push(p);
  }
  return sq;
}

function ensureAiSquads(c) {
  if (!c || !c.league) return;
  const store = aiSquadStore();
  const me = (c.clubName || "").toLowerCase();
  for (const club of myClubLeagueClubs(c)) {
    if (club.toLowerCase() === me) continue;
    if (Array.isArray(store[club]) && store[club].length >= AI_SQUAD_MIN) continue;
    store[club] = buildAiSquad(club, c);
  }
}

function aiPlayerPrice(p) {
  const ovr = aiSquadOvr(p);
  let price = Math.max(0, ovr - 60) * Math.max(0, ovr - 60) * 200;
  const age = typeof p.age === "number" ? p.age : 25;
  if (age < 23) price = Math.round(price * 1.25);
  else if (age > 30) price = Math.round(price * 0.7);
  if (price < 15000) price = 15000;
  return Math.round(price / 1000) * 1000;
}

function makeAiYouthFor(club, role, c) {
  const season = (c && c.season) || 1;
  const sq = getAiSquad(club);
  let base = 70;
  if (sq) {
    let sum = 0;
    for (const p of sq) sum += aiSquadOvr(p);
    base = Math.round(sum / sq.length);
  }
  const ovr = aiClamp(Math.round(base + (Math.random() * 6) - 4), 55, 88);
  const p = makeRatedPlayer("", ovr, role);
  p.role = role;
  p.pos = myClubPackPos(role);
  p.nation = randNation();
  p.age = 16 + Math.floor(Math.random() * 4);
  p.contractEnd = season + 3 + Math.floor(Math.random() * 3);
  p.tag = aiTagForOvr(ovr);
  p.variant = p.tag;
  p.name = uniqueAiName(club);
  return p;
}

function pickAiTransferTarget(squad) {
  const cands = squad.filter(p => p && (typeof p.age !== "number" || p.age <= 31));
  if (!cands.length) return null;
  let best = null;
  let bestScore = -Infinity;
  for (const p of cands) {
    const agePen = typeof p.age === "number" ? Math.max(0, p.age - 23) : 0;
    const score = aiSquadOvr(p) + Math.random() * 6 - agePen;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}

function topBiasedIndex(len) {
  return Math.min(len - 1, Math.floor(Math.pow(Math.random(), 1.5) * len));
}

function bottomBiasedIndex(len) {
  return Math.max(0, len - 1 - Math.floor(Math.pow(Math.random(), 1.5) * len));
}

// Runs once at the end of each season. Standings are the final league table
// (best -> worst). Clubs at the top tend to sign players from clubs lower down;
// sellers sign academy prospects to replace them; players over 36 retire.
function runMyClubTransferWindow(c, standings) {
  if (!c || !Array.isArray(standings) || standings.length < 5) return;
  ensureAiSquads(c);
  const store = aiSquadStore();
  const me = (c.clubName || "").toLowerCase();
  const clubs = standings.map(r => r.team).filter(t => t && t.toLowerCase() !== me);
  if (clubs.length < 4) return;
  const news = [];
  const inCount = {};
  const outCount = {};
  const attempts = aiClamp(Math.round(clubs.length * 0.45), 4, 12);
  let guard = 0;
  for (let i = 0; i < attempts && guard++ < 400; i++) {
    const bIdx = topBiasedIndex(clubs.length);
    const sIdx = bottomBiasedIndex(clubs.length);
    if (bIdx === sIdx) continue;
    const buyer = clubs[bIdx];
    const seller = clubs[sIdx];
    if ((inCount[buyer] || 0) >= AI_PER_CLUB_DEAL_CAP) continue;
    if ((outCount[seller] || 0) >= AI_PER_CLUB_DEAL_CAP) continue;
    const sSquad = store[seller];
    const bSquad = store[buyer];
    if (!Array.isArray(sSquad) || !Array.isArray(bSquad) || !sSquad.length || !bSquad.length) continue;
    if (sSquad.length <= AI_SQUAD_MIN + 1) continue;
    if (bSquad.length >= AI_SQUAD_TARGET + 4) continue;
    const player = pickAiTransferTarget(sSquad);
    if (!player) continue;
    const pri = sSquad.indexOf(player);
    if (pri < 0) continue;
    if (bSquad.some(q => q.name === player.name)) continue;
    sSquad.splice(pri, 1);
    player.age = (typeof player.age === "number" ? player.age : 25) + 1;
    player.contractEnd = c.season + 2 + Math.floor(Math.random() * 3);
    player.club = buyer;
    bSquad.push(player);
    inCount[buyer] = (inCount[buyer] || 0) + 1;
    outCount[seller] = (outCount[seller] || 0) + 1;
    news.push({
      type: "signing", player: player.name, ovr: aiSquadOvr(player), role: player.role,
      pos: player.pos, age: player.age, from: seller, to: buyer,
      fee: aiPlayerPrice(player), contract: player.contractEnd
    });
    const youth = makeAiYouthFor(seller, player.role || "midfielder", c);
    sSquad.push(youth);
    news.push({
      type: "youth", player: youth.name, ovr: aiSquadOvr(youth), role: youth.role,
      pos: youth.pos, age: youth.age, from: seller, to: seller, fee: 0, contract: youth.contractEnd
    });
  }
  for (const club of clubs) {
    const sq = store[club];
    if (!Array.isArray(sq)) continue;
    const keep = [];
    for (const p of sq) {
      if (typeof p.age !== "number") p.age = 25;
      else p.age += 1;
      if (p.age <= 36) keep.push(p);
      else {
        news.push({
          type: "retired", player: p.name, ovr: aiSquadOvr(p), role: p.role,
          pos: p.pos, age: p.age, from: club, to: "Retired", fee: 0
        });
      }
    }
    sq.length = 0;
    for (const p of keep) sq.push(p);
    while (sq.length < AI_SQUAD_MIN) {
      const y = makeAiYouthFor(club, pickRand(["defender", "midfielder", "attacker"]), c);
      sq.push(y);
      news.push({
        type: "youth", player: y.name, ovr: aiSquadOvr(y), role: y.role,
        pos: y.pos, age: y.age, from: club, to: club, fee: 0, contract: y.contractEnd
      });
    }
  }
  c.transferNews = news;
  c.transferWindowSeason = c.season;
  saveMyClubData();
}

// ==================== Difficulty creep - every user win slowly strengthens AI ====================
// Each win for the user (played OR simulated) ticks a career-wide counter. Every
// MYCLUB_AI_BUFF_EVERY wins, every AI player in the current league gains +1 to
// every base stat (+1 OVR), so the room gets steadily harder as you keep winning.
const MYCLUB_AI_BUFF_EVERY = 8;
const MYCLUB_AI_BUFF_MAX = 20;

function myClubApplyAiBuff(c) {
  if (!c || !c.league) return;
  const store = aiSquadStore();
  const me = (c.clubName || "").toLowerCase();
  for (const club of myClubLeagueClubs(c)) {
    if (club.toLowerCase() === me) continue;
    const sq = store[club];
    if (!Array.isArray(sq)) continue;
    for (const p of sq) {
      if (!p) continue;
      for (const k of MYCLUB_TRAIN_STAT_KEYS) {
        if (typeof p[k] === "number" && p[k] < 99) p[k] += 1;
      }
    }
  }
}

function myClubWinBufferApplied(c) {
  return typeof c.aiWinBuffApplied === "number" ? c.aiWinBuffApplied : 0;
}

function myClubRegisterUserWin(c) {
  if (!c) return;
  if (typeof c.aiWinBuff !== "number") c.aiWinBuff = 0;
  if (typeof c.aiWinBuffApplied !== "number") c.aiWinBuffApplied = 0;
  c.aiWinBuff += 1;
  const want = Math.floor(c.aiWinBuff / MYCLUB_AI_BUFF_EVERY);
  const had = myClubWinBufferApplied(c);
  if (want > had && want <= MYCLUB_AI_BUFF_MAX) {
    myClubApplyAiBuff(c);
    c.aiWinBuffApplied = want;
  } else if (want > MYCLUB_AI_BUFF_MAX) {
    c.aiWinBuffApplied = want;
  }
  saveMyClubData();
}

function getTeamStrength(team) {

  const lineupStr = myClubLineupStrength(team);

  if (lineupStr != null) return lineupStr;

  let rosterScore = 70;

  const roster = TEAM_ROSTERS[team];

  const aiSq = getAiSquad(team);

  if (aiSq && aiSq.length) {

    let aiSum = 0;

    for (const p of aiSq) aiSum += aiSquadOvr(p);

    rosterScore = aiSum / aiSq.length;

  } else if (roster) {

    const overalls = [];

    for (const p of roster.defenders) {

      overalls.push(calculateOverall(p, "defender"));

    }

    for (const p of roster.midfielders) {

      overalls.push(calculateOverall(p, "midfielder"));

    }

    for (const p of roster.attackers) {

      overalls.push(calculateOverall(p, "attacker"));

    }

    overalls.push(calculateOverall(roster.goalkeeper, "goalkeeper"));

    rosterScore =

      overalls.reduce((a, b) => a + b, 0) / overalls.length;

  }

  const rankingScore = Math.max(

    0,

    88 - (FIFA_RANKINGS[team] || 49) * 0.75

  );

  let result = rankingScore * 0.5 + rosterScore * 0.5;

  if (isDarkHorse(team)) result *= 1.1;

  return result;

}

function expectedGoals(team, opponent) {

  const diff = getTeamStrength(team) - getTeamStrength(opponent);

  const xg = Math.max(0.2, 1.0 + diff * 0.06);

  if (currentMode === "myclub" && myClubLeague && team === selectedTeam) return xg * 0.9;

  return xg;

}

function simulateGroupMatch(match) {

  if (match.played) return;



  match.score1 = poisson(expectedGoals(match.team1, match.team2));

  match.score2 = poisson(expectedGoals(match.team2, match.team1));

  match.played = true;

  if (currentMode === "myclub" && myClubLeague) {
    let comp = "league";
    const c = getMyClubCareer(myClubLeague);
    if (c && c.cl && Array.isArray(c.cl.leagueMatches) && c.cl.leagueMatches.indexOf(match) !== -1) comp = "cl";
    if (myClubCreditAiSquadMatch(match, comp, c)) saveMyClubData();
  }

}

 

function simulateMatch(match) {

  if (match.winner) return;



  let score1 = poisson(expectedGoals(match.team1, match.team2));

  let score2 = poisson(expectedGoals(match.team2, match.team1));



  match.score1 = score1;

  match.score2 = score2;



  if (score1 === score2) {

    // Simulate extra time/penalties; the stronger side wins the toss-up

    const strength1 = getTeamStrength(match.team1);

    const strength2 = getTeamStrength(match.team2);

    const winChance = strength1 / (strength1 + strength2);



    match.winner =

      Math.random() < winChance ? match.team1 : match.team2;



    // Add a winning goal so the displayed score is not tied

    if (match.winner === match.team1) {

      match.score1++;

    } else {

      match.score2++;

    }

  } else {

    match.winner =

      score1 > score2 ? match.team1 : match.team2;

  }



  match.played = true;

}

 

function rotateForLeague(arr) { 

  const out = [arr[arr.length - 1]]; 

  for (let i = 0; i < arr.length - 1; i++) out.push(arr[i]); 

  return out; 

} 

 

function createLeagueFixtures(clubList) { 

  if (!Array.isArray(clubList) || clubList.length < 2) return []; 

  // A round-robin needs an even number of teams, so an odd field gets one bye: 

  // pad with a phantom club and drop every fixture it turns up in. Without this, 

  // an odd field pairs the middle club with itself, and that club then banks a 

  // "win" against itself every round. 

  const field = clubList.length % 2 === 1 ? [...clubList, null] : [...clubList]; 

  const n = field.length; 

  const ids = [...Array(n).keys()]; 

  const rounds = []; 

  for (let r = 0; r < n - 1; r++) { 

    const round = []; 

    for (let i = 0; i < n / 2; i++) { 

      const a = ids[i], b = ids[n - 1 - i]; 

      if (a >= clubList.length || b >= clubList.length) continue; // bye 

      round.push([a, b]); 

    } 

    rounds.push(round); 

    const last = ids[n - 1]; 

    for (let i = n - 1; i > 1; i--) ids[i] = ids[i - 1]; 

    ids[1] = last; 

  } 

  const fixtures = []; 

  const roundsToPlay = Math.min(8, rounds.length); 

  for (let r = 0; r < roundsToPlay; r++) { 

    for (const [a, b] of rounds[r]) { 

      const m = (r + a) % 2 === 0 

        ? createMatch(field[a], field[b]) 

        : createMatch(field[b], field[a]); 

      m.round = r + 1; 

      fixtures.push(m); 

    } 

  } 

  return fixtures; 

} 

 

function createLeaguePhase() { 

  const fixtures = createLeagueFixtures(shuffle([...teams])); 

  tournament.groups = [{ name: "League", teams: [...teams], matches: fixtures }]; 

  tournament.knockout = []; 

  tournament.roundOf32 = []; 

  tournament.roundOf16 = []; 

  tournament.quarterfinals = []; 

  tournament.semifinals = []; 

  tournament.final = []; 

  tournament.champion = null; 

  tournament.stage = "league"; 

  eliminated = false; 

}
 
function simulateLeagueThrough(roundNum) { 
 
  const group = getPlayerGroup(); 
 
  if (!group) return; 
 
  for (const match of group.matches) { 
 
    if (match.team1 === selectedTeam || match.team2 === selectedTeam) continue; 
 
    if ((match.round || 1) > roundNum) continue; 
 
    simulateGroupMatch(match); 
 
  } 
 
} 
 
function currentMatchday() { 
 
  const group = getPlayerGroup(); 
 
  if (!group) return null; 
 
  const next = findPlayerMatch(); 
 
  if (next && group.matches.includes(next)) return next.round || 1; 
 
  return group.matches.reduce((max, m) => Math.max(max, m.round || 1), 0); 
 
} 

 

function getPlayerGroup() { 

  return (tournament.groups || []).find(g => Array.isArray(g.teams) && g.teams.includes(selectedTeam)); 

} 

 

function computeGroupStandings(group) { 

  const table = {}; 

 

  for (const team of group.teams) { 

    table[team] = { team, points: 0, gf: 0, ga: 0, gd: 0, played: 0, w: 0, d: 0, l: 0 }; 

  } 

 

  for (const match of group.matches) { 

    if (!match.played) continue; 

 

    const t1 = table[match.team1]; 

    const t2 = table[match.team2]; 

 

    t1.played++; 

    t2.played++; 

    t1.gf += match.score1; 

    t1.ga += match.score2; 

    t2.gf += match.score2; 

    t2.ga += match.score1; 

 

    if (match.score1 > match.score2) { 

      t1.points += 3; 

      t1.w++; 

      t2.l++; 

    } else if (match.score2 > match.score1) { 

      t2.points += 3; 

      t2.w++; 

      t1.l++; 

    } else { 

      t1.points += 1; 

      t2.points += 1; 

      t1.d++; 

      t2.d++; 

    } 

  } 

 

  const standings = Object.values(table); 

 

  for (const row of standings) { 

    row.gd = row.gf - row.ga; 

  } 

 

  standings.sort((a, b) => 

    b.points - a.points || b.gd - a.gd || b.gf - a.gf 

  ); 

 

  return standings; 

} 

 

function groupStageComplete() { 

  return tournament.groups.every(g => 

    g.matches.every(m => m.played) 

  ); 

} 

 

function newKnockoutLeg(roundKey, a, b) {
  return { team1: a, team2: b, score1: null, score2: null, winner: null, played: false };
}

function newKnockoutTie(roundKey, a, b) {
  const tie = { team1: a, team2: b, legs: [], winner: null, done: false, decidedBy: null };
  tie.legs.push(newKnockoutLeg(roundKey, a, b));
  if (KNOCKOUT_TWOLEG[roundKey]) tie.legs.push(newKnockoutLeg(roundKey, b, a));
  return tie;
}

function knockoutRoundForKey(key, ties) {
  return { key: key, title: KNOCKOUT_TITLES[key], ties: ties };
}

function makeKnockoutRef(key, index) {
  return { ref: key, index: index };
}

function resolveKnockoutRef(teamOrRef) {
  if (!teamOrRef || typeof teamOrRef === "string") return teamOrRef || "TBD";
  const round = (tournament.knockout || []).find(r => r.key === teamOrRef.ref);
  const tie = round && round.ties[teamOrRef.index];
  if (tie && tie.done && tie.winner) return tie.winner;
  return "Winner " + KNOCKOUT_TITLES[teamOrRef.ref] + " " + (teamOrRef.index + 1);
}

function tieTeamA(tie) { return resolveKnockoutRef(tie.team1); }
function tieTeamB(tie) { return resolveKnockoutRef(tie.team2); }

// A bracket slot is either a plain team name or a lazy {ref,index} pointer to
// the winner of an earlier tie. It only counts as resolved once that source tie
// is finished, otherwise resolveKnockoutRef hands back a placeholder string.
function knockoutSideResolved(side) {
  if (!side) return false;
  if (typeof side === "string") return true;
  const round = (tournament.knockout || []).find(r => r.key === side.ref);
  const tie = round && round.ties[side.index];
  return !!(tie && tie.done && tie.winner);
}

// A tie may only be played once BOTH slots hold real clubs.
function knockoutTieReady(tie) {
  if (!tie || tie.done) return false;
  return knockoutSideResolved(tie.team1) && knockoutSideResolved(tie.team2);
}

function buildKnockoutBracket(standingsTeams) {
  tournament.knockout = [];
  const at = i => standingsTeams && standingsTeams[i];
  const playoffTies = [];
  for (let i = 0; i < 8; i++) playoffTies.push(newKnockoutTie("playoff", at(8 + i), at(23 - i)));
  tournament.knockout.push(knockoutRoundForKey("playoff", playoffTies));
  tournament.knockout.push(knockoutRoundForKey("roundOf16", [
    newKnockoutTie("roundOf16", at(0), makeKnockoutRef("playoff", 6)),
    newKnockoutTie("roundOf16", at(1), makeKnockoutRef("playoff", 7)),
    newKnockoutTie("roundOf16", at(2), makeKnockoutRef("playoff", 5)),
    newKnockoutTie("roundOf16", at(3), makeKnockoutRef("playoff", 4)),
    newKnockoutTie("roundOf16", at(4), makeKnockoutRef("playoff", 3)),
    newKnockoutTie("roundOf16", at(5), makeKnockoutRef("playoff", 2)),
    newKnockoutTie("roundOf16", at(6), makeKnockoutRef("playoff", 1)),
    newKnockoutTie("roundOf16", at(7), makeKnockoutRef("playoff", 0))
  ]));
  tournament.knockout.push(knockoutRoundForKey("quarterfinals", [
    newKnockoutTie("quarterfinals", makeKnockoutRef("roundOf16", 0), makeKnockoutRef("roundOf16", 7)),
    newKnockoutTie("quarterfinals", makeKnockoutRef("roundOf16", 3), makeKnockoutRef("roundOf16", 4)),
    newKnockoutTie("quarterfinals", makeKnockoutRef("roundOf16", 1), makeKnockoutRef("roundOf16", 6)),
    newKnockoutTie("quarterfinals", makeKnockoutRef("roundOf16", 2), makeKnockoutRef("roundOf16", 5))
  ]));
  tournament.knockout.push(knockoutRoundForKey("semifinals", [
    newKnockoutTie("semifinals", makeKnockoutRef("quarterfinals", 0), makeKnockoutRef("quarterfinals", 1)),
    newKnockoutTie("semifinals", makeKnockoutRef("quarterfinals", 2), makeKnockoutRef("quarterfinals", 3))
  ]));
  tournament.knockout.push(knockoutRoundForKey("final", [
    newKnockoutTie("final", makeKnockoutRef("semifinals", 0), makeKnockoutRef("semifinals", 1))
  ]));
}

function legTotals(tie) {
  const a = tieTeamA(tie), b = tieTeamB(tie);
  if (!a || !b) return { a: 0, b: 0 };
  let aAgg = 0, bAgg = 0;
  for (const leg of tie.legs) {
    if (!leg.played) continue;
    if (leg.team1 === a) { aAgg += leg.score1; bAgg += leg.score2; }
    else { aAgg += leg.score2; bAgg += leg.score1; }
  }
  return { a: aAgg, b: bAgg };
}

function resolveTie(tie) {
  if (tie.done) return tie.winner;
  const a = tieTeamA(tie), b = tieTeamB(tie);
  const agg = legTotals(tie);
  let winner = null;
  if (agg.a !== agg.b) {
    winner = agg.a > agg.b ? a : b;
  } else {
    const last = tie.legs[tie.legs.length - 1];
    if (last.played && last.winner) {
      winner = last.winner;
      tie.decidedBy = last.decidedBy || "penalties";
    } else {
      const stA = getTeamStrength(a) || 50;
      const stB = getTeamStrength(b) || 50;
      winner = Math.random() < stA / (stA + stB) ? a : b;
      tie.decidedBy = "penalties";
    }
  }
  tie.winner = winner;
  tie.done = true;
  return winner;
}

function simulateTie(tie) {
  if (!tie || tie.done) return tie ? tie.winner : null;
  // Never play a tie whose entrants are still placeholder refs: that would pit a
  // real club against a string like "Winner Play-off 7" and bake the phantom
  // team into the results and the rankings.
  if (!knockoutTieReady(tie)) return null;
  const a = tieTeamA(tie), b = tieTeamB(tie);
  for (let i = 0; i < tie.legs.length; i++) {
    const leg = tie.legs[i];
    if (leg.played) continue;
    const simLeg = { team1: a, team2: b, score1: null, score2: null, winner: null, played: false };
    simulateGroupMatch(simLeg);
    leg.team1 = simLeg.team1;
    leg.team2 = simLeg.team2;
    leg.score1 = simLeg.score1;
    leg.score2 = simLeg.score2;
    leg.played = true;
    const agg = legTotals(tie);
    simulateKnockoutLegFinish(leg, i >= tie.legs.length - 1, agg.a === agg.b);
  }
  return resolveTie(tie);
}

// Chance a side converts a penalty, nudged by club strength so the better side
// edges the shootout without ever making it a certainty.
function penaltyKickRate(team) {
  const st = getTeamStrength(team) || 70;
  return Math.max(0.62, Math.min(0.86, 0.68 + (st - 70) * 0.006));
}

// Five kicks each, stopping the moment it cannot be caught, then sudden death.
function simulatePenaltyShootout(teamA, teamB) {
  const rA = penaltyKickRate(teamA), rB = penaltyKickRate(teamB);
  let a = 0, b = 0, kicks = 0;
  const takePair = () => {
    if (Math.random() < rA) a++;
    if (Math.random() < rB) b++;
    kicks++;
  };
  const out = (sudden) => ({ a: a, b: b, winner: a > b ? teamA : teamB, sudden: sudden });
  for (let i = 0; i < 5; i++) {
    takePair();
    if (i >= 4 && (a > b + (5 - kicks) || b > a + (5 - kicks))) return out(false);
  }
  for (let i = 0; i < 50; i++) {
    takePair();
    if (a !== b) return out(true);
  }
  return out(true);
}

// 30 more minutes at a fraction of the 90-minute goal rate, so most level ties
// stay level and go to penalties rather than being settled by a stray goal.
function simulateExtraTimeGoals(team1, team2) {
  return {
    g1: poisson(Math.max(0.12, expectedGoals(team1, team2) * 0.32)),
    g2: poisson(Math.max(0.12, expectedGoals(team2, team1) * 0.32))
  };
}

/* Settle a knockout leg that has just been simulated over 90 minutes.
   Rules:
   - a tie's FIRST leg never goes to a shootout, a level first leg stays level
   - from the deciding leg on, a tie level at the end of the 90 goes to extra
     time, and still level after that, to penalties
   - single-leg ties (finals, Club World Cup) settle in one match the same way
   isDecidingLeg  - this leg decides the tie
   aggregateLevel - the tie is level on aggregate once this leg's 90 minutes are in */
function simulateKnockoutLegFinish(leg, isDecidingLeg, aggregateLevel) {
  if (!leg) return leg;
  const t1 = leg.team1, t2 = leg.team2;
  if (leg.score1 !== leg.score2) {
    leg.winner = leg.score1 > leg.score2 ? t1 : t2;
    return leg;
  }
  // Level after 90 minutes.
  if (!isDecidingLeg) { leg.winner = null; return leg; }
  if (aggregateLevel === false) { leg.winner = null; return leg; }
  const et = simulateExtraTimeGoals(t1, t2);
  leg.score1 += et.g1;
  leg.score2 += et.g2;
  leg.et = true;
  if (leg.score1 !== leg.score2) {
    leg.winner = leg.score1 > leg.score2 ? t1 : t2;
    return leg;
  }
  const pen = simulatePenaltyShootout(t1, t2);
  leg.pens1 = pen.a;
  leg.pens2 = pen.b;
  leg.decidedBy = "penalties";
  leg.winner = pen.winner;
  return leg;
}

// "4-3" style shootout scoreline for a tie, ordered to match tieTeamA/tieTeamB.
function knockoutTiePensLabel(tie) {
  if (!tie || !tie.legs) return "";
  const a = tieTeamA(tie), b = tieTeamB(tie);
  for (let i = tie.legs.length - 1; i >= 0; i--) {
    const leg = tie.legs[i];
    if (!leg || !leg.played || leg.decidedBy !== "penalties") continue;
    if (leg.pens1 == null || leg.pens2 == null) continue;
    const first = leg.team1 === a;
    return (first ? leg.pens1 : leg.pens2) + "-" + (first ? leg.pens2 : leg.pens1);
  }
  return "";
}

function ensureKnockoutRefsResolved(tie) {
  for (const side of [tie.team1, tie.team2]) {
    if (side && typeof side === "object") {
      const round = (tournament.knockout || []).find(r => r.key === side.ref);
      const src = round && round.ties[side.index];
      // Recurse: a quarter-final slot points at a round of 16 tie, which itself
      // points at a play-off tie, so one level of resolution is not enough.
      if (src && !src.done) { ensureKnockoutRefsResolved(src); simulateTie(src); }
    }
  }
}

function makeLegPlayable(round, tie, leg, legIndex) {
  leg.team1 = tieTeamA(tie);
  leg.team2 = tieTeamB(tie);
  leg.clKnockout = true;
  leg.roundKey = round.key;
  leg.tieIndex = round.ties.indexOf(tie);
  leg.legIndex = legIndex;
  return leg;
}

function findKnockoutTie(roundKey, tieIndex) {
  const round = (tournament.knockout || []).find(r => r.key === roundKey);
  return round ? round.ties[tieIndex] : null;
}

function playerTieLeg() {
  const rounds = tournament.knockout || [];
  for (const round of rounds) {
    for (const tie of round.ties) {
      const a = tieTeamA(tie), b = tieTeamB(tie);
      if (a !== selectedTeam && b !== selectedTeam) continue;
      for (let i = 0; i < tie.legs.length; i++) {
        const leg = tie.legs[i];
        if (leg.played) continue;
        ensureKnockoutRefsResolved(tie);
        return makeLegPlayable(round, tie, leg, i);
      }
    }
  }
  return null;
}

function playerUnplayedLeg() {
  return playerTieLeg();
}

function currentKnockoutRound() {
  return (tournament.knockout || []).find(r => r.key === tournament.stage) || null;
}

function knockoutStageForRank(rank) {
  if (rank <= 8) return "roundOf16";
  if (rank <= 24) return "playoff";
  return "eliminated";
}

function advanceKnockout(match) {
  const rounds = tournament.knockout || [];
  const round = rounds.find(r => r.key === (match && match.roundKey));
  if (!round) return false;
  const idx = rounds.indexOf(round);
  const next = rounds[idx + 1];
  // Play the rest of the tournament out, not just this round. Simulating only
  // the round the user just won left every later slot pointing at an unplayed
  // tie, so the bracket filled up with "Winner Round of 16 1" placeholders and
  // the user's next tie was handed a phantom opponent. simulateRemainingKnockout
  // walks every round in bracket order and still leaves the user's own tie alone.
  simulateRemainingKnockout();
  if (!next) {
    tournament.champion = match.tie ? resolveTie(match.tie) : null;
    tournament.stage = "final";
    return true;
  }
  tournament.stage = next.key;
  return false;
}

function simulateRemainingKnockout() {
  const rounds = tournament.knockout || [];
  // Walk EVERY round in bracket order instead of starting at tournament.stage.
  // A top-8 league finish sets stage straight to "roundOf16" while the play-off
  // round feeding it is still unplayed, so skipping ahead left those 8 ties
  // stuck on TBD and handed phantom teams to the Round of 16.
  for (const round of rounds) {
    for (const tie of (round.ties || [])) {
      if (tie.done) continue;
      if (!knockoutTieReady(tie)) continue;
      // The user's own tie is theirs to play or sim - never auto-play it.
      const ta = tieTeamA(tie), tb = tieTeamB(tie);
      if ((ta === selectedTeam || tb === selectedTeam) && (tie.legs || []).some(l => !l.played)) continue;
      simulateTie(tie);
    }
  }
  const finalRound = rounds.find(r => r.key === "final");
  if (finalRound && finalRound.ties.length && finalRound.ties[0].done) {
    tournament.champion = finalRound.ties[0].winner;
  }
  updateRankingsAfterTournament();
  return tournament.champion;
}

// Day-aware twin of simulateRemainingKnockout(). Because Europe is now part of
// the season rather than a phase that runs after it, a round that is not due
// yet must stay on TBD instead of being played off the end of the bracket.
function simulateRemainingKnockoutToDay(toDay, skipMine) {
  const rounds = tournament.knockout || [];
  for (const round of rounds) {
    // A round with no date yet (an older save, or a bracket that was never
    // dated) is played straight away rather than being treated as undated
    // and therefore never due.
    const rd = typeof round.day === "number" ? round.day : null;
    if (rd !== null && rd > toDay) continue;
    for (const tie of (round.ties || [])) {
      if (tie.done) continue;
      if (!knockoutTieReady(tie)) continue;
      const ta = tieTeamA(tie), tb = tieTeamB(tie);
      if ((ta === selectedTeam || tb === selectedTeam) && skipMine) continue;
      if ((ta === selectedTeam || tb === selectedTeam) && (tie.legs || []).some(l => !l.played)) continue;
      simulateTie(tie);
    }
  }
  const finalRound = rounds.find(r => r.key === "final");
  if (finalRound && finalRound.ties.length && finalRound.ties[0].done) {
    tournament.champion = finalRound.ties[0].winner;
  }
  updateRankingsAfterTournament();
  return tournament.champion;
}

function updateRankingsAfterTournament() {
  const rankOrder = [];
  const loserOfTie = tie => {
    const a = tieTeamA(tie), b = tieTeamB(tie);
    return tie.winner === a ? b : a;
  };
  if (tournament.champion) rankOrder.push(tournament.champion);
  const finalRound = (tournament.knockout || []).find(r => r.key === "final");
  if (finalRound && finalRound.ties.length === 1 && finalRound.ties[0].done) {
    rankOrder.push(loserOfTie(finalRound.ties[0]));
  }
  const bandOrder = ["semifinals", "quarterfinals", "roundOf16", "playoff"];
  for (const key of bandOrder) {
    const round = (tournament.knockout || []).find(r => r.key === key);
    if (!round) continue;
    const losers = [];
    for (const tie of round.ties) {
      if (!tie.done) continue;
      const agg = legTotals(tie);
      const loser = loserOfTie(tie);
      if (!loser) continue;
      const loserGoals = tie.winner === tieTeamA(tie) ? agg.b : agg.a;
      losers.push({ team: loser, goals: loserGoals, other: getTeamStrength(loser) });
    }
    losers.sort((x, y) => (y.goals - x.goals) || (y.other - x.other));
    rankOrder.push(...losers.map(x => x.team));
  }
  const knockoutTeams = new Set(rankOrder);
  const groupEliminated = tournament.groups
    .flatMap(g => computeGroupStandings(g))
    .filter(row => !knockoutTeams.has(row.team))
    .sort((a, b) => (b.points - a.points) || (b.gd - a.gd) || (b.gf - a.gf));
  rankOrder.push(...groupEliminated.map(row => row.team));
  rankOrder.forEach((team, index) => { FIFA_RANKINGS[team] = index + 1; });
}

function makeKnockoutBracketHTML() {
  let h = '<div class="clBracket">';
  const rounds = tournament.knockout || [];
  for (const round of rounds) {
    h += '<div class="clBracketRound"><div class="clBracketRoundTitle">' + escapeHtml(round.title) + '</div>';
    for (const tie of round.ties) {
      const a = tieTeamA(tie), b = tieTeamB(tie);
      const agg = legTotals(tie);
      const hasAgg = tie.legs.some(l => l.played);
      const winA = tie.done && tie.winner === a;
      const winB = tie.done && tie.winner === b;
      const pens = knockoutTiePensLabel(tie);
      h += '<div class="clBracketTie">';
      h += '<div class="clBracketTeam' + (winA ? ' clWin' : '') + (a === selectedTeam ? ' clYou' : '') + '">' + escapeHtml(String(a)) + '</div>';
      h += '<span class="clBracketScore">' + (hasAgg ? agg.a + '\u2013' + agg.b : 'TBD') + (tie.done && tie.decidedBy && agg.a === agg.b ? ' <i>' + (pens ? pens + 'p' : 'p') + '</i>' : '') + '</span>';
      h += '<div class="clBracketTeam' + (winB ? ' clWin' : '') + (b === selectedTeam ? ' clYou' : '') + '">' + escapeHtml(String(b)) + '</div>';
      h += '</div>';
    }
    h += '</div>';
  }
  h += '</div>';
  return h;
}

function buildRoundOf16() { 

  const standings = computeGroupStandings(tournament.groups[0]); 

  const qualified = standings.slice(0, 16).map(row => row.team); 

 

  tournament.roundOf16 = []; 

 

  for (let i = 0; i < 8; i++) { 

    tournament.roundOf16.push(createMatch(qualified[i], qualified[15 - i])); 

  } 

 

  tournament.stage = "roundOf16"; 

} 

 

function startTournament() {

  currentMode = "champions"; 

  const nameInput = document.getElementById("playerNameInput").value.trim(); 

  playerName = nameInput || "YOU"; 

 

  selectDarkHorses(); 

  createLeaguePhase(); 

  document.getElementById("playerNameInput").blur();

  document.getElementById("menu").style.display = "none";
  enterScreen("gameScreen", "block");

  loadClubStateFor(selectedTeam); 



 

  preparePlayerMatch(); 

  kickoffIntro = KICKOFF_INTRO_WAIT;

  beginMatch(); 

} 

 

function findPlayerMatch() {
  if (currentMode === "worldcup") return null;
  if (currentMode === "custom") return null;
  if (currentMode === "playercareer") return null;
  if (currentMode === "managercareer") return null;
  let best = null;
  for (const g of (tournament.groups || [])) {
    if (!Array.isArray(g.teams) || g.teams.indexOf(selectedTeam) === -1) continue;
    for (const m of (g.matches || [])) {
      if (!m.played && (m.team1 === selectedTeam || m.team2 === selectedTeam)) {
        const d = typeof m.day === "number" ? m.day : 0;
        if (!best || d < best.day) best = { day: d, m: m };
      }
    }
  }
  if (best) return best.m;
  const leg = playerUnplayedLeg();
  if (leg) return leg;
  return null;
} 

 

function getOpponentTeam() {
  if (currentMode === "worldcup" && wcContext && wcContext.opponent) return wcContext.opponent; 

  if (currentMode === "custom" && ctContext && ctContext.opponent) return ctContext.opponent;
  if (currentMode === "playercareer" && pcContext && pcContext.opponent) return pcContext.opponent; 
  if (currentMode === "managercareer" && mcContext && mcContext.opponent) return mcContext.opponent; 

  if (pvpContext && pvpContext.opponent) return pvpContext.opponent; 

  if (friendlyContext && friendlyContext.opponent) return friendlyContext.opponent; 

  const match = findPlayerMatch(); 

 

  if (!match) return "Unknown"; 

 

  return match.team1 === selectedTeam 

    ? match.team2 

    : match.team1; 

} 

 

function hexToRgb(hex) { 

  const clean = hex.replace("#", ""); 

  return { 

    r: parseInt(clean.substring(0, 2), 16), 

    g: parseInt(clean.substring(2, 4), 16), 

    b: parseInt(clean.substring(4, 6), 16) 

  }; 

} 

 

function lightenColor(hex, amount) { 

  const { r, g, b } = hexToRgb(hex); 

  const lighten = channel => 

    Math.round(channel + (255 - channel) * amount); 

  return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`; 

} 

 

function applyTeamColors() { 

const customJersey = jerseyColorSetting();

  const kitColor = (typeof myClubLiveKitColor === "function") ? myClubLiveKitColor() : "";

  const playerColor = customJersey || kitColor || teamColors[selectedTeam] || "#168cff";

  const opponentColor = teamColors[getOpponentTeam()] || "#e63946"; 

 

  player.color = playerColor; 

 

  for (const teammate of teammates) { 

    teammate.color = customJersey ? lightenColor(customJersey, 0.3) : lightenColor(playerColor, 0.3); 

  } 

 

  for (const opponent of opponents) { 

    opponent.color = opponent.role === "attacker" 

      ? lightenColor(opponentColor, 0.3) 

      : opponentColor; 

  } 

} 

 

function resolveName(playerData, role) { 

  return (playerData && playerData.name) || 

    (role.charAt(0).toUpperCase() + role.slice(1)); 

} 

 

// Out-of-position penalty for My Club: a card fielded in a slot that isn't its
// natural role (attacker / midfielder / defender / goalkeeper) loses a little
// edge. Slight by design: 3% off each of the six core stats (0.97 multiplier).
// Applies to every card, including SUPERSTARs, so "play anyone anywhere" still
// asks a small price. The display rating (buffedPlayerView) and the live
// in-match rating (applyPlayerData -> calculateOverall) share this same factor
// so what you see in the lineup tab is exactly what hits the pitch. Outside My
// Club (standalone market slots) SUPERSTAR keeps its free full-strength slotting.
const MY_CLUB_OOP_NERF = 0.97;
function cardNaturalRole(p) {
  if (!p) return null;
  if (p.role) return p.role;
  let code = null;
  const m = (p.pos || "").toUpperCase().match(/(GK|RB|CB|LB|CDM|CM|CAM|RW|ST|LW|DF|MF|FW)(?:-|$)/g);
  if (m && m.length) code = m[m.length - 1].replace(/-$/, "");
  if (!code) {
    const nm = (p.name || "").toUpperCase();
    const m2 = nm.match(/(GK|RB|CB|LB|CDM|CM|CAM|RW|ST|LW|DF|MF|FW)(?:-|$)/g);
    if (m2 && m2.length) code = m2[m2.length - 1].replace(/-$/, "");
  }
  if (!code) return null;
  if (code === "GK") return "goalkeeper";
  if (code === "RB" || code === "CB" || code === "LB" || code === "DF") return "defender";
  if (code === "CDM" || code === "CM" || code === "CAM" || code === "MF") return "midfielder";
  return "attacker";
}
function myClubOopFactor(p, role) {
  if (!p) return 1;
  if (cardNaturalRole(p) === role) return 1;
  if (p.tag === "SUPERSTAR" && currentMode !== "myclub") return 1;
  return MY_CLUB_OOP_NERF;
}


function applyPlayerData(target, playerData, role) { 

  target.name = resolveName(playerData, role); 

  target.role = role;

  target.radius = role === "goalkeeper" ? 16 : 18;

  target.pace = playerData.pace; 

  target.shooting = playerData.shooting; 

  target.passing = playerData.passing; 

  target.dribbling = playerData.dribbling; 

  target.defending = playerData.defending; 

target.physical = playerData.physical;

  const oopFactor = myClubOopFactor(playerData, role);
  if (oopFactor !== 1) {
    target.pace = (target.pace == null ? 0 : target.pace) * oopFactor;
    target.shooting = (target.shooting == null ? 0 : target.shooting) * oopFactor;
    target.passing = (target.passing == null ? 0 : target.passing) * oopFactor;
    target.dribbling = (target.dribbling == null ? 0 : target.dribbling) * oopFactor;
    target.defending = (target.defending == null ? 0 : target.defending) * oopFactor;
    target.physical = (target.physical == null ? 0 : target.physical) * oopFactor;
  }

  if (target.team === "red") {

    const stageNerf = getOpponentNerf();

    target.pace *= stageNerf;

    target.shooting *= stageNerf;

    target.passing *= stageNerf;

    target.dribbling *= stageNerf;

    target.defending *= stageNerf;

    target.physical *= stageNerf;

  }

target.overall = calculateOverall(target, role);

  target.speed = computeSpeed(target.pace, target.physical);

}

function getTeamBuff(team) {

  const rank = FIFA_RANKINGS[team] || 49;

  let buff = 1 + (49 - rank) / 200;

  if (currentMode !== "worldcup" && currentMode !== "custom" && currentMode !== "playercareer" && currentMode !== "managercareer" && tournament.stage === "groups" && rank > 15) {

    buff += Math.min(0.15, (rank - 15) * 0.004);

  }

  return buff;

}

let DARK_HORSES = [];

function selectDarkHorses() {

  const candidates = teams.filter(t => (FIFA_RANKINGS[t] || 49) > 15);

  for (let i = candidates.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];

  }

  DARK_HORSES = candidates.slice(0, 2);

}

function isDarkHorse(team) {

  return DARK_HORSES.includes(team);

}

function applyRankingBuffs() {

  for (const p of allPlayers) {

    const team = p.team === "blue" ? selectedTeam : getOpponentTeam();

    let buff = getTeamBuff(team);

    if (currentMode === "myclub" && team === selectedTeam) {

      buff *= myClubCareerBuff(getMyClubCareer(myClubLeague));

    }

    p.pace *= Math.min(buff, 1.05);

    p.shooting *= Math.min(buff, 1.25);

    p.passing *= buff;

    p.dribbling *= buff;

    p.defending *= buff;

    p.physical *= buff;

    if (isDarkHorse(team)) {

      p.pace *= 1.10;

      p.shooting *= 1.10;

      p.passing *= 1.10;

      p.dribbling *= 1.10;

      p.defending *= 1.10;

      p.physical *= 1.10;

    }

    p.speed = computeSpeed(p.pace, p.physical);

    p.overall = calculateOverall(p, p.role);

  }

}

 

function myClubLiveCoords(band, n, idx) { 

  if (band === "goalkeeper") return { x: field.x + 135, y: 750 }; 

  const x = band === "defender" ? field.x + 435 : band === "midfielder" ? field.x + 885 : field.x + 1335; 

  let y; 

  if (band === "defender" && n === 4) y = [300, 600, 900, 1200][idx]; 

  else if (band === "midfielder" && n === 3) y = [450, 750, 1050][idx]; 

  else if (band === "attacker" && n === 3) y = [450, 1050, 750][idx]; 

  else y = n === 1 ? 750 : 300 + Math.round(idx * (900 / (n - 1))); 

  return { x: x, y: y }; 

} 

function applyMyClubTeamData(roster) { 

  const d = roster.defenders || []; 

  const m = roster.midfielders || []; 

  const a = roster.attackers || []; 

  const place = (t, p, band, n, i) => { 

    const c = myClubLiveCoords(band, n, i); 

    t.x = c.x; t.y = c.y; t.startX = c.x; t.startY = c.y; 

    applyPlayerData(t, p, band); 

  }; 

  let idx = 0; 

  for (let k = 0; k < d.length && idx < 9; k++, idx++) place(teammates[idx], d[k], "defender", d.length, k); 

  for (let k = 0; k < m.length && idx < 9; k++, idx++) place(teammates[idx], m[k], "midfielder", m.length, k); 

  for (let k = 0; k < a.length - 1 && idx < 9; k++, idx++) place(teammates[idx], a[k], "attacker", a.length, k); 

  const you = a.length ? a[a.length - 1] : null; 

  if (you) place(player, you, "attacker", a.length, a.length - 1); 

  place(teammates[9], roster.goalkeeper, "goalkeeper", 1, 0); 

} 

function applyManagerLiveBuffTeam() { 

  if (currentMode !== "myclub") return; 

  const m = getActiveManager(); 

  if (!m) return; 

  for (let i = 0; i < teammates.length; i++) { 

    const v = managerBuffFor(m, teammates[i].role); 

    if (v) teammates[i][m.stat] = (teammates[i][m.stat] == null ? v : teammates[i][m.stat] + v); 

    teammates[i].overall = calculateOverall(teammates[i], teammates[i].role); 

    teammates[i].speed = computeSpeed(teammates[i].pace, teammates[i].physical); 

  } 

  const vp = managerBuffFor(m, player.role); 

  if (vp) player[m.stat] = (player[m.stat] == null ? vp : player[m.stat] + vp); 

  player.overall = calculateOverall(player, player.role); 

  player.speed = computeSpeed(player.pace, player.physical); 

} 

function applyConsumableLiveBoosts(roster) { 

  if (currentMode !== "myclub") return; 

  if (!roster) return; 

  const d = roster.defenders || []; 

  const m = roster.midfielders || []; 

  const a = roster.attackers || []; 

  const apply1 = (t, p) => { 

    if (!t || !p) return; 

    for (const b of playerBoostList(p)) { 

      if (b.stat === "all") { 

        t.pace = (typeof t.pace === "number" ? t.pace : 0) + b.value; 

        t.shooting = (typeof t.shooting === "number" ? t.shooting : 0) + b.value; 

        t.passing = (typeof t.passing === "number" ? t.passing : 0) + b.value; 

        t.dribbling = (typeof t.dribbling === "number" ? t.dribbling : 0) + b.value; 

        t.defending = (typeof t.defending === "number" ? t.defending : 0) + b.value; 

        t.physical = (typeof t.physical === "number" ? t.physical : 0) + b.value; 

      } else { 

        t[b.stat] = (typeof t[b.stat] === "number" ? t[b.stat] : 0) + b.value; 

      } 

    } 

    t.overall = calculateOverall(t, t.role); 

    t.speed = computeSpeed(t.pace, t.physical); 

  }; 

  let idx = 0; 

  for (let k = 0; k < d.length && idx < 9; k++, idx++) apply1(teammates[idx], d[k]); 

  for (let k = 0; k < m.length && idx < 9; k++, idx++) apply1(teammates[idx], m[k]); 

  for (let k = 0; k < a.length - 1 && idx < 9; k++, idx++) apply1(teammates[idx], a[k]); 

  const you = a.length ? a[a.length - 1] : null; 

  if (you) apply1(player, you); 

  apply1(teammates[9], roster.goalkeeper); 

} 

function applyTeamData() { 

  const playerRoster = TEAM_ROSTERS[selectedTeam]; 

  const opponentRoster = TEAM_ROSTERS[getOpponentTeam()]; 

 

if (playerRoster) { 

    if (currentMode === "myclub") { 

      applyMyClubTeamData(playerRoster); 

      applyManagerLiveBuffTeam(); 

      applyConsumableLiveBoosts(playerRoster); 

    } else { 

    applyPlayerData(teammates[0], playerRoster.defenders[0], "defender"); 

    applyPlayerData(teammates[1], playerRoster.defenders[1], "defender"); 

    applyPlayerData(teammates[2], playerRoster.defenders[2], "defender"); 

    applyPlayerData(teammates[3], playerRoster.defenders[3], "defender"); 

  

    applyPlayerData(teammates[4], playerRoster.midfielders[0], "midfielder"); 

    applyPlayerData(teammates[5], playerRoster.midfielders[1], "midfielder"); 

    applyPlayerData(teammates[6], playerRoster.midfielders[2], "midfielder"); 

  

    // Only 2 AI attacker slots on your team - the human plays the third 

    applyPlayerData(teammates[7], playerRoster.attackers[0], "attacker"); 

    applyPlayerData(teammates[8], playerRoster.attackers[1], "attacker"); 

  

    applyPlayerData(teammates[9], playerRoster.goalkeeper, "goalkeeper"); 

  

    // The human plays the team's third attacker slot - editing that 

    // slot's stats in TEAM_ROSTERS changes how the human plays too 

    applyPlayerData(player, playerRoster.attackers[2], "attacker"); 

    } 

  }

 

  if (opponentRoster) { 

    applyPlayerData(opponents[0], opponentRoster.defenders[0], "defender"); 

    applyPlayerData(opponents[1], opponentRoster.defenders[1], "defender"); 

    applyPlayerData(opponents[2], opponentRoster.defenders[2], "defender"); 

    applyPlayerData(opponents[3], opponentRoster.defenders[3], "defender"); 

 

    applyPlayerData(opponents[4], opponentRoster.midfielders[0], "midfielder"); 

    applyPlayerData(opponents[5], opponentRoster.midfielders[1], "midfielder"); 

    applyPlayerData(opponents[6], opponentRoster.midfielders[2], "midfielder"); 

 

    applyPlayerData(opponents[7], opponentRoster.attackers[0], "attacker"); 

    applyPlayerData(opponents[8], opponentRoster.attackers[1], "attacker"); 

    applyPlayerData(opponents[9], opponentRoster.attackers[2], "attacker"); 

 

applyPlayerData(opponents[10], opponentRoster.goalkeeper, "goalkeeper");

  }

  applyRankingBuffs();

}

 

function preparePlayerMatch() { 
  const upcoming = findPlayerMatch(); 
  
  const pGroup = getPlayerGroup(); 
  
  if (upcoming && pGroup && pGroup.matches.includes(upcoming) && upcoming.round) { 
  
    simulateLeagueThrough(upcoming.round); 
  
  } 
if (currentMode === "myclub") { 

    const mc = getMyClubCareer(myClubLeague); 

    // a ranked match happens outside the season, so it must not quietly settle
    // a cup tie or roll the calendar while the user is playing it
    if (mc && !pvpContext) simulateMyClubCupThrough(mc, myClubSimLimit(upcoming)); 

  }
  
  blueScore = 0;

  redScore = 0; 

  matchTime = 0; 

  stoppageMins = 0;

  // A new match starts under a clear sky.
  weatherClock = 0;
  weatherState = "clear";
  weatherPrev = "clear";
  weatherFade = 1;
  weatherFlash = 0;
  // ...and the next full-time cutscene is armed.
  cutsceneMatchSeen = false;
  // Every match starts with a fresh walk-out and a fresh set of bonus cards.
  walkoutT = 0;
  walkoutDone = false;
  walkoutCards = null;

for (const _p of allPlayers) _p.energy = MAX_ENERGY;

  matchRunning = false; 

  awaitingStart = true;
  // Each match opens on the view the presentation setting asks for: the
  // top-down arcade camera in pixel mode, otherwise the side-on 3D default.
  cam2d = (typeof pixelArtOn === "function") && pixelArtOn();
  camUserSet = false;
  subsUsedThisMatch = 0;
  pendingSubs = [];
  clearBaseSubFlags();
  // A substitution requested from the pause menu is only carried out the moment
  // play next stops (free kick, card, penalty, throw in, goal kick or corner).
  if (typeof PSMatch !== "undefined" && PSMatch && typeof PSMatch.setStopHook === "function") PSMatch.setStopHook(flushPendingSubs);
  generateSponsorTasks();
  clockHalf = 1;

  breakPhase = null; 



  player.charging = false;

  player.chargeFrames = 0;

 

freekick = null;

  matchPenalty = null;

  cardFlash = null;

  for (const p of allPlayers) p.cards = 0; 

for (const p of allPlayers) { p.sentOff = false; p.offInjured = false; } 

  goalLog = []; 

  cardLog = []; 

  // Clear any leftover goal sequence so a goal scored right at the final
  // whistle of the previous match can't replay/celebrate at the start of
  // the next one (endMatch stops the clock mid-celebration and the stored
  // goalPhase / replay frames survive into the new match otherwise).
  goalPhase = "";
  offsideReplay = null;
  goalMoment = null;
  goalReplay = [];
  goalReplayIndex = 0;
  replayHold = 0;
  celebrateFrames = 0;
  // Each match gets exactly one pre-match intro. The scene now holds the
  // kickoff rather than the other way round, so it stops on its own while
  // kickoffIntro is still counting - without this the next frame would see
  // "intro wanted" again and start the whole thing over, forever.
  cutsceneIntroDone = false;
  celebrateTeam = "blue";
  postGoalPause = 0;
  countdownSeconds = 0;
  replayBuffer = [];
  celebrationSpot.x = field.x + field.width / 2;
  celebrationSpot.y = field.y + field.height / 2;
  for (const p of allPlayers) { p.celebrate = 0; p.celebratePhase = 0; }

  updateCards();

  updateTimer();

  clearInterval(timerInterval); 

  

  applyTeamColors(); 

  applyTeamData(); 

  hydrateOpponentBans();

  hydrateMyClubSuspensions();

  hydrateMyClubInjuries();

  applySuspensions(); 

  applyOpponentSuspensions(); 

  resetPositions();

 

  document.getElementById("matchTitle").textContent = 

    `${selectedTeam} vs ${getOpponentTeam()}`; 

 

  updateScore(); 

  updateTimer(); 

  updateEnergyBar(); 

} 

 

function beginMatch() { 

  if (!awaitingStart) return;
  if (kickoffIntro > 0) return;
  kickoffIntro = 0;
  awaitingStart = false;
  matchRunning = true;
  if (currentMode === "myclub" && myClubLeague) {
    const myClubCareerNow = getMyClubCareer(myClubLeague);
    if (myClubCareerNow && myClubCareerNow.mySusp) {
      for (const cidNow in myClubCareerNow.mySusp) serveMyClubSusp(cidNow);
    }
  }
  startTimer();
  updateSponsorUi();
  updateTimer(); 

  crowdEvent("kickoff");

} 

 

// --- Offside ----------------------------------------------------------------
// The offside phase belongs to whichever team last played the ball. Every time
// that team touches it the trap is re-assessed: any attacker beyond both the
// ball and the second-last defender (and beyond the halfway line) is flagged.
// A flagged attacker cannot score - the goal is overturned for an indirect free
// kick. The moment the other side wins the ball the phase ends and everyone is
// onside again. The passer can never be offside from his own pass, and a
// player level with the ball or the defender is not offside, which is why this
// is safe to re-run on every touch rather than only on passes.
let offsidePhaseTeam = null;
function clearOffside() {
  offsidePhaseTeam = null;
  for (const q of allPlayers) q.offside = false;
}
function evaluateOffside(p) {

  if (!p || p.role === "referee") { clearOffside(); return; }

  // A flagged attacker who receives the ball STAYS flagged: offside is judged
  // at the moment the ball was played to him. But he may then lay it off to a
  // team-mate, and that second ball is judged fresh from wherever he strikes
  // it, so the evaluation still has to run when the toucher is himself flagged.
  // The toucher's own flag is simply re-applied afterwards instead of an early
  // return skipping the whole pass - which used to let an on-rushing team-mate
  // collect the lay-off and score with no offside called.
  const wasOffside = p.offside;

  // The other side winning the ball ends the previous phase immediately - and
  // then THIS touch opens a new one for the team that just won it. It used to
  // clear the phase and return instead, which meant the pass that wins the ball
  // back was never itself judged: the phase only began on the receiver's touch,
  // so the attacker it was played to was judged from his own first touch rather
  // than from where he was when the ball was struck.
  if (offsidePhaseTeam !== null && p.team !== offsidePhaseTeam) clearOffside();

  offsidePhaseTeam = p.team;

  const dir = p.team === "blue" ? 1 : -1;

  const defenders = [];

  for (const q of allPlayers) {

    // The referee carries a team but is never a defender - counting him would
    // move the offside line whenever he stood upfield.
    if (!q.sentOff && q.team !== p.team && q.role !== "referee") defenders.push(q);

  }

  // Fewer than two defenders on the pitch (a red card has thinned them out):
  // there is no offside line to be beyond, so nothing is offside.
  if (defenders.length < 2) {

    for (const q of allPlayers) q.offside = false;

    return;

  }

  defenders.sort((a, b) => dir * (b.x - a.x));

  // Second-last defender: the one nearest the goal line but one.
  const lineX = defenders[1].x;

  const midX = field.x + field.width / 2;

  // The line the attacker has to beat is the FURTHEST of the second-last
  // defender, the ball and the halfway line - measured in the direction the
  // attacking team is going. That "furthest" is a max for a side attacking
  // right but a MIN for a side attacking left, so it has to follow the
  // direction of play rather than always taking the max: using a plain
  // Math.max made every red attacker standing anywhere behind the widest of
  // those three x values get flagged, which is most of his own half.
  const offsideLine = dir > 0
    ? Math.max(lineX, ball.x, midX)
    : Math.min(lineX, ball.x, midX);

  for (const q of allPlayers) {

    q.offside = false;

    if (q.team !== p.team || q.sentOff || q === p || q.role === "referee") continue;

    // Beyond the ball, beyond the second-last defender, and in the opposition half.
    if (q.x * dir > offsideLine * dir) q.offside = true;

  }

  if (wasOffside) p.offside = true;

}

function setBallToucher(p) { 

  ball.lastToucher = p; 

  evaluateOffside(p); 

  if (!p) { 

    ball.lastFieldToucher = null;

    ball.lastBlueFieldToucher = null;

    ball.lastRedFieldToucher = null; 

  } else if (p.role !== "goalkeeper") { 

    ball.lastFieldToucher = p;

    if (p.team === "blue") {

      if (ball.lastBlueFieldToucher && ball.lastBlueFieldToucher !== p) ball.prevBlueFieldToucher = ball.lastBlueFieldToucher;

      ball.lastBlueFieldToucher = p;

    } else {

      if (ball.lastRedFieldToucher && ball.lastRedFieldToucher !== p) ball.prevRedFieldToucher = ball.lastRedFieldToucher;

      ball.lastRedFieldToucher = p;

    } 

  } 

} 

 

function keeperHoldingBall() { 

  return !!(ballCarrier && ballCarrier.role === "goalkeeper" && ballCarrier.holdsBall); 

} 



function getGoalCredit(scoringTeam) { 

  const t = ball.lastToucher; 

  if (!t) return { scorer: null, own: false }; 

  if (t.team === scoringTeam) return { scorer: t, own: false }; 

  if (t.role === "goalkeeper") { 

    const forward = (scoringTeam === "blue" ? ball.lastBlueFieldToucher : ball.lastRedFieldToucher) || ball.lastFieldToucher; 

    if (forward && forward.team === scoringTeam) return { scorer: forward, own: false }; 

    return { scorer: null, own: false }; 

  } 

  return { scorer: t, own: true }; 

} 

function getGoalAssist(scoringTeam, credit) {

  if (!credit || !credit.scorer || credit.own) return null;

  if (ball.lastToucher && credit.scorer !== ball.lastToucher) return null;

  const prev = scoringTeam === "blue" ? ball.prevBlueFieldToucher : ball.prevRedFieldToucher;

  if (!prev || prev === credit.scorer) return null;

  if (prev.team !== scoringTeam) return null;

  return prev;

} 



function goalScored(team) { 

  // Practice drills loop set pieces, so a goal there just counts the rep and
  // skips the replay/celebration/kickoff ceremony before the next spot stages.
  if (currentMode === "practice" && practiceDrill && practiceDrill.kind !== "open") {
    practiceDrill.scored++;
    practiceDrill.phase = "cooldown";
    practiceDrill.wait = PRACTICE_COOLDOWN;
    practiceDrill.flight = 0;
    showGoalIndicator(team);
    goalMoment = null;
    goalReplay = [];
    goalReplayIndex = 0;
    replayHold = 0;
    goalPhase = "";
    postGoalPause = 0;
    countdownSeconds = 0;
    return;
  }

  const preBlue = blueScore; 

  const preRed = redScore; 

  if (team === "blue") {
    blueScore++;
    sponsorNote("goal");
    crowdEvent("goal", 1);
  } else {
    redScore++;
    crowdEvent("goal", 0.8);
  } 

  

 updateScore(); 

  showGoalIndicator(team); 

  const credit = getGoalCredit(team); 

  goalLog.push({ 

    minute: currentMinuteLabel(), 

    team: team, 

    name: displayNameFor(credit.scorer),

    own: credit.own,

    assist: displayNameFor(getGoalAssist(team, credit))

  });

  if (team === "blue" && !credit.own) {

    if (currentMode === "playercareer") {

      if (typeof pcOnGoal === "function") pcOnGoal(credit.scorer, getGoalAssist(team, credit));

    }

    const statCareer = getMyClubCareer(myClubLeague);

    if (statCareer) {

      const statGroup = getPlayerGroup();

      const statCup = (statGroup && statGroup.cup === "cl") ? "cl" : "league";

      myClubCreditPlayerStat(statCareer, credit.scorer, "goal", statCup);

      const statAssist = getGoalAssist(team, credit);

      if (statAssist) myClubCreditPlayerStat(statCareer, statAssist, "assist", statCup);

    }

  }



if (team === "red") {

    const statCareer = getMyClubCareer(myClubLeague);

    if (statCareer) {

      const statGroup = getPlayerGroup();

      const statCup = (statGroup && statGroup.cup === "cl") ? "cl" : "league";

      const liveKeeper = slotLivePlayer("gk");

      if (liveKeeper) myClubCreditPlayerStat(statCareer, liveKeeper, "concede", statCup);

    }

  }



  if (matchPhase === "sudden") {

    matchRunning = false; 

    clearInterval(timerInterval); 

 

    setTimeout(() => { 

      endMatch(); 

    }, 300); 

 

return; 

  } 

  

  // Pitch invasion: the crowd floods the pitch when the user scores the
  // winning goal of any match in the last five minutes - a strike that
  // takes the lead from a tied or losing position.
  if (team === "blue") {
    const tookLead = blueScore > redScore && preBlue <= preRed;
    if (inClutchWindow() && tookLead) {
      const sx = Math.max(field.x + 24, Math.min(field.x + field.width - 24, ball.x));
      const sy = Math.max(field.y + 24, Math.min(field.y + field.height - 24, ball.y));
      createInvasion("clutch", sx, sy);
    }
  }

  // Capture the scoring moment (live state, before we reset) for the replay,
  // then queue replay - celebration - countdown as the goal sequence.
  goalMoment = takeSnapshot(); 
  goalReplay = replayBuffer.slice(-REPLAY_WINDOW); 
  goalReplay.push(goalMoment); 
  goalReplayIndex = 0; 
  replayHold = 0; 
  celebrateTeam = team; 
  celebrateFrames = CELEBRATE_FRAMES_TOTAL; 
  // The stored frames play back in slow motion first, and the celebration
  // follows once the replay runs out - so a goal always gets an instant replay.
  goalPhase = "replay"; 
  resetPositions(); 

  // Wait 3 seconds after the players are back in position before the
  // next play begins, with a wall-clock countdown shown on the pitch.
  postGoalPause = 0; 
  countdownSeconds = 3;

} 

 

let goalBannerTimeout = null; 

function getScoreDisplayName(p) {

  if (!p) return ""; 

  return p.name || (p === localPlayer ? playerName : ""); 

} 

function showGoalIndicator(team) { 

  const banner = document.getElementById("goalBanner"); 

  if (!banner) return; 

  const teamName = team === "blue" ? selectedTeam : getOpponentTeam(); 

  const teamColor = teamColors[teamName] || (team === "blue" ? "#168cff" : "#e63946"); 

  banner.querySelector(".goalBannerTeam").textContent = teamName; 

  banner.querySelector(".goalBannerTeam").style.color = teamColor; 

  const toucher = ball.lastToucher; 

  const scoringTeam = team === "blue" ? "blue" : "red"; 

  const credit = getGoalCredit(scoringTeam); 

  let scorerText = ""; 

  if (credit.scorer) { 

    scorerText = 

      (credit.own ? "Own Goal — " : "") + getScoreDisplayName(credit.scorer); 

  } 

  banner.querySelector(".goalBannerScorer").textContent = scorerText;

  const assist = getGoalAssist(scoringTeam, credit);

  const assistEl = banner.querySelector(".goalBannerAssist");

  if (assistEl) assistEl.textContent = assist ? "Assisted by " + getScoreDisplayName(assist) : "";

  banner.classList.add("show"); 

  clearTimeout(goalBannerTimeout); 

  goalBannerTimeout = setTimeout(() => { 

    banner.classList.remove("show"); 

  }, 2200); 

} 

function hideGoalIndicator() { 

  clearTimeout(goalBannerTimeout); 

  const banner = document.getElementById("goalBanner"); 

  if (banner) banner.classList.remove("show"); 

}

let subBannerTimeout = null;

function showSubIndicator(offName, onName) {
  const banner = document.getElementById("subBanner");
  if (!banner) return;
  const line = banner.querySelector(".subBannerLine");
  if (line) line.textContent = "OFF: " + (offName || "") + "   IN: " + (onName || "");
  banner.classList.add("show");
  clearTimeout(subBannerTimeout);
  subBannerTimeout = setTimeout(() => banner.classList.remove("show"), 2600);
}

function hideSubIndicator() {
  clearTimeout(subBannerTimeout);
  const banner = document.getElementById("subBanner");
  if (banner) banner.classList.remove("show");
} 

 

// One second of match time. Split out of the wall-clock interval so a lockstep
// match can advance the clock from the deterministic tick instead - two clients
// with independently drifting setInterval callbacks would otherwise reach
// half-time at different moments and permanently diverge.
function netAdvanceClockSecond() {
  if (!matchRunning) return;
  // Held while a human is over a stationary ball for their own free kick.
  if (freekick && freekick.taker.human) return;
  if (breakPhase) {
    breakPhase.seconds--;
    updateTimer();
    if (breakPhase.seconds <= 0) {
      const done = breakPhase.onDone;
      breakPhase = null;
      if (done) done();
    }
    return;
  }
  matchTime += 90 / (halfLengthMinutes() * 60);
  advanceWeather();
  updateTimer();
  if (matchPhase === "sudden") return;
  if (clockHalf === 1 && matchTime >= 90 + stoppageMins * 2) {
    beginBreak("HALF TIME", startSecondHalf);
    return;
  }
  if (matchPhase === "extra" && matchTime >= 30 + stoppageMins * 2) {
    timerFinished();
    return;
  }
  if (matchPhase === "normal" && matchTime >= 90 + stoppageMins * 2) {
    timerFinished();
  }
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  // The Pixel Striker engine owns the match clock: the simulation fires full
  // time itself (via the goal/end hooks) and the on-pitch HUD reads the sim
  // clock. This legacy wall-clock interval only ever drove half time / full
  // time for the old engine simulation - and its half time calls
  // resetPositions(), which re-prepares the Pixel Striker match mid-game
  // (score and clock wiped back to 0). Arming it therefore randomly restarted
  // matches. So it must never be armed; just make sure no stale interval is
  // left running. (Online lockstep still advances the clock from its own tick,
  // and Practice runs no clock at all.)
}

 

function inClutchWindow() {
  if (matchPhase === "sudden") return false;
  if (clockHalf === 1) return false;
  const dur = matchPhase === "extra" ? 30 : 90;
  const lead = matchPhase === "extra" ? 10 : 5;
  return matchTime >= dur - lead;
}

function beginBreak(label, onDone) {
  freekick = null;
  matchPenalty = null;
  countdownSeconds = 0;
  breakPhase = { label, seconds: 10, onDone };
  resetPositions();
  updateTimer();
}

function startSecondHalf() {
  clockHalf = 2;
  matchTime = 0;
  stoppageMins = 0;
  matchPhase = "normal";
  resetPositions();
  updateTimer();
  crowdEvent("kickoff");
}

function startSecondETHalf() {
  clockHalf = 4;
  matchTime = 0;
  stoppageMins = 0;
  matchPhase = "extra";
  resetPositions();
  updateTimer();
  crowdEvent("kickoff");
}

function drawBreakOverlay() {
  if (!breakPhase || !matchRunning) return;
  const spot = projectPoint(PITCH_CX, PITCH_CY);
  if (!spot) return;
  const pulse = 1 + 0.08 * Math.sin(performance.now() / 90);
  const size = Math.max(42, 110 * Math.min(1.6, spot.s) * pulse);
  ctx.font = "bold " + size + "px Arial";
  ctx.textAlign = "center";
  ctx.beginPath();
  ctx.arc(spot.x, spot.y, size * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(10, 12, 30, 0.75)";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(Math.max(0, breakPhase.seconds), spot.x, spot.y + size * 0.35);
  ctx.font = "bold " + Math.max(16, size * 0.2) + "px Arial";
  ctx.fillStyle = "#ffd700";
  ctx.fillText(breakPhase.label, spot.x, spot.y - size * 0.6);
  ctx.textAlign = "left";
}
function timerFinished() {
  if (matchPhase === "normal" && isGroupStageMatch()) {
    endMatch();
    return;
  }

  if (matchPhase === "normal") {
    if (blueScore !== redScore) {
      endMatch();
      return;
    }
    beginBreak("90- EXTRA TIME", () => {
      matchPhase = "extra";
      clockHalf = 3;
      matchTime = 0;
      stoppageMins = 0;
      resetPositions();
      updateTimer();
    });
    return;
  }

  if (matchPhase === "extra" && clockHalf !== 4) {
    beginBreak("ET BREAK", startSecondETHalf);
    return;
  }

  if (matchPhase === "extra") {
    if (blueScore !== redScore) {
      endMatch();
      return;
    }
    beginPenalties();
  }
}

function updateTimer() {
  const el = document.getElementById("timer");
  if (!el) return;
  if (currentMode === "practice") {
    el.textContent = "PRACTICE";
    return;
  }
  if (breakPhase) {
    el.textContent = breakPhase.label + " " + Math.max(0, breakPhase.seconds);
    return;
  }
  const min = currentMinute();
  let text = min + "'";
  if (matchPhase === "normal") {
    if (matchTime > 90 && stoppageMins > 0) {
      const base = clockHalf === 2 ? 90 : 45;
      const added = Math.min(stoppageMins, Math.ceil((matchTime - 90) / 2));
      text = base + "+" + added + "' - " + (clockHalf === 1 ? "1st Half" : "2nd Half");
    } else {
      text = min + "' - " + (clockHalf === 1 ? "1st Half" : "2nd Half");
    }
  } else if (matchPhase === "extra") {
    if (matchTime > 30 && stoppageMins > 0) {
      const base = clockHalf === 4 ? 120 : 105;
      const added = Math.min(stoppageMins, Math.ceil((matchTime - 30) / 2));
      text = base + "+" + added + "' EX";
    } else {
      text = min + "' EX";
    }
  } else if (matchPhase === "sudden") {
    text = "SUDDEN DEATH";
  } else if (matchPhase === "penalties") {
    text = "PENALTIES";
  }
  el.textContent = text;
}

function updateScore() { 

  // The canvas draws the scoreboard pill, but there is also a DOM scoreline
  // above the pitch. It was never written to, so it sat at "0 - 0" for the
  // whole match no matter how many goals went in. Keep it in step with the
  // canvas so the two agree.
  const line = document.getElementById("scoreLine");
  if (line) line.textContent = blueScore + " - " + redScore;

} 

 

function updateCards() { 

  const el = document.getElementById("cards"); 

  if (!el) return; 

  const { yb, rb, yr, rr } = cardCounts(); 

  el.textContent = `CARDS  Y${yb} R${rb}  |  Y${yr} R${rr}`; 

} 
 

function updateEnergyBar() { 

  const fill = document.getElementById("energyBarFill"); 

  if (!fill) return; 

 



  const pct = ((player.energy / MAX_ENERGY) * 100);

  fill.style.width = `${pct}%`; 

 

  if (pct < 25) { 

    fill.style.background = "#e63946"; 

  } else if (pct < 60) { 

    fill.style.background = "#ffd700"; 

  } else { 

    fill.style.background = "#62e36b"; 

  } 

} 

 

function finishOtherMatch(match) {

  let score1 = poisson(expectedGoals(match.team1, match.team2));

  let score2 = poisson(expectedGoals(match.team2, match.team1));



  if (score1 === score2) {

    const strength1 = getTeamStrength(match.team1);

    const strength2 = getTeamStrength(match.team2);

    const winChance = strength1 / (strength1 + strength2);

    const winner = Math.random() < winChance ? match.team1 : match.team2;

    // Extra time/penalties decide the tie

    if (winner === match.team1) score1++;

    else score2++;

  }



  match.score1 = score1;

  match.score2 = score2;

  match.winner = score1 > score2 ? match.team1 : match.team2;

}

 

function updateRankingsAfterTournament_Legacy() {

  const rankOrder = [];

  const loserOf = match =>

    match.winner === match.team1 ? match.team2 : match.team1;



  // Champion and runner-up

  if (tournament.champion) rankOrder.push(tournament.champion);



  if (tournament.final.length === 1 && tournament.final[0].winner) {

    rankOrder.push(loserOf(tournament.final[0]));

  }



  // Losers from each knockout round, best losing score first

  const addBandFrom = matches => {

    const scored = team => {

      const match = matches.find(m =>

        m.winner && (m.team1 === team || m.team2 === team)

      );

      return match

        ? (match.team1 === team ? match.score1 : match.score2)

        : 0;

    };



    const losers = matches

      .filter(m => m.winner)

      .map(m => loserOf(m))

      .sort((a, b) => {

        const diff = scored(b) - scored(a);

        if (diff !== 0) return diff;

        return getTeamStrength(b) - getTeamStrength(a);

      });



    rankOrder.push(...losers);

  };



  addBandFrom(tournament.semifinals);

  addBandFrom(tournament.quarterfinals);

  addBandFrom(tournament.roundOf16);



  // Teams knocked out in the league phase round out the bottom spots,

  // ordered by their league-phase record.

  const knockoutTeams = new Set();

  for (const key of KNOCKOUT_ROUNDS) {

    for (const match of tournament[key]) {

      knockoutTeams.add(match.team1);

      knockoutTeams.add(match.team2);

    }

  }



  const groupEliminated = tournament.groups

    .flatMap(g => computeGroupStandings(g))

    .filter(row => !knockoutTeams.has(row.team))

    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);



  rankOrder.push(...groupEliminated.map(row => row.team));



  rankOrder.forEach((team, index) => {

    FIFA_RANKINGS[team] = index + 1;

  });

}

function advanceKnockout_Legacy(playerMatch) { 

  const roundIndex = KNOCKOUT_ROUNDS.findIndex(key => 

    tournament[key].includes(playerMatch) 

  ); 

 

  const currentRoundKey = KNOCKOUT_ROUNDS[roundIndex]; 

  const currentRound = tournament[currentRoundKey]; 

  const nextRoundKey = KNOCKOUT_ROUNDS[roundIndex + 1] || null; 

 

  // Simulate all matches in the current round that the user did not play 

  for (const match of currentRound) { 

    if (match !== playerMatch && !match.winner) { 

      simulateMatch(match); 

    } 

  } 

 

  // The user has won the final 

if (!nextRoundKey) {

    tournament.champion = selectedTeam;

    updateRankingsAfterTournament();

    return true;

  }

 

  const winners = currentRound.map(match => match.winner); 

  const nextRoundMatches = []; 

 

  for (let i = 0; i < winners.length; i += 2) { 

    nextRoundMatches.push(createMatch(winners[i], winners[i + 1])); 

  } 

 

tournament[nextRoundKey] = nextRoundMatches;

  tournament.stage = nextRoundKey;



  return false;

} 



function simulateRemainingKnockout_Legacy(playerMatch) { 

  const roundIndex = KNOCKOUT_ROUNDS.findIndex(key => 

    tournament[key].includes(playerMatch) 

  ); 



  if (roundIndex === -1) return null; 



  let roundKey = KNOCKOUT_ROUNDS[roundIndex]; 



  // Finish the round the player was eliminated in (all other matches) 

  for (const match of tournament[roundKey]) { 

    if (match !== playerMatch && !match.winner) { 

      simulateMatch(match); 

    } 

  } 



  // Walk the bracket to a champion 

  while (roundKey) { 

    const nextRoundKey = 

      KNOCKOUT_ROUNDS[KNOCKOUT_ROUNDS.indexOf(roundKey) + 1] || null; 



    if (!nextRoundKey) { 

      tournament.champion = 

        tournament[roundKey].length === 1 

          ? tournament[roundKey][0].winner 

          : null; 

      updateRankingsAfterTournament(); 

      return tournament.champion; 

    } 



    const winners = tournament[roundKey].map(match => match.winner); 

    const nextRoundMatches = []; 



    for (let i = 0; i < winners.length; i += 2) { 

      nextRoundMatches.push(createMatch(winners[i], winners[i + 1])); 

    } 



    for (const match of nextRoundMatches) { 

      simulateMatch(match); 

    } 



    tournament[nextRoundKey] = nextRoundMatches; 

    tournament.stage = nextRoundKey; 

    roundKey = nextRoundKey; 

  } 



  return null; 

} 



function getOpponentTeamName(match) {

  return match.team1 === selectedTeam ? match.team2 : match.team1; 

} 

 

function ordinalSuffix(n) { 

  if (n % 10 === 1 && n % 100 !== 11) return "st"; 

  if (n % 10 === 2 && n % 100 !== 12) return "nd"; 

  if (n % 10 === 3 && n % 100 !== 13) return "rd"; 

  return "th"; 

} 

 

function isGroupStageMatch() {
  if (currentMode === "worldcup") return wcIsGroupMatch(); 
  if (currentMode === "custom") return ctIsGroupMatch();
  if (currentMode === "playercareer") return pcIsGroupMatch(); 
  if (currentMode === "managercareer") return mcIsGroupMatch(); 

  const group = getPlayerGroup(); 

  if (!group) return false; 

 

  const match = findPlayerMatch(); 

 

  return Boolean(match) && group.matches.includes(match); 

} 



function currentMinute() {
  if (matchPhase === "extra") {
    const base = clockHalf === 4 ? 106 : 91;
    return Math.max(base, Math.min(base + 14, base + Math.floor(matchTime / 2)));
  }
  if (matchPhase === "sudden") return 121 + Math.floor(matchTime / 2);
  const base = Math.floor(matchTime / 2);
  const m = 1 + base + (clockHalf === 2 ? 45 : 0);
  return Math.max(1, Math.min(clockHalf === 2 ? 90 : 45, m));
}

function currentMinuteLabel() {
  if (matchPhase === "normal") {
    if (matchTime > 90 && stoppageMins > 0) {
      const base = clockHalf === 2 ? 90 : 45;
      const added = Math.min(stoppageMins, Math.ceil((matchTime - 90) / 2));
      return base + "+" + added;
    }
    return String(currentMinute());
  }
  if (matchPhase === "extra") {
    if (matchTime > 30 && stoppageMins > 0) {
      const base = clockHalf === 4 ? 120 : 105;
      const added = Math.min(stoppageMins, Math.ceil((matchTime - 30) / 2));
      return base + "+" + added;
    }
    return String(currentMinute());
  }
  return String(currentMinute());
}

function displayNameFor(p) { 

  if (!p) return ""; 

  return p.name || (p === localPlayer ? playerName : ""); 

} 



function buildEndStatsHTML() {
  const teamLabel = team => {
    if (endScreenTeamNames) return endScreenTeamNames[team];
    return team === "blue" ? selectedTeam : getOpponentTeam();
  };
  const teamColor = team =>
    teamColors[teamLabel(team)] || (team === "blue" ? "#168cff" : "#e63946");

  // Frozen engine statistics for this match (captured in __psEnd, match.js).
  // Fall back to a live read so the panel still renders if no snapshot exists.
  let snap = (typeof matchStatsSnapshot !== "undefined") ? matchStatsSnapshot : null;
  if (!snap && typeof PSMatch !== "undefined" && PSMatch && PSMatch.info) {
    try { const i = PSMatch.info(); snap = { stats: i.stats, cardCount: i.cardCount, penalty: null }; } catch (e) { }
  }
  const st = (snap && snap.stats) || {};
  const cards = (snap && snap.cardCount) || [[0, 0], [0, 0]];
  const at = (arr, i) => { const v = arr && arr[i]; return (v == null || isNaN(v)) ? 0 : Number(v); };

  const blueName = teamLabel("blue"), redName = teamLabel("red");
  const blueCol = teamColor("blue"), redCol = teamColor("red");

  const possSum = at(st.poss, 0) + at(st.poss, 1);
  const possPct = possSum > 0
    ? [Math.round(at(st.poss, 0) / possSum * 100), 0]
    : [50, 0];
  possPct[1] = possSum > 0 ? 100 - possPct[0] : 50;

  const penMiss = t => Math.max(0, at(st.pens, t) - at(st.penScored, t));
  const rows = [
    { label: "Possession", b: possPct[0] + "%", r: possPct[1] + "%", nb: possPct[0], nr: possPct[1] },
    { label: "Goals", b: blueScore, r: redScore, nb: blueScore, nr: redScore },
    { label: "Shots", b: at(st.shots, 0), r: at(st.shots, 1), nb: at(st.shots, 0), nr: at(st.shots, 1) },
    { label: "Shots on Target", b: at(st.on, 0), r: at(st.on, 1), nb: at(st.on, 0), nr: at(st.on, 1) },
    { label: "Chances", b: at(st.chances, 0), r: at(st.chances, 1), nb: at(st.chances, 0), nr: at(st.chances, 1) },
    { label: "Saves", b: at(st.saves, 0), r: at(st.saves, 1), nb: at(st.saves, 0), nr: at(st.saves, 1) },
    { label: "Tackles", b: at(st.tackles, 0), r: at(st.tackles, 1), nb: at(st.tackles, 0), nr: at(st.tackles, 1) },
    { label: "Penalties", b: at(st.pens, 0), r: at(st.pens, 1), nb: at(st.pens, 0), nr: at(st.pens, 1) },
    { label: "Missed Penalties", b: penMiss(0), r: penMiss(1), nb: penMiss(0), nr: penMiss(1) },
    { label: "Yellow Cards", b: at(cards[0], 0), r: at(cards[1], 0), nb: at(cards[0], 0), nr: at(cards[1], 0) },
    { label: "Red Cards", b: at(cards[0], 1), r: at(cards[1], 1), nb: at(cards[0], 1), nr: at(cards[1], 1) }
  ];

  let html = "";
  html += `<div class="endStatsHead">` +
    `<span class="endStatsTeam blue" style="color:${blueCol}">${blueName}</span>` +
    `<span class="endStatsVs">Match Stats</span>` +
    `<span class="endStatsTeam red" style="color:${redCol}">${redName}</span></div>`;

  html += `<div class="endStatsGrid">`;
  for (const row of rows) {
    const tot = row.nb + row.nr;
    const bp = tot > 0 ? Math.round(row.nb / tot * 100) : 50;
    const rp = tot > 0 ? 100 - bp : 50;
    html += `<div class="endStatRow" data-nav>` +
      `<span class="endStatVal blue">${row.b}</span>` +
      `<div class="endStatCore">` +
      `<div class="endStatName">${row.label}</div>` +
      `<div class="endStatTrack"><span class="endStatSeg blue" style="width:${bp}%"></span>` +
      `<span class="endStatSeg red" style="width:${rp}%"></span></div>` +
      `</div>` +
      `<span class="endStatVal red">${row.r}</span></div>`;
  }
  html += `</div>`;

  if (snap && snap.penalty && snap.penalty.score) {
    const ps = snap.penalty.score;
    html += `<div class="endShootout" data-nav>Penalty shoot-out &middot; ${blueName} <b>${ps.blue}</b> &ndash; <b>${ps.red}</b> ${redName}</div>`;
  }

  html += `<div class="endBlock"><div class="endBlockHead">Goals</div>`;
  if (goalLog.length === 0) {
    html += `<div class="endEmpty">No goals.</div>`;
  } else {
    for (const g of goalLog) {
      html += `<div class="endGoalRow" data-nav>` +
        `<span class="endGoalTeam" style="color:${teamColor(g.team)}">${teamLabel(g.team)}</span>` +
        `<span class="endGoalWho">${headshotCanvasHtml(headshotKeyFor({ team: g.team, name: g.name }), 26, g.team)}${g.name || "Unknown"}${g.own ? ' <em style="color:#8ea3b8">(own goal)</em>' : ""}${g.assist ? ` <span class="endAssistInline">(assist: ${g.assist})</span>` : ""}</span>` +
        `<span class="endMinute">${String(g.minute || "").replace(/'+$/, "")}&#39;</span></div>`;
    }
  }
  html += `</div>`;

  return html;
}



function showEndScreen(resultText, scoreLine, onContinue, teamNames, trophy) { 

  const reveal = function () {

    document.getElementById("endResult").textContent = resultText; 

    document.getElementById("endScore").textContent = scoreLine; 

    endScreenTeamNames = teamNames || null; 

    document.getElementById("endStats").innerHTML = buildEndStatsHTML(); 

    paintHeadshots(); 

    endScreenNext = onContinue || null; 

    document.getElementById("endScreen").style.display = "flex"; 

    if (typeof uiRefreshFocus === "function") uiRefreshFocus(); 

    if (typeof uiFocusEl === "function") uiFocusEl(document.querySelector("#endScreen button")); 

  };

  if (trophy && typeof window.showTrophyLift === "function") { 

    const team = (teamNames && teamNames.blue) || (typeof selectedTeam !== "undefined" ? selectedTeam : ""); 

    window.showTrophyLift({ competition: trophy, team: team }, reveal); 

  } else { 

    reveal(); 

  }

} 



function endScreenContinue() { 

  const next = endScreenNext; 

  endScreenNext = null; 

  document.getElementById("endScreen").style.display = "none"; 

  if (next) next(); 

} 



function endGroupMatch(match, group) {
  if (match.team1 === selectedTeam) {
    match.score1 = blueScore;
    match.score2 = redScore;
  } else {
    match.score1 = redScore;
    match.score2 = blueScore;
  }
  match.played = true;
  const scoreLine = `${match.team1} ${match.score1} \u2014 ${match.score2} ${match.team2}`;
  const opponent = getOpponentTeamName(match);
  if (currentMode === "myclub") {
    if (group.cup === "cl") {
      finishMyClubCLMatch(match, group, scoreLine, opponent);
    } else if (group.cup === "cwc") {
      finishMyClubCLMatch(match, group, scoreLine, opponent);
    } else if (group.cup === "dom") {
      finishMyClubCupLegMatch(match, group, scoreLine, opponent);
    } else if (group.cup === "super") {
      finishMyClubSuperCupMatch(match, group, scoreLine, opponent);
    } else if (group.cup === "uefasuper") {
      finishMyClubUefaSuperCupMatch(match, group, scoreLine, opponent);
    } else {
      finishMyClubMatch(match, group, scoreLine, opponent);
    }
    return;
  }
  let resultText;
  if (blueScore > redScore) {
    awardWinCoins();
    const addOns = awardMatchAddOns();
    resultText = `${selectedTeam} beat ${opponent} ${blueScore}-${redScore}! ` + `+${formatMoney(CLUB_WIN_PRIZE + addOns)} prize`;
  } else if (blueScore < redScore) {
    const addOns = awardMatchAddOns();
    resultText = `${selectedTeam} lost to ${opponent} ${redScore}-${blueScore}.` + (addOns > 0 ? ` +${formatMoney(addOns)} prize` : "");
  } else {
    const addOns = awardMatchAddOns();
    resultText = `${selectedTeam} drew with ${opponent} ${blueScore}-${blueScore}.` + ` +${formatMoney(addOns)} prize`;
  }
  if (!groupStageComplete()) {
    showEndScreen(resultText, scoreLine, () => {
      preparePlayerMatch();
      showBracket();
    }, { blue: selectedTeam, red: getOpponentTeamName(match) });
    return;
  }
  const standings = computeGroupStandings(group);
  const ordered = standings.map(row => row.team);
  buildKnockoutBracket(ordered);
  const playerRank = standings.findIndex(row => row.team === selectedTeam) + 1;
  const stage = knockoutStageForRank(playerRank);
  if (stage === "eliminated") {
    eliminated = true;
    simulateRemainingKnockout();
    showEndScreen(
      `${resultText} ${selectedTeam} finished the league phase in ` +
        `${playerRank}${ordinalSuffix(playerRank)} place and did ` +
        `not qualify for the knockout rounds.` +
        (tournament.champion ? ` ${tournament.champion} went on to win the UEFA Champions League!` : ""),
      scoreLine,
      () => { showBracket(); },
      { blue: selectedTeam, red: getOpponentTeamName(match) }
    );
    return;
  }
  tournament.stage = stage;
  const stageLabel = stage === "roundOf16"
    ? "the Round of 16"
    : "the knockout play-off (teams 9th-24th)";
  showEndScreen(`${resultText} ${selectedTeam} finished ${playerRank}${ordinalSuffix(playerRank)} and qualified for ${stageLabel}!`,
    scoreLine, () => {
      preparePlayerMatch();
      showBracket();
    }, { blue: selectedTeam, red: getOpponentTeamName(match) });
}function endKnockoutMatch(match) { 

  if (match && match.clKnockout) { endKnockoutLeg(match); return; } 

  const playerWon = blueScore > redScore; 

 

  const wonOnPenalties =

    blueScore === redScore &&

    penaltyWinner === "blue"; 

 

  const finalWin = playerWon || wonOnPenalties;
  if (finalWin && tournament.final.includes(match)) {
    const sx = Math.max(field.x + 24, Math.min(field.x + field.width - 24, ball.x));
    const sy = Math.max(field.y + 24, Math.min(field.y + field.height - 24, ball.y));
    createInvasion("final", sx, sy);
  } 

  const opponent = getOpponentTeam(); 

if (finalWin) awardWinCoins(); 

  const addOns = awardMatchAddOns(); 



  match.score1 = match.team1 === selectedTeam

    ? blueScore 

    : redScore; 

 

  match.score2 = match.team2 === selectedTeam 

    ? blueScore 

    : redScore; 

 

match.winner = finalWin ? selectedTeam : opponent; 

  match.played = true; 



  const scoreLine = 

    `${match.team1} ${match.score1} — ${match.score2} ${match.team2}`; 



  if (!finalWin) { 

    eliminated = true; 

    const champion = simulateRemainingKnockout(match); 

    showEndScreen( 

      `${selectedTeam} was eliminated by ${opponent}. ` + 

        (addOns > 0 ? `+${formatMoney(addOns)} prize scored along the way. ` : "") + 

        (champion 

          ? `${champion} went on to win the UEFA Champions League!` 

          : `The tournament continued without you.`), 

      scoreLine, 

      () => { showBracket(); }, 

      { blue: selectedTeam, red: opponent } 

    ); 

    return; 

  } 



  const tournamentComplete = advanceKnockout(match); 



  if (tournamentComplete) { 

    showEndScreen( 

      `Congratulations! ${selectedTeam} won the UEFA Champions League! ` + 

        `+${formatMoney(CLUB_WIN_PRIZE + addOns)} prize`, 

      scoreLine, 

      () => { showBracket(); }, 

      { blue: selectedTeam, red: opponent } 

    ); 

    return; 

  } 



  showEndScreen(`${selectedTeam} won and advances to the next round! ` + 

    `+${formatMoney(CLUB_WIN_PRIZE + addOns)} prize`, 

    scoreLine, () => { 

      preparePlayerMatch(); 

      showBracket(); 

    }, { blue: selectedTeam, red: opponent }); 

}

 

function myClubSyncKnockout(updateStage) {
  if (currentMode !== "myclub") return;
  const mc = getMyClubCareer(myClubLeague);
  if (!mc || !mc.cl) return;
  mc.cl.knockout = tournament.knockout || [];
  if (updateStage && tournament.stage && mc.cl.active) mc.cl.stage = tournament.stage;
  saveMyClubData();
}

function endKnockoutLeg(match) {
  const playerWon = blueScore > redScore;
  const wonOnPenalties = blueScore === redScore && penaltyWinner === "blue";
  const finalWin = playerWon || wonOnPenalties;
  const opponent = getOpponentTeam();
  const tie = findKnockoutTie(match.roundKey, match.tieIndex);
  if (!tie) {
    if (window.console && console.error) console.error("endKnockoutLeg: no tie for", match && match.roundKey, match && match.tieIndex);
    showFullTimeFallback(match);
    return;
  }
  const round = (tournament.knockout || []).find(r => r.key === match.roundKey);
  const a = tieTeamA(tie), b = tieTeamB(tie);

  if (finalWin) awardWinCoins();
  const addOns = awardMatchAddOns();

  if (match.team1 === selectedTeam) { match.score1 = blueScore; match.score2 = redScore; }
  else { match.score1 = redScore; match.score2 = blueScore; }
  if (blueScore === redScore) {
    match.winner = wonOnPenalties ? selectedTeam : (penaltyWinner === "red" ? opponent : null);
  } else {
    match.winner = playerWon ? selectedTeam : opponent;
  }
  // Keep the shootout scoreline on the leg so the bracket and results screens
  // can show it, exactly like a simulated tie does.
  if (penaltyWinner && penaltyScore) {
    if (match.team1 === selectedTeam) { match.pens1 = penaltyScore.blue; match.pens2 = penaltyScore.red; }
    else { match.pens1 = penaltyScore.red; match.pens2 = penaltyScore.blue; }
    match.decidedBy = "penalties";
  }
  match.played = true;
  if (currentMode === "myclub") {
    const mcareer = getMyClubCareer(myClubLeague);
    if (mcareer && myClubCreditAiSquadMatch(match, "cl", mcareer)) saveMyClubData();
  }

  const scoreLine = `${match.team1} ${match.score1} \u2014 ${match.score2} ${match.team2}` +
    (match.decidedBy === "penalties" ? ` (${match.pens1}-${match.pens2} on penalties)` : "");

  const agg = legTotals(tie);
  const pensTxt = match.decidedBy === "penalties" ? `, ${match.pens1}-${match.pens2} on penalties` : "";
  const aggLine = `${a} ${agg.a} \u2014 ${agg.b} ${b} on aggregate${pensTxt}`;
  const prizeTxt = (addOns > 0 ? ` +${formatMoney(addOns)} prize` : "");

  if (tie.legs.some(l => !l.played)) {
    myClubSyncKnockout(false);
    const verb = wonOnPenalties || playerWon ? "won" : (blueScore === redScore ? "drew" : "lost");
    showEndScreen(`${selectedTeam} ${verb} the first leg ${match.score1}-${match.score2}. ${aggLine}. One leg to play.${prizeTxt}`,
      scoreLine, () => {
        preparePlayerMatch();
        if (currentMode === "myclub") openMyClubLobby(); else showBracket();
      }, { blue: selectedTeam, red: opponent });
    return;
  }

  resolveTie(tie);
  const isFinal = match.roundKey === "final";

  if (isFinal) {
    const champion = tie.winner;
    tournament.champion = champion;
    tournament.stage = "final";
    if (finalWin) {
      const sx = Math.max(field.x + 24, Math.min(field.x + field.width - 24, ball.x));
      const sy = Math.max(field.y + 24, Math.min(field.y + field.height - 24, ball.y));
      createInvasion("final", sx, sy);
    }
    if (currentMode === "myclub") {
      const mc = getMyClubCareer(myClubLeague);
      if (mc) {
        const isCwc = mc.cl && mc.cl.comp === "cwc";
        const prize = isCwc ? MYCLUB_CWC_PRIZE : MYCLUB_TITLE_PRIZE;
        const trophyType = isCwc ? "cwc" : "champions";
        mc.cl.active = false;
        mc.cl.stage = "champion";
        mc.cl.champion = champion;
        mc.cl.knockout = tournament.knockout;
        if (champion === selectedTeam) {
        mc.trophies = (mc.trophies || 0) + 1;
        myClubAwardTrophy(mc, trophyType, { competition: myClubEuroName(mc) });
        playerCoins += prize;
        mc.coins = playerCoins;
        saveClubState();
      }
      saveMyClubData();
      myClubSettleIndividualAwards(mc, "cl");
      const txt = champion === selectedTeam
          ? `Congratulations! ${selectedTeam} won the ${myClubEuroName(mc)}! +${formatMoney(prize)} title bonus.`
          : `${selectedTeam} lost the final to ${champion}.`;
        showEndScreen(`${txt} +${formatMoney(CLUB_WIN_PRIZE + addOns)} prize`, scoreLine, () => {
          myClubEuroPhaseEnd(mc);
        }, { blue: selectedTeam, red: opponent }, champion === selectedTeam ? myClubEuroName(mc) : null);
        return;
      }
    }
    showEndScreen(
      champion === selectedTeam
        ? `Congratulations! ${selectedTeam} won the UEFA Champions League! +${formatMoney(CLUB_WIN_PRIZE + addOns)} prize`
        : `${selectedTeam} lost the final to ${champion}. ${champion} lifted the trophy.`,
      scoreLine, () => { showBracket(); }, { blue: selectedTeam, red: opponent }, champion === selectedTeam ? "Champions League" : null);
    return;
  }

  if (tie.winner !== selectedTeam) {
    if (currentMode === "myclub") {
      const mc = getMyClubCareer(myClubLeague);
      if (mc) {
        mc.cl.active = false;
        mc.cl.stage = "eliminated";
        mc.cl.knockout = tournament.knockout;
        saveMyClubData();
        myClubSettleIndividualAwards(mc, "cl");
        showEndScreen(`${selectedTeam} was eliminated from the ${myClubEuroName(mc)} in the ${round ? round.title : match.roundKey}. ${aggLine}.`,
          scoreLine, () => {
            myClubEuroPhaseEnd(mc);
          }, { blue: selectedTeam, red: opponent });
        return;
      }
    }
    eliminated = true;
    const champion = simulateRemainingKnockout();
    showEndScreen(
      `${selectedTeam} was eliminated in the ${round ? round.title : match.roundKey} by ${opponent}. ${aggLine}. ` +
        (champion ? `${champion} went on to win the UEFA Champions League!` : `The tournament continued without you.`),
      scoreLine, () => { showBracket(); }, { blue: selectedTeam, red: opponent });
    return;
  }

  advanceKnockout(match);
  myClubSyncKnockout(true);
  const nextRound = (tournament.knockout || []).find(r => r.key === tournament.stage);
  showEndScreen(`${selectedTeam} won the tie (${aggLine}) and advanced to the ${nextRound ? nextRound.title : "next round"}! +${formatMoney(CLUB_WIN_PRIZE + addOns)} prize`,
    scoreLine, () => {
      preparePlayerMatch();
      if (currentMode === "myclub") openMyClubLobby(); else showBracket();
    }, { blue: selectedTeam, red: opponent });
}

// Last-resort end screen. If the played fixture cannot be re-identified, or a
// finish handler throws, the match still has to hand control back to the UI
// instead of freezing on the pitch with the players stood still. Everything
// here is defensive so a fallback can never throw itself.
function showFullTimeFallback(match) {
  let opponent = "the opposition";
  try { if (match) opponent = getOpponentTeamName(match); } catch (e) {}
  const scoreLine = match
    ? `${match.team1} ${match.score1 != null ? match.score1 : blueScore} \u2014 ${match.score2 != null ? match.score2 : redScore} ${match.team2}`
    : `${selectedTeam} ${blueScore} \u2014 ${redScore}`;
  const next = () => {
    try { preparePlayerMatch(); } catch (e) {}
    if (currentMode === "myclub") { try { openMyClubLobby(); } catch (e) {} }
    else { try { showBracket(); } catch (e) {} }
  };
  try {
    showEndScreen(`Full time: ${selectedTeam} ${blueScore}-${redScore} ${opponent}.`, scoreLine, next, { blue: selectedTeam, red: opponent });
  } catch (e) {}
}

function endMatch() {

  if (!matchRunning && matchPhase !== "sudden" && matchPhase !== "penalties") return; 

 

  matchRunning = false;
  clearInterval(timerInterval);
  settleSponsorTasks();

  crowdEvent("fulltime");

  if (blueScore > redScore) crowdEvent("result", "win");
  else if (blueScore < redScore) crowdEvent("result", "lose");
  else crowdEvent("result", "draw");

  if (currentMode === "worldcup") { wcEndMatch(); return; }

  if (currentMode === "custom") { ctEndMatch(); return; }
  if (currentMode === "playercareer") { pcEndMatch(); return; }
  if (currentMode === "managercareer") { mcEndMatch(); return; }

  if (pvpContext) { 

    endPvpMatch(); 

    return; 

  } 

  if (friendlyContext) { 

    endFriendlyMatch(); 

    return; 

  } 

  const match = findPlayerMatch(); 

 

  if (!match) { 
    if (currentMode === "myclub" || currentMode === "champions") showFullTimeFallback(null); 
    return; 
  } 

 

  const group = getPlayerGroup(); 

 

const groupFor = (() => { 
    if (currentMode === "myclub") { 
      for (const g of (tournament.groups || [])) { 
        if (g.matches && g.matches.indexOf(match) !== -1) return g; 
      } 
    } 
    return group; 
  })(); 
  try {
    if (groupFor && groupFor.matches.includes(match)) {
      endGroupMatch(match, groupFor);
      return;
    }
    endKnockoutMatch(match);
  } catch (err) {
    if (window.console && console.error) console.error("End-of-match handler failed:", err);
    const endEl = document.getElementById("endScreen");
    const alreadyShown = endEl && endEl.style.display === "flex";
    if (!alreadyShown && (currentMode === "myclub" || currentMode === "champions")) showFullTimeFallback(match);
  }

} 

 

function teamLink(name) { 

  return `<span class="teamLink" onclick="showRosterModal('${name}')">${name}</span>`; 

} 

 

function makeRosterPlayerHTML(playerData, role, label) { 

  const overall = calculateOverall(playerData, role); 

  const name = playerData.name || label; 

 

  return ` 

    <div class="rosterPlayer"> 

      <div class="rosterPlayerHeader"> 

        <span class="rosterOverall">${overall}</span> 

        <span class="rosterName">${name}</span> 

        <span class="rosterRole">${label}</span> 

      </div> 

      <div class="rosterStats"> 

        PAC ${playerData.pace} · SHO ${playerData.shooting} · 

        PAS ${playerData.passing} · DRI ${playerData.dribbling} · 

        DEF ${playerData.defending} · PHY ${playerData.physical} 

      </div> 

    </div> 

  `; 

} 

 

function showRosterModal(teamName) { 

  const roster = TEAM_ROSTERS[teamName]; 

  if (!roster) return; 

 

  let html = ""; 

 

  html += makeRosterPlayerHTML(roster.goalkeeper, "goalkeeper", "GK"); 

 

  for (const p of roster.defenders) { 

    html += makeRosterPlayerHTML(p, "defender", "DEF"); 

  } 

 

  for (const p of roster.midfielders) { 

    html += makeRosterPlayerHTML(p, "midfielder", "MID"); 

  } 

 

  for (const p of roster.attackers) { 

    html += makeRosterPlayerHTML(p, "attacker", "ATT"); 

  } 

  // Match-day bench and reserves, shown under their own headings so a team's
  // full depth is visible from the roster view.
  const bench = Array.isArray(roster.bench) ? roster.bench : [];
  const reserves = Array.isArray(roster.reserves) ? roster.reserves : [];
  const roleLabel = role => role === "goalkeeper" ? "GK" : role === "defender" ? "DEF" : role === "midfielder" ? "MID" : "ATT";
  if (bench.length) {
    html += '<div class="rosterSectionHead">Bench</div>';
    for (const p of bench) html += makeRosterPlayerHTML(p, p.role || "midfielder", roleLabel(p.role));
  }
  if (reserves.length) {
    html += '<div class="rosterSectionHead">Reserves</div>';
    for (const p of reserves) html += makeRosterPlayerHTML(p, p.role || "midfielder", roleLabel(p.role));
  }

  const rank = FIFA_RANKINGS[teamName];

  document.getElementById("rosterTeamName").textContent = rank

    ? `${teamName} — Rank #${rank}`

    : teamName; 

  document.getElementById("rosterList").innerHTML = html; 

  document.getElementById("rosterModal").style.display = "flex"; 

} 

 

function closeRosterModal() {

  document.getElementById("rosterModal").style.display = "none";

}

function showRankings() {

  const ordered = Object.entries(FIFA_RANKINGS)

    .sort((a, b) => a[1] - b[1]);



  let html = "";



  for (const [team, rank] of ordered) {

    const color = teamColors[team] || "#888";

    const strength = Math.round(getTeamStrength(team));

    const buffPct = Math.round((getTeamBuff(team) - 1) * 100);

    const darkHorse = isDarkHorse(team);

    const darkHorseTag = darkHorse ? ' <span class="darkHorseTag">DARK HORSE +10%</span>' : "";



    html += `

      <div class="rankingRow">

        <span class="rankingPos">${rank}</span>

        <span class="rankingColor" style="background:${color}"></span>

        <span class="rankingName">${teamLink(team)}${darkHorseTag}</span>

        <span class="rankingStrength">OVR ${strength} +${buffPct}%</span>

      </div>

    `;

  }



  document.getElementById("rankingList").innerHTML = html;

  document.getElementById("rankingsModal").style.display = "flex";

}

function closeRankings() {

  document.getElementById("rankingsModal").style.display = "none";

}

 

function makeRoundHTML(title, matches) { 

  let html = `<div class="round"><h3>${title}</h3>`; 

 

  for (const match of matches) { 

    const team1Class = 

      match.winner === match.team1 ? "winner" : ""; 

 

    const team2Class = 

      match.winner === match.team2 ? "winner" : ""; 

 

    html += ` 

      <div class="match"> 

        <span class="${team1Class}"> 

          ${teamLink(match.team1)} ${match.score1 ?? "-"} 

        </span> 

        <br> 

        <span class="${team2Class}"> 

          ${teamLink(match.team2)} ${match.score2 ?? "-"} 

        </span> 

        <br> 

        <small> 

          Winner: ${match.winner ? teamLink(match.winner) : "TBD"} 

        </small> 

      </div> 

    `; 

  } 

 

  html += "</div>"; 

  return html; 

} 

 

function makeGroupHTML(group) { 

  const standings = computeGroupStandings(group); 

  const r16Cutoff = 8; 
  const playoffCutoff = 24; 
  const md = currentMatchday() || 0; 

 

  let rows = ""; 

 

  for (let i = 0; i < standings.length; i++) { 

    const row = standings[i]; 

    const isPlayer = row.team === selectedTeam; 

    const isDirect = i < r16Cutoff; 
    const isPlayoff = !isDirect && i < playoffCutoff; 
    const isCutoff = i === r16Cutoff - 1 || i === playoffCutoff - 1; 

    const tbodyClass = isPlayer 

      ? "playerRow" 

      : (isDirect ? "qualRow" : (isPlayoff ? "playoffRow" : "outRow")); 

    const rankCell = isCutoff 

      ? `<td class="rank cutoffRank">${i + 1}</td>` 

      : `<td class="rank">${i + 1}</td>`; 

    const color = teamColors[row.team] || "#667788"; 

 

    rows += ` 

      <tr class="${tbodyClass}${isCutoff ? " cutoffRow" : ""}"> 

        ${rankCell} 

        <td class="team"><span class="clubDot" style="background:${color}"></span>${teamLink(row.team)}</td> 

        <td>${row.played}</td> 

        <td>${row.w}</td> 

        <td>${row.d}</td> 

        <td>${row.l}</td> 

        <td>${row.gf}</td> 

        <td>${row.ga}</td> 

        <td class="gd">${row.gd > 0 ? "+" + row.gd : row.gd}</td> 

        <td class="pts"><b>${row.points}</b></td> 

        <td class="qual">${i === r16Cutoff - 1 ? "▲" : (isDirect ? "✓" : (isPlayoff ? "◆" : ""))}</td> 

      </tr> 

    `; 

  } 

 

  return ` 

  <div class="round leagueTableWrap"> 

    <h3>League Phase <span class="matchdayLabel">${md > 0 ? `Matchday ${md} of 8` : ""}</span></h3> 

    <div class="match tableCard"> 

      <table class="leagueTable"> 

        <thead> 

          <tr><th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th><th></th></tr> 

        </thead> 

        <tbody>${rows}</tbody> 

      </table> 

      <div class="tableLegend"> 

        <span><i style="background:#3f8cff"></i> Round of 16 (top 8)</span> 

        <span><i style="background:#f0b429"></i> Knockout play-off (9th-24th)</span> 

        <span><i style="background:#b7c2cc"></i> Eliminated (25th+)</span> 

        <span><i style="background:#62e36b"></i> Your club</span> 

      </div> 

    </div> 

  </div> 

  `; 

}

 

function hideBracket() {
  const el = document.getElementById("bracketScreen");
  if (el) el.style.display = "none";
  enterScreen("gameScreen", "block");
  if (pausedForBracket && matchTime > 0 && matchPhase !== "penalties" && !eliminated) {
    pausedForBracket = false;
    matchRunning = true;
    startTimer();
  } else {
    pausedForBracket = false;
  }
}

function showBracket() {
  if (currentMode === "worldcup") { wcShowHub(); return; }
  if (currentMode === "custom") { ctShowHub(); return; }
  if (currentMode === "playercareer") { pcShowHub(); return; }
  if (currentMode === "managercareer") { mcShowHub(); return; }
  document.getElementById("gameScreen").style.display = "none";
  enterScreen("bracketScreen", "block");
  if (matchRunning) {
    matchRunning = false;
    pausedForBracket = true;
    clearInterval(timerInterval);
  }
  if (currentMode === "myclub") {
    const league = getMyClubLeague(myClubLeague);
    const h1 = document.querySelector("#bracketScreen h1");
    if (h1) h1.textContent = (league ? league.name : "League") + " Standings";
    const mktBtn = document.getElementById("bracketMarketBtn");
    if (mktBtn) mktBtn.style.display = "none";
  } else {
    const mktBtn = document.getElementById("bracketMarketBtn");
    if (mktBtn) mktBtn.style.display = "";
  }
  let html = "";
  if (currentMode === "champions") {
    html += '<div style="margin:0 0 14px"><button class="wcGhostBtn" onclick="baseSquadOpen()">Squad &amp; Formation</button></div>';
  }
  const playerGroup = getPlayerGroup();
  if (playerGroup) {
    html += makeGroupHTML(playerGroup);
  }
  if (tournament.knockout && tournament.knockout.length) {
    html += makeKnockoutBracketHTML();
  }
  if (tournament.champion) {
    html += "<h2>\u{1F3C6} Champion: " + tournament.champion + "</h2>";
  }
  document.getElementById("bracket").innerHTML = html;
  const restartButton = document.getElementById("restartButton");
  if (restartButton) {
    restartButton.style.display =
      (tournament.champion || eliminated) ? "inline-block" : "none";
  }
}function hideBracket() { 

  if (tournament.champion || eliminated) return; 

 

  document.getElementById("bracketScreen").style.display = "none"; 

  enterScreen("gameScreen", "block"); 

 

  if (pausedForBracket) { 

    pausedForBracket = false; 

    matchRunning = true; 

    startTimer(); 

  } else { 

    kickoffIntro = KICKOFF_INTRO_WAIT; 

    beginMatch(); 

  } 

} 

 

function openPauseMenu() {
  if (matchPaused) return;
  const pm = document.getElementById("pauseModal");
  if (!pm) return;
  if (matchPhase === "penalties") return;
  const esEl = document.getElementById("endScreen");
  if (esEl && esEl.style.display === "flex") return;
  const pEl = document.getElementById("penaltyScreen");
  if (pEl && pEl.style.display !== "none") return;
  if (!matchRunning) return;
  matchPaused = true;
  matchRunning = false;
  clearInterval(timerInterval);
  // Show the panel even if a tab's contents fail to build, so the match is
  // never left frozen behind an invisible pause menu.
  try { renderPauseMenu(); } catch (e) { }
  pm.style.display = "flex";
  try { setPauseTab(0); } catch (e) { }
}

function resumeFromPause() {
  if (!matchPaused) return;
  const pm = document.getElementById("pauseModal");
  if (pm) pm.style.display = "none";
  matchPaused = false;
  if (matchPhase !== "penalties" && !eliminated) {
    matchRunning = true;
    startTimer();
  }
}

function quitFromPause() {
  const pm = document.getElementById("pauseModal");
  if (pm) pm.style.display = "none";
  matchPaused = false;
  matchRunning = false;
  awaitingStart = false;
  kickoffIntro = 0;
  clearInterval(timerInterval);
  quitToMenu();
}

function renderPauseMenu() {
  const scoreEl = document.getElementById("pauseScoreLine");
  if (scoreEl) {
    scoreEl.innerHTML = myClubCrestCanvasHtml(selectedTeam, 30) +
      '<span class="pauseScoreTxt">' + escapeHtml(selectedTeam) + " " + blueScore + " - " + redScore + " " + escapeHtml(getOpponentTeam()) + "</span>" +
      myClubCrestCanvasHtml(getOpponentTeam(), 30);
    paintClubCrests();
  }
  const wrap = document.getElementById("pauseSubsWrap");
  if (!wrap) return;
  const msgEl = document.getElementById("pauseMsg");
  if (msgEl) msgEl.textContent = "";
  const isMyClub = currentMode === "myclub";
  if (!isMyClub && !baseSubsEnabled()) {
    wrap.innerHTML = '<div class="pauseNote">Substitutions are not available in this mode.</div>';
    return;
  }
  const subsLeft = Math.max(0, MAX_MATCH_SUBS - subsUsedThisMatch - pendingSubs.length);
  let html = "";
  if (isMyClub) {
    html += '<div class="pauseSubsHead">Formation</div>';
    const cMy = getMyClubCareer(myClubLeague);
    const curFm = (cMy && MY_CLUB_FORMATIONS[cMy.formation]) ? cMy.formation : "4-3-3";
    if (typeof netLockstepActive === "function" && netLockstepActive()) {
      html += '<div class="pauseNote">Formation locked in 1v1 Online.</div>';
    } else {
      html += '<div class="pauseFormRow">';
      for (const key of MY_CLUB_FORMATION_ORDER) {
        html += '<button class="' + (key === curFm ? "sel" : "") + '" onclick="performPauseFormation(\'' + key + '\')">' + key + '</button>';
      }
      html += '</div>';
    }
  }
  html += '<div class="pauseSubsHead">Substitutions</div>';
  html += '<div class="pauseSubsLeft">' + subsLeft + " left this match</div>";
  html += '<div class="pauseNote">A change is carried out the moment play next stops - after a free kick, a card, a throw in or a goal kick.</div>';
  if (pendingSubs.length) {
    const waiting = pendingSubs.map(q => escapeHtml(q.name)).join(", ");
    html += '<div class="pauseNote pausePending">Waiting to come on: ' + waiting + '</div>';
  }
  const roster = TEAM_ROSTERS[selectedTeam];
  const slotList = isMyClub ? myClubSlotList() : MARKET_SLOTS;
  const inLineup = isMyClub ? clubCardIdsInLineup() : new Set();
  const benchCards = isMyClub ? myClubBench() : baseBenchPlayers();
  const pendingBySlot = {};
  for (const q of pendingSubs) pendingBySlot[q.slotKey] = q;
  if (!benchCards.length) {
    html += '<div class="pauseNote">' + (isMyClub ? "No bench players. Pick up to 7 in Lineup." : "No available bench players.") + '</div>';
    wrap.innerHTML = html;
    return;
  }
  const pendingBench = new Set();
  for (const q of pendingSubs) {
    if (q.cid != null) pendingBench.add(String(q.cid));
    if (q.benchIndex != null) pendingBench.add("b" + q.benchIndex);
  }
  for (const s of slotList) {
    const rp = getSlotData(roster, s.key);
    const name = rp ? rp.name : "empty";
    const ovr = rp ? calculateOverall(rp, s.role) : 0;
    html += '<div class="pauseSubRow">';
    html += '<span class="pauseSlotName"><span class="pauseSlotLabel">' + escapeHtml(s.label) + '</span> ' + escapeHtml(name) + " (" + ovr + ")</span>";
    if (rp && rp.__redCarded) {
      html += '<span class="pausePending">SENT OFF - cannot be replaced</span>';
      html += '</div>';
      continue;
    }
    if (pendingBySlot[s.key]) {
      html += '<span class="pausePending">' + escapeHtml(pendingBySlot[s.key].name) + ' at next stoppage</span>';
      html += '</div>';
      continue;
    }
    const eligible = benchCards.filter(p => {
      if (cardIsSuspended(p) || cardIsInjured(p)) return false;
      if (isMyClub) return !inLineup.has(p.__cid) && !pendingBench.has(String(p.__cid));
      if (pendingBench.has("b" + p.__benchIndex)) return false;
      return p.role === s.role || p.tag === "SUPERSTAR";
    });
    html += '<select id="pauseSubSel_' + s.key + '">';
    html += '<option value="">-- pick a player --</option>';
    for (const p of eligible) {
      const val = isMyClub ? p.__cid : p.__benchIndex;
      html += '<option value="' + escapeHtml(String(val)) + '">' + escapeHtml(p.name) + " (" + calculateOverall(p, p.role || s.role) + " " + escapeHtml(p.role || "player") + ")</option>";
    }
    html += "</select>";
    html += '<button onclick="performPauseSub(\'' + s.key + '\')">Sub</button>';
    html += '</div>';
  }
  wrap.innerHTML = html;
}

function baseSquadEnsure() {
  let el = document.getElementById("baseSquadModal");
  if (el) return el;
  el = document.createElement("div");
  el.id = "baseSquadModal";
  el.style.cssText = "display:none;position:fixed;inset:0;z-index:9000;background:rgba(3,8,14,.86);align-items:center;justify-content:center;padding:16px;";
  el.innerHTML = '<div id="baseSquadCard" style="width:min(980px,96vw);max-height:92vh;overflow:auto;background:#0f1b27;border:1px solid #2b4a63;border-radius:14px;padding:18px;color:#eaf2fa;box-shadow:0 20px 70px rgba(0,0,0,.55);"></div>';
  document.body.appendChild(el);
  return el;
}

function baseSquadOpen() {
  try {
    if (currentMode === "worldcup" && typeof wcState !== "undefined" && wcState && wcState.selectedNation) selectedTeam = wcState.selectedNation;
  } catch (e) { }
  const el = baseSquadEnsure();
  el.style.display = "flex";
  baseSquadRender();
}

function baseSquadClose() {
  const el = document.getElementById("baseSquadModal");
  if (el) el.style.display = "none";
}

function baseSquadSetFormation(key) {
  if (setBaseFormation(key)) baseSquadRender();
}

function baseSquadSlotOptions(roster, role, slotKey) {
  const out = [];
  const add = function (arr, tag) {
    for (let i = 0; i < (arr || []).length; i++) {
      const p = arr[i];
      if (!p || !p.name || p.__redCarded || p.__subOff) continue;
      if (p.role !== role && p.tag !== "SUPERSTAR") continue;
      if (typeof cardIsSuspended === "function" && cardIsSuspended(p)) continue;
      if (typeof cardIsInjured === "function" && cardIsInjured(p)) continue;
      out.push({ tag: tag, idx: i, p: p });
    }
  };
  add(roster.bench, "b");
  add(roster.reserves, "r");
  return out;
}

function baseSquadSwap(slotKey) {
  const roster = TEAM_ROSTERS[selectedTeam];
  const slot = MARKET_SLOTS.find(s => s.key === slotKey);
  const sel = document.getElementById("baseSquadPick_" + slotKey);
  if (!roster || !slot || !sel || !sel.value) return;
  const current = getSlotData(roster, slotKey);
  if (!current || current.__redCarded) return;
  const parts = sel.value.split(":");
  const src = parts[0] === "r" ? roster.reserves : roster.bench;
  const idx = parseInt(parts[1], 10);
  const chosen = src && src[idx];
  if (!chosen) return;
  if (chosen.role !== slot.role && chosen.tag !== "SUPERSTAR") return;
  setSlotData(roster, slotKey, chosen);
  src[idx] = current;
  try { if (typeof wcState !== "undefined" && wcState && typeof wcSave === "function") wcSave(); } catch (e) { }
  baseSquadRender();
}

function baseSquadNews() {
  const items = [];
  try {
    if (typeof wcState !== "undefined" && wcState && Array.isArray(wcState.news)) items.push.apply(items, wcState.news);
    if (typeof tournament !== "undefined" && tournament && Array.isArray(tournament.news)) items.push.apply(items, tournament.news);
  } catch (e) { }
  if (!items.length) {
    let opp = "";
    try { opp = getOpponentTeam() || ""; } catch (e) { }
    items.push({ head: selectedTeam + " name a settled squad", body: "The manager keeps faith with the starting eleven ahead of the next fixture." });
    if (opp) items.push({ head: "Preview: " + selectedTeam + " vs " + opp, body: "Both camps trained this morning as the next matchday approaches." });
    items.push({ head: "Fitness update", body: "The medical staff report no fresh concerns within the tournament squad." });
  }
  return items.slice(0, 4).map(function (n) {
    return '<div style="padding:10px 0;border-bottom:1px solid #223b50"><b>' + escapeHtml(n.head || n.title || "Team news") + '</b><div style="color:#9fb6c9;font-size:13px;margin-top:3px">' + escapeHtml(n.body || n.text || "") + '</div></div>';
  }).join("");
}

function baseSquadRender() {
  const card = document.getElementById("baseSquadCard");
  const roster = TEAM_ROSTERS[selectedTeam];
  if (!card) return;
  if (!roster) { card.innerHTML = "<h2>Squad unavailable</h2>"; return; }
  const fm = baseFormation();
  let h = '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><h2 style="margin:0">' + escapeHtml(selectedTeam) + ' Squad</h2><button class="wcGhostBtn" onclick="baseSquadClose()">Close</button></div>';
  h += '<div style="margin-top:16px;color:#9fb6c9;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Formation</div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:7px">';
  for (const key of MY_CLUB_FORMATION_ORDER) {
    h += '<button class="' + (key === fm.key ? "sel" : "") + '" style="padding:7px 11px;border-radius:7px;border:1px solid ' + (key === fm.key ? "#48d38a" : "#2b4a63") + ';background:' + (key === fm.key ? "#123728" : "#132433") + ';color:#eaf2fa" onclick="baseSquadSetFormation(\'' + key + '\')">' + key + '</button>';
  }
  h += '</div>';
  h += '<div style="margin-top:7px;color:#7f97aa;font-size:12px">Formation sets the shape for the next match; players keep their natural squad roles.</div>';
  h += '<div style="margin-top:18px;color:#9fb6c9;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Starting XI</div>';
  for (const s of MARKET_SLOTS) {
    const p = getSlotData(roster, s.key);
    if (!p) continue;
    const opts = baseSquadSlotOptions(roster, s.role, s.key);
    h += '<div style="display:grid;grid-template-columns:82px 1fr 210px auto;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #1d3346">';
    h += '<span style="color:#7fd6a6;font-weight:700">' + escapeHtml(s.label) + '</span>';
    h += '<span>' + escapeHtml(p.name || "Empty") + ' <small style="color:#9fb6c9">(' + calculateOverall(p, s.role) + ' OVR)</small></span>';
    h += '<select id="baseSquadPick_' + s.key + '" style="background:#0b1722;color:#eaf2fa;border:1px solid #2b4a63;border-radius:6px;padding:5px"><option value="">-- swap with --</option>';
    for (const o of opts) h += '<option value="' + o.tag + ':' + o.idx + '">' + escapeHtml(o.p.name) + ' (' + calculateOverall(o.p, o.p.role || s.role) + ')</option>';
    h += '</select><button class="wcGhostBtn" onclick="baseSquadSwap(\'' + s.key + '\')">Swap</button></div>';
  }
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px">';
  h += '<div><div style="color:#9fb6c9;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Bench</div>' + (roster.bench || []).map(function (p) { return p && p.name ? '<div style="padding:5px 0;border-bottom:1px solid #1d3346">' + escapeHtml(p.name) + ' <small style="color:#9fb6c9">' + calculateOverall(p, p.role) + ' OVR &middot; ' + escapeHtml(p.role || "") + '</small></div>' : ""; }).join("") + '</div>';
  h += '<div><div style="color:#9fb6c9;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Reserves</div>' + (roster.reserves || []).map(function (p) { return p && p.name ? '<div style="padding:5px 0;border-bottom:1px solid #1d3346">' + escapeHtml(p.name) + ' <small style="color:#9fb6c9">' + calculateOverall(p, p.role) + ' OVR &middot; ' + escapeHtml(p.role || "") + '</small></div>' : ""; }).join("") + '</div>';
  h += '</div>';
  h += '<div style="margin-top:18px;color:#9fb6c9;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Tournament News</div><div>' + baseSquadNews() + '</div>';
  card.innerHTML = h;
}

// Base modes share the club's match-day bench on TEAM_ROSTERS. The bench index
// is kept on each player so the pause menu can queue a stable choice.
function baseBenchPlayers() {
  const r = TEAM_ROSTERS[selectedTeam];
  if (!r || !Array.isArray(r.bench)) return [];
  const out = [];
  for (let i = 0; i < r.bench.length; i++) {
    const p = r.bench[i];
    if (!p || p.__subOff) continue;
    p.__benchIndex = i;
    out.push(p);
  }
  return out;
}

// World Cup, Custom Tournament and Manager Career can use the same pause-menu
// substitution flow as My Club, drawing on the club's own bench.
function baseSubsEnabled() {
  return currentMode === "champions" || currentMode === "worldcup" || currentMode === "custom" || currentMode === "managercareer";
}

function clearBaseSubFlags() {
  const r = TEAM_ROSTERS[selectedTeam];
  if (!r) return;
  const slots = currentMode === "myclub" ? myClubSlotList() : MARKET_SLOTS;
  for (const s of slots) {
    const p = getSlotData(r, s.key);
    if (p) p.__redCarded = false;
  }
  if (currentMode === "myclub") return;
  for (const p of (r.bench || [])) if (p) p.__subOff = false;
  for (const p of (r.reserves || [])) if (p) p.__subOff = false;
}

function performPauseSub(slotKey) {
  const msgEl = document.getElementById("pauseMsg");
  const wrap = document.getElementById("pauseSubsWrap");
  if (typeof netLockstepActive === "function" && netLockstepActive()) {
    if (msgEl) msgEl.textContent = "Changes are locked in 1v1 Online to prevent a desync.";
    return;
  }
  const isMyClub = currentMode === "myclub";
  if (!isMyClub && !baseSubsEnabled()) {
    if (msgEl) msgEl.textContent = "Substitutions are not available in this mode.";
    return;
  }
  if (subsUsedThisMatch + pendingSubs.length >= MAX_MATCH_SUBS) {
    if (msgEl) msgEl.textContent = "No substitutions left this match.";
    return;
  }
  const sel = document.getElementById("pauseSubSel_" + slotKey);
  if (!sel || !sel.value) {
    if (msgEl) msgEl.textContent = "Pick a bench player first.";
    return;
  }
  const roster = TEAM_ROSTERS[selectedTeam];
  const slot = (isMyClub ? myClubSlotList() : MARKET_SLOTS).find(s => s.key === slotKey);
  const current = getSlotData(roster, slotKey);
  if (!slot || !current) {
    if (msgEl) msgEl.textContent = "Invalid slot.";
    return;
  }
  if (current.__redCarded) {
    if (msgEl) msgEl.textContent = current.name + " was sent off and cannot be replaced.";
    return;
  }
  if (isMyClub) {
    const chosen = ownedPool.find(p => p.__cid === sel.value);
    if (!chosen) {
      if (msgEl) msgEl.textContent = "That player is no longer available.";
      return;
    }
    if (myClubBenchCids().indexOf(chosen.__cid) === -1) {
      if (msgEl) msgEl.textContent = chosen.name + " is not on your match bench. Add them in the Lineup tab.";
      return;
    }
    if (cardIsSuspended(chosen)) {
      if (msgEl) msgEl.textContent = chosen.name + " is suspended for this match.";
      return;
    }
    if (cardIsInjured(chosen)) {
      if (msgEl) msgEl.textContent = chosen.name + " is injured and can't play.";
      return;
    }
    // Queue the change instead of making it now: it is carried out the moment
    // play next stops, just like a real substitution signalled from the bench.
    pendingSubs.push({ slotKey: slotKey, cid: chosen.__cid, name: chosen.name });
  } else {
    const bench = Array.isArray(roster.bench) ? roster.bench : [];
    const idx = parseInt(sel.value, 10);
    const chosen = bench[idx];
    if (!chosen || chosen.__subOff) {
      if (msgEl) msgEl.textContent = "That player is no longer available.";
      return;
    }
    if (chosen.role !== slot.role && chosen.tag !== "SUPERSTAR") {
      if (msgEl) msgEl.textContent = "Wrong position for this slot.";
      return;
    }
    if (cardIsSuspended(chosen)) {
      if (msgEl) msgEl.textContent = chosen.name + " is suspended for this match.";
      return;
    }
    if (cardIsInjured(chosen)) {
      if (msgEl) msgEl.textContent = chosen.name + " is injured and can't play.";
      return;
    }
    pendingSubs.push({ slotKey: slotKey, benchIndex: idx, name: chosen.name });
  }
  if (wrap) renderPauseMenu();
  if (msgEl) msgEl.textContent = pendingSubs[pendingSubs.length - 1].name + " will come on at the next stoppage (" + (MAX_MATCH_SUBS - subsUsedThisMatch - pendingSubs.length) + " left).";
}

// Carry out any substitution the player queued from the pause menu. Called by
// the match engine the moment play stops (a free kick, card, penalty, throw in,
// goal kick or corner). Only one is played at a time; any others wait for the
// next stoppage so their cutscenes never overlap.
function flushPendingSubs() {
  if (!pendingSubs.length) return;
  if (currentMode !== "myclub" && !baseSubsEnabled()) { pendingSubs = []; return; }
  const roster = TEAM_ROSTERS[selectedTeam];
  while (pendingSubs.length) {
    const q = pendingSubs.shift();
    if (currentMode === "myclub") {
      const slot = myClubSlotList().find(s => s.key === q.slotKey);
      const current = slot ? getSlotData(roster, q.slotKey) : null;
      const chosen = ownedPool.find(p => p.__cid === q.cid);
      if (!slot || !current || !chosen || current.__redCarded) continue;
      if (current.__cid === chosen.__cid) continue;
      if (myClubBenchCids().indexOf(chosen.__cid) === -1) continue;
      if (cardIsSuspended(chosen) || cardIsInjured(chosen)) continue;
      const err = doSwap(q.slotKey, q.cid);
      if (err) continue;
      refreshLiveSlot(q.slotKey);
      subsUsedThisMatch++;
      saveClubState();
      saveMyClubData();
      if (!launchSubstitutionCutscene(current, chosen)) showSubIndicator(current.name, chosen.name);
      break;
    }
    const slot = MARKET_SLOTS.find(s => s.key === q.slotKey);
    const bench = (roster && Array.isArray(roster.bench)) ? roster.bench : [];
    let chosen = (q.benchIndex != null) ? bench[q.benchIndex] : null;
    if (!chosen || chosen.__subOff || (q.name && chosen.name !== q.name)) {
      chosen = bench.find(p => p && !p.__subOff && p.name === q.name) || null;
    }
    const current = slot ? getSlotData(roster, q.slotKey) : null;
    if (!slot || !current || !chosen || chosen.__subOff || current.__redCarded) continue;
    if (cardIsSuspended(chosen) || cardIsInjured(chosen)) continue;
    if (chosen.role !== slot.role && chosen.tag !== "SUPERSTAR") continue;
    const idx = bench.indexOf(chosen);
    if (idx < 0) continue;
    const off = clonePlayer(current);
    off.role = cardNaturalRole(current) || slot.role;
    off.__subOff = true;
    bench[idx] = off;
    const on = clonePlayer(chosen);
    on.__subOff = false;
    setSlotData(roster, q.slotKey, on);
    refreshLiveSlot(q.slotKey);
    subsUsedThisMatch++;
    if (!launchSubstitutionCutscene(current, chosen)) showSubIndicator(current.name, chosen.name);
    break;
  }
  try { if (typeof renderPauseMenu === "function") renderPauseMenu(); } catch (e) { }
}

// A stable "shirt number" for a player, derived from the name so a card keeps the
// same number in every session (the game ships no number data).
function subShirtNo(name) {
  const s = String(name || "");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return 1 + ((h >>> 0) % 98);
}

// Play the Substitution cutscene for `off` -> `on`. Returns true if it launched.
function launchSubstitutionCutscene(off, on) {
  if (typeof PSMatch === "undefined" || !PSMatch || typeof PSMatch.playSubstitution !== "function") return false;
  if (matchPhase === "penalties" || eliminated) return false;
  let info = null;
  try { info = PSMatch.info(); } catch (e) { return false; }
  if (!info) return false;
  const st = String(info.state || "");
  if (st !== "play" && st !== "restart" && st !== "goal") return false;

  let minute = info.clockText;
  if (!minute) {
    const per = (info.matchLen || 180) / 90;
    minute = Math.max(1, Math.min(90, Math.round((info.clock || 0) / (per || 1)))) + "'";
  }
  if (typeof minute === "number") minute = minute + "'";
  if (String(minute).indexOf("'") === -1) minute = minute + "'";
  const numOf = (pl) => (pl && pl.num != null) ? pl.num : subShirtNo(pl && pl.name);
  const ovrOf = (pl) => { try { return calculateOverall(pl, (pl && pl.role) || "attacker"); } catch (e) { return 0; } };

  if (matchPaused) resumeFromPause();
  try {
    PSMatch.playSubstitution({
      home: info.teamNames ? info.teamNames[0] : selectedTeam,
      away: info.teamNames ? info.teamNames[1] : getOpponentTeam(),
      kitHome: info.teamKits ? info.teamKits[0] : "#2f6fe4",
      kitAway: info.teamKits ? info.teamKits[1] : "#d83a3a",
      score: info.score || [blueScore, redScore],
      minute: minute,
      off: { name: off.name, num: subShirtNo(off.name), tag: "#" + subShirtNo(off.name), lines: [off.role || "PLAYER", "OVR " + ovrOf(off), "COMES OFF"] },
      on: { name: on.name, num: subShirtNo(on.name), tag: "#" + subShirtNo(on.name), lines: [on.role || "PLAYER", "OVR " + ovrOf(on), "COMES ON"] }
    });
  } catch (e) { return false; }
  return true;
}

// Kickoff positions for a shape, matching the hardcoded default 4-3-3 exactly
// (defs x525 y300-1200, mids x975 y450-1050, atts x1425 y450-1050) so a
// default formation looks identical to before, but any other shape gets a
// sensible spread. Blue geometry; red is mirrored at the halfway line.
function liveFormationSpots(nd, nm, na) {
  const mk = (n, x) => {
    const out = [];
    for (let i = 0; i < n; i++) out.push({ x: x, y: 750 + (i - (n - 1) / 2) * 300 });
    return out;
  };
  return { defs: mk(nd, 525), mids: mk(nm, 975), atts: mk(na, 1425) };
}

function performPauseFormation(fm) {
  const msgEl = document.getElementById("pauseMsg");
  const wrap = document.getElementById("pauseSubsWrap");
  if (currentMode !== "myclub" || !MY_CLUB_FORMATIONS[fm]) {
    if (msgEl) msgEl.textContent = "Formation changes are My Club only.";
    return;
  }
  if (typeof netLockstepActive === "function" && netLockstepActive()) {
    if (msgEl) msgEl.textContent = "Changes are locked in 1v1 Online to prevent a desync.";
    return;
  }
  const f = MY_CLUB_FORMATIONS[fm];
  setMyClubFormation(fm);

  // Reposition the live blue outfield players into the new bands. Order the
  // current XI from own goal outward so the shape change reshuffles players
  // into sensible lines instead of teleporting them across the pitch.
  const outfield = allPlayers.filter(p => p.team === "blue" && p.role !== "goalkeeper" && p.role !== "referee" && !p.sentOff);
  const spots = liveFormationSpots(f.defs, f.mids, f.atts);
  const ordered = outfield.slice().sort((a, b) => (a.startX - b.startX) || (a.startY - b.startY));
  const bands = [];
  for (const s of spots.defs) bands.push({ role: "defender", spot: s });
  for (const s of spots.mids) bands.push({ role: "midfielder", spot: s });
  for (const s of spots.atts) bands.push({ role: "attacker", spot: s });
  ordered.forEach((p, i) => {
    const b = bands[i] || bands[bands.length - 1] || { role: p.role, spot: { x: p.startX, y: p.startY } };
    p.role = b.role;
    p.startX = b.spot.x;
    p.startY = b.spot.y;
    if (p.startY <= field.y || p.startY >= field.y + field.height) p.startY = 750;
  });

  if (wrap) renderPauseMenu();
  if (msgEl) msgEl.textContent = "Formation changed to " + fm + ". Your players move into the new shape as play continues.";
}

function refreshLiveSlot(slotKey) {
  const isMyClub = currentMode === "myclub";
  if (!isMyClub && !baseSubsEnabled()) return;
  const slot = (isMyClub ? myClubSlotList() : MARKET_SLOTS).find(s => s.key === slotKey);
  if (!slot) return;
  const rp = getSlotData(TEAM_ROSTERS[selectedTeam], slotKey);
  if (!rp) return;
  const live = slotLivePlayer(slotKey);
  if (!live) return;
  applyPlayerData(live, rp, slot.role);
  if (isMyClub) {
    const m = getActiveManager();
    if (m) {
      const v = managerBuffFor(m, slot.role);
      if (v) live[m.stat] = (typeof live[m.stat] === "number" ? live[m.stat] : 0) + v;
    }
    for (const b of playerBoostList(rp)) {
      if (b.stat === "all") {
        live.pace = (typeof live.pace === "number" ? live.pace : 0) + b.value;
        live.shooting = (typeof live.shooting === "number" ? live.shooting : 0) + b.value;
        live.passing = (typeof live.passing === "number" ? live.passing : 0) + b.value;
        live.dribbling = (typeof live.dribbling === "number" ? live.dribbling : 0) + b.value;
        live.defending = (typeof live.defending === "number" ? live.defending : 0) + b.value;
        live.physical = (typeof live.physical === "number" ? live.physical : 0) + b.value;
      } else {
        live[b.stat] = (typeof live[b.stat] === "number" ? live[b.stat] : 0) + b.value;
      }
    }
  } else {
    live.stamina = 1;
    live.tired = false;
  }
  live.overall = calculateOverall(live, slot.role);
  live.speed = computeSpeed(live.pace, live.physical);
  live.cards = 0;
  live.sentOff = false;
  live.offInjured = false;
  try { if (typeof PSMatch !== "undefined" && PSMatch && typeof PSMatch.refreshNames === "function") PSMatch.refreshNames(); } catch (e) { }
}

function restartTournament() {

  currentMode = "champions"; 

  selectedTeam = null; 

  eliminated = false;

selectedSponsor = null;
  refreshSponsorSection();
  updateSponsorUi();

  tournament.groups = [];

  tournament.knockout = []; 

  tournament.roundOf32 = []; 

  tournament.roundOf16 = []; 

  tournament.quarterfinals = []; 

  tournament.semifinals = []; 

  tournament.final = []; 

  tournament.champion = null; 

  tournament.stage = "league"; 

 

  document.querySelectorAll(".teamButton").forEach(b => { 

    b.classList.remove("selected"); 

  }); 

 

  document.getElementById("startButton").disabled = true; 

  const mm = document.getElementById("marketMenuButton");

  if (mm) mm.disabled = true; 

  document.getElementById("bracketScreen").style.display = "none"; 

  document.getElementById("gameScreen").style.display = "none"; 

document.getElementById("menu").style.display = ""; 

}

 

/* ------------------------------ 

   Soccer game 

------------------------------ */ 

 

/* ================= 3D perspective renderer ================= */

let CAM_BACK = 4;

const CAM_LOOKAHEAD = 900;

const CAM_HEIGHT = 560;

const CAM_FOCAL = 4200;

const FIG_SIZE = 1.7;

const LENS = 2.9;

const HORIZON_Y = 100; // where the far horizon sits - lower = more top-down

const VPR = W / 2; // vertical vanishing x (screen center)

// FIFA-style side camera (new default match view): the camera sits on the
// near touchline and looks across the pitch along the Y axis. World X
// (goal-line to goal-line) runs left/right on screen; world Y becomes depth,
// so far players ride toward the horizon and near touchline play grows big
// toward the bottom of the screen. The camera base stays fixed at the middle
// of the field (partially zoomed, neither goal fits on screen) and pivots
// toward the player whenever they play down the field.
const SIDE_FOCAL = 1000; // perspective strength - near touchline scale ~1
const SIDE_CAM_H = 1350; // camera height above the pitch plane
const SIDE_PAN = 1.6; // horizontal spread of the base view - larger = wider
const SIDE_ZOOM_MAX = 1.5; // uniform zoom multiplier about the vanishing point:
                            // 1.0 at the halfway line, rising to this when the
                            // player reaches the goal line - a real zoom-in,
                            // players and goal get bigger as you attack
const SIDE_MAXSCALE = 2.6; // cap near-object growth so players hugging the
                           // bottom touchline don't fill the whole screen
const SIDE_LOOKAHEAD = 180; // how far ahead of the player the camera leads
const SIDE_PIVOT_MAX = 1.2; // max pivot angle (radians ~69deg) toward the player
const SIDE_PIVOT_CAP = 0.8; // hard cap on the side camera's yaw (~46deg): even
                            // deep downfield it no longer swings to the full
                            // field-end angle once the player is far out
const GOAL_HEIGHT = 150; // goal frame height in world units
const GOAL_NET_DEPTH = 130; // how far the net box sits behind the goal line

let camX = player.x;

let camY = player.y;

let camSmoothX = camX;

let camSmoothY = camY;

// The side camera is anchored at the middle of the field but pivots (yaws)
// toward the player when they play down the field. camPivot is that smoothed
// turn angle; PIVOT_C/PIVOT_S are its cached trig values refreshed each frame.
let camPivot = 0;

// Uniform zoom multiplier of the side camera: 1.0 at the halfway line, smoothly
// rising toward SIDE_ZOOM_MAX as the player pushes downfield. Applied about the
// vanishing point, so it magnifies the whole frame instead of stretching it.
let camZoom = 1;

let PIVOT_C = 1;

let PIVOT_S = 0;

// The side camera's frame is laterally anchored at a world Y: points on that
// Y sit at the centre of the screen when looking straight down the pitch. It
// normally rides on the near touchline (yc 0), but set-piece close-ups pull
// it in to the kicker's Y so the ball, the wall and the goal land squarely
// on screen instead of skewing to one side.
let camLat0 = field.y + field.height;

let prevPlayerX = player.x;

let prevPlayerY = player.y;

// Camera modes: false = the new FIFA-style side 3D camera (default), true =
// the classic 2D top-down view. Press C during a match to switch between them.
let cam2d = true;

// Auto camera (render-only, never part of the lockstep simulation). "smart"
// leads the frame toward whoever is closest to the ball and widens when you
// are the one chasing; "cinematic" additionally drops into the 2D bird's-eye
// while the ball is stuck in your own third and you are not on it.
const AUTO_CAM_MODES = ["off", "smart", "cinematic"];
let camUserSet = false;
let autoCam2dTimer = 0;
let autoCam2dHold = 0;
let autoCamLastT = 0;

// --- Pixel Striker presentation -------------------------------------------
// A chunky pixel-art look modelled on the Pixel Striker FC reference: the
// match renders into a small backing store that the browser upscales, and the
// camera is locked to the top-down 2D view. Kept as a render concern only -
// the simulation, careers and online lockstep never read it.
//
// PIXEL_RENDER_SCALE is the floor for the backing store; the game loop instead
// picks the scale that lets the canvas be shown at a whole-number upscale
// (PIXEL_UPSCALE), so every source pixel becomes an identical square block
// rather than an uneven 2.8x/4.7x smear that reads as blur.
const PIXEL_RENDER_SCALE = 0.05;
const PIXEL_UPSCALE = 3;
// The pixel arcade top-down presentation is the only match view now, so this
// always reports true. Kept as a function because many call sites branch on it.
function pixelArtOn() {
  return true;
}

function autoCameraSetting() {
  return AUTO_CAM_MODES.indexOf(SETTINGS.autoCamera) !== -1 ? SETTINGS.autoCamera : "smart";
}

// Real-wall-clock length of one football half, in minutes. The match clock
// still counts football minutes (45'/90') but is driven fast or slow so a half
// takes this long to play out. Default 1.5 minutes keeps the old rhythm.
function halfLengthMinutes() {
  const v = (typeof SETTINGS !== "undefined" && SETTINGS.matchHalfMins) || 1.5;
  return Math.max(1, Math.min(30, v));
}

function applyHalfLength() {
  const sel = document.getElementById("halfLengthSelect");
  if (sel && isFinite(parseFloat(sel.value))) SETTINGS.matchHalfMins = parseFloat(sel.value);
  saveSettings();
}

function syncHalfLengthControl() {
  const sel = document.getElementById("halfLengthSelect");
  if (sel) sel.value = String(halfLengthMinutes());
}

function nearestPlayerToBall() {
  let best = null;
  let bd = Infinity;
  for (const p of allPlayers) {
    if (p.sentOff) continue;
    const dx = p.x - ball.x;
    const dy = p.y - ball.y;
    const d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}

// Auto-adaptive camera belonged to the old side-on 3D view. The arcade view is
// a fixed top-down camera, so there is nothing to tick here anymore.
function autoCameraTick(dt) {}

const SETTINGS_KEY = "uclSettings";

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { oldPlayers: false, adminMode: false, controls: "pc" };
    const s = JSON.parse(raw);
    return {
      oldPlayers: !!s.oldPlayers,
      adminMode: !!s.adminMode,
      adminPin: typeof s.adminPin === "string" ? s.adminPin : "",
      controls: (s.controls === "controller" || s.controls === "mobile") ? s.controls : "pc",
      bgColors: Array.isArray(s.bgColors) && s.bgColors.length === 3 ? s.bgColors : undefined,
      bgType: s.bgType,
      ballColor: typeof s.ballColor === "string" ? s.ballColor : undefined,
      ballPanel: typeof s.ballPanel === "string" ? s.ballPanel : undefined,
      jerseyColor: typeof s.jerseyColor === "string" ? s.jerseyColor : undefined,
      crowdAudio: s.crowdAudio !== false,
      crowdVolume: (typeof s.crowdVolume === "number") ? s.crowdVolume : 55,
      commentary: s.commentary !== false,
      difficulty: (s.difficulty === "easy" || s.difficulty === "hard") ? s.difficulty : "normal",
      autoCamera: (s.autoCamera === "off" || s.autoCamera === "smart" || s.autoCamera === "cinematic") ? s.autoCamera : "smart",
      pixelArt: typeof s.pixelArt === "boolean" ? s.pixelArt : undefined,
      matchHalfMins: (isFinite(s.matchHalfMins) && s.matchHalfMins >= 1 && s.matchHalfMins <= 30) ? s.matchHalfMins : 1.5,
      perfMode: !!s.perfMode
    };
  } catch (e) {
    return { oldPlayers: false, adminMode: false, controls: "pc" };
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(SETTINGS));
  } catch (e) {}

}

const SETTINGS = loadSettings();

if (typeof SETTINGS.autoDeleteLow !== "boolean") SETTINGS.autoDeleteLow = false;
if (typeof SETTINGS.autoDeleteOvr !== "number" || SETTINGS.autoDeleteOvr < 60) SETTINGS.autoDeleteOvr = 75;
if (!SETTINGS.controls) SETTINGS.controls = "pc";
if (typeof SETTINGS.adminPin !== "string") SETTINGS.adminPin = "";
if (!(SETTINGS.matchHalfMins >= 1 && SETTINGS.matchHalfMins <= 30)) SETTINGS.matchHalfMins = 1.5;
if (typeof SETTINGS.pixelArt !== "boolean") SETTINGS.pixelArt = true;
if (typeof SETTINGS.perfMode !== "boolean") SETTINGS.perfMode = false;

const BG_GRAD_DEFAULTS = ["#2a4276", "#6a4e7b", "#2a5176"];
const BG_GRAD_TYPES = ["solid", "2", "3"];
const DEFAULT_BG_GRAD_TYPE = "3";

function mixHex(a, b, p) {
  const pa = a.replace("#", ""), pb = b.replace("#", "");
  const ch = (pa, pb, i) => {
    const n = Math.round(parseInt(pa.substr(i, 2), 16) * (1 - p) + parseInt(pb.substr(i, 2), 16) * p);
    return n.toString(16).padStart(2, "0");
  };
  return "#" + ch(pa, pb, 0) + ch(pa, pb, 2) + ch(pa, pb, 4);
}

function bgGradTypeSetting() {
  return BG_GRAD_TYPES.indexOf(SETTINGS.bgType) !== -1 ? SETTINGS.bgType : DEFAULT_BG_GRAD_TYPE;
}

function bgGradStops(colors, type) {
  if (type === "solid") {
    return [colors[0], colors[0], colors[0], colors[0], colors[0]];
  }
  if (type === "2") {
    return [
      colors[0],
      mixHex(colors[0], colors[2], 0.25),
      mixHex(colors[0], colors[2], 0.5),
      mixHex(colors[0], colors[2], 0.75),
      colors[2]
    ];
  }
  return [
    colors[0],
    mixHex(colors[0], colors[1], 0.5),
    colors[1],
    mixHex(colors[1], colors[2], 0.5),
    colors[2]
  ];
}

function applyBgGradientColors(colors, type) {
  const stops = bgGradStops(colors, type);
  const root = document.documentElement;
  for (let i = 0; i < stops.length; i++) {
    root.style.setProperty("--bgGrad" + (i + 1), stops[i]);
  }
}

function renderBgGradientPreview() {
  const colors = SETTINGS.bgColors || BG_GRAD_DEFAULTS;
  const stops = bgGradStops(colors, bgGradTypeSetting());
  const el = document.getElementById("bgGradPreview");
  if (el) el.style.background = "linear-gradient(135deg," + stops.join(",") + ")";
}

function toggleBgGradRows() {
  const type = bgGradTypeSetting();
  const row1 = document.getElementById("bgGradRow1");
  const row2 = document.getElementById("bgGradRow2");
  const row3 = document.getElementById("bgGradRow3");
  if (row1) row1.style.display = "flex";
  if (row2) row2.style.display = type === "3" ? "flex" : "none";
  if (row3) row3.style.display = type === "solid" ? "none" : "flex";
}

function liveBgGradient() {
  const colors = [
    document.getElementById("bgGradStart").value,
    document.getElementById("bgGradMid").value,
    document.getElementById("bgGradEnd").value
  ];
  SETTINGS.bgColors = colors;
  saveSettings();
  syncBgGradientControls();
}

function onBgGradTypeChange() {
  const typeEl = document.getElementById("bgGradType");
  if (typeEl) SETTINGS.bgType = typeEl.value;
  saveSettings();
  syncBgGradientControls();
}

function syncBgGradientControls() {
  const colors = SETTINGS.bgColors || BG_GRAD_DEFAULTS;
  const typeEl = document.getElementById("bgGradType");
  if (typeEl) typeEl.value = bgGradTypeSetting();
  const startEl = document.getElementById("bgGradStart");
  const midEl = document.getElementById("bgGradMid");
  const endEl = document.getElementById("bgGradEnd");
  if (startEl) startEl.value = colors[0];
  if (midEl) midEl.value = colors[1];
  if (endEl) endEl.value = colors[2];
  toggleBgGradRows();
  renderBgGradientPreview();
  if (SETTINGS.bgColors) applyBgGradientColors(colors, bgGradTypeSetting());
}

function resetBgGradient() {
  delete SETTINGS.bgColors;
  delete SETTINGS.bgType;
  saveSettings();
  const root = document.documentElement;
  for (let i = 1; i <= 5; i++) root.style.removeProperty("--bgGrad" + i);
  syncBgGradientControls();
}

const BALL_DEFAULT_COLOR = "#ffffff";
const BALL_DEFAULT_PANEL = "#111111";
const BALL_DEFAULT_JERSEY = "#168cff";

function ballColorSetting() {
  return typeof SETTINGS.ballColor === "string" && SETTINGS.ballColor ? SETTINGS.ballColor : BALL_DEFAULT_COLOR;
}
function ballPanelSetting() {
  return typeof SETTINGS.ballPanel === "string" && SETTINGS.ballPanel ? SETTINGS.ballPanel : BALL_DEFAULT_PANEL;
}
function jerseyColorSetting() {
  return typeof SETTINGS.jerseyColor === "string" && SETTINGS.jerseyColor ? SETTINGS.jerseyColor : "";
}

function syncBallJerseyControls() {
  const colorEl = document.getElementById("ballColorInput");
  const panelEl = document.getElementById("ballPanelInput");
  const jerseyEl = document.getElementById("jerseyColorInput");
  if (colorEl) colorEl.value = ballColorSetting();
  if (panelEl) panelEl.value = ballPanelSetting();
  if (jerseyEl) jerseyEl.value = jerseyColorSetting() || BALL_DEFAULT_JERSEY;
  renderBallJerseyPreview();
}

function renderBallJerseyPreview() {
  const host = document.getElementById("ballJerseyPreview");
  if (!host) return;
  let canvas = host.querySelector("canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.width = 46;
    canvas.height = 46;
    host.appendChild(canvas);
  }
  const g2 = canvas.getContext("2d");
  g2.clearRect(0, 0, 46, 46);
  const cx = 23, cy = 23, r = 18;
  const grad = g2.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
  const base = ballColorSetting();
  grad.addColorStop(0, mixHex(base, "#ffffff", 0.35));
  grad.addColorStop(0.6, base);
  grad.addColorStop(1, mixHex(base, "#000000", 0.3));
  g2.beginPath();
  g2.arc(cx, cy, r, 0, Math.PI * 2);
  g2.fillStyle = grad;
  g2.fill();
  g2.strokeStyle = ballPanelSetting();
  g2.lineWidth = 1.5;
  g2.stroke();
  const pp = r * 0.42;
  g2.beginPath();
  for (let i = 0; i < 5; i++) {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const x = cx - r * 0.15 + Math.cos(ang) * pp;
    const y = cy - r * 0.1 + Math.sin(ang) * pp;
    if (i === 0) g2.moveTo(x, y); else g2.lineTo(x, y);
  }
  g2.closePath();
  g2.fillStyle = ballPanelSetting();
  g2.fill();
}

function liveBallJerseySettings() {
  const colorEl = document.getElementById("ballColorInput");
  const panelEl = document.getElementById("ballPanelInput");
  const jerseyEl = document.getElementById("jerseyColorInput");
  const nextBall = colorEl ? colorEl.value : null;
  const nextPanel = panelEl ? panelEl.value : null;
  const nextJersey = jerseyEl ? jerseyEl.value : null;
  const ballChanged = nextBall && nextBall !== ballColorSetting();
  const panelChanged = nextPanel && nextPanel !== ballPanelSetting();
  const jerseyChanged = nextJersey && nextJersey !== jerseyColorSetting();
  if (ballChanged) SETTINGS.ballColor = nextBall;
  if (panelChanged) SETTINGS.ballPanel = nextPanel;
  if (jerseyChanged) {
    SETTINGS.jerseyColor = (nextJersey === BALL_DEFAULT_JERSEY) ? "" : nextJersey;
  }
  saveSettings();
  if (jerseyChanged && typeof applyTeamColors === "function") {
    try { applyTeamColors(); } catch (e) {}
  }
  if (ballChanged || panelChanged || jerseyChanged) renderBallJerseyPreview();
}

function resetBallJersey() {
  delete SETTINGS.ballColor;
  delete SETTINGS.ballPanel;
  delete SETTINGS.jerseyColor;
  saveSettings();
  syncBallJerseyControls();
  if (typeof applyTeamColors === "function") {
    try { applyTeamColors(); } catch (e) {}
  }
}

if (SETTINGS.bgColors) applyBgGradientColors(SETTINGS.bgColors, bgGradTypeSetting());

function fillMyClubSettings() {
  const c = myClubLeague ? getMyClubCareer(myClubLeague) : null;
  const section = document.getElementById("myClubSettingsSection");
  if (section) section.style.display = c ? "block" : "none";
  const resetBtn = document.getElementById("myClubResetBtn");
  const resetHint = document.getElementById("myClubResetHint");
  if (resetBtn) resetBtn.disabled = !c;
  if (resetHint) resetHint.textContent = c
    ? "Erases the \"" + c.clubName + "\" My Club save (squad, coins, managers, season progress)."
    : "No My Club club loaded.";
  const nameEl = document.getElementById("myClubSettingsName");
  const colorEl = document.getElementById("myClubSettingsColor");
  const fundsRow = document.getElementById("myClubFundsRow");
  const levelRow = document.getElementById("myClubLevelRow");
  if (c) {
    if (nameEl) nameEl.value = c.clubName;
    if (colorEl) colorEl.value = c.color || "#168cff";
    if (fundsRow) fundsRow.style.display = SETTINGS.adminMode ? "block" : "none";
    if (levelRow) levelRow.style.display = SETTINGS.adminMode ? "block" : "none";
  }
  myClubKitSyncInputs();
  const lettersEl = document.getElementById("myClubCrestLetters");
  if (lettersEl) lettersEl.value = c && typeof c.crestLetters === "string" ? c.crestLetters : "";
  myClubSettingsMsg("");
}

const UPDATE_LOG = [
  {
    version: "V1.57.1",
    tag: "Latest",
    title: "World Cup Squad Screen Fix",
    notes: [
      "The World Cup <b>Squad & Formation</b> screen now opens your selected nation correctly after loading a saved tournament.",
    ],
  },
  {
    version: "V1.57.0",
    tag: "",
    title: "Champions League & World Cup Team Hub",
    notes: [
      "Champions League and World Cup hubs now include a <b>Squad & Formation</b> screen with the starting XI, bench and reserves.",
      "Swap players into the lineup and choose from six formations before the next match.",
      "The team hub shows the latest <b>tournament news</b> alongside squad preparations.",
      "Goal times now show <b>stoppage time</b> correctly, including 45+1', 90+3' and extra-time minutes.",
      "Substitution cutscenes use the real match clock, and summary goals list the scorer's name.",
      "Players who are sent off can no longer be selected for a substitution from the pause menu.",
    ],
  },
  {
    version: "V1.56.0",
    tag: "",
    title: "Player Career Control & Bans",
    notes: [
      "Player Career matches now keep control on <b>your player only</b>; the cursor never switches to a teammate.",
      "A red card ends your match and the next fixture is served as a <b>one-match suspension</b>, simulated automatically.",
      "The career hub shows the ban and the Play button becomes <b>Serve Suspension (Simulate)</b>.",
    ],
  },
  {
    version: "V1.55.1",
    tag: "",
    title: "Selected Player Only",
    notes: [
      "Player names now appear only above the <b>player you are controlling</b>.",
      "Teammates and opponents stay unlabelled, so the pitch stays clear and your active player is easy to spot.",
    ],
  },
  {
    version: "V1.55.0",
    tag: "",
    title: "Every Player Named",
    notes: [
      "Every player on the pitch now has their <b>real name shown above them</b> - both teams, all 22 players.",
      "Your controlled player keeps the <b>gold label</b>, while teammates are green and opponents are red.",
    ],
  },
  {
    version: "V1.54.1",
    tag: "",
    title: "Real Player Name Label",
    notes: [
      "The on-pitch label now shows the <b>actual player you control</b> - Mbappé, Saliba, Saka - instead of the generic <b>YOU</b>.",
      "Goal scorers and match stat names use the same real player names.",
    ],
  },
  {
    version: "V1.54.0",
    tag: "",
    title: "Real-World Squads",
    notes: [
      "Club and international squads now use <b>current real-world XIs, benches and reserves</b> from the EA FC 26 ratings database and current Wikipedia squad lists.",
      "All <b>48 World Cup nations</b> and <b>238 club sides</b> have been refreshed, with every team keeping a full bench and reserve list.",
      "Squads reflect the <b>31 October 2026</b> snapshot.",
    ],
  },
  {
    version: "V1.53.1",
    tag: "",
    title: "Controlled Player Name",
    notes: [
      "The player you are controlling now has their <b>name shown above them</b> during a match.",
      "Other players stay unlabelled so the pitch stays clear and you can always spot your active player.",
    ],
  },
  {
    version: "V1.53.0",
    tag: "",
    title: "Tournament Substitutions",
    notes: [
      "In-match substitutions now work in <b>World Cup</b>, <b>Custom Tournament</b> and <b>Manager Career</b>.",
      "Pause the match, open <b>Team</b>, and pick a same-role player from the match-day bench for any starting slot.",
      "Changes are queued and carried out at the next stoppage with the full substitution cutscene, up to <b>five per match</b> - just like My Club.",
    ],
  },
  {
    version: "V1.52.0",
    tag: "",
    title: "New Pack Walkout",
    notes: [
      "The <b>My Club pack walkout</b> is now a full pixel-art cinematic: the player walks out of the tunnel, down the corridor, through the doorway and into the spotlight before the card lands.",
      "The reveal now runs <b>Nation &rarr; Card Type &rarr; Position &rarr; Club &rarr; Name</b>, then slides your card in - the card design itself is unchanged.",
      "Players without a club, such as <b>Icons</b>, are announced as <b>International</b>.",
    ],
  },
  {
    version: "V1.51.0",
    tag: "",
    title: "Team Editor",
    notes: [
      "The main menu has a new <b>Team Editor</b>: pick any club, edit every squad player's name, role, age and six attributes, or create <b>custom players</b> and place them anywhere in the squad.",
      "Edits are used by <b>Player Career</b> and <b>Manager Career</b> only - other modes keep their original squads. Custom players can be selected as your career pro or appear in your manager squad.",
      "Player Career now starts as a <b>Rising Prospect</b> (low stats, build your legend) or an <b>Existing Player</b> from the club's squad, including your custom players.",
      "Manager Career can start at <b>any club in the game</b>, including a new <b>European League</b> for the clubs outside the domestic divisions.",
    ],
  },
  {
    version: "V1.50.0",
    tag: "",
    title: "Home Grounds",
    notes: [
      "Every club now plays at <b>its own stadium</b>. Play <b>away</b> and you line up in front of the home side's colours; play at home and the ground is yours - bowls, stands, crowd, hoardings, sky and a <b>capacity tier</b> all drawn from the club.",
      "Grounds are <b>generated from the club name</b>, so each club gets a distinctive, consistent look and a proper-sounding name (<i>\u201c...Park\u201d</i>, <i>\u201cThe ... Arena\u201d</i>), and no two clubs share the same ground.",
      "In <b>My Club</b> you start at a run-down <b>Recreation Ground</b> and can buy your way up the catalogue - <b>County Park</b>, <b>Riverside City Stadium</b>, the two-tier <b>Grande Arena</b> and finally the <b>Vantage Elite Dome</b> - with club money. Bigger grounds seat more and look the part.",
    ],
  },
  {
    version: "V1.49.0",
    tag: "",
    title: "AI Substitutions",
    notes: [
      "The <b>opposing side</b> now manages its own bench. From around the hour mark it watches for a <b>tired</b> player and, at the next stoppage, brings on <b>fresh legs</b> in the same position - up to <b>three</b> changes a match.",
      "AI changes play out with the <b>full substitution cutscene</b>, showing who comes off and who comes on, just like your own subs.",
      "Named clubs draw their bench from the real squad list, so the players who come on are the ones on the teamsheet.",
    ],
  },
  {
    version: "V1.48.0",
    tag: "",
    title: "Scouting Trips",
    notes: [
      "Manager career scouting is now a proper <b>send-out loop</b>: pick a <b>country</b> and a trip length (<b>3</b>, <b>6</b> or <b>10 months</b>), pay the fee and send a scout away.",
      "While a scout is travelling the Scouting tab shows the mission, its return date and progress; longer trips reach further and come back with <b>more young prospects</b>.",
      "When a scout returns it files <b>youth prospects</b> - <b>Sign</b> one to your academy or <b>Pass</b>. Your academy is capped at 14, and academy players can be promoted to the first team or released.",
    ],
  },
  {
    version: "V1.47.0",
    tag: "",
    title: "Simulate Preview",
    notes: [
      "The <b>Simulate</b> buttons in both careers now open an <b>ADVANCE</b> strip first: today plus the next four days as day cards, with the match day highlighted in green and stamped with the opponent's badge.",
      "Nothing plays out until you press <b>Simulate Match</b> in the preview; <b>Back</b> returns to the hub with the fixture untouched.",
      "When your next match sits beyond the five-day window the preview names it underneath, so you always know what is coming.",
    ],
  },
  {
    version: "V1.46.0",
    tag: "",
    title: "Competition Viewer",
    notes: [
      "Both careers gained a <b>Competitions tab</b> - pick any competition in Vantage FC with the same arrow selector you use at career start, then view it in full.",
      "Your own league opens by default with a <b>live full table</b> (positions, records, goals and club ratings), plus your domestic cup run tie by tie.",
      "Step through England, Spain, Germany, Italy and France - every league runs on your career's current matchday, so standings, ratings, cups and European places all stay in step.",
      "A <b>World</b> pseudo-nation holds the rest: Champions League, Europa League, World Cup, Club World Cup, super cups and Custom Tournament - each with its format and where to play it.",
    ],
  },
  {
    version: "V1.45.0",
    tag: "",
    title: "Day by Day",
    notes: [
      "Career calendars now advance <b>one visible day at a time</b>. Continue runs a day ticker that ticks the date forward day by day and stops at your next match - with a Stop button whenever you like.",
      "A new <b>Next Day</b> button steps exactly one day for precise control.",
      "Works in both Player and Manager Career; world news and scouting still progress as the days pass.",
    ],
  },
  {
    version: "V1.44.0",
    tag: "",
    title: "Multiple Careers",
    notes: [
      "Player and Manager Career now keep <b>several saved careers</b>. Entering either mode shows a save picker: resume any career, start a new one, or delete one for good.",
      "Old single-career saves are converted automatically - nothing is lost. The career you played last is always at the top of the list.",
      "The player hub gained a <b>Career tab</b> and the manager's Admin tab lists every saved career, with one-click switching between them.",
      "All <b>136 lower-league clubs</b> across England, Spain, Germany and Italy now have full real squads - names, positions and ratings for every tier 2/3 side.",
    ],
  },
  {
    version: "V1.43.0",
    tag: "",
    title: "League Tiers",
    notes: [
      "Careers now feature <b>promotion and relegation</b> across multiple tiers per country (England 3, Italy 3, Spain/Germany/France 2).",
      "Leagues are reordered by tier in the selector and club pools, with realistic tier 2/3 squads generated on demand.",
      "At season end, the top/bottom of each division exchange places automatically and careers update to the new league.",
    ],
  },
  {
    version: "V1.42.0",
    tag: "",
    title: "Choose Your Club",
    notes: [
      "Career setup is rebuilt as a <b>three-step arrow selector</b>: browse nations, leagues and clubs with ‹ › buttons.",
      "The club panel shows a <b>shield crest in the club's colours</b>, big ATTACK / MIDFIELD / DEFENCE numbers, star rating and a TEAM counter.",
      "<b>CONFIRM CLUB</b> locks in your pick and updates the status line, like the classic team-select screens.",
      "League arrows are greyed out when a nation only has one league.",
    ],
  },
  {
    version: "V1.41.0",
    tag: "",
    title: "Arrow Browsing",
    notes: [
      "Club selection now works with <b>left and right arrows</b> - step through every club, country by country, alphabetically.",
      "A live <b>country panel</b> and <b>league panel</b> update as you browse, with flag colours and league badges.",
      "The centre stage shows the selected club's <b>crest, name, star rating</b> and <b>ATT / MID / DEF bars</b> from its real squad.",
      "Arrows wrap around at either end of the list, in both Player and Manager Career.",
    ],
  },
  {
    version: "V1.40.0",
    tag: "",
    title: "The FIFA 16 Selector",
    notes: [
      "Club selection is rebuilt like the FIFA 16 picker.",
      "Leagues appear as a scrollable strip of tiles with coloured league badges.",
      "Clubs are shown as crest tiles in a dense grid, tinted with each club's colours and listed alphabetically by country.",
      "Picking a club shows its <b>ATT / MID / DEF bars and overall rating</b> underneath, straight from the club's real squad.",
      "Custom Tournament's team grid uses the same crest tiles - clubs in their colours, nations with their flag colours.",
    ],
  },
  {
    version: "V1.39.1",
    tag: "",
    title: "Clubs In Order",
    notes: [
      "Every club picker is now <b>sorted by country, then alphabetically</b>.",
      "Custom Tournament's team grid lists clubs grouped by their league instead of mixing Champions League and league clubs together.",
      "Player and Manager Career setup show each country's clubs in alphabetical order.",
      "The My Club friendlies club dropdown is grouped by league with clubs in alphabetical order.",
    ],
  },
  {
    version: "V1.39.0",
    tag: "",
    title: "Careers Rebuilt",
    notes: [
      "<b>Player Career and Manager Career are back</b> after a cloud-sync failure wiped both files.",
      "Both careers were rebuilt from scratch: setup, a full 38-game league season with day-by-day calendar, cup run to the final, live and quick-sim matches, season summary, objectives and board confidence.",
      "Manager Career keeps its full toolbox - transfers, sell-on fees, academy promotions, scouting network, finances, board requests, roles and world news.",
      "Fixed the schedule so every club plays a complete home-and-away league season and your team is always in the cup draw.",
      "Simulating no longer stalls when a match day falls between your fixtures - the calendar always moves forward.",
    ],
  },
  {
    version: "V1.38.0",
    tag: "",
    title: "A Season In Days",
    notes: [
      "<b>Player and Manager careers now run on a real calendar</b>, day by day, just like the original My Club.",
      "Each season starts on August 1st and every fixture lands on its own date, running through to the final day in late May.",
      "A new <b>Advance Day</b> button moves your career forward one day at a time, and <b>Sim to Match</b> fast-forwards straight to your next fixture.",
      "The schedule tab is a full month-by-month calendar with your fixtures pinned to their dates, plus month navigation and a jump-to-today shortcut.",
      "Time now matters between matches: injuries heal day by day in Player Career, and your scouts file progress and reports day by day in Manager Career.",
    ],
  },
  {
    version: "V1.37.0",
    tag: "",
    title: "Strength In Depth",
    notes: [
      "<b>Every team now has a bench and a reserve squad</b>, not just a starting eleven.",
      "Squads are built with seven substitutes and seven reserves, rated around the rest of the team, and each club gets its own set of names.",
      "Open any team's roster to see the full depth - starters, bench and reserves listed together.",
      "When a player is suspended or sent off in a match, a same-position substitute steps in from the bench or reserves to cover the gap.",
      "Substitutes are now part of the transfer market and Manager Career squads, so signings and sales reflect the whole club.",
    ],
  },
  {
    version: "V1.36.0",
    tag: "",
    title: "Trophy Night, Rebuilt",
    notes: [
      "<b>Trophy celebrations are now a full-screen pixel cutscene</b>, rebuilt from scratch for the big moments.",
      "The new ceremony plays out like a real presentation: the wide stadium shot, medals handed out one by one, the captain collecting the trophy, the walk up the steps, the lift, team celebrations and fireworks.",
      "It scales to fill the whole screen at any size and stays crisp with pixel-perfect rendering.",
      "Every competition has its own trophy and colour scheme - World Cup, Champions League, Premier League, Bundesliga and more.",
      "Skip with Enter, Space or Escape, tap the pitch, or use the on-screen SKIP button.",
      "Fixed a bug where some career scouting reports failed to generate because the scouting helper was missing.",
    ],
  },
  {
    version: "V1.35.0",
    tag: "",
    title: "Career Back Pages Go Global",
    notes: [
      "<b>News goes worldwide in both careers</b>. Player and Manager career back pages now pull stories from the entire football world (other clubs and their players), not just your own.",
      "World stories appear after matches and around the start of a season, covering injuries, transfers, manager moves, upsets, milestones, awards, youth breakthroughs and takeover talk.",
      "Roster-based names (pulled straight from TEAM_ROSTERS) keep headlines authentic, like “Mbappe suffered a torn ACL during game against Villarreal”.",
      "Controller navigation and scroll position are now preserved when swapping career hub tabs - no more jumping back to the top after every button press.",
      "Small polish to the career screens’ focus handling means the gamepad highlight stays exactly where you left it.",
    ],
  },
  {
    version: "V1.34.35",
    tag: "",
    title: "Career UI Modernised",
    notes: [
      "<b>Player and Manager careers got a fresh coat of paint</b>, matching the My Club look: glass panels, pill-shaped tabs and soft shadows.",
      "Career screens now have a hero header with a gradient title and a subtle stadium-stripe texture.",
      "Tab buttons are rounded pills that light up in the mode colour, with a gentle sheen sweeping across the active tab.",
      "Stat cards, match cards, squad cards and transfer rows lift on hover and carry a coloured accent edge.",
      "Buttons, meter bars, chips and inputs were restyled to match, and panels slide in with a quick staggered animation.",
      "On small screens the tab strip scrolls sideways, and reduced-motion settings switch the animations off.",
    ],
  },
  {
    version: "V1.34.34",
    tag: "",
    title: "Career Realism, Part 2",
    notes: [
      "<b>Manager Career gains four new tabs</b>: News, Finances, Scouting and Roles.",
      "Board confidence, patience and media relations now sit at the top of the Board tab.",
      "The back pages react to results, signings, academy promotions, title wins and sackings.",
      "Scouting lets you file reports on transfer targets and build a shortlist.",
      "Assign a captain, vice-captain and set-piece takers, with an auto-pick option.",
      "Finances break down transfer budget, wage bill, revenue and expenses for the season.",
    ],
  },
  {
    version: "V1.34.33",
    tag: "",
    title: "Career Realism, Part 1",
    notes: [
      "<b>Player Career now has a tabbed hub</b>: News, Media, Relationships, Objectives, Transfers, Contract, Loans and Fitness have their own panels.",
      "Player and Manager careers gained richer saved data (personality, relationships, objectives, contracts, loans, finances, scouting) ready for the next stage.",
      "The back pages update as you play - goals, big performances and milestones make the news.",
      "Season objectives are set automatically and reward development points when you hit them.",
    ],
  },
  {
    version: "V1.34.32",
    tag: "",
    title: "My Club - Ranked Only",
    notes: [
      "<b>My Club is now ranked-only</b>: the season calendar, league, cup, Super Cup and European campaign have been removed. Everything starts on the PvP ladder.",
      "Ranked wins now award coins on top of ladder trophies, so the economy stays active.",
      "The UI has been tidied up to land straight onto Ranked with a one-tap Find Opponent.",
      "Quests and Achievements now reflect ranked play.",
    ],
  },
  {
    version: "V1.34.31",
    tag: "",
    title: "Home title fix",
    notes: [
      "<b>The \"Select Your Mode\" heading on the home screen was invisible</b> and is now shown again in its gradient style.",
    ],
  },
  {
    version: "V1.34.30",
    tag: "",
    title: "Home screen tidy-up",
    notes: [
      "<b>The Vantage FC brand on the home screen is bigger</b>, and the tagline under the title has been removed.",
    ],
  },
  {
    version: "V1.34.29",
    tag: "",
    title: "New home background",
    notes: [
      "<b>The home screen now has a moving pixel-art stadium behind it.</b> A looping mini-match plays out under floodlights with a swaying crowd, flares and fireworks - drawn live, so no two moments look the same.",
    ],
  },
  {
    version: "V1.34.28",
    tag: "",
    title: "No more ghost skips",
    notes: [
      "<b>Fixed cutscenes skipping on their own with a controller.</b> A worn trigger resting near the halfway point could flicker and read as a button press, skipping the walkout before you touched anything. A trigger now needs a real pull to register, so a slight drift stays quiet.",
    ],
  },
  {
    version: "V1.34.27",
    tag: "",
    title: "Switch players with LB",
    notes: [
      "<b>Switch players with the left bumper.</b> On a controller, LB now hands you the teammate closest to the ball instead of clicking the left stick down, and the on-pitch controls hint tells you so.",
    ],
  },
  {
    version: "V1.34.26",
    tag: "",
    title: "No more frozen full time",
    notes: [
      "<b>Fixed a match that could freeze at the final whistle.</b> If the end of a match could not be processed for any reason, the game used to be left stuck on the pitch with the players standing still and no full time screen. It now always brings up the result and returns you to the lobby.",
      "<b>Any end of match problem now shows in the browser console</b> so it can be reported instead of silently freezing the game.",
    ],
  },
  {
    version: "V1.34.25",
    tag: "",
    title: "Subs wait for a stoppage",
    notes: [
      "<b>Substitutions now wait for the ball to go dead.</b> Pick a change from the pause menu and it is carried out the moment play next stops - after a free kick, a card, a throw in, a goal kick or a corner - instead of cutting away in the middle of a move.",
      "<b>You can see who is waiting.</b> The pause menu lists the players queued to come on and counts them against your five substitutions, and the substitution show still plays when the change is finally made.",
    ],
  },
  {
    version: "V1.34.24",
    tag: "",
    title: "My Club kick-off fix",
    notes: [
      "<b>Fixed a My Club match that could freeze at full time.</b> From the second season on, ending the Community Shield could leave you stuck on the kick-off formation with no result screen. The match now always hands over to the proper result screen.",
      "<b>Every competition ends cleanly.</b> League, FA Cup, Community Shield, UEFA Super Cup and Champions League matches were all checked end to end, so no match can silently stall at the whistle.",
    ],
  },
  {
    version: "V1.34.23",
    tag: "",
    title: "Skip any cutscene",
    notes: [
      "<b>Every cutscene can now be skipped.</b> The Walkout, the Crowd Cam, the Half-time show, a <b>Substitution</b>, the Last Minute Winner and the <b>trophy lift</b> all carry a <b>SKIP</b> button, so you are never stuck waiting for a scene to finish.",
      "<b>One control on every device.</b> Skip with <b>Enter / Space / Escape</b> on a keyboard, any button on a controller, or a <b>tap</b> on the SKIP button or the pitch on a touchscreen.",
      "<b>Skip in stages.</b> The pre-match and half-time sequences move on one step at a time - first past the cinematic to the countdown, then straight into the action.",
    ],
  },
  {
    version: "V1.34.22",
    tag: "",
    title: "Substitution show",
    notes: [
      "<b>Substitutions now play out on screen.</b> Make a change from the pause menu and the game cuts away for a proper stoppage: the <b>fourth official raises the board</b>, the sub <b>strips off his bib</b> by the bench, the pair <b>shake hands on the touchline</b> to a standing ovation, and a card shows <b>who is coming off and who is coming on</b>.",
      "<b>It uses your match.</b> The scene wears each side's real name and kit, the scoreboard shows the live <b>score and minute</b>, and the card names the actual players (with a shirt number) you swapped - straight from your squad.",
      "<b>Then play resumes.</b> The action picks up exactly where it left off.",
    ],
  },
  {
    version: "V1.34.21",
    tag: "",
    title: "Half-time show",
    notes: [
      "<b>Half time now plays out as a proper cutscene.</b> The whistle goes for the break and the camera follows the players off: the <b>touchline</b>, the <b>walk to the tunnel</b>, the <b>home crowd</b>, and the manager <b>stopped by the reporter</b> in the tunnel.",
      "<b>It is your match in miniature.</b> The stats card shows the real <b>first-half numbers</b> - possession, shots, shots on target, chances and saves - plus the <b>score</b> and the latest <b>scorer</b> for each side, all read straight from the game.",
      "<b>Then the second half countdown rolls.</b> The show hands straight over to the Crowd Cam's <b>SECOND HALF</b> scene, so the restart kicks off right on cue.",
    ],
  },
  {
    version: "V1.34.20",
    tag: "",
    title: "Pad-friendly match stats",
    notes: [
      "<b>The Match Stats screen is now walkable with a controller.</b> Every stat line and every goal on the full-time breakdown can be highlighted with the D-pad, the same way you scroll the league table - the screen keeps your focused row in view and marks it clearly.",
      "<b>Continue still leads.</b> The ring starts on <b>Continue</b>, and stepping up walks back through the goal list and then the stat lines, so nothing on the results screen is stranded when you play on a pad.",
    ],
  },
  {
    version: "V1.34.19",
    tag: "",
    title: "Walkout cinematic",
    notes: [
      "<b>Every match now opens with the Walkout.</b> Before the Crowd Cam countdown, a full pre-match sequence plays: the players wait in the <b>tunnel</b>, the teams <b>walk out</b> to the pitch with their <b>mascot escorts</b>, the <b>national anthems</b> play, the captains meet for the <b>coin toss</b>, and the <b>starting line-ups</b> are read out on screen.",
      "<b>It wears your colours and names.</b> The walkout uses each side's real team name and kit, and the line-ups shot reads out the actual starting XI for both teams - so the players on the team sheet are the ones about to take the pitch.",
      "<b>Then the Crowd Cam takes over.</b> The walkout flows straight into the existing KICK OFF countdown, so the match kicks off right on cue.",
    ],
  },
  {
    version: "V1.34.18",
    tag: "",
    title: "Controller-friendly results and pause",
    notes: [
      "<b>The full-time screen is now pad-first.</b> When the results land, the focus ring jumps straight to <b>Continue</b>, so a single A press moves on - no stick nudge needed.",
      "<b>The pause menu leads with Resume.</b> Opening pause focuses <b>Resume</b>, LB/RB (or the tab buttons) switch between the Match and Team panes, and the ring follows you into whatever pane you open - it also always reopens on the match tab.",
      "<b>Less waffle.</b> Trimmed the wordy notes on the results and pause screens (\"Match Stats\", short substitution and formation hints) so the important numbers and actions stand out.",
    ],
  },
  {
    version: "V1.34.17",
    tag: "",
    title: "FC 26 look - dark UI, new type & copy",
    notes: [
      "<b>A bold new look across the whole game.</b> Every screen has been re-skinned in a <b>dark, cinematic</b> style: deep space gradients, glowing <b>cyan / violet / magenta</b> accents, frosted-glass panels and crisp rounded cards.",
      "<b>The home hub is dark and premium.</b> The mode tiles glow with a neon accent stripe, the Vantage FC header lights up in a cyan-to-violet gradient, and the team-select panel, buttons and inputs all pick up the new theme.",
      "<b>New type and refreshed wording.</b> Headings, eyebrows and buttons now use a bold <b>condensed</b> sport typeface, the home screen copy has been rewritten in a punchier FC tone, and every mode keeps its own accent - World Cup red, Custom violet, Player Career green, Manager gold and My Club cyan.",
    ],
  },
  {
    version: "V1.34.16",
    tag: "",
    title: "Multiple tournaments and careers",
    notes: [
      "<b>Keep as many saves as you like.</b> Custom Tournament, Player Career and Manager Career each now hold <b>multiple save slots</b> instead of a single one. Opening any of them shows a list of your saved games with a <b>Continue</b> and a <b>Delete</b> button on each row, plus a button to start a fresh one.",
      "<b>Nothing is lost when you start again.</b> Beginning a new tournament or career no longer wipes the old one - it stays in the list. Your existing in-progress save is carried across automatically, and you can jump between your games any time with the new <b>Careers / Saved Games</b> button inside each hub.",
    ],
  },
  {
    version: "V1.34.15",
    tag: "",
    title: "Modern motion - EA FC style animations",
    notes: [
      "<b>Every menu switch now flows.</b> Moving between the home screen, mode select and My Club fades the new screen up with a soft blur-and-rise, while a quick <b>light sweep</b> washes across the transition for a slick, modern feel.",
      "<b>The UI moves like the real thing.</b> My Club tab panes slide in and their panels, league-table rows and lists <b>cascade into place</b>, buttons press and spring under your finger, modals pop open over a blurred backdrop, and the controller focus ring gently breathes so you can always see where you are.",
      "<b>Built to stay smooth.</b> All of the new motion respects reduced-motion settings and switches off automatically in the low-effects/performance mode.",
    ],
  },
  {
    version: "V1.34.14",
    tag: "",
    title: "Controller-friendly Season menus",
    notes: [
      "<b>The Season area is fully pad-navigable.</b> Every My Club \u2192 Season sub-tab can be walked with the D-pad, and the content inside each one now takes the focus ring too - the <b>league table</b> (every club row), the <b>calendar</b> match days, the <b>trophy cabinet</b> and awards, the <b>transfer</b> news rows and your <b>managers</b> - so you can read and scroll each list without a mouse.",
      "<b>Sub-tabs are easier to find.</b> Opening a category with the controller now drops the focus straight onto its first sub-tab, so the Season row (League, Calendar, Trophies, Transfers, Friendlies, Managers) is always one press away.",
    ],
  },
  {
    version: "V1.34.13",
    tag: "",
    title: "Post-match statistics screen",
    notes: [
      "<b>A proper full-time stats screen.</b> The end-of-match summary now shows a full stat comparison between the two teams - <b>possession</b>, <b>shots</b>, <b>shots on target</b>, <b>chances</b>, <b>saves</b>, <b>tackles</b>, <b>penalties</b>, <b>missed penalties</b>, <b>yellow cards</b>, <b>red cards</b> and <b>goals</b> - each with a split bar so you can see at a glance who edged every department.",
      "<b>Cards actually show up now, and more is tracked.</b> The summary pulls the full match statistics straight from the match engine (shots on target, chances and penalties are now recorded as the match is played), keeps the goal-by-goal timeline with scorers and minutes, and adds a <b>penalty shoot-out</b> line whenever a tie is settled from the spot.",
    ],
  },
  {
    version: "V1.34.12",
    tag: "",
    title: "Controller-friendly pack opening",
    notes: [
      "<b>Open packs without a mouse.</b> The pack tiles in <b>My Club &rarr; Packs</b>, the <b>TAP TO OPEN</b> stage and the 3D walk-out are all reachable with the pad now - move the focus ring onto a pack and press <b>A</b> to buy and open it, press <b>A</b> on <b>TAP TO OPEN</b> to rip the pack, and press <b>A</b> on <b>DONE</b> to close the results.",
      "<b>Back out safely.</b> While the pack results are on screen, <b>B</b> dismisses them just like the DONE button; during the opening animation and the walk-out it does nothing, so you can never accidentally skip past a pull.",
    ],
  },
  {
    version: "V1.34.11",
    tag: "",
    title: "Last Minute Winner cutscene",
    notes: [
      "<b>Stoppage-time drama.</b> Score a go-ahead goal from level at 87'+ (or in added time) and the match stops for a full TV-style <b>Last Minute Winner</b> cutscene - a 23-second sequence that cuts between wide, behind-the-goal, bench, touchline, aerial, crowd and pile-on shots as the scorer wheels away and the subs and staff sprint on to celebrate.",
      "<b>Your teams, your colours.</b> The scene is rebuilt around your match: the winning side plays in its own kit, the scoreboard ticks up to your scoreline, and the goal minute and scorer's number are shown, before the action simply resumes.",
    ],
  },
  {
    version: "V1.34.10",
    tag: "",
    title: "Admin PIN settings tidy-up",
    notes: [
      "<b>Removed the redundant PIN field.</b> The <b>Set a PIN to secure admin</b> box in Settings is gone. Admin mode still asks for its PIN when you switch it on - you pick it the first time - so the protection is unchanged; the extra settings field was just clutter.",
    ],
  },
  {
    version: "V1.34.9",
    tag: "",
    title: "Controller-friendly dropdown menus",
    notes: [
      "<b>Cycle dropdowns with the pad.</b> Every dropdown can now be changed with a controller - push <b>left/right</b> on the D-pad or stick to step through the options, or press <b>A</b> to jump to the next one. Hold a direction to scroll quickly through long lists.",
      "<b>Up and down still navigate.</b> On a dropdown, up/down moves the focus ring to the neighbouring control as usual, so you can move around a menu and change values without reaching for the mouse.",
      "<b>Works everywhere.</b> The same handling covers every dropdown - settings, difficulty, half length, controls, audio, kits, and the league, club and nation pickers - and each change is applied instantly, exactly as a mouse pick would.",
    ],
  },
  {
    version: "V1.34.8",
    tag: "",
    title: "Crowd Cam cutscenes & broadcast commentary",
    notes: [
      "<b>Crowd Cam.</b> Every half now opens with a TV-style crowd cam cutscene - the camera sweeps across team-coloured stands packed with fans who wave, jump and hold scarves and flags, complete with floodlights, ad boards, a broadcast scoreboard and a red LIVE light. It plays before kick off and stands in for the half-time and extra-time breaks.",
      "<b>Commentary captions.</b> A commentator follows the action in a TV lower-third - a broadcaster plate with a caption line. The cutscenes get a welcome and a half-time round-up, and during play you get lines for kick off, goals, bookings and red cards, saves, corners, added time and the full-time whistle.",
      "<b>Your colours.</b> The stands, banners and scoreboard all pick up both sides' kit colours, so the ground looks like it belongs to the teams on show.",
    ],
  },
  {
    version: "V1.34.7",
    tag: "",
    title: "Trophy-lifting celebrations",
    notes: [
      "<b>Lift the trophy.</b> When your team wins a competition - a league title, a cup, a European crown, the World Cup - the match is followed by a full-screen trophy-lift celebration: your captain hoists the silverware on the podium while the squad jumps, with confetti and sparkles.",
      "<b>A scene for the trophy you won.</b> Each trophy has its own look and colours - the World Cup, Champions League, Europa League, Conference League, the five leagues and the cups all get their own podium and banner.",
      "<b>Only when you win.</b> The celebration only plays when you actually lift a trophy - a defeat or an early exit goes straight to the usual result screen. Press <b>Continue</b> (or Enter/Space) to move on to the match result.",
    ],
  },
  {
    version: "V1.34.6",
    tag: "",
    title: "Halves, a running referee & attack protection",
    notes: [
      "<b>Proper halves.</b> Every match is now split into a first and second half - the first ends on <b>45'</b> plus stoppage and the second on <b>90'</b> plus stoppage. Extra time is split the same way (<b>105'</b> and <b>120'</b>), with a break and a change of ends between each period.",
      "<b>The referee is on the pitch.</b> A match official in black follows play around the field and, when a player is booked or sent off, raises the yellow or red card so you can see the call before the banner fades.",
      "<b>The half won't cut off an attack.</b> If a team is pushing forward when the clock runs out, the referee plays on until the move breaks down - or through a short final spell - so you are never stopped mid-chance.",
      "<b>Half-time break.</b> A brief break screen shows the score before the second half kicks off, so the flow of the match reads clearly.",
    ],
  },
  {
    version: "V1.34.5",
    tag: "",
    title: "Extra time in knockouts",
    notes: [
      "<b>Level knockouts go the distance.</b> If a knockout tie is all square at full time, the match now plays 30 minutes of extra time before any penalties. The pitch clock carries on through <b>91'</b> to <b>120'</b>, and a SECOND HALF banner marks the change of ends.",
      "<b>Only when it should.</b> Group games, one-off and friendly matches still finish at the end of normal time plus stoppage - extra time only appears in a knockout tie that is level when the 90 (and added time) is up.",
      "<b>Win it in extra time to skip penalties.</b> Score during the extra 30 and you take the tie outright; if it is still level after 120 minutes, the match goes to the penalty shootout exactly as before.",
    ],
  },
  {
    version: "V1.34.4",
    tag: "",
    title: "Penalty shootouts reworked",
    notes: [
      "<b>You take the kicks now, not the dice.</b> On every one of your penalties you pick a corner and then time a moving accuracy marker. Nail the green zone for a clean strike - mistime it and you can drag the shot wide.",
      "<b>You defend too.</b> When the opponent steps up, you choose which way your keeper dives. Reading the taker correctly wins you the save, so the shootout is a contest at both ends instead of a coin flip.",
      "<b>The keeper remembers you.</b> The opposing keeper reads your habits, so peppering the same corner every time gets punished. On harder difficulties he reads you better.",
      "<b>A proper shootout stage.</b> A goal-mouth scene with the keeper diving and the ball flying, a kick-by-kick tally of every conversion and miss, sudden death when it stays level, and crowd noise on every kick.",
      "<b>Easy to drive.</b> Pick a corner or dive with the on-screen buttons or the number keys 1-5 (top-left, bottom-left, top-right, bottom-right, middle). Everything else about knockouts is unchanged.",
    ],
  },
  {
    version: "V1.34.3",
    tag: "",
    title: "Added time and injury time",
    notes: [
      "<b>The clock runs into stoppage time.</b> When normal time is up the referee plays added time, and the pitch clock shows <b>90+1'</b>, <b>90+2'</b> and so on until the final whistle - just like a real match.",
      "<b>How much gets added depends on the game.</b> Goals, bookings, penalties and other stoppages during the match all count towards it. A quiet game might add a minute or two; a scrappy, high-scoring one can run to 90+9'. The fourth official's board flashes ADDED TIME when normal time ends.",
      "<b>Everything else is untouched.</b> Full time, results, extra time, penalties and every mode work exactly as before - only the pitch clock now runs over at the end of the 90.",
    ],
  },
  {
    version: "V1.34.2",
    tag: "",
    title: "Matches no longer restart mid-game",
    notes: [
      "<b>Fixed a glitch where a match could randomly restart.</b> A leftover internal clock from the old match engine could still be running during a game. About a minute and a half in, its half-time routine would quietly reset the match, wiping the score and the clock - which looked like a random restart.",
      "<b>The new engine owns the clock now.</b> That old clock has been retired so it can never reset a match again. Half-time, the score and everything else are handled by the current match engine as normal.",
    ],
  },
  {
    version: "V1.34.1",
    tag: "",
    title: "Low-effects mode for slower devices",
    notes: [
      "<b>A new Performance setting.</b> Settings &gt; Visuals now has a Low-effects mode. Turn it on and the game drops the heaviest page-wide effects - the full-screen backdrop blurs, the slowly drifting background gradients and the moving pitch lights - so it runs smoothly on older or lower-powered devices.",
      "<b>It looks after itself.</b> Low-effects mode switches on automatically when the game detects a software renderer (SwiftShader / llvmpipe / basic graphics) or if the frame rate stays under 40fps for the first few seconds. You can always turn it back off in Settings.",
      "<b>Everything still works.</b> Matches, careers, tournaments and menus are unchanged - only the decorative effects are thinned out.",
    ],
  },
  {
    version: "V1.34.0",
    tag: "",
    title: "Fouls, yellow cards and red cards",
    notes: [
      "<b>Referees are in the game.</b> Mistimed tackles and slides that catch the man instead of the ball are now fouls. The victim's team wins a free kick at the spot, or a penalty if it happens inside the box, and the offender can be booked.",
      "<b>Cards matter.</b> A bookable foul flashes a YELLOW CARD; a second yellow is a red. Reckless challenges and cynical fouls on a player clean through on goal can be a straight red. Sent-off players leave the pitch and their team plays a man down.",
      "<b>Match HUD shows the discipline.</b> Yellow and red cards are tallied next to each team's name, and a card panel pops up when the referee reaches for his pocket.",
    ],
  },
  {
    version: "V1.33.3",
    tag: "",
    title: "Open Play is now just you against one keeper",
    notes: [
      "<b>Open Play in Practice is a true solo session now.</b> It matches the other drills: only your player and the opposition goalkeeper are on the pitch, so you can run at goal, dribble and shoot from anywhere with the whole pitch to yourself.",
      "<b>Your session keeps flowing.</b> Score, miss or put it out of play and the ball comes straight back to you on the halfway line for the next attempt, with a running tally of goals and attempts in the HUD.",
    ],
  },
  {
    version: "V1.33.2",
    tag: "",
    title: "On-screen controls only appear for the Mobile scheme",
    notes: [
      "<b>The touch controls only show when you pick the Mobile (Touch) scheme.</b> They used to appear in every Pixel Striker match regardless of your settings; now they stay hidden unless Mobile is your selected Controls mode.",
    ],
  },
  {
    version: "V1.33.1",
    tag: "",
    title: "Fixed the box covering the match clock",
    notes: [
      "<b>The match clock is readable again.</b> A stray empty panel was left floating just above the clock and its shadow was darkening the time. That panel is now hidden in every match.",
      "<b>The Practice drill counter no longer sits on top of the clock.</b> It used to be drawn right over the time; it now sits neatly below it.",
      "<b>Drills show a running session timer.</b> Instead of a frozen '0'', the clock counts up (minutes:seconds) for the whole drill session.",
    ],
  },
  {
    version: "V1.33.0",
    tag: "",
    title: "Practice drills now use the new match engine",
    notes: [
      "<b>Free kicks, corners and penalties in Practice run on the same slick new engine as a real match.</b> Open Play already used it; the three set-piece drills used to drop back to the old presentation. They now play in the new engine, so the whole of Practice looks and feels consistent.",
      "<b>Each drill is a clean shooting session.</b> You take the kick against just the opposition keeper, the ball resets to a fresh spot the moment it goes in or goes dead, and a running tally shows how many you have scored out of the reps you have taken.",
    ],
  },
  {
    version: "V1.32.2",
    tag: "",
    title: "Fixed the giant cards after a pack walkout",
    notes: [
      "<b>The row of extra cards after a walkout is back to its normal size.</b> A styling clash had blown the cards in the bottom strip up to full screen width, so they covered the pitch. They now sit in a neat, correctly-sized row again, so you can watch the walkout and then browse the rest of the pack.",
    ],
  },
  {
    version: "V1.32.1",
    tag: "",
    title: "Matches made easier at every difficulty",
    notes: [
      "<b>The AI opponent is gentler on every setting.</b> Across Easy, Normal and Hard the opposing team now moves a little slower, wins the ball less often and has a keeper who saves fewer shots, so you get more time on the ball and more of your chances go in.",
      "<b>Your own team stays solid.</b> Your AI team-mates and your keeper now always play at a good, fixed level, so turning the difficulty down only weakens the opponent - it never drags your own side down with it.",
      "<b>The gap between the settings is unchanged.</b> Easy, Normal and Hard still feel distinctly different; they are simply all a bit more forgiving than before. Pick Easy in Settings if you want the calmest game.",
    ],
  },
  {
    version: "V1.32.0",
    tag: "",
    title: "Every My Club card, redesigned",
    notes: [
      "<b>All My Club cards use a brand-new collectible design.</b> Pack reveals, your starting XI and bench, the home screen's best cards and the Transfer Market all use the new shield-shaped cards with the big rating and position, a cartoon portrait, the nation flag, the club crest and a six-stat grid.",
      "<b>Each tier gets its own look.</b> Bronze, Silver, Gold, Prospect, Special, Captain, the five league cards, Hero, Legend, Icon, Nation Leader, RTG, Holo, World Cup and Max each have their own colours, frame and shine - Max and Holo even animate.",
      "<b>Your player's stats and identity still drive the card.</b> The portrait, kit colour, position and stat numbers all come from the actual player, and every card stays draggable, searchable and clickable exactly as before.",
    ],
  },
  {
    version: "V1.31.1",
    tag: "",
    title: "Controller support that just works",
    notes: [
      "<b>A plugged-in controller now plays every match automatically.</b> You no longer have to switch the Controls setting first - connect a pad and it drives the match straight away, with a simple layout: left stick or D-pad to move, A to shoot (hold to charge), X to pass, Y to tackle, B to switch player, RT or RB to sprint and Start to pause. The on-pitch hint switches to the controller bindings whenever a pad is connected.",
      "<b>Touch and keyboard are untouched.</b> The PC and Mobile schemes work exactly as before, and the Controller option stays in Settings for anyone who wants it.",
    ],
  },
  {
    version: "V1.31.0",
    tag: "",
    title: "The match is now Pixel Striker, ported in full",
    notes: [
      "<b>Every match now uses the real Pixel Striker FC engine.</b> The on-pitch game is the original Pixel Striker engine, ported in whole - its pitch, sprites, ball and player physics, its AI, its set pieces (kickoffs, throw-ins, corners, free kicks, goal kicks) and its on-pitch scoreboard all run the match now.",
      "<b>All your controls carry straight over.</b> Keyboard, gamepad and the on-screen touch pad all drive the Pixel Striker game - stick or WASD/arrows to move, shoot, pass, lob, skill move and sprint, exactly as before. Take the kickoff with a pass or a shot.",
      "<b>Everything around the match still works.</b> Results flow into Champions League, World Cup, Custom Tournaments, Player and Manager careers and My Club, and the end-of-match summary still lists the goals. Careers, tournaments, My Club, sponsors, injuries, suspensions and the penalty shootout are all untouched.",
      "<b>Training drills keep their own engine.</b> The free-kick, penalty and corner practice drills still run on the previous engine so the drills behave and score as they always did.",
    ],
  },
  {
    version: "V1.30.0",
    tag: "",
    title: "The match engine, rebuilt from scratch",
    notes: [
      "<b>The entire match is a brand-new arcade engine.</b> Every part of a game - the ball and player physics, the AI, the controls, the set pieces and the celebrations - has been rewritten from the ground up as clean arcade code. It still plays on the chunky Pixel Striker pitch with the very same HUD and controls, so nothing about how you play has changed.",
      "<b>Shots and saves actually work now.</b> A struck shot carries the full length of the pitch, keepers dive to make real saves and can only parry some of them, and defenders can get a block in - while your own teammates let your shot run instead of getting in its way.",
      "<b>Smarter opposition.</b> A player on the ball now drives at goal and either shoots or lays it off under pressure, keepers come off their line and distribute, and defenders press and tackle - so matches flow from end to end and goals can be scored at either end.",
      "<b>Everything else carried over untouched.</b> Careers, My Club, the tournaments, the penalty shootout, sponsors, injuries and suspensions all keep working exactly as before - only the on-pitch match was rebuilt.",
    ],
  },
  {
    version: "V1.29.0",
    tag: "",
    title: "The match is now arcade-only",
    notes: [
      "<b>The arcade top-down match is the only match view.</b> The old side-on 3D camera, the Match view switch and the Auto camera setting have been removed - every game, in every mode, now plays on the chunky Pixel Striker pitch with the arcade HUD and controls.",
      "<b>The match loop and camera were tidied into one arcade presentation.</b> The frame loop, fixed camera lock and HUD now sit together as a single clean arcade view, and the old side-on render path and adaptive-quality monitor are no longer used. The ball and player simulation, sprites, careers, tournaments and online play are untouched - so the game plays exactly as before, just always in the arcade look.",
      "<b>Nothing to configure.</b> There is no longer a Pixel arcade / Smooth 3D choice; the pixel view is simply how matches look now. Crystal-clear whole-number upscaling is still used, so the chunky pixels stay perfectly square.",
    ],
  },
  {
    version: "V1.28.0",
    tag: "",
    title: "Pixel arcade match - new look & controls",
    notes: [
      "<b>Matches now play like Pixel Striker FC.</b> The pitch is a chunky top-down arcade view - a striped green field ringed by pixel crowd stands and ad boards, locked to a fixed bird's-eye camera with the goals at either side. Everything is drawn on a deliberately small canvas that is then shown at a whole-number (3x) pixel upscale, so the pixels stay razor-crisp and perfectly square instead of blurry.",
      "<b>A pixel arcade HUD replaces the smooth overlay.</b> A little scoreboard with both team codes and the score sits across the top with the clock under it, a live radar sits bottom-left and your stamina bar tucked beside it - all drawn in a 3x5 pixel font straight onto the pitch.",
      "<b>New arcade controls.</b> Touch players get a proper on-screen stick plus big Shoot, Pass, Lob, Skill and Run buttons - Pass doubles as Tackle when you're defending. Lob is its own lofted pass, Skill knocks the ball past a man and Run sprints. On desktop the keyboard is unchanged: WASD to move, Space to shoot, B to pass, V to tackle.",
    ],
  },
  {
    version: "V1.27.0",
    tag: "",
    title: "Manager Career - squad, schedule & transfer window",
    notes: [
      "<b>The Squad tab has been rebuilt like the My Club lineup.</b> Your starting XI now sits on a pitch in a 4-3-3 - tap a player, then a matching position to change the side, or tap a filled slot to inspect or clear it. Every player card shows overall, position, age, potential and value with the six attribute bars, and you can sort by overall, position or name and search the squad. Whatever XI you pick is the one that walks out on match day, and Team Overall tracks it.",
      "<b>A brand-new Schedule tab.</b> A month-by-month calendar of every league and cup fixture for the season, colour-coded and hoverable, with month navigation and a Today button that jumps straight to your next match. Played games show their final scores and the next fixture is flagged.",
      "<b>A transfer window on the Transfers tab.</b> Browse players from rival clubs and make a cash offer - bid at or above their asking price and the deal usually gets done, lowball and they will refuse. There is also a free-agent pool you can sign for nothing. Any signing slots straight into your squad, replacing the weakest cover in that position once you already have enough.",
    ],
  },
  {
    version: "V1.26.0",
    tag: "",
    title: "FIFA 16 interface",
    notes: [
      "<b>A full visual overhaul in the style of FIFA 16.</b> The home hub and team-select screens now use the bright, tile-based look of the classic menus - flat blocks of colour with cut (chamfered) corners, dark navy type and the signature FIFA cyan trim.",
      "<b>Every mode is its own coloured tile.</b> Champions League blue, My Club teal, Practice orange, World Cup red, Custom indigo, Player Career green and Manager gold, all sitting under an angular accent bar beneath each screen's heading.",
      "<b>Each mode's screen keeps its colour.</b> Head into World Cup and the whole interface picks up the red trim; Custom Tournament goes indigo, Player Career green, Manager gold and My Club cyan. The accent paints the heading, the trim bar along the top, every panel edge and the buttons, so you always know which mode you're in.",
      "<b>And the inside matches.</b> The tables, group standings, knockout brackets, club/nation pickers, stat cards, tabs, sliders and inputs inside every mode have all been rebuilt in the same flat, sharp-cornered FIFA 16 style - accent-topped panels and condensed uppercase labels, tinted to whichever mode you're in.",
      "<b>In-game screens keep the dark graphite look</b> - My Club, careers and the match itself - now carrying matching cyan and orange accents, condensed uppercase headings, sharper corners and flat surfaces so the whole game feels cut from the same cloth.",
      "<b>Everything breathes.</b> Every backdrop is now animated: drifting aurora glows, a slowly panning pitch-grid, a soft light sweep across the hub and a gentle pulse on the trim bars. Each mode's motion is tinted to its own colour, and all of it backs off automatically if you have reduced-motion turned on.",
    ],
  },
  {
    version: "V1.25.0",
    tag: "",
    title: "Training, Traits & Goals",
    notes: [
      "<b>Training has been rebuilt around specialist Trainers.</b> Buy a coach for a stat - Pace, Shooting, Passing, Dribbling, Defending, Physical, or an all-round assistant - then assign up to three players at a time to their sessions. Coaches don't work instantly: the squad trains in the background and the gains land as in-game days pass, so bring the right coach in and let the time run.",
      "<b>Evolutions are now permanent Attribute Traits.</b> Earn Trait tokens and apply them to any card in your club. Every trait has multiple levels (Passing+, Passing++; Defensive Wall I, II, III) and boosts the stats it covers. A card can hold up to three traits, they can never be removed, and they stay glued to the player - raising both their overall and their resale value.",
      "<b>A brand-new Goals category.</b> Quests are seasonal objectives - play matches, score goals, keep clean sheets, open packs - that pay out coins, packs, consumables and Trait tokens, and reset each season. Achievements are one-off milestones that stay ticked forever once you clear them.",
      "<b>Every mode feeds the same progress.</b> Matches, ranked PvP wins, level-ups and pack openings now all count toward your quests and achievements, and level-ups hand out a Trait token as well as coins and a consumable.",
    ],
  },
  {
    version: "V1.24.3",
    tag: "",
    title: "Manager hub buttons fixed",
    notes: [
      "<b>Buttons in the manager career no longer throw errors.</b> Selecting a prospect, selling a player, promoting academy kids, buying from the market, taking a job offer and every Admin-tab control were being written into the page with broken click handlers, so pressing them did nothing and spat out a console error. All of them now work.",
      "<b>What went wrong.</b> Those buttons quoted the career's ID in a way that cut the button's own HTML short. The ID is now quoted correctly, so the buttons run the action they say they do.",
    ],
  },
  {
    version: "V1.24.2",
    tag: "",
    title: "Fixes for the dead-buttons bug",
    notes: [
      "<b>No more wait for a CDN to load before the game starts.</b> PeerJS (the online matchmaking library) used to load up front from a network CDN. If that request stalled, the whole page stalled with it and every button silently stopped working on slow connections. It now only loads when you actually open Online mode.",
      "<b>The game is fully playable offline again.</b> All career modes, tournaments and solo matches load and run with no internet at all; Online mode simply tells you if it cannot reach the connection service.",
    ],
  },
  {
    version: "V1.24.1",
    tag: "",
    title: "Manager career admin tools",
    notes: [
      "<b>An Admin tab in the manager hub.</b> Set budget, reputation and academy level on the fly, unlock funds, and promote every academy kid in one click. Forced results (win/draw/loss) steer every simulated match until you turn them off.",
      "<b>Player editor.</b> Rewrite any first-team or academy player from the Admin tab: overall, potential, age and position are all editable, and you can name any first-team squad player your star prospect.",
      "<b>Career teleport.</b> Jump straight to any club in the game - big or small - take over instantly, fast-forward seasons, generate job offers on demand, or retire on the spot.",
      "<b>Season shortcuts.</b> One click simulates the rest of the season, or skips you ahead to the next one. Board objectives can be force-accepted until you switch normal judgement back on.",
      "<b>All actions are logged.</b> Every admin change appears in the boardroom log, so you always know what you touched.",
    ],
  },
  {
    version: "V1.24.0",
    tag: "",
    title: "Manager Career mode",
    notes: [
      "<b>Take the hot seat.</b> A new mode card lets you start managing right away - either accept a job at a random struggling club or hand-pick the team that hires you. Rename the club and pick your kit colours.",
      "<b>Run the whole club.</b> A full season of a domestic league plus a knockout cup, with board objectives to satisfy. Blood teenagers from your academy (you control the star prospect in live matches), wheel and deal in the transfer market, and upgrade your scouting.",
      "<b>Obstacles along the way.</b> Takeovers, star players demanding moves, media pressure, wonderkids, budget cuts and derby fever all land on your desk mid-season - each decision changes your budget, reputation and targets.",
      "<b>Build a reputation.</b> Every result moves your reputation. Good seasons bring job offers from bigger clubs; bad ones earn the sack (then emergency appointments). Weigh up moving on or staying to build a legacy, and finally retire into the record books.",
    ],
  },
  {
    version: "V1.23.0",
    tag: "",
    title: "Player Career mode",
    notes: [
      "<b>Live the life of a footballer.</b> A new mode card lets you create a pro, then take them from a raw academy kid to a grizzled veteran. You control <b>only your player</b> on the pitch - the rest of the team is AI - and every match counts toward your story.",
      "<b>Start how you like.</b> Go the <b>Academy Kid</b> route: unpolished stats and a random small club, and earn everything the hard way. Or flip on <b>Custom Start</b> to set your own attributes within a budget and hand-pick your first club.",
      "<b>Slow, earned growth.</b> Matches award development points that you spend in training to nudge attributes up. Growth is hard-capped by a hidden potential and a per-season limit that shrinks as you age, and after thirty the body starts to go.",
      "<b>A full career around you.</b> Each season runs a domestic league and a knockout cup. Fight for your place against a rival for your position, shake off injuries, chase the Golden Boot and Player of the Season, earn national-team caps, weigh up transfer offers, and eventually retire into the history books.",
    ],
  },
  {
    version: "V1.22.9",
    tag: "",
    title: "Hub layout fix",
    notes: [
      "<b>Fixed overlapping tables.</b> In the World Cup and Custom Tournament hubs the group and league tables were a fixed 880px wide and spilled sideways over the knockout bracket. They now fit neatly inside their own column.",
    ],
  },
  {
    version: "V1.22.8",
    tag: "",
    title: "Custom Tournament mode",
    notes: [
      "<b>Build your own competition.</b> A new mode card lets you design a tournament from scratch. Choose the <b>team pool</b> - Champions League clubs, international nations, or both - then hand-pick any number of teams and the one you'll manage.",
      "<b>Three formats.</b> Run a <b>round-robin league</b> (single or home &amp; away), <b>groups into a knockout bracket</b> (groups of three to six, with one to three qualifiers each), or a straight <b>single-elimination knockout</b>. Byes fill any bracket that isn't a clean power of two.",
      "<b>Play or simulate.</b> Take every match live or simulate your result and roll the rest of the round forward. Group and league games can be drawn; every knockout tie is a single leg decided by extra time and penalties. Progress saves automatically so you can leave and return.",
    ],
  },
  {
    version: "V1.22.7",
    tag: "",
    title: "World Cup mode",
    notes: [
      "<b>The World Cup is here.</b> A new mode card on the menu drops you into a 48-nation tournament. Pick any country and lead them from a group of four all the way to the trophy. <b>Group games can be drawn</b>; every knockout tie is a single leg with extra time and penalties.",
      "<b>Groups, thirds and a 32-team bracket.</b> Twelve groups of four play a single round-robin. The top two of each group plus the <b>eight best third-placed teams</b> advance to a Round of 32 that runs through to the Final, with a full bracket view alongside the group tables.",
      "<b>Play it your way.</b> Take control of every match live, or use <b>Simulate It</b> to let your nation's result play out and roll the rest of the matchday forward. Your progress saves automatically, so you can quit and pick the tournament back up later.",
    ],
  },
  {
    version: "V1.22.6",
    tag: "",
    title: "Squad Building Challenges",
    notes: [
      "<b>SBCs are here.</b> The Store tab now has an SBC's challenge board. Build an XI from cards you already own to meet each challenge's requirements, then submit it to earn an untradeable reward - a special card or a free pack.",
      "<b>Requirements vary per challenge.</b> Some ask for a full XI of Icons, others for a set number of one nation, a squad rating, a minimum pace or league spread - each challenge shows a live checklist as you build. The eleven submitted cards are <b>used up</b> and leave your club.",
      "<b>Your team is safe.</b> Cards in your starting XI and on your Match Bench can't be drafted, so a submission can never break your line-up.",
    ],
  },
  {
    version: "V1.22.5",
    tag: "",
    title: "A shot of serum",
    notes: [
      "<b>Consumables have their own artwork.</b> Serums now show a syringe and Elixirs show a bottle, so you can tell your boosts apart at a glance wherever they appear - in your inventory list, on the reveal card when a Consumable Box is opened, in the Daily Shop, and in the combine recipes.",
    ],
  },
  {
    version: "V1.22.4",
    tag: "",
    title: "A proper badge",
    notes: [
      "<b>Vantage FC has a game icon.</b> The browser tab now shows the club logo instead of a blank icon.",
    ],
  },
  {
    version: "V1.22.3",
    tag: "",
    title: "Find your cards",
    notes: [
      "<b>You can now search and sort the cards you own on the Lineup page.</b> A search box above your card list filters by name, position or card type as you type, and the list can be sorted By Position, By Overall, By Name or By Tier - tap a sort twice to flip the order. Search works for consumables too.",
    ],
  },
  {
    version: "V1.22.2",
    tag: "",
    title: "More pitch, less clutter",
    notes: [
      "<b>The Lineup page gives the pitch more room.</b> The pitch showing your current XI is now noticeably wider, so a full row of players fits across the field without cramping, while the card list you pick from is slimmer to make space.",
    ],
  },
  {
    version: "V1.22.1",
    tag: "",
    title: "Lineups stick, and boxes open as boxes",
    notes: [
      "<b>Your saved lineup now survives a refresh.</b> The game only re-loaded your starting XI when it was a 4-3-3, so playing any other formation (4-4-2, 3-5-2, 5-3-2, 3-4-3 or 4-5-1) quietly threw your saved team away on refresh and rebuilt it from the starter squad. The saved XI is now restored for every formation.",
      "<b>And the Consumable Box reveals a consumable again.</b> Opening a Manager Pack and then a Consumable Box showed a manager card in the box's reveal, because the manager reveal was still being remembered when the box opened. Each reveal now clears the other, so a box always shows the item you actually pulled.",
    ],
  },
  {
    version: "V1.22.0",
    tag: "",
    title: "One pack shop, every card on the table",
    notes: [
      "<b>The Pack Shop is now just the Tier packs.</b> The clutter of league, nation, role and speciality packs is gone from the Packs tab - it now lists only <b>Tier I</b> through <b>Tier V</b>, alongside the <b>Manager Pack</b> and <b>Consumable Box</b> (which still hand out managers and boosts).",
      "<b>And any card can come out of a Tier pack.</b> Every card in the game - Bronze, Silver, Gold, Prospects, Specials, Team Captains, League standouts, Game Legends, Nation Legends, Nation Leaders, Icons, Road to Glory, Holographic, World Cup and MAX - can now drop from a Tier pack. The odds shift with the tier: cheap packs lean Bronze and Silver, while higher tiers pour their weight into the rarer rarities, so the best cards climb from a long shot to a genuine chase as you pay up.",
      "<b>Packs now give the number of cards they promise.</b> Tier packs previously always opened ten cards regardless of what the tile said; they now hand over exactly their listed count (5, 6, 8, 8, 10).",
    ],
  },
  {
    version: "V1.21.12",
    tag: "",
    title: "Practice, then My Club, no longer locks up",
    notes: [
      "<b>Quitting a match now clears the pitch.</b> Leaving Practice Arena (or any match) back to the menu used to strand the frozen pitch and its full-time ending on screen, because the match screen was never torn down. It is now hidden and any live drill or cutscene is stopped as you return to the menu.",
      "<b>And My Club opens after another mode.</b> Starting Practice Arena left your team selection behind, which made the My Club screen open onto nothing and lock up. My Club now opens its setup/resume screen properly no matter which mode you played before it.",
    ],
  },
  {
    version: "V1.21.11",
    tag: "",
    title: "A cleaner opening sequence",
    notes: [
      "<b>The intro screens no longer overlap.</b> The title card's letterbox bars and frame used to still be on screen for a moment as the loading screen faded in behind them. The frame now finishes lifting away a touch earlier, so the title card clears completely before the loading screen begins.",
      "<b>And the home screen no longer loads twice.</b> When the loading screen faded to the main menu, the menu's entrance animation was being replayed on top of the screen that was already waiting underneath it. It now simply fades into view once.",
    ],
  },
  {
    version: "V1.21.10",
    tag: "",
    title: "Now labelled Alpha",
    notes: [
      "<b>The version badge reads Alpha.</b> The build number shown in the page title and on the home screen now carries an <b>Alpha</b> marker (e.g. Alpha V1.21.10), making it clear the game is still in active development.",
    ],
  },
  {
    version: "V1.21.9",
    tag: "",
    title: "A touch more breathing room",
    notes: [
      "<b>The card portraits are a little smaller.</b> The player silhouette on every card has been scaled down slightly so it sits more comfortably inside the card frame and no longer crowds the name and rating.",
    ],
  },
  {
    version: "V1.21.8",
    tag: "",
    title: "Every card gets a player picture",
    notes: [
      "<b>One silhouette, every card.</b> The little CSS-drawn head-and-shirt figure that used to sit on each card has been replaced with a proper player silhouette image, so cards now read as real player portraits. It appears on player, Manager and Consumable cards alike - in the pack reveal, the walk-out, the pack tray, My Club, the market and the squad screens.",
    ],
  },
  {
    version: "V1.21.7",
    tag: "",
    title: "The walk-out keeps the overall to itself",
    notes: [
      "<b>The rating panel no longer gives the number away.</b> When a card rated 86 or above walks out, the build-up used to call out its overall before the card had even flipped. That panel now shows a hidden rating instead, so the first time you see the overall is when the card itself turns over at the reveal.",
    ],
  },
  {
    version: "V1.21.6",
    tag: "",
    title: "A FIFA 16 coat of paint",
    notes: [
      "<b>The whole UI goes Ultimate Team.</b> Every screen now wears a FIFA 16-style look: dark charcoal surfaces, FUT gold and chemistry teal/green accents in place of the old purple, angular panels with a gold top edge, and condensed uppercase type throughout. Menus, My Club, packs, settings, pause and the modals have all been re-skinned - no layout or gameplay changed.",
    ],
  },
  {
    version: "V1.21.5",
    tag: "",
    title: "Packs open when you say",
    notes: [
      "<b>No more auto-open.</b> Buying a pack in My Club no longer pops it open on its own - the pack sits there with TAP TO OPEN until you click it, so you're in control of when the reveal starts. This covers player packs, Manager Packs and Consumable Boxes in both the 3D and 2D reveals.",
    ],
  },
  {
    version: "V1.21.4",
    tag: "",
    title: "The rest of the pack fans out below",
    notes: [
      "<b>The walk-out isn't over when the card flips.</b> After you press CONTINUE on a walk-out, the rest of the pack - every card you didn't just see walk out - fans out as a horizontal strip along the bottom of the screen, so you get the full results without the reveal losing its punch.",
    ],
  },
  {
    version: "V1.21.3",
    tag: "",
    title: "Save the star for the reveal",
    notes: [
      "<b>The walk-out keeps its secret until the end.</b> The plinth now stands empty and dim while the nation, rating and position panels play, so nothing gives the player away - he only steps into the spotlight at the final reveal, right as the card flips over and the stats slide in.",
    ],
  },
  {
    version: "V1.21.2",
    tag: "",
    title: "The walk-out is framed for delivery",
    notes: [
      "<b>The walk-out is framed for delivery.</b> The player model now takes the right of the screen - lit under the spotlight on his plinth - while the reveal card and his stat sheet slide in on the left, and the pack opening stage now sits dead-centre instead of lurking in the corner.",
    ],
  },
  {
    version: "V1.21.1",
    tag: "",
    title: "Pull an 86 and the lights come up",
    notes: [
      "<b>Walk-outs for the big cards.</b> Any card rated 86 or above now plays a full 3D walk-out when you open its pack: a procedurally-built footballer stands on the plinth under the spotlight while the game calls out his nation, his rating and his position on three big panels, then the card itself flips over and you carry on. Pull two of them and only the best one walks out - the rest come straight through to the results grid, where you can still read every card you pulled. Everything below 86 skips straight to the results as before.",
      "<b>The player model is built from the card.</b> Kit colours, skin tone, hairstyle and shirt number are generated from the card itself, so the same player always looks the same in every walk-out.",
      "<b>It fails safe.</b> The 3D library streams in through a standard HTTPS CDN the moment a walk-out starts, so the page stays lightweight. The scene still needs WebGL, and if your browser has it turned off (or the module can't load) the pack quietly falls back to the original 2D reveal with a short note explaining why - packs, odds, prices and every card you get are completely unchanged.",
    ],
  },
  {
    version: "V1.21.0",
    tag: "",
    title: "Bigger pitch, brand-new intro and a living stadium",
    notes: [
      "<b>Settings and pause go tabbed.</b> The pause menu is now two panes - the score and match actions on one, your formation and substitutions on the other - and Settings splits its long shelf of options into six clear tabs: General, Sound, Visuals, Ball &amp; Kit, My Club and Reset. Each pane scrolls on its own while the tab bar stays put, and a gamepad swipes between tabs with LB/RB.",
      "<b>Your team's restarts are always yours to take.</b> Free kicks, corners and match penalties for the human side are now taken on the kick button in every match - no auto-strike for your taker. Aim a penalty with the right stick (or the cross keys), keep the ref's countdown for your taker low, and put the set-piece away yourself: press KICK on the keyboard, the pad or the touch button. The AI keeps its quick vault-and-kick restarts.",
      "<b>Aiming just got precise on a pad.</b> In controller mode the right stick now steers every strike - open-play shots and passes fire exactly where you point the stick (with the same twist that there's no twist: the ball heads where the screen says), free-kick HEIGHT/BEND tune continuously instead of jumping in steps, and penalties aim anywhere in the goal - a gentle push lifts one to the post, a full diagonal flick buries it in the very corner.",
      "<b>Practice Arena now picks your drill.</b> Open Play, Free Kicks, Corners or Penalties - each set-piece drill stages the same restart again and again, skips goal replays so the reps keep coming, and tallies your scored on the on-pitch HUD as you sharpen one discipline: tune height and bend from the edge of the box, aim your cross at the near or far post, or take spot-kicks against the keeper one after another.",
      "<b>Canvas-up launch.</b> The game now opens with a proper cinematic intro - club crest reveal, letterboxed title card and a loading sequence that gathers the squad - before it eases you onto the home screen. Press any key (or tap) to skip straight in.",
      "<b>Controller sprint finally lands.</b> The right trigger (and the touch sprint button) now feeds the actual simulation - pads and keyboard cover the same distance, and RT genuinely sprints again on gamepads.",
      "<b>The stadium fits the bigger pitch.</b> The bowl was still sized and centred for the old pitch, so on the longer field it sat to one side and clipped the near touchline. It is now centred on the new pitch centre and scaled up to keep the same clearance all the way round - and a ring of lit skyscraper silhouettes has been added behind the far stand for a proper night-time skyline.",
      "<b>Stands no longer split down the middle.</b> The menu wallpaper shows one unbroken arena: a far deck now bridges the two side stands behind the goal.",
      "<b>Minimap is back on the live match screen.</b> The little player map used to be painted underneath the match canvas; it now sits on top, bottom-left, so you can see it while you play, fullscreen included.",
    ],
  },
  {
    version: "V1.20.1",
    tag: "",
    title: "Practice Arena is all play",
    notes: [
      "<b>Practice Arena keeps no score, no clock and no cards.</b> The drill is pure free play: no scoreboard tally, no match clock, no bookings and no final whistle.",
    ],
  },
  {
    version: "V1.20.0",
    tag: "",
    title: "Practice Arena, faster restarts and sharper offsides",
    notes: [
      "<b>New mode - Practice Arena.</b> A solo shooting drill from the home screen - just you and one goalkeeper. The whole pitch is yours to run at the goal and sharpen your finishing; quit when you are ready and the drill drops you back in the menu.",
      "<b>Free kicks auto-start faster.</b> If the ball is never struck after the countdown, the taker takes the restart themselves within seconds instead of hanging, so play re-starts on its own.",
      "<b>Offside lay-offs now flagged.</b> A runner the offside trap caught no longer blanks the next pass he plays on: the lay-off to a team-mate is judged fresh, so a scorer from that second ball gets a correctly disallowed goal.",
    ],
  },
  {
    version: "V1.19.0",
    tag: "",
    title: "Vantage FC - New identity and major updates",
    notes: [
      "<b>Game rebranded to Vantage FC.</b> The title screen, match titles and branding updated throughout.",
      "<b>Updated pack system with five luck tiers.</b> Tier I through Tier V with different prices, odds and rewards - higher tiers offer better chances for elite players without guaranteeing specific rarities. Walkouts depend on the player pulled rather than pack.",
      "<b>What's New modal updated.</b> Added close X button at top right.",
      "<b>Match UI improvements.</b> Match timer moved below the score on the game screen. Fullscreen button added for matches. UI made more controller-friendly.",
      "<b>Dribbling fixed.</b> Simply running with the ball no longer knocks it out of your feet - the feint pad was reading your movement keys as a right-stick nudge, so the ball was punched away every few frames and you could never carry it. A deliberate pad touch now needs the right stick, and you get a moment to settle on the ball before it can fire.",
      "<b>Play now restarts after a goal.</b> The goal sequence looped replay and celebration forever, leaving the match frozen on the goalscorer for good. The replay plays, the celebration plays, then the teams reset for the kickoff and the clock runs on.",
      "<b>Offside fixed in both directions.</b> The offside line used a plain max, so anyone on the attacking side standing in their own half was flagged. It now follows the direction of play, the pass that wins the ball back is itself judged, and a flagged runner stays flagged through his first touch.",
      "<b>Sprint stamina rebalanced.</b> Sprinting now drains at a sensible rate and recovers when you let go, instead of leaving you flat after a few seconds.",
      "<b>Free kicks can no longer stall the match.</b> Alongside the hand-off to a team mate if you never take it, there is now a backstop that restarts play even if the taker gets blocked and never reaches the ball.",
      "<b>Fullscreen button fixed.</b> It was never actually a function - it had been left outside the script block, so clicking it threw an error.",
      "<b>New My Club Home dashboard.</b> A floodlit club-hub screen with your crest, level bar, Squad/Store/Transfer Market quick tiles, Featured Packs straight on the home tab, your best cards and the next fixture - plus a Daily Reward that pays out coins and XP once per day and tracks a 7-day cycle with a streak.",
      "<b>Transfer Market price guide.</b> Search every named card in the game - Special, Hero, Icon, MAX, Prospect, Holographic and Nation Legend - and see what a freshly listed copy would cost, in line with the live For Sale board.",
      "<b>Menus are fully controller-playable.</b> D-pad and stick move a gold focus ring through the menus, A activates, B closes, and menu nav stands down the moment a match starts so it never steals a pass.",
      "<b>Soccer-themed stadium wallpaper.</b> The whole game now plays out in front of a floodlit stadium at night, drawn with pure CSS - roofed two-tier stands packed with crowd lights, four glowing light towers with drifting beams and a striped pitch under the menus.",
      "<b>My Club is organised into tabs like FIFA Ultimate Team.</b> The club now has a permanent tab bar along the top - Main, Squad, Store and Season - and each one opens into its own row of buttons, so Store gives you Packs, Shop, Market and SBC's, and Squad gives you Lineup, Training, Evolutions and Players, instead of one long list behind a hamburger button.",
      "<b>The match now fills the whole screen.</b> The small bordered pitch window is gone - the game plays edge to edge like a TV broadcast, with the scoreboard, timer, energy bar and controls floating over the action and the stadium darkening around the field.",
      "<b>Clean broadcast view.</b> The overlay match title, the DOM scoreline and the big match clock are hidden from the pitch, and the small player-tracker minimap now sits in the bottom-left corner of the screen.",
      "<b>Sprint bar fixed and nudged lower.</b> The energy fill is now recalculated live - it used to freeze at 100% because it read a one-time snapshot - and the bar sits a touch lower under the top edge of the screen.",
      "<b>Promotions stay on the Home dashboard.</b> Featured packs, the daily reward, your best cards and the next-up fixture only appear on the My Club Home tab, never leaking into Packs, Market, Squad or Season screens.",
    ],
  },
  {
    version: "V1.18.2",
    tag: "",
    title: "You can hand over to any man on your team",
    notes: [
      "<b>Press F and control jumps to the teammate nearest the ball.</b> One key and the man who is best placed for the next touch is the one you are steering, so you can cover a cross, come across to press, or drop back to your keeper without hunting for him.",
    ],
  },
  {
    version: "V1.18.1",
    tag: "",
    title: "The walk-out no longer gets cut off by the whistle",
    notes: [
      "<b>Fixed: the pre-match intro played its first two shots and then stopped.</b> The walk-out sequence runs 6.8 seconds but the old kick-off countdown was 5, so the whistle went in the middle of the last shot and the scene was pulled away mid-caption. The scene now holds the kick-off for as long as it is on screen, so the whole thing plays through - <i>The teams walk out</i>, then each side's attacking direction, then the whistle.",
      "<b>And the countdown no longer sits on top of it.</b> The big <i>KICKOFF IN</i> disc used to be painted straight over the middle of the shot. It now stays hidden while the intro is up and reappears for a short beat before the whistle. Pressing a key to skip still cuts straight to the football.",
    ],
  },
  {
    version: "V1.18.0",
    tag: "",
    title: "Match day - walk-outs, cutscenes, weather and faces",
    notes: [
      "<b>Your eleven walks out of the tunnel.</b> At the start of a match both teams come in from opposite corners, walk to their exact spots in formation, and settle into the shape you picked. Your best player gets a card as he arrives - bronze, silver or gold depending on how highly rated he is. The pre-match is no longer eleven players standing on a line waiting for a whistle.",
      "<b>The match now has a broadcast.</b> There is a scripted camera introduction before kick-off, a cutaway on every goal, one at half-time and one at the final whistle, all with letterboxed framing and a caption naming whoever is involved. Press the action key at any point to skip straight to the football. The crowd noise and the commentary run through it, so a goal sounds and looks like a goal rather than a number ticking over.",
      "<b>Weather that changes through the match, and matters.</b> It starts clear and rolls in over ninety minutes - overcast, then rain, a storm with lightning, fog, or snow. Rain leaves the ground slick: the ball runs on further than it should, passes skid, and a heavy challenge knocks the carrier about. Both sides get the same weather at the same moment in an online match, so nobody gets an excuse.",
      "<b>Every player has a face.</b> Faces are generated from each player's own name, so the same footballer gets the same face in every match, on the walk-out card and beside his name on the full-time scorers list. Skin tone, hair, brows, facial hair and shirt colours are all drawn from a seeded generator - no downloads, no image files, and no two squads look the same.",
      "<b>The rules the referee has been ignoring are back.</b> Offside is now flagged at the moment the pass is played, not when the receiver gets there, and an offside goal is correctly given away as a free kick - with the goal shown again on replay before the restart. Keepers dive at full stretch across their goal instead of shuffling, corners can be aimed at the near post, the far post or the six-yard box and your AI picks one, and the ball goes out for a throw-in and comes back in properly.",
      "<b>More to do with the ball, and an easier game to get into.</b> On top of the pass and shot you already had: a driven through ball, a lofted lob, a soft dribble touch, a crossover that drags the defender the wrong way, a flick-up over a challenge, a shield that kills your pace and holds the ball to your foot, and a chargeable shot that can be chipped, bent or driven depending on how you strike it - plus the bicycle kick for the brave. If all of that is a lot, the difficulty selector now goes from Attacking to Defensive so you can get a foothold first.",
      "<b>And the club side got a tidy-up.</b> Formations, kits and procedurally drawn crests for every club, a market you can actually search, a minimap, a broadcast camera that follows the ball on its own, an admin PIN in settings, and a walk-out squad that is your real XI rather than a placeholder. Same career, same save, same trophies - just with the sharp edges filed off.",
    ],
  },
  {
    version: "V1.17.0",
    tag: "",
    title: "1v1 Online is now a real two-player match - you steer your own man",
    notes: [
      "<b>Both of you are playing now.</b> In earlier builds the host ran the ninety minutes and streamed the result over to the guest, who watched it. That is gone: each side controls exactly one player in real time, and the two browsers advance the same simulation tick for tick. Every pass, tackle, shot and celebration happens the same second on both screens - the match is genuinely simultaneous rather than streamed.",
      "<b>The two machines cannot disagree.</b> The match runs on a fixed tick clock on both sides, with every piece of random chance drawn from an identical seed, so the two screens are never watching different games. A lag spike or a dropped frame just holds the match a moment and then picks it right back up - it never splits into two different matches.",
      "<b>Matching no longer freezes if a game window slips out of view.</b> Browsers throttle heavily hidden tabs, which used to stall an online match about a second in. The game now tells you when it is waiting on the other side and asks you to keep both game windows visible, then carries on by itself the moment the window is back.",
    ],
  },
  {
    version: "V1.16.0",
    tag: "",
    title: "1v1 Online - play a friend, unranked, in five seconds",
    notes: [
      "<b>My Club PvP now has a second tab: 1v1 Online.</b> Tap it, press <i>Host a Room</i> and you get a five-character code. Your friend opens the same tab, types the code in, and you are in the same room - no account, no sign-in, nothing to install. There is a lobby that shows both managers, a ready-up on each side, a chat box for the small talk, and a three-second countdown that starts the match when you are both ready.",
      "<b>Two ways to pick your eleven.</b> <i>Normal</i> plays your actual My Club XI against your friend's, exactly as you have set them up - the same players, the same ratings, the same four-three-three. <i>Team Draft</i> throws that away and deals three random cards at a time instead: eleven rounds, goalkeeper first, then four defenders, three midfielders and three forwards, twenty seconds on every pick before it goes down for you. Card 1 is the safe one; the last two are a gamble. The draft is a proper one, so both of you are building the same eleven and neither of you gets the better of it.",
      "<b>It is all unranked.</b> This is a friendly, so nothing you win or lose here touches the trophy ladder - no trophies, no division, no change to your record, and no season fixtures. Play as many friendlies as you like and go back to the ladder afterwards exactly as you left it.",
      "<b>The host runs the match, the guest watches it.</b> The host's browser simulates the ninety minutes and streams the score and clock to the other side as it goes, so both of you are looking at the same match at the same moment and the result is the same on both screens. That means the friend you invite sees the game rather than steering it - a guest cannot pass or shoot, and their team is driven for them.",
      "<b>Chat runs the whole way.</b> The message box is there in the lobby, the draft and after the final whistle, and the last eighty messages stay put for the length of the room, so you can talk through your pick before you make it. If your opponent drops out the room tells you and hands you straight back to the online front page, and your club is returned to you exactly as it was - no half-finished draft left behind, no scratch squad left on the books.",
    ],
  },
  {
    version: "V1.15.0",
    tag: "",
    title: "PvP Mode - a trophy ladder you play your way up",
    notes: [
      "<b>My Club now has a second game mode.</b> Alongside Season Mode there is PvP Mode, a ranked ladder of ten divisions built entirely around playing matches. Switch between the two at any time from the bar at the top of the club screen - it is the same club, the same squad and the same career either way, so a change of formation or a new signing carries straight across.",
      "<b>The ladder runs from Division I to Division X.</b> Win a match and you take 120 trophies, draw and take 25, lose and drop 20 - though you can never fall below zero. There are ten divisions to climb, and Division X sits at 10,000 trophies. Your record, your win rate, your current and best win streaks and your last twenty results are all on the ladder, along with a full division table showing exactly how far the next rung is.",
      "<b>It is meant to take a couple of weeks, not a weekend.</b> There is no limit on how many ranked matches you can play - if you want to play twenty in a row, go and play twenty in a row. The climb is slow because the rewards are small, not because the game shuts the door on you: at a typical record that works out at roughly 73 trophies a match, so Division X is somewhere around 140 matches away. Keep to about ten a day and you will be at the top in a fortnight; grind all afternoon and you will be there sooner, which is your call to make.",
      "<b>Every opponent is a club that does not exist.</b> You are paired with a made-up manager and a made-up club - one of over a thousand possible names - running eleven named players with real ratings, positions and a kit, all built around your own trophy count. A brand new club meets a genuinely bad side; the further up the ladder you climb, the stronger the opposition becomes, and by Division X they are at their best. Your own XI counts for something too, so a strong club is never handed a walkover just because it has not climbed yet. The closer you get to the top, the less the numbers wander, so Division X is decided on football rather than luck.",
      "<b>Nothing on the ladder can be simulated.</b> However many matches you play, you play all of them - there is no auto-play, no skip and no way to buy your way up the table. The season tools step out of the way while you are on the ladder and come straight back when you go back to Season Mode, and the season calendar is left exactly as it was.",
      "Your ladder record is saved with your club, so it is still there tomorrow, and you can pick up where you left off from any career.",
    ],
  },
  {
    version: "V1.14.1",
    title: "Champions League seasons no longer lock up after qualifying",
    notes: [
      "<b>Qualifying for Europe used to freeze the season for the whole year.</b> The day-by-day controls - the fixture list, the \"skip to day\" box and the \"play my matches too\" tick - were hidden for as long as the club was in a European competition, and the Play button was greyed out on any day the club had no European fixture waiting.",
      "Since the Champions League does not kick off until September, but a European place is confirmed in May, that meant a club that had just qualified started the new season with no way to move past its first few matchdays. Pressing simulate over and over did nothing, because the button was busy checking for a European game that was months away. The only escape was simulating the entire rest of the season in one go.",
      "Those controls now step aside only while a European tie is genuinely waiting to be played, and come straight back the moment it is dealt with. Champions League and Europa League seasons can be played a day at a time like any other season.",
      "\"Simulate my match\" now checks which competition the next fixture actually belongs to. It used to assume any club in Europe was playing in Europe, so on a day when the league and a European tie fell together it booked the league game as the European tie - and paid out the wrong prize money for it.",
      "Play and Next Day are no longer disabled just because there is no fixture on the calendar today, which also means a season that has finished can always be rolled over into the next one.",
      "<b>European fields are back to the right size.</b> The Champions League, Europa League and Conference League were each drawing one club too many - 37 sides in the Champions League rather than 36 - and an odd-sized field made the round-robin schedule pair a club with itself, handing it a free \"win\" against itself every round. All three competitions now field the correct number of clubs and no team ever plays itself.",
    ],
  },
  {
    version: "V1.14.0",
    title: "Holographic cards, cheaper quick-sell and a new look for every rarity",
    notes: [
      "A new bonus card tier: <b>Holographic</b>, a prestige series of 16 all-time greats - Beckenbauer, Xavi, Iniesta, Casillas, Beckham, Gerrard, Eusebio and more - with a shimmering finish. It is the third best card in the game, sitting between the World Cup squad and Road to Glory.",
      "Holographic cards come from any player pack as a bonus, the same way Road to Glory and World Cup cards do, and they are rarer than a World Cup winner but far more common than a MAX. Bigger packs tilt the odds in your favour. The card market stocks the odd one too.",
      "<b>Road to Glory is now the most common bonus card at every pack price.</b> It used to only lead on the cheapest packs, and past about 3M a World Cup winner was actually the likelier pull - which made the big packs feel like they were handing out World Cup cards instead. Expensive packs still close the gap, so a big pack remains the better place to hunt one, but they no longer beat Road to Glory outright.",
      "For scale, on a Bronze pack Road to Glory is now roughly 4 times as likely as a World Cup card, and on an Icon pack it is still about twice as likely. World Cup cards are also a little harder to pull from every pack than before.",
      "They land at 92-93 OVR, the same band as Road to Glory, so nothing you already own has been rescaled. Holographic simply outranks Road to Glory everywhere else - market value, price and odds are all higher.",
      "<b>Selling a card directly is now worth noticeably less.</b> The quick-sell button has been cut by 30%, so cashing a card in on the spot pays a lot less than before.",
      "Buying has not changed at all. Market prices, the fair market average and the daily shop all still work off a card's full value, so if you would rather not take the quick-sell price, listing on the market is now clearly the better way to turn a card into coins.",
      "<b>Every rarity now has its own card design.</b> Previously all cards shared the same portrait and the same kit, and only the background colour changed - which is why Icon and Gold looked almost identical, and why Game Legend looked the same as Nation Legend.",
      "Each rarity now gets its own frame, portrait colour, kit trim and artwork motif. Icon is a dark slab in an ornate gold frame, Gold stays warm amber, Game Legend is crimson where Nation Legend is emerald, and Prospect is mint where Silver is steel.",
      "You can now tell what a card is from the artwork alone, before you read the name.",
    ],
  },
  {
    version: "V1.13.31",
    tag: "",
    title: "The season is now one continuous calendar",
    notes: [
      "My Club is no longer split into two halves. The season now runs as a single unbroken calendar from the first of August to the end of May, with the league, the cup, the Super Cups and the European competitions all sharing the same day-by-day schedule. Every competition is now an ordinary fixture in that calendar, dated when it is actually played.",
      "The Champions League, Europa League and Conference League all use their real windows - the Champions League from mid-September, the other two from the start of August - and their knockout rounds fall on their proper dates instead of being squeezed in at the end of the season.",
      "The UEFA Super Cup has moved to the start of the season, where it belongs: it is played on the fifth of August, between the Champions League winner and the Europa League winner, and your club plays it as a normal match rather than being dropped into a cut-off screen at the end of the year.",
      "The domestic Super Cup follows immediately after, with the semifinals on the sixth and seventh of August and the final on the eighth. The league then kicks off on the tenth.",
      "Every fourth season is a Club World Cup season. If your club qualifies, the European season finishes in May as usual and the Club World Cup then takes over in June and July, so that season now runs to the end of July.",
      "The calendar shows everything at once, so you can see what is coming, and Simulate Season and Advance Day both play out the whole season in order rather than jumping straight to the end.",
      "The season summary now tells you which European competition you have qualified for next season, and your first season remains a league-only season with no cups or Europe at all.",
    ],
  },
  {
    version: "V1.13.30",
    tag: "",
    title: "Super Cup is now a four-team tournament",
    notes: [
      "The domestic Super Cup is no longer a single game between the league and cup winners. It is now a proper four-team tournament: two one-legged semifinals and a one-legged final, played over the first three days of the season.",
      "The four entrants are the cup winner, the cup runner-up, the league winner and the league runner-up.",
      "Clubs cannot enter twice, so the places are filled properly: if one club holds two of the spots, the team that finished 3rd in the league takes the spare place, and if the four places end up shared by just two clubs, both 3rd and 4th in the league are called up.",
      "Every tie is a single match, so a level 90 minutes goes straight to extra time and then penalties - the same rules as the rest of the cup competitions.",
      "All three ties are shown in the Super Cup bracket and the calendar, you can play your own ties live as they come up, and the trophy still counts whether you win it on the pitch or have it settled for you.",
      "The final table is now remembered from season to season, so next year's Super Cup entrants are taken from the real finishing order.",
    ],
  },
  {
    version: "V1.13.29",
    tag: "",
    title: "UEFA Super Cup added",
    notes: [
      "A new European trophy: the UEFA Super Cup, a one-off between the Champions League winner and the Europa League winner, played out as the season closes.",
      "Your club is only entered if you actually won the Champions League or the Europa League - win either one and the decider is yours to play, with the usual extra time and penalty shootout if it stays level.",
      "The winners of both competitions are now remembered from season to season, so the fixture stays accurate once Europe has been played out. Until the Europa League has been played, the missing side is filled by the best-placed club available.",
      "The same two crowned winners never meet twice, so you cannot farm the trophy by skipping a season.",
      "It appears in the calendar and the season summary, and wins go to a new UEFA Super Cup line in your trophy cabinet - separate from your domestic Super Cup, which is still there.",
    ],
  },
  {
    version: "V1.13.28",
    tag: "",
    title: "European bracket placeholders fixed",
    notes: [
      "Fixed the European bracket filling up with \"Winner Round of 16 1\" style placeholders when you played a knockout tie match by match instead of simulating.",
      "Winning a tie only played out that one round, so every later round was left waiting on a result that never came - and your next tie could be handed a phantom opponent.",
    ],
  },
  {
    version: "V1.13.27",
    tag: "",
    title: "Simulate Season button",
    notes: [
      "Added a Simulate Season button next to Simulate. It plays out everything left in the season - your own matches included - then takes you straight to the season summary.",
      "Also fixed a related issue: after reloading the page mid-season the league fixtures stopped simulating, because the sim reads its match list from the on-screen competition group, which is empty on a fresh load.",
    ],
  },
  {
    version: "V1.13.26",
    tag: "",
    title: "European knockouts no longer freeze",
    notes: [
      "Fixed European knockouts freezing on TBD. If your club went out in the group stage the rest of the tournament was never played out, and ties waiting on a play-off winner could stall too - leaving rows like 'Celta Vigo TBD Ipswich Town' or 'Winner Round of 16 1' for the whole season.",
      "The Champions League, Europa League and Conference League brackets now always play through to a champion, including when you skip ahead or the season ends mid-knockout.",
    ],
  },
  {
    version: "V1.13.25",
    tag: "",
    title: "Extra time and penalty shootouts",
    notes: [
      "Simulated knockout matches can now be settled by extra time and penalties. The first leg of a two-legged tie always finishes level after 90 minutes - only the return leg can go the distance.",
      "A level knockout tie goes to 30 minutes of extra time, and if that is still level the winner is decided by a penalty shootout. Shootout scores are saved and shown in the bracket, the calendar and on the result screen.",
      "The rule applies everywhere knockouts are played - Champions League, Club World Cup, domestic cup and the Super Cup. League matches are unchanged.",
    ],
  },
  {
    version: "V1.13.24",
    tag: "",
    title: "Knockout and cup bracket fixes",
    notes: [
      "Knockout ties are no longer left stranded on TBD - the Champions League play-off round now simulates properly instead of feeding the Round of 16 imaginary winners.",
      "Cup semi-finals are properly two-legged again, and domestic cup ties now keep playing during the European phase instead of waiting for December.",
    ],
  },
  {
    version: "V1.13.23",
    tag: "",
    title: "Club World Cup",
    notes: [
      "A brand-new Club World Cup joins the summer every 4th season - seasons 4, 8, 12 and so on. Your Champions League summer phase plays out first, then the 32 best-performing clubs of the past 4 years fight it out in 8 groups of 4.",
      "The top 2 of each group advance to a straight single-leg Round of 16, quarter-finals, semi-finals and final.",
      "Winning the Club World Cup brings a giant coin prize and its own trophy in your cabinet.",
      "Opponent player stats in the Player Hub now update after matches you play live - not just simulated ones.",
      "AI squads and their Player Hub stats now survive page reloads, so every club's stats keep accumulating season after season.",
      "Simulated My Club matches are now a touch tougher - your side scores about 10% fewer goals when skipping games instead of playing them.",
      "Card packs now open 10 cards: 1 guaranteed card of the pack's own tier, plus 9 more drawn from the packs below it.",
      "The stronger packs no longer leak cards from the two tiers directly beneath them, and the bonus card chance still applies on top.",
      "Goalkeeper, Defender, Midfielder and Attacker packs follow the same 10-card format - every card in them is that position.",
      "Pack results now open in a much wider window, so a full 10-card haul fits on screen without endless scrolling.",
    ],
  },
  {
    version: "V1.13.22",
    tag: "",
    title: "Custom ball and jersey colors",
    notes: [
      "A new Ball & Jersey section in Settings lets you repaint the match ball - pick its main color and the dark panel pattern in the middle.",
      "You can also switch your team's kit to a custom jersey color that applies in every mode; leave it at the default and your club or team colors are used instead.",
      "A live preview shows the ball as you pick the colors, and a one-click button restores the classic white ball and default kits.",
    ],
  },
  {
    version: "V1.13.21",
    tag: "",
    title: "Best Players buttons for lineup and bench",
    notes: [
      "The lineup tab now has a Best Players button that fills your starting XI with the strongest available squad - it prefers each player's natural position, only placing someone out of position when no in-role option is left.",
      "A second Best Players button fills the Match Bench with the best remaining players not already in the XI. Injured and suspended players are skipped in both.",
    ],
  },
  {
    version: "V1.13.20",
    tag: "",
    title: "Friendly match fixes",
    notes: [
      "Quitting a match or returning to the My Club hub now fully clears the match state, so friendlies no longer refuse to start with a phantom \u201Cfdi\u201D \u201Cfinish your current match first\u201D message when no game is running.",
      "The friendly challenge cooldown now counts down through simulated days too: every in-game day you simulate or advance in the calendar ticks the friendly clock, so you can issue a new challenge every 3 days no matter how you play your season.",
    ],
  },
  {
    version: "V1.13.19",
    tag: "",
    title: "Goalkeepers now track goals conceded",
    notes: [
      "Your keeper - and every AI opponent keeper - now logs the goals he concedes, split out by league, Euro and career, in both live and simulated matches.",
      "It shows up as a Conceded stat on card info and the Hub profile, next to Saves and Blocks. Goals conceded are purely a record and are never used in evolution quests.",
    ],
  },
  {
    version: "V1.13.18",
    tag: "",
    title: "Simulated matches now count keeper saves and blocks too",
    notes: [
      "Just like goals and assists are rolled for outfielders, simulated games now roll a full day of work for each goalkeeper: saves and blocks are sized by how many goals the keeper conceded in the result and his own rating, so better keepers stop more.",
      "It applies to your keeper in every simulated league, Euro and cup game - and to the AI opponents' keepers, whose saves and blocks now fill in on their Hub profiles.",
    ],
  },
  {
    version: "V1.13.17",
    tag: "",
    title: "Pack-relative pricing now applies to AI Market cards too",
    notes: [
      "Every card the AI Market rolls up now remembers which pack type it was rolled as and what that pack costs, so the pack-style value rule applies there as well: the better cards a pack can produce price above their pack cost, while the fillers price below.",
      "That means the AI 'For Sale' board and its quick-sell values now follow the same value scale as real pack pulls, instead of falling back to plain rating-based prices.",
    ],
  },
  {
    version: "V1.13.16",
    tag: "",
    title: "Market sale prices follow the updated card values with a bit more on top",
    notes: [
      "The cards you buy on the My Club Market (the AI 'For Sale' board) are now priced against each card's updated quick-sell value scale, marked up a little bit higher than before - roughly 1.9x base (up from 1.75x), with rarer tags scaled up a notch too.",
      "Lingering cards are re-priced every time the market re-stocks, so the whole board always tracks the current prices instead of staying frozen on an old roll's.",
    ],
  },
  {
    version: "V1.13.15",
    tag: "",
    title: "Goalkeepers: saves and blocks replace goals and assists",
    notes: [
      "Goalkeeper cards no longer carry goals/assists - their stats now track saves and blocks instead.",
      "A save is any hard shot the keeper stops on the way in (including penalty-shootout saves); a block is a claim or clear that snuffs out an attack.",
      "Keeper cards in the squad info and Hub profile show Saves and Blocks, and goalkeeper Evolution quests now count saves and blocks instead of goals and assists.",
    ],
  },
  {
    version: "V1.13.14",
    tag: "",
    title: "Fixed free kicks near your own goal hiding the ball",
    notes: [
      "When a free kick sat close to your own goal, the behind-the-ball camera was being clamped inside the pitch, so it couldn't pull back far enough and the ball got shoved down off screen.",
      "Set-piece framing now ignores that clamp - the camera plants the same fixed distance behind the kicker no matter where the free kick is, and the ball stays centred and visible.",
    ],
  },
  {
    version: "V1.13.13",
    tag: "",
    title: "Set-piece camera fully centred behind the kicker",
    notes: [
      "The behind-the-ball camera for free kicks and penalties still sat a little to the right of the goal line - the view was clamped at 1.5 radians instead of a perfect quarter turn.",
      "The pivot now hinges the full 90 degrees, so the ball, wall and target goal line up dead centre of the screen from behind the kicker.",
    ],
  },
  {
    version: "V1.13.12",
    tag: "",
    title: "Much better AI shooting",
    notes: [
      "Opposition players used to aim every single shot straight at the middle of the goal - right where the keeper stands - so they barely ever scored from open play.",
      "AI pressure now picks a corner of the goal (better shooters more often and more accurately), aims at the actual goal line, and strikes the ball harder. Close-range finishes are properly dangerous, and long-range blasts come more often with accuracy that scales with the shooter's quality.",
    ],
  },
  {
    version: "V1.13.11",
    tag: "",
    title: "Fixed the corner flag triangles",
    notes: [
      "The flag material was collapsing into a thin sliver along the pole, showing up as a flat horizontal streak.",
      "Each flag is now a proper triangle: one edge hangs down the pole and the free corner flies out toward the centre of the pitch.",
    ],
  },
  {
    version: "V1.13.10",
    tag: "",
    title: "Corner flags",
    notes: [
      "A red corner flag now stands on each corner of the pitch in the 3D view, with the flag folding in toward the centre of the field when the light catches it just right.",
    ],
  },
  {
    version: "V1.13.9",
    tag: "",
    title: "Corner arcs are quarter-circles again",
    notes: [
      "The corner arcs on the pitch were being drawn as full rings centred on each corner, so the whole circle floated around the flag instead of hugging the corner.",
      "They're now proper quarter-circles that only sweep inside the field lines, like the real thing.",
    ],
  },
  {
    version: "V1.13.8",
    tag: "",
    title: "Stronger downfield zoom",
    notes: [
      "The camera now magnifies up to 1.5x at the goal line instead of 1.35x, so attacking play pulls in noticeably closer the deeper you push.",
    ],
  },
  {
    version: "V1.13.7",
    tag: "",
    title: "Fixed the downfield zoom so it actually zooms",
    notes: [
      "The first version of the downfield zoom only widened the horizontal axis - the pitch stretched wide and nothing came closer. That's scrapped.",
      "The camera now magnifies the whole frame uniformly around the vanishing point as you push toward the goal: players get bigger, the goal fills the screen more, and the touchline clamp follows so the pitch edge never gaps out.",
    ],
  },
  {
    version: "V1.13.6",
    tag: "",
    title: "Camera zooms in the deeper you push downfield",
    notes: [
      "The side camera now tightens up as you move the ball forward: still comfortably wide around the halfway line, it gradually zooms in toward the attacking goal the further downfield you get.",
      "The effect is smoothed so it glides in and out with your runs and resets when the ball comes back to midfield, and the touchline clamp adjusts so the pitch edge never gaps out at the tighter zooms.",
    ],
  },
  {
    version: "V1.13.5",
    tag: "",
    title: "Capped the camera's rotation when you play downfield",
    notes: [
      "In the side view, the camera used to keep swinging toward the player all the way until they reached the goal line - a full 69° twist that made attacking play hard to read.",
      "The yaw now bottoms out at about 46° instead. It still turns to track you the moment you advance past midfield, but once you're deep in the attacking third it stops winding further, so the goal and the play stay in frame instead of the world spinning around.",
    ],
  },
  {
    version: "V1.13.4",
    tag: "",
    title: "Made the New 3D players much lighter on weak laptops",
    notes: [
      "The 3D player bodies render dozens of projected faces per player every frame, and each face re-derived its shade colour from scratch - a heavy string job the adaptive resolution slider couldn't help with.",
      "Shade colours are now cached, the limb and clothing meshes use fewer segments (visually the same at these tiny sizes), and hands use flat fills instead of radial gradients. The renderer now does roughly half the work per frame, which shows most on laptops and devices without fast canvas hardware.",
    ],
  },
  {
    version: "V1.13.3",
    tag: "",
    title: "Warn when an injured or suspended player sits in your lineup",
    notes: [
      "If any player in your starting lineup is injured or suspended, the Play / Next Day button is greyed out - and now the lobby tells you exactly why, naming the player (with their status) and pointing you to swap them out in the Lineup tab.",
      "The play-block itself is unchanged: the game still refuses to kick off while a starter can't take the field. This just makes the reason visible instead of leaving a silently disabled button.",
    ],
  },
  {
    version: "V1.13.2",
    tag: "",
    title: "Fixed a soft-lock after winning the domestic cup",
    notes: [
      "Winning the cup (often the season's last event) made the calendar think the season was over, which disabled the Play / Next Day button before the calendar could reach Dec 31 - so you could neither continue, play, nor simulate, with no way to roll into the next season.",
      "The Play button is now never disabled just because the season is complete: it stays usable as Next Day and rolls the club into the next season at Dec 31. A tooltip explains the situation when the season is done.",
    ],
  },
  {
    version: "V1.13.1",
    tag: "",
    title: "Tougher AI climb and tamer simulated scores",
    notes: [
      "The opposition now gains a +1 OVR buff every 8 My Club wins instead of every 15, and the buff keeps climbing to +20 instead of +15 - the room gets harder noticeably faster as you keep winning.",
      "Simulated matches are now lower-scoring: expected goals per side dropped from ~1.55 to ~1.0 for an even game, and mismatches escalate more slowly, so scripted results feel more realistic next to played matches.",
    ],
  },
  {
    version: "V1.13.0",
    tag: "",
    title: "Controller (gamepad) and mobile touch controls",
    notes: [
      "Controls mode is chosen in Settings: PC (Keyboard / WASD), Controller (Gamepad) or Mobile (Touch).",
      "Controller: left stick or D-pad moves, RT sprints, A kicks (hold for a power shot), X passes, B requests the ball, Y tackles, LB nudges the ball out, Back toggles the camera, Start pauses. Movement uses the same camera-relative frame as WASD, and in-match penalty aim follows the stick.",
      "Mobile: a floating joystick (bottom-left) moves your player, with on-screen Shoot / Pass / Tackle / Request / Sprint buttons and a pause button (bottom-right / top-right). Touch controls appear automatically during matches.",
      "Keyboard still works in every mode.",
    ],
  },
  {
    version: "V1.12.8",
    tag: "",
    title: "Admin cash button gives 10x more",
    notes: [
      "The My Club admin-mode +$ button now adds $10,000,000 instead of $1,000,000.",
    ],
  },
  {
    version: "V1.12.7",
    tag: "",
    title: "Premium packs cost more",
    notes: [
      "Icon Pack is now 12,000,000 (was 4,500,000), Nation History Pack 8,000,000 (was 4,000,000), and Legends of the Game Pack 5,000,000 (was 3,600,000) - matching how much rarer these pulls have become.",
    ],
  },
  {
    version: "V1.12.6",
    tag: "",
    title: "Silver and Gold cards now have their own colors",
    notes: [
      "Because Silver and Gold overalls now sit in lower brackets, pulled cards were all falling back to the Bronze color. Base cards are now colored by their tier tag: Bronze still brown, Silver grey, Gold yellow.",
    ],
  },
  {
    version: "V1.12.5",
    tag: "",
    title: "Gold Pack icons dropped to 2%",
    notes: [
      "The Icon chance in a Gold Pack is now exactly 2 in 100 (was about 6%), with the freed weight going to Golds.",
    ],
  },
  {
    version: "V1.12.4",
    tag: "",
    title: "Bronze and Silver packs have lower ceilings",
    notes: [
      "Bronze Packs can no longer roll a Special, and Silver Packs can no longer roll an Icon - the freed weight just makes the pack's own tier more common.",
    ],
  },
  {
    version: "V1.12.3",
    tag: "",
    title: "Bigger cards got rarer in packs",
    notes: [
      "Nerfed the upgrade odds in every pack - Gold Packs now roll Specials about half as often and Icons half as often, and every other pack's jump to a better tier is similarly trimmed (the missing weight just makes its own tier more likely).",
      "Road to Glory bonus cards are now 5x rarer: only 1 in 5 would-be RTG bonuses actually drops. World Cup and MAX bonus odds are unchanged.",
    ],
  },
  {
    version: "V1.12.2",
    tag: "",
    title: "Card overalls now follow a fixed tier ladder",
    notes: [
      "Every My Club rarity now sits on one clear worst-to-best ladder, and pulled cards are rescaled onto it so a lower-tier card can never out-rank a higher-tier one: Bronze (60-63) < Prospect (64-66) < Silver (67-70) < Gold (71-74) < Special (75-78) < League (79-81) < Captain (82-83) < Game Legend (84-85) < Nation Legend (86-87) < Nation Leader (88-89) < Icon (90-91) < Road to Glory (92-93) < World Cup (94-95) < MAX (96-99).",
      "MAX stays unchanged at 96-99. The best player in each bracket still edges the rest of that bracket, matching their real rating - but no card breaks out of its tier's ceiling.",
      "Cards already in your club keep their old stats; new pulls follow the ladder.",
    ],
  },
  {
    version: "V1.12.1",
    tag: "",
    title: "All cards worth more",
    notes: [
      "Every card market value was raised across the board: the rating-based price of each card on the national-team market, the AI market, listings and quick-sell went up (roughly 55-90% more OVR-based value on top cards), and pack-relative listing/quick-sell values rose about 15-20% too.",
      "The pack rule still holds: a pack's best pulls are worth more than the pack, filler cards are worth less - everything is just worth more now.",
    ],
  },
  {
    version: "V1.12.0",
    tag: "",
    title: "Rare cards priced by packs: MAX, World Cup and Road to Glory are now hugely valuable",
    notes: [
      "MAX, World Cup and Road to Glory cards (the rarest bonus pulls in the game) now have extremely high market and quick-sell values - far above anything else a pack can give you.",
      "Every card that comes out of a pack is now priced against what that pack cost you: the best pulls a pack can deliver are worth more on the market than the pack itself, while the run-of-the-mill fillers are worth less. This applies to all My Club packs and all card rarities.",
      "Cards that didn't come from a pack (national-team market and the AI market's own stock) keep their normal rating-based prices, with the same rare-card price boosts.",
    ],
  },
  {
    version: "V1.11.22",
    tag: "",
    title: "Even stronger camera-relative diagonal",
    notes: [
      "The open-play side camera now turns up to ~69deg toward the goal as you push down the pitch, giving the camera-relative run an even steeper diagonal.",
    ],
  },
  {
    version: "V1.11.21",
    tag: "",
    title: "Stronger camera-relative diagonal on the wing",
    notes: [
      "The open-play side camera now turns deeper toward the goal (max pivot up from ~29deg to ~52deg), so holding W near either end of the pitch carries the player clearly diagonally in the direction the camera faces.",
    ],
  },
  {
    version: "V1.11.20",
    tag: "",
    title: "Movement now follows the camera",
    notes: [
      "WASD is now mapped to the camera frame instead of the pitch's fixed axes: W runs straight up the screen, S down, A/D left/right.",
      "When the side camera pivots toward the goal, holding W now carries you diagonally in the direction the camera faces (e.g. up-right when the camera is looking right), so your run always matches what's on screen.",
    ],
  },
  {
    version: "V1.11.19",
    tag: "",
    title: "Set-piece camera pushed further behind you",
    notes: [
      "The free-kick and penalty camera sits even further back behind the ball and looks a touch more straight down the goal, so the kicker no longer fills the bottom of the frame and the target goal reads more cleanly ahead.",
    ],
  },
  {
    version: "V1.11.18",
    tag: "",
    title: "Free-kick and penalty camera is more directly behind you",
    notes: [
      "The set-piece camera now looks straight down the pitch from just behind the ball (further back and aimed along the field instead of at the goal mouth), so it no longer sits diagonal to the kicker.",
      "The frame is also anchored to the kicker's lane, which pulls the ball, the wall and the target goal to the centre of the screen instead of skewing to one side.",
    ],
  },
  {
    version: "V1.11.17",
    tag: "",
    title: "Goalkeeper stops dodging shots",
    notes: [
      "When a shot is fired at goal, the keeper now drops his run-out immediately and hurries back to the line, diving across the goal mouth much faster - he no longer gets caught out of position or sidestepped by an incoming shot after charging out to meet a dribbler.",
    ],
  },
  {
    version: "V1.11.16",
    tag: "",
    title: "Set-piece camera sits behind the kicker",
    notes: [
      "When you take a free kick or an in-match penalty, the side camera now swings in and plants itself just behind the ball, looking straight at the goal you're attacking - the kicker, any wall and the target all fill the frame while you aim.",
      "After the kick the camera eases back to following the run of play as normal.",
    ],
  },
  {
    version: "V1.11.15",
    tag: "",
    title: "Goalkeepers are a lot quicker",
    notes: [
      "Goalkeepers close down shots and loose balls much quicker: roaming speed up ~65%, and the run-out to meet a dribbler in the box is now genuinely faster than a sprinting striker.",
    ],
  },
  {
    version: "V1.11.14",
    tag: "",
    title: "Keeper charges out to take the ball off you",
    notes: [
      "If you dribble into the penalty box with the ball, the opposing goalkeeper now runs off his line to meet the carrier and claims the ball before you can shoot.",
      "The charge triggers whenever an opponent is carrying the ball inside the box, for both keepers, so strikers killed a one-on-one by simply walking it to the goal line have to beat the keeper again.",
    ],
  },
  {
    version: "V1.11.13",
    tag: "",
    title: "Goalkeeper feels more reliable",
    notes: [
      "The goalkeeper's grab range is slightly bigger, so he claims loose balls a little further out in the box.",
      "The goalkeeper now runs noticeably faster when roaming his area to meet the run of play.",
    ],
  },
  {
    version: "V1.11.12",
    tag: "",
    title: "European games can always be simulated in My Club",
    notes: [
      "The Simulate Match button now stays available for the whole European phase (Champions League, Europa League and Conference League), so you can play through the run match by match instead of only seeing the option on matchdays.",
      "If no European match is ready to simulate (for example while waiting between knockout rounds), the button now explains that instead of silently doing nothing.",
    ],
  },
  {
    version: "V1.11.11",
    tag: "",
    title: "My Club bug fixes",
    notes: [
      "Fixed a glitch where a shot taken right after the goalkeeper kicked the ball out would pass straight through him - the keeper's block now works even during the short recovery window after his clearance.",
      "Fixed a glitch where scoring in the final minutes of a match would play the goal replay/celebration at the start of the next match - the goal sequence is now cleared when a new match begins.",
      "Fixed domestic cup trophies (and the Super Cup) not being awarded when those finals were simulated from the My Club lobby instead of played live - winning the cup by simulation now registers the trophy, title bonus and player honours.",
    ],
  },
  {
    version: "V1.11.10",
    tag: "",
    title: "Better cards are rarer to pull in packs",
    notes: [
      "Packs now draw every card through a weighted picker, so the higher a player's OVR the rarer they are in the same pack - a 99-rated legend is a rare pull, a 60-rated prospect is a common one.",
      "This applies across every pack tier (Prospect, Hero, Special, Icon and MAX) and to role-targeted picks too, so the very best cards in each pack are genuinely harder to find.",
      "MAX cards stay the rarest of all, rarer than any World Cup winner.",
    ],
  },
{
    version: "V1.11.9",
    tag: "",
    title: "The Nation History Pack now mixes every country",
    notes: [
      "No more choosing a single nation - the pack now draws from every nation's history at once, shuffled together like one big international Hall of Fame.",
      "Each card keeps its own true country, so the world's grandest players appear under their real nation, never sorted by where the pack came from.",
      "The country dropdown on the Packs page is gone.",
    ],
  },
  {
    version: "V1.11.9",
    tag: "",
    title: "Better cards are now rarer in packs",
    notes: [
      "Packs draw every card through a weighted picker, so the higher a player's OVR the less often they show up in the same pack - a 98-rated superstar is a rare pull, a 60-rated prospect is a common one.",
      "This applies across every pack tier (Prospect, Hero, Special, Icon, MAX) and to role-targeted picks too, so the very best cards in each pack are genuinely harder to find.",
    ],
  },
  {
    version: "V1.11.8",
    tag: "",
    title: "More MAX cards to hunt for",
    notes: [
      "The MAX bonus pool grows from 10 to 27 all-time greats - Vinicius Jr, Kane, De Bruyne, Rodri, Van Dijk, Salah, Lewandowski, Lautaro, Osimhen, Musiala, Pedri, Rudiger, Hakimi, Alexander-Arnold, Alisson and Oblak join Messi, Ronaldo and the rest (96-99 OVR).",
      "Every MAX player also appears as a scaled base card in Bronze/Silver/Gold packs, just like the Special cards.",
    ],
  },
  {
    version: "V1.11.7",
    title: "MAX cards are now an ultra-rare bonus",
    notes: [
      "The MAX Pack is gone from the shop.",
      "MAX players (96-99 OVR) no longer drop from regular pack rarities or the daily shop - they are now a bonus card type, like Road to Glory and World Cup cards, but the rarest of all: a tiny fraction of bonus pulls, rarer than any World Cup winner.",
      "Bonus MAX cards keep the gold MAX design and never auto-delete.",
    ],
  },
  {
    version: "V1.11.6",
    title: "Duplicate cards survive lineup swaps",
    notes: [
      "Owned 2x/3x duplicates of the same card are no longer merged into 1x when you put one copy in your lineup and take it back out - each copy keeps its own identity.",
      "Fixed a save-reload edge case where the load-time cleanup could rewrite a card sitting in your starting XI into the identity of a different same-named card.",
    ],
  },
  {
    version: "V1.11.5",
    title: "Simulated matches pay out like played ones",
    notes: [
      "Simulated games now award the same coin and XP rewards as matches you play - win bonus plus goal money for every result, so simming a fixture no longer skips your pay.",
      "Removed the MARKET button from lineup cards so the Lineup page is clean.",
    ],
  },
  {
    version: "V1.11.4",
    title: "Lineup swap no longer duplicates players",
    notes: [
      "Fixed a glitch where swapping a squad player into the starting eleven doubled up the player that was swapped out.",
    ],
  },
  {
    version: "V1.11.3",
    title: "Training selection highlights",
    notes: [
      "Cards you pick for training now light up with a yellow border so it's obvious who's selected before you start the session.",
      "Fixed a glitch where the same player could be added to the training list more than once - card identities are now saved with the club, so the selection stays stable and toggling the same card turns it off again.",
    ],
  },
  {
    version: "V1.11.2",
    tag: "",
    title: "My Club squad fixes",
    notes: [
      "Cards no longer duplicate after training, evolving or swapping - the callback list and the pitch copy of every card now stay in sync across saves.",
      "Existing duplicated squads are automatically cleaned up on load: extra spare copies are merged back into a single card, keeping your trained stats and goals.",
      "You can't accidentally inherit another club's bench when you start a brand-new career - each new club starts with an empty bench of its own.",
      "Winning the league in My Club no longer puts a second league trophy in your cabinet - the title is awarded once per season and the Trophies tab shows the right medal and label for each cup you've lifted.",
    ],
  },
  {
    version: "V1.11.1",
    tag: "",
    title: "Side camera polish & scoring",
    notes: [
      "The side camera now anchors at the centre of the pitch and pivots smoothly toward your player down the field, instead of panning - with the stadium rebuilt to match the new angle in real time.",
      "Fixed perspective warping when the player is deep in the opponent's half: touchlines stay straight and shoot away to a proper vanishing point.",
      "Goals are a touch narrower so they read better at the side camera angle.",
      "Way more fans in the stands (about 2.5x as many), all cached so the frame rate is unaffected.",
      "Goalkeepers no longer vacuum up every shot: they hold their line, dive at a realistic speed and cover mainly the middle, so a well-placed hard shot to the corner can actually go into the goal.",
    ],
  },
  {
    version: "V1.11.0",
    tag: "",
    title: "FIFA-style side camera",
    notes: [
      "Brand-new 3D camera: matches now play from a side angle along the long side of the pitch, partially zoomed in and following your player, just like a TV broadcast.",
      "Players animate in full 3D - running, dribbling, kicking, tackling, celebrating - while the field, goal areas, goals and nets all render in real perspective from the touchline.",
      "Press C during a match to switch between the new side camera and the classic 2D top-down view at any time.",
    ],
  },
  {
    version: "V1.10.2",
    tag: "",
    title: "SBC's tab (coming soon)",
    notes: [
      "New SBC's tab added to My Club - Squad Building Challenges are on the way, with an in-game 'coming soon' placeholder for now.",
    ],
  },
  {
    version: "V1.10.1",
    tag: "",
    title: "Market: price drives how fast a card sells",
    notes: [
      "Your listing price now sets the sale speed: undercut the average and the card sells fast, sell around the average and it goes in a few minutes, price it higher and it takes longer.",
      "Price a card too far above its market average and no buyer will pay it - it stays listed until you withdraw or relist it. The Market shows a live prediction as you type your price.",
    ],
  },
  {
    version: "V1.10.0",
    tag: "",
    title: "Player Market",
    notes: [
      "New Market tab, separate from the Shop - a live player market that re-stocks itself every 10 real minutes.",
      "AI listings span bronze to MAX and Icon cards - the rarest cards show up seldom and cost a premium in coins. Some listings linger across refresh cycles, just like a real market.",
      "Instead of only quick-selling, you can now list any of your cards on the Market (MARKET button on cards, or List in the Market tab).",
      "Sales settle in real time, not game time - a card can take a few real minutes to sell, then your club is paid automatically, even if you close the game and come back later.",
      "Withdraw a listing anytime before it sells. Recent sales show at the top of the Market.",
    ],
  },
  {
    version: "V1.9.2",
    tag: "",
    title: "2D camera only",
    notes: [
      "Removed the 3D camera angle from gameplay - matches now always play in the classic 2D top-down view.",
      "The C key camera toggle and its on-screen hints were removed.",
    ],
  },
  {
    version: "V1.9.1",
    tag: "",
    title: "Simulate European knockouts",
    notes: [
      "You can now auto-simulate through the Champions League, Europa League and Conference League knockout rounds.",
      "The date simulator no longer locks during a European campaign - it plays your league-phase games and runs the knockout bracket to completion.",
      "Your knockout legs count toward your squad's season stats, match results and individual awards.",
      "The Trophies tab now shows a dedicated Your Player's Awards section for awards won by your own squad.",
    ],
  },
  {
    version: "V1.9.0",
    tag: "",
    title: "Player Hub",
    notes: [
      "New Player Hub tab in My Club: browse every player in every league.",
      "Search by name and filter by league; sort by overall, name or goals.",
      "Open any player's profile to see their season stats, career stats, individual awards and club honours.",
      "AI-run clubs now track real player statistics as matches are simulated.",
      "Individual awards (Ballon d'Or, Golden Shoe and more) can now be won using real tracked performances instead of estimates.",
    ],
  },
  {
    version: "V1.8.8",
    title: "Bug fixes",
    notes: [
      "Fixed a critical bug that kept the match screen invisible when starting Champions League or My Club matches (the match screen, bracket and modals were accidentally nested inside the hidden My Club screen).",
      "Match, bracket and modal screens are now displayed correctly again.",
    ],
  },
  {
    version: "V1.8.7",
    title: "My Club - bigger careers",
    notes: [
      "Added Training so you can improve your players' stats.",
      "Added Evolutions, with tiers, quests and progress bars.",
      "Added Transfers with AI squads and transfer windows.",
      "Added European competitions for My Club (Champions League route and more).",
      "Added career buffs, momentum, player potential and form systems.",
      "Added match simulation, season-end handling, and club history tracking.",
    ],
  },
  {
    version: "V1.8.6",
    title: "My Club foundations",
    notes: [
      "Start your own club, pick a league, and build a squad.",
      "Open packs, sell cards, and set your lineup.",
      "Play through seasons, win trophies, and manage your club balance.",
    ],
  },
];

function openUpdateLog() {
  const listEl = document.getElementById("updateLogList");
  if (!listEl) return;
  listEl.innerHTML = UPDATE_LOG.map(e =>
    '<div class="updateLogEntry">' +
      '<div class="updateLogEntryHead">' +
        '<span class="updateLogVersion">' + e.version + "</span>" +
        (e.tag ? '<span class="updateLogTag">' + e.tag + "</span>" : "") +
      "</div>" +
      (e.title ? '<div class="updateLogTitle">' + e.title + "</div>" : "") +
      '<ul class="updateLogNotes">' +
        e.notes.map(n => "<li>" + n + "</li>").join("") +
      "</ul>" +
    "</div>"
  ).join("");
  document.getElementById("updateLogModal").style.display = "flex";
}

function closeUpdateLog() {
  document.getElementById("updateLogModal").style.display = "none";
}

function openSettings() {
  const sel = document.getElementById("playerStyleSelect");
  if (sel) sel.value = SETTINGS.oldPlayers ? "old" : "new";
  const amSel = document.getElementById("adminModeSelect");
  if (amSel) amSel.value = SETTINGS.adminMode ? "on" : "off";
  const cSel = document.getElementById("controlsSelect");
  if (cSel) cSel.value = SETTINGS.controls || "pc";
  const dSel = document.getElementById("difficultySelect");
  if (dSel) dSel.value = SETTINGS.difficulty || "normal";
  syncPerfModeControls();
  syncHalfLengthControl();
  syncCrowdControls();
  fillMyClubSettings();
  syncBgGradientControls();
  syncBallJerseyControls();
  fillCLResetSelect();
  updateCLResetHint();
  document.getElementById("settingsModal").style.display = "flex";
}

function closeSettings() {
  document.getElementById("settingsModal").style.display = "none";
}

// Tabbed settings / pause dialogs. Each modal holds a ".tabBar" of ".tabBtn"
// buttons and one "[data-pane]" panel per tab; the controllers swipe between
// them with LB/RB (see pollMenuGamepad in core.js).
function setModalTab(modalId, i) {
  const m = document.getElementById(modalId);
  if (!m) return;
  const btns = Array.prototype.slice.call(m.querySelectorAll(".tabBtn"));
  if (!btns.length) return;
  const n = btns.length;
  const idx = ((i % n) + n) % n;
  btns.forEach((b, k) => b.classList.toggle("active", k === idx));
  const panes = Array.prototype.slice.call(m.querySelectorAll("[data-pane]"));
  panes.forEach((p, k) => {
    p.style.display = k === idx ? "block" : "none";
  });
  // Re-root the pad's focus on this dialog and land it on the first control of
  // the pane just revealed, so an LB/RB swipe never strands the ring on a
  // control that is now hidden.
  if (typeof uiRefreshFocus === "function") uiRefreshFocus();
  if (typeof uiFocusEl === "function") {
    const pane = panes[idx];
    const first = pane ? pane.querySelector(UI_NAV_SELECTOR) : null;
    uiFocusEl(first || btns[idx]);
  }
}

function setPauseTab(i) { setModalTab("pauseModal", i); }
function setSettingsTab(i) { setModalTab("settingsModal", i); }

function uiActiveTab(overlay) {
  if (!overlay) return -1;
  const btns = overlay.querySelectorAll(".tabBtn");
  for (let k = 0; k < btns.length; k++) {
    if (btns[k].classList.contains("active")) return k;
  }
  return -1;
}

function uiTabCycle(delta) {
  const ov = uiTopOverlay();
  if (!ov) return false;
  if (ov.id === "pauseModal") { setPauseTab(uiActiveTab(ov) + delta); return true; }
  if (ov.id === "settingsModal") { setSettingsTab(uiActiveTab(ov) + delta); return true; }
  return false;
}

function applyPlayerStyle() {
  const sel = document.getElementById("playerStyleSelect");
  SETTINGS.oldPlayers = sel ? sel.value === "old" : false;
  saveSettings();
}

// Low-effects mode: a single html.perfLow class strips the heaviest page-wide
// effects (full-screen animated gradients and backdrop blurs) so weak/old
// devices and software renderers can keep up. The CSS lives at the end of
// css/style.css.
function applyPerfModeClass() {
  const on = !!SETTINGS.perfMode;
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.classList.toggle("perfLow", on);
  }
}

function syncPerfModeControls() {
  const sel = document.getElementById("perfModeSelect");
  if (sel) sel.value = SETTINGS.perfMode ? "on" : "off";
}

function applyPerfMode() {
  const sel = document.getElementById("perfModeSelect");
  SETTINGS.perfMode = sel ? sel.value === "on" : false;
  saveSettings();
  applyPerfModeClass();
}

// Software rasterisers (SwiftShader / llvmpipe / basic) can't composite the
// full-screen effects at a smooth frame rate, so we switch low-effects mode on
// up front instead of waiting for the frames to stutter.
function detectSoftwareGL() {
  try {
    if (typeof document === "undefined") return false;
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
    if (!gl) return false;
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const rs = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "";
    return /swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(rs);
  } catch (e) {
    return false;
  }
}

// Turn low-effects mode on automatically when the device clearly can't keep up:
// software rendering (immediate) or a sustained sub-35fps average after the boot.
function startPerfAutoDetect() {
  if (typeof window === "undefined" || typeof requestAnimationFrame !== "function") return;
  if (SETTINGS.perfMode) return;
  if (detectSoftwareGL()) {
    SETTINGS.perfMode = true;
    saveSettings();
    applyPerfModeClass();
    syncPerfModeControls();
    return;
  }
  // Skip the boot cinematic (its own intro animation can dip the frame rate),
  // then measure a steady window and only trip on a clearly bad average.
  let frames = 0;
  let t0 = 0;
  const startAt = performance.now();
  const WARMUP = 2500;
  const WINDOW = 2500;
  function sample() {
    if (!t0) {
      if (performance.now() < startAt + WARMUP) { requestAnimationFrame(sample); return; }
      t0 = performance.now();
    }
    frames++;
    const elapsed = performance.now() - t0;
    if (elapsed < WINDOW) { requestAnimationFrame(sample); return; }
    const fps = frames / (elapsed / 1000);
    if (fps < 35 && !SETTINGS.perfMode) {
      SETTINGS.perfMode = true;
      saveSettings();
      applyPerfModeClass();
      syncPerfModeControls();
    }
  }
  requestAnimationFrame(sample);
}

applyPerfModeClass();
if (typeof window !== "undefined") {
  if (document.readyState === "complete") startPerfAutoDetect();
  else window.addEventListener("load", startPerfAutoDetect, { once: true });
}

function updateAdminButtonVisibility() {
  const show = !!SETTINGS.adminMode;
  document.querySelectorAll(".adminToggle").forEach(b => {
    b.style.display = show ? "" : "none";
  });
}

function applyAdminMode() {
  const sel = document.getElementById("adminModeSelect");
  setAdminMode(sel ? sel.value === "on" : false);
  fillMyClubSettings();
}

function setAdminMode(enabled) {
  if (enabled && !passAdminPinGate()) {
    syncAdminModeControls(false);
    return;
  }
  SETTINGS.adminMode = !!enabled;
  const sel = document.getElementById("adminModeSelect");
  if (sel) sel.value = enabled ? "on" : "off";
  saveSettings();
  updateAdminButtonVisibility();
  renderHomeAdminToggle();
}

// Turning admin ON requires the PIN. The first time a PIN is stored, the user
// picks it; after that every enable asks for the stored one.
function passAdminPinGate() {
  const stored = SETTINGS.adminPin || "";
  if (!stored) {
    const s = prompt("Admin now needs a PIN. Choose one to protect it:");
    const v = s && s.trim();
    if (!v) return false;
    SETTINGS.adminPin = v;
    saveSettings();
    return true;
  }
  for (let t = 0; t < 3; t++) {
    const s = prompt("Enter Admin PIN:");
    if (s === null) return false;
    if (s.trim() === stored) return true;
    if (t === 2) alert("Incorrect Admin PIN. Admin mode stays off.");
  }
  return false;
}

function syncAdminModeControls(enabled) {
  SETTINGS.adminMode = !!enabled;
  const sel = document.getElementById("adminModeSelect");
  if (sel) sel.value = enabled ? "on" : "off";
  saveSettings();
  updateAdminButtonVisibility();
  renderHomeAdminToggle();
}

function applyDifficulty() {
  const sel = document.getElementById("difficultySelect");
  SETTINGS.difficulty = sel ? sel.value : "normal";
  saveSettings();
}

function syncCrowdControls() {
  const a = document.getElementById("crowdAudioSelect");
  if (a) a.value = crowdAudioSetting() ? "on" : "off";
  const v = document.getElementById("crowdVolumeInput");
  if (v) v.value = Math.round(crowdVolumeSetting() * 100);
  const c = document.getElementById("commentarySelect");
  if (c) c.value = commentarySetting() ? "on" : "off";
}

function applyCrowdSettings() {
  const a = document.getElementById("crowdAudioSelect");
  const v = document.getElementById("crowdVolumeInput");
  const c = document.getElementById("commentarySelect");
  SETTINGS.crowdAudio = a ? a.value !== "off" : true;
  if (v && typeof parseFloat(v.value) === "number") SETTINGS.crowdVolume = Math.max(0, Math.min(100, parseFloat(v.value)));
  SETTINGS.commentary = c ? c.value !== "off" : true;
  saveSettings();
  if (sfxMaster) sfxMaster.gain.value = crowdVolumeSetting();
  if (SETTINGS.crowdAudio) sfxUnlock();
  if (!SETTINGS.commentary) commentaryQueue.length = 0;
}

function toggleCrowdMute() {
  SETTINGS.crowdAudio = !SETTINGS.crowdAudio;
  saveSettings();
  syncCrowdControls();
  if (SETTINGS.crowdAudio) sfxUnlock();
  if (typeof updateControlsHint === "function") updateControlsHint();
}

// Multiplier for AI-opponent intensity in offline matches. Always 1 online:
// there the "opponent" IS the other human, and the lockstep sim must never
// depend on client-local settings or the two peers could drift apart.
function getDifficultyScale() {
  if (typeof netLockstepActive === "function" && netLockstepActive()) return 1;
  const d = (typeof SETTINGS !== "undefined" && SETTINGS.difficulty) || "normal";
  return d === "easy" ? 0.88 : d === "hard" ? 1.12 : 1;
}

function toggleHomeAdminMode() {
  setAdminMode(!SETTINGS.adminMode);
}

function applyControls() {
  const sel = document.getElementById("controlsSelect");
  SETTINGS.controls = sel ? sel.value : "pc";
  saveSettings();
  applyControlsScheme();
}

function currentScheme() {
  return (SETTINGS && SETTINGS.controls) || "pc";
}

function renderHomeAdminToggle() {
  const btn = document.getElementById("homeAdminModeBtn");
  if (btn) btn.classList.toggle("on", !!SETTINGS.adminMode);
}

function openAdminPanel() {
  if (!SETTINGS.adminMode) return;
  const pre = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v === null || v === undefined ? "" : v;
  };
  if (player) {
    pre("adminPace", Math.round(player.pace));
    pre("adminShooting", Math.round(player.shooting));
    pre("adminPassing", Math.round(player.passing));
    pre("adminDribbling", Math.round(player.dribbling));
    pre("adminDefending", Math.round(player.defending));
    pre("adminPhysical", Math.round(player.physical));
  }
  const msg = document.getElementById("adminMsg");
  if (msg) msg.textContent = "";
  document.getElementById("adminModal").style.display = "flex";
}

function closeAdminPanel() {
  document.getElementById("adminModal").style.display = "none";
}

function adminMsg(text) {
  const el = document.getElementById("adminMsg");
  if (el) el.textContent = text;
}

function adminAddGoal(team) {
  if (team !== "blue" && team !== "red") return;
  if (!matchRunning) {
    adminMsg("Start a match first, then use +1 Goal.");
    return;
  }
  goalScored(team);
  adminMsg(team === "blue" ? "Goal added to your team!" : "Goal added to the opponent!");
}

function adminAddCoins() {
  playerCoins += 1000000;
  saveClubState();
  const mm = document.getElementById("marketMenuButton");
  if (mm) mm.textContent = "Transfer Market & Squad (" + formatMoney(playerCoins) + ")";
  const mb = document.getElementById("marketBalance");
  if (mb) mb.textContent = "Balance: " + formatMoney(playerCoins);
  const eb = document.getElementById("editorBalance");
  if (eb) eb.textContent = "Balance: " + formatMoney(playerCoins);
  adminMsg("+1,000,000 coins added!");
}

function adminAddLevel() {
  if (currentMode !== "myclub") {
    adminMsg("My Club only - start a My Club career first.");
    return;
  }
  const c = getMyClubCareer(myClubLeague);
  if (!c) {
    adminMsg("No My Club career to level up.");
    return;
  }
  c.level++;
  playerCoins += 75000 + c.level * 25000;
  c.coins = playerCoins;
  if (!Array.isArray(c.consumables)) c.consumables = [];
  c.consumables.push(myClubRollConsumable());
  saveClubState();
  saveMyClubData();
  pendingLevelUp = { levels: 1, reached: c.level };
  myClubRefreshHeader();
  adminMsg("My Club leveled up to level " + c.level + "!");
}

function adminInstantWin() {
  if (!matchRunning) {
    if (awaitingStart) {
      kickoffIntro = 0;
      beginMatch();
    } else {
      adminMsg("Start a match first to use Instant Win.");
      return;
    }
  }
  if (blueScore <= redScore) blueScore = redScore + 1;
  endMatch();
  adminMsg("Instant win!");
}

function adminSkipHalf() {
  if (matchPhase === "penalties") {
    adminMsg("Penalties are live - skip is not available.");
    return;
  }
  if (breakPhase) {
    const done = breakPhase.onDone;
    breakPhase = null;
    if (done) done();
    adminMsg("Break skipped.");
    return;
  }
  if (!matchRunning) {
    if (awaitingStart) {
      kickoffIntro = 0;
      beginMatch();
      adminMsg("Match started.");
    } else {
      adminMsg("Start a match first.");
    }
    return;
  }
  const label =
    matchPhase === "normal" && clockHalf === 1 ? "1st half" :
    matchPhase === "normal" ? "2nd half" :
    matchPhase === "extra" && clockHalf === 3 ? "1st half of extra time" :
    matchPhase === "extra" ? "2nd half of extra time" :
    null;
  if (!label) {
    adminMsg("Nothing to skip.");
    return;
  }
  if (matchPhase === "normal" && clockHalf === 1) {
    startSecondHalf();
  } else if (matchPhase === "extra" && clockHalf === 3) {
    startSecondETHalf();
  } else {
    timerFinished();
  }
  adminMsg("Skipped " + label + ".");
}

function adminEndGame() {
  if (matchPhase === "penalties") {
    adminMsg("Finish the shootout first.");
    return;
  }
  if (!matchRunning) {
    adminMsg("Start a match first.");
    return;
  }
  endMatch();
  adminMsg("Game ended.");
}

function adminApplyStats() {
  const read = id => {
    const el = document.getElementById(id);
    const v = parseInt(el ? el.value : "60", 10);
    return Math.max(1, Math.min(99, isNaN(v) ? 60 : v));
  };
  const stats = {
    pace: read("adminPace"),
    shooting: read("adminShooting"),
    passing: read("adminPassing"),
    dribbling: read("adminDribbling"),
    defending: read("adminDefending"),
    physical: read("adminPhysical")
  };
  if (!player) {
    adminMsg("No player loaded to edit.");
    return;
  }
  player.pace = stats.pace;
  player.shooting = stats.shooting;
  player.passing = stats.passing;
  player.dribbling = stats.dribbling;
  player.defending = stats.defending;
  player.physical = stats.physical;
  player.speed = computeSpeed(player.pace, player.physical);
  player.overall = calculateOverall(player, player.role || "attacker");
  const r = TEAM_ROSTERS[selectedTeam];
  if (r && r.attackers && r.attackers[2]) {
    const human = r.attackers[2];
    human.pace = stats.pace;
    human.shooting = stats.shooting;
    human.passing = stats.passing;
    human.dribbling = stats.dribbling;
    human.defending = stats.defending;
    human.physical = stats.physical;
    saveClubState();
  }
  adminMsg("Stats applied - your overall is now " + player.overall + ".");
}

updateAdminButtonVisibility();
renderHomeAdminToggle();
function restoreRosterDefaults(team) {
  const d = clubDefaults[team];
  const r = TEAM_ROSTERS[team];
  if (!d || !r) return;
  r.goalkeeper = JSON.parse(JSON.stringify(d.goalkeeper));
  r.defenders = JSON.parse(JSON.stringify(d.defenders));
  r.midfielders = JSON.parse(JSON.stringify(d.midfielders));
  r.attackers = JSON.parse(JSON.stringify(d.attackers));
}

function fillCLResetSelect() {
  const sel = document.getElementById("clResetSelect");
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML =
    '<option value="all">All CL clubs</option>' +
    teams.map(t => '<option value="' + escapeHtml(t) + '">' + escapeHtml(t) + '</option>').join("");
  if (prev && Array.prototype.slice.call(sel.options).some(o => o.value === prev)) {
    sel.value = prev;
  }
  updateCLResetHint();
}

function updateCLResetHint() {
  const sel = document.getElementById("clResetSelect");
  const hint = document.getElementById("clResetHint");
  if (!hint) return;
  const v = sel ? sel.value : "all";
  hint.textContent = v === "all"
    ? "Wipes every Champions League club's squad, coins and market progress, then starts a fresh tournament."
    : "Wipes " + v + "'s squad, coins and market progress. The rest of the tournament stays untouched.";
}

function resetChampionsClub() {
  const sel = document.getElementById("clResetSelect");
  const target = sel ? sel.value : "all";
  if (target === "all") {
    if (!confirm("Reset ALL Champions League clubs? This erases every club's squad, coins and market progress and starts a fresh tournament.")) return;
    try {
      for (const team of teams) {
        const r = TEAM_ROSTERS[team];
        if (!r) continue;
        if (!clubDefaults[team]) snapshotClubDefaults(team);
        try { localStorage.removeItem(clubStorageKey(team)); } catch (e) {}
        restoreRosterDefaults(team);
      }
    } catch (e) {}
    playerCoins = DEFAULT_CLUB_COINS;
    ownedPool = [];
    marketCards = [];
    marketCategory = "all";
    DARK_HORSES = [];
    restartTournament();
    const home = document.getElementById("modeSelectScreen");
    if (home) home.style.display = "none";
    closeSettings();
    return;
  }
  if (teams.indexOf(target) === -1) return;
  if (!confirm("Reset " + target + "? This erases its squad, coins and market progress.")) return;
  if (!clubDefaults[target]) snapshotClubDefaults(target);
  try { localStorage.removeItem(clubStorageKey(target)); } catch (e) {}
  restoreRosterDefaults(target);
  if (currentMode === "champions" && selectedTeam === target) {
    loadClubStateFor(target);
    refreshSponsorSection();
    updateSponsorUi();
    const mm = document.getElementById("marketMenuButton");
    if (mm) mm.textContent = "Transfer Market & Squad (" + formatMoney(playerCoins) + ")";
    const mb = document.getElementById("marketMenuButton");
    if (mb) mb.disabled = false;
  }
}

function resetMyClubCareer() {
  if (!myClubLeague) return;
  const c = getMyClubCareer(myClubLeague);
  if (!c) return;
  if (!confirm("Reset " + c.clubName + "? This permanently erases this My Club save (squad, coins, managers, season progress).")) return;
  const list = myClubCareerData.careers[c.league];
  if (Array.isArray(list)) {
    const idx = list.indexOf(c);
    if (idx !== -1) list.splice(idx, 1);
  }
  try { localStorage.removeItem(clubStorageKey(c.clubName)); } catch (e) {}
  delete TEAM_ROSTERS[c.clubName];
  delete clubDefaults[c.clubName];
  saveMyClubData();
  closeSettings();
  if (currentMode === "myclub") {
    document.getElementById("myClubScreen").style.display = "none";
    selectedTeam = null;
    openMyClubSetup();
  }
}

function projectPoint(gx, gy) {

  if (cam2d) {
    return { x: VPR + (gx - W / 2) * 0.85, y: H / 2 + (gy - H / 2) * 0.85, s: 1, depth: gy };
  }

  // FIFA-style side camera: world X runs left/right and world Y becomes depth
  // (near touchline = bottom, far touchline = horizon). The camera base sits
  // at the middle of the field and the whole frame is rotated by camPivot so
  // the view turns toward the player. depth grows with distance from the
  // camera, which is what the painter's distance sort relies on (far first).
  const nearY = field.y + field.height;
  const xc = gx - camSmoothX;
  const yc = camLat0 - gy;
  const lat = xc * PIVOT_C - yc * PIVOT_S;
  const fwd = xc * PIVOT_S + yc * PIVOT_C;
  const depth = fwd + SIDE_FOCAL;

  if (depth < 60) return null;

  const inv = 1 / depth;

  const scale = Math.min(SIDE_MAXSCALE, SIDE_FOCAL * inv);

  return {
    x: VPR + (lat * SIDE_PAN * SIDE_FOCAL * inv) * camZoom,
    y: HORIZON_Y + ((SIDE_CAM_H * SIDE_FOCAL) * inv) * camZoom,
    s: scale * camZoom,
    depth
  };

}

function proj3(x, y, z) {
  if (cam2d) {
    return { x: VPR + (x - W / 2) * 0.85, y: H / 2 + (y - H / 2 - z * 0.12) * 0.85, s: 1, depth: y };
  }
  // Side camera: same mapping as projectPoint (anchored + pivoting), plus
  // vertical z lifts the projected point up the screen by z * scale (used by
  // players, ball, goals and the stadium bowl).
  const nearY = field.y + field.height;
  const xc = x - camSmoothX;
  const yc = camLat0 - y;
  const lat = xc * PIVOT_C - yc * PIVOT_S;
  const fwd = xc * PIVOT_S + yc * PIVOT_C;
  const depth = fwd + SIDE_FOCAL;
  if (depth < 60) return null;
  const inv = 1 / depth;
  let scale = SIDE_FOCAL * inv;
  if (scale > SIDE_MAXSCALE) scale = SIDE_MAXSCALE;
  return {
    x: VPR + (lat * SIDE_PAN * SIDE_FOCAL * inv) * camZoom,
    y: HORIZON_Y + (((SIDE_CAM_H * SIDE_FOCAL) * inv) - (z * scale)) * camZoom,
    s: scale * camZoom,
    depth
  };
}

const shadeColorCache = new Map();

function shadeColor(hex, b) {
  const key = hex + "|" + b.toFixed(2);
  const hit = shadeColorCache.get(key);
  if (hit) return hit;
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * b));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * b));
  const bl = Math.min(255, Math.round((n & 255) * b));
  const out = "rgb(" + r + "," + g + "," + bl + ")";
  if (shadeColorCache.size >= 8192) shadeColorCache.clear();
  shadeColorCache.set(key, out);
  return out;
}

function boxFaces(cx, cy, z0, w, h, d) {
  const x0 = cx - d / 2, x1 = cx + d / 2;
  const y0 = cy - w / 2, y1 = cy + w / 2;
  const z1 = z0 + h;
  return [
    [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]],
    [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]],
    [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]],
    [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]],
    [[x0, y0, z0], [x0, y0, z1], [x1, y0, z1], [x1, y0, z0]],
    [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]
  ];
}

function prismFaces(x0, y0, z0, x1, y1, z1) {
  return [
    [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]],
    [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]],
    [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]],
    [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]],
    [[x0, y0, z0], [x0, y0, z1], [x1, y0, z1], [x1, y0, z0]],
    [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]
  ];
}

function shadedFaces(wfaces, baseColor) {
  const out = [];
  for (const face of wfaces) {
    const pts = [];
    let dep = 0;
    for (const wp of face) {
      const p = proj3(wp[0], wp[1], wp[2]);
      if (!p) { pts.length = 0; break; }
      pts.push({ x: p.x, y: p.y });
      dep += p.depth;
    }
    if (!pts.length) continue;
    dep /= pts.length;
    const A = face[0], B = face[1], C = face[2];
    let nx = (B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]);
    let ny = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]);
    let nz = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
    const nl = Math.hypot(nx, ny, nz) || 1;
    nx /= nl; ny /= nl; nz /= nl;
    const b = 0.62 + Math.max(0, nz) * 0.3 + Math.max(0, -ny) * 0.12;
    out.push({ pts, dep, color: shadeColor(baseColor, b) });
  }
  return out;
}

function paintFaces(faces) {
  if (!faces.length) return;
  faces.sort((a, b) => b.dep - a.dep);
  for (const f of faces) {
    SCTX.beginPath();
    SCTX.moveTo(f.pts[0].x, f.pts[0].y);
    for (let i = 1; i < f.pts.length; i++) SCTX.lineTo(f.pts[i].x, f.pts[i].y);
    SCTX.closePath();
    SCTX.fillStyle = f.color;
    SCTX.fill();
  }
}

function drawSolid(wfaces, baseColor) {
  paintFaces(shadedFaces(wfaces, baseColor));
}

function drawSphere(cx, cy, czz, r, c1, c2) {
  const c = proj3(cx, cy, czz);
  if (!c) return;
  const rad = Math.max(1, r * c.s);
  const g = SCTX.createRadialGradient(c.x - rad * 0.35, c.y - rad * 0.4, rad * 0.15, c.x, c.y, rad);
  g.addColorStop(0, c1);
  g.addColorStop(0.55, c2);
  g.addColorStop(1, shadeColor(c2, 0.72));
  SCTX.beginPath();
  SCTX.arc(c.x, c.y, rad, 0, Math.PI * 2);
  SCTX.fillStyle = g;
  SCTX.fill();
}

// Flat fill for tiny body parts (hands) - a radial gradient every frame on a
// few-pixel circle is wasted work on low-end laptops.
function drawDot(cx, cy, czz, r, color) {
  const c = proj3(cx, cy, czz);
  if (!c) return;
  const rad = Math.max(1, r * c.s);
  SCTX.beginPath();
  SCTX.arc(c.x, c.y, rad, 0, Math.PI * 2);
  SCTX.fillStyle = color;
  SCTX.fill();
}

function crowdOnFace(A, B, C, D, count, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const u = (i + 0.5) / count;
    const v = 0.72 + ((i * 7) % 3) * 0.09;
    const wx = A[0] + (B[0] - A[0]) * u;
    const wy = A[1] + (B[1] - A[1]) * u;
    const wz = ((C[2] + D[2]) / 2) * v;
    const p = proj3(wx, wy, wz);
    if (!p) continue;
    const s = Math.max(1, p.s);
    ctx.fillRect(p.x + ((i * 17) % 4) * s * 0.4, p.y, s * 4.5, s * 6.5);
  }
}

function crowdOnDeck(A, B, C, D, count, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const u = (i + 0.5) / count;
    const v = 0.1 + ((i * 11) % 3) * 0.08;
    const wx = A[0] + (B[0] - A[0]) * u;
    const wy = A[1] + (D[1] - A[1]) * v;
    const wz = A[2] + 0.5;
    const p = proj3(wx, wy, wz);
    if (!p) continue;
    const s = Math.max(1, p.s);
    ctx.fillRect(p.x, p.y, s * 4, s * 6.5);
}
}

function updateCamera() {
  const nowMs = performance.now();
  autoCamLastT = nowMs;

  let targetX;
  let targetY;
  let t = 0.06;
  let latTarget = field.y + field.height;
  const centerX = field.x + field.width / 2;
  const focusBall = goalPhase === "replay" || goalPhase === "celebrate" || offsideReplay || localPlayer.sentOff;
  const focusX = focusBall ? ball.x : localPlayer.x;
  const myFK = !!(freekick && freekick.taker === localPlayer);
  const myPK = !!(matchPenalty && matchPenalty.taker === localPlayer);

  // ---- Set-piece camera (side view only) ----
  // When the human is about to take the free kick or the penalty, plant the
  // camera straight behind the ball looking down the pitch, with the frame
  // laterally anchored on the kicker's lane so the ball, wall and the target
  // goal all sit squarely on screen instead of skewing to one side. The 2D
  // view already keeps the player bottom-centre with the goal ahead, so it
  // is left alone here.
  // ---- Cutscene framing ----
  // A cutscene takes the camera over completely: the sim is paused anyway, so
  // the usual follow/zoom logic just has to stand aside.
  const cs = cutsceneShot();
  if (cs) {
    const fx = field.x + field.width * cs.fx;
    const fy = field.y + field.height * cs.fy;
    targetX = cam2d ? fx - CAM_BACK : fx;
    targetY = fy;
    latTarget = fy;
    const pivotT = Math.max(-SIDE_PIVOT_CAP, Math.min(SIDE_PIVOT_CAP, (cs.fx - 0.5) * 2 * SIDE_PIVOT_MAX));
    camPivot += (pivotT - camPivot) * 0.06;
    camZoom += (cs.zoom - camZoom) * 0.05;
    t = 0.07;
  } else if (!cam2d && (myFK || myPK) && goalPhase !== "replay" && goalPhase !== "celebrate") {

    const sp = myFK ? freekick : matchPenalty;

    const aimX = sp.team === "red" ? field.x : field.x + field.width;

    const dx = aimX - sp.x;

    const len = Math.hypot(dx, 0) || 1;

    const e = dx / len;

    const BACK = 520;

    targetX = sp.x - e * BACK;

    targetY = sp.y;

    camPivot += (Math.max(-Math.PI / 2, Math.min(Math.PI / 2, Math.atan2(dx, 0))) - camPivot) * 0.1;

    latTarget = sp.y;

    t = 0.1;

  } else if (goalPhase === "replay" || offsideReplay) {
    // Cinematic replay framing: track the ball.
    targetY = ball.y;
    t = 0.09;
  } else if (goalPhase === "celebrate") {
    targetY = celebrationSpot.y;
    t = 0.07;
  } else if (localPlayer.sentOff) {
    // Sent off: the user watches the game unfold, not the bench.
    targetY = ball.y;
  } else {
    targetY = localPlayer.y;
  }

  if (cs) {
    // targetX/targetY/camZoom/camPivot were all set by the cutscene branch.
  } else if (cam2d) {
    targetX = localPlayer.x - CAM_BACK;
    camPivot += (0 - camPivot) * t;
  } else if (!(myFK || myPK)) {
    // Side camera: the base is fixed at the middle of the field...
    targetX = centerX;
    let pivotFocus = focusX;
    let zoomMax = SIDE_ZOOM_MAX;
    if (autoCameraSetting() !== "off" && !cam2d) {
      // Smart follow: lead the frame toward whoever is nearest the ball, and
      // pull back to a wider view whenever you're the one doing the chasing.
      const near = nearestPlayerToBall();
      const chasing = near !== localPlayer;
      pivotFocus = chasing && near ? (near.x * 0.6 + localPlayer.x * 0.4) : localPlayer.x;
      zoomMax = chasing ? 1.12 : SIDE_ZOOM_MAX;
      if (Math.abs(ball.x - localPlayer.x) > field.width * 0.34) zoomMax = Math.min(zoomMax, 1.05);
    }
    // ...and the view pivots toward the player whenever they're downfield.
    const pivotQ = Math.max(-1, Math.min(1, (pivotFocus - centerX) / (field.width / 2)));
    const pivotTarget = pivotQ * SIDE_PIVOT_MAX;
    camPivot += (Math.max(-SIDE_PIVOT_CAP, Math.min(SIDE_PIVOT_CAP, pivotTarget)) - camPivot) * t;
    // Zoom in the further the player pushes downfield: 1.0 (base view) at the
    // halfway line, zoomMax when they reach the goal line.
    const zoomQ = Math.max(0, Math.min(1, Math.abs(pivotFocus - centerX) / (field.width / 2)));
    const zoomTarget = 1 + (zoomMax - 1) * zoomQ;
    camZoom += (zoomTarget - camZoom) * t;
  }

  camSmoothX += (targetX - camSmoothX) * t;

  camSmoothY += (targetY - camSmoothY) * t;

  camLat0 += (latTarget - camLat0) * 0.1;

  // Side camera: keep the pan inside the pitch so the touchline never gaps
  // out and the whole field is never framed at once. The visible half-width
  // shrinks as camZoom rises, so the clamp follows the live zoom level.
  // Set-pieces are exempt: their camera plants itself a fixed distance behind
  // the ball which can sit off the pitch when the kick is close to your own
  // goal - clamping there shoves the ball down to the bottom of the screen.
  if (!cam2d && !(myFK || myPK)) {
    const visHalf = (W / SIDE_PAN) / 2 / camZoom;
    const lo = field.x + visHalf;
    const hi = field.x + field.width - visHalf;
    if (hi > lo) {
      if (camSmoothX < lo) camSmoothX = lo;
      if (camSmoothX > hi) camSmoothX = hi;
    }
  }

  PIVOT_C = Math.cos(camPivot);

  PIVOT_S = Math.sin(camPivot);

  prevPlayerX = player.x;

  prevPlayerY = player.y;

}

function worldLine(x1, y1, x2, y2) {

  const a = projectPoint(x1, y1);

  const b = projectPoint(x2, y2);

  if (!a || !b) return;

  ctx.beginPath();

  ctx.moveTo(a.x, a.y);

  ctx.lineTo(b.x, b.y);

  ctx.stroke();

}

function worldCircle(cx, cy, r) {

  const c = projectPoint(cx, cy - 0);

  if (!c) return;

  const steps = 40;

  ctx.beginPath();

  for (let i = 0; i <= steps; i++) {

    const a = (i / steps) * Math.PI * 2;

    const wx = cx + Math.cos(a) * r;

    const wy = cy + Math.sin(a) * r;

    const p = projectPoint(wx, wy);

    if (!p) continue;

    if (i === 0) ctx.moveTo(p.x, p.y);

    else ctx.lineTo(p.x, p.y);

  }

  ctx.stroke();

}

function worldArc(cx, cy, r, a0, a1) {

  const steps = 20;

  ctx.beginPath();

  let started = false;

  for (let i = 0; i <= steps; i++) {

    const a = a0 + ((a1 - a0) * i) / steps;

    const wx = cx + Math.cos(a) * r;

    const wy = cy + Math.sin(a) * r;

    const p = projectPoint(wx, wy);

    if (!p) { started = false; continue; }

    if (!started) { ctx.moveTo(p.x, p.y); started = true; }

    else ctx.lineTo(p.x, p.y);

  }

  ctx.stroke();

}

function drawCornerFlag(cx, cy) {

  const base = proj3(cx, cy, 0);

  const A = proj3(cx, cy, 132);

  const B = proj3(cx, cy, 96);

  if (!base || !A || !B) return;

  const dx = Math.sign(field.x + field.width / 2 - cx) || 1;

  const dy = Math.sign(field.y + field.height / 2 - cy) || 1;

  const C = proj3(cx + dx * 44, cy + dy * 44, 112);

  if (!C) return;

  ctx.fillStyle = "rgba(237,64,40,0.95)";

  ctx.strokeStyle = "rgba(215,45,25,0.9)";

  ctx.lineWidth = Math.max(2, A.s * 4);

  ctx.beginPath();

  ctx.moveTo(A.x, A.y);

  ctx.lineTo(C.x, C.y);

  ctx.lineTo(B.x, B.y);

  ctx.closePath();

  ctx.fill();

  ctx.stroke();

  ctx.beginPath();

  ctx.moveTo(base.x, base.y);

  ctx.lineTo(A.x, A.y);

  ctx.stroke();

}

function drawField() {

  if (cam2d) {
    drawField2D();
    return;
  }

  // Sky gradient (cached - HORIZON_Y is constant, so one object is reused)
  const skyFill = HORIZON_Y + 60;
  if (!SKY_GRAD || SKY_FILL !== skyFill) {
    SKY_GRAD = ctx.createLinearGradient(0, 0, 0, skyFill);
    SKY_GRAD.addColorStop(0, "#1b3a5b");
    SKY_GRAD.addColorStop(1, "#2f6b4f");
    SKY_FILL = skyFill;
  }
  ctx.fillStyle = SKY_GRAD;
  ctx.fillRect(0, 0, W, skyFill);

  ctx.fillStyle = "#16833b";
  ctx.fillRect(0, skyFill, W, H - skyFill);

  drawStadium();

  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";

  // Boundary
  worldLine(field.x, field.y, field.x + field.width, field.y);
  worldLine(field.x + field.width, field.y, field.x + field.width, field.y + field.height);
  worldLine(field.x + field.width, field.y + field.height, field.x, field.y + field.height);
  worldLine(field.x, field.y + field.height, field.x, field.y);

  // Halfway line
  worldLine(PITCH_CX, field.y, PITCH_CX, field.y + field.height);

  // Center circle
  worldCircle(PITCH_CX, PITCH_CY, 210);

  // Center spot
  const cs = projectPoint(PITCH_CX, PITCH_CY);
  if (cs) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(cs.x, cs.y, Math.max(2, cs.s * 5), 0, Math.PI * 2);
    ctx.fill();
  }

  // Penalty areas
  worldLine(field.x, 450, field.x + PBOX_DEPTH, 450);
  worldLine(field.x + PBOX_DEPTH, 450, field.x + PBOX_DEPTH, 1050);
  worldLine(field.x + PBOX_DEPTH, 1050, field.x, 1050);
  worldLine(field.x, 1050, field.x, 450);

  const ra = field.x + field.width - PBOX_DEPTH;
  worldLine(ra, 450, field.x + field.width, 450);
  worldLine(field.x + field.width, 450, field.x + field.width, 1050);
  worldLine(field.x + field.width, 1050, ra, 1050);
  worldLine(ra, 1050, ra, 450);

  // Goal areas (six-yard boxes)
  worldLine(field.x, 600, field.x + GOAL_AREA_DEPTH, 600);
  worldLine(field.x + GOAL_AREA_DEPTH, 600, field.x + GOAL_AREA_DEPTH, 900);
  worldLine(field.x + GOAL_AREA_DEPTH, 900, field.x, 900);
  const ga2 = field.x + field.width - GOAL_AREA_DEPTH;
  worldLine(field.x + field.width, 600, ga2, 600);
  worldLine(ga2, 600, ga2, 900);
  worldLine(ga2, 900, field.x + field.width, 900);

  // Penalty spots
  const spot1 = projectPoint(field.x + PBOX_DEPTH - 120, H / 2);
  if (spot1) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(spot1.x, spot1.y, Math.max(2, spot1.s * 5), 0, Math.PI * 2);
    ctx.fill();
  }
  const spot2 = projectPoint(field.x + field.width - PBOX_DEPTH + 120, H / 2);
  if (spot2) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(spot2.x, spot2.y, Math.max(2, spot2.s * 5), 0, Math.PI * 2);
    ctx.fill();
  }

  // Corner arcs
  worldArc(field.x, field.y, 55, 0, Math.PI / 2);
  worldArc(field.x + field.width, field.y, 55, Math.PI / 2, Math.PI);
  worldArc(field.x, field.y + field.height, 55, (3 * Math.PI) / 2, 2 * Math.PI);
  worldArc(field.x + field.width, field.y + field.height, 55, Math.PI, (3 * Math.PI) / 2);

  // Corner flags
  drawCornerFlag(field.x, field.y);
  drawCornerFlag(field.x + field.width, field.y);
  drawCornerFlag(field.x, field.y + field.height);
  drawCornerFlag(field.x + field.width, field.y + field.height);

  // Goals (framed 3D boxes behind each goal line)
  drawGoal(field.x);
  drawGoal(field.x + field.width);
}

function drawField2D() {
  // Same mapping as projectPoint so pitch lines, goals, players, and the
  // ball all share one coordinate space.
  const S2 = 0.85;
  const px = (x) => VPR + (x - W / 2) * S2;
  const py = (y) => H / 2 + (y - H / 2) * S2;

  // Pixel Striker palette: a dark stadium surround behind a striped green
  // pitch. The crowd is a handful of blocky colour bands (cheap to draw every
  // frame) rather than thousands of individual dots.
  const gx0 = px(field.x), gy0 = py(field.y);
  const gW = field.width * S2, gH = field.height * S2;
  const CROWD = ["#2b6cd4", "#d43c3c", "#e0c14a", "#3d9c5b", "#f4f6f8", "#b957d9", "#ff7f3f", "#8ad0ff"];

  ctx.fillStyle = "#101a12";
  ctx.fillRect(0, 0, W, H);

  // Top and bottom stands: alternating colour / dark bands.
  let bandI = 0;
  for (let yy = 2; yy < gy0 - 2; yy += 16) {
    ctx.fillStyle = CROWD[bandI % CROWD.length];
    ctx.fillRect(0, yy, W, 8);
    bandI++;
  }
  bandI = 0;
  for (let yy = gy0 + gH + 2; yy < H - 2; yy += 16) {
    ctx.fillStyle = CROWD[(bandI + 3) % CROWD.length];
    ctx.fillRect(0, yy, W, 8);
    bandI++;
  }
  // Left stand: vertical colour bands beside the pitch.
  bandI = 0;
  for (let xx = 2; xx < gx0 - 2; xx += 16) {
    ctx.fillStyle = CROWD[(bandI + 5) % CROWD.length];
    ctx.fillRect(xx, gy0, 8, gH);
    bandI++;
  }

  // Ad boards hugging both touchlines.
  const adc = ["#c8321f", "#1f5fc8", "#e8b81f", "#1f9a5a", "#8a3fc8", "#e8701f"];
  for (let i = 0, xx = gx0; xx < gx0 + gW - 4; xx += 210, i++) {
    const w = Math.min(210, gx0 + gW - xx) - 6;
    ctx.fillStyle = adc[i % adc.length];
    ctx.fillRect(xx + 3, gy0 - 14, w, 9);
    ctx.fillRect(xx + 3, gy0 + gH + 5, w, 9);
  }

  // Grass + mowing stripes over the pitch rectangle.
  ctx.fillStyle = "#3b8c3d";
  ctx.fillRect(gx0, gy0, gW, gH);
  for (let band = 0; band * 220 < field.width; band++) {
    const even = (Math.floor(field.x / 220) + band) % 2 === 0;
    ctx.fillStyle = even ? "#379037" : "#3f9540";
    ctx.fillRect(px(field.x + band * 220), gy0, 220 * S2, gH);
  }

  ctx.lineWidth = 6;
  ctx.strokeStyle = "#eef7ee";
  ctx.fillStyle = "#eef7ee";

  // Boundary
  ctx.strokeRect(gx0, gy0, gW, gH);

  // Every marking is derived from the pitch rectangle, so the lines stay
  // correct if the field is ever resized. Proportions follow a real pitch:
  // penalty area 16.5m deep / 40.3m wide, goal area 5.5m / 18.3m, penalty
  // spot 11m out, centre circle 9.15m, corner arc 1m.
  const FH = field.height, FW = field.width;
  const midX = field.x + FW / 2, midY = field.y + FH / 2;
  const penDepth = FW * 0.066;      // 16.5m of 105m
  const penHalf = FH * 0.295;      // 20.15m of 68m
  const sixDepth = FW * 0.022;      // 5.5m
  const sixHalf = FH * 0.133;      // 9.15m
  const spotDist = FW * 0.045;     // 11m
  const centreR = FW * 0.0365;     // 9.15m
  const cornerR = FW * 0.004;      // 1m

  // Halfway line
  ctx.beginPath();
  ctx.moveTo(px(midX), py(field.y));
  ctx.lineTo(px(midX), py(field.y + FH));
  ctx.stroke();

  // Center circle + spot
  ctx.beginPath();
  ctx.arc(px(midX), py(midY), centreR * S2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(px(midX), py(midY), 10 * S2, 0, Math.PI * 2);
  ctx.fill();

  // Penalty areas
  for (const left of [true, false]) {
    const gx = left ? field.x : field.x + FW;
    const bx = left ? gx + penDepth : gx - penDepth;
    ctx.beginPath();
    ctx.moveTo(px(gx), py(midY - penHalf));
    ctx.lineTo(px(bx), py(midY - penHalf));
    ctx.lineTo(px(bx), py(midY + penHalf));
    ctx.lineTo(px(gx), py(midY + penHalf));
    ctx.closePath();
    ctx.stroke();

    // Goal area (six-yard box)
    const sx = left ? gx + sixDepth : gx - sixDepth;
    ctx.beginPath();
    ctx.moveTo(px(gx), py(midY - sixHalf));
    ctx.lineTo(px(sx), py(midY - sixHalf));
    ctx.lineTo(px(sx), py(midY + sixHalf));
    ctx.lineTo(px(gx), py(midY + sixHalf));
    ctx.closePath();
    ctx.stroke();

    // Penalty spot and the arc of the circle that clips the box
    const spotX = left ? gx + spotDist : gx - spotDist;
    ctx.beginPath();
    ctx.arc(px(spotX), py(midY), 8 * S2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    const a0 = left ? -Math.PI / 2.6 : Math.PI - Math.PI / 2.6;
    const a1 = left ? Math.PI / 2.6 : Math.PI + Math.PI / 2.6;
    ctx.arc(px(spotX), py(midY), centreR * S2, a0, a1);
    ctx.stroke();

    // Corner arcs
    for (const top of [true, false]) {
      const cy = top ? field.y : field.y + FH;
      const cx = left ? field.x : field.x + FW;
      ctx.beginPath();
      ctx.arc(px(cx), py(cy), cornerR * S2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Goal mouths (same projected registration as the ball/players)
  ctx.fillStyle = "#0b1f2e";
  ctx.fillRect(px(field.x - 18), py(goalTop + 4), 18 * S2, (goalBottom - goalTop - 8) * S2);
  ctx.fillRect(px(field.x + field.width), py(goalTop + 4), 18 * S2, (goalBottom - goalTop - 8) * S2);
}

const STAD_RX = Math.round(field.width * (1700 / 2520));
const STAD_RY = 850;
const STAD_N = 40;
const STAD_T = 10;
const STAD_RISE = 44;
const STAD_STEP = 3;
const STAD_DEPTH = 2.75;

const FAN_COLORS = ["#2b6cd4", "#d43c3c", "#e0c14a", "#3d9c5b", "#f4f6f8", "#b957d9", "#ff7f3f", "#8ad0ff"];

function buildFans() {
  const fans = [];
  const cx = PITCH_CX;
  const cy = PITCH_CY;
  const rx = STAD_RX;
  const ry = STAD_RY;
  const N = STAD_N;
  const T = STAD_T;
  const RISE = STAD_RISE;
  const stepH = STAD_STEP;
  const bowlDepth = STAD_DEPTH;
  const twoPi = Math.PI * 2;
  const nSuper = 3;
  const hf = (a) => 0.72 + 0.28 * Math.abs(Math.sin(a));
  const rows = 2;
  const cols = 2;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * twoPi;
    const a1 = ((i + 1) / N) * twoPi;
    for (let t = 0; t < T; t++) {
      for (let rr = 0; rr < rows; rr++) {
        for (let k = 0; k < cols; k++) {
          const r = 1 + bowlDepth * ((t + (rr + 0.5) / rows) / T);
          const a = a0 + (a1 - a0) * ((k + 0.5) / cols);
          const zsc = hf(a);
          const z = (t + 1) * RISE * zsc + 1.5;
          const phase = i * 1.3 + t * 0.8 + rr * 2.1 + k * 4.3;
          const jx = ((phase * 31) % 1) - 0.5;
          const jyz = ((phase * 17) % 1) - 0.5;
          const x = cx + rx * Math.pow(Math.abs(Math.cos(a)), 2 / nSuper) * Math.sign(Math.cos(a) || 1) * (r + jx * 0.03);
          const y = cy + ry * Math.pow(Math.abs(Math.sin(a)), 2 / nSuper) * Math.sign(Math.sin(a) || 1) * (r + jyz * 0.03);
          const col = FAN_COLORS[Math.floor((i + t * 3 + rr) % FAN_COLORS.length)];
          fans.push({ x, y, z: z + jyz * 2, phase, col });
        }
      }
    }
  }
  return fans;
}

const fans = buildFans();

function drawFans() {
  // Low-end tiers: the adaptive backing store (RENDER_SCALE, floor 0.45)
  // absorbs most of the fill cost, but the animated crowd is the biggest
  // remaining per-frame cost, so it thins out progressively alongside the
  // scale drops instead of always painting every figure.
  const now = performance.now() * 0.004;
  const fs = 7.8;
  const step = RENDER_SCALE >= 0.8 ? 1 : RENDER_SCALE >= 0.6 ? 2 : 4;
  const hi = RENDER_SCALE >= 0.8;
  for (let i = 0; i < fans.length; i += step) {
    const f = fans[i];
    const p = proj3(f.x, f.y, f.z);
    if (!p) continue;
    if (p.x < -30 || p.x > W + 30 || p.y < -30 || p.y > H + 30) continue;
    const s = Math.max(0.35, p.s);
    if (s < 0.7 || !hi) {
      ctx.fillStyle = f.col;
      ctx.fillRect(p.x, p.y, Math.max(1, s * 3.5 * fs), Math.max(1, s * 4 * fs));
      continue;
    }
    ctx.fillStyle = f.col;
    ctx.fillRect(p.x - s * 1.8 * fs, p.y - s * 6 * fs, s * 3.6 * fs, s * 5 * fs);
    ctx.fillStyle = "#ffdfc2";
    ctx.beginPath();
    ctx.arc(p.x, p.y - s * 7.2 * fs, s * 1.7 * fs, 0, Math.PI * 2);
    ctx.fill();
    const ang = Math.sin(now + f.phase);
    ctx.strokeStyle = f.col;
    ctx.lineWidth = Math.max(1, s * 0.9 * fs);
    ctx.beginPath();
    ctx.moveTo(p.x - s * 1.8 * fs, p.y - s * 5 * fs);
    ctx.lineTo(p.x - s * 1.8 * fs - Math.sin(ang) * s * 3.4 * fs, p.y - s * 5 * fs + Math.cos(ang) * s * 2.2 * fs);
    ctx.stroke();
  }
}

function drawStadium() {
  if (ensureStadiumCache() && typeof ctx.drawImage === "function") {
    const dx = camSmoothX - stadCamX;
    const dy = camSmoothY - stadCamY;
    const dp = camPivot - stadPivot;
    if (stadCamX === null || Math.abs(dx) + Math.abs(dy) > STAD_SNAP || Math.abs(dp) > 0.004) buildStadiumCache();
    ctx.drawImage(stadCanvas, 0, 0, W, H);
  } else {
    SCTX = ctx;
    drawStadiumStatic();
  }
  SCTX = ctx;
  // The NPC fans are the lively (animated) part of the bowl, so they stay
  // on the live render pass even when the static bowl is cached.
  drawFans();
}

function ensureStadiumCache() {
  if (stadCanvas && stadCtx) return true;
  try {
    if (typeof document !== "undefined" && document.createElement &&
        typeof ctx.drawImage === "function" && typeof ctx.setTransform === "function") {
      const c = document.createElement("canvas");
      if (c && typeof c.getContext === "function") {
        c.width = canvas.width;
        c.height = canvas.height;
        const sc = c.getContext("2d");
        if (sc && typeof sc.setTransform === "function" && typeof sc.clearRect === "function") {
          stadCanvas = c;
          stadCtx = sc;
          stadCamX = null;
          stadCamY = null;
          stadPivot = null;
          return true;
        }
      }
    }
  } catch (e) {
    stadCanvas = null;
    stadCtx = null;
  }
  return false;
}

function buildStadiumCache() {
  if (!stadCtx) return;
  if (typeof stadCtx.setTransform === "function") {
    stadCtx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
  }
  stadCtx.clearRect(0, 0, stadCanvas.width, stadCanvas.height);
  SCTX = stadCtx;
  drawStadiumStatic();
  SCTX = ctx;
  stadCamX = camSmoothX;
  stadCamY = camSmoothY;
  stadPivot = camPivot;
}

function applyRenderScale(q) {
  const pixel = pixelArtOn();
  const lo = pixel ? PIXEL_RENDER_SCALE : MIN_RENDER_SCALE;
  q = Math.max(lo, Math.min(1, q));
  if (q === RENDER_SCALE) return;
  RENDER_SCALE = q;
  canvas.width = Math.max(1, Math.round(W * q));
  canvas.height = Math.max(1, Math.round(H * q));
  if (typeof ctx.setTransform === "function") ctx.setTransform(q, 0, 0, q, 0, 0);
  if ("imageSmoothingEnabled" in ctx) ctx.imageSmoothingEnabled = !pixel;
  // Nearest-neighbour upscale of the small backing store gives the crisp
  // chunky pixels of the Pixel Striker FC look.
  if (canvas && canvas.style) {
    canvas.style.imageRendering = pixel ? "pixelated" : "";
    // In pixel mode the game loop pins an exact integer display size and
    // position; release them back to the stylesheet when the mode is off.
    if (!pixel) {
      canvas.style.width = ""; canvas.style.height = "";
      canvas.style.left = ""; canvas.style.right = ""; canvas.style.top = "";
      canvas.style.margin = ""; canvas.style.transform = "";
    }
  }
  stadCanvas = null;
  stadCtx = null;
  stadCamX = null;
  stadCamY = null;
  stadPivot = null;
}

// Present the pixel-art canvas at a whole-number upscale, centred on whole
// pixels. A fractional scale or a half-pixel offset makes the browser resample
// the buffer, which is what reads as "blurry" even with image-rendering set.
// The integer is measured in DEVICE pixels so it stays crisp when the OS uses
// display scaling (devicePixelRatio != 1).
function pixelCanvasPresent() {
  if (!canvas || !canvas.style) return;
  const dpr = window.devicePixelRatio || 1;
  const K = PIXEL_UPSCALE;
  const availW = Math.max(2, window.innerWidth || W);
  const availH = Math.max(2, window.innerHeight || H);
  const q = Math.min(availW * dpr / (K * W), availH * dpr / (K * H));
  if (Math.abs(RENDER_SCALE - q) > 0.004) applyRenderScale(q);
  const dispW = canvas.width * K / dpr;
  const dispH = canvas.height * K / dpr;
  canvas.style.width = dispW + "px";
  canvas.style.height = dispH + "px";
  canvas.style.left = Math.round((availW - dispW) / 2) + "px";
  canvas.style.right = "auto";
  canvas.style.top = Math.round((availH - dispH) / 2) + "px";
  canvas.style.margin = "0";
  canvas.style.transform = "none";
}

let SKYLINE_ON = true;
function drawSkyline(cx, cy, rx, ry) {
  if (!SKYLINE_ON) return;
  const nSuper = 3;
  const shape = (theta) => {
    const c = Math.cos(theta), s = Math.sin(theta);
    return [
      rx * Math.pow(Math.abs(c), 2 / nSuper) * Math.sign(c || 1),
      ry * Math.pow(Math.abs(s), 2 / nSuper) * Math.sign(s || 1)
    ];
  };
  // Full three-belt night city. The near belt just clears the bowl roof, the
  // mid belt is the bulk of the skyline, and the outer belt is a hazy distant
  // downtown that hugs the horizon.
  const B_COLS = ["#0b1220", "#101828", "#0d1526", "#141d30", "#111a2c", "#0a101c", "#16203a"];
  const W_COLS = ["#ffd98a", "#ffc86b", "#cfe6ff", "#9fd4ff", "#ffe9ad", "#ff9e6b", "#8fd0ff"];
  const TWO_PI = Math.PI * 2;
  const towers = [];
  let k = 0;
  const push = (a, r, w, h) => { towers.push({ a: a, r: r, w: w, h: h, k: k++ }); };

  // Outer belt - distant downtown, tallest ring that fades toward the horizon.
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * TWO_PI + 0.13;
    const r = 6.4 + ((i * 37) % 21) * 0.12;       // 6.40..8.80
    const h = 460 + ((i * 53 + 17) % 480);        // 460..940
    const w = 64 + ((i * 29) % 66);               // 64..130
    push(a, r, w, h);
  }
  // Mid belt - the main mass of the city, filling out the skyline widths.
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * TWO_PI + 0.05;
    const r = 4.9 + ((i * 31) % 12) * 0.10;       // 4.90..6.00
    const h = 300 + ((i * 47 + 11) % 300);        // 300..600
    const w = 76 + ((i * 23) % 70);               // 76..146
    push(a, r, w, h);
  }
  // Near belt - squat blocks a stride beyond the bowl edge so they still peek
  // over the far stand's roof line.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TWO_PI + 0.09;
    const r = 4.25 + ((i * 19) % 6) * 0.10;       // 4.25..4.75
    const h = 250 + ((i * 43 + 5) % 220);         // 250..470
    const w = 92 + ((i * 17) % 80);               // 92..172
    push(a, r, w, h);
  }
  // Farthest belt first so nearer blocks paint over any overlap.
  towers.sort((A, B) => B.r - A.r);

  for (const t of towers) {
    const [vx, vy] = shape(t.a);
    const bx = cx + vx * t.r;
    const by = cy + vy * t.r;
    let seed = t.k * 48611 + 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    const col = B_COLS[(t.k * 3 + Math.floor(rnd() * 3)) % B_COLS.length];
    drawSolid(prismFaces(bx - t.w / 2, by - t.w / 2, 0, bx + t.w / 2, by + t.w / 2, t.h), col);
    // Occasional lit signage band on the face.
    if (rnd() < 0.3) {
      const glowZ = t.h * (0.55 + rnd() * 0.3);
      const p = proj3(bx - t.w * 0.3, by, glowZ);
      if (p) {
        SCTX.fillStyle = rnd() < 0.5 ? "rgba(255,140,90,0.85)" : "rgba(140,220,255,0.8)";
        SCTX.fillRect(p.x - 2, p.y, Math.max(2, t.w * 0.6 * p.s), Math.max(2, 3 + p.s * 6));
      }
    }
    // Rooftop beacon.
    if (rnd() < 0.22) drawSphere(bx, by, t.h + 6, 7, "#ff6f4d", "#8f1e0a");
    // Antenna mast.
    if (rnd() < 0.14) {
      const p = proj3(bx, by, t.h);
      const q = proj3(bx, by, t.h + 26 + rnd() * 30);
      if (p && q) {
        SCTX.strokeStyle = "#3a4a66";
        SCTX.lineWidth = 2;
        SCTX.beginPath();
        SCTX.moveTo(p.x, p.y);
        SCTX.lineTo(q.x, q.y);
        SCTX.stroke();
      }
    }
    // Facade windows, deterministic per tower.
    const rows = 7, perRow = 5;
    const lit = 0.4 + rnd() * 0.25;
    for (let row = 0; row < rows; row++) {
      const z = 10 + (row / rows) * (t.h - 18);
      const n = Math.max(2, Math.round(perRow * (0.4 + rnd() * 0.6)));
      for (let cc = 0; cc < n; cc++) {
        if (rnd() > lit) continue;
        const off = (cc - (n - 1) / 2) * t.w * 0.28;
        const p = proj3(bx + off * 0.6, by + off * 0.6, z);
        if (!p) continue;
        const s = Math.max(0.8, p.s);
        SCTX.fillStyle = W_COLS[Math.floor(rnd() * W_COLS.length)];
        SCTX.fillRect(p.x, p.y, Math.max(1, s * 4.2), Math.max(1, s * 5));
      }
    }
  }
}

function drawStadiumStatic() {
  const cx = PITCH_CX;
  const cy = PITCH_CY;
  const rx = STAD_RX;
  const ry = STAD_RY;
  const N = STAD_N;
  const T = STAD_T;
  const RISE = STAD_RISE;
  const stepH = STAD_STEP;
  const bowlDepth = STAD_DEPTH;
  const twoPi = Math.PI * 2;
  const nSuper = 3;
  // super-ellipse (stadium oval): rounded corners, stays outside the pitch
  const P = (theta, r, z) => {
    const cag = Math.cos(theta);
    const sa = Math.sin(theta);
    return [
      cx + rx * Math.pow(Math.abs(cag), 2 / nSuper) * Math.sign(cag || 1) * r,
      cy + ry * Math.pow(Math.abs(sa), 2 / nSuper) * Math.sign(sa || 1) * r,
      z
    ];
  };
  // oval height profile: tallest on the sides, lower behind the goals
  const hf = (a) => 0.72 + 0.28 * Math.abs(Math.sin(a));
  const band = (t0, t1, rIn, rOut, z0, z1) => [
    [P(t0, rIn, z0), P(t1, rIn, z0), P(t1, rIn, z1), P(t0, rIn, z1)],
    [P(t0, rOut, z0), P(t1, rOut, z0), P(t1, rOut, z1), P(t0, rOut, z1)],
    [P(t0, rIn, z0), P(t1, rIn, z0), P(t1, rOut, z0), P(t0, rOut, z0)],
    [P(t0, rIn, z1), P(t1, rIn, z1), P(t1, rOut, z1), P(t0, rOut, z1)]
  ];

  // City skyline: a ring of tower blocks just beyond the bowl, so the far
  // stand is backed by a night-time skyline. Drawn first - the closer (and
  // therefore later) stands paint over any overlap, and towers behind the
  // camera cull themselves via proj3.
  drawSkyline(cx, cy, rx, ry);

  // continuous rounded hoarding hugging the whole pitch
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * twoPi;
    const a1 = ((i + 1) / N) * twoPi;
    drawSolid(band(a0, a1, 1, 1.02, 0, 24), "#20242d");
  }

  // raked seating tiers around the oval bowl
  for (let t = 0; t < T; t++) {
    const rIn = 1 + bowlDepth * (t / T);
    const rOut = 1 + bowlDepth * ((t + 1) / T);
    const col = t % 2 === 0 ? "#2b323e" : "#313846";
    const crowdCol = t % 2 === 0 ? "#ccd0d9" : "#b9bec9";
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * twoPi;
      const a1 = ((i + 1) / N) * twoPi;
      const zsc = hf((a0 + a1) / 2);
      const z0 = t * RISE * zsc;
      const z1 = (t + 1) * RISE * zsc;
      drawSolid(band(a0, a1, rIn, rOut, z0, z1), col);
      // mid-tread row along each tier seat
      for (let k = 0; k < 3; k++) {
        const am = a0 + (a1 - a0) * (0.18 + k * 0.3);
        const rr = rIn + (rOut - rIn) * (0.88 - 0.34 * k);
        const pt = P(am, rr, z1 + 2);
        const p = proj3(pt[0], pt[1], pt[2]);
        if (!p) continue;
        const s = Math.max(1, p.s);
        SCTX.fillStyle = crowdCol;
        SCTX.fillRect(p.x, p.y, s * 3.2, s * 6);
      }
      // front guard row, tighter angular spacing
      for (let k = 0; k < 2; k++) {
        const am = a0 + (a1 - a0) * (0.3 + k * 0.4);
        const pt = P(am, rIn + (rOut - rIn) * 0.06, z1 + 3);
        const p = proj3(pt[0], pt[1], pt[2]);
        if (!p) continue;
        const s = Math.max(1, p.s);
        SCTX.fillStyle = crowdCol;
        SCTX.fillRect(p.x, p.y, s * 4.4, s * 6.5);
      }
    }
  }

  // roof ring over the top tier (matching the oval height profile)
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * twoPi;
    const a1 = ((i + 1) / N) * twoPi;
    const zsc = hf((a0 + a1) / 2);
    drawSolid(band(a0, a1, 1 + bowlDepth, 1 + bowlDepth + 0.07, (T * RISE - 2) * zsc, (T * RISE + 12) * zsc), "#5d6675");
  }

  // light towers at the four corners of the bowl
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (Math.PI / 2) * k;
    const tpt = P(a, 4.05, 0);
    const tx = tpt[0];
    const ty = tpt[1];
    drawSolid(prismFaces(tx - 14, ty - 14, 0, tx + 14, ty + 14, 180), "#565f6d");
    drawSphere(tx, ty, 182, 10, "#fff8e0", "#e6d9a0");
  }
}
// -- 3D goal frames (side camera) ----------------------------------------
// A goal is a net box behind its goal line: two posts span the depth of the
// goal mouth (goalTop -> goalBottom across the pitch width), a crossbar tops
// them at GOAL_HEIGHT, and the net runs back away from the field. Building it
// from world-space corners lets proj3 draw it correctly from the side view.
function goalPoints3D(gx) {
  const back = gx === field.x ? gx - GOAL_NET_DEPTH : gx + GOAL_NET_DEPTH;
  const top = GOAL_HEIGHT;
  return {
    A0: [gx, goalTop, 0], A1: [gx, goalTop, top],
    B0: [gx, goalBottom, 0], B1: [gx, goalBottom, top],
    C0: [back, goalTop, 0], C1: [back, goalTop, top],
    D0: [back, goalBottom, 0], D1: [back, goalBottom, top]
  };
}

function drawGoalFrame(gx, netAlpha, frameScale) {
  const g = goalPoints3D(gx);
  const A0 = proj3(g.A0[0], g.A0[1], g.A0[2]);
  const A1 = proj3(g.A1[0], g.A1[1], g.A1[2]);
  const B0 = proj3(g.B0[0], g.B0[1], g.B0[2]);
  const B1 = proj3(g.B1[0], g.B1[1], g.B1[2]);
  const C0 = proj3(g.C0[0], g.C0[1], g.C0[2]);
  const C1 = proj3(g.C1[0], g.C1[1], g.C1[2]);
  const D0 = proj3(g.D0[0], g.D0[1], g.D0[2]);
  const D1 = proj3(g.D1[0], g.D1[1], g.D1[2]);
  if (![A0, A1, B0, B1, C0, C1, D0, D1].every(Boolean)) return;
  const avgS = (A0.s + A1.s + B0.s + B1.s + C0.s + C1.s + D0.s + D1.s) / 8;

  // translucent net panels: back wall, two side walls and the roof
  ctx.fillStyle = "rgba(235,239,244," + netAlpha + ")";
  const quad = (p, q, r, s2) => {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.lineTo(r.x, r.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.closePath();
    ctx.fill();
  };
  quad(C0, D0, D1, C1); // back wall
  quad(A0, A1, C1, C0); // far side wall
  quad(B0, B1, D1, D0); // near side wall
  quad(A1, B1, D1, C1); // roof

  // white frame: posts, crossbar, back bar, ground lintels and roof edges
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = Math.max(2, avgS * frameScale);
  ctx.lineCap = "round";
  const seg = (p, q) => {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
  };
  seg(A0, A1); // far post
  seg(B0, B1); // near post
  seg(A1, B1); // crossbar
  seg(C1, D1); // back bar (top of the net)
  seg(C0, D0); // back ground lintel
  seg(A1, C1); // roof, far edge
  seg(B1, D1); // roof, near edge
  ctx.lineCap = "butt";
}

function drawGoalNet(gx) {
  if (cam2d) return;
  drawGoalFrame(gx, 0.16, 9);
}


/* ------------------------------------------------------------------
   Synthesized crowd + live commentary captions.

   Presentation only: nothing here touches the replicated simulation, so
   it is safe to call from inside goal/card/foul handlers. All sound is
   generated from noise buffers and oscillators - no external audio files -
   and the AudioContext is created lazily on the first user gesture.
------------------------------------------------------------------ */
const COMMENTARY_LINES = {
  kickoff: ["And we are under way at the ground!", "Here we go - the match is live.", "Kickoff! The crowd is up."],
  goalFor: ["GOAL! What a finish!", "It's in! The crowd explodes!", "What a strike - you lead the noise!", "Buried it! Roars all around."],
  goalAgainst: ["Oh no - they've done it.", "That's a goal conceded, the crowd groans.", "Painful - the net bulges at the wrong end.", "Silence from the home end, then boos."],
  chance: ["Superb chance - just wide!", "So close! The keeper had no chance but the woodwork and luck.", "That was a big opening gone begging.", "Screaming for the net and it stays out!"],
  save: ["Superb save! What a stop.", "The keeper stands tall and pushes it away.", "Denied! The crowd gasps.", "Big hands from the goalkeeper!"],
  tackle: ["Crunching tackle, perfectly timed.", "Won cleanly in the midfield.", "Strong challenge and the crowd roars.", "Real defensive work - the crowd appreciates it."],
  yellow: ["A booking. The referee is not happy.", "Yellow card - a sloppy one, that.", "Tactical foul, and the book comes out.", "The crowd boos the challenge."],
  red: ["RED CARD! The crowd erupts.", "He's off! Ten men down.", "Sent off. The noise turns to jeers.", "That's a red - the game changes shape."],
  freeKick: ["Free kick given. The wall goes up.", "Whistle blows - dangerous free kick.", "Set piece alert, the crowd is on its feet."],
  whistleHalf: ["Half time here at the ground.", "The referee blows for half time.", "Forty-five minutes gone, the noise rises."],
  whistleFull: ["Full time! What a match.", "That's it - full time at the ground.", "The whistle goes and the crowd erupts."],
  win: ["Full time, and the home end is celebrating!", "You take the three points. Delight all round.", "A win to remember!"],
  draw: ["Full time - honours even.", "The game ends level, the crowd still applauds.", "A point apiece."],
  lose: ["Full time, and it's defeat.", "The home end heads away quietly.", "A hard night for the crowd."],
  buildUp: ["They'll want to keep it simple here.", "Building from the back - press them.", "Patient passing, looking for an opening.", "Steady circulation, looking to build."]
};

const commentaryQueue = [];
const commentaryLast = {};

function commentarySetting() { return SETTINGS.commentary !== false; }
function crowdAudioSetting() { return SETTINGS.crowdAudio !== false; }
function crowdVolumeSetting() {
  const v = typeof SETTINGS.crowdVolume === "number" ? SETTINGS.crowdVolume : 55;
  return Math.max(0, Math.min(100, v)) / 100;
}

let sfxCtx = null;
let sfxMaster = null;
let sfxNoiseBuf = null;
let sfxUnlocked = false;

function sfxContext() {
  if (!crowdAudioSetting()) return null;
  try {
    if (!sfxCtx) {
      const AC = (typeof window !== "undefined") && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return null;
      sfxCtx = new AC();
      sfxMaster = sfxCtx.createGain();
      sfxMaster.gain.value = crowdVolumeSetting();
      sfxMaster.connect(sfxCtx.destination);
      const len = Math.floor(sfxCtx.sampleRate * 2);
      sfxNoiseBuf = sfxCtx.createBuffer(1, len, sfxCtx.sampleRate);
      const data = sfxNoiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (sfxCtx.state === "suspended" && sfxUnlocked) sfxCtx.resume();
    return sfxCtx;
  } catch (e) { return null; }
}

function sfxUnlock() {
  sfxUnlocked = true;
  const ctx = sfxContext();
  if (ctx && ctx.state === "suspended") ctx.resume();
}

function sfxNoiseBurst(dur, gainPeak, filterType, freqFrom, freqTo, q) {
  const ctx = sfxContext();
  if (!ctx || !sfxNoiseBuf || !sfxMaster) return;
  try {
    const src = ctx.createBufferSource();
    src.buffer = sfxNoiseBuf;
    src.loop = true;
    const filt = ctx.createBiquadFilter();
    filt.type = filterType || "bandpass";
    const t = ctx.currentTime;
    filt.frequency.setValueAtTime(freqFrom, t);
    filt.frequency.exponentialRampToValueAtTime(Math.max(40, freqTo), t + dur);
    filt.Q.value = q || 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainPeak), t + Math.min(0.3, dur * 0.35));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(sfxMaster);
    src.start(t);
    src.stop(t + dur + 0.05);
  } catch (e) {}
}

function sfxTone(dur, gainPeak, type, freq, endFreq) {
  const ctx = sfxContext();
  if (!ctx || !sfxMaster) return;
  try {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || "sawtooth";
    o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainPeak), t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(sfxMaster);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch (e) {}
}

function crowdRoar(strength) {
  const s = Math.max(0.25, Math.min(1, strength || 1));
  sfxNoiseBurst(1.9 * s + 0.6, 0.28 * s + 0.1, "bandpass", 620, 240, 0.6);
  sfxNoiseBurst(1.4 * s + 0.4, 0.14 * s, "lowpass", 900, 320, 0.4);
}

function crowdGroan() { sfxNoiseBurst(1.2, 0.22, "bandpass", 380, 170, 0.9); }
function crowdOoh() { sfxNoiseBurst(0.85, 0.2, "bandpass", 950, 430, 1.3); }
function crowdBoo() { sfxNoiseBurst(1.4, 0.18, "lowpass", 760, 250, 0.5); }
function crowdChant() { sfxNoiseBurst(1.5, 0.14, "bandpass", 300, 640, 2.6); }

function refereeWhistle(longBlast) {
  const ctx = sfxContext();
  if (!ctx || !sfxMaster) return;
  try {
    const t = ctx.currentTime;
    const dur = longBlast ? 1.05 : 0.42;
    const o = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    o.type = "square"; o.frequency.value = 2320;
    o2.type = "square"; o2.frequency.value = 2460;
    lfo.type = "sine"; lfo.frequency.value = 33;
    lg.gain.value = 140;
    lfo.connect(lg);
    lg.connect(o.frequency);
    lg.connect(o2.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.11, t + 0.05);
    g.gain.setValueAtTime(0.11, t + Math.max(0.06, dur - 0.14));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); o2.connect(g); g.connect(sfxMaster);
    o.start(t); o2.start(t); lfo.start(t);
    o.stop(t + dur + 0.03); o2.stop(t + dur + 0.03); lfo.stop(t + dur + 0.03);
  } catch (e) {}
}

function goalHorn() {
  sfxTone(0.75, 0.1, "sawtooth", 320, 196);
  sfxTone(0.75, 0.06, "square", 480, 300);
}

function pushCommentary(kind) {
  if (!commentarySetting()) return;
  const lines = COMMENTARY_LINES[kind];
  if (!lines || !lines.length) return;
  let idx = Math.floor(Math.random() * lines.length);
  if (lines[idx] === commentaryLast[kind]) idx = (idx + 1) % lines.length;
  commentaryLast[kind] = lines[idx];
  commentaryQueue.push({ text: lines[idx], frames: 170 });
  while (commentaryQueue.length > 3) commentaryQueue.shift();
}

// One entry point for every crowd/announcement moment. Called from the goal,
// card and foul handlers; touches local presentation state only.
function crowdEvent(kind, strength, horn) {
  if (kind === "goal") { crowdRoar(strength || 1); if (horn !== false) goalHorn(); pushCommentary(strength >= 1 ? "goalFor" : "goalAgainst"); }
  else if (kind === "chance") { crowdOoh(); pushCommentary("chance"); }
  else if (kind === "save") { crowdOoh(); pushCommentary("save"); }
  else if (kind === "tackle") { crowdChant(); pushCommentary("tackle"); }
  else if (kind === "yellow") { crowdBoo(); pushCommentary("yellow"); }
  else if (kind === "red") { crowdBoo(); crowdGroan(); pushCommentary("red"); }
  else if (kind === "freekick") { refereeWhistle(false); pushCommentary("freeKick"); }
  else if (kind === "halftime") { refereeWhistle(true); pushCommentary("whistleHalf"); }
  else if (kind === "fulltime") { refereeWhistle(true); pushCommentary("whistleFull"); }
  else if (kind === "kickoff") { refereeWhistle(false); crowdChant(); pushCommentary("kickoff"); }
  else if (kind === "result") { pushCommentary(strength); }
}

function updateCommentaryFrame() {
  if (!commentaryQueue.length) return;
  commentaryQueue[0].frames--;
  if (commentaryQueue[0].frames <= 0) commentaryQueue.shift();
}

function drawCommentary() {
  if (!commentaryQueue.length) return;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const baseY = H - 74;
  for (let i = commentaryQueue.length - 1; i >= 0; i--) {
    const item = commentaryQueue[i];
    const fresh = 1 - item.frames / 170;
    const alpha = Math.min(1, fresh * 6) * Math.min(1, item.frames / 26);
    if (alpha <= 0.02) continue;
    const fs = 26 - i * 2;
    ctx.font = "bold " + fs + "px Arial";
    const tw = ctx.measureText(item.text).width + 44;
    const y = baseY - (commentaryQueue.length - 1 - i) * 34;
    ctx.globalAlpha = alpha * 0.72;
    ctx.fillStyle = "#05070c";
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") ctx.roundRect(W / 2 - tw / 2, y - 21, tw, 34, 8);
    else ctx.rect(W / 2 - tw / 2, y - 21, tw, 34);
    ctx.fill();
    ctx.globalAlpha = alpha * 0.35;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#e8eefc";
    ctx.fillText(item.text, W / 2, y - 3);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawMinimap() {
  const cv = document.getElementById("minimapCanvas");
  if (!cv || typeof cv.getContext !== "function") return;
  const ctx = cv.getContext("2d");
  const w = cv.width, h = cv.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(8, 60, 26, 0.86)";
  ctx.fillRect(0, 0, w, h);
  const sx = w / field.width, sy = h / field.height;
  const fl = field.x * sx, ft = field.y * sy, fw = field.width * sx, fh = field.height * sy;
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  ctx.beginPath();
  ctx.moveTo(fl + fw / 2, 0); ctx.lineTo(fl + fw / 2, h);
  ctx.moveTo(0, ft + fh / 2); ctx.lineTo(w, ft + fh / 2);
  ctx.stroke();
  ctx.strokeRect(fl, ft, fw, fh);
  for (const p of allPlayers) {
    if (p.sentOff) continue;
    ctx.fillStyle = p === localPlayer ? "#ffe066" : (p.team === "blue" ? "#5aa9ff" : (p.team === "red" ? "#ff7b8a" : "#f7c325"));
    ctx.beginPath();
    ctx.arc(p.x * sx, p.y * sy, p === localPlayer ? 2.6 : 2.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(ball.x * sx, ball.y * sy, 2.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawMinimapOnce() { drawMinimap(); }

/* ------------------------ Pixel Striker presentation --------------------- *
 * A chunky arcade look modelled on the Pixel Striker FC reference. The whole
 * match renders into a small backing store which the browser upscales with
 * nearest-neighbour sampling, so a "font dot" below is one screen pixel. This
 * block only ever reads match state (score, clock, players, ball) - it never
 * touches the simulation, careers or the online lockstep.                      */

// 3x5 pixel font (each glyph is a 15-bit string, row-major).
const PIXEL_FONT = {
  A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110",
  E: "111100110100111", F: "111100110100100", G: "011100101101011", H: "101101111101101",
  I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111",
  M: "101111111101101", N: "110101101101101", O: "010101101101010", P: "110101110100100",
  Q: "010101101110011", R: "110101110101101", S: "011100010001110", T: "111010010010010",
  U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101",
  Y: "101101010010010", Z: "111001010100111",
  "0": "111101101101111", "1": "010110010010111", "2": "110001010100111", "3": "110001010001110",
  "4": "101101111001001", "5": "111100110001110", "6": "011100111101111", "7": "111001010010010",
  "8": "111101111101111", "9": "111101111001110",
  ":": "000010000010000", "-": "000000111000000", "!": "010010010000010", ".": "000000000000010",
  "/": "001001010100100", "<": "001010100010001", ">": "100010001010100", "+": "000010111010000",
  "'": "010010000000000", "?": "110001010000010", ",": "000000000010100", "%": "101001010100101",
  "_": "000000000000111", "=": "000111000111000",
};

// Toggle the body-level flag that lets CSS hide the smooth DOM HUD (top
// scoreline, energy bar, minimap, hint pill) while the arcade HUD is up.
function applyPixelArtChrome(on) {
  if (typeof document === "undefined" || !document.documentElement) return;
  const el = document.documentElement;
  const has = el.classList.contains("pixel-art");
  if (on && !has) el.classList.add("pixel-art");
  else if (!on && has) el.classList.remove("pixel-art");
}

function pixelGlyphs(g, str, x, y, col, s) {
  g.fillStyle = col;
  g.beginPath();
  for (let i = 0; i < str.length; i++) {
    const gl = PIXEL_FONT[str[i]];
    if (!gl) continue;
    for (let k = 0; k < 15; k++) {
      if (gl.charCodeAt(k) === 49) {
        g.rect(x + i * 4 * s + (k % 3) * s, y + ((k / 3) | 0) * s, s, s);
      }
    }
  }
  g.fill();
}

function pixelText(str, x, y, col, s, align, shadow) {
  str = String(str).toUpperCase();
  s = s || 1;
  const w = str.length * 4 * s - s;
  if (align === "c") x -= w >> 1; else if (align === "r") x -= w;
  x = Math.round(x); y = Math.round(y);
  if (shadow) pixelGlyphs(ctx, str, x + s, y + s, shadow, s);
  pixelGlyphs(ctx, str, x, y, col, s);
}

function arcadeTeamColors() {
  const home = (typeof player !== "undefined" && player && player.color) ? player.color : "#5aa9ff";
  let away = "#ff7b8a";
  if (typeof opponents !== "undefined" && opponents && opponents[0] && opponents[0].color) {
    away = opponents[0].color;
  }
  return { home: home, away: away };
}

function drawArcadeHUD() {
  if (!matchRunning) return;
  if (typeof pixelArtOn === "function" && !pixelArtOn()) return;
  const bw = canvas.width, bh = canvas.height;

  ctx.save();
  // Draw in raw backing-store pixels so every dot lands crisply after the
  // browser's nearest-neighbour upscale.
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const cols = arcadeTeamColors();
  const homeCode = (typeof FIFA_CODES !== "undefined" && FIFA_CODES[selectedTeam]) || "HOM";
  const awayCode = (typeof FIFA_CODES !== "undefined" && FIFA_CODES[getOpponentTeam()]) || "AWY";
  const scoreTxt = blueScore + "-" + redScore;

  // ---- top scoreboard bar ----
  const panelW = 150, panelH = 20;
  const px0 = Math.round(bw / 2 - panelW / 2), py0 = 4;
  ctx.fillStyle = "rgba(8,14,12,0.84)";
  ctx.fillRect(px0, py0, panelW, panelH);
  ctx.fillStyle = cols.home; ctx.fillRect(px0 + 2, py0 + 2, 4, panelH - 4);
  ctx.fillStyle = cols.away; ctx.fillRect(px0 + panelW - 6, py0 + 2, 4, panelH - 4);
  pixelText(homeCode, px0 + 10, py0 + 6, "#e8f3ec", 2);
  pixelText(awayCode, px0 + panelW - 10, py0 + 6, "#e8f3ec", 2, "r");
  pixelText(scoreTxt, bw / 2, py0 + 4, "#ffffff", 3, "c", "#000000");

  // ---- clock under the score ----
  ctx.fillStyle = "rgba(8,14,12,0.84)";
  const cw = Math.max(46, matchClockText().length * 8 + 8);
  ctx.fillRect(Math.round(bw / 2 - cw / 2), py0 + panelH + 2, cw, 12);
  pixelText(matchClockText(), bw / 2, py0 + panelH + 4, "#ffe45e", 2, "c", "#000000");

  // ---- radar (bottom-left) ----
  const rw = 72, rh = 34, rx = 6, ry = bh - rh - 6;
  ctx.fillStyle = "rgba(8,24,14,0.7)";
  ctx.fillRect(rx - 1, ry - 1, rw + 2, rh + 2);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(rx + Math.round(rw / 2), ry, 1, rh);
  ctx.fillRect(rx, ry, rw, 1); ctx.fillRect(rx, ry + rh - 1, rw, 1);
  ctx.fillRect(rx, ry, 1, rh); ctx.fillRect(rx + rw - 1, ry, 1, rh);
  const mx = (x) => rx + Math.max(0, Math.min(1, (x - field.x) / field.width)) * (rw - 2);
  const my = (y) => ry + Math.max(0, Math.min(1, (y - field.y) / field.height)) * (rh - 2);
  if (typeof allPlayers !== "undefined") {
    for (const p of allPlayers) {
      if (p.sentOff) continue;
      ctx.fillStyle = p === localPlayer ? "#ffe45e"
        : (p.team === "blue" ? cols.home : (p.team === "red" ? cols.away : "#f7c325"));
      ctx.fillRect(Math.round(mx(p.x)), Math.round(my(p.y)), 2, 2);
    }
  }
  if (typeof ball !== "undefined") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(Math.round(mx(ball.x)), Math.round(my(ball.y)), 2, 2);
  }

  // ---- stamina bar (bottom, left of centre) ----
  if (typeof player !== "undefined" && player) {
    const sw = 56, sh = 6, sx = rx, sy = ry - sh - 4;
    ctx.fillStyle = "rgba(8,14,12,0.72)";
    ctx.fillRect(sx, sy, sw, sh);
    const frac = Math.max(0, Math.min(1, player.energy / MAX_ENERGY));
    ctx.fillStyle = player.energy <= 0 ? "#ff5d5d" : "#7dff8a";
    ctx.fillRect(sx + 1, sy + 1, Math.round((sw - 2) * frac), sh - 2);
  }

  ctx.restore();
}

function drawReplayIndicator() {

  if (goalPhase !== "replay" && !offsideReplay) return;

  const isOffside = !!offsideReplay;

  const label = isOffside ? "OFFSIDE" : "REPLAY";

  const cx = W / 2;

  const pulse = 1 + 0.15 * Math.sin(performance.now() * 0.01);

  const fs = Math.round(30 * pulse);

  ctx.save();

  ctx.textAlign = "center";

  ctx.font = "bold " + fs + "px Arial";

  const w = ctx.measureText(label).width + 34;

  ctx.fillStyle = "rgba(10, 12, 30, 0.68)";

  ctx.fillRect(cx - w / 2, 168, w, fs + 26);

  ctx.fillStyle = isOffside ? "#ff9aa0" : "#ffd700";

  ctx.fillText(label, cx, 168 + fs + 8);

  if (isOffside) {
    ctx.font = "bold 17px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("GOAL OVERTURNED - INDIRECT FREE KICK", cx, 168 + fs + 36);
  }

  ctx.restore();

}

function drawFreekickBanner() {

  const mp = matchPenalty;

  if (!freekick && !mp) return;

  // Mark the exact restart spot where the foul happened.
  const ps = freekick ? { x: freekick.x, y: freekick.y } : { x: mp.spot.x, y: mp.spot.y };

  const spot = projectPoint(ps.x, ps.y);

  if (spot) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, 24 * spot.s, 0, Math.PI * 2);
    ctx.lineWidth = 3 * spot.s;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, 5 * spot.s, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fill();
  // ---- control hint (bottom-centre, clear of the corner controls) ----
  const mobile = (typeof currentScheme === "function" && currentScheme() === "mobile");
  const hint = mobile ? "STICK MOVE" : "WASD MOVE  SPACE SHOOT  B PASS  V TACKLE";
  pixelText(hint, bw / 2, bh - 9, "rgba(232,243,236,0.7)", 2, "c", "#000000");

  ctx.restore();
}

  const w = W;

  const cx = w / 2;

  const pulse = 1 + 0.06 * Math.sin(performance.now() / 80);

  const fs = Math.round(30 * pulse);

  const isUser = freekick ? (freekick.taker === localPlayer) : (mp.taker === localPlayer);

  const isYours = freekick ? (freekick.team === localPlayer.team) : (mp.team === localPlayer.team);

  const txt = mp ? (isYours ? "PENALTY - YOURS" : "PENALTY") : (isYours ? "FREE KICK - YOURS" : "FREE KICK");

  const hint = mp ? (isUser ? "HOLD A DIRECTION TO AIM" : "") : (isUser ? "WALK UP AND SHOOT (SPACE)" : "");

  ctx.save();

  ctx.textAlign = "center";

  ctx.font = "bold " + fs + "px Arial";

  const tw = Math.max(ctx.measureText(txt).width + 30, ctx.measureText(hint).width + 30);

  ctx.fillStyle = "rgba(10, 12, 30, 0.72)";

  ctx.fillRect(cx - tw / 2, 174, tw, fs + 34);

  ctx.fillStyle = "#ffffff";

  ctx.fillText(txt, cx, 174 + fs + 8);

  if (hint) {

    ctx.font = "bold 14px Arial";

    ctx.fillStyle = "#9dff9d";

    ctx.fillText(hint, cx, 174 + fs + 32);

  }

  ctx.restore();

}

function drawCardFlash() {

  if (!cardFlash || cardFlash.frames <= 0) return;

  const w = W;

  const h = H;

  const cx = w / 2;

  const cy = h / 2;

  const alpha = Math.min(1, cardFlash.frames / 18);

  ctx.save();

  ctx.globalAlpha = Math.max(0, alpha);

  const bw = 400;

  const bh = 150;

  ctx.fillStyle = "rgba(10, 12, 30, 0.85)";

  ctx.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);

  ctx.fillStyle = cardFlash.color;

  ctx.fillRect(cx - 118, cy - 64, 80, 120);

  ctx.fillStyle = "#ffffff";

  ctx.textAlign = "left";

  ctx.font = "bold 25px Arial";

  ctx.fillText(cardFlash.text, cx - 28, cy - 12);

  ctx.font = "bold 22px Arial";

  ctx.fillStyle = "#dddddd";

  ctx.fillText(cardFlash.name ? cardFlash.name : "", cx - 28, cy + 18);

  ctx.restore();

}

function drawSentOffNote() {

  if (!player.sentOff) return;

  const w = W;

  const cx = w / 2;

  ctx.save();

  ctx.textAlign = "center";

  ctx.font = "bold 30px Arial";

  ctx.fillStyle = "rgba(15, 15, 35, 0.55)";

  const sentOffLabel = player.offInjured ? "YOU'VE GONE OFF INJURED" : "YOU'VE BEEN SENT OFF";

  const tw = ctx.measureText(sentOffLabel).width;

  ctx.fillRect(cx - tw / 2 - 24, 250, tw + 48, 58);

  ctx.fillStyle = "#ff4757";

  ctx.fillText(sentOffLabel, cx, 290);

  ctx.font = "bold 14px Arial";

  ctx.fillStyle = "#cfcfcf";

  ctx.fillText("Your team keeps playing on.", cx, 320);

  ctx.restore();

}

// A replay badge so it is obvious the goal being shown again is a replay and
// not the live game. Drawn over the top of the HUD.
function drawReplayBadge() {
  if (goalPhase !== "replay") return;
  const cx = W / 2;
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "bold 34px Arial";
  const label = "REPLAY";
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = "rgba(10, 10, 26, 0.72)";
  ctx.fillRect(cx - tw / 2 - 30, 226, tw + 60, 86);
  ctx.fillStyle = "#ffd24a";
  ctx.fillText(label, cx, 268);
  ctx.font = "bold 15px Arial";
  ctx.fillStyle = "#e8e8e8";
  ctx.fillText(celebrateTeam === "blue" ? "Blue goal" : "Red goal", cx, 296);
  ctx.restore();
}

// --- Weather visuals -------------------------------------------------------
// Everything below is client-local decoration: it runs off vrnd(), never
// netRand(), so it cannot desync an online match.
function weatherIsWet() { return weatherState === "rain" || weatherState === "storm"; }
function updateWeatherVisuals() {
  if (weatherFade < 1) weatherFade = Math.min(1, weatherFade + 0.05);
  if (weatherFlash > 0) weatherFlash--;
  const rain = weatherIsWet();
  const snow = weatherState === "snow";
  if (!rain && !snow) return;
  // Drive the pool in normalised screen space and wrap it around.
  const fall = snow ? 0.006 : 0.028;
  const wind = weatherState === "storm" ? 0.012 : 0.004;
  for (let i = 0; i < weatherDrops.length; i++) {
    const d = weatherDrops[i];
    d.y += fall * d.s;
    d.x += wind * d.s;
    if (snow) d.x += Math.sin((d.y + d.d) * 22) * 0.0022;
    if (d.y > 1.02) { d.y -= 1.04; d.x = vrnd(); }
    if (d.x > 1.02) d.x -= 1.04;
  }
  // Lightning: a brief white flash during a storm, purely local.
  if (weatherState === "storm" && weatherFlash <= 0 && vrnd() < 0.012) weatherFlash = 7;
}
// Drawn straight after the pitch: haze, darkening and the sun coming out.
function drawWeatherBehind() {
  const st = weatherState;
  if (st === "clear") return;
  ctx.save();
  if (st === "overcast" || st === "rain" || weatherIsWet()) {
    ctx.fillStyle = st === "storm" ? "rgba(14,18,34,0.34)" : "rgba(18,24,40,0.22)";
    ctx.fillRect(0, 0, W, H);
  }
  if (st === "fog") {
    // A thick low veil over the whole pitch plus a brighter band upfield.
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(214,222,232,0.42)");
    g.addColorStop(0.55, "rgba(214,222,232,0.22)");
    g.addColorStop(1, "rgba(214,222,232,0.36)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  if (weatherFlash > 0) {
    ctx.fillStyle = "rgba(255,255,255," + (0.3 * (weatherFlash / 7)).toFixed(3) + ")";
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}
// Drawn over the players: the falling precipitation itself.
function drawWeatherFront() {
  const rain = weatherIsWet();
  const snow = weatherState === "snow";
  if (!rain && !snow) return;
  ctx.save();
  if (rain) {
    const len = weatherState === "storm" ? 30 : 18;
    const tilt = weatherState === "storm" ? 9 : 4;
    ctx.strokeStyle = "rgba(190,214,240,0.5)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i < weatherDrops.length; i++) {
      const d = weatherDrops[i];
      const x = d.x * W, y = d.y * H, l = len * d.s;
      ctx.moveTo(x, y);
      ctx.lineTo(x - tilt * d.s, y - l);
    }
    ctx.stroke();
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    for (let i = 0; i < weatherDrops.length; i++) {
      const d = weatherDrops[i];
      const r = 1.4 * d.s;
      ctx.beginPath();
      ctx.arc(d.x * W, d.y * H, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  // A small caption so the conditions are readable at a glance.
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "bold 13px Arial";
  ctx.fillStyle = "rgba(235,242,250,0.75)";
  const labels = { rain: "RAIN", storm: "STORM", snow: "SNOW", fog: "FOG", overcast: "OVERCAST" };
  ctx.fillText(labels[weatherState] || "", W / 2, 40);
  ctx.restore();
}

// --- Cutscenes -------------------------------------------------------------
// A cutscene is decoration laid over a pause the game ALREADY has: the
// kickoff countdown, the goal replay, the half-time break, the final whistle.
// Because the simulation is idle during every one of those, a cutscene can
// never desync an online match, so shot timing runs on the client's own clock
// and the camera is free to be hijacked.
//
// Each shot is a camera framing (fx/fy are fractions of the pitch) plus a
// caption. The engine eases the camera from shot to shot and draws letterbox
// bars, a wipe-on title and a shot-progress strip.
const CUTSCENE_SKIP_KEYS = ["enter", " ", "x", "b", "f", "q", "r", "z", "shift"];
const CUTSCENE_BAR = 0.085;      // letterbox height, fraction of the canvas
let cutscene = null;
let cutsceneKind = "";
let cutsceneCooldown = 0;
let cutsceneWasRunning = false;
