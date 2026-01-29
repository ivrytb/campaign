const axios = require('axios');

module.exports = async (req, res) => {
    // 1. שליפת הנתון שהוקש - ימות המשיח שולחים ב-ApiData
    // אנחנו בודקים את כל האפשרויות כדי לוודא ששום דבר לא מתפספס
    let selection = req.query.ApiData || req.body?.ApiData || req.query.selection;

    // ניקוי בסיסי של הקלט (רווחים, תווים מוזרים)
    if (selection) {
        selection = selection.toString().replace(/[^0-9*#]/g, '').trim();
    }

    try {
        // --- מצב א': המאזין הקיש מספר מתרים ---
        if (selection && selection !== '*#' && selection !== '') {
            const response = await axios.get('https://www.matara.pro/nedarimplus/V6/MatchPlus.aspx?Action=SearchMatrim&Name=&MosadId=7017016');
            const matrimin = response.data;

            // חיפוש המתרים ברשימה
            const matrim = matrimin.find(m => m.Id.toString().trim() === selection);

            if (!matrim) {
                // אם לא נמצא - אומרים שלא נמצא ומבקשים מיד להקיש שוב (אופציה לתקן)
                const errorMsg = `מתרים מספר ${selection} לא נמצא.`;
                return res.send(`id_list_message=t-${errorMsg}&read=t-אנא הקישו שוב את מספר המתרים ולאחריו סולמית, או כוכבית סולמית לחזרה=selection,yes,1,1,10,No,yes,no`);
            }

            // נמצא מתרים - עיבוד נתונים
            // ניקוי השם מגרשיים ותארים שמשבשים את ההקראה
            let name = matrim.Name.replace(/[\\"]/g, '').replace(/''/g, '"');
            name = name.replace(/שליט"א/g, 'שליטה').replace(/הרה"צ/g, 'הרה צדוק').replace(/אדמו"ר/g, 'אדמור');

            const total = Math.floor(parseFloat(matrim.Cumule));
            const goal = parseInt(matrim.Goal);
            const donors = matrim.Donator;
            const percent = goal > 0 ? Math.floor((total / goal) * 100) : 0;

            const responseText = `${name}. השיג ${percent} אחוזים מהיעד. התריס סך של ${total} שקלים, באמצעות ${donors} תורמים.`;

            // השמעת התוצאה ובקשה למתרים נוסף (מאפשר להמשיך או לתקן)
            return res.send(`id_list_message=t-${responseText}&read=t-לנתוני מתרים נוסף הקישו את המספר וסולמית, לחזרה לתפריט הראשי הקישו כוכבית סולמית=selection,yes,1,1,10,No,yes,no`);
        }

        // --- מצב ב': כניסה ראשונית או חזרה לתפריט ראשי ---
        const campaignId = process.env.CAMPAIGN_ID || '10031';
        const generalUrl = `https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`;
        const genResponse = await axios.get(generalUrl);
        const data = genResponse.data;

        const totalIncome = Math.floor(parseFloat(data.totalincome));
        const goal = parseInt(data.goal);
        const donorsCount = data.donorscount;
        const percent = Math.floor((totalIncome / goal) * 100);

        const generalText = `עד כה נאספו ${percent} אחוזים, שהם ${totalIncome} שקלים, באמצעות ${donorsCount} תורמים.`;
        const askMatrim = "לשמיעת נתוני מתרים מסוים, הקישו כעת את מספר המתרים וסולמית.";

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        // שולח את נתוני הקמפיין ומיד מחכה להקשה
        return res.send(`id_list_message=t-${generalText}&read=t-${askMatrim}=selection,yes,1,1,10,No,yes,no`);

    } catch (error) {
        console.error("General Error:", error.message);
        return res.send("id_list_message=t-חלה שגיאה במשיכת הנתונים. אנא נסו שוב מאוחר יותר.");
    }
};
