const axios = require('axios');

module.exports = async (req, res) => {
    // ימות המשיח שולחים את ההקשה ב-ApiData. 
    // אנחנו בודקים גם query וגם body ליתר ביטחון.
    let apiData = req.query.ApiData || req.body?.ApiData;

    try {
        // שלב א': אם המשתמש הקיש מספר מתרים (כלומר יש ApiData והוא לא ריק)
        if (apiData && apiData !== '' && apiData !== '*#') {
            const response = await axios.get('https://www.matara.pro/nedarimplus/V6/MatchPlus.aspx?Action=SearchMatrim&Name=&MosadId=7017016');
            const matrimin = response.data;
            
            const cleanId = apiData.toString().trim();
            const matrim = matrimin.find(m => m.Id.toString().trim() === cleanId);

            if (!matrim) {
                const errorText = `מתרים מספר ${cleanId} לא נמצא. אנא הקישו שוב את מספר המתרים וסולמית.`;
                return res.send(`read=t-${errorText}=ApiData,yes,1,1,10,No,yes,no`);
            }

            // נמצא מתרים - ניקוי שם להקראה חלקה
            let name = matrim.Name.replace(/[\\"]/g, '').replace(/''/g, '"');
            name = name.replace(/שליט"א/g, 'שליטה').replace(/הרה"צ/g, 'הרה צדוק');

            const total = Math.floor(parseFloat(matrim.Cumule));
            const goal = parseInt(matrim.Goal);
            const donors = matrim.Donator;
            const percent = goal > 0 ? Math.floor((total / goal) * 100) : 0;

            const responseText = `${name}. השיג ${percent} אחוזים מהיעד. התרים ${total} שקלים, באמצעות ${donors} תורמים.`;
            const nextStepText = `לנתוני מתרים נוסף, הקישו את המספר וסולמית. לחזרה ליעד הכללי, הקישו כוכבית סולמית.`;

            // מחזירים פקודת read שמשמיעה את התוצאה ומחכה להקשה הבאה
            return res.send(`read=t-${responseText} ${nextStepText}=ApiData,yes,1,1,10,No,yes,no`);
        }

        // שלב ב': כניסה ראשונית או הקשת *# (הקראת יעד כללי)
        const campaignId = process.env.CAMPAIGN_ID || '10031';
        const generalUrl = `https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`;
        const genResponse = await axios.get(generalUrl);
        const data = genResponse.data;

        const totalIncome = Math.floor(parseFloat(data.totalincome));
        const goal = parseInt(data.goal);
        const percent = Math.floor((totalIncome / goal) * 100);

        const generalText = `עד כה נאספו ${percent} אחוזים, שהם ${totalIncome} שקלים.`;
        const askMatrim = "לשמיעת נתוני מתרים מסוים, הקישו את מספר המתרים וסולמית.";

        // הגדרת Header כטקסט פשוט כפי שנדרש
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(`read=t-${generalText} ${askMatrim}=ApiData,yes,1,1,10,No,yes,no`);

    } catch (error) {
        // במקרה של שגיאה ב-API החיצוני
        return res.send(`read=t-חלה שגיאה במשיכת הנתונים. אנא נסו שוב מאוחר יותר.=ApiData,yes,1,1,1,No,yes,no`);
    }
};
