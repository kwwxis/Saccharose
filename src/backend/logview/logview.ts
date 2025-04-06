import '../loadenv.ts';
import fs from 'fs';
import { sha256 } from '../util/hash-util.ts';

const regexes = {
  access: /^\[(\d+\/\d+\/\d+), (\d+:\d+:\d+) (AM|PM) PST] \[([^\]]+)] \[(\w{2}):(\w{2})\|(\w+)] (\d{3}) (\w+)(.*)\((\d+\.?\d*) ms\)$/,
  debug: /^$/,
  other: /^.*$/,
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
