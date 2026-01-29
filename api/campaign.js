const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const campaignId = process.env.CAMPAIGN_ID;
    const url = `https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`;

    const response = await axios.get(url);
    const data = response.data;
    
    const goal =  1000000;
    const totalIncome = Math.floor(parseFloat(data.totalincome)) || 0;
    const donors = data.donorscount || 0;
    const percent = Math.floor((totalIncome / goal) * 100);
    const missingAmount = goal - totalIncome;

    // חישוב זמן - סיום ב-08/02 בשעה 09:30
    const endDate = new Date("2026-02-08T09:30:00+02:00");
    const diffInMs = endDate - new Date();

    let timeParts = "";
    if (diffInMs > 0) {
        const totalMin = Math.floor(diffInMs / 60000);
        const days = Math.floor(totalMin / 1440);
        const hours = Math.floor((totalMin % 1440) / 60);
        const minutes = totalMin % 60;
        
        // f-004(ליעד הסופי..) -> n(ימים) -> f-005(ימים) -> n(שעות) -> f-006(שעות) -> f-007(ו-) -> n(דקות) -> f-008(דקות)
        timeParts = `.f-004.n-${days}.f-005.n-${hours}.f-006.f-007.n-${minutes}.f-008`;
    }

    // בניית המחרוזת:
    // f-000(עד כה) -> n(אחוזים) -> f-001(שהם) -> n(סכום) -> f-002(באמצעות) -> n(תורמים) -> f-003(תורמים נשארו עוד) -> n(יתרה) -> timeParts
    const message = `f-000.n-${percent}.f-001.n-${totalIncome}.f-002.n-${donors}.f-003.n-${missingAmount}${timeParts}`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(`id_list_message=${message}`);

  } catch (error) {
    return res.send("id_list_message=t-חלה שגיאה במערכת");
  }
};
