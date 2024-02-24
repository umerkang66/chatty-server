const fs = require('fs');

const file = fs.readFileSync('.env', 'utf-8');

const envs = [];

file.split('\n').forEach(line => {
  const [env] = line.split('=');
  if (env) envs.push(env);
});

let ans = '';
envs.forEach(env => (ans += `public ${env}: string | undefined;\n`));

import('clipboardy').then(({ default: clipboardy }) => {
  clipboardy.writeSync(ans);
  console.log('--> Envs has been copied to clipboard <--');
});
