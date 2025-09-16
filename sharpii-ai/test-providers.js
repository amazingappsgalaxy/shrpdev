// Test script to verify AI providers are working correctly
const { EnhancementService } = require('./src/services/ai-providers/enhancement-service');

async function testProviders() {
  console.log('🧪 Testing AI Providers...');

  try {
    // Get enhancement service instance
    const service = EnhancementService.getInstance();

    // Test 1: Get available models
    console.log('\n📋 Testing getAvailableModels()...');
    const models = awaitservice.getAvailableModels();
    console.log(`Found ${models.length} models:`);
    models.forEach(model => {
      console.log(`  - ${model.displayName} (${model.id}) from ${model.provider.displayName}`);
    });

    // Test 2: Get provider status
    console.log('\n🔧 Testing provider status...');
    const providerStatus = service.getProviderStatus();
    Object.entries(providerStatus).forEach(([provider, status]) => {
      console.log(`  - ${provider}: Available=${status.available}, Configured=${status.configured}`);
    });

    // Test 3: Get configured providers
    console.log('\n✅ Testing configured providers...');
    const configuredProviders = service.getConfiguredProviders?.() || [];
    console.log(`Configured providers: ${configuredProviders.join(', ')}`);

    if (models.length === 0) {
      console.log('\n❌ No models available - this explains why the dropdown is empty!');
      console.log('Check the following:');
      console.log('1. Environment variables (REPLICATE_API_TOKEN, RUNNINGHUB_API_KEY)');
      console.log('2. Provider configuration in config.ts');
      console.log('3. Provider initialization in factory');
    } else {
      console.log('\n✅ Models are available - the frontend should show them');
    }

  } catch (error) {
    console.error('❌ Error testing providers:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testProviders();