import axios from 'axios';
import * as cheerio from 'cheerio';
import { join, dirname, resolve } from 'path';
import { Low, JSONFile } from 'lowdb';
import { fileURLToPath } from 'url';
import getNewsUrls from './components/getUrls.js';
import changeUrls from './components/changeUrls.js';
import toXML from 'jstoxml';

// create and connect to database
const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, './dataBase/db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);
await db.read();

let gettingNews = new Promise((resolve, reject) => {
    const data = getNewsUrls(
        'https://www.foxnews.com/us',
        '.collection.collection-article-list > div.content.article-list > article.article > div.m > a'
    );
    resolve(data);
})
    .then((data) => {
        return changeUrls(data);
    })
    .then(async (data) => {
        let newNews = [];

        for (const item of data) {
            const { data } = await axios.get(item);
            const $ = cheerio.load(data);
            const titleNews = $('.headline').text();
            const subTitle = $('.sub-headline').text();
            // const image = $('.m');

            $('.control').remove();
            $('.featured-video').remove();
            $('.speechkit-wrapper').remove();
            $('.ad-container').remove();
            $('.contain').remove();
            $('p:contains("CLICK HERE TO GET THE FOX NEWS APP")').remove();

            const content = $('.article-body').html();
            const html = content != null ? content.replace(/"/g, "'") : '';

            const formatHtml = (html) => {
                let data = html.replace(
                    /class='featured featured-video video-ct'|data-v-13907676=''|/g,
                    ''
                );
                return data;
            };

            if (titleNews.length > 0 && subTitle.length > 0) {
                newNews.push({
                    title: titleNews,
                    subTitle: subTitle,
                    content: formatHtml(html),
                });
            }
        }

        return newNews;
    })
    .then(async (data) => {
        let { news } = db.data;

        if (news.length <= 0) {
            news.push(...data);
            await db.write();
        } else {
            data.forEach((item) => {
                if (!news.find((news) => news.title === item.title)) {
                    news.push(item);
                }
            });
            await db.write();
        }
    })
    .then(() => console.log('done'));
