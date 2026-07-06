const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:\\Users\\Kiran\\.gemini\\antigravity-ide\\brain\\1915bef8-f8a4-44bf-9e21-030df4a50a84\\.system_generated\\logs\\transcript.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const obj = JSON.parse(line);
    if (obj.source === 'USER_EXPLICIT' && obj.content && obj.content.includes('You are the Lead Software Architect, Product Manager and Senior Full Stack Engineer')) {
      // Print the full content directly to file or console
      fs.writeFileSync('scratch/full_prompt.txt', obj.content);
      console.log("Saved full prompt to scratch/full_prompt.txt");
      break;
    }
  }
}

processLineByLine();
