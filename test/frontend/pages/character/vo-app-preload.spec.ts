import { loadResourceAsJson, loadResourceAsString } from '../../../spec-util';
import { CharacterFetters } from '../../../../src/shared/types/fetter-types';
import { preloadFromFetters } from '../../../../src/frontend/pages/character/vo-app-preload';

const characterFetters: CharacterFetters = loadResourceAsJson('Nahida_Fetters.json');

const result = preloadFromFetters(characterFetters, 'combat', 'EN', 'EN');

console.log(result);