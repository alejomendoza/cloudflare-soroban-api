import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getEntry, setEntry, invest } from "./contract-layer";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const res = await getEntry("yeah");

  return NextResponse.json(res);
}

export async function POST(request: NextRequest) {
  const url = request.nextUrl;

  if (url.searchParams.get("invest")) {
    const res = await invest("yeah", 10000000);
    return NextResponse.json(res);
  }

  const res = await setEntry();

  return NextResponse.json(res);
}
