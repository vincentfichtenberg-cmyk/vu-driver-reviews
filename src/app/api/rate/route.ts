import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { driverId, stars, comment } = await req.json();
    if (!driverId || !stars || stars < 1 || stars > 5)
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const db = await getDb();
    const rows = await db.query('SELECT id, name FROM drivers WHERE id = $1', [driverId]);
    if (!rows.length) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });

    await db.execute(
      'INSERT INTO ratings (driver_id, stars, comment) VALUES ($1, $2, $3)',
      [driverId, stars, comment?.trim() || null]
    );

    if (stars <= 2) {
      const driverName = rows[0].name as string;
      await db.execute(
        'INSERT INTO alerts (driver_id, driver_name, stars, comment) VALUES ($1, $2, $3, $4)',
        [driverId, driverName, stars, comment?.trim() || null]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
