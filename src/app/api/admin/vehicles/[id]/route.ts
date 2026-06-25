import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

async function auth() {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await auth(); if (denied) return denied;
  const { id } = await params;
  const { plate, model, year, driver_id } = await req.json();
  if (!plate?.trim() || !model?.trim())
    return NextResponse.json({ error: 'Plate and model required' }, { status: 400 });
  try {
    const db = await getDb();
    await db.query(
      'UPDATE vehicles SET plate=$1, model=$2, year=$3, driver_id=$4 WHERE id=$5',
      [plate.trim().toUpperCase(), model.trim(), year || null, driver_id || null, Number(id)]
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Plate already exists' }, { status: 409 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await auth(); if (denied) return denied;
  const { id } = await params;
  const db = await getDb();
  await db.query('DELETE FROM vehicles WHERE id=$1', [Number(id)]);
  return NextResponse.json({ ok: true });
}
