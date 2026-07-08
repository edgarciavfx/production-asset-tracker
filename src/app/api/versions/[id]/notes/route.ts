import { NextResponse } from "next/server"
import { listNotes } from "@/lib/repo"

export const runtime = "nodejs"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return NextResponse.json(
    { notes: listNotes(id) },
    { headers: { "Cache-Control": "no-store" } }
  )
}
