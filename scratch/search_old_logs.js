const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:\\Users\\Kiran\\.gemini\\antigravity-ide\\brain\\d5097981-3415-4a2e-915d-8fe8c6673af1\\.system_generated\\logs\\transcript.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.toLowerCase().includes('client portal') || line.toLowerCase().includes('module 6') || line.toLowerCase().includes('file management')) {
      const idx = line.toLowerCase().indexOf('module 6');
      if (idx !== -1) {
        console.log("=== MATCH IN OLD LOGS ===");
        console.log(line.substring(Math.max(0, idx - 200), Math.min(line.length, idx + 800)));
        break;
      }
    }
  }
}

processLineByLine();
