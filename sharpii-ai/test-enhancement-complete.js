const fs = require('fs');
const path = require('path');

// Create a simple 1x1 pixel JPEG for testing
const createTestImage = () => {
  // Minimal JPEG header + 1x1 pixel data
  const jpegData = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
    0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
    0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
    0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x8A, 0x00,
    0xFF, 0xD9
  ]);
  return jpegData.toString('base64');
};

async function testCompleteEnhancement() {
  console.log('🚀 Starting Complete Enhancement Test');
  console.log('📋 This test will:');
  console.log('   1. Upload a test image');
  console.log('   2. Send enhancement request');
  console.log('   3. Verify successful processing');
  console.log('   4. Check output image URL');
  console.log('');

  try {
    const testImageBase64 = createTestImage();
    const imageUrl = `data:image/jpeg;base64,${testImageBase64}`;
    
    const testPayload = {
      imageUrl: imageUrl,
      modelId: 'runninghub-flux-upscaling',
      settings: {
        prompt: 'high quality, detailed, enhanced',
        seed: Math.floor(Math.random() * 1000000),
        steps: 20,
        guidance_scale: 7.5
      }
    };

    console.log('📤 Sending enhancement request...');
    console.log('📋 Model ID:', testPayload.modelId);
    console.log('🎯 Settings:', testPayload.settings);
    console.log('');

    const response = await fetch('http://localhost:3002/api/enhance-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('');

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS! Enhancement completed');
      console.log('📊 Response Data:', JSON.stringify(result, null, 2));
      
      if (result.success && result.enhancedUrl) {
        console.log('');
        console.log('🎉 COMPLETE SUCCESS!');
        console.log('✅ Enhancement processed successfully');
        console.log('✅ Output image URL generated:', result.enhancedUrl);
        console.log('✅ Processing time:', result.processingTime || 'N/A');
        console.log('✅ Task ID:', result.taskId || 'N/A');
        
        // Test if the output URL is accessible
        try {
          const imageResponse = await fetch(result.enhancedUrl);
          if (imageResponse.ok) {
            console.log('✅ Output image is accessible and downloadable');
            console.log('📊 Image size:', imageResponse.headers.get('content-length') || 'Unknown');
            console.log('📊 Content type:', imageResponse.headers.get('content-type') || 'Unknown');
          } else {
            console.log('⚠️ Output image URL returned but not accessible:', imageResponse.status);
          }
        } catch (urlError) {
          console.log('⚠️ Could not verify output image accessibility:', urlError.message);
        }
        
      } else {
        console.log('⚠️ Enhancement completed but no output URL provided');
        console.log('📊 Result details:', result);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Enhancement failed with status:', response.status);
      console.log('❌ Error response:', errorText);
      
      if (response.status === 401) {
        console.log('');
        console.log('🔐 Authentication required. To test with proper auth:');
        console.log('1. Open http://localhost:3002 in browser');
        console.log('2. Log in to the application');
        console.log('3. Test enhancement through the UI');
      }
    }

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.log('❌ Error stack:', error.stack);
  }

  console.log('');
  console.log('🏁 Test completed!');
}

// Run the test
testCompleteEnhancement();