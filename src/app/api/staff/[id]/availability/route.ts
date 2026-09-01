import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId");
  const from = searchParams.get("from");

  if (!serviceId) {
    return NextResponse.json({ error: "serviceId is required" }, { status: 400 });
  }

  const slots = await getAvailableSlots(params.id, serviceId, from ? new Date(from) : undefined);
  return NextResponse.json({ slots });
}
