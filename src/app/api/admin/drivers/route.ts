import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

async function auth() {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

export async function GET(req: NextRequest) {
  const denied = await auth(); if (denied) return denied;
  const { searchParams } = new URL(req.url);
  const showAll = searchParams.get('all') === '1';
  const db = await getDb();
  const rows = await db.query(`
    SELECT d.id, d.name, d.phone, d.is_active, d.created_at,
           v.id AS vehicle_id, v.plate AS vehicle_plate, v.model AS vehicle_model, v.year AS vehicle_year,
           ROUND(AVG(r.stars)::numeric, 1)::float AS avg_stars,
           COUNT(r.id) AS total_reviews
    FROM drivers d
    LEFT JOIN vehicles v ON v.driver_id = d.id
    LEFT JOIN ratings r ON r.driver_id = d.id
    ${showAll ? '' : 'WHERE d.is_active = 1'}
    GROUP BY d.id, v.id, v.plate, v.model, v.year
    ORDER BY d.name
  `);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const denied = await auth(); if (denied) return denied;
  const { name, phone, plate, model, year } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const db = await getDb();
  const result = await db.execute(
    'INSERT INTO drivers (name, phone) VALUES ($1, $2)',
    [name.trim(), phone?.trim() || null]
  );
  const driverId = result.lastId;

  if (plate?.trim()) {
    const trimmedPlate = plate.trim().toUpperCase();
    const existing = await db.query('SELECT id FROM vehicles WHERE plate = $1', [trimmedPlate]);
    if (existing.length > 0) {
      await db.query('UPDATE vehicles SET driver_id=$1, model=$2, year=$3 WHERE plate=$4',
        [driverId, model?.trim() || '', year || null, trimmedPlate]);
    } else {
      await db.execute(
        'INSERT INTO vehicles (plate, model, year, driver_id) VALUES ($1, $2, $3, $4)',
        [trimmedPlate, model?.trim() || '', year || null, driverId]
      );
    }
  }

  return NextResponse.json({ id: driverId });
}
