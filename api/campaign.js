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

    // הגדרות זמן סיום
    const year = 2026, month = 2, day = 8, hour = 23, minute = 59;
    const pad = (n) => n.toString().padStart(2, '0'); 
    const dateString = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+02:00`;
    const endDate = new Date(dateString);
    const diffInMs = endDate - new Date();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const isCampaignActive = diffInMs > 0;

    // --- 1. בחירת פתיח (000 כשהקמפיין רץ, 017 כשהסתיים) ---
    let message = isCampaignActive ? "f-000" : "f-017";

    // --- 2. דיווח נתונים (תמיד מושמע) ---
    message += `.n-${percent}.f-001.n-${totalIncome}.f-002.n-${donors}.f-003`;

    // --- 3. הודעת עידוד רנדומלית (רק אם פעיל ומתחת ל-100%) ---
    if (isCampaignActive && totalIncome < goal) {
        if (percent >= 87) {
            // רנדומלי לישורת האחרונה: 011, 019, 020, 021
            const randomGevald = ["011", "019", "020", "021"];
            const chosen = randomGevald[Math.floor(Math.random() * randomGevald.length)];
            message += `.f-${chosen}`;
        } 
        else if (percent >= 80) {
            // רנדומלי לטווח ה-80%: 010 (קרובים) או 021 (אישי)
            const random80 = ["010", "021"];
            const chosen80 = random80[Math.floor(Math.random() * random80.length)];
            message += `.f-${chosen80}`;
        }
    }

    // --- 4. חישוב יתרה או הצלחה ---
    if (totalIncome >= goal) {
        message += ".f-009"; // ברוך השם עברנו את היעד
    } else if (isCampaignActive) {
        const missingAmount = goal - totalIncome;
        message += `.f-015.n-${missingAmount}.f-004`;
    }

    // --- 5. זמן וסיום ---
    if (isCampaignActive) {
        message += ".f-016";
        
        if (diffInHours <= 5) message += ".f-014";
        else if (diffInHours <= 24) message += ".f-013";
        else if (diffInHours <= 48) message += ".f-012";

        const totalMin = Math.floor(diffInMs / 60000);
        const days = Math.floor(totalMin / 1440);
        const hours = Math.floor((totalMin % 1440) / 60);
        const minutes = totalMin % 60;
        message += `.n-${days}.f-005.n-${hours}.f-006.f-007.n-${minutes}.f-008`;
    } else {
        message += ".f-018";
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(`id_list_message=${message}`);

  } catch (error) {
    return res.send("id_list_message=t-חלה שגיאה במערכת");
  }
};
