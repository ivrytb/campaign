const axios = require('axios');

module.exports = async (req, res) => {
    // שליפת נתונים מימות המשיח
    let apiData = req.query.ApiData || req.body?.ApiData;
    // שלב (Step) עוזר לנו לדעת אם אנחנו בתזכורת השנייה
    let step = req.query.step || "1";

    // ניקוי הקלט (רק מספרים וכוכבית)
    if (apiData) {
        apiData = apiData.toString().replace(/[^0-9*]/g, '').trim();
    }

    try {
        // --- מצב א': חזרה לתפריט ראשי (הקשת * או פעם שנייה ללא קלט) ---
        if (!apiData || apiData === '*' || (apiData === '' && step === "2")) {
            const campaignId = process.env.CAMPAIGN_ID || '10031';
            const generalUrl = `https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`;
            const genResponse = await axios.get(generalUrl);
            const data = genResponse.data;

            const totalIncome = Math.floor(parseFloat(data.totalincome));
            const goal = parseInt(data.goal);
            const percent = Math.floor((totalIncome / goal) * 100);

            const generalText = `עד כה נאספו ${percent} אחוזים, שהם ${totalIncome} שקלים. לשמיעת נתוני מתרים, הקישו את מספר המתרים וסולמית. לחזרה לתפריט זה בכל שלב הקישו כוכבית.`;
            
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            // שליחת המשתמש חזרה למצב המתנה רגיל
            return res.send(`read=t-${generalText}=ApiData,yes,1,7,5,,yes,`);
        }

        // --- מצב ב': תזכורת ראשונה (היה קלט ריק פעם אחת) ---
        if (apiData === '' && step === "1") {
            const reminderText = "המערכת ממתינה להקשת מתרים נוסף, או להקשה על כוכבית כדי לחזור לתפריט הראשי.";
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            // כאן אנחנו מעבירים step=2 ב-URL כדי שבפעם הבאה נחזור לתפריט הראשי
            return res.send(`read=t-${reminderText}=ApiData,yes,1,7,5,,yes,&step=2`);
        }

        // --- מצב ג': הצגת נתוני מתרים ---
        const response = await axios.get('https://www.matara.pro/nedarimplus/V6/MatchPlus.aspx?Action=SearchMatrim&Name=&MosadId=7017016');
        const matrimin = response.data;
        const matrim = matrimin.find(m => m.Id.toString().trim() === apiData);

        if (!matrim) {
            const errorText = `מתרים מספר ${apiData} לא נמצא. אנא הקישו שוב את מספר המתרים וסולמית, או כוכבית לחזרה.`;
            return res.send(`read=t-${errorText}=ApiData,yes,1,7,5,,yes,`);
        }

        // ניקוי שם להקראה
        let name = matrim.Name.replace(/[\\"]/g, '').replace(/''/g, '"').replace(/"/g, '');
        name = name.replace(/שליט"א/g, 'שליטה').replace(/הרה"צ/g, 'הרה צדוק').replace(/אדמו"ר/g, 'אדמור');
        
        const total = Math.floor(parseFloat(matrim.Cumule));
        const goal = parseInt(matrim.Goal);
        const donors = matrim.Donator; // מספר תורמים
        const percent = goal > 0 ? Math.floor((total / goal) * 100) : 0;

        const responseText = `${name}. השיג ${percent} אחוזים מהיעד. התרים ${total} שקלים, באמצעות ${donors} תורמים. `;
        const footer = "להקשת מתרים נוסף הקישו את המספר וסולמית, לחזרה לתפריט הראשי הקישו כוכבית.";

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        // החזרת התשובה עם step=1 כדי להתחיל את ספירת התזכורות מחדש
        return res.send(`read=t-${responseText}${footer}=ApiData,yes,1,7,5,,yes,&step=1`);

    } catch (error) {
        console.error("Error:", error.message);
        return res.send(`read=t-חלה שגיאה במערכת, נסו שוב מאוחר יותר.=ApiData,yes,1,1,1,,yes,`);
    }
};
