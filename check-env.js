
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), 'sharpii-ai/.env.local');
console.log('Checking .env.local at:', envPath);

try {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    const keyLine = lines.find(line => line.trim().startsWith('SUPABASE_SERVICE_ROLE_KEY='));
    
    if (keyLine) {
      console.log('Found key definition line.');
      const value = keyLine.split('=')[1];
      if (value && value.trim().length > 10) {
        console.log('Value appears valid (length > 10).');
      } else {
        console.log('Value is empty or too short.');
      }
    } else {
      console.log('Key definition line NOT found (might be commented out or missing =).');
      // Check for commented out
      if (content.includes('#SUPABASE_SERVICE_ROLE_KEY') || content.includes('# SUPABASE_SERVICE_ROLE_KEY')) {
        console.log('Key appears to be commented out.');
      }
    }
  }
} catch (error) {
  console.error(error);
}
