WELCOME TO CARS WORLD — Multiplayer starter project

தேவையானவை:
1. Node.js (LTS) install செய்யவும்.
2. இந்த folder-ஐ extract செய்யவும்.
3. Terminal / Command Prompt-ல் இந்த folder-க்கு செல்லவும்.
4. npm install
5. ADMIN_PASSWORD-ஐ மாற்றவும்:
   Windows PowerShell: $env:ADMIN_PASSWORD="உங்கள்-ரகசிய-கடவுச்சொல்"
   macOS/Linux: ADMIN_PASSWORD="your-secret-password" npm start
   Windows-ல் password set செய்த பிறகு: npm start
6. Browser-ல் http://localhost:3000 திறக்கவும்.

Admin:
 /admin.html திறந்து ADMIN_PASSWORD கொடுக்கவும்.
Live player list, online count, player ID, join time, score, level, car மற்றும் position பார்க்கலாம்.

முக்கியம்:
- இது starter/demo multiplayer project; production hosting, HTTPS, persistent database,
  rate limiting, proper accounts and admin security hardening தேவை.
- players.json-ல் player profile/session counters சேமிக்கப்படும்; live online state server memory-ல்.
- Three.js CDN காரணமாக இணைய இணைப்பு தேவை.
- Player position என்பது game-world coordinates; real-world location/GPS அல்ல.
