// utils/dates.js
function getDateString(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

export const dates = {
    // Change to 30 days or more to ensure you get enough data.
    startDate: getDateString(30), 
    endDate: getDateString(1)    // 1 day ago (yesterday)
};
