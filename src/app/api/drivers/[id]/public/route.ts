import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const rows = await db.query(`
    SELECT d.id, d.name,
           v.plate AS vehicle_plate,
           v.model AS vehicle_model
    FROM drivers d
    LEFT JOIN vehicles v ON v.driver_id = d.id
    WHERE d.id = $1
    LIMIT 1
  `, [Number(id)]);

  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}
