import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../../../../../src/app/api/agents/route';
import { NextResponse } from 'next/server';

// Mock
const mockAgentsData = {
  status: 200,
  data: [
    {
      uuid: "agent1",
      displayName: "Jett",
      displayIcon: "https://valorant-api.com/v1/agents/uuid/displayicon",
      description: "Descripción de Jett",
      role: { displayName: "Duelista", description: "Descripción del rol de Duelista" },
      abilities: [
        {
          displayName: "Habilidad 1",
          description: "Descripción de la habilidad 1",
          displayIcon: "https://valorant-api.com/v1/agents/uuid/abilities/icon"
        },
        {
          displayName: "Habilidad 2",
          description: "Descripción de la habilidad 2",
          displayIcon: "https://valorant-api.com/v1/agents/uuid/abilities/icon"
        }
      ]
    },
    {
      uuid: "agent2",
      displayName: "Sage",
      displayIcon: "https://valorant-api.com/v1/agents/uuid/displayicon",
      description: "Descripción de Sage",
      role: { displayName: "Centinela", description: "Descripción del rol de Centinela" },
      abilities: [
        {
          displayName: "Habilidad 3",
          description: "Descripción de la habilidad 3",
          displayIcon: "https://valorant-api.com/v1/agents/uuid/abilities/icon"
        }
      ]
    }
  ]
};

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock para console.error
console.error = vi.fn();

describe('Agents API Route', () => {
  beforeEach(() => {
    // Mock
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve(mockAgentsData)
    });
  });

  afterEach(() => {
    // Limpiar mocks
    vi.clearAllMocks();
  });

  it('debería devolver los datos de agentes correctamente, llamando a la URL solo una vez', async () => {
    // Spy para NextResponse
    const jsonSpy = vi.spyOn(NextResponse, 'json');
    
    // Call GET
    await GET();
    
    // Verificar fetch
    expect(mockFetch).toHaveBeenCalledWith('https://valorant-api.com/v1/agents'); // URL
    expect(mockFetch).toHaveBeenCalledTimes(1); // Calls
    
    // Verificar NextResponse
    expect(jsonSpy).toHaveBeenCalledWith(mockAgentsData);
  });

  it('debería manejar errores de la API externa', async () => {
    // Mock para simular un error
    const testError = new Error('Error al obtener datos');
    mockFetch.mockRejectedValue(testError);
    
    // Spy para NextResponse
    const jsonSpy = vi.spyOn(NextResponse, 'json');
    
    // Call GET
    await GET();
    
    // Verificar error  
    expect(console.error).toHaveBeenCalledWith(
      'Error al obtener datos de agentes:',
      testError
    );
    
    // Verificar NextResponse
    expect(jsonSpy).toHaveBeenCalledWith(
      { error: 'Error al obtener datos de agentes' },
      { status: 500 }
    );
  });

  it('debería manejar respuestas con formato incorrecto', async () => {
    // Mock con otro fomato
    mockFetch.mockResolvedValue({
      json: () => Promise.reject(new Error('Error al parsear JSON'))
    });
    
    // Spy
    const jsonSpy = vi.spyOn(NextResponse, 'json');
    
    // Call GET
    await GET();
    
    // Verificar error
    expect(console.error).toHaveBeenCalledWith(
      'Error al obtener datos de agentes:',
      expect.any(Error)
    );
    
    // Verificar NextResponse
    expect(jsonSpy).toHaveBeenCalledWith(
      { error: 'Error al obtener datos de agentes' },
      { status: 500 }
    );
  });
}); 