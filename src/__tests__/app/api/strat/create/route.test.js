import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';

// Hoisted (2 hrs)
const createMock = vi.hoisted(() => vi.fn());

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, options) => ({ data, options }))
  }
}));

vi.mock('openai', () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: createMock
      }
    }
  }))
}));

vi.mock('langfuse', () => ({
  Langfuse: vi.fn(() => ({
    trace: vi.fn(() => ({
      id: 'mock-trace-id',
      update: vi.fn()
    }))
  })),
  observeOpenAI: vi.fn((client) => client)
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid')
}));

vi.mock('../../../../../lib/agents/prompts', () => ({
  getStratPrompt: vi.fn(() => 'mock-prompt')
}));

vi.mock('../../../../../lib/agents/tools', () => ({
  getAgentsTool: { type: 'function', function: { name: 'getAgents' } },
  suggestPlacementsTool: { type: 'function', function: { name: 'suggestPlacements' } },
  getCalloutsTool: { type: 'function', function: { name: 'getCallouts' } },
  finishTaskTool: { type: 'function', function: { name: 'finishTask' } }
}));

// Después de todos los mocks, importamos el módulo a testear
import { POST } from '../../../../../app/api/strat/create/route';
import { NextResponse } from 'next/server';

// Silenciar errores de consola durante los tests
const originalConsoleError = console.error;
console.error = vi.fn();

// Mock para funciones globales que pueden estar siendo usadas en el endpoint
global.dispatch = vi.fn();
global.setAgentStatus = vi.fn();

describe('Strat create route', () => {
  let mockRequest;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue([
        { name: 'Jett', role: 'Duelist' },
        { name: 'Cypher', role: 'Sentinel' }
      ])
    });
    
    // Mock req
    mockRequest = {
      json: vi.fn().mockResolvedValue({
        prompt: 'Test prompt',
        attackers: [{ 
          displayName: 'Jett', 
          role: { displayName: 'Duelist' },
          abilities: [{ displayName: 'Updraft', description: 'INSTANTLY propel Jett high into the air.' }]
        }],
        defenders: [{ 
          displayName: 'Cypher', 
          role: { displayName: 'Sentinel' },
          abilities: [{ displayName: 'Trapwire', description: 'EQUIP a trapwire. FIRE to place a destructible and covert tripwire.' }]
        }],
        selectedMap: { 
          uuid: 'map-123', 
          displayName: 'Haven',
          tacticalDescription: 'Three sites',
          callouts: [{ regionName: 'A Site', superRegionName: 'A', location: 'Northeast' }]
        },
        messageHistory: []
      }),
      url: 'http://localhost:3000/api/strat/create'
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('deberia crear una estrategia correctamente sin tool calls', async () => {
    // Response mock without tool calls
    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'This is a strategy response'
          }
        }
      ]
    });

    await POST(mockRequest);
    
    // Verify call
    expect(createMock).toHaveBeenCalled();
    
    // Verify response
    expect(NextResponse.json).toHaveBeenCalledWith({
      message: {
        role: 'assistant',
        content: 'This is a strategy response'
      }
    });
  });

  it('deberia crear una estrategia correctamente con tool calls', async () => {
    // First call
    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'This is a strategy response',
            tool_calls: [
              {
                id: 'call_123',
                function: {
                  name: 'getAgents',
                  arguments: '{}'
                }
              }
            ]
          }
        }
      ]
    });

    // Second call
    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'This is a strategy response'
          }
        }
      ]
    });

    await POST(mockRequest);
    
    // Verificar que se llamó al API de OpenAI dos veces
    expect(createMock).toHaveBeenCalledTimes(2);

    // Verificar la respuesta
    expect(NextResponse.json).toHaveBeenCalledWith({
      message: {
        role: 'assistant',
        content: 'This is a strategy response'
      },
      toolCalls: [
        {
          name: 'getAgents',
          arguments: {},
          phase: 'contributing',
          order: 0
        }
      ]
    });
  });

  it('deberia manejar errores correctamente', async () => {
    // Error mock
    mockRequest.json.mockRejectedValueOnce(new Error('Test error'));

    await POST(mockRequest);

    // Error response
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Failed to process your request' },
      { status: 500 }
    );
  });
});
