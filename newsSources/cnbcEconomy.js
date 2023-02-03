/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable import/extensions */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Low, JSONFile } from 'lowdb';
import fs from 'fs';
import convert from 'xml-js';
import connectDatabase from '../connectDatabase.js';
import baseXML from '../components/baseXML.js';

let pathToDataBase = '';
const db = connectDatabase('cnbcEconomy.json').then((path) => {
    pathToDataBase = path;
});

const getNews = new Promise((resolve, reject) => {
    const news = [];

    axios
        .get('https://www.cnbc.com/economy/')
        .then((response) => {
            const $ = cheerio.load(response.data);
            const article = $('.Card-rectangleToLeftSquareMedia');

            article.filter((i, el) => {
                news.push({
                    link: $(el).find('a').attr('href'),
                    image: $(el).find('img').attr('src'),
                    title: $(el).find('a.Card-title').text(),
                    pubDate: new Date().toString(),
                });
            });
        })
        .then(() => {
            resolve(news);
        })
        .catch((error) => {
            throw error;
        });
})
    .then(async (data) => {
        for (const item of data) {
            if (item.link !== undefined) {

                const { data } = await axios.get(item.link);
                const $ = cheerio.load(data);
                $('a').contents().unwrap();
                $('.HighlightShare-hidden').remove();
                $('.InlineImage-imageEmbed').remove();
                $('.ExclusiveContentBucket-exclusiveContentBucket').remove();
                $('.transition-fade-appear-done').remove();
                $('.PlaceHolder-wrapper').remove();
                $('.RelatedContent-relatedContent').remove();
                const html = $('.ArticleBody-articleBody').html();

                item.description = `<img src='${item.image}' />${html.replace(
                    /"/g,
                    "'",
                )}<br><div>This post appeared first on CNBC</div>`;
            }
        }
        return data;
    })
    .then(async (data) => {

        const adapter = new JSONFile(pathToDataBase);
        const dataBase = new Low(adapter);
        await dataBase.read();
        const { item } = dataBase.data;
        data.forEach((el) => delete el.image);
        if (item.length <= 0) {
            // add new news if there is no news in database
            item.unshift(...data);
            await dataBase.write();
        } else {
            data.filter((news) =>
                !item.map((el) => el.title).includes(news.title)
                    ? item.unshift(news)
                    : null,
            );
        }
        // remove news if it is more than 100
        for (let i = 0; i < item.length; i += 1) {
            if (i > 100) {
                item.splice(i);
            }
        }

        await dataBase.write();
    })
    .then(async () => {
        const xml = baseXML(
            'https://www.cnbc.com/economy/',
            'CNBC Economy',
            'Get the latest news from CNBC',
        );
        const jsonNews = fs.readFileSync(pathToDataBase, 'utf8');

        const xmlNews = convert.json2xml(jsonNews, {
            compact: true,
            ignoreComment: false,
            ignoreText: false,
            spaces: 4,
            indentAttributes: true,
            indentCdata: true,
        });

        fs.writeFile(
            // change it before sending to server
            '/home/godzillanewz/public_html/cnbcEconomy.xml',
            // './xml/cnbcEconomy.xml',
            xml + xmlNews + '</channel></rss>',
            (err) => {
                if (err) throw err;
                console.log(
                    `The file has been saved! ${new Date().toLocaleDateString(
                        'en-uk',
                        {
                            // weekday: 'long',
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        },
                    )}`,
                );
            },
        );
    })
    .catch((err) => {
        throw err;
    });
