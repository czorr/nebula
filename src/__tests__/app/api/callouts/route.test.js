import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../../../../../src/app/api/callouts/route';
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

// Mock request object
const createMockRequest = (mapId) => {
  return {
    nextUrl: {
      searchParams: {
        get: (param) => param === 'mapId' ? mapId : null
      }
    }
  };
};

describe('Callouts API Route', () => {
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

  it('debería devolver los datos de callouts correctamente, llamando a la URL con mapId', async () => {
    // Spy
    const jsonSpy = vi.spyOn(NextResponse, 'json');
    
    // Mock request con mapId
    const mockRequest = createMockRequest('123');
    
    // Call GET
    await GET(mockRequest);
    
    // Verificar fetch
    expect(mockFetch).toHaveBeenCalledWith('https://valorant-api.com/v1/maps/123');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    
    // Verificar NextResponse
    expect(jsonSpy).toHaveBeenCalledWith(mockMapsData);
  });

  it('debería manejar el caso cuando no se proporciona mapId', async () => {
    // Spy
    const jsonSpy = vi.spyOn(NextResponse, 'json');
    
    // Mock request sin mapId
    const mockRequest = createMockRequest(null);
    
    // ET
    await GET(mockRequest);
    
    // Verificar que no se llama a fetch
    expect(mockFetch).not.toHaveBeenCalled();
    
    // Verificar NextResponse con error 400
    expect(jsonSpy).toHaveBeenCalledWith(
      { error: 'No se proporcionó un mapId' },
      { status: 400 }
    );
  });

  it('debería manejar errores de la API externa', async () => {
    // Mock error
    const testError = new Error('Error al obtener datos');
    mockFetch.mockRejectedValue(testError);
    
    // Spy
    const jsonSpy = vi.spyOn(NextResponse, 'json');
    
    // Mock request
    const mockRequest = createMockRequest('map1');
    
    // Call GET
    await GET(mockRequest);
    
    // Verificar error  
    expect(console.error).toHaveBeenCalledWith(
      'Error al obtener datos de callouts:',
      testError
    );
    
    // Verificar NextResponse
    expect(jsonSpy).toHaveBeenCalledWith(
      { error: 'Error al obtener datos de callouts' },
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
    
    // Mock request
    const mockRequest = createMockRequest('map1');
    
    // Call GET
    await GET(mockRequest);
    
    // Verificar error
    expect(console.error).toHaveBeenCalledWith(
      'Error al obtener datos de callouts:',
      expect.any(Error)
    );
    
    // Verificar NextResponse
    expect(jsonSpy).toHaveBeenCalledWith(
      { error: 'Error al obtener datos de callouts' },
      { status: 500 }
    );
  });
}); 