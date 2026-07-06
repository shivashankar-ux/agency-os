const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:\\Users\\Kiran\\.gemini\\antigravity-ide\\brain\\1915bef8-f8a4-44bf-9e21-030df4a50a84\\.system_generated\\logs\\transcript.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let index = 0;
  for await (const line of rl) {
    if (line.toLowerCase().includes('portal') || line.toLowerCase().includes('client portal') || line.toLowerCase().includes('module 6')) {
      console.log(`[MATCH ${index++}]`);
      // print snippet
      const idx = line.toLowerCase().indexOf('portal');
      if (idx !== -1) {
        console.log("Snippet:", line.substring(Math.max(0, idx - 100), Math.min(line.length, idx + 400)));
      }
    }
  }
}

processLineByLine();
