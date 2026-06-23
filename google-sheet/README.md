# Google Sheet API

## Automatic deploy with clasp

Run once from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\google-sheet\push-apps-script.ps1 -Create -Deploy
```

This creates a standalone Google Apps Script project, pushes `Code.gs`, and deploys it as a web app. Google OAuth login is still required the first time because Google does not allow creating or deploying Apps Script without account consent.

After deployment, open the Apps Script web app URL with `?action=setup` once. The script will create the OEE Google Sheet database automatically and import `machines`, `product_master`, and `downtime_catalog`.

If you already have an Apps Script project:

```powershell
powershell -ExecutionPolicy Bypass -File .\google-sheet\push-apps-script.ps1 -ScriptId YOUR_SCRIPT_ID -Deploy
```

Then put the Web app URL in `.env.local`:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/xxxx/exec
```

## Manual fallback

1. Create a Google Sheet.
2. Import `machines.csv` and `product_master.csv` as separate tabs if you want the master data visible in Sheets.
3. Open Extensions > Apps Script.
4. Paste `Code.gs`.
5. Run `setupProductionWorkbook` once.
6. Deploy as Web app.
7. Set access to the users who will submit production data.
8. Put the Web app URL in `.env.local` as `VITE_APPS_SCRIPT_URL=...`.

The web app posts as `text/plain` so Apps Script can receive entries without a browser preflight request.
