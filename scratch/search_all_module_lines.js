const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:\\Users\\Kiran\\.gemini\\antigravity-ide\\brain\\1915bef8-f8a4-44bf-9e21-030df4a50a84\\.system_generated\\logs\\transcript.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('MODULE 6') || line.includes('MODULE 7') || line.includes('MODULE 8') || line.includes('MODULE 9')) {
      console.log("=== MATCH ===");
      console.log(line.substring(line.indexOf('MODULE 6') - 200, line.indexOf('MODULE 6') + 2000));
      break;
    }
  }
}

processLineByLine();
