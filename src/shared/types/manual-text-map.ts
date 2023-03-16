
export const ManualTextMapHashes = {
  'None': 3053155130,

  // Regions / Maps
  'Natlan': 3332492851,
  'Fontaine': 242250147,
  'Sumeru': 1074864084,
  'Inazuma': 869248244,
  'Mondstadt': 706446876,
  'Snezhnaya': 536575635,
  'Liyue': 1982412604,
  'Serenitea Pot': 3071628724,
  'Golden Apple Archipelago': 3682200372,
  'Three Realms Gateway Offering': 2887066388,
  'Spiral Abyss': 2284786655,
  'Enkanomiya': 1862653596,

  // General
  'Domains': 705921482,
  'Domain': 4043227537,

  // Elements
  'Fire': 3531671786,
  'Water': 514679490,
  'Grass': 3552853794,
  'Electric': 1844493602,
  'Wind': 594678994,
  'Ice': 3168728290,
  'Rock': 1844983962,
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