const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const campaignId = process.env.CAMPAIGN_ID;
    const url = `https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`;

    // 1. נתוני LiveRaiser
    const response = await axios.get(url);
    const data = response.data;
    const goal = parseInt(data.goal);
    const totalIncome = Math.floor(parseFloat(data.totalincome));
    const donors = data.donorscount;
    const percent = Math.floor((totalIncome / goal) * 100);

    const part1 = `עַד כֹּה נֶאֶסְפוּ ${percent} אֲחוּזִים, שֶׁהֵם ${totalIncome} שְׁקָלִים, בְּאֶמְצָעוּת ${donors} תּוֹרְמִים`;

    // 2. נתוני זמן מ-Give עם "זהות" של דפדפן
    let part2 = "";
    try {
        const timeResponse = await axios.get('https://give.taharat.org/publicapi/campaigns/amirim?lang_code=he', {
            timeout: 2500,
            headers: { 'User-Agent': 'Mozilla/5.0' } // התחזות לדפדפן
        });

        // בדיקה ישירה של השדה
        const endDateStr = timeResponse.data?.data?.end_date;
        
        if (endDateStr) {
            const diffInMs = new Date(endDateStr) - new Date();
            if (diffInMs > 0) {
                const hours = Math.floor(diffInMs / (1000 * 60 * 60));
                const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
                part2 = `לְסִיּוּם הַקַּמְפֵּין נָשְׁאֲרוּ ${hours} שָׁעוֹת, וְ ${minutes} דַּקּוֹת`;
            }
        }
    } catch (e) {
        // אם ה-API נכשל, נוסיף הודעה קטנה כדי שנדע שזה הגיע לכאן (רק לבדיקה)
         part2 = "זמן לא זמין"; 
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(`id_list_message=t-${part1}.t-${part2}`);

  } catch (error) {
    return res.send("id_list_message=t-חלה שגיאה במשיכת הנתונים");
  }
};
