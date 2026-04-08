
export const ManualTextMapHashes = {
  // None:
  'None': 3053154618,
  'GCG_TAG_WEAPON_NONE': 3053154618,
  'GCG_TAG_ELEMENT_NONE': 3053154618,

  // All:
  'All': 4081188009,
  'Other': 463752568,

  // Lumine/Aether:
  'Lumine': 3241049361,
  'Aether': 2329553598,

  'ServerBrandTipsOverseas': 2874657049,
  'ServerEmailAskOverseas': 2535672942,

  // Regions / Maps / Nations / Factions
  // --------------------------------------------------------------------------------------------------------------
  // Monstadt
  'Mondstadt': 49482922,
  'GCG_TAG_NATION_MONDSTADT': 3622220067,

  // Liyue:
  'Liyue': 45426028,
  'GCG_TAG_NATION_LIYUE': 1271778475,

  // Inazuma
  'Inazuma': 139804829,
  'GCG_TAG_NATION_INAZUMA': 1547136123,

  // Sumeru
  'Sumeru': 103729490,
  'GCG_TAG_NATION_SUMERU': 3926786131,

  // Fontaine
  'Fontaine': 18666903,
  'GCG_TAG_NATION_FONTAINE': 242250147,

  // Natlan
  'Natlan': 177860670,
  'GCG_TAG_NATION_NATLAN': 3332492339,

  // Nod-Krai
  'Nod-Krai': 2879894,
  'GCG_TAG_NATION_NODKRAI': 3969490099,

  // Snezhnaya
  'Snezhnaya': 536575123,
  'GCG_TAG_NATION_SNEZHNAYA': 536575123,

  // Khaenri'ah
  "Khaenri'ah": 4075666795,
  'Khaenriah': 4075666795,
  'GCG_TAG_NATION_KHAENRIAH': 4075666795,

  // Simulanka:
  'Simulanka': 377968915,
  'GCG_TAG_NATION_SIMULANKA': 377968915,

  // Cosmic Calamity
  'Cosmic Calamity': 1897389369,
  'GCG_TAG_NATION_COSMIC_CALAMITY': 2708658179,

  // Other Maps
  'Serenitea Pot': 200477924,
  'Golden Apple Archipelago': 209420713,
  'Miliastra Wonderland': 441907591,
  'Three Realms Gateway Offering': 2032300089,
  'Spiral Abyss': 112115079,
  'Enkanomiya': 80907774,
  'Veluriyam Mirage': 84854953,
  'The Chasm: Underground Mines': 297471372,
  'Sea of Bygone Eras': 73076751,
  'Theater Lobby': 661281239,
  'Ancient Sacred Mountain': 966415828,
  'Chenyu Vale': 68445495,

  // Other Factions
  'Fatui': 2363243827,
  'GCG_TAG_CAMP_FATUI': 2363243827,

  'Hilichurl': 148952339,
  'GCG_TAG_CAMP_HILICHURL': 148952339,

  'Monster': 880768379,
  'GCG_TAG_CAMP_MONSTER': 880768379,

  'Kairagi': 2722933019,
  'GCG_TAG_CAMP_KAIRAGI': 2722933019,

  'The Eremites': 2263672043,
  'GCG_TAG_CAMP_EREMITE': 2263672043,

  'Consecrated Beast': 1265668603,
  'GCG_TAG_CAMP_SACREAD': 1265668603,

  // General
  // --------------------------------------------------------------------------------------------------------------
  'Domains': 705921482,
  'Domain': 4043227537,

  'Furnishing Set': 1999112283,
  'Gift Set': 205103331,

  'Genius Invokation TCG': 406593761,
  'Imaginarium Theater': 191610270,
  'Stygian Onslaught': 2939058421,

  // Elements
  // --------------------------------------------------------------------------------------------------------------
  // Pyro
  'Pyro': 570857819,
  'Fire': 570857819,
  'GCG_TAG_ELEMENT_HYDRO': 570857819,

  // Hydro
  'Hydro': 2763884907,
  'Water': 2763884907,
  'GCG_TAG_ELEMENT_PYRO': 2763884907,

  // Dendro
  'Dendro': 3544484259,
  'Grass': 3544484259,
  'GCG_TAG_ELEMENT_DENDRO': 3544484259,

  // Electro
  'Electro': 3010704803,
  'Electric': 3010704803,
  'Elec': 3010704803,
  'GCG_TAG_ELEMENT_ELECTRO': 3010704803,

  // Anemo
  'Anemo': 497883395,
  'Wind': 497883395,
  'GCG_TAG_ELEMENT_ANEMO': 497883395,

  // Cryo
  'Cryo': 4267146251,
  'Ice': 4267146251,
  'GCG_TAG_ELEMENT_CRYO': 4267146251,

  // Geo
  'Geo': 1050918155,
  'Rock': 1050918155,
  'GCG_TAG_ELEMENT_GEO': 1050918155,

  // Physical
  'Physical': 2185633152,
  'Physic': 2185633152,

  // Weapons
  // --------------------------------------------------------------------------------------------------------------
  'Sword': 2853832131,
  'WEAPON_SWORD_ONE_HAND': 2853832131,
  'GCG_TAG_WEAPON_SWORD': 2853832131,

  'Claymore': 2994597931,
  'WEAPON_CLAYMORE': 2994597931,
  'GCG_TAG_WEAPON_CLAYMORE': 2994597931,

  'Polearm': 3212334355,
  'WEAPON_POLE': 3212334355,
  'GCG_TAG_WEAPON_POLE': 3212334355,

  'Catalyst': 4174579731,
  'WEAPON_CATALYST': 4174579731,
  'GCG_TAG_WEAPON_CATALYST': 4174579731,

  'Bow': 4214538643,
  'WEAPON_BOW': 4214538643,
  'GCG_TAG_WEAPON_BOW': 4214538643,
};

export const ElementTypeToNation = {
  'None': 'None',
  'Fire': 'Natlan',
  'Water': 'Fontaine',
  'Grass': 'Sumeru',
  'Electric': 'Inazuma',
  'Wind': 'Mondstadt',
  'Ice': 'Snezhnaya',
  'Rock': 'Liyue',
};

export type ElementType = 'Electric' | 'Fire' | 'Grass' | 'Ice' | 'None' | 'Rock' | 'Water' | 'Wind';
export const ElementTypeArray: ElementType[] = [ 'Electric', 'Fire', 'Grass', 'Ice', 'None', 'Rock', 'Water', 'Wind' ];

export function standardElementCode(input: string): string {
  if (!input) {
    return null;
  }
  let out = STANDARD_ELEMENT_MAP[input.toLowerCase()];
  if (out) {
    return out;
  }
  const words = input.toLowerCase().split(/[\s_]+/g);
  for (let [key, value] of Object.entries(STANDARD_ELEMENT_MAP)) {
    if (words.includes(key)) {
      return value;
    }
  }
  return null;
}

const STANDARD_ELEMENT_MAP = {
  'pyro': 'PYRO',
  'fire': 'PYRO',

  'hydro': 'HYDRO',
  'water': 'HYDRO',

  'dendro': 'DENDRO',
  'grass': 'DENDRO',

  'electro': 'ELECTRO',
  'electric': 'ELECTRO',
  'elec': 'ELECTRO',

  'anemo': 'ANEMO',
  'wind': 'ANEMO',

  'cryo': 'CRYO',
  'ice': 'CRYO',

  'geo': 'GEO',
  'rock': 'GEO',

  'physical': 'PHYSICAL',
  'physic': 'PHYSICAL',
}
