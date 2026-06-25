import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

async function auth() {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

export async function GET() {
  const denied = await auth(); if (denied) return denied;
  const db = await getDb();
  const rows = await db.query(`
    SELECT v.*, d.name AS driver_name
    FROM vehicles v
    LEFT JOIN drivers d ON d.id = v.driver_id
    ORDER BY v.plate
  `);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const denied = await auth(); if (denied) return denied;
  const { plate, model, year, driver_id } = await req.json();
  if (!plate?.trim() || !model?.trim())
    return NextResponse.json({ error: 'Plate and model required' }, { status: 400 });
  try {
    const db = await getDb();
    const result = await db.execute(
      'INSERT INTO vehicles (plate, model, year, driver_id) VALUES ($1, $2, $3, $4)',
      [plate.trim().toUpperCase(), model.trim(), year || null, driver_id || null]
    );
    return NextResponse.json({ id: result.lastId });
  } catch {
    return NextResponse.json({ error: 'Plate already exists' }, { status: 409 });
  }
}
