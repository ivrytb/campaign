const axios = require('axios');

module.exports = async (req, res) => {
    // ימות המשיח שולחים את ההקשה בפרמטר ApiData
    const selection = req.query.ApiData;

    // 1. אם המשתמש הקיש *# (חזרה לתפריט ראשי - הקובץ הקודם)
    if (selection === '*#') {
        return res.send(`go_to_folder=/1`); // שנה לכתובת השלוחה המרכזית שלך
    }

    // 2. אם המשתמש רק נכנס לשלוחה (אין עדיין הקשה)
    if (!selection) {
        const askMessage = "לשמיעת נתוני מתרים מסוים, אנא הקש את מספר המתרים ולאחריו סולמית, לחזרה לתפריט הקודם הקש כוכבית סולמית";
        // פקודת read מבקשת קלט ושומרת אותו ב-selection
        return res.send(`read=t-${askMessage}=selection,yes,5,1,10,No,yes,no`);
    }

    // 3. יש הקשה - מחפשים את המתרים ב-API של נדרים פלוס
    try {
        const response = await axios.get('https://www.matara.pro/nedarimplus/V6/MatchPlus.aspx?Action=SearchMatrim&Name=&MosadId=7017016');
        const matrimin = response.data;

        // חיפוש המתרים ברשימה
        const matrim = matrimin.find(m => m.Id === selection);

        if (!matrim) {
            return res.send(`id_list_message=t-מתרים מספר ${selection} לא נמצא&next_step=api/matrim`);
        }

        // עיבוד נתוני המתרים
        const name = matrim.Name.replace(/"/g, ''); // ניקוי גרשיים בשם
        const total = Math.floor(parseFloat(matrim.Cumule));
        const goal = parseInt(matrim.Goal);
        const percent = goal > 0 ? Math.floor((total / goal) * 100) : 0;
        const donors = matrim.Donator;

        const responseText = `${name}, השיג ${percent} אחוזים מתוך היעד, והתרים סך של ${total} שקלים מתוך ${goal} שקלים, באמצעות ${donors} תורמים.`;

        // מחזירים תשובה ומחזירים אותו שוב לבחירת מתרים (כדי שיוכל להקיש שוב)
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(200).send(`id_list_message=t-${responseText}&next_step=api/matrim`);

    } catch (error) {
        res.status(200).send("id_list_message=t-חלה שגיאה בגישה לנתוני המתרימים&next_step=api/matrim");
    }
};
