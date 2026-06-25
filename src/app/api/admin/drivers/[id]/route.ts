import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

async function auth() {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await auth(); if (denied) return denied;
  const { id } = await params;
  const db = await getDb();
  const rows = await db.query(`
    SELECT d.id, d.name, d.phone, d.is_active, d.created_at,
           v.id AS vehicle_id, v.plate AS vehicle_plate, v.model AS vehicle_model, v.year AS vehicle_year,
           ROUND(AVG(r.stars)::numeric, 2) AS avg_stars,
           COUNT(r.id) AS total_reviews
    FROM drivers d
    LEFT JOIN vehicles v ON v.driver_id = d.id
    LEFT JOIN ratings r ON r.driver_id = d.id
    WHERE d.id = $1
    GROUP BY d.id, v.id, v.plate, v.model, v.year
  `, [Number(id)]);
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const recentRatings = await db.query(
    'SELECT id, stars, comment, created_at FROM ratings WHERE driver_id = $1 ORDER BY created_at DESC LIMIT 50',
    [Number(id)]
  );

  return NextResponse.json({ ...rows[0], recent_ratings: recentRatings });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await auth(); if (denied) return denied;
  const { id } = await params;
  const { name, phone, is_active, plate, model, year } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const db = await getDb();

  await db.query(
    'UPDATE drivers SET name=$1, phone=$2, is_active=$3 WHERE id=$4',
    [name.trim(), phone?.trim() || null, is_active === false ? 0 : 1, Number(id)]
  );

  if (plate !== undefined) {
    const trimmedPlate = plate?.trim().toUpperCase() || '';
    const existing = await db.query('SELECT id FROM vehicles WHERE driver_id = $1', [Number(id)]);

    if (existing.length > 0) {
      if (trimmedPlate) {
        await db.query('UPDATE vehicles SET plate=$1, model=$2, year=$3 WHERE driver_id=$4',
          [trimmedPlate, model?.trim() || '', year || null, Number(id)]);
      } else {
        await db.query('UPDATE vehicles SET model=$1, year=$2 WHERE driver_id=$3',
          [model?.trim() || '', year || null, Number(id)]);
      }
    } else if (trimmedPlate) {
      const plateConflict = await db.query('SELECT id FROM vehicles WHERE plate = $1', [trimmedPlate]);
      if (plateConflict.length > 0) {
        await db.query('UPDATE vehicles SET driver_id=$1, model=$2, year=$3 WHERE plate=$4',
          [Number(id), model?.trim() || '', year || null, trimmedPlate]);
      } else {
        await db.execute(
          'INSERT INTO vehicles (plate, model, year, driver_id) VALUES ($1, $2, $3, $4)',
          [trimmedPlate, model?.trim() || '', year || null, Number(id)]
        );
      }
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await auth(); if (denied) return denied;
  const { id } = await params;
  const db = await getDb();
  await db.query('DELETE FROM drivers WHERE id=$1', [Number(id)]);
  return NextResponse.json({ ok: true });
}
