const axios = require('axios');

module.exports = async (req, res) => {
    // שלב 1: בדיקה האם המאזין הקיש מספר מתרים (ApiData)
    const selection = req.query.ApiData;

    try {
        // --- מצב א': המאזין הקיש מספר מתרים ---
        if (selection && selection !== '*#') {
            const response = await axios.get('https://www.matara.pro/nedarimplus/V6/MatchPlus.aspx?Action=SearchMatrim&Name=&MosadId=7017016');
            const matrimin = response.data;
            const matrim = matrimin.find(m => m.Id === selection);

            if (!matrim) {
                return res.send(`id_list_message=t-מתרים מספר ${selection} לא נמצא&read=t-אנא הקש שוב את מספר המתרים ולאחריו סולמית=selection,yes,5,1,10,No,yes,no`);
            }

            const name = matrim.Name.replace(/"/g, '');
            const total = Math.floor(parseFloat(matrim.Cumule));
            const goal = parseInt(matrim.Goal);
            const percent = goal > 0 ? Math.floor((total / goal) * 100) : 0;
            const donors = matrim.Donator;

            const responseText = `${name}, השיג ${percent} אחוזים מהיעד, והתרים ${total} שקלים באמצעות ${donors} תורמים.`;
            
            // בסיום ההקראה, מבקשים שוב הקשה כדי להישאר בלולאה
            return res.send(`id_list_message=t-${responseText}&read=t-לנתוני מתרים נוסף הקש את המספר ולאחריו סולמית, לחזרה לתפריט הקודם הקש כוכבית סולמית=selection,yes,5,1,10,No,yes,no`);
        }

        // --- מצב ב': המאזין הקיש *# או שזו הפעם הראשונה שלו (נתונים כלליים) ---
        const campaignId = process.env.CAMPAIGN_ID;
        const generalUrl = `https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`;
        const genResponse = await axios.get(generalUrl);
        const data = genResponse.data;

        const totalIncome = Math.floor(parseFloat(data.totalincome));
        const goal = parseInt(data.goal);
        const percent = Math.floor((totalIncome / goal) * 100);

        const generalText = `עד כה נאספו ${percent} אחוזים, שהם ${totalIncome} שקלים.`;
        const askMatrim = "לשמיעת נתוני מתרים מסוים, הקש כעת את מספר המתרים וסולמית.";

        // כאן הקסם: אנחנו שולחים את הטקסט הכללי ומיד אחריו פקודת read לקבלת הקלט
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(`id_list_message=t-${generalText}&read=t-${askMatrim}=selection,yes,5,1,10,No,yes,no`);

    } catch (error) {
        return res.send("id_list_message=t-חלה שגיאה במערכת, אנא נסו שוב מאוחר יותר.");
    }
};
