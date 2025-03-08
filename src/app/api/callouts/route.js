import { NextResponse } from "next/server";

export async function GET(request) {
  const mapId = request.nextUrl.searchParams.get("mapId");

  // Realizamos el fetch a la API externa de Valorant
  const res = await fetch(`https://valorant-api.com/v1/maps/${mapId}`);
  const data = await res.json();

  // Retornamos los datos en formato JSON
  return NextResponse.json(data);
}