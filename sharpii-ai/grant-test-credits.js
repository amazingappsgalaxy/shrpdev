const { CreditManager } = require('./src/lib/credits');

async function grantTestCredits() {
  try {
    const userId = 'test-user-1757479987823';
    const amount = 1000;
    
    console.log(`🎯 Granting ${amount} credits to user: ${userId}`);
    
    const result = await CreditManager.grantCredits({
      userId,
      amount,
      type: 'admin_grant',
      source: 'admin_grant',
      description: 'Test credits for enhancement testing',
      expiresAt: null // No expiration for test credits
    });
    
    console.log('✅ Credits granted successfully:', {
      creditId: result.creditId,
      transactionId: result.transactionId,
      newBalance: result.newBalance,
      creditsGranted: amount
    });
    
    // Verify the balance
    const balance = await CreditManager.getUserCreditBalance(userId);
    console.log(`💰 Current balance for ${userId}: ${balance} credits`);
    
  } catch (error) {
    console.error('❌ Error granting credits:', error);
  }
}

grantTestCredits();