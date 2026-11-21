import { executeCandidate } from './execution-capability.mjs';

try {
  let input = '';
  for await (const chunk of process.stdin.setEncoding('utf8')) {
    input += chunk;
    if (input.length > 512 * 1024) throw new Error('Candidate request too large');
  }
  console.log(JSON.stringify(await executeCandidate(JSON.parse(input))));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
