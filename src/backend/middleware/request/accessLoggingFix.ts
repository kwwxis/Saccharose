import fs from 'fs';

export function fixPacificTimestampsInFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex to match timestamps like "5/31/2025, 2:30:21 PM PST"
  const timestampRegex = /\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2} [AP]M P[SD]T/g;

  content = content.replace(timestampRegex, (match) => {
    return correctPacificTimeAbbreviation(match);
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Timestamps corrected in file: ${filePath}`);
}

export function correctPacificTimeAbbreviation(timestamp: string) {
  // Match the components of the timestamp
  const match = timestamp.match(/^(.+?),\s(.+?)\s(P[SD]T)$/);
  if (!match) {
    console.error("Invalid timestamp for format: " + timestamp);
    return timestamp;
  }

  const [_, datePart, timePart, tzAbbr] = match;

  // Create a Date object in the Pacific time zone using Intl
  const pacificTime = new Date(`${datePart} ${timePart}`);

  // Determine if Daylight Saving Time (PDT) is in effect
  const isDST = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'short'
  }).formatToParts(pacificTime).some(part => part.value === 'PDT');

  const correctAbbr = isDST ? 'PDT' : 'PST';

  // Return the corrected timestamp
  return `${datePart}, ${timePart} ${correctAbbr}`;
}
