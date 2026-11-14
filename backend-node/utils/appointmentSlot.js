const { publicError } = require('./publicError');

const TIME_WINDOWS = Object.freeze([
    'Morning (9:00 AM - 12:00 PM)',
    'Afternoon (12:00 PM - 4:00 PM)',
    'Evening (4:00 PM - 7:00 PM)',
]);

function getBookingSlot({ preferred_date: date, preferred_time: time }, required) {
    const hasDate = date !== undefined && date !== null && date !== '';
    const hasTime = time !== undefined && time !== null && time !== '';
    const validDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && !date.startsWith('0000')
        && Number.isFinite(Date.parse(`${date}T00:00:00Z`))
        && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
    if ((required && (!hasDate || !hasTime)) || (hasDate && !validDate) || (hasTime && !TIME_WINDOWS.includes(time))) {
        throw publicError('BOOKING_SLOT_INVALID');
    }
    // Guest requests historically allowed an unspecified date or window.
    // Keep their display/contact data without fabricating a complete slot.
    if (!hasDate || !hasTime) return { booking_date: null, booking_time_window: null };
    return { booking_date: hasDate ? date : null, booking_time_window: hasTime ? time : null };
}

function isBookingSlotConflict(error) {
    return error?.code === '23505' && typeof error.message === 'string'
        && /^duplicate key value violates unique constraint "leads_buyer_(property|consultation)_slot_uidx"$/.test(error.message);
}

module.exports = { TIME_WINDOWS, getBookingSlot, isBookingSlotConflict };
