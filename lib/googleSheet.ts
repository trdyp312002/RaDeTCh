import { google } from 'googleapis';

const SPREADSHEET_ID = '1vwadh4N5OkJvaiu2oCqsHxg5u85rSGEC7PqD41AM0r0';
const KEY_FILE = "C:/Users/trdyp/OneDrive/Desktop/MYWORLD/Projects/11_Google_Sheet_Asset/key.json";

export async function getFinanceData() {
  let auth;
  
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  } else {
    auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  }

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
