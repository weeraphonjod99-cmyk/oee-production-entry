# OEE Production Entry

เว็บแอพสำหรับกรอกยอดผลิตจาก master data ใน `OEE-2026.xlsx`

## Run local

อย่าเปิด `index.html` ตรง ๆ แบบ `file://` เพราะ React/Vite จะถูก browser บล็อก CORS แล้วหน้าขาว

วิธีง่ายสุด: ดับเบิลคลิก `start-oee-app.cmd`

```powershell
pnpm install
pnpm dev
```

แล้วเปิด `http://127.0.0.1:5173/`

## Google Sheet

Copy `google-sheet/Code.gs` ไปใส่ใน Apps Script ของ Google Sheet แล้ว deploy เป็น Web app จากนั้นสร้าง `.env.local`

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/xxxx/exec
```

ถ้าไม่ได้ใส่ URL แอพจะเก็บรายการทดลองไว้ใน browser localStorage ก่อน

## Deploy GitHub Pages

Push repo นี้ขึ้น GitHub แล้วตั้ง Pages source เป็น branch `main` และ folder `/docs`

ถ้า GitHub CLI OAuth authorize ไม่ผ่าน ให้ใช้ token:

```powershell
powershell -ExecutionPolicy Bypass -File .\github-token-login.ps1
powershell -ExecutionPolicy Bypass -File .\deploy-github.ps1
```
