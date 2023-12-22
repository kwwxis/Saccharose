import { getQuotePosMap, MW_QUOTE_POSMAP, MW_QUOTE_TYPE } from '../../../../shared/mediawiki/mwQuotes';

export type AceToken = {type: string, value: string};

function addTokenType(token: AceToken|AceToken[], types: string|string[]) {
  if (!types.length) {
    return;
  }
  if (Array.isArray(token)) {
    token.forEach(t => addTokenType(t, types));
    return;
  }

  let existingTypes: string[] = token.type ? token.type.split('.') : [];

  for (let type of (Array.isArray(types) ? types : [types])) {
    if (!existingTypes.includes(type)) {
      existingTypes.push(type);
    }
  }

  token.type = existingTypes.join('.');
}

function areQuotes(... token: AceToken[]) {
  return token.every(t => t && t.value === `'`);
}

export function quotifyWikitextTokens(tokens: AceToken[]) {
  if (!tokens || !tokens.length) {
    return tokens;
  }

  let line: string = '';
  let charTokens: AceToken[] = [];
  let boldOpen = 0;
  let italicOpen = 0;

  // STEP 1: Split tokens into a token for every character:
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  for (let token of tokens) {
    for (let i = 0; i < token.value.length; i++) {
      let ch = token.value.charAt(i);
      line += ch;
      charTokens.push({ value: ch, type: token.type || '' });
    }
  }

  // Step 2: Get quote position map and apply token types as necessary
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  const quotePosMap: MW_QUOTE_POSMAP = getQuotePosMap(line);
  for (let i = 0; i < charTokens.length; i++) {
    const token = charTokens[i];
    const quoteTypes: MW_QUOTE_TYPE[] = quotePosMap[i];

    for (let quoteType of quoteTypes) {
      let ch0 = token;
      let ch1 = charTokens[i + 1];
      let ch2 = charTokens[i + 2];
      switch (quoteType) {
        case 'BOLD_OPEN':
          boldOpen++;
          if (areQuotes(ch0, ch1, ch2)) {
            addTokenType([ch0, ch1, ch2], ['bold', 'bold-open']);
          }
          break;
        case 'BOLD_CLOSE':
          boldOpen--;
          if (areQuotes(ch0, ch1, ch2)) {
            addTokenType([ch0, ch1, ch2], ['bold', 'bold-close']);
          }
          break;
        case 'ITALIC_OPEN':
          italicOpen++;
          if (areQuotes(ch0, ch1)) {
            addTokenType([ch0, ch1], ['bold', 'bold-open']);
          }
          break;
        case 'ITALIC_CLOSE':
          italicOpen--;
          if (areQuotes(ch0, ch1)) {
            addTokenType([ch0, ch1], ['bold', 'bold-close']);
          }
          break;
      }
    }

    if (boldOpen) {
      addTokenType(token, 'bold');
    }
    if (italicOpen) {
      addTokenType(token, 'italic');
    }
  }

  // Step 3: Rejoin character tokens
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  let newTokens: AceToken[] = [];

  let currToken: AceToken = charTokens[0];

  for (let charToken of charTokens.slice(1)) {
    if (charToken.type === currToken.type) {
      currToken.value += charToken.value;
    } else {
      newTokens.push(currToken);
      currToken = charToken;
    }
  }
  newTokens.push(currToken);

  return newTokens;
}