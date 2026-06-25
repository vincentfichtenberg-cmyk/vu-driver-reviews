import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

  const db = await getDb();
  const rankings = await db.query(`
    SELECT d.id, d.name,
           ROUND(AVG(r.stars)::numeric, 2) AS avg_stars,
           COUNT(r.id) AS total_reviews
    FROM drivers d
    JOIN ratings r ON r.driver_id = d.id
    WHERE TO_CHAR(r.created_at, 'YYYY-MM') = $1
    GROUP BY d.id
    HAVING COUNT(r.id) > 0
    ORDER BY avg_stars DESC, total_reviews DESC
    LIMIT 10
  `, [month]);

  return NextResponse.json({ month, rankings });
}
