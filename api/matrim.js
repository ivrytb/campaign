const axios = require('axios');

module.exports = async (req, res) => {
    // שליפת הנתונים שימות המשיח שולחים
    const apiData = req.query.ApiData || "";
    // וודא שאנחנו מקבלים את ה-step מה-URL או מה-append
    const step = req.query.step || "0"; 

    try {
        // הגדרות ה-Read שלך
        const readSettings = "ApiData,,7,,7,NO,,,,,,,,no";

        // 1. כניסה ראשונה לשלוחה (step=0 ואין עדיין הקשה)
        if (apiData === '' && step === "0") {
            const welcomeMsg = "נא הקישו את מספר המתרים מנדרים פלוס ולסיום הקישו סולמית לחזרה לתפריט הראשי הקישו כוכבית";
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.send(`read=t-${welcomeMsg}=${readSettings}&api_link_append=step=1`);
        }

        // 2. חזרה לשלוחת האב (הקשת *)
        if (apiData === '*') {
            return res.send(`go_to_folder=..`);
        }

        // 3. טיפול בשתיקה (המשתמש לא הקיש כלום ועברו 7 שניות)
        if (apiData === '') {
            if (step === "2") {
                // שתיקה שנייה ברצף - חוזרים למעלה
                return res.send(`go_to_folder=..`);
            }
            // שתיקה ראשונה - נותנים תזכורת
            const reminder = "המערכת ממתינה להקשת מספר מתרים או כוכבית לחזרה";
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.send(`read=t-${reminder}=${readSettings}&api_link_append=step=2`);
        }

        // 4. חיפוש מתרים בנדרים פלוס
        const response = await axios.get('https://www.matara.pro/nedarimplus/V6/MatchPlus.aspx?Action=SearchMatrim&Name=&MosadId=7017016');
        const matrim = response.data.find(m => m.Id.toString().trim() === apiData);

        if (!matrim) {
            const errorMsg = `מתרים מספר ${apiData} לא נמצא נא הקישו שוב מספר מתרים וסולמית`;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.send(`read=t-${errorMsg}=${readSettings}&api_link_append=step=1`);
        }

        // 5. נמצא מתרים - הכנת הודעה מפורטת
        let name = matrim.Name.replace(/[,"']/g, '').replace(/[^א-ת ]/g, '');
        const total = Math.floor(parseFloat(matrim.Cumule));
        const donors = matrim.Donator;
        const goal = parseInt(matrim.Goal);
        const percent = goal > 0 ? Math.floor((total / goal) * 100) : 0;

        // בניית משפט ברור ללא פסיקים
        const info = `${name} השיג ${percent} אחוז מהיעד והתרים ${total} שקלים באמצעות ${donors} תורמים`;
        const footer = "לבחירת מתרים אחר הקישו את המספר וסולמית או כוכבית לחזרה";

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(`read=t-${info} ${footer}=${readSettings}&api_link_append=step=1`);

    } catch (error) {
        return res.send(`id_list_message=t-חלה שגיאה במערכת&go_to_folder=..`);
    }
};
