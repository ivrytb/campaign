const axios = require('axios');

module.exports = async (req, res) => {
    const apiData = req.query.ApiData || "";
    const step = req.query.step || "0";

    try {
        // הגדרות הקלטה: קבלת נתונים, תמיכה בכוכבית, המתנה של 7 שניות
        const readSettings = "ApiData,,7,,7,NO,,,,,,,,,no";

        // 1. טיפול בחזרה לתפריט ראשי (הקשת *)
        if (apiData.includes('*')) {
            return res.send(`go_to_folder=..`);
        }

        // 2. כניסה ראשונית לשלוחה
        if (apiData === '' && step === "0") {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.send(`read=f-000=${readSettings}&api_link_append=step=1`);
        }

        // 3. טיפול בשתיקה (No Input)
        if (apiData === '') {
            if (step === "2") return res.send(`go_to_folder=..`);
            return res.send(`read=f-001=${readSettings}&api_link_append=step=2`);
        }

        // 4. חיפוש המתריס ב-API של נדרים פלוס
        const response = await axios.get('https://www.matara.pro/nedarimplus/V6/MatchPlus.aspx?Action=SearchMatrim&Name=&MosadId=7017016');
        
        // ניקוי הקלט (לוקחים את המספר האחרון שהוקש)
        const cleanData = apiData.toString().split(',').pop().replace(/[^0-9]/g, '');
        const matrim = response.data.find(m => m.Id.toString().trim() === cleanData);

        // 5. מתרים לא נמצא - השמעת שגיאה ובקשה להקשה חוזרת
        if (!matrim) {
            // f-002 (מתרים מספר) -> n (המספר) -> f-003 (לא נמצא, הקש שוב או כוכבית)
            return res.send(`read=f-002.n-${cleanData}.f-003=${readSettings}&api_link_append=step=1`);
        }

        // 6. נמצא מתרים - הכנת הנתונים
        let name = matrim.Name.replace(/[,"']/g, '').replace(/[^א-ת ]/g, ''); // ניקוי תווים משם המתריס
        const total = Math.floor(parseFloat(matrim.Cumule));
        const donors = matrim.Donator;
        const goal = parseInt(matrim.Goal);
        const percent = goal > 0 ? Math.floor((total / goal) * 100) : 0;

        // בניית רצף ההשמעה המשולב:
        // שם המתריס (TTS) + השיג (004) + אחוז (N) + מהיעד והתרים (005) + סכום (N) + מתוך (006) + יעד (N) + באמצעות (007) + תורמים (N) + סיום ובחירה מחדש (008)
        const info = `t-${name}.f-004.n-${percent}.f-005.n-${total}.f-006.n-${goal}.f-007.n-${donors}.f-008`;

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(`read=${info}=${readSettings}&api_link_append=step=1`);

    } catch (error) {
        // במקרה של שגיאה כללית ב-API
        return res.send(`id_list_message=t-חלה שגיאה בחיפוש הנתונים&go_to_folder=..`);
    }
};
