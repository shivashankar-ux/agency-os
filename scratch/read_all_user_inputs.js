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
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT') {
      console.log(`[USER INPUT ${index++}] created_at=${obj.created_at}`);
      console.log(obj.content.substring(0, 1000));
      console.log("-----------------------------------------");
    }
  }
}

processLineByLine();
