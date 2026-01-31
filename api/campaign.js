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

    
    // --- 1. בחירת הודעת עידוד אחוזים (אם רלוונטי) ---
    let encouragement = "";
    if (percent >= 90 && percent < 100) {
        encouragement = ".f-011"; // גיוואלד
    } else if (percent >= 85 && percent < 90) {
        encouragement = ".f-010"; // קרובים ליעד
    }

    // --- 2. בחירת הודעת עידוד זמן (לפי הדחיפות) ---
    const year = 2026;
    const month = 2; // 2 זה פברואר
    const day = 8;
    const hour = 9;
    const minute = 32;
    
    // יצירת תאריך הסיום (זמן ישראל)
    const endDate = new Date(year, month - 1, day, hour, minute);
    //const endDate =  new Date("2026-02-08T09:33:00+02:00");
    const diffInMs = endDate - new Date();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    let timeEncouragement = "";
    if (diffInMs > 0) {
        if (diffInHours <= 5) {
            timeEncouragement = ".f-014"; // 5 שעות
        } else if (diffInHours <= 24) {
            timeEncouragement = ".f-013"; // יום אחרון
        } else if (diffInHours <= 48) {
            timeEncouragement = ".f-012"; // יומיים אחרונים
        }
    }

    // --- 3. בניית הדיווח הפיננסי (000-003) ---
    // ההודעה תמיד תתחיל ב: עד כה נאספו (000) -> X אחוזים (001) -> Y שקלים (002) -> Z תורמים (003)
    let financialReport = `f-000.n-${percent}.f-001.n-${totalIncome}.f-002.n-${donors}.f-003`;

    // --- 4. חישוב יתרה או הצלחה (004 או 009) ---
    let middleSection = "";
    if (totalIncome >= goal) {
        middleSection = ".f-009"; // עברנו את היעד + "לסיום נשארו..."
    } else {
        const missingAmount = goal - totalIncome;
        middleSection = `.n-${missingAmount}.f-004`; // חסר X שקלים + "לסיום נשארו..."
    }

    // --- 5. חישוב חלקי הזמן (005-008) ---
    let timeParts = "";
    if (diffInMs > 0) {
        const totalMin = Math.floor(diffInMs / 60000);
        const days = Math.floor(totalMin / 1440);
        const hours = Math.floor((totalMin % 1440) / 60);
        const minutes = totalMin % 60;
        timeParts = `.n-${days}.f-005.n-${hours}.f-006.f-007.n-${minutes}.f-008`;
    }

    // --- בניית המחרוזת הסופית לפי הסדר המדויק של ההקלטות שלך ---
    // דיווח כספי -> הודעת עידוד (אופציונלי) -> יתרה/הצלחה -> הודעת זמן (אופציונלי) -> זמן
    const message = `${financialReport}${encouragement}${middleSection}${timeEncouragement}${timeParts}`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(`id_list_message=${message}`);

  } catch (error) {
    return res.send("id_list_message=t-חלה שגיאה במערכת");
  }
};
