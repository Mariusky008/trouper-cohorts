import { generateMatches } from '../src/lib/matching';

async function run() {
  console.log("Triggering matches for today...");
  const result = await generateMatches(new Date('2026-03-17'));
  console.log(result);
}

run();
