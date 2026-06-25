import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

const DRIVERS = [
  { name: 'Hoàng Tâm',        plate: '86LD-00145' },
  { name: 'Nguyễn Văn Tin',   plate: '94A-10390'  },
  { name: 'Lê Văn Đệ',        plate: '94LD-00050' },
  { name: 'Hoàng Hảo Vọng',   plate: '86LD-00149' },
  { name: 'Lê Khắc Phong',    plate: '86LD-00220' },
  { name: 'Lý Quang Bá',      plate: '86LD-00270' },
  { name: 'Nguyễn Văn Khôi',  plate: '86LD-00268' },
  { name: 'Lý Quang Long',    plate: '51K-80883'  },
  { name: 'Đặng Hoàng Tuấn',  plate: '86LD-00252' },
  { name: 'Tống Hoàng Long',  plate: '86LD-00186' },
  { name: 'Đỗ Minh Huy',      plate: '86LD-00275' },
  { name: 'Bùi Tấn Linh',     plate: '94LD-00028' },
  { name: 'Trần Quốc Thái',   plate: '94LD-00042' },
];

export async function POST() {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = await getDb();
  const added: string[] = [];
  const skipped: string[] = [];

  for (const d of DRIVERS) {
    const existing = await db.query('SELECT id FROM drivers WHERE name = $1', [d.name]);
    if (existing.length > 0) {
      skipped.push(d.name);
      continue;
    }
    const result = await db.execute(
      'INSERT INTO drivers (name) VALUES ($1)',
      [d.name]
    );
    const driverId = result.lastId;

    // Insert vehicle, skip if plate already exists
    const existingPlate = await db.query('SELECT id FROM vehicles WHERE plate = $1', [d.plate]);
    if (existingPlate.length === 0) {
      await db.execute(
        'INSERT INTO vehicles (plate, model, driver_id) VALUES ($1, $2, $3)',
        [d.plate, 'VUHQ', driverId]
      );
    }
    added.push(d.name);
  }

  return NextResponse.json({ added, skipped });
}
