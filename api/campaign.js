const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const campaignId = process.env.CAMPAIGN_ID;
    const url = `https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`;

    const response = await axios.get(url);
    const data = response.data;
    
    const goal = 1000000;
    const totalIncome = Math.floor(parseFloat(data.totalincome)) || 0;
    const donors = data.donorscount || 0;
    const percent = Math.floor((totalIncome / goal) * 100);
    const missingAmount = goal - totalIncome;

    // חישוב זמן מדויק לפי האתר (סיום ב-08/02 ב-09:30 בבוקר)
    const endDate = new Date("2026-02-08T09:30:00+02:00");
    const now = new Date();
    const diffInMs = endDate - now;

    let timeText = "";
    if (diffInMs > 0) {
        const totalMinutes = Math.floor(diffInMs / (1000 * 60));
        const days = Math.floor(totalMinutes / 1440);
        const hours = Math.floor((totalMinutes % 1440) / 60);
        const minutes = totalMinutes % 60;
        
        // שימוש בפסיקים כפולים להפסקה נעימה לפני הזמן
        timeText = ` ,, וּלְסִיּוּם הקמפיין נָשְׁאֲרוּ ${days} יָמִים, ${hours} שָׁעוֹת, וְ ${minutes} דקות.`;
    }

    // בניית המשפט עם היתרה ליעד
    const finalSentence = `עַד כֹּה נתרמו ${percent} אֲחוּזִים, שֶׁהֵם ${totalIncome} שְׁקָלִים, בְּאֶמְצָעוּת ${donors} ,תורמים , נָשְׁאֲרוּ עוֹד ${missingAmount} שְׁקָלִים לַיַּעַד הסופי ${timeText}`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(`id_list_message=t-${finalSentence}`);

  } catch (error) {
    return res.send("id_list_message=t-חֲלָה שְׁגִיאָה בַּמַּעֲרֶכֶת");
  }
};
