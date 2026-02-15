

import fs from 'fs';
import path from 'path';
import { RunningHubProvider } from '../services/ai-providers/runninghub/runninghub-provider';

// Set environment variable for the test
process.env.RUNNINGHUB_API_KEY = '95d3c787224840998c28fd0f2da9b4a2';

async function runTest() {
  console.log('🚀 Starting Real API Test: Smart Upscale DISABLED');

  const provider = new RunningHubProvider({
    apiKey: '95d3c787224840998c28fd0f2da9b4a2',
    baseUrl: 'https://www.runninghub.ai'
  });
  
  const request = {
    userId: 'test-user-123',
    imageId: 'test-image-123',
    imageUrl: 'https://i.postimg.cc/2yhK39Yf/33de69f6-cc72-4b13-9430-4be047113364-(1)-(1).jpg',
    settings: {
      mode: 'Custom',
      prompt: 'visible natural pore scars embedded into the skin geometry on face near forehead and cheeks, uneven skin topology, natural scars skin topology, multiple natural scars on face, Ultra-high-definition professional photograph, 8K resolution, crystal-clear sharpness, do not add too many blemishes',
      denoise: 0.2,
      maxshift: 1.0,
      megapixels: 4,
      guidance: 80,
      // Smart Upscale Disabled
      smartUpscale: false, 
      upscaleResolution: '4k', // Should be ignored/disabled by logic
      workflowId: '2021189307448434690'
    }
  };

  try {
    console.log('Sending request to RunningHub...');
    const result = await provider.enhanceImage(request as any, 'skin-editor');

    if (result.success && result.enhancedUrl) {
      console.log('✅ Task Completed Successfully!');
      console.log('Output URL:', result.enhancedUrl);

      // Download the image
      const outputUrl = Array.isArray(result.enhancedUrl) ? result.enhancedUrl[0] : result.enhancedUrl;
      if (!outputUrl) {
          throw new Error('No output URL found');
      }

      console.log('Downloading image...');
      const response = await fetch(outputUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const outputPath = path.resolve(process.cwd(), 'output_disabled_test.jpg');
      fs.writeFileSync(outputPath, buffer);
      
      console.log(`\n📸 IMAGE SAVED TO: ${outputPath}`);
      console.log('You can now open this file to verify the result.');
      
      // Check if we got multiple outputs (which would be wrong)
      if (Array.isArray(result.enhancedUrl) && result.enhancedUrl.length > 1) {
          console.error('❌ ERROR: Received multiple images! Logic failed.');
          console.error('URLs:', result.enhancedUrl);
          throw new Error('Received multiple images when only one was expected');
      } else {
          console.log('✅ Correctly received single output image.');
      }

    } else {
      console.error('❌ Task Failed:', result.error);
      throw new Error(`Task Failed: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Execution Error:', error);
  }
}

runTest();


