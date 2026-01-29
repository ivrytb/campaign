const axios = require('axios');

module.exports = async (req, res) => {
    const apiData = req.query.ApiData || "";
    const step = req.query.step || "0";

    try {
        let textToSay = "";
        let nextStep = "1";
        const cleanData = apiData.toString().replace(/[^0-9*]/g, '').trim();

        // לוגיקה: כניסה / חזרה / שתיקה ארוכה (10 שניות)
        if ((cleanData === '' && step === "0") || cleanData === '*' || (cleanData === '' && step === "2")) {
            const campaignId = process.env.CAMPAIGN_ID || '10031';
            const genResponse = await axios.get(`https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`);
            const data = genResponse.data;
            const totalIncome = Math.floor(parseFloat(data.totalincome));
            const goal = parseInt(data.goal);
            const percent = Math.floor((totalIncome / goal) * 100);

            textToSay = `עד כה נאספו ${percent} אחוזים, שהם ${totalIncome} שקלים. לשמיעת נתוני מתרים, הקישו את מספר המתרים וסולמית. לחזרה לתפריט זה בכל שלב הקישו כוכבית.`;
            nextStep = "1";
        } 
        // תזכורת ראשונה (אחרי 5 שניות שקט)
        else if (cleanData === '' && step === "1") {
            textToSay = "המערכת ממתינה להקשת מתרים נוסף, או להקשה על כוכבית כדי לחזור לתפריט הראשי.";
            nextStep = "2";
        }
        // חיפוש מתרים
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

                textToSay = `${name}. השיג ${percent} אחוזים מהיעד. התרים סך של ${total} שקלים, באמצעות ${donors} תורמים. להקשת מתרים נוסף הקישו מספר וסולמית, לחזרה הקישו כוכבית.`;
                nextStep = "1";
            }
        }

        // בניית מחרוזת ה-read לפי ההגדרות המדויקות שלך:
        // 1:ApiData | 2:ריק | 3:מקסימום=7 | 4:מינימום=ריק | 5:שניות=7 | 6:הקראה=NO | 7:סולמית=ריק | ... | 15:אישור=no
        const readSettings = "ApiData,,7,,7,NO,,,,,,,,no";
        const responseString = `read=t-${textToSay}=${readSettings}&api_link_append=step=${nextStep}`;

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(responseString);

    } catch (error) {
        return res.send(`id_list_message=t-חלה שגיאה במערכת`);
    }
};
