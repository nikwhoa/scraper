import axios from 'axios';
import * as cheerio from 'cheerio';
import { join, dirname, resolve } from 'path';
import { Low, JSONFile } from 'lowdb';
import { fileURLToPath } from 'url';
import getNewsUrls from './components/getUrls.js';
import changeUrls from './components/changeUrls.js';
import convert from 'xml-js';
import fs from 'fs';

// create and connect to database
const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, './dataBase/washingtonpost.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);
await db.read();

export let gettingNews = new Promise((resolve, reject) => {
    const data = getNewsUrls(
        'https://www.washingtonpost.com/politics/',
        '.story-headline.pr-sm > a'
    );
    resolve(data);
})
    .then(async (data) => {
        let newNews = [];

        for (const item of data) {
            const { data } = await axios.get(item);
            const $ = cheerio.load(data);
            const titleNews = $('h1 > span').text();
            const image = $('article img').attr('srcset'); // todo: check what to pass

            // todo: remove elements here
            $('.dn-ns').remove();
            $('.db-ns').remove();
            $('iframe').remove();
            $('.hide-for-print').remove();
            $('span a:contains("Sign up")').remove();

            const description = $('.grid-body')
                .find('.article-body')
                .toArray()
                .map((item) => $(item).html())
                .map((item) => item.replace(/"/g, "'"))
                .join('');

            // const formatHtml = (html) => {
            //     let data = html.replace(
            //         /class='featured featured-video video-ct'|data-v-13907676=''|/g,
            //         ''
            //     );
            //     return data;
            // };

            if (titleNews.length > 0 && description.length > 0) {
                newNews.push({
                    title: titleNews,
                    link: item,
                    pubDate: new Date(),
                    category: 'Washington Post Politics',
                    description: description,
                });
            }
        }

        return newNews;
    })
    .then(async (data) => {
        let { item } = db.data;

        if (item.length <= 0) {
            item.push(...data);
            await db.write();
        } else {
            data.forEach((items) => {
                if (!item.find((news) => news.title === items.title)) {
                    item.push(items);
                }
            });
            await db.write();
        }

        return item;
    })
    .then(() => {
        let xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"
        xmlns:content="http://purl.org/rss/1.0/modules/content/"
        xmlns:wfw="http://wellformedweb.org/CommentAPI/"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:atom="http://www.w3.org/2005/Atom"
        xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
        xmlns:slash="http://purl.org/rss/1.0/modules/slash/"
        >
    <channel>
        <title>FOX NEWS US</title>
        <lastBuildDate>${new Date()}</lastBuildDate>`;

        let json = fs.readFileSync(
            // './home/godzillanewz/nodejsapp/dataBase/db.json',
            './dataBase/washingtonpost.json',
            'utf8'
        );

        // let json = data
        let options = {
            compact: true,
            ignoreComment: false,
            ignoreText: false,
            spaces: 4,
            indentAttributes: true,
            indentCdata: true,
        };

        let result = convert.json2xml(json, options);

        fs.writeFile(
            './washingtonpost-rss.xml',
            xml + result + '</channel></rss>',
            (err) => {
                if (err) throw err;
                console.log('Saved!');
            }
        );

        return result;
    });
