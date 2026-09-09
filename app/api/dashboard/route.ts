import { NextResponse } from 'next/server'
import { answerCopilot, type Crop } from '@/lib/agrobridge'
import { readStore, snapshotForCrop } from '@/lib/server/store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const crop = new URL(request.url).searchParams.get('crop')
  const selectedCrop: Crop = crop === 'Soybean' ? 'Soybean' : 'Sesame'
  return NextResponse.json({ data: snapshotForCrop(readStore(), selectedCrop), meta: { source: 'file-store', generatedAt: new Date().toISOString() } })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
  if (!prompt) return NextResponse.json({ error: 'A prompt is required.' }, { status: 400 })
  const snapshot = snapshotForCrop(readStore(), 'Sesame')
  return NextResponse.json({ data: { answer: answerCopilot(prompt, snapshot), source: 'local-copilot' } })
}
