const axios = require('axios');

module.exports = async (req, res) => {
  try {
    // שליפת מזהה הקמפיין ממשתני הסביבה של ורסל
    const campaignId = process.env.CAMPAIGN_ID;
    const url = `https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`;

    // פנייה ל-API של לייו רייסר
    const response = await axios.get(url);
    const data = response.data;

    // עיבוד הנתונים למספרים שלמים
    const goal = parseInt(data.goal);
    const totalIncome = Math.floor(parseFloat(data.totalincome));
    const donors = data.donorscount;
    
    // חישוב אחוזים ועיגול למספר שלם
    const percent = Math.floor((totalIncome / goal) * 100);

    // בניית המחרוזת לימות המשיח
    // הקידומת read=t- גורמת למערכת להקריא את הטקסט
    const message = `read=t-נאספו ${percent} אחוזים, שהם ${totalIncome} שקלים, באמצעות ${donors} תורמים, תמשיכו לעבוד הלאה`;

    // שליחת התשובה
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(message);

  } catch (error) {
    res.status(500).send("read=t-חלה שגיאה במשיכת הנתונים, אנא נסו שוב מאוחר יותר.");
  }
};
