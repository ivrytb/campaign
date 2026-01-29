const axios = require('axios');

module.exports = async (req, res) => {
    const apiData = req.query.ApiData || "";
    const step = req.query.step || "1";

    try {
        // 1. אם המשתמש הקיש * -> נחזיר פקודה לעבור לשלוחה של היעד הכללי
        if (apiData === '*') {
            // החלף את '1' בנתיב השלוחה של היעד הכללי שלך
            return res.send(`go_to_folder=/1`);
        }

        // 2. אם המשתמש לא הקיש כלום (שתיקה)
        if (apiData === '') {
            if (step === "2") {
                // שתיקה שנייה - חזרה ליעד הכללי
                return res.send(`go_to_folder=/1`);
            }
            // שתיקה ראשונה - תזכורת (נשארים באותה שלוחה עם step=2)
            const reminder = "המערכת ממתינה למספר מתרים, או כוכבית לחזרה.";
            return res.send(`read=t-${reminder}=ApiData,,7,,7,NO,,,,,,,,no&api_link_append=step=2`);
        }

        // 3. חיפוש מתרים בנדרים פלוס
        const response = await axios.get('https://www.matara.pro/nedarimplus/V6/MatchPlus.aspx?Action=SearchMatrim&Name=&MosadId=7017016');
        const matrim = response.data.find(m => m.Id.toString().trim() === apiData);

        if (!matrim) {
            const errorMsg = `מתרים ${apiData} לא נמצא. הקישו שוב וסולמית, או כוכבית לחזרה.`;
            return res.send(`read=t-${errorMsg}=ApiData,,7,,7,NO,,,,,,,,no&api_link_append=step=1`);
        }

        // נמצא מתרים - הכנת הודעה
        let name = matrim.Name.replace(/[^א-ת ]/g, '');
        const total = Math.floor(parseFloat(matrim.Cumule));
        const donors = matrim.Donator;
        const goal = parseInt(matrim.Goal);
        const percent = goal > 0 ? Math.floor((total / goal) * 100) : 0;

        const textToSay = `${name}. השיג ${percent} אחוזים. התרים ${total} שקלים, מ-${donors} תורמים. להקשת מתרים נוסף הקישו מספר וסולמית, לחזרה הקישו כוכבית.`;

        // לופ: נשארים באותה שלוחה ומחכים להקשה הבאה
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(`read=t-${textToSay}=ApiData,,7,,7,NO,,,,,,,,no&api_link_append=step=1`);

    } catch (error) {
        return res.send(`id_list_message=t-חלה שגיאה במערכת&go_to_folder=/1`);
    }
};
