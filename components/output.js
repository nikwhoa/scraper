/* eslint-disable arrow-body-style */
import { Low, JSONFile } from 'lowdb';
import fs from 'fs';
import connectDatabase from '../connectDatabase.js';

const foxnews = connectDatabase('foxNews.json').then(async (data) => {
  const adapterfoxnews = new JSONFile(data);
  const foxnewsDB = new Low(adapterfoxnews);
  await foxnewsDB.read();
  const { item } = foxnewsDB.data;

  const output = item.map((item) => {
    return `${item.title} <br><b>${item.pubDate}</b>`;
  });

  return output;
});

const cryptonews = connectDatabase('cryptonews.json').then(async (data) => {
  const adaptercryptonews = new JSONFile(data);
  const cryptonewsDB = new Low(adaptercryptonews);
  await cryptonewsDB.read();
  const { item } = cryptonewsDB.data;

  const output = item.map((item) => {
    return `${item.title} <br><b>${item.pubDate}</b>`;
  });

  return output;
});

const washingtonpost = connectDatabase('washingtonpost.json').then(
  async (data) => {
    const adapterwashingtonpost = new JSONFile(data);
    const washingtonpostDB = new Low(adapterwashingtonpost);
    await washingtonpostDB.read();
    const { item } = washingtonpostDB.data;

    const output = item.map((item) => {
      return `${item.title} <br><b>${item.pubDate}</b>`;
    });

    return output;
  },
);

const usaTodaySports = connectDatabase('usatodaySport.json').then(
  async (data) => {
    const adapterusaTodaySports = new JSONFile(data);
    const usaTodaySportsDB = new Low(adapterusaTodaySports);
    await usaTodaySportsDB.read();
    const { item } = usaTodaySportsDB.data;

    const output = item.map((item) => {
      return `${item.title} <br><b>${item.pubDate}</b>`;
    });

    return output;
  },
);

const cnnWorld = connectDatabase('cnnWorld.json').then(async (data) => {
  const adaptercnnWorld = new JSONFile(data);
  const cnnWorldDB = new Low(adaptercnnWorld);
  await cnnWorldDB.read();
  const { item } = cnnWorldDB.data;

  const output = item.map((item) => {
    return item.title + ' ' + '<br><b>' + item.pubDate + '</b>';
  });

  return output;
});

const cnbcEconomy = connectDatabase('cnbcEconomy.json').then(async (data) => {
  const adaptercnbcEconomy = new JSONFile(data);
  const cnbcEconomyDB = new Low(adaptercnbcEconomy);
  await cnbcEconomyDB.read();
  const { item } = cnbcEconomyDB.data;

  const output = item.map((item) => {
    return item.title + ' ' + '<br><b>' + item.pubDate + '</b>';
  });

  return output;
});

const investingNews = connectDatabase('investingNews.json').then(
  async (data) => {
    const adapterinvestingNews = new JSONFile(data);
    const investingNewsDB = new Low(adapterinvestingNews);
    await investingNewsDB.read();
    const { item } = investingNewsDB.data;

    const output = item.map((item) => {
      return item.title + ' ' + '<br><b>' + item.pubDate + '</b>';
    });

    return output;
  },
);

const foolInvestingNews = connectDatabase('foolInvestingNews.json').then(
  async (data) => {
    const adapterfoolInvestingNews = new JSONFile(data);
    const foolInvestingNewsDB = new Low(adapterfoolInvestingNews);
    await foolInvestingNewsDB.read();
    const { item } = foolInvestingNewsDB.data;

    const output = item.map((item) => {
      return item.title + ' ' + '<br><b>' + item.pubDate + '</b>';
    });

    return output;
  },
);

const writeOutput = async () => {
  const foxnewsResult = await foxnews;
  const cryptonewsResult = await cryptonews;
  const washingtonpostResult = await washingtonpost;
  const usaTodaySportsResult = await usaTodaySports;
  const cnnWorldResult = await cnnWorld;
  const cnbcEconomyResult = await cnbcEconomy;
  const investingNewsResult = await investingNews;
  const foolInvestingNewsResult = await foolInvestingNews;

  const output = {
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
