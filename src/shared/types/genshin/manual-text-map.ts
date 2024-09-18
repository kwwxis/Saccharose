
export const ManualTextMapHashes = {
  // None:
  'None': 3053155130,
  'GCG_TAG_WEAPON_NONE': 3053155130,
  'GCG_TAG_ELEMENT_NONE': 3053155130,

  // All:
  'All': 4081188009,
  'Other': 4294312844,

  // Lumine/Aether:
  'Lumine': 3241049361,
  'Aether': 2329553598,

  // Regions / Maps / Nations / Factions
  // --------------------------------------------------------------------------------------------------------------
  // Monstadt
  'Mondstadt': 706446876,
  'GCG_TAG_NATION_MONDSTADT': 706446876,

  // Liyue:
  'Liyue': 1982412604,
  'GCG_TAG_NATION_LIYUE': 1982412604,

  // Inazuma
  'Inazuma': 869248244,
  'GCG_TAG_NATION_INAZUMA': 869248244,

  // Sumeru
  'Sumeru': 1074864084,
  'GCG_TAG_NATION_SUMERU': 1074864084,

  // Fontaine
  'Fontaine': 242250147,
  'GCG_TAG_NATION_FONTAINE': 242250147,

  // Natlan
  'Natlan': 3332492851,
  'GCG_TAG_NATION_NATLAN': 3332492851,

  // Snezhnaya
  'Snezhnaya': 536575635,
  'GCG_TAG_NATION_SNEZHNAYA': 536575635,

  // Khaenri'ah
  "Khaenri'ah": 4075667307,
  'Khaenriah': 4075667307,
  'GCG_TAG_NATION_KHAENRIAH': 4075667307,

  // Other Maps
  'Serenitea Pot': 3071628724,
  'Golden Apple Archipelago': 3682200372,
  'Three Realms Gateway Offering': 2887066388,
  'Spiral Abyss': 2284786655,
  'Enkanomiya': 1862653596,
  'Veluriyam Mirage': 84855465,
  'Simulanka': 467583217,

  // Other Factions
  'Fatui': 243035471,
  'GCG_TAG_CAMP_FATUI': 243035471,

  'Hilichurl': 148952339,
  'GCG_TAG_CAMP_HILICHURL': 148952339,

  'Monster': 880768891,
  'GCG_TAG_CAMP_MONSTER': 880768891,

  'Kairagi': 65490883,
  'GCG_TAG_CAMP_KAIRAGI': 65490883,

  // General
  // --------------------------------------------------------------------------------------------------------------
  'Domains': 705921482,
  'Domain': 4043227537,

  'Furnishing Set': 1999112795,
  'Gift Set': 205103331,

  // Elements
  // --------------------------------------------------------------------------------------------------------------
  // Pyro
  'Pyro': 3531671786,
  'Fire': 3531671786,
  'GCG_TAG_ELEMENT_HYDRO': 3531671786,

  // Hydro
  'Hydro': 514679490,
  'Water': 514679490,
  'GCG_TAG_ELEMENT_PYRO': 514679490,

  // Dendro
  'Dendro': 3552853794,
  'Grass': 3552853794,
  'GCG_TAG_ELEMENT_DENDRO': 3552853794,

  // Electro
  'Electro': 1844493602,
  'Electric': 1844493602,
  'Elec': 1844493602,
  'GCG_TAG_ELEMENT_ELECTRO': 1844493602,

  // Anemo
  'Anemo': 594678994,
  'Wind': 594678994,
  'GCG_TAG_ELEMENT_ANEMO': 594678994,

  // Cryo
  'Cryo': 3168728290,
  'Ice': 3168728290,
  'GCG_TAG_ELEMENT_CRYO': 3168728290,

  // Geo
  'Geo': 1844983962,
  'Rock': 1844983962,
  'GCG_TAG_ELEMENT_GEO': 1844983962,

  // Physical
  'Physical': 2185633152,
  'Physic': 2185633152,

  // Weapons
  // --------------------------------------------------------------------------------------------------------------
  'Sword': 4182347097,
  'WEAPON_SWORD_ONE_HAND': 4182347097,
  'GCG_TAG_WEAPON_SWORD': 4182347097,

  'Claymore': 2629625177,
  'WEAPON_CLAYMORE': 2629625177,
  'GCG_TAG_WEAPON_CLAYMORE': 2629625177,

  'Polearm': 3939718601,
  'WEAPON_POLE': 3939718601,
  'GCG_TAG_WEAPON_POLE': 3939718601,

  'Catalyst': 43479985,
  'WEAPON_CATALYST': 43479985,
  'GCG_TAG_WEAPON_CATALYST': 43479985,

  'Bow': 3537421225,
  'WEAPON_BOW': 3537421225,
  'GCG_TAG_WEAPON_BOW': 3537421225,
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
