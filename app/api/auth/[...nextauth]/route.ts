import { handlers } from "@/lib/auth"
import { NextRequest } from "next/server"

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    return handlers.GET(req)
}

export async function POST(req: NextRequest) {
    return handlers.POST(req)
}
