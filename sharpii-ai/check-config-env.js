
const { config } = require('./src/lib/config');

console.log('--------------------------------------------------');
console.log('Supabase Config Check:');
console.log('URL:', config.database.supabaseUrl);
console.log('Service Key Present:', !!config.database.supabaseServiceKey);
if (config.database.supabaseServiceKey) {
  console.log('Service Key Length:', config.database.supabaseServiceKey.length);
  console.log('Service Key Start:', config.database.supabaseServiceKey.substring(0, 10) + '...');
} else {
  console.log('Service Key is MISSING!');
}
console.log('--------------------------------------------------');
