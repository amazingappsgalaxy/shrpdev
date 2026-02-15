
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('CWD:', process.cwd());

const possiblePaths = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '..', '.env.local'),
  path.resolve(process.cwd(), 'sharpii-ai', '.env.local')
];

let found = false;
for (const envPath of possiblePaths) {
  console.log('Checking:', envPath);
  if (fs.existsSync(envPath)) {
    console.log(`[config] Found env at ${envPath}`);
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    if (envConfig.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('SUPABASE_SERVICE_ROLE_KEY found in file!');
        console.log('Key starts with:', envConfig.SUPABASE_SERVICE_ROLE_KEY.substring(0, 5));
        found = true;
        break;
    } else {
        console.log('SUPABASE_SERVICE_ROLE_KEY NOT found in file.');
    }
  }
}

if (!found) {
    console.log('Could not find SUPABASE_SERVICE_ROLE_KEY in any checked path.');
}
