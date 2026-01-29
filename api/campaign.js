const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const campaignId = process.env.CAMPAIGN_ID;
    const url = `https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`;

    const response = await axios.get(url);
    const data = response.data;
    
    // שליפת היעד מה-API
    const goal = data.goal || 1000000; 
    const totalIncome = Math.floor(parseFloat(data.totalincome)) || 0;
    const donors = data.donorscount || 0;
    const percent = Math.floor((totalIncome / goal) * 100);

    // חישוב זמן
    const endDate = new Date("2026-02-08T09:30:00+02:00");
    const diffInMs = endDate - new Date();
    let timeParts = "";

    if (diffInMs > 0) {
        const totalMin = Math.floor(diffInMs / 60000);
        const days = Math.floor(totalMin / 1440);
        const hours = Math.floor((totalMin % 1440) / 60);
        const minutes = totalMin % 60;
        
        // החלק של הזמן נשאר זהה
        timeParts = `.n-${days}.f-005.n-${hours}.f-006.f-007.n-${minutes}.f-008`;
    }

    // --- לוגיקה חכמה למעבר יעד ---
    let middleSection = "";
    if (totalIncome >= goal) {
        // אם עברנו את היעד: משמיעים את קובץ 009 ומדלגים על היתרה
        middleSection = `.f-009${timeParts}`;
    } else {
        // אם טרם הגענו ליעד: משמיעים כרגיל את היתרה וקובץ 004
        const missingAmount = goal - totalIncome;
        middleSection = `.n-${missingAmount}.f-004${timeParts}`;
    }

    // בניית המחרוזת הסופית
    const message = `f-000.n-${percent}.f-001.n-${totalIncome}.f-002.n-${donors}.f-003${middleSection}`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(`id_list_message=${message}`);

  } catch (error) {
    return res.send("id_list_message=t-חלה שגיאה במערכת");
  }
};
