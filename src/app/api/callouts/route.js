import { NextResponse } from "next/server";

export async function GET(request) {
  const mapId = request.nextUrl.searchParams.get("mapId");

  if (!mapId) {
    return NextResponse.json(
      { error: 'No se proporcionó un mapId' },
      { status: 400 }
    );
  }
  try {
    // Fetch
    const res = await fetch(`https://valorant-api.com/v1/maps/${mapId}`);
    const data = await res.json();

    // Return
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error al obtener datos de callouts:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de callouts' },
      { status: 500 }
    );
  }
}