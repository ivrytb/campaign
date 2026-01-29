const axios = require('axios');

module.exports = async (req, res) => {
    const apiData = req.query.ApiData || "";
    const step = req.query.step || "init";

    try {
        // הגדרות ה-Read שלך - ניקוי מוחלט של פסיקים מהטקסט בהמשך
        const readSettings = "ApiData,,7,,7,NO,,,,,,,,no";

        // 1. כניסה ראשונה (משלוחת האב)
        if (apiData === '' && step === "init") {
            const firstAsk = "נא הקישו את מספר המתרים וסולמית לחזרה הקישו כוכבית";
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.send(`read=t-${firstAsk}=${readSettings}&api_link_append=step=1`);
        }

        // 2. חזרה לשלוחת האב (הקשת *)
        if (apiData === '*') {
            return res.send(`go_to_folder=..`);
        }

        // 3. טיפול בשתיקה (ApiData ריק)
        if (apiData === '') {
            if (step === "2") {
                return res.send(`go_to_folder=..`); 
            }
            const reminder = "המערכת ממתינה למספר מתרים או כוכבית לחזרה";
            return res.send(`read=t-${reminder}=${readSettings}&api_link_append=step=2`);
        }

        // 4. חיפוש מתרים בנדרים פלוס
        const response = await axios.get('https://www.matara.pro/nedarimplus/V6/MatchPlus.aspx?Action=SearchMatrim&Name=&MosadId=7017016');
        const matrim = response.data.find(m => m.Id.toString().trim() === apiData);

        if (!matrim) {
            const errorMsg = `מתרים מספר ${apiData} לא נמצא הקישו שוב וסולמית`;
            return res.send(`read=t-${errorMsg}=${readSettings}&api_link_append=step=1`);
        }

        // 5. ניקוי הטקסט - קריטי! הסרת פסיקים וגרשיים כדי לא לשבור את ה-read
        let name = matrim.Name.replace(/[,"']/g, '').replace(/[^א-ת ]/g, '');
        const total = Math.floor(parseFloat(matrim.Cumule));
        const donors = matrim.Donator;
        const goal = parseInt(matrim.Goal);
        const percent = goal > 0 ? Math.floor((total / goal) * 100) : 0;

        // בניית המשפט ללא פסיקים בכלל
        const textToSay = `${name} השיג ${percent} אחוזים והתרים ${total} שקלים מ-${donors} תורמים להקשת מתרים נוסף הקישו מספר וסולמית`;

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(`read=t-${textToSay}=${readSettings}&api_link_append=step=1`);

    } catch (error) {
        return res.send(`id_list_message=t-חלה שגיאה&go_to_folder=..`);
    }
};
