const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const campaignId = process.env.CAMPAIGN_ID;
    const url = `https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`;

    const response = await axios.get(url);
    const data = response.data;
    
    const goal = data.goal || 1000000;
    const totalIncome = Math.floor(parseFloat(data.totalincome)) || 0;
    const donors = data.donorscount || 0;
    const percent = Math.floor((totalIncome / goal) * 100);

    // --- 1. לוגיקת עידוד לפי אחוזים (מתייחס ליעד) ---
    let encouragement = "";
    if (percent >= 90 && percent < 100) {
        encouragement = ".f-011"; // גיוואלד - לקראת הסוף
    } else if (percent >= 85) {
        encouragement = ".f-010"; // אופטימיות - קרובים ליעד
    }

    // --- 2. לוגיקת עידוד לפי זמן (דחיפה להתרים עוד) ---
    const endDate = new Date("2026-02-08T09:30:00+02:00");
    const now = new Date();
    const diffInMs = endDate - now;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    let timeEncouragement = "";
    if (diffInMs > 0) {
        if (diffInHours <= 5) {
            timeEncouragement = ".f-014"; // 5 שעות לסיום - אל תעזבו את הטלפון
        } else if (diffInHours <= 24) {
            timeEncouragement = ".f-013"; // יום הסיום - הזמן אוזל
        } else if (diffInHours <= 48) {
            timeEncouragement = ".f-012"; // יומיים לסיום - הצלחה מסחררת
        }
    }

    // חישוב חלקי הזמן להקראה
    let timeParts = "";
    if (diffInMs > 0) {
        const totalMin = Math.floor(diffInMs / 60000);
        const days = Math.floor(totalMin / 1440);
        const hours = Math.floor((totalMin % 1440) / 60);
        const minutes = totalMin % 60;
        timeParts = `.n-${days}.f-005.n-${hours}.f-006.f-007.n-${minutes}.f-008`;
    }

    // --- 3. לוגיקת יתרה לעומת מעבר יעד ---
    let middleSection = "";
    if (totalIncome >= goal) {
        middleSection = ".f-009"; // ברוך השם עברנו את היעד
    } else {
        const missingAmount = goal - totalIncome;
        middleSection = `.n-${missingAmount}.f-004`; 
    }

    // בניית המחרוזת הסופית (הסדר קריטי לזרימת המשפט)
    const message = `f-000.n-${percent}${encouragement}.f-001.n-${totalIncome}.f-002.n-${donors}.f-003${middleSection}${timeEncouragement}${timeParts}`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(`id_list_message=${message}`);

  } catch (error) {
    return res.send("id_list_message=t-חלה שגיאה במערכת");
  }
};
