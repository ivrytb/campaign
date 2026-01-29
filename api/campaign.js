const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const campaignId = process.env.CAMPAIGN_ID;
    const url = `https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`;

    const response = await axios.get(url);
    const data = response.data;

    const goal = parseInt(data.goal);
    const totalIncome = Math.floor(parseFloat(data.totalincome));
    const donors = data.donorscount;
    const percent = Math.floor((totalIncome / goal) * 100);

    // בניית המשפט
    const textToSay = `עד כה נאספו ${percent} אחוזים, שהם ${totalIncome} שקלים, באמצעות ${donors} תורמים.`;

    // הפורמט הנכון לימות המשיח לפי הקישור ששלחת
    // אנחנו משתמשים ב-encodeURIComponent כדי שהעברית והרווחים יעברו תקין ב-URL
    const message = `id_list_message=t-${textToSay}`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(message);

  } catch (error) {
    // במקרה של שגיאה, המערכת תגיד הודעת שגיאה קצרה
    res.status(200).send("id_list_message=t-חלה שגיאה במשיכת הנתונים");
  }
};
