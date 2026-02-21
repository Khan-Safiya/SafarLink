/**
 * ticketPdf.js — SafarLink E-Ticket PDF Generator (Node.js)
 * Generates an in-memory PDF Buffer from a BookingResult object.
 * Uses pdfkit for layout — no external font files needed.
 */

const PDFDocument = require('pdfkit');

const GREEN = '#07503E';
const LIGHT = '#2FCE65';
const PURPLE = '#6B21A8'; // metro purple
const GREY = '#6B7280';
const WHITE = '#FFFFFF';
const BLACK = '#0D0D0D';
const BG = '#F4FDF7';

const MODE_EMOJI = {
    'bus': '🚌',
    'metro / subway': '🚇',
    'metro': '🚇',
    'auto / cab': '🛺',
    'driving': '🛺',
    'walking': '🚶',
};

/**
 * @param {object} result - BookingResult from /book API
 * @returns {Promise<Buffer>} - PDF as a Buffer
 */
function generateTicketPdf(result) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const doc = new PDFDocument({ size: 'A5', margin: 30 });

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const W = doc.page.width - 60; // usable width

        // ── Header banner ─────────────────────────────────────────────────────
        doc.rect(0, 0, doc.page.width, 70).fill(GREEN);
        doc.fillColor(WHITE).fontSize(16).font('Helvetica-Bold')
            .text('SafarLink  E-Ticket', 30, 14);
        doc.fillColor('#ccf0d8').fontSize(9).font('Helvetica')
            .text('Booking Confirmed  ✓', 30, 34);
        doc.fillColor(WHITE).fontSize(22).font('Helvetica-Bold')
            .text(result.pnr, 0, 18, { align: 'right' });
        doc.fillColor('#ccf0d8').fontSize(7).font('Helvetica')
            .text('PNR', 0, 40, { align: 'right' });

        // ── Route info ────────────────────────────────────────────────────────
        doc.moveDown(3.2);
        doc.fillColor(BLACK).fontSize(10).font('Helvetica-Bold')
            .text(`${result.origin}  →  ${result.destination}`, { align: 'center' });

        const capRoute = result.route_type.charAt(0).toUpperCase() + result.route_type.slice(1);
        doc.fillColor(GREY).fontSize(8).font('Helvetica')
            .text(`${capRoute} Route  |  ${result.booking_time}`, { align: 'center' });

        doc.moveDown(0.6);
        doc.moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y)
            .strokeColor('#D1FAE5').strokeOpacity(1).lineWidth(1).stroke();

        // ── Segments table ────────────────────────────────────────────────────
        doc.moveDown(0.5);
        doc.fillColor(GREY).fontSize(7).font('Helvetica-Bold')
            .text('JOURNEY SEGMENTS', 30, doc.y);
        doc.moveDown(0.3);

        for (const seg of result.segments) {
            const emoji = MODE_EMOJI[seg.mode.toLowerCase()] || '🚦';
            const y = doc.y;
            // Segment row background
            doc.rect(30, y - 2, W, 28).fillOpacity(0.07).fill('#07503E').fillOpacity(1);
            // Mode + line
            doc.fillColor(GREEN).fontSize(9).font('Helvetica-Bold')
                .text(`${seg.mode}  —  ${seg.line_name}`, 38, y + 2, { width: W * 0.7 });
            // Stops
            doc.fillColor(GREY).fontSize(7.5).font('Helvetica')
                .text(`${seg.from_stop} → ${seg.to_stop}  (${seg.num_stops} stops)`, 38, y + 14, { width: W * 0.7 });
            // Fare
            doc.fillColor(GREEN).fontSize(10).font('Helvetica-Bold')
                .text(`₹${seg.fare_inr.toFixed(0)}`, doc.page.width - 70, y + 6, { width: 40, align: 'right' });

            doc.moveDown(1.55);
        }

        // ── Payment summary ───────────────────────────────────────────────────
        doc.moveDown(0.3);
        doc.moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y)
            .strokeColor('#D1FAE5').lineWidth(0.8).stroke();
        doc.moveDown(0.4);

        const rows = [
            ['Total Paid', `₹${result.total_fare_inr.toFixed(0)}`],
            ['Payment ID', result.payment_id],
            ['Payment Status', result.payment_status],
            ['Ticket ID', result.ticket_id.slice(0, 16) + '...'],
        ];
        for (const [label, value] of rows) {
            const y = doc.y;
            doc.fillColor(GREY).fontSize(8).font('Helvetica').text(label, 30, y);
            doc.fillColor(label === 'Total Paid' ? GREEN : BLACK)
                .fontSize(label === 'Total Paid' ? 10 : 8)
                .font(label === 'Total Paid' ? 'Helvetica-Bold' : 'Helvetica')
                .text(value, 0, y, { align: 'right' });
            doc.moveDown(0.55);
        }

        // ── Metro QR section (if qr_data present) ────────────────────────────
        if (result.qr_data) {
            doc.moveDown(0.4);
            doc.rect(30, doc.y - 2, W, 14).fill('#F3E8FF');
            doc.fillColor(PURPLE).fontSize(8).font('Helvetica-Bold')
                .text('🚇  METRO QR TICKET — Scan at Entry Gate', 36, doc.y + 1);
            doc.moveDown(1.2);
            doc.fillColor(GREY).fontSize(7.5).font('Helvetica')
                .text('Scan QR at: ' + result.qr_data, 30, doc.y, { width: W, link: result.qr_data });
            doc.moveDown(0.3);
            doc.fillColor(GREY).fontSize(7)
                .text('Valid for single journey  ·  Non-transferable', { align: 'center' });
        }

        // ── Footer ────────────────────────────────────────────────────────────
        const footerY = doc.page.height - 35;
        doc.moveTo(30, footerY - 8).lineTo(doc.page.width - 30, footerY - 8)
            .strokeColor('#D1FAE5').lineWidth(0.5).stroke();
        doc.fillColor(GREY).fontSize(7).font('Helvetica')
            .text('Generated by SafarLink  ·  Smart Urban Mobility  ·  safarlink.app',
                0, footerY, { align: 'center', width: doc.page.width });

        doc.end();
    });
}

module.exports = { generateTicketPdf };
