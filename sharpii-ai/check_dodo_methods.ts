
import { dodoClient } from './src/lib/dodo-client';

console.log('Dodo Client Methods:');
console.log('subscriptions:', Object.keys(dodoClient.subscriptions || {}));
console.log('payments:', Object.keys(dodoClient.payments || {}));

// Check if update or cancel exists
if (dodoClient.subscriptions) {
    console.log('subscriptions.update:', typeof dodoClient.subscriptions.update);
    console.log('subscriptions.cancel:', typeof (dodoClient.subscriptions as any).cancel);
}
