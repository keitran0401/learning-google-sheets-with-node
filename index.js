const express = require('express');
const { google } = require('googleapis');
const Inflector = require('inflected');

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
  const { request, name } = req.body;

  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  });

  // Create client instance for auth
  const client = await auth.getClient();

  // Instance of Google Sheets API
  const googleSheets = google.sheets({ version: 'v4', auth: client });

  const spreadsheetId = '18y89DQclnrSdpGO8YWN398K7d0Gbgd36xN_h4ks-Ir8';

  // Get metadata about spreadsheet
  const metaData = await googleSheets.spreadsheets.get({
    auth,
    spreadsheetId,
  });

  // Read rows from spreadsheet
  const getKeyRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: 'Sheet1!C2:C',
  });

  const getValueRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: 'Sheet1!D2:D',
  });

  // Write row(s) to spreadsheet
  // await googleSheets.spreadsheets.values.append({
  //   auth,
  //   spreadsheetId,
  //   range: 'Sheet1!A:B',
  //   valueInputOption: 'USER_ENTERED',
  //   resource: {
  //     values: [[request, name]],
  //   },
  // });

  // Process information based on Variable Hub needs
  const obj = {};
  getKeyRows.data.values
    .flat()
    .filter((value) => value[0])
    .map((value) => Inflector.camelize(value, false))
    .map((data, index) => {
      const key = data
        .split('.')
        .map((d, idx) =>
          idx === 0 ? d : d.charAt(0).toUpperCase() + d.slice(1)
        )
        .join('');

      const newData = data
        .split('.')
        .map((d) => d.charAt(0).toLowerCase() + d.slice(1))
        .join('.');

      const value = getValueRows.data.values
        .flat()
        .filter((value) => value[0])
        .map((d) => d.replace(/[^\w\s\{}]/gi, ''));

      obj[key] = {
        id: newData,
        defaultMessage: value[index],
      };
    });

  res.send(obj);
});

app.listen(1337, (req, res) => console.log('running on 1337'));
