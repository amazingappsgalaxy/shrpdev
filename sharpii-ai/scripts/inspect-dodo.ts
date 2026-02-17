
import dodoClient from '../src/lib/dodo-client'

async function inspect() {
    console.log('Dodo Client keys:', Object.keys(dodoClient))

    if (dodoClient.subscriptions) {
        console.log('Dodo Subscriptions keys:', Object.keys(dodoClient.subscriptions))
        // Check prototype if keys are hidden
        console.log('Dodo Subscriptions proto:', Object.getOwnPropertyNames(Object.getPrototypeOf(dodoClient.subscriptions)))
    }

    if (dodoClient.payments) {
        console.log('Dodo Payments keys:', Object.keys(dodoClient.payments))
    } else {
        console.log('No payments key found')
    }

    // Try to find list method
    console.log('Searching for list methods...')
}

inspect().catch(console.error)
