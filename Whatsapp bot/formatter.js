/**
 * formatter.js
 * Converts RouteAgentOutput JSON into a concise WhatsApp text message.
 */

const MODE_EMOJI = {
    Bus: '🚌',
    'Metro / Subway': '🚇',
    'Auto / Cab': '🛺',
};

const STEP_EMOJI = {
    WALKING: '🚶',
    TRANSIT: '🚌',
    DRIVING: '🚗',
};

/**
 * @param {object} routeData  - RouteAgentOutput from the chatbot API
 * @returns {string}          - WhatsApp-ready formatted string
 */
function formatRoutes(routeData) {
    const lines = [];
    lines.push(`📍 *From:* ${routeData.origin}`);
    lines.push(`📍 *To:*   ${routeData.destination}`);
    lines.push('');

    const available = routeData.transit_options.filter((t) => t.available);

    if (available.length === 0) {
        return lines.join('\n') + '\n⚠️ No routes found for this query. Please try again with more specific locations.';
    }

    for (const option of available) {
        const emoji = MODE_EMOJI[option.mode] || '🚐';
        lines.push(`${emoji} *${option.mode}*`);

        // Show up to 2 route alternatives
        const routes = option.routes.slice(0, 2);
        for (const route of routes) {
            lines.push(`  Route ${route.route_number}: ${route.total_duration} | ${route.total_distance}`);

            // Show up to 3 steps
            const steps = route.steps.slice(0, 3);
            for (const step of steps) {
                const sEmoji = STEP_EMOJI[step.travel_mode] || '➡️';
                // Truncate long instructions
                const instr = step.instruction.length > 70
                    ? step.instruction.substring(0, 67) + '...'
                    : step.instruction;
                lines.push(`    ${sEmoji} ${instr} (${step.duration})`);
            }
            if (route.steps.length > 3) {
                lines.push(`    _(+${route.steps.length - 3} more steps)_`);
            }
        }
        if (option.routes.length > 2) {
            lines.push(`  _(+${option.routes.length - 2} more alternatives)_`);
        }
        lines.push('');
    }

    lines.push('💾 Reply *pdf* to download the full itinerary as a PDF.');

    // Trim to ~1500 chars to respect WhatsApp limits
    const text = lines.join('\n');
    if (text.length > 1500) {
        return text.substring(0, 1497) + '...';
    }
    return text;
}

module.exports = { formatRoutes };
