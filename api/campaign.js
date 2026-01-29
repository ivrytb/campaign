const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const campaignId = process.env.CAMPAIGN_ID;
    // כתובת ה-API של LiveRaiser
    const url = `https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`;

    // 1. נתוני תרומות
    const response = await axios.get(url);
    const data = response.data;
    
    const goal = parseInt(data.goal) || 1000000;
    const totalIncome = Math.floor(parseFloat(data.totalincome)) || 0;
    const donors = data.donorscount || 0;
    const percent = Math.floor((totalIncome / goal) * 100);

    // ניקוי טקסט מוחלט למניעת חיתוך מילים
    const part1 = `עַד כֹּה נֶאֶסְפוּ ${percent} אֲחוּזִים שֶׁהֵם ${totalIncome} שְׁקָלִים בְּאֶמְצָעוּת ${donors} תּוֹרְמִים`;

    // 2. חישוב זמן מ-Give (עם הגנה מקסימלית)
    let part2 = "";
    try {
        const timeRes = await axios.get('https://give.taharat.org/publicapi/campaigns/amirim?lang_code=he', { 
            timeout: 4000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const endDateRaw = timeRes.data?.data?.end_date;
        if (endDateRaw) {
            // כפיית זמן ישראל GMT+2
            const endDate = new Date(endDateRaw.replace(" ", "T") + "+02:00");
            const now = new Date();
            const diffInMs = endDate - now;

            if (diffInMs > 0) {
                const totalMinutes = Math.floor(diffInMs / (1000 * 60));
                const days = Math.floor(totalMinutes / (1440));
                const hours = Math.floor((totalMinutes % 1440) / 60);
                const minutes = totalMinutes % 60;

                part2 = `לְסִיּוּם הַקַּמְפֵּין נָשְׁאֲרוּ `;
                if (days > 0) part2 += `${days} יָמִים `;
                if (hours > 0) part2 += `${hours} שָׁעוֹת `;
                part2 += `וְ ${minutes} דַּקּוֹת`;
            }
        }
    } catch (e) {
        // אם נכשל, נשאיר ריק כדי שלא יגיד "שגיאה"
        part2 = ""; 
    }

    // 3. בניית התשובה ללא תווים מיוחדים בכלל (רק אותיות, מספרים ופסיקים)
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    
    // בניית מחרוזת נקייה לחלוטין
    let finalMsg = `t-${part1.replace(/[.-]/g, '')}`;
    if (part2) {
        finalMsg += `.t-${part2.replace(/[.-]/g, '')}`;
    }

    return res.status(200).send(`id_list_message=${finalMsg}`);

  } catch (error) {
    // הודעת חירום אם הכל קורס
    return res.status(200).send("id_list_message=t-חלה שגיאה זמנית במערכת");
  }
};
