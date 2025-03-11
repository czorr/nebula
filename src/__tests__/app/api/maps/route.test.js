import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../../../../../src/app/api/maps/route';
import { NextResponse } from 'next/server';

// Mock
const mockMapsData = {
  status: 200,
  data: [
    {
      uuid: "map1",
      displayName: "Mapa 1",
      displayIcon: "https://valorant-api.com/v1/maps/uuid/displayicon",
      listViewIcon: "https://valorant-api.com/v1/maps/uuid/listviewicon",
      splash: "https://valorant-api.com/v1/maps/uuid/splash",
      callouts: [
        {
          regionName: "callout1",
          superRegionName: "Super región 1",
          location: {
            x: 100,
            y: 100
          }
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

describe('Maps API Route', () => {
  beforeEach(() => {
    // Mock
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve(mockMapsData)
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
    expect(mockFetch).toHaveBeenCalledWith('https://valorant-api.com/v1/maps'); // URL
    expect(mockFetch).toHaveBeenCalledTimes(1); // Calls
    
    // Verificar NextResponse
    expect(jsonSpy).toHaveBeenCalledWith(mockMapsData);
  });

  it('debería manejar errores de la API externa', async () => {
    // Mock error
    const testError = new Error('Error al obtener datos');
    mockFetch.mockRejectedValue(testError);
    
    // Spy
    const jsonSpy = vi.spyOn(NextResponse, 'json');
    
    // Call GET
    await GET();
    
    // Verificar error  
    expect(console.error).toHaveBeenCalledWith(
      'Error al obtener datos de maps:',
      testError
    );
    
    // Verificar NextResponse
    expect(jsonSpy).toHaveBeenCalledWith(
      { error: 'Error al obtener datos de maps' },
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
      'Error al obtener datos de maps:',
      expect.any(Error)
    );
    
    // Verificar NextResponse
    expect(jsonSpy).toHaveBeenCalledWith(
      { error: 'Error al obtener datos de maps' },
      { status: 500 }
    );
  });
}); 