'use strict';

const express = require('express');
const puppeteer = require('puppeteer-core');

const CHROMIUM_PATH = process.env.CHROMIUM_PATH || null;

const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// ==================== PDF GENERATION ====================
async function generatePDF(html) {
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    });

    try {
        const page = await browser.newPage();

        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            }
        });

        return pdf;
    } finally {
        await browser.close();
    }
}

// ==================== HTML TEMPLATE ====================

function buildItineraryHTML(data) {
    const { destination, totalDays, days } = data;

    const dayColors = [
        '#4F46E5', '#10B981', '#F59E0B', '#EF4444',
        '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
    ];

    function dayColor(n) {
        return dayColors[(n - 1) % dayColors.length];
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function renderVenueRow(icon, label, venue) {
        if (!venue) return '';
        if (typeof venue === 'string' && !venue.trim()) return '';
        const name = typeof venue === 'object' ? (venue.name || '') : '';
        const desc = typeof venue === 'object' ? (venue.description || '') : (typeof venue === 'string' ? venue : '');
        if (!name && !desc) return '';
        return `
            <div class="venue-row">
                <span class="venue-icon">${icon}</span>
                <div class="venue-body">
                    <span class="venue-label">${label}</span>
                    ${name ? `<span class="venue-name">${escapeHtml(name)}</span>` : ''}
                    ${desc ? `<span class="venue-desc">${escapeHtml(desc)}</span>` : ''}
                </div>
            </div>`;
    }

    const daysHTML = days.map(day => {
        const color = dayColor(day.dayNumber);

        const activitiesHTML = day.activities.map((act, idx) => `
            <div class="activity">
                <div class="activity-header">
                    <span class="activity-num" style="background:${color};">${idx + 1}</span>
                    <span class="activity-name">${escapeHtml(act.name)}</span>
                    ${act.duration_hours ? `<span class="activity-duration">⏱ ${act.duration_hours}h</span>` : ''}
                </div>
                ${act.description ? `<p class="activity-desc">${escapeHtml(act.description)}</p>` : ''}
                ${act.notes && act.notes.length > 0 ? `
                    <div class="activity-notes">⚠️ ${act.notes.map(escapeHtml).join(' • ')}</div>
                ` : ''}
                <div class="venues">
                    ${renderVenueRow('🍽', 'Κοντινό Εστιατόριο', act.restaurant)}
                    ${renderVenueRow('☕', 'Κοντινό Καφέ', act.cafe)}
                </div>
            </div>
        `).join('');

        return `
            <div class="day-card" style="border-left-color:${color};">
                <div class="day-header" style="background:${color};">
                    <h2>Μέρα ${day.dayNumber}</h2>
                    <span class="day-meta">${day.activities.length} δραστηριότητ${day.activities.length === 1 ? 'α' : 'ες'}</span>
                </div>
                <div class="day-body">
                    ${activitiesHTML || '<p class="empty-day">Ελεύθερη μέρα</p>'}
                </div>
            </div>
        `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="el">
<head>
<meta charset="UTF-8">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
    color: #1a202c;
    background: #fff;
    padding: 0;
  }
  .cover {
    padding: 40px 20px 30px;
    text-align: center;
    border-bottom: 3px solid #4F46E5;
    margin-bottom: 30px;
  }
  .cover h1 {
    font-size: 28px;
    color: #4F46E5;
    margin-bottom: 8px;
  }
  .cover .subtitle {
    font-size: 15px;
    color: #64748b;
  }
  .cover .meta {
    margin-top: 12px;
    display: flex;
    justify-content: center;
    gap: 30px;
    font-size: 13px;
    color: #475569;
  }
  .cover .meta span {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .day-card {
    border-left: 5px solid #4F46E5;
    margin-bottom: 24px;
    border-radius: 6px;
    overflow: hidden;
    page-break-inside: avoid;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }
  .day-header {
    padding: 10px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: white;
  }
  .day-header h2 {
    font-size: 16px;
    font-weight: 700;
  }
  .day-meta {
    font-size: 12px;
    opacity: 0.9;
  }
  .day-body {
    padding: 12px 16px;
    background: #fafafa;
  }
  .activity {
    background: white;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 10px;
    border: 1px solid #e2e8f0;
    page-break-inside: avoid;
  }
  .activity:last-child { margin-bottom: 0; }
  .activity-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .activity-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    color: white;
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .activity-name {
    font-weight: 700;
    font-size: 14px;
    color: #1e293b;
    flex: 1;
  }
  .activity-duration {
    font-size: 11px;
    color: #64748b;
    white-space: nowrap;
  }
  .activity-desc {
    font-size: 12px;
    color: #475569;
    line-height: 1.5;
    margin-bottom: 6px;
  }
  .activity-notes {
    font-size: 11px;
    color: #92400e;
    background: #fef3c7;
    border-left: 3px solid #f59e0b;
    padding: 5px 8px;
    border-radius: 3px;
    margin-bottom: 6px;
  }
  .venues {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 6px;
  }
  .venue-row {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    background: #f8fafc;
    border-radius: 4px;
    padding: 5px 8px;
    font-size: 12px;
  }
  .venue-icon { font-size: 13px; flex-shrink: 0; margin-top: 1px; }
  .venue-body { display: flex; flex-direction: column; gap: 1px; }
  .venue-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    color: #94a3b8;
    letter-spacing: 0.5px;
  }
  .venue-name { font-weight: 600; color: #1e293b; }
  .venue-desc { color: #475569; }
  .empty-day { color: #94a3b8; font-style: italic; padding: 10px 0; }
  .footer {
    margin-top: 30px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
    text-align: center;
    font-size: 11px;
    color: #94a3b8;
  }
</style>
</head>
<body>
  <div class="cover">
    <h1>✈️ ${escapeHtml(destination || 'Ταξιδιωτικό Πρόγραμμα')}</h1>
    <p class="subtitle">Ημερήσιο Πρόγραμμα</p>
    <div class="meta">
      <span>📅 ${totalDays} ${totalDays === 1 ? 'Ημέρα' : 'Ημέρες'}</span>
      <span>📍 ${days.reduce((s, d) => s + d.activities.length, 0)} Δραστηριότητες</span>
      <span>🗓 ${new Date().toLocaleDateString('el-GR')}</span>
    </div>
  </div>

  ${daysHTML}

  <div class="footer">
    Δημιουργήθηκε από τον Ταξιδιωτικό Οργανωτή • ${new Date().toLocaleString('el-GR')}
  </div>
</body>
</html>`;
}

// ==================== API ENDPOINT ====================

app.post('/api/generate-pdf', async (req, res) => {
    try {
        const { destination, totalDays, days } = req.body;

        if (!days || !Array.isArray(days) || days.length === 0) {
            return res.status(400).json({ error: 'Missing or empty days array' });
        }

        const html = buildItineraryHTML({ destination, totalDays: totalDays || days.length, days });
        const pdf = await generatePDF(html);

        // Build ASCII-safe filename + RFC 5987 encoded fallback
        const safeBase = (destination || 'trip')
            .normalize('NFD').replace(/[̀-ͯ]/g, '')  // strip diacritics
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase() || 'itinerary';
        const filename = `itinerary-${safeBase}.pdf`;
        const encodedName = encodeURIComponent(`itinerary-${destination || 'trip'}.pdf`);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition',
            `attachment; filename="${filename}"; filename*=UTF-8''${encodedName}`);
        res.setHeader('Content-Length', pdf.length);
        res.end(pdf);

    } catch (err) {
        console.error('PDF generation error:', err);
        res.status(500).json({ error: 'PDF generation failed', detail: err.message });
    }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`PDF server running on ${PORT}`);
});
