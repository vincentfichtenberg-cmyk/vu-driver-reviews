import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const driverId = searchParams.get('driverId');
  const month = searchParams.get('month');
  const maxStars = searchParams.get('maxStars');

  const conditions: string[] = [];
  const args: unknown[] = [];
  let i = 1;

  if (driverId) { conditions.push(`r.driver_id = $${i++}`); args.push(Number(driverId)); }
  if (month) { conditions.push(`TO_CHAR(r.created_at, 'YYYY-MM') = $${i++}`); args.push(month); }
  if (maxStars) { conditions.push(`r.stars <= $${i++}`); args.push(Number(maxStars)); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const db = await getDb();
  const rows = await db.query(`
    SELECT r.id, r.stars, r.comment, r.customer_name, r.customer_contact, r.created_at,
           d.name AS driver_name
    FROM ratings r
    JOIN drivers d ON d.id = r.driver_id
    ${where}
    ORDER BY r.created_at DESC
    LIMIT 200
  `, args);

  return NextResponse.json(rows);
}
