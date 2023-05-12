/* eslint-disable no-restricted-syntax */
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import {join, dirname, resolve} from 'path';
import {Low, JSONFile} from 'lowdb';
import {fileURLToPath} from 'url';
import getNewsUrls from './components/getUrls.js';
import convert from 'xml-js';
import fs from 'fs';
import baseXML from './components/baseXML.js';
// create and connect to database
const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, './dataBase/washingtonpost.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);
await db.read();

dotenv.config();

// if database is empty, create base for it
if (!db.data) {
    db.data = {
        item: [],
    };
    await db.write();
}

const gettingNews = new Promise((resolve, reject) => {
    const data = getNewsUrls(
        'https://www.washingtonpost.com/politics/',
        '.story-headline.pr-sm > a'
    );
    resolve(data);
})
    .then(async (data) => {
        let newNews = [];

        for (const item of data) {
            const {data} = await axios.get(item);
            const $ = cheerio.load(data);
            const titleNews = $('h1 > span').text();
            const image = $('article img').attr('srcset'); // todo: check what to pass


            // todo: remove elements here
            $('.dn-ns').remove();
            $('.db-ns').remove();
            $('iframe').remove();
            $('a').contents().unwrap();
            $('.hide-for-print').remove();
            $('.pb-sm.pt-lgmod').remove();
            $('span a:contains("Sign up")').remove();

            const description = $('.grid-body')
                .find('.article-body')
                .toArray()
                .map((item) => $(item).html())
                .map((item) => item.replace(/"/g, "'"))
                .join('');


            if (titleNews.length > 0 && description.length > 0 && image !== undefined) {
                let aaa = image.replace(/ /g, '')
                let b = ''
                for (let i = 0; i < aaa.length; i++) {
                    if (aaa[i] == '&') {
                        // console.log(image.slice(0, i));
                        b = aaa.slice(0, i)
                    }
                }


                newNews.push({
                    title: titleNews,
                    link: item,
                    pubDate: new Date(),
                    category: 'Washington Post Politics',
                    description: `<img style='max-width: 800px;' src='${b}' />${description}<br><div>This post appeared first on The Washington Post</div>`,
                });
            }
        }

        return newNews;
    })
    .then(async (data) => {
        let {item} = db.data;

        if (item.length <= 0) {
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

        for (let i = 0; i < item.length; i++) {
            if (i > 100) {
                item.splice(i);
            }
        }

        await db.write();

        return item;
    })
    .then(() => {

        const xml = baseXML(
            'https://www.washingtonpost.com/politics/',
            'Washingtonpost politics',
            'Get the latest news from washingtonpost'
        );

        // const jsonNews = fs.readFileSync('./dataBase/washingtonpost.json', 'utf8');
        const jsonNews = fs.readFileSync('/var/www/html/nodejsapp/dataBase/washingtonpost.json', 'utf8');

        const xmlNews = convert.json2xml(jsonNews, {
            compact: true,
            ignoreComment: false,
            ignoreText: false,
            spaces: 4,
            indentAttributes: true,
            indentCdata: true,
        });

        fs.writeFile(
            `${process.env.PATHTOXML}washingtonpost.xml`,
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
            }
        );
    });
