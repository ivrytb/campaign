const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const campaignId = process.env.CAMPAIGN_ID;
    const url = `https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`;

    // 1. נתוני קמפיין
    const response = await axios.get(url);
    const data = response.data;
    
    const goal = 1000000;
    const totalIncome = Math.floor(parseFloat(data.totalincome)) || 0;
    const donors = data.donorscount || 0;
    const percent = Math.floor((totalIncome / goal) * 100);

    // 2. חישוב זמן ידני (מוודא שהמספרים נקיים)
    const endDate = new Date("2026-02-08T22:00:00+02:00");
    const now = new Date();
    const diffInMs = endDate - now;

    let timeText = "";
    if (diffInMs > 0) {
        const totalMinutes = Math.floor(diffInMs / (1000 * 60));
        const days = Math.floor(totalMinutes / 1440);
        const hours = Math.floor((totalMinutes % 1440) / 60);
        const minutes = totalMinutes % 60;
        
        // בניית טקסט הזמן ללא נקודות
        timeText = ` ,, וּלְסִיּוּם הַקַּמְפֵּין נָשְׁאֲרוּ ${days} יָמִים ${hours} שָׁעוֹת וְ ${minutes} דקות.`;
    }

    // 3. בניית משפט אחד ארוך - ללא נקודות בתוך ה-t
    // השתמשתי בפסיקים בלבד להפסקות דיבור
    const finalSentence = `עַד כֹּה נֶאֶסְפוּ ${percent} אֲחוּזִים, שֶׁהֵם ${totalIncome} שְׁקָלִים, בְּאֶמְצָעוּת ${donors} תורמים${timeText}`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    
    // שליחה כהודעה אחת רציפה - הכי בטוח בימות המשיח
    return res.send(`id_list_message=t-${finalSentence}`);

  } catch (error) {
    return res.send("id_list_message=t-חֲלָה שְׁגִיאָה בַּמַּעֲרֶכֶת");
  }
};
