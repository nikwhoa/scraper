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
                    content: formatHtml(html)
                });
            }
        }

        return newNews;
    })
    .then(async (data) => {

        console.log(data);

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
    })
    .then(() => {
        const data = db.data.news;
        let xml = `
        <?xml version="1.0" encoding="UTF-8"?><rss version="2.0"
	    xmlns:content="http://purl.org/rss/1.0/modules/content/"
        xmlns:wfw="http://wellformedweb.org/CommentAPI/"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:atom="http://www.w3.org/2005/Atom"
        xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
        xmlns:slash="http://purl.org/rss/1.0/modules/slash/"
        >
        <channel>
        <title>Business Matters</title>
        <atom:link href="https://bmmagazine.co.uk/feed/" rel="self" type="application/rss+xml" />
        <link>https://bmmagazine.co.uk</link>
        <description>UK&#039;s leading SME business magazine</description>
        <lastBuildDate>Tue, 24 May 2022 13:20:10 +0000</lastBuildDate>
        <language>en-GB</language>
        <sy:updatePeriod>hourly</sy:updatePeriod>
        <sy:updateFrequency>1</sy:updateFrequency>
        <generator>https://wordpress.org/?v=5.9.3</generator>
        `;
        let json = fs.readFileSync('./dataBase/db.json', 'utf8');
        let options = {
            compact: true,
            ignoreComment: true,
            spaces: 4,
        };
        let result = convert.json2xml(json, options);
        fs.writeFile('./dataBase/rss.xml', xml+result+'</chanel></rss>', (err) => {
            if (err) throw err;
            console.log('Saved!');
        });
    })
    .then(() => console.log('done'));
