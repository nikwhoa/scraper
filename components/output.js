/* eslint-disable arrow-body-style */
import { Low, JSONFile } from 'lowdb';
import fs from 'fs';
import connectDatabase from '../connectDatabase.js';

const generateOutput = async (filename) => {
  const result = connectDatabase(filename).then(async (data) => {
    const adapter = new JSONFile(data);
    const db = new Low(adapter);
    await db.read();
    const { item } = db.data;

    const output = item.map((item) => {
      return `${item.title} <br><b>${item.pubDate}</b>`;
    });

    return output;
  });

  return result;
};

const writeOutput = async () => {
  const geekwireResult = await generateOutput('geekwire.json');
  const nbcBusinessResult = await generateOutput('nbcBusiness.json');
  const foxnewsResult = await generateOutput('foxNews.json');
  const cryptonewsResult = await generateOutput('cryptonews.json');
  const washingtonpostResult = await generateOutput('washingtonpost.json');
  const usaTodaySportsResult = await generateOutput('usatodaySport.json');
  const cnnWorldResult = await generateOutput('cnnWorld.json');
  const cnbcEconomyResult = await generateOutput('cnbcEconomy.json');
  const investingNewsResult = await generateOutput('investingNews.json');
  const foolInvestingNewsResult = await generateOutput(
    'foolInvestingNews.json',
  );

  const output = {
    geekwire: geekwireResult,
    nbcBusiness: nbcBusinessResult,
    foxnews: foxnewsResult,
    cryptonews: cryptonewsResult,
    washingtonpost: washingtonpostResult,
    usaTodaySports: usaTodaySportsResult,
    cnnWorld: cnnWorldResult,
    cnbcEconomy: cnbcEconomyResult,
    investingNews: investingNewsResult,
    foolInvestingNews: foolInvestingNewsResult,
  };

  fs.writeFile(
    '/home/godzillanewz/public_html/parseroutput.json',
    JSON.stringify(output),
    (err) => {
      if (err) throw err;
      console.log('The parseroutput.json has been saved!');
    },
  );
};

writeOutput();
