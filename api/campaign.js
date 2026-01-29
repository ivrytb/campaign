const axios = require('axios');

module.exports = async (req, res) => {
    // שליפת הנתונים שימות המשיח שולחים ב-URL
    const apiData = req.query.ApiData || "";
    const step = req.query.step || "1";

    try {
        let textToSay = "";
        let nextStep = "1";

        // ניקוי הקלט
        const cleanData = apiData.toString().replace(/[^0-9*]/g, '').trim();

        // לוגיקה 1: כניסה ראשונית או הקשת כוכבית לחזרה
        if (cleanData === '*' || (cleanData === '' && step === "main")) {
            const campaignId = process.env.CAMPAIGN_ID || '10031';
            const genResponse = await axios.get(`https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`);
            const data = genResponse.data;

            const totalIncome = Math.floor(parseFloat(data.totalincome));
            const goal = parseInt(data.goal);
            const percent = Math.floor((totalIncome / goal) * 100);

            textToSay = `עד כה נאספו ${percent} אחוזים, שהם ${totalIncome} שקלים. לשמיעת נתוני מתרים, הקישו את מספר המתרים וסולמית. לחזרה לתפריט זה בכל שלב הקישו כוכבית.`;
            nextStep = "1";
        } 
        // לוגיקה 2: שתיקה ראשונה (5 שניות עברו) - תזכורת
        else if (cleanData === '' && step === "1") {
            textToSay = "המערכת ממתינה להקשת מתרים נוסף, או להקשה על כוכבית כדי לחזור לתפריט הראשי.";
            nextStep = "main"; // הפעם הבאה שתהיה שתיקה, נחזור לתפריט הראשי
        }
        // לוגיקה 3: חיפוש מתרים
        else {
            const response = await axios.get('https://www.matara.pro/nedarimplus/V6/MatchPlus.aspx?Action=SearchMatrim&Name=&MosadId=7017016');
            const matrim = response.data.find(m => m.Id.toString().trim() === cleanData);

            if (!matrim) {
                textToSay = `מתרים מספר ${cleanData} לא נמצא. אנא הקישו שוב את מספר המתרים וסולמית, או כוכבית לחזרה.`;
                nextStep = "1";
            } else {
                let name = matrim.Name.replace(/[\\"]/g, '').replace(/''/g, '"').replace(/"/g, '');
                name = name.replace(/שליט"א/g, 'שליטה').replace(/הרה"צ/g, 'הרה צדוק').replace(/אדמו"ר/g, 'אדמור');
                
                const total = Math.floor(parseFloat(matrim.Cumule));
                const goal = parseInt(matrim.Goal);
                const donors = matrim.Donator;
                const percent = goal > 0 ? Math.floor((total / goal) * 100) : 0;

                textToSay = `${name}. השיג ${percent} אחוזים מהיעד. התרים ${total} שקלים, באמצעות ${donors} תורמים. להקשת מתרים נוסף הקישו את המספר וסולמית, לחזרה הקישו כוכבית.`;
                nextStep = "1";
            }
        }

        // בניית התשובה בדיוק לפי הפורמט של "דוגמה לתגובה מהשרת המכילה הגדרות"
        // הוספת ה-step לתוך הקישור של ה-api_link כדי לשמור על המצב
        const baseUrl = `https://${req.headers.host}/api/campaign?step=${nextStep}`;
        const responseString = `read=t-${textToSay}=ApiData,yes,1,7,5,,yes,${baseUrl}`;

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(responseString);

    } catch (error) {
        // במקרה שגיאה נחזיר הודעה פשוטה
        return res.send(`id_list_message=t-חלה שגיאה במשיכת הנתונים`);
    }
};
