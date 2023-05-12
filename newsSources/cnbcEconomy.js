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
import ZabbixSender from 'node-zabbix-sender';
let Sender = new ZabbixSender({host: '127.0.0.1'});

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

                if (item.title === '' || item.title === ' ') {
                    continue;
                }

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

        const prevQuantityPosts = item.length;
        let quantityNewPosts = 0;

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
            quantityNewPosts += (item.length - prevQuantityPosts);
        }
        // remove news if it is more than 100
        for (let i = 0; i < item.length; i += 1) {
            if (i > 100) {
                item.splice(i);
            }
        }

        await dataBase.write();
        return quantityNewPosts;
    })
    .then(async (quantity) => {
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
            '/var/www/html/cnbcEconomy.xml',
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
                Sender.addItem('Zabbix server', 'cnbcEconomy', quantity);
        Sender.send(function(err, res) {
                 if (err) {
                        throw err;
        }

        // print the response object
        //console.dir(res);
        });
        //console.log('New posts:', quantity);
            },
        );
    })
    .catch((err) => {
        throw err;
    });
