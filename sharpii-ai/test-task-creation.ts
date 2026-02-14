import fetch from 'node-fetch';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.RUNNINGHUB_API_KEY;
const WORKFLOW_ID = process.env.RUNNINGHUB_SKIN_EDITOR_WORKFLOW_ID || '2021189307448434690';
const BASE_URL = process.env.RUNNINGHUB_BASE_URL || 'https://www.runninghub.ai';

if (!API_KEY) {
  console.error('RUNNINGHUB_API_KEY not found in environment');
  process.exit(1);
}

async function testTaskCreation() {
  console.log('Testing Task Creation...');
  const fileKey = await uploadDemoImage();
  const canUseSmartUpscale = process.env.RUNNINGHUB_ENABLE_SMART_TESTS !== 'false';
  const onlySmart4k = process.env.RUNNINGHUB_ONLY_SMART_4K === 'true';

  if (!onlySmart4k) {
    console.log('\n--- Test 1: Skin editor defaults (97, 140, 90, 167, 85, 88) ---');
    const nodeInfoList1 = [
      { nodeId: '97', fieldName: 'image', fieldValue: fileKey },
      { nodeId: '140', fieldName: 'text', fieldValue: 'test prompt' },
      { nodeId: '90', fieldName: 'denoise', fieldValue: '0.2' },
      { nodeId: '167', fieldName: 'max_shift', fieldValue: '1.0' },
      { nodeId: '85', fieldName: 'megapixels', fieldValue: '4' },
      { nodeId: '88', fieldName: 'guidance', fieldValue: '80' }
    ];
    
    await runTask(nodeInfoList1, WORKFLOW_ID);
  }

  if (canUseSmartUpscale) {
    console.log('\n--- Test 2: Smart upscale 4k (nodes 213/214) ---');
    const nodeInfoList2 = [
      { nodeId: '97', fieldName: 'image', fieldValue: fileKey },
      { nodeId: '140', fieldName: 'text', fieldValue: 'test prompt' },
      { nodeId: '90', fieldName: 'denoise', fieldValue: '0.2' },
      { nodeId: '167', fieldName: 'max_shift', fieldValue: '1.0' },
      { nodeId: '85', fieldName: 'megapixels', fieldValue: '4' },
      { nodeId: '88', fieldName: 'guidance', fieldValue: '80' },
      { nodeId: '213', fieldName: 'scale_by', fieldValue: '2.000000000000' },
      { nodeId: '214', fieldName: 'width', fieldValue: '4096' },
      { nodeId: '214', fieldName: 'height', fieldValue: '4096' }
    ];
    
    await runTask(nodeInfoList2, WORKFLOW_ID);

    if (!onlySmart4k) {
      console.log('\n--- Test 3: Smart upscale 8k (nodes 213/214) ---');
      const nodeInfoList3 = [
        { nodeId: '97', fieldName: 'image', fieldValue: fileKey },
        { nodeId: '140', fieldName: 'text', fieldValue: 'test prompt' },
        { nodeId: '90', fieldName: 'denoise', fieldValue: '0.2' },
        { nodeId: '167', fieldName: 'max_shift', fieldValue: '1.0' },
        { nodeId: '85', fieldName: 'megapixels', fieldValue: '4' },
        { nodeId: '88', fieldName: 'guidance', fieldValue: '80' },
        { nodeId: '213', fieldName: 'scale_by', fieldValue: '4.000000000000' },
        { nodeId: '214', fieldName: 'width', fieldValue: '8192' },
        { nodeId: '214', fieldName: 'height', fieldValue: '8192' }
      ];

      await runTask(nodeInfoList3, WORKFLOW_ID);
    }
  } else {
    console.log('\n--- Smart upscale tests skipped: no smart workflow ID configured ---');
  }
}

async function runTask(nodeInfoList: any[], workflowId: string) {
    const payload = {
        workflowId,
        apiKey: API_KEY,
        nodeInfoList
    };
    
    try {
        console.log('Request payload:', JSON.stringify(payload, null, 2));
        const response = await fetch(`${BASE_URL}/task/openapi/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json() as any;
        console.log('Response:', JSON.stringify(data, null, 2));
        if (data.code === 0 && data.data?.taskId) {
          await waitForOutputs(data.data.taskId);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function uploadDemoImage() {
  const sourceUrl = 'https://i.postimg.cc/LX8YJBvP/rgthree-compare-temp-mooiq-00008-xrddf-1770563081.jpg';
  const sourceResponse = await fetch(sourceUrl);
  if (!sourceResponse.ok) {
    throw new Error(`Failed to download test image: ${sourceResponse.statusText}`);
  }
  const contentType = sourceResponse.headers.get('content-type') || 'image/jpeg';
  const arrayBuffer = await sourceResponse.arrayBuffer();
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(arrayBuffer)], { type: contentType });
  const extension = contentType.split('/')[1] || 'jpg';
  formData.append('file', blob, `test-upload.${extension}`);
  formData.append('apikey', API_KEY as string);
  formData.append('apiKey', API_KEY as string);

  const response = await fetch(`${BASE_URL}/task/openapi/upload`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json() as any;
  console.log('Upload response:', JSON.stringify(data, null, 2));
  if (!response.ok || data.code !== 0 || !data.data || (!data.data.fileName && !data.data.url)) {
    throw new Error(data.msg || 'Failed to upload image to RunningHub');
  }

  return data.data.fileName || data.data.url;
}

async function waitForOutputs(taskId: string) {
  const maxAttempts = 60;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const statusResponse = await fetch(`${BASE_URL}/task/openapi/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: API_KEY, taskId })
    });

    const statusData = await statusResponse.json() as any;
    console.log('Status response:', JSON.stringify(statusData, null, 2));

    if (statusData.code === 0) {
      if (statusData.data === 'SUCCESS') {
        const outputsResponse = await fetch(`${BASE_URL}/task/openapi/outputs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: API_KEY, taskId })
        });
        const outputsData = await outputsResponse.json() as any;
        console.log('Outputs response:', JSON.stringify(outputsData, null, 2));
        return;
      }
      if (statusData.data === 'FAILED') {
        const outputsResponse = await fetch(`${BASE_URL}/task/openapi/outputs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: API_KEY, taskId })
        });
        const outputsData = await outputsResponse.json() as any;
        console.log('Outputs response:', JSON.stringify(outputsData, null, 2));
        return;
      }
    }

    attempts += 1;
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

testTaskCreation();
