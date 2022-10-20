/* eslint-disable prefer-template */
/* eslint-disable no-restricted-syntax */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { join, dirname } from 'path';
import { Low, JSONFile } from 'lowdb';
import { fileURLToPath } from 'url';
import convert from 'xml-js';
import fs from 'fs';
import baseXML from './components/baseXML.js';
import getNewsUrls from './components/getUrls.js';
import generateDate from './components/generateDate.js';

// create and connect to database
const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, './dataBase/foxnews.json'); // path to database
const adapter = new JSONFile(file);
const db = new Low(adapter);
await db.read();

// if database is empty, create base for it
if (!db.data) {
    db.data = {
        item: [],
    };
    await db.write();
}

const gettingNews = new Promise((resolve, reject) => {
    const data = getNewsUrls(
        'https://www.foxnews.com/politics',
        '.collection.collection-article-list > div.content.article-list > article.article > div.m > a',
    );
    resolve(data);
})
    .then((data) => {
        let changedUrls = [];

        data.forEach((el) => {
            if (el[0] === '/') {
                changedUrls.push('https://www.foxnews.com' + el);
                changedUrls.push('https://www.foxnews.com/politics/panel-approves-time-extension-alaska-campaign-complaint');
            } else if (el.includes('video') || el.includes('media')) {
                return null;
            } else {
                changedUrls.push(el);
            }
        });

        return changedUrls;
    })
    .then(async (data) => {
        let newNews = [];

        // get news from urls
        for (const item of data) {
            const { data } = await axios.get(item);
            const $ = cheerio.load(data);
            const titleNews = $('.headline').text();
            const subTitle = $('.sub-headline').text();

            $('p:contains("CLICK HERE TO GET THE FOX NEWS APP")').remove();
            $('p:contains("CLICK HERE FOR THE FOX NEWS APP")').remove();
            $('p:contains("CLICK HERE TO DOWNLOAD THE FOX NEWS APP")').remove();
            $('p:contains("CLICK TO")').remove();
            $('.control').remove();

            $('p:has(a)')
                .filter(function () {
                    return $(this).contents().length === 1;
                })
                .children('a')
                .remove();

            $('a').contents().unwrap();

            $('.featured-video').remove();
            $('.speechkit-wrapper').remove();
            $('.ad-container').remove();
            $('.caption').remove();
            $('.contain').remove();
            $('.featured-image').remove();

            const content = $('.article-body').html();

            const html = content != null ? content.replace(/"/g, "'") : '';

            const formatHtml = (html) => {
                let data = html.replace(
                    /class='featured featured-video video-ct'|data-v-13907676=''|/g,
                    '',
                );
                return data;
            };
            // create object with news
            if (titleNews.length > 0 && subTitle.length > 0) {
                newNews.push({
                    title: titleNews,
                    link: item,
                    pubDate: generateDate(),
                    category: 'Rss Test',
                    description:
                        formatHtml(html) +
                        '<div>This post appeared first on FOX NEWS</div>',
                    // "content:encoded": `<![CDATA[${formatHtml(html)}]]>`,
                });
            }
        }
        return newNews;
    })
    .then(async (data) => {
        let { item } = db.data;

        if (item.length <= 0) {
            // add new news if there is no news in database
            item.unshift(...data);
            await db.write();
        } else {
            data.filter((news) => {
                // if news is not in database then add it
                if (!item.map((el) => el.title).includes(news.title)) {
                    item.unshift(news);
                }
            });
        }
        // remove news if it is more than 100
        for (let i = 0; i < item.length; i++) {
            if (i > 100) {
                item.splice(i);
            }
        }

        await db.write();

        return item;
    })
    .then((data) => {
        const xml = baseXML(
            'https://www.foxnews.com/us',
            'FOX NEWS US',
            'Get the latest news from FOX NEWS US',
        );
        // change it before sending to server
        // const jsonNews = fs.readFileSync('./dataBase/foxnews.json', 'utf8');
        const jsonNews = fs.readFileSync('dataBase/foxnews.json', 'utf8');
        // const jsonNews = fs.readFileSync(
        //     '/home/godzillanewz/nodejsapp/dataBase/foxnews.json',
        //     'utf8',
        // );

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
            // '/home/godzillanewz/public_html/foxnews.xml',
            './foxnews.xml',
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
    });
