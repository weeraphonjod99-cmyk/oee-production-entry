# Google Sheet API

1. Create a Google Sheet.
2. Import `machines.csv` and `product_master.csv` as separate tabs if you want the master data visible in Sheets.
3. Open Extensions > Apps Script.
4. Paste `Code.gs`.
5. Run `setupProductionWorkbook` once.
6. Deploy as Web app.
7. Set access to the users who will submit production data.
8. Put the Web app URL in `.env.local` as `VITE_APPS_SCRIPT_URL=...`.

The web app posts as `text/plain` so Apps Script can receive entries without a browser preflight request.
