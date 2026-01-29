const axios = require('axios');

module.exports = async (req, res) => {
    // שליפת הנתונים
    const apiData = req.query.ApiData || "";
    const step = req.query.step || "0";

    try {
        let textToSay = "";
        let nextStep = "1";
        const cleanData = apiData.toString().replace(/[^0-9*]/g, '').trim();

        // לוגיקה: כניסה / חזרה / שתיקה
        if ((cleanData === '' && step === "0") || cleanData === '*' || (cleanData === '' && step === "2")) {
            const campaignId = process.env.CAMPAIGN_ID || '10031';
            const genResponse = await axios.get(`https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`);
            const data = genResponse.data;
            const totalIncome = Math.floor(parseFloat(data.totalincome));
            textToSay = `עד כה נאספו ${totalIncome} שקלים. הקישו מספר מתרים וסולמית. לחזרה הקישו כוכבית.`;
            nextStep = "1";
        } 
        else if (cleanData === '' && step === "1") {
            textToSay = "המערכת ממתינה להקשת מתרים נוסף, או כוכבית לחזרה.";
            nextStep = "2";
        }
        else {
            const response = await axios.get('https://www.matara.pro/nedarimplus/V6/MatchPlus.aspx?Action=SearchMatrim&Name=&MosadId=7017016');
            const matrim = response.data.find(m => m.Id.toString().trim() === cleanData);

            if (!matrim) {
                textToSay = `מספר ${cleanData} לא נמצא. הקישו שוב וסולמית.`;
                nextStep = "1";
            } else {
                // ניקוי שם אגרסיבי למניעת ניתוקים
                let name = matrim.Name.replace(/[^א-ת ]/g, ''); 
                const total = Math.floor(parseFloat(matrim.Cumule));
                const donors = matrim.Donator;
                textToSay = `${name}. השיג ${total} שקלים, מ${donors} תורמים. להקשה נוספת הקישו מספר וסולמית, לחזרה כוכבית.`;
                nextStep = "1";
            }
        }

        // בניית התשובה - נצמדים לפורמט הכי בסיסי שעובד
        const readSettings = `ApiData,,7,,7,NO,,,,,,,,no`;
        
        // הוספתי את ה-step ישירות ל-URL של ה-API כפרמטר קבוע
        const responseString = `api_answer=OK&read=t-${textToSay}=${readSettings}&api_link_append=step=${nextStep}`;

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(responseString);

    } catch (error) {
        // אם יש שגיאה, נחזיר הודעה פשוטה שלא תנתק את השיחה
        return res.send(`api_answer=OK&id_list_message=t-חלה שגיאה`);
    }
};
