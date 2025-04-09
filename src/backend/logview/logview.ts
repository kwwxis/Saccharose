import '../loadenv.ts';
import fs from 'fs';
import { concatRegExp, REGEX_ISO_8601 } from '../../shared/util/stringUtil.ts';

const regexes = {
  access: /^\[(\d+\/\d+\/\d+), (\d+:\d+:\d+) (AM|PM) PST] \[([^\]]+)] \[(\w{2}):(\w{2})\|(\w+)] (\d{3}) (\w+)(.*)\((\d+\.?\d*) ms\)$/,
  debug: concatRegExp([
    /^/,
    REGEX_ISO_8601,
    /\s(.*)/,
    /$/
  ]),
  other: /^(.*)$/
}

const logRegex = /^\[(\d+\/\d+\/\d+), (\d+:\d+:\d+) (AM|PM) PST] \[([^\]]+)] \[(\w{2}):(\w{2})\|(\w+)] (\d{3}) (\w+)(.*)\((\d+\.?\d*) ms\)$/;

function importFile() {

  // sha256
  //
  // '2025-03-28T17:38:25.045Z content'

  const fileContent = fs.readFileSync(process.env.LOGVIEW_FILE, 'utf8');
  const fileLines = fileContent.split(/\r?\n/).slice(0,20);

  console.log(fileLines);
}
