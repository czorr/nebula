import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch Valorant API
    const res = await fetch("https://valorant-api.com/v1/agents");
    const data = await res.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error al obtener datos de agentes:", error);
    return NextResponse.json(
      { error: "Error al obtener datos de agentes" },
      { status: 500 }
    );
  }
}