import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import QRCode from 'qrcode';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = host.startsWith('localhost') ? 'http' : 'https';
  const url = `${protocol}://${host}/rate/${id}`;

  const svg = await QRCode.toString(url, { type: 'svg', margin: 2, width: 300 });
  return new NextResponse(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
}
