const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const campaignId = process.env.CAMPAIGN_ID;
    const url = `https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`;

    // 1. נתוני LiveRaiser (החלק שבוודאות עובד לך)
    const response = await axios.get(url);
    const data = response.data;
    const totalIncome = Math.floor(parseFloat(data.totalincome));
    const donors = data.donorscount;
    const percent = Math.floor((totalIncome / parseInt(data.goal)) * 100);

    const part1 = `עַד כֹּה נֶאֶסְפוּ ${percent} אֲחוּזִים, שֶׁהֵם ${totalIncome} שְׁקָלִים, בְּאֶמְצָעוּת ${donors} תּוֹרְמִים`;

    // 2. נתוני זמן מהאתר של Give
    let part2 = "";
    try {
        const timeRes = await axios.get('https://give.taharat.org/publicapi/campaigns/amirim?lang_code=he', { timeout: 3000 });
        const endDateRaw = timeRes.data?.data?.end_date;

        if (endDateRaw) {
            // תיקון קריטי: מוסיפים +02:00 כדי שהשרת בחו"ל יבין שזה זמן ישראל
            const endDate = new Date(endDateRaw.replace(" ", "T") + "+02:00");
            const now = new Date();
            const diffInMs = endDate - now;

            if (diffInMs > 0) {
                const totalMinutes = Math.floor(diffInMs / (1000 * 60));
                const days = Math.floor(totalMinutes / (60 * 24));
                const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
                const minutes = totalMinutes % 60;

                part2 = " לְסִיּוּם הַקַּמְפֵּין נָשְׁאֲרוּ ";
                if (days > 0) part2 += `${days} יָמִים `;
                if (hours > 0) part2 += `${hours} שָׁעוֹת `;
                part2 += `וְ ${minutes} דַּקּוֹת`;
            }
        }
    } catch (e) {
        part2 = ""; // אם נכשל, פשוט לא יוסיף את הזמן
    }

    // 3. בניית התשובה הסופית לימות המשיח
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    
    if (part2) {
        // שרשור תקני עם נקודה ו-t- נוסף
        return res.send(`id_list_message=t-${part1}.t-${part2}`);
    } else {
        return res.send(`id_list_message=t-${part1}`);
    }

  } catch (error) {
    return res.send("id_list_message=t-חלה שגיאה כללית במערכת");
  }
};
