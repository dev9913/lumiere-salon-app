import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST() {
  await destroySession("CUSTOMER");
  return NextResponse.json({ ok: true });
}
