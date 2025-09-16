import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Test if Tebi-uploaded images are accessible to external services
async function testTebiImageAccess() {
  console.log('🔍 Testing Tebi Image Accessibility');
  console.log('============================================================');
  
  try {
    // Create a simple test image (1x1 pixel PNG)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
    
    console.log('📋 Step 1: Testing Tebi image upload process...');
    
    // Simulate the same process as RunningHub provider
    const base64Data = testImageBase64.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const mimeType = 'image/png';
    const extension = 'png';
    
    console.log('📊 Image details:');
    console.log('  - MIME Type:', mimeType);
    console.log('  - Extension:', extension);
    console.log('  - Buffer size:', buffer.length, 'bytes');
    
    // Import Tebi modules (same as RunningHub provider)
    const { tebiApi } = await import('./src/lib/api/tebi.js');
    const { tebiClient } = await import('./src/lib/tebi.js');
    const { tebiUtils } = await import('./src/lib/tebi.js');
    
    const fileName = `test-enhancement-input.${extension}`;
    const key = `uploads/${Date.now()}-${fileName}`;
    
    console.log('📋 Step 2: Uploading to Tebi...');
    console.log('  - Bucket:', tebiApi['bucketName'] || 'sharpii-ai');
    console.log('  - Key:', key);
    
    const uploadParams = {
      Bucket: tebiApi['bucketName'] || 'sharpii-ai',
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
        category: 'uploads'
      }
    };
    
    await tebiClient.putObject(uploadParams).promise();
    
    // Generate the public URL
    const uploadResult = {
      key,
      url: tebiUtils.getFileUrl(key),
      size: buffer.length
    };
    
    console.log('✅ Upload successful!');
    console.log('📊 Upload result:');
    console.log('  - Key:', uploadResult.key);
    console.log('  - URL:', uploadResult.url);
    console.log('  - Size:', uploadResult.size, 'bytes');
    
    if (!uploadResult.url) {
      console.log('❌ No URL generated from upload');
      return;
    }
    
    console.log('\n📋 Step 3: Testing URL accessibility...');
    
    // Test 1: Direct fetch from our application
    console.log('🧪 Test 1: Direct fetch from Node.js...');
    try {
      const directResponse = await fetch(uploadResult.url, { method: 'HEAD' });
      console.log('✅ Direct access successful:', directResponse.status, directResponse.statusText);
      console.log('  - Content-Type:', directResponse.headers.get('content-type'));
      console.log('  - Content-Length:', directResponse.headers.get('content-length'));
    } catch (error) {
      console.log('❌ Direct access failed:', error.message);
    }
    
    // Test 2: Test with RunningHub workflow (same as our successful test)
    console.log('\n🧪 Test 2: Testing with RunningHub workflow...');
    const BASE_URL = 'https://www.runninghub.ai';
    const WORKFLOW_ID = '1965053107388432385';
    const API_KEY = '95d3c787224840998c28fd0f2da9b4a2';
    
    try {
      const createResponse = await fetch(`${BASE_URL}/task/openapi/create`, {
        method: 'POST',
        headers: {
          'Host': 'www.runninghub.ai',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: API_KEY,
          workflowId: WORKFLOW_ID,
          nodeInfoList: [
            {
              nodeId: '97',
              fieldName: 'image',
              fieldValue: uploadResult.url // Use our Tebi URL
            },
            {
              nodeId: '86',
              fieldName: 'text',
              fieldValue: 'test image from tebi storage'
            }
          ],
          addMetadata: true
        })
      });
      
      const createData = await createResponse.json();
      console.log('📊 RunningHub task creation response:', JSON.stringify(createData, null, 2));
      
      if (createData.code === 0) {
        console.log('✅ RunningHub accepted our Tebi URL!');
        console.log('📋 Task ID:', createData.data.taskId);
        
        // Check for validation errors in promptTips
        if (createData.data.promptTips) {
          try {
            const promptTips = JSON.parse(createData.data.promptTips);
            if (promptTips.result === false) {
              console.log('❌ Workflow validation failed:', promptTips.error);
              if (promptTips.node_errors && promptTips.node_errors['97']) {
                console.log('🔍 Node 97 (LoadImage) errors:', promptTips.node_errors['97']);
              }
            } else {
              console.log('✅ Workflow validation passed!');
            }
          } catch (e) {
            console.log('🔍 Raw promptTips:', createData.data.promptTips);
          }
        }
      } else if (createData.code === 433) {
        console.log('❌ RunningHub validation failed (433)');
        if (createData.msg) {
          try {
            const errorDetails = JSON.parse(createData.msg);
            console.log('🔍 Error details:', JSON.stringify(errorDetails, null, 2));
            
            if (errorDetails.node_errors && errorDetails.node_errors['97']) {
              const node97Error = errorDetails.node_errors['97'];
              console.log('🚨 Node 97 (LoadImage) error:', node97Error);
              
              if (node97Error.errors) {
                node97Error.errors.forEach(error => {
                  if (error.type === 'custom_validation_failed' && error.details.includes('Invalid image file')) {
                    console.log('💡 Issue: RunningHub cannot access our Tebi URL');
                    console.log('💡 Possible causes:');
                    console.log('   - Tebi URLs require authentication');
                    console.log('   - CORS restrictions');
                    console.log('   - Network accessibility issues');
                    console.log('   - URL format not supported');
                  }
                });
              }
            }
          } catch (e) {
            console.log('Raw error message:', createData.msg);
          }
        }
      } else {
        console.log('❌ RunningHub API error:', createData.code, createData.msg);
      }
      
    } catch (error) {
      console.log('❌ RunningHub test failed:', error.message);
    }
    
    console.log('\n📋 Step 4: Cleanup...');
    try {
      // Delete the test file
      await tebiClient.deleteObject({
        Bucket: tebiApi['bucketName'] || 'sharpii-ai',
        Key: key
      }).promise();
      console.log('✅ Test file cleaned up');
    } catch (error) {
      console.log('⚠️ Cleanup failed:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.log('❌ Error stack:', error.stack);
  }
}

// Run the test
console.log('🚀 Starting Tebi Image Access Test\n');
testTebiImageAccess().then(() => {
  console.log('\n🏁 Test completed!');
}).catch(console.error);