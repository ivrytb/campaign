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

    // חלק 1 - נתוני קמפיין מנוקדים
    const part1 = `עַד כֹּה נֶאֶסְפוּ ${percent} אֲחוּזִים שֶׁהֵם ${totalIncome} שְׁקָלִים בְּאֶמְצָעוּת ${donors} תּוֹרְמִים`;

    // חישוב זמן ידני (8 בפברואר 22:00)
    const endDate = new Date("2026-02-08T22:00:00+02:00");
    const now = new Date();
    const diffInMs = endDate - now;

    let part2 = "הַקַּמְפֵּין הִסְתַּיֵּים";
    if (diffInMs > 0) {
        const totalMinutes = Math.floor(diffInMs / (1000 * 60));
        const days = Math.floor(totalMinutes / 1440);
        const hours = Math.floor((totalMinutes % 1440) / 60);
        const minutes = totalMinutes % 60;
        
        part2 = `לְסִיּוּם הַקַּמְפֵּין נָשְׁאֲרוּ `;
        if (days > 0) part2 += `${days} יָמִים `;
        if (hours > 0) part2 += `${hours} שָׁעוֹת `;
        part2 += `וְ ${minutes} דַּקּוֹת`;
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    
    // שימוש בנקודה עם רווחים כמפריד רשמי בין הודעות t-
    const finalMsg = `t-${part1} . t-${part2}`;
    
    return res.send(`id_list_message=${finalMsg}`);

  } catch (error) {
    return res.send("id_list_message=t-חֲלָה שְׁגִיאָה בַּמַּעֲרֶכֶת");
  }
};
