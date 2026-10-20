# Study Coach 🔔 - הפעלת תזכורות (Push Notifications)

מה מקבלים: תזכורת ערב לפני מבחן, הודעת בהצלחה בבוקר המבחן,
ודחיפה עדינה בערב אם עוד לא סימנה ״למדתי״ והרצף בסכנה.
הכל עובד גם כשהאפליקציה סגורה, באייפון ובאייפד.

## מה כבר מוכן (בתיקייה הזאת)
- `index.html` - גרסת טיוטה של האתר עם כרטיס ״רוצה תזכורות?״ וכפתור הפעלה/כיבוי
- `push.js` - קוד צד-לקוח: הרשמה ל-push, שליחת ״למדתי״ לעובד
- `sw.js` - ה-service worker שמציג את ההתראות
- `exams.json` - רשימת המבחנים שהעובד קורא (לעדכן יחד עם לוח המבחנים באתר)
- `worker.js` - קוד ה-Cloudflare Worker (נבדק מול וקטור הבדיקה הרשמי של RFC 8291)
- `wrangler.toml` - תיעוד ההגדרות
- `vapid-keys.LOCAL-ONLY.json` - מפתחות VAPID. **לא מעלים ל-GitHub לעולם!**

## הצעד היחיד שירדן צריכה לעשות עכשיו
לפתוח חשבון Cloudflare חינמי:
1. להיכנס ל-dash.cloudflare.com מהאייפון או מהמק
2. Sign up - אפשר עם הג'ימייל שלה (y0546367987@gmail.com)
3. לא צריך כרטיס אשראי, לא צריך דומיין - החשבון החינמי מספיק

אחרי זה אנחנו ממשיכים ביחד (בעזרת עוזי) - בערך 10 דקות:
1. Workers & Pages ← Create Worker ← שם: study-coach-push ← Deploy
2. Edit code ← מדביקים את `worker.js` ← Deploy
3. Settings ← Variables: מוסיפים VAPID_PUBLIC_KEY, VAPID_SUBJECT, SITE_ORIGIN
4. Settings ← Variables ← Secret: מוסיפים VAPID_PRIVATE_JWK (מהקובץ המקומי - רק לשם!)
5. KV ← יוצרים namespace בשם study-coach-subs ← קושרים כ-binding בשם SUBS
6. Triggers ← Cron: `0 4,5,15,16,17,18 * * *`
7. מעדכנים ב-`push.js` את PUSH_WORKER_URL לכתובת האמיתית של ה-worker
8. מעלים לריפו: index.html, push.js, sw.js, exams.json (בלי מפתחות!)
9. באייפון ובאייפד: פותחים את האפליקציה ממסך הבית ולוחצים ״הפעילי״

## איך מכבים
- כפתור ״כיבוי״ בכרטיס באתר, או הגדרות האייפון ← התראות ← Study Coach.

## בטיחות ופרטיות
- המפתח הפרטי נשמר רק ב-Cloudflare secrets. הריפו ציבורי ולכן **אסור** שייכנס אליו.
- השרת שומר רק את כתובת ה-subscription (מזהה טכני) ותאריך למידה אחרון. בלי שם, בלי תוכן.
- אייפון/אייפד: push לאפליקציות מסך-בית דורש iOS/iPadOS 16.4 ומעלה - באייפון 16 ואייפד Air עובד.
