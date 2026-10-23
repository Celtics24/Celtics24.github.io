// Study Coach - UI language layer. Hebrew is the source and stays the default;
// choosing English re-renders every screen in English (LTR). User content
// (names, subjects, summaries, notebooks) is never translated.
(() => {
const KEY='sc.lang';
const MONTHS={'ינואר':'Jan','פברואר':'Feb','מרץ':'Mar','אפריל':'Apr','מאי':'May','יוני':'Jun','יולי':'Jul','אוגוסט':'Aug','ספטמבר':'Sep','אוקטובר':'Oct','נובמבר':'Nov','דצמבר':'Dec'};
const MO_RE='ינואר|פברואר|מרץ|אפריל|מאי|יוני|יולי|אוגוסט|ספטמבר|אוקטובר|נובמבר|דצמבר';
const WD={'א':'Sun','ב':'Mon','ג':'Tue','ד':'Wed','ה':'Thu','ו':'Fri','ש':'Sat'};
const D=[
// nav + shared
['בית','Home'],['סיכומים','Summaries'],['מחברות','Notebooks'],['מבחנים','Exams'],['חברים','Friends'],['הגדרות','Settings'],
['ניווט','Navigation'],['טוען…','Loading…'],['ביטול','Cancel'],['שמירה','Save'],['נשמר','Saved'],['נשמר.','Saved.'],['סגירה','Close'],['חזרה','Back'],['מקצוע','Subject'],
['לא נשמר. נסי שוב.','Not saved. Try again.'],['לא נשמר. נסו שוב.','Not saved. Try again.'],['השמירה לא הצליחה. נסי שוב.',"Couldn't save. Try again."],['השמירה לא הצליחה. נסו שוב.',"Couldn't save. Try again."],
['לא הצליח. נסי שוב.',"Didn't work. Try again."],['השרת לא זמין כרגע.','The server is unavailable right now.'],['הפרופיל הושבת על ידי מנהלת האפליקציה.','This profile was suspended by the app admin.'],
// home
['המבחן הקרוב','Next exam'],['היום!','Today!'],['מחר!','Tomorrow!'],['היום! בהצלחה','Today! Good luck'],['עבר','Passed'],['ימים','days'],
['המחברת האחרונה','Last notebook'],['יום רצף','streak day'],['ימי רצף','streak days'],['יום נספר עם ״למדתי״','A day counts with "Studied"'],
['הספרינט האחרון ⏳','The final sprint ⏳'],['המקצועות שלי','My subjects'],['הסיכומים שלי','My summaries'],['מועצת תלמידים','Student council'],
['פתחי את כל התיקייה בדרייב','Open the whole folder in Drive'],['פתחי את תיקיית המועצה בדרייב','Open the council folder in Drive'],['פתחי את התיקייה בדרייב','Open the folder in Drive'],
['פתחי את הסיכום','Open the summary'],['פתחי את תיקיית המקצוע','Open the subject folder'],['מקצועות','Subjects'],['ההתקדמות שלי','My progress'],
['למדתי!','Studied!'],['למדתי?','Studied?'],['עדיין ריקה','Still empty'],['יש סיכום','Has summary'],['עריכה','Edit'],['‹ סיכומים','‹ Summaries'],
['עוד אין סיכומים במקצוע','No summaries in this subject yet'],['חיפוש סיכום או מקצוע…','Search a summary or subject…'],['חיפוש סיכום או מקצוע','Search a summary or subject'],
// exams page
['לוח מבחנים','Exam board'],['הוספת מבחן','Add exam'],['נובמבר 2026','November 2026'],['יומן נובמבר 2026','November 2026 calendar'],
['תאריך','Date'],['שעה (לא חובה)','Time (optional)'],['שם המבחן (לא חובה)','Exam name (optional)'],['למשל: בגרות בפיזיולוגיה','E.g.: biology matriculation'],
['קישור לסיכומים (לא חובה)','Link summaries (optional)'],['הצגת סיכומים מכל המקצועות','Show summaries from all subjects'],
['אין מקצועות בפרופיל.','No subjects in the profile.'],['אין עדיין סיכומים במקצוע הזה.','No summaries in this subject yet.'],['בחרי תאריך.','Pick a date.'],
['המחיקה לא הצליחה. נסי שוב.',"Couldn't delete. Try again."],['מחיקת המבחן','Delete exam'],['למחוק את המבחן?','Delete this exam?'],
// settings
['צבע האפליקציה','App color'],['אבטחת גישה','Access security'],['מערכת השעות','Timetable'],['חיבור בין מכשירים','Connect devices'],
['פרופיל','Profile'],['התראות','Notifications'],['ניהול האפליקציה','App admin'],['פרטיות','Privacy'],['מדיניות פרטיות','Privacy policy'],['מחיקת פרופיל','Delete profile'],
['ורוד','Pink'],['כחול','Blue'],['סגול','Purple'],['ירוק מנטה','Mint green'],['יין','Wine'],['כהה','Dark'],['מנטה','Mint'],['כתום','Orange'],
['שמירת מפתח שחזור','Save recovery key'],['המפתח מאפשר כניסה אם קוד החיבור אבד. שמרו אותו במקום פרטי.','The key lets you sign in if the pairing code is lost. Keep it somewhere private.'],
['המפתח החדש נשמר בקובץ. מפתח קודם בוטל.','The new key was saved to a file. Any previous key was revoked.'],['לא ניתן ליצור מפתח כרגע. נסו שוב.',"Can't create a key right now. Try again."],
['מערכת השעות שלך','Your timetable'],
['הבנתי שהמחיקה קבועה ותפסיק את הסנכרון וההתראות של הפרופיל',"I understand the deletion is permanent and stops this profile's sync and notifications"],
['מחיקה לצמיתות','Delete permanently'],['לא ניתן למחוק כרגע. נסו שוב מאוחר יותר.',"Can't delete right now. Try again later."],
// privacy policy (full text, opened from "מדיניות פרטיות")
['המקצועות, הקישורים, מערכת השעות, העדפות הצבע ונתוני הלמידה נשמרים בפרופיל בשרת ובמכשירים שחוברו אליו. הרשמה להתראות שומרת גם כתובת משלוח טכנית. קבצים מקושרים נשארים בדרייב ובהרשאות שלו. שם פרטי ושם משפחה שנשמרים בפרופיל נראים לאחרים רק אם בחרת להיות ניתנת לחיפוש. חברים שאישרת רואים שמות של מחברות וסיכומים בלבד, ותוכן עובר רק באישור על כל פריט, כעותק שנשאר אצל מי שקיבלה. סיכומי טקסט מצילום נשמרים בפרופיל. צילום לוח נשלח רק באישור לעיבוד זמני ב-Cloudflare, ללא שמירת התמונה באפליקציה או ביומני תוכן. השירות אינו משתמש בתוכן לאימון, בכפוף לחריגי אבטחה וחוק. PDF נוצר במכשיר. מוני שימוש יומיים ללא התמונה או הטקסט נשמרים בנפרד עד לאיפוס היומי (00:02 UTC).','Subjects, links, timetable, color preference and study data are stored in your profile on the server and on connected devices. Signing up for notifications also stores a technical delivery address. Linked files stay in Drive under its own permissions. A first and last name saved in the profile is visible to others only if you chose to be searchable. Friends you approved see notebook and summary titles only, and content is shared only with approval per item, as a copy kept by the recipient. Text summaries from a photo are stored in the profile. A board photo is sent only with approval for temporary processing at Cloudflare, without storing the image in the app or in content logs. The service does not use content for training, subject to security and legal exceptions. PDFs are generated on the device. Daily usage counters without the image or text are stored separately until the daily reset (00:02 UTC).'],
['מנהלת האפליקציה (בעלת האתר) רואה רשימת פרופילים עם שם, תאריך הצטרפות ומצב חסימה בלבד, ויכולה להשבית פרופיל; אין לה גישה לתוכן של משתמשים. קוד החיבור ומפתח השחזור מעניקים גישה לפרופיל. שמרו אותם פרטיים. מחיקת הפרופיל מסירה את נתוניו הפעילים בשרת ואת העותק במכשיר הזה, ולא מוחקת קבצים בדרייב, גיבויים פרטיים או עותקים במכשירים אחרים. אין כאן מערכת חשבונות מלאה.','The app admin (site owner) sees a list of profiles with name, join date and block status only, and can suspend a profile; she has no access to user content. The pairing code and recovery key grant access to the profile. Keep them private. Deleting the profile removes its active data on the server and the copy on this device, and does not delete files in Drive, private backups or copies on other devices. This is not a full account system.'],
['תוכן ישן עשוי עדיין להופיע בהיסטוריית הקוד הציבורית, שטרם נוקתה.','Old content may still appear in the public code history, which has not been cleaned yet.'],
// sync card
['הסנכרון פעיל','Sync is on'],['הרצף והסימונים מתעדכנים בין המכשירים שלך','Your streak and marks update across your devices'],['הקוד לחיבור מכשיר נוסף','Code for pairing another device'],['ניתוק','Disconnect'],
['הזיני את הקוד מהמכשיר השני','Enter the code from your other device'],['קוד סנכרון','Sync code'],['חיבור','Connect'],
['הקוד לא נמצא - בדקי שוב במכשיר השני','Code not found - check again on the other device'],['הקוד לא תקין - 8 אותיות וספרות','Invalid code - 8 letters and digits'],
['סנכרון בין מכשירים','Sync between devices'],['אותו רצף ואותם סימוני ״למדתי״ באייפון ובאייפד','Same streak and "Studied" marks on iPhone and iPad'],
['הפעילי','Turn on'],['יש לי קוד','I have a code'],
// reminders card
['תזכורות פועלות','Reminders are on'],['אשלח לך תזכורת לפני מבחנים ונשמור על הרצף',"I'll remind you before exams and keep your streak going"],['כיבוי','Turn off'],
['רוצה תזכורות?','Want reminders?'],['תזכורת ערב לפני מבחן, בהצלחה בבוקר, ודחיפה עדינה לרצף','Evening reminder before an exam, good luck in the morning, and a gentle streak nudge'],
['ההתראות חסומות','Notifications are blocked'],['אפשר לאפשר אותן בהגדרות האייפון ← Study Coach','You can allow them in iPhone Settings → Study Coach'],
// onboarding
['המקצועות שלך','Your subjects'],['שם פרטי','First name'],['שם משפחה','Last name'],['אפשר לאחרים למצוא אותי לפי שם מלא','Let others find me by full name'],
['רשימת מקצועות','Subjects list'],['מתמטיקה, אנגלית, היסטוריה','Math, English, History'],['שמירה וכניסה','Save and enter'],
['פרופיל חדש','New profile'],['יש לך קוד?','Have a code?'],['שחזור גישה','Access recovery'],['מפתח השחזור','Recovery key'],['שחזור','Recover'],['ניסיון נוסף','Try again'],
['הפרופיל לא זמין. התחברו שוב או השתמשו בשחזור.','Profile unavailable. Sign in again or use recovery.'],['לא ניתן לטעון כרגע. נסו שוב.',"Can't load right now. Try again."],
['השחזור לא הצליח. בדקו את המפתח או נסו מאוחר יותר.','Recovery failed. Check the key or try again later.'],['לא ניתן ליצור פרופיל כרגע.',"Can't create a profile right now."],
['הקוד לא נמצא. בדקו שוב.','Code not found. Check again.'],['השם יכול להכיל אותיות, רווח, גרש ומקף, 2 עד 30 תווים.','Name can contain letters, spaces, apostrophes and hyphens, 2 to 30 characters.'],
['שמירת השם לא הצליחה. נסו שוב.',"Couldn't save the name. Try again."],
// add file
['הוספת קובץ','Add file'],['צילום לוח ל-PDF','Board photo to PDF'],['שם הקובץ','File name'],['קישור לדרייב','Drive link'],['או קובץ PDF עם טקסט','Or a PDF with text'],['תיאור קצר','Short description'],
['קישור נשאר בדרייב והרשאותיו לא משתנות. PDF נשמר כטקסט בסיכומים.','Links stay in Drive with their permissions. PDFs are saved as text in summaries.'],
['הוספה','Add'],['הוסיפו מקצועות דרך ההצטרפות לפני הוספת קובץ.','Add subjects during sign-up before adding files.'],['קוראת את ה-PDF…','Reading the PDF…'],
['הדביקו קישור לדרייב או בחרו קובץ PDF.','Paste a Drive link or choose a PDF file.'],['לא נשמר. בדקו שהקישור הוא של Google Drive או Google Docs ונסו שוב.','Not saved. Make sure the link is Google Drive or Google Docs and try again.'],
// friends
['כדי להשתמש בחברים צריך לשמור שם פרטי ושם משפחה. רק את בוחרת אם אחרים יוכלו למצוא אותך.','To use friends, save a first and last name. Only you choose whether others can find you.'],
['להגדרות','To settings'],['חיפוש','Search'],['בקשת חברות','Friend request'],['נשלחה בקשה','Request sent'],['שלחו לך בקשה, מופיעה למטה','They sent you a request, shown below'],
['אישור','Approve'],['דחייה','Decline'],['חסימה','Block'],['ביטול חסימה','Unblock'],['ממתין לאישור','Waiting for approval'],['נדחה','Declined'],['נוסף','Added'],['פג תוקף','Expired'],['בוטל','Cancelled'],
['הוספה אליי','Add to me'],['עוד אין חברים.','No friends yet.'],['אין עדיין.','Nothing yet.'],['בקשת גישה','Request access'],['אושר, להוספה','Approved, add it'],
['חזרה לחברים','Back to friends'],['הסרת חבר','Remove friend'],['הוספת חברים','Add friends'],['בקשות חברות','Friend requests'],['בקשות לפריטים שלי','Requests for my items'],
['מה ביקשתי','What I asked for'],['החברים שלי','My friends'],['בקשות שנשלחו','Sent requests'],['חסומים','Blocked'],
['רואים כאן רק שמות. כדי לקבל פריט צריך לבקש, והוא צריך לאשר כל פריט בנפרד.','Only titles are visible here. To get an item you ask, and they approve each item separately.'],
['האישור תקף 7 ימים, ומתקבל עותק אחד שנשאר אצלה.','Approval is valid for 7 days, and one copy is received and kept by the recipient.'],
['זה קישור לדרייב. ההרשאות בדרייב לא משתנות.',"This is a Drive link. Drive permissions don't change."],
['הסרת הפרופיל החברתי','Remove social profile'],['שמירת פרופיל','Save profile'],
['כדי להוסיף חברים צריך קודם לשמור שם בפרופיל.','To add friends, first save a name in the profile.'],
['לא נמצא. בדקי איות, או שהאדם לא בחר להיות ניתן לחיפוש.',"Not found. Check the spelling, or they didn't choose to be searchable."],
['הכניסי שם פרטי ושם משפחה תקינים.','Enter a valid first and last name.'],['אין מקום בפרופיל להוסיף את הפריט.','No room in the profile to add the item.'],
['יותר מדי ניסיונות. נסי שוב בעוד כמה דקות.','Too many attempts. Try again in a few minutes.'],
['להסיר את הפרופיל החברתי? חברים, בקשות ואישורים יימחקו. הסיכומים והמחברות שלך לא ייפגעו.','Remove the social profile? Friends, requests and approvals will be deleted. Your summaries and notebooks are not affected.'],
['להסיר את החבר? בקשות פתוחות יבוטלו. פריטים שכבר הועתקו נשארים.','Remove this friend? Open requests will be cancelled. Items already copied stay.'],
['לחסום? הוא לא יוכל לשלוח לך בקשות או למצוא אותך.',"Block them? They won't be able to send you requests or find you."],
['מבקשת את המחברת','is asking for the notebook'],['מבקשת את הסיכום','is asking for the summary'],
// admin
['טוען רשימת משתמשים…','Loading user list…'],['לא ניתן לטעון כרגע. נסי שוב.',"Can't load right now. Try again."],['ללא שם עדיין','No name yet'],['את','You'],['חסומה','Blocked'],['שחרור חסימה','Unblock'],
['לחסום את הפרופיל? המשתמש לא יוכל להשתמש באפליקציה עד לשחרור. הנתונים לא נמחקים.','Block this profile? The user will not be able to use the app until unblocked. Data is not deleted.'],
// notebooks
['המחברות שלי','My notebooks'],['‹ המחברות שלי','‹ My notebooks'],['מחברת חדשה','New notebook'],['יצירת מחברת','Create notebook'],['צבע הכריכה','Cover color'],
['המחברת הראשונה שלך מתחילה כאן','Your first notebook starts here'],['יצירת מחברות לפי המקצועות','Create notebooks from subjects'],
['＋ מחברת','＋ Notebook'],['📷 צילום דף','📷 Photo page'],['＋ דף טקסט','＋ Text page'],['הוספת סיכום','Add summary'],['הוספת PDF','Add PDF'],['PDF למחברת','Notebook PDF'],
['פתיחה ועריכה','Open & edit'],['מחיקה','Delete'],['אפשרויות מחברת','Notebook options'],['אפשרויות','Options'],['שינוי שם','Rename'],['מחיקת המחברת','Delete notebook'],
['עוד פעולות','More actions'],
['דף חדש','New page'],['עריכת דף','Edit page'],['שם הדף','Page title'],['תוכן הדף','Page content'],['שמירה במחברת','Save to notebook'],
['מחיקת דף','Delete page'],['למחוק את הדף הזה?','Delete this page?'],['כל דפי המחברת יימחקו.','All notebook pages will be deleted.'],['לא ניתן לשחזר.','This cannot be undone.'],
['הוספת סיכום למחברת','Add summary to notebook'],['סיכום','Summary'],['אין עדיין סיכומים להוספה.','No summaries to add yet.'],['הוספה למחברת','Add to notebook'],
['בסיכום הזה אין תוכן להוספה.','This summary has no content to add.'],['המחברת לא נמצאה.','Notebook not found.'],['הסיכום לא נמצא.','Summary not found.'],['לכל המחברות','All notebooks'],
['המחברת פתוחה. הוסיפי את הדף הראשון.','The notebook is open. Add the first page.'],['ה-PDF נוצר במכשיר ✓','PDF created on device ✓'],
['האחסון בפרופיל מלא. קצרי טקסט או מחקי דפים שאינם נחוצים.','Profile storage is full. Shorten text or delete unneeded pages.'],
['המחברת השתנתה במכשיר אחר. פתחי אותה שוב לפני שמירה.','The notebook changed on another device. Reopen it before saving.'],
['הקובץ גדול מדי. עד 25 MB.','File too large. Up to 25 MB.'],['לא ניתן לטעון את קורא ה-PDF. בדקי חיבור ונסי שוב.',"Couldn't load the PDF reader. Check the connection and try again."],
['ב-PDF הזה אין טקסט שאפשר לקרוא (כנראה סרוק). צלמי את הדפים דרך "צילום דף".','This PDF has no readable text (probably scanned). Photograph the pages via "Photo page".'],
// board photo to PDF
['צילום לוח ל-PDF · ניסיון','Board photo to PDF · attempt'],
['בחרי צילום של לוח בלבד, ללא אנשים או פרטים אישיים. לאחר הזיהוי תוכלי לתקן את הטקסט. עד 10 ניסיונות ביום לפרופיל, ובכפוף למכסה המשותפת. לא מופעל חיוב אוטומטי.','Choose a photo of a board only, without people or personal details. After recognition you can fix the text. Up to 10 attempts a day per profile, subject to the shared quota. No automatic charge.'],
['צילום במצלמה','Take a photo'],['או בחירה מהתמונות','Or choose from photos'],['סיבוב 90°','Rotate 90°'],
['חיתוך מלמעלה','Crop top'],['חיתוך מלמטה','Crop bottom'],['חיתוך מימין','Crop right'],['חיתוך משמאל','Crop left'],
['אני מאשרת לשלוח את התמונה המוצגת לעיבוד טקסט זמני ב-Cloudflare','I approve sending the shown image for temporary text processing at Cloudflare'],
['זיהוי הטקסט','Recognize text'],['בדיקה ועריכת הטקסט','Review and edit the text'],
['זיהוי כתב יד עלול לטעות, במיוחד בעברית ובנוסחאות. תקני לפי הצילום לפני שמירה. חלקים לא קריאים מסומנים [לא ברור].','Handwriting recognition can make mistakes, especially in Hebrew and formulas. Correct it against the photo before saving. Unclear parts are marked [unclear].'],
['שם הסיכום','Summary name'],['הטקסט שזוהה','Recognized text'],['בדקתי ותיקנתי את הטקסט לפי הצילום','I checked and corrected the text against the photo'],
['רק הטקסט נשמר בפרופיל. הצילום נשלח לעיבוד זמני ב-Cloudflare ולא נשמר באפליקציה. PDF נוצר במכשיר, כתמונת טקסט קריאה שאינה ניתנת לחיפוש.','Only the text is saved in the profile. The photo is sent for temporary processing at Cloudflare and is not stored in the app. The PDF is generated on the device, as a readable text image that is not searchable.'],
['שמירת סיכום','Save summary'],['הורדת PDF','Download PDF'],['מלאי שם, מקצוע וטקסט.','Fill in name, subject and text.'],
['סמני שהטקסט נבדק ותוקן לפני שמירה או PDF.','Check that the text was reviewed and corrected before saving or PDF.'],
['שומר…','Saving…'],['נשמר כדף במחברת ✓','Saved as a notebook page ✓'],['נשמר בפרופיל. אפשר להוריד PDF או לפתוח דרך הסיכומים.','Saved to the profile. You can download a PDF or open it via Summaries.'],
['מכין PDF…','Preparing PDF…'],['ה-PDF נוצר במכשיר. באייפון אפשר לשמור לקבצים דרך כפתור השיתוף.','PDF created on device. On iPhone you can save to Files via the share button.'],
['לא ניתן ליצור PDF כרגע.',"Can't create a PDF right now."],['אשרי שליחה לעיבוד זמני לפני הזיהוי.','Approve sending for temporary processing before recognition.'],
['התמונה גדולה מדי לאחר העיבוד. חתכי את הלוח או בחרי תמונה קטנה יותר.','The image is too large after processing. Crop the board or choose a smaller image.'],
['מזהה את הטקסט… השאירי את המסך פתוח.','Recognizing text… keep the screen open.'],
['הזיהוי בשימוש כרגע. נסי שוב בעוד שתי דקות.','Recognition is busy right now. Try again in two minutes.'],['מכסת הזיהוי להיום הסתיימה. נסי שוב מחר.',"Today's recognition quota is over. Try again tomorrow."],
['הזיהוי עדיין לא הופעל. אפשר לחזור ולנסות בהמשך.',"Recognition isn't enabled yet. Come back and try later."],['הזיהוי לא הצליח. בדקי את התמונה ונסי שוב מאוחר יותר.','Recognition failed. Check the image and try again later.'],
['הזיהוי לקח יותר מדי זמן. התמונה לא נשמרה; אפשר לנסות שוב מאוחר יותר.','Recognition took too long. The image was not saved; you can try again later.'],
['בחרי תמונה בגודל עד 25 MB. באייפון אפשר לנסות צילום מסך של התמונה.','Choose an image up to 25 MB. On iPhone you can try a screenshot of the photo.'],
['התמונה מוכנה. אפשר לסובב ולחתוך לפני השליחה.','The image is ready. You can rotate and crop before sending.'],['התמונה לא נפתחה. נסי JPEG/PNG או צילום מסך.',"The image couldn't open. Try JPEG/PNG or a screenshot."],
['הוסיפי מקצועות לפני יצירת סיכום.','Add subjects before creating a summary.'],
['צילום הלוח לבדיקה','Board photo for review'],['תצוגה מקדימה של הלוח','Board preview'],['סיכום מהלוח','Board summary'],
['שם מלא','Full name'],
['חיפוש לפי שם מלא מדויק, רק מי שבחר להיות ניתן לחיפוש.','Search is by exact full name, and only people who chose to be searchable.'],
['הכניסי שם מלא - שם פרטי ושם משפחה.','Enter a full name - first and last name.'],
];
const SUBSTR=[
['השם נבחר על ידי המשתמשת ואינו מאומת. הקוד אחרי # הוא מזהה ציבורי, אפשר להשוות אותו מחוץ לאפליקציה כדי לוודא שזה האדם הנכון.',"The name is chosen by the user and is not verified. The code after # is a public identifier; compare it outside the app to make sure it's the right person."],
['רק שם וקוד ציבורי נחשפים בחיפוש. אחרי שחבר מאשר, הוא יכול לראות רק שמות של מחברות וסיכומים, לא תוכן. תוכן עובר רק אחרי אישור על כל פריט, והעותק נשאר אצל מי שקיבלה גם אם מסירים חבר.','Only a name and public code are exposed in search. After a friend approves, they can only see notebook and summary titles, not content. Content is shared only after approval per item, and the copy stays with the recipient even if a friend is removed.'],
['החיפוש הוא לפי שם מלא מדויק, ורק אנשים שבחרו להיות ניתנים לחיפוש.','Search is by exact full name, and only people who chose to be searchable.'],
['הקוד הציבורי שלך:','Your public code:'],
['הניהול מציג שם, תאריך הצטרפות ומצב חסימה בלבד - התוכן של כל משתמש נשאר פרטי.',"Admin shows name, join date and block status only - every user's content stays private."],
];
const DICT=new Map(D);
function translateString(s){
  if(!s||!/[א-ת]/.test(s))return s;
  const lead=(s.match(/^\s*/)||[''])[0], trail=(s.match(/\s*$/)||[''])[0];
  const core=s.trim();
  let out;
  if(DICT.has(core)){out=DICT.get(core);}
  else{
    out=core;
    for(const [he,en] of SUBSTR)out=out.split(he).join(en);
    out=out.replace(new RegExp('^עודכן (\\d{1,2}) ב('+MO_RE+')$'),(m,d,mo)=>'Updated '+MONTHS[mo]+' '+d);
    out=out.replace(/יום ([א-ת])׳/g,(m,g)=>WD[g]||m);
    out=out.replace(/^([א-ת])׳$/,(m,g)=>WD[g]||m);
    out=out.replace(new RegExp('(\\d{1,2}) ב('+MO_RE+')','g'),(m,d,mo)=>MONTHS[mo]+' '+d);
    out=out.replace(new RegExp('^(\\d{1,2}) ('+MO_RE+')( \\d{4})?$'),(m,d,mo,y)=>MONTHS[mo]+' '+d+(y||''));
    out=out.replace(new RegExp('^('+MO_RE+')( \\d{4})$'),(m,mo,y)=>MONTHS[mo]+y);
    out=out.replace(/עוד (\d+) ימים/g,'$1 days left');
    out=out.replace(/^(\d+) סיכומים$/,'$1 summaries');
    out=out.replace(/^(\d+) מחברות$/,'$1 notebooks');
    out=out.replace(/(\d+) דפים/g,'$1 pages');
    out=out.replace(/^למדת (\d+) מתוך (\d+) סיכומים · (\d+)%$/,'$1 of $2 summaries studied · $3%');
    out=out.replace(/^השיא שלך: (\d+)$/,'Best: $1');
    out=out.replace(/^לא נמצאו תוצאות ל״(.*)״$/,'No results for "$1"');
    out=out.replace(/^דף (\d+)$/,'Page $1');
    out=out.replace(/^(\d+) דפים נוספו מה-PDF$/,'$1 pages added from the PDF');
    out=out.replace(/^הזזת דף (\d+) למעלה$/,'Move page $1 up');
    out=out.replace(/^הזזת דף (\d+) למטה$/,'Move page $1 down');
    out=out.replace(/^הצטרפה: (.+)$/,'Joined: $1');
    out=out.replace(/^מאת (.+)$/,'From $1');
    out=out.replace(/^(\d+) פרופילים רשומים\./,'$1 registered profiles.');
    if(out===core)return s;
  }
  return lead+out+trail;
}
// Elements whose text is user content - never translated, even on a dictionary match.
const SKIP='.summary-name,.summary-note,.subject-name,.exam-name,.subj-exam-name,.sprint-name,.next-name,.month-exam,.exam-chip,.notebook-cover strong,.notebook-paper,.nb-page-title,.last-nb-text strong,.owner-meta strong,.fr-tag,input,textarea,script,style';
function translateNode(node){
  if(node.nodeType===3){const v=translateString(node.nodeValue);if(v!==node.nodeValue)node.nodeValue=v;return;}
  if(node.nodeType!==1)return;
  for(const attr of ['placeholder','aria-label','title','alt']){
    const v=node.getAttribute&&node.getAttribute(attr);
    if(v&&/[א-ת]/.test(v)){const t=translateString(v);if(t!==v)node.setAttribute(attr,t);}
  }
  if(node.matches(SKIP))return;
  for(const child of node.childNodes)translateNode(child);
}
function translateTree(root){
  translateNode(root);
  root.querySelectorAll&&root.querySelectorAll('.exam-pill,.owner-meta .fr-tag').forEach(translateNode);
}
function lang(){try{return localStorage.getItem(KEY)||'he';}catch(e){return 'he';}}
function apply(){
  const l=lang();
  document.documentElement.lang=l;
  document.documentElement.dir=l==='en'?'ltr':'rtl';
  if(l==='en')translateTree(document.body);
}
window.setAppLanguage=l=>{
  const cur=lang();
  try{localStorage.setItem(KEY,l);}catch(e){}
  if(l===cur){apply();window.renderLanguagePicker();return;}
  location.reload();
};
window.renderLanguagePicker=()=>{
  const box=document.getElementById('language-picker');if(!box)return;
  const cur=lang();
  box.innerHTML=`<div class="theme-options"><button class="theme-option" data-lang-choice="he" aria-pressed="${cur==='he'}">עברית</button><button class="theme-option" data-lang-choice="en" aria-pressed="${cur==='en'}">English</button></div>`;
  box.querySelectorAll('[data-lang-choice]').forEach(b=>b.addEventListener('click',()=>window.setAppLanguage(b.dataset.langChoice)));
};
// Browser-native dialogs follow the device language; translate the app's known messages.
const _confirm=window.confirm.bind(window), _alert=window.alert.bind(window);
window.confirm=m=>_confirm(lang()==='en'?translateString(String(m)):m);
window.alert=m=>_alert(lang()==='en'?translateString(String(m)):m);
let scheduled=false;
new MutationObserver(()=>{
  if(scheduled)return;scheduled=true;
  queueMicrotask(()=>{scheduled=false;if(lang()==='en')translateTree(document.body);});
}).observe(document.body,{childList:true,subtree:true,characterData:true});
window.scI18n={translate:translateString,lang};
apply();
})();
