import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);
  const format = searchParams.get('format') || 'excel';

  const db = await getDb();

  const rankings = await db.query(`
    SELECT d.id, d.name,
           ROUND(AVG(r.stars)::numeric, 2) AS avg_stars,
           COUNT(r.id) AS total_reviews,
           SUM(CASE WHEN r.stars >= 4 THEN 1 ELSE 0 END) AS positive,
           SUM(CASE WHEN r.stars <= 2 THEN 1 ELSE 0 END) AS negative
    FROM drivers d
    JOIN ratings r ON r.driver_id = d.id
    WHERE TO_CHAR(r.created_at, 'YYYY-MM') = $1
    GROUP BY d.id
    ORDER BY avg_stars DESC, total_reviews DESC
  `, [month]) as { id: number; name: string; avg_stars: number; total_reviews: number; positive: number; negative: number }[];

  const feedback = await db.query(`
    SELECT d.name AS driver_name, r.stars, r.comment, r.created_at
    FROM ratings r JOIN drivers d ON d.id = r.driver_id
    WHERE TO_CHAR(r.created_at, 'YYYY-MM') = $1
    ORDER BY r.created_at DESC
  `, [month]) as { driver_name: string; stars: number; comment: string | null; created_at: string }[];

  if (format === 'excel') {
    const XLSX = await import('xlsx');

    const rankRows = [
      ['Rank', 'Driver Name', 'Avg Stars', 'Total Reviews', 'Positive (4-5★)', 'Negative (1-2★)'],
      ...rankings.map((r, i) => [i + 1, r.name, r.avg_stars, r.total_reviews, r.positive, r.negative]),
    ];
    const feedbackRows = [
      ['Driver', 'Stars', 'Comment', 'Date'],
      ...feedback.map(f => [f.driver_name, f.stars, f.comment || '', new Date(f.created_at).toLocaleDateString()]),
    ];

    const wb = XLSX.utils.book_new();
    const wsRank = XLSX.utils.aoa_to_sheet(rankRows);
    wsRank['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsRank, 'Rankings');

    const wsFeed = XLSX.utils.aoa_to_sheet(feedbackRows);
    wsFeed['!cols'] = [{ wch: 25 }, { wch: 8 }, { wch: 50 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsFeed, 'All Feedback');

    const neg = feedback.filter(f => f.stars <= 2);
    if (neg.length > 0) {
      const negRows = [
        ['Driver', 'Stars', 'Comment', 'Date'],
        ...neg.map(f => [f.driver_name, f.stars, f.comment || '', new Date(f.created_at).toLocaleDateString()]),
      ];
      const wsNeg = XLSX.utils.aoa_to_sheet(negRows);
      wsNeg['!cols'] = [{ wch: 25 }, { wch: 8 }, { wch: 50 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsNeg, 'Negative Feedback');
    }

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="VU_Report_${month}.xlsx"`,
      },
    });
  }

  if (format === 'pdf') {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('VU Transportation — Monthly Report', 14, 16);
    doc.setFontSize(11);
    doc.setTextColor(120);
    doc.text(`Month: ${month}   |   Generated: ${new Date().toLocaleDateString()}`, 14, 23);
    doc.setTextColor(0);
    doc.setFontSize(13);
    doc.text('Driver Rankings', 14, 33);

    autoTable(doc, {
      startY: 37,
      head: [['Rank', 'Driver Name', 'Avg Stars', 'Total Reviews', 'Positive', 'Negative']],
      body: rankings.map((r, i) => [i + 1, r.name, `${r.avg_stars} ★`, r.total_reviews, r.positive, r.negative]),
      headStyles: { fillColor: [37, 99, 235] },
      alternateRowStyles: { fillColor: [241, 245, 249] },
    });

    const neg = feedback.filter(f => f.stars <= 2);
    if (neg.length > 0) {
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      doc.setFontSize(13);
      doc.text('Negative Feedback (1–2 stars)', 14, finalY);
      autoTable(doc, {
        startY: finalY + 4,
        head: [['Driver', 'Stars', 'Comment', 'Date']],
        body: neg.map(f => [f.driver_name, '★'.repeat(f.stars), f.comment || '—', new Date(f.created_at).toLocaleDateString()]),
        headStyles: { fillColor: [220, 38, 38] },
        alternateRowStyles: { fillColor: [254, 242, 242] },
        columnStyles: { 2: { cellWidth: 120 } },
      });
    }

    const pdfBuf = Buffer.from(doc.output('arraybuffer'));
    return new NextResponse(pdfBuf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="VU_Report_${month}.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
}
