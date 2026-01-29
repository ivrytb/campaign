const axios = require('axios');

module.exports = async (req, res) => {
    const apiData = req.query.ApiData || "";
    const step = req.query.step || "0";

    try {
        // --- בניית המחרוזת המדויקת ---
        // 1: ApiData
        // 2: (ריק) - כדי שיקבל מחדש בכל פעם ולא ישרשר מספרים!
        // 3: 7 (מקסימום)
        // 4: (ריק - מינימום 1)
        // 5: 7 (שניות המתנה)
        // 6: Number (להשמיע בתורת מספר)
        // 7: (ריק - מאפשר כוכבית)
        // ...
        // 15: no (לא לבקש אישור הקשה)
        const readSettings = "ApiData,,7,,7,NO,,,,,,,,,no";

        // 1. טיפול בחזרה (הקשת *)
        if (apiData.includes('*')) {
            return res.send(`go_to_folder=..`);
        }

        // 2. כניסה ראשונה (שנייה אחרי יעד כללי)
        if (apiData === '' && step === "0") {
            const welcomeMsg = "אָנָּא, הַקִּישׁוּ אֶת מִסְפַּר הַמַּתְּרִים שֶׁל נְדָרִים פְּלוּס, וּלְסִיּוּם הִקִּישׁוּ סֻלָּמִית, לַחֲזָרָה לַתַּפְרִיט הָרָאשִׁי הַקִּישׁוּ כּוֹכָבִית וְסֻלָּמִית";
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.send(`read=t-${welcomeMsg}=${readSettings}&api_link_append=step=1`);
        }

        // 3. טיפול בשתיקה
        if (apiData === '') {
            if (step === "2") return res.send(`go_to_folder=..`);
            const reminder = "הַמַּעֲרֶכֶת מַמְתִּינָה לְמִסְפַּר מַּתְּרִים, אוֹ כּוֹכָבִית וְסֻלָּמִית לַחֲזָרָה";
            return res.send(`read=t-${reminder}=${readSettings}&api_link_append=step=2`);
        }

        // 4. חיפוש מתרים
        const response = await axios.get('https://www.matara.pro/nedarimplus/V6/MatchPlus.aspx?Action=SearchMatrim&Name=&MosadId=7017016');
        
        // הגנה נוספת בקוד: לוקחים רק את המספר האחרון במחרוזת אם יש פסיקים
        const cleanData = apiData.toString().split(',').pop().replace(/[^0-9]/g, '');

        const matrim = response.data.find(m => m.Id.toString().trim() === cleanData);

        if (!matrim) {
            const errorMsg = `מַּתְּרִים מספר ${cleanData} לא נמצא, נא הקישו שוב מספר מתרים וסולמית`;
            return res.send(`read=t-${errorMsg}=${readSettings}&api_link_append=step=1`);
        }

        // 5. נמצא מתרים - הקראת נתונים
        let name = matrim.Name.replace(/[,"']/g, '').replace(/[^א-ת ]/g, '');
        const total = Math.floor(parseFloat(matrim.Cumule));
        const donors = matrim.Donator;
        const goal = parseInt(matrim.Goal);
        const percent = goal > 0 ? Math.floor((total / goal) * 100) : 0;

        const info = `${name}, השיג ${percent} אחוז מהיעד, והתרים ${total} שקלים, מתוך ${goal} שקלים, באמצעות ${donors} תורמים`;
        const footer = "לבחירת מתרים אחר, הקישו את המספר וסולמית, או כוכבית וסולמית לחזרה";

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(`read=t-${info} ${footer}=${readSettings}&api_link_append=step=1`);

    } catch (error) {
        return res.send(`id_list_message=t-חלה שגיאה&go_to_folder=..`);
    }
};
