const axios = require('axios');

module.exports = async (req, res) => {
    // שלב 1: חילוץ הנתון שהוקש - בודק גם ב-Query וגם ב-Body
    const selection = req.query.ApiData || req.body?.ApiData || req.query.selection;
    
    console.log("User entered ID:", selection); // לוג לבדיקה בורסל

    try {
        // --- מצב א': המאזין הקיש מספר מתרים ---
        if (selection && selection !== '*#' && selection !== '') {
            const response = await axios.get('https://www.matara.pro/nedarimplus/V6/MatchPlus.aspx?Action=SearchMatrim&Name=&MosadId=7017016');
            const matrimin = response.data;
            
            // המרת ה-selection למחרוזת נקייה מרווחים
            const cleanSelection = selection.toString().trim();
            const matrim = matrimin.find(m => m.Id.toString().trim() === cleanSelection);

            if (!matrim) {
                const errorMsg = `מתרים מספר ${cleanSelection} לא נמצא.`;
                return res.send(`id_list_message=t-${errorMsg}&read=t-אנא הקישו שוב את מספר המתרים וסולמית=selection,yes,1,1,10,No,yes,no`);
            }

            const name = matrim.Name.replace(/"/g, '').replace(/שליט''א/g, 'שליטה');
            const total = Math.floor(parseFloat(matrim.Cumule));
            const goal = parseInt(matrim.Goal);
            const percent = goal > 0 ? Math.floor((total / goal) * 100) : 0;
            const donors = matrim.Donator;

            const responseText = `${name}, השיג ${percent} אחוזים מהיעד, והתרים ${total} שקלים באמצעות ${donors} תורמים.`;
            
            // חזרה לבקשת מתרים נוסף
            return res.send(`id_list_message=t-${responseText}&read=t-לנתוני מתרים נוסף הקישו את המספר וסולמית, לחזרה הקישו כוכבית סולמית=selection,yes,1,1,10,No,yes,no`);
        }

        // --- מצב ב': כניסה ראשונית או חזרה ---
        const campaignId = process.env.CAMPAIGN_ID || '10031';
        const generalUrl = `https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`;
        const genResponse = await axios.get(generalUrl);
        const data = genResponse.data;

        const totalIncome = Math.floor(parseFloat(data.totalincome));
        const goal = parseInt(data.goal);
        const percent = Math.floor((totalIncome / goal) * 100);

        const generalText = `עד כה נאספו ${percent} אחוזים, שהם ${totalIncome} שקלים.`;
        const askMatrim = "לשמיעת נתוני מתרים מסוים, הקישו כעת את מספר המתרים וסולמית.";

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(`id_list_message=t-${generalText}&read=t-${askMatrim}=selection,yes,1,1,10,No,yes,no`);

    } catch (error) {
        console.error("Error:", error.message);
        return res.send("id_list_message=t-חלה שגיאה במערכת");
    }
};
