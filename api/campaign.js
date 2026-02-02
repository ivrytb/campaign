const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const campaignId = process.env.CAMPAIGN_ID;
    const url = `https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`;

    const response = await axios.get(url);
    const data = response.data;
    
    const goal = data.goal || 1000000;
    const totalIncome = 950000 //Math.floor(parseFloat(data.totalincome)) || 0;
    const donors = data.donorscount || 0;
    const percent = Math.floor((totalIncome / goal) * 100);

    // הגדרות זמן סיום
    const year = 2026, month = 2, day = 2, hour = 5, minute = 32;
    const pad = (n) => n.toString().padStart(2, '0'); 
    const dateString = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+02:00`;
    const endDate = new Date(dateString);
    const diffInMs = endDate - new Date();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const isCampaignActive = diffInMs > 0;

    // --- 1. בחירת פתיח (000 כשהקמפיין רץ, 017 כשהסתיים) ---
    let message = isCampaignActive ? "f-000" : "f-017";

    // --- 2. דיווח נתונים (תמיד מושמע) ---
    // אחוזים (001) -> סכום (002) -> תורמים (003)
    message += `.n-${percent}.f-001.n-${totalIncome}.f-002.n-${donors}.f-003`;

    // --- 3. הודעת עידוד אחוזים (רק אם פעיל ומתחת ל-100%) ---
    if (isCampaignActive && totalIncome < goal) {
        if (percent >= 87) message += ".f-011"; // גיוואלד
        else if (percent >= 80) message += ".f-010"; // קרובים ליעד
    }

    // --- 4. חישוב יתרה או הצלחה ---
    if (totalIncome >= goal) {
        message += ".f-009"; // ברוך השם עברנו את היעד
    } else if (isCampaignActive) {
        const missingAmount = goal - totalIncome;
        // נשארו עוד (015) -> X שקלים -> ליעד הסופי (004)
        message += `.f-015.n-${missingAmount}.f-004`;
    }

    // --- 5. זמן וסיום ---
    if (isCampaignActive) {
        // מילת קישור לזמן (016)
        message += ".f-016";
        
        // עידוד זמן דחוף
        if (diffInHours <= 5) message += ".f-014";
        else if (diffInHours <= 24) message += ".f-013";
        else if (diffInHours <= 48) message += ".f-012";

        // פירוט הטיימר (005-008)
        const totalMin = Math.floor(diffInMs / 60000);
        const days = Math.floor(totalMin / 1440);
        const hours = Math.floor((totalMin % 1440) / 60);
        const minutes = totalMin % 60;
        message += `.n-${days}.f-005.n-${hours}.f-006.f-007.n-${minutes}.f-008`;
    } else {
        // סגיר חגיגי אם הקמפיין נגמר (018)
        message += ".f-018";
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(`id_list_message=${message}`);

  } catch (error) {
    return res.send("id_list_message=t-חלה שגיאה במערכת");
  }
};
