
import fetch from 'node-fetch';

const API_KEY = '95d3c787224840998c28fd0f2da9b4a2';
const WORKFLOW_ID = '2021189307448434690';

const NODES_TO_TEST = [
  { id: '97', field: 'image', val: 'https://i.postimg.cc/gJHLjBwj/image.png', name: 'Input Image' },
  { id: '140', field: 'text', val: 'test prompt', name: 'Prompt' },
  { id: '90', field: 'denoise', val: '0.35', name: 'Denoise' },
  { id: '167', field: 'max_shift', val: '1.0', name: 'Max Shift' },
  { id: '85', field: 'megapixels', val: '4', name: 'Megapixels' },
  { id: '88', field: 'guidance', val: '3.5', name: 'Guidance' },
  { id: '166', field: 'lora_name', val: 'skin.safetensors', name: 'Lora Name' },
  
  // Smart Upscale Nodes
  { id: '219', field: 'enable', val: 'true', name: 'Smart Upscale Toggle (True)' },
  { id: '219', field: 'enable', val: 'false', name: 'Smart Upscale Toggle (False)' },
  { id: '213', field: 'scale_by', val: '2', name: 'Scale By (2)' },
  { id: '213', field: 'scale_by', val: '4', name: 'Scale By (4)' },
  { id: '214', field: 'width', val: '4096', name: 'Width' },
  { id: '214', field: 'height', val: '4096', name: 'Height' },

  // Face Parsing Nodes
  { id: '138', field: 'skin', val: 'true', name: 'FaceParsing: Skin' },
  { id: '138', field: 'nose', val: 'true', name: 'FaceParsing: Nose' },
  { id: '138', field: 'mouth', val: 'true', name: 'FaceParsing: Mouth' },
  { id: '138', field: 'u_lip', val: 'true', name: 'FaceParsing: Upper Lip' },
  { id: '138', field: 'l_lip', val: 'true', name: 'FaceParsing: Lower Lip' },
  { id: '138', field: 'eye_g', val: 'true', name: 'FaceParsing: Eye General' },
  { id: '138', field: 'r_eye', val: 'true', name: 'FaceParsing: Right Eye' },
  { id: '138', field: 'l_eye', val: 'true', name: 'FaceParsing: Left Eye' },
  { id: '138', field: 'r_brow', val: 'true', name: 'FaceParsing: Right Brow' },
  { id: '138', field: 'l_brow', val: 'true', name: 'FaceParsing: Left Brow' },
  { id: '138', field: 'background', val: 'true', name: 'FaceParsing: Background' },
  { id: '138', field: 'hair', val: 'true', name: 'FaceParsing: Hair' },
  { id: '138', field: 'cloth', val: 'true', name: 'FaceParsing: Cloth' },
  { id: '138', field: 'neck', val: 'true', name: 'FaceParsing: Neck' },
  
  // Output Nodes
  { id: '215', field: 'filename_prefix', val: 'test', name: 'Output 1 (Smart Upscale)' },
  { id: '136', field: 'filename_prefix', val: 'test', name: 'Output 2 (Normal)' }
];

async function probeNode(workflowId: string, node: any) {
  try {
    const response = await fetch('https://www.runninghub.ai/task/openapi/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: API_KEY,
        workflowId: workflowId,
        nodeInfoList: [{
          nodeId: node.id,
          fieldName: node.field,
          fieldValue: node.val
        }]
      })
    });

    const data = await response.json() as any;
    
    // 803: Invalid Node Info (FAIL)
    // 0: Success (PASS)
    // 433: Validation Failed (PASS - means node exists)
    // 380: Workflow not found (FAIL)
    
    if (data.code !== 803 && data.code !== 380) {
      console.log(`✅ [PASS] Node ${node.id} (${node.name}) accepted (Code: ${data.code})`);
      return true;
    } else {
      console.log(`❌ [FAIL] Node ${node.id} (${node.name}) rejected (Code: ${data.code}) - Msg: ${data.msg}`);
      return false;
    }
  } catch (e) {
    console.error(`Error probing ${node.id}:`, e);
    return false;
  }
}

async function main() {
  console.log(`Probing Workflow ${WORKFLOW_ID}...`);
  
  let successCount = 0;
  for (const node of NODES_TO_TEST) {
    const passed = await probeNode(WORKFLOW_ID, node);
    if (passed) successCount++;
  }
  
  console.log(`\nResult: ${successCount}/${NODES_TO_TEST.length} nodes verified.`);
}

main();
