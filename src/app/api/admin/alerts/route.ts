import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get('unread') === '1';
  const db = await getDb();
  const rows = await db.query(`
    SELECT id, driver_id, driver_name, stars, comment, is_read, created_at
    FROM alerts
    ${unreadOnly ? 'WHERE is_read = 0' : ''}
    ORDER BY created_at DESC
    LIMIT 50
  `);
  return NextResponse.json(rows);
}

export async function PATCH(req: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json() as { all?: boolean; id?: number };
  const db = await getDb();
  if (body.all) {
    await db.query('UPDATE alerts SET is_read = 1 WHERE is_read = 0');
  } else if (body.id) {
    await db.query('UPDATE alerts SET is_read = 1 WHERE id = $1', [body.id]);
  }
  return NextResponse.json({ ok: true });
}
