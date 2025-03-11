import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch
    const res = await fetch("https://valorant-api.com/v1/maps");
    const data = await res.json();

    // Return
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error al obtener datos de maps:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de maps' },
      { status: 500 }
    );
  }
}