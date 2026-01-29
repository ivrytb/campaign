const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const campaignId = process.env.CAMPAIGN_ID;
    const url = `https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`;

    // 1. קריאת נתוני הקמפיין מ-LiveRaiser
    const response = await axios.get(url);
    const data = response.data;

    const goal = parseInt(data.goal);
    const totalIncome = Math.floor(parseFloat(data.totalincome));
    const donors = data.donorscount;
    const percent = Math.floor((totalIncome / goal) * 100);

    // --- תוספת חישוב הזמן - ללא נקודות ---
    let timeText = "";
    try {
        const timeResponse = await axios.get('https://give.taharat.org/publicapi/campaigns/amirim?lang_code=he', { timeout: 3000 });
        const campaignData = timeResponse.data.data || timeResponse.data; 
        
        if (campaignData && campaignData.end_date) {
            const endDate = new Date(campaignData.end_date);
            const now = new Date();
            const diffInMs = endDate - now;

            if (diffInMs > 0) {
                const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
                
                timeText = ` לְסִיּוּם הַקַּמְפֵּין נָשְׁאֲרוּ `;
                if (days > 0) timeText += `${days} יָמִים `;
                if (hours > 0) timeText += `${hours} שָׁעוֹת `;
                timeText += `וְ ${minutes} דַּקּוֹת`;
            } else {
                timeText = " הַקַּמְפֵּין הִסְתַּיֵּים";
            }
        }
    } catch (e) {
        timeText = ""; 
    }

    // בניית המשפט ללא נקודות בכלל - רק פסיקים להפסקות
    const textToSay = `עַד כֹּה נֶאֶסְפוּ ${percent} אֲחוּזִים שֶׁהֵם ${totalIncome} שְׁקָלִים בְּאֶמְצָעוּת ${donors} תּוֹרְמִים , ${timeText}`;

    const message = `id_list_message=t-${textToSay}`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(message);

  } catch (error) {
    res.status(200).send("id_list_message=t-חלה שגיאה במשיכת הנתונים");
  }
};
