/**
 * Test script to verify NeuralAgent routing works correctly
 * This simulates what happens when user clicks "Gerar Ideias" button
 */

const baseUrl = 'http://localhost:3001';

async function testNeuralEndpoint() {
  try {
    console.log('🧪 Testing NeuralAgent endpoint routing...\n');

    // Simulate what AgentPanel sends after clicking "Gerar Ideias"
    const testPayload = {
      map_id: 'test-map-001',
      agent_type: 'generate', // This is what action.id ('generate') becomes
      message: 'Gere ideias criativas e inovadoras para expandir meu mapa mental',
      context: {
        nodes: [
          { id: 'node-1', label: 'Mapa Mental', type: 'text', content: 'Projeto de IA' },
        ],
        edges: [],
        selected_node: { id: 'node-1' },
        conversation_history: [
          { role: 'user', content: 'Olá' },
        ],
      },
      options: {
        model: 'auto',
      },
      stream: true,
    };

    console.log('📤 Sending request to /api/ai/neural/stream with:');
    console.log(`   - agent_type: "${testPayload.agent_type}"`);
    console.log(`   - message: "${testPayload.message}"`);
    console.log(`   - nodes: ${testPayload.context.nodes.length}`);
    console.log(`   - stream: ${testPayload.stream}\n`);

    const response = await fetch(`${baseUrl}/api/ai/neural/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token', // Backend might require auth
      },
      body: JSON.stringify(testPayload),
    });

    console.log(`📥 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error: ${errorText}`);
      return false;
    }

    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      console.log('✅ Correct! Got SSE stream response\n');
      console.log('📊 Stream events received:');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let eventCount = 0;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            const eventType = line.slice(7).trim();
            console.log(`   [${++eventCount}] Event: ${eventType}`);
          }
          if (line.startsWith('data:') && line.length > 5) {
            const dataStr = line.slice(5).trim();
            if (dataStr !== '[DONE]') {
              try {
                // Try to parse as JSON to validate structure
                JSON.parse(dataStr);
              } catch (e) {
                // Skip non-JSON data
              }
            }
          }
        }
      }

      console.log(`\n✅ Successfully streamed ${eventCount} events from /api/ai/neural/stream`);
      return true;
    } else {
      console.error('❌ Wrong response type. Expected SSE stream.');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run test
testNeuralEndpoint()
  .then(success => {
    if (success) {
      console.log('\n🎉 All tests passed! Agent routing is working correctly.\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  Test failed. Check backend logs for details.\n');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
