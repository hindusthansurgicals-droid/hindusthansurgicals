CYLINDER DESK — Firebase பதிப்பு
================================

இந்த folder-இல் உள்ளவை
-----------------------
public/              ← app (index.html, fb.js, import.html, icon, manifest)
firestore.rules      ← யார் எதைப் பார்க்கலாம்/மாற்றலாம் என்ற பாதுகாப்பு விதிகள்
firestore.indexes.json
firebase.json, .firebaserc   ← project: hindustha-surgicals
data-export.json     ← பழைய Cylinder Desk தரவு (19-10-2026 வரை). இதை யாருக்கும் அனுப்ப வேண்டாம்.


முதலில் Firebase console-இல் (ஒருமுறை)
-------------------------------------
1. Authentication → Sign-in method → Google → Enable → Save
2. Firestore Database → Create database → location asia-south1 (Mumbai) → Production mode


கணினியில் deploy செய்வது (ஒருமுறை)
-----------------------------------
1. Node.js நிறுவுங்கள்: https://nodejs.org → "LTS" download → install.
2. இந்த zip-ஐ extract செய்யுங்கள். அந்த folder-ஐத் திறந்து, மேலே உள்ள
   address bar-இல் cmd என்று type செய்து Enter அழுத்துங்கள். கருப்பு window திறக்கும்.
3. அதில் இந்த மூன்று command-களையும் ஒவ்வொன்றாக type செய்யுங்கள்:

     npm install -g firebase-tools
     firebase login
     firebase deploy

   (firebase login → browser திறக்கும் → hindusthansurgicals@gmail.com கணக்கைத் தேர்ந்தெடுங்கள்.)

4. முடிந்ததும் "Hosting URL: https://hindustha-surgicals.web.app" என்று காட்டும்.


பழைய தரவை மாற்றுவது (ஒருமுறை மட்டும்)
---------------------------------------
1. https://hindustha-surgicals.web.app/import.html திறங்கள்.
2. hindusthansurgicals@gmail.com கணக்கில் Google sign-in செய்யுங்கள்.
3. "Choose file" → data-export.json → Import.
4. "Done. 12 records imported" என்று வந்தால் முடிந்தது.


தினசரி பயன்பாடு
---------------
https://hindustha-surgicals.web.app
• போனில்: Chrome-இல் திறந்து ⋮ → "Add to Home screen".
• Staff: அவர்கள் தங்கள் Google கணக்கில் sign-in செய்தால் "Waiting for the owner" என்று வரும்.
  நீங்கள் Settings-இல் அவர்களுக்கு role (Manager / Staff / Viewer) மற்றும் branch கொடுத்தவுடன்
  அவர்கள் பக்கம் தானாகத் திறக்கும்.
• Owner = hindusthansurgicals@gmail.com மற்றும் skmobilesdpi@gmail.com (firestore.rules, public/fb.js இரண்டிலும் உள்ளது).


கவனிக்க
-------
• Firebase-க்கு மாறிய பிறகு பழைய Claude Cylinder Desk-இல் entry போட வேண்டாம்.
  அங்கு போட்டவை தானாக இங்கு வராது.
• Reports → Full backup மாதம் ஒருமுறை download செய்து வைத்துக்கொள்ளுங்கள்.
• Spark (இலவச) plan: தினமும் 50,000 reads / 20,000 writes வரை இலவசம்.
  உங்கள் அளவுக்கு இது போதுமானது.
