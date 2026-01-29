const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const campaignId = process.env.CAMPAIGN_ID || '10031';
    const url = `https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`;

    const response = await axios.get(url);
    const data = response.data;

    const goal = parseInt(data.goal);
    const totalIncome = Math.floor(parseFloat(data.totalincome));
    const donors = data.donorscount;
    const percent = Math.floor((totalIncome / goal) * 100);

    const textToSay = `עד כה נאספו ${percent} אחוזים, שהם ${totalIncome} שקלים, באמצעות ${donors} תורמים.`;

    // כאן השדרוג: אנחנו משמיעים את היעד ומיד מעבירים לפקודת read שמחכה למתרים
    // שים לב: אנחנו שולחים את המשתמש לקובץ בשם matrim.js (או איך שתקרא לו)
    const nextAsk = "לשמיעת נתוני מתרים, הקישו את מספר המתרים וסולמית. לחזרה הקישו כוכבית.";
    const readSettings = "ApiData,,7,,7,NO,,,,,,,,no";
    
    // הפורמט הזה משמיע את ההודעה ואז עובר ל-read שמחכה לקלט
    const message = `id_list_message=t-${textToSay}&read=t-${nextAsk}=${readSettings}`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(message);

  } catch (error) {
    res.status(200).send("id_list_message=t-חלה שגיאה במשיכת הנתונים");
  }
};
