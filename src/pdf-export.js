// ==================== PDF EXPORT MODULE ====================
// Generates and downloads a professional A4 PDF of the travel itinerary
// Uses html2pdf.js (loaded via CDN in index.html)

const DAY_COLORS = [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
];

function getDayColorForPDF(dayIndex) {
    return DAY_COLORS[dayIndex % DAY_COLORS.length];
}

function getDayColorLight(dayIndex) {
    const colors = [
        '#EEF2FF', '#D1FAE5', '#FEF3C7', '#FEE2E2',
        '#EDE9FE', '#FCE7F3', '#CCFBF1', '#FFEDD5'
    ];
    return colors[dayIndex % colors.length];
}

function getCategoryEmoji(category) {
    const map = {
        museum: '🏛️', themepark: '🎢', park: '🌿', beach: '🏖️',
        landmark: '🗽', tour: '🚌', sport: '⚽', art: '🎨',
        food: '🍽️', shopping: '🛍️', nightlife: '🎵', nature: '🌲',
        history: '🏰', religious: '⛪', entertainment: '🎭'
    };
    return map[category] || '📍';
}

function formatPrice(price) {
    if (!price || price === 0) return 'Free';
    return Number(price).toFixed(2) + '€';
}

function buildPDFHTML(state) {
    const destination = state.selectedDestination || 'Trip Itinerary';
    const program = state.geographicProgram;
    const today = new Date().toLocaleDateString('en-GB', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    // Determine days data: use geographicProgram if available, else build from selectedActivities
    let daysData = [];

    if (program && program.days && program.days.length > 0) {
        daysData = program.days.map((day, idx) => {
            const activities = [];
            (day.groups || []).forEach(group => {
                (group.activities || []).forEach(act => activities.push(act));
            });
            return {
                dayIndex: idx,
                activities,
                totalCost: day.totalCost || 0,
                estimatedTime: day.estimatedTime || 0,
                totalActivities: day.totalActivities || activities.length
            };
        });
    } else if (state.selectedActivities && state.selectedActivities.length > 0) {
        const count = state.selectedActivities.length;
        const days = state.selectedDays > 0 ? state.selectedDays : 1;
        const perDay = Math.ceil(count / days);
        for (let d = 0; d < days; d++) {
            const slice = state.selectedActivities.slice(d * perDay, (d + 1) * perDay);
            if (slice.length === 0) continue;
            daysData.push({
                dayIndex: d,
                activities: slice,
                totalCost: slice.reduce((s, a) => s + (a.price || 0), 0),
                estimatedTime: slice.reduce((s, a) => s + (a.duration_hours || 1.5), 0),
                totalActivities: slice.length
            });
        }
    }

    if (daysData.length === 0) return null;

    const totalActivities = daysData.reduce((s, d) => s + d.totalActivities, 0);
    const totalCost = daysData.reduce((s, d) => s + d.totalCost, 0);
    const totalDays = daysData.length;

    // Build each day's HTML
    const daysHTML = daysData.map((day) => {
        const color = getDayColorForPDF(day.dayIndex);
        const lightBg = getDayColorLight(day.dayIndex);
        const dayNum = day.dayIndex + 1;
        const timeStr = day.estimatedTime > 0 ? `~${day.estimatedTime.toFixed(1)}h` : '';
        const costStr = day.totalCost > 0 ? `${day.totalCost.toFixed(2)}€` : '';
        const statsArr = [day.totalActivities + ' activities', timeStr, costStr].filter(Boolean);

        const activitiesHTML = day.activities.map(activity => {
            const emoji = getCategoryEmoji(activity.category);
            const price = formatPrice(activity.price);
            const duration = activity.duration_hours || 1.5;

            const restaurantName = activity.restaurant?.name || '';
            const cafeName = activity.cafe?.name || '';
            const hasDining = restaurantName || cafeName;
            const diningParts = [restaurantName, cafeName].filter(Boolean);

            return `
            <div style="
                padding: 10px 14px;
                border-bottom: 1px solid #f0f2f5;
                page-break-inside: avoid;
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                    <div style="display: flex; align-items: flex-start; gap: 8px; flex: 1; min-width: 0;">
                        <span style="font-size: 15px; flex-shrink: 0; margin-top: 1px;">${emoji}</span>
                        <span style="
                            font-weight: 600;
                            color: #1e293b;
                            font-size: 13px;
                            line-height: 1.4;
                        ">${activity.name}</span>
                    </div>
                    <div style="
                        display: flex;
                        gap: 6px;
                        flex-shrink: 0;
                        align-items: center;
                    ">
                        <span style="
                            font-size: 11px;
                            color: #64748b;
                            white-space: nowrap;
                        ">${duration}h</span>
                        <span style="
                            font-size: 11px;
                            font-weight: 600;
                            color: ${color};
                            white-space: nowrap;
                        ">${price}</span>
                    </div>
                </div>
                ${hasDining ? `
                <div style="
                    margin-top: 5px;
                    margin-left: 23px;
                    font-size: 11px;
                    color: #78350f;
                    font-style: italic;
                    line-height: 1.4;
                    padding: 3px 8px;
                    background: #fffbeb;
                    border-left: 2px solid #f59e0b;
                    border-radius: 0 4px 4px 0;
                ">
                    <span style="font-style: normal; margin-right: 3px;">🍽️</span>
                    <span style="font-weight: 500;">Recommended:</span>
                    ${diningParts.join(' &amp; ')}
                </div>
                ` : ''}
            </div>`;
        }).join('');

        return `
        <div style="
            margin-bottom: 20px;
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid ${color}40;
            page-break-inside: avoid;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        ">
            <!-- Day Header -->
            <div style="
                background: ${color};
                padding: 10px 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div style="
                    color: white;
                    font-weight: 700;
                    font-size: 15px;
                    letter-spacing: 0.3px;
                ">Day ${dayNum}</div>
                <div style="
                    color: rgba(255,255,255,0.9);
                    font-size: 11px;
                    font-weight: 400;
                ">${statsArr.join(' &nbsp;|&nbsp; ')}</div>
            </div>
            <!-- Activities -->
            <div style="background: #ffffff;">
                ${activitiesHTML}
            </div>
        </div>`;
    }).join('');

    return `
    <div id="pdf-render-root" style="
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        background: #ffffff;
        padding: 28px 30px 24px 30px;
        max-width: 750px;
        margin: 0 auto;
        color: #1e293b;
        font-size: 13px;
        line-height: 1.5;
    ">

        <!-- ===== HEADER ===== -->
        <div style="
            background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
            border-radius: 12px;
            padding: 24px 28px;
            margin-bottom: 24px;
            color: white;
        ">
            <div style="
                font-size: 11px;
                font-weight: 500;
                letter-spacing: 1.5px;
                text-transform: uppercase;
                opacity: 0.75;
                margin-bottom: 6px;
            ">TRAVEL ITINERARY</div>
            <div style="
                font-size: 26px;
                font-weight: 700;
                margin-bottom: 12px;
                line-height: 1.2;
            ">${destination}</div>
            <div style="
                display: flex;
                gap: 20px;
                flex-wrap: wrap;
                font-size: 12px;
                opacity: 0.9;
            ">
                <span>&#128197; ${totalDays} Days</span>
                <span>&#9989; ${totalActivities} Activities</span>
                <span>&#128181; Total: ${totalCost.toFixed(2)}€</span>
                <span>&#128197; Generated: ${today}</span>
            </div>
        </div>

        <!-- ===== SECTION LABEL ===== -->
        <div style="
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 1.2px;
            text-transform: uppercase;
            color: #94a3b8;
            margin-bottom: 14px;
            padding-bottom: 6px;
            border-bottom: 1px solid #e2e8f0;
        ">DAY-BY-DAY PLAN</div>

        <!-- ===== DAYS ===== -->
        ${daysHTML}

        <!-- ===== FOOTER ===== -->
        <div style="
            margin-top: 24px;
            padding: 16px 20px;
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            border-radius: 10px;
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            page-break-inside: avoid;
        ">
            <div>
                <div style="font-size: 11px; opacity: 0.65; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 1px;">Total Budget</div>
                <div style="font-size: 28px; font-weight: 700;">${totalCost.toFixed(2)}€</div>
                <div style="font-size: 11px; opacity: 0.7; margin-top: 3px;">
                    ${totalActivities} activities &nbsp;|&nbsp; ${totalDays} days
                </div>
            </div>
            <div style="text-align: right; font-size: 11px; opacity: 0.5;">
                <div>Generated by</div>
                <div style="font-weight: 600; font-size: 13px; opacity: 0.8;">TakeMyTrip</div>
                <div style="margin-top: 4px;">${today}</div>
            </div>
        </div>

    </div>`;
}

export function exportItineraryToPDF() {
    const state = window.state;

    if (!state) {
        alert('Error: application state not found.');
        return;
    }

    const hasProgram = state.geographicProgram && state.geographicProgram.days && state.geographicProgram.days.length > 0;
    const hasActivities = state.selectedActivities && state.selectedActivities.length > 0;

    if (!hasProgram && !hasActivities) {
        alert('No itinerary found. Please create your travel plan first.');
        return;
    }

    if (!window.html2pdf) {
        alert('PDF library is not loaded. Please refresh the page and try again.');
        return;
    }

    const htmlContent = buildPDFHTML(state);
    if (!htmlContent) {
        alert('Could not generate PDF: no itinerary data found.');
        return;
    }

    // Mount in a hidden off-screen container so html2pdf can measure/render it
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed; left:-9999px; top:0; width:800px; background:#fff; z-index:-1;';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    const destination = (state.selectedDestination || 'itinerary')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const options = {
        margin: [8, 8, 8, 8],
        filename: `itinerary-${destination}.pdf`,
        image: { type: 'jpeg', quality: 0.97 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        },
        pagebreak: {
            mode: ['avoid-all', 'css'],
            avoid: ['.pdf-day-block', 'div[style*="page-break-inside: avoid"]']
        }
    };

    // Show a brief loading state on the button
    const btn = document.getElementById('export-pdf-btn');
    const originalHTML = btn ? btn.innerHTML : null;
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
        btn.disabled = true;
    }

    html2pdf()
        .set(options)
        .from(container.firstChild)
        .save()
        .then(() => {
            document.body.removeChild(container);
            if (btn && originalHTML) {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }
        })
        .catch((err) => {
            console.error('PDF export error:', err);
            document.body.removeChild(container);
            if (btn && originalHTML) {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }
            alert('Failed to generate PDF. Please try again.');
        });
}
