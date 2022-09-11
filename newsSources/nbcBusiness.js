/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable import/extensions */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Low, JSONFile } from 'lowdb';
import fs from 'fs';
import convert from 'xml-js';
import connectDatabase from '../components/connectDatabase.js';
import baseXML from '../components/baseXML.js';

let pathToDataBase = '';
const db = connectDatabase('nbcBusiness.json').then((path) => {
    pathToDataBase = path;
});

const getNews = new Promise((resolve, reject) => {
    const news = [];

    axios
        .get('https://www.nbcnews.com/business')
        .then((response) => {
            const $ = cheerio.load(response.data);
            const article = $('article.tease-card');

            article.filter((i, el) => {
                if (
                    $(el)
                        .find('.tease-card__title > a')
                        .attr('href')
                        .includes('business')
                ) {
                    news.push({
                        link: $(el).find('.tease-card__title > a').attr('href'),
                        image: $(el).find('img').attr('src'),
                        title: $(el).find('.tease-card__headline').text(),
                        pubDate: new Date().toString(),
                    });
                }
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
            if (item.link.includes('business')) {
                const { data } = await axios.get(item.link);
                const $ = cheerio.load(data);
                $('.recommended-intersection-ref').remove();
                $('.nl-signup-inline').remove();
                $('.ad').remove();
                $('.inline-video').remove();
                $('.inline-image').remove();
                const html = $('.article-body__content').html();

                item.description = `${html.replace(
                    /"/g,
                    "'",
                )}<br><div>This post appeared first on FOX NEWS</div>`;
            } else {
                delete data[item];
            }
        }

        return data;
    })
    .then(async (data) => {
        const adapter = new JSONFile(pathToDataBase);
        const dataBase = new Low(adapter);
        await dataBase.read();
        const { item } = dataBase.data;

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
            'https://www.nbcnews.com/business',
            'NBC Business',
            'Get the latest news from NBC Business',
        );
        // change it before sending to server
        // const jsonNews = fs.readFileSync('./dataBase/foxnews.json', 'utf8');
        // const jsonNews = fs.readFileSync('dataBase/foxnews.json', 'utf8');
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
            '/home/godzillanewz/public_html/nbcBusiness.xml',
            // './xml/nbcBusiness.xml',
            xml + xmlNews + '</channel></rss>',
            (err) => {
                if (err) throw err;
                console.log('The file has been saved!');
            },
        );
    })
    .catch((err) => {
        throw err;
    });
