import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID ?? '1vwadh4N5OkJvaiu2oCqsHxg5u85rSGEC7PqD41AM0r0';

export async function getFinanceData() {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY env vars');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  
  const sheetNames = [
    "Long-term",
    "Short-term",
    "BTC transaction",
    "Store of Wealth",
    "Personal Financial Statement"
  ];
  
  const result: Record<string, string[][]> = {};
  
  for (const sheetName of sheetNames) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: sheetName,
      });
      result[sheetName] = response.data.values || [];
    } catch (e) {
      console.error(`Failed to fetch sheet ${sheetName}:`, e);
      result[sheetName] = [];
    }
  }
  
  return result;
}
