import { Low, JSONFile } from 'lowdb';
import fs from 'fs';
import connectDatabase from '../connectDatabase.js';

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

const foolInvestingNews  = connectDatabase('foolInvestingNews.json').then(
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
    const cnbcEconomyResult = await cnbcEconomy;
    const investingNewsResult = await investingNews;
    const foolInvestingNewsResult = await foolInvestingNews;

    const output = {
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