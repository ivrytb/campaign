const axios = require('axios');

module.exports = async (req, res) => {
    // שליפת הקלט מימות המשיח
    let apiData = req.query.ApiData || req.body?.ApiData;
    
    // ניקוי הקלט
    if (apiData) {
        apiData = apiData.toString().replace(/[^0-9*#]/g, '').trim();
    }

    try {
        let responseText = "";

        // --- מצב א': חיפוש מתרים ---
        if (apiData && apiData !== '' && apiData !== '*#') {
            const response = await axios.get('https://www.matara.pro/nedarimplus/V6/MatchPlus.aspx?Action=SearchMatrim&Name=&MosadId=7017016');
            const matrimin = response.data;
            const matrim = matrimin.find(m => m.Id.toString().trim() === apiData);

            if (!matrim) {
                responseText = `מתרים מספר ${apiData} לא נמצא. `;
            } else {
                let name = matrim.Name.replace(/[\\"]/g, '').replace(/''/g, '"').replace(/"/g, '');
                name = name.replace(/שליט"א/g, 'שליטה').replace(/הרה"צ/g, 'הרה צדוק').replace(/אדמו"ר/g, 'אדמור');
                
                const total = Math.floor(parseFloat(matrim.Cumule));
                const goal = parseInt(matrim.Goal);
                const donors = matrim.Donator;
                const percent = goal > 0 ? Math.floor((total / goal) * 100) : 0;

                responseText = `${name}. השיג ${percent} אחוזים. התרים ${total} שקלים, באמצעות ${donors} תורמים. `;
            }
            
            const nextAsk = "הקישו מספר מתרים נוסף וסולמית, או כוכבית סולמית לחזרה.";
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.send(`api_answer=OK&read=t-${responseText}${nextAsk}=ApiData,yes,1,1,10,No,yes,no`);
        }

        // --- מצב ב': יעד כללי ---
        const campaignId = process.env.CAMPAIGN_ID || '10031';
        const generalUrl = `https://www.liveraiser.co.il/api/getcampaigndetails?campaign_id=${campaignId}`;
        const genResponse = await axios.get(generalUrl);
        const data = genResponse.data;

        const totalIncome = Math.floor(parseFloat(data.totalincome));
        const goal = parseInt(data.goal);
        const percent = Math.floor((totalIncome / goal) * 100);

        const generalText = `עד כה נאספו ${percent} אחוזים, שהם ${totalIncome} שקלים. `;
        const askMatrim = "לשמיעת נתוני מתרים, הקישו את מספר המתרים וסולמית.";

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        // שים לב לתוספת api_answer=OK& בתחילת התשובה
        return res.send(`api_answer=OK&read=t-${generalText}${askMatrim}=ApiData,yes,1,1,10,No,yes,no`);

    } catch (error) {
        console.error("Error details:", error.message);
        return res.send(`api_answer=OK&read=t-חלה שגיאה במערכת=ApiData,yes,1,1,1,No,yes,no`);
    }
};
