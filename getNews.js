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

export let gettingNews = new Promise((resolve, reject) => {
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
            $('.caption').remove();
            $('.contain').remove();
            $('.featured-image').remove();
            $('p:contains("CLICK HERE TO GET THE FOX NEWS APP")').remove();
            $('p:contains("CLICK HERE FOR THE FOX NEWS APP")').remove();

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
                    link: item,
                    pubDate: new Date(),
                    category: 'Rss Test',
                    description: formatHtml(html),
                    // "content:encoded": `<![CDATA[${formatHtml(html)}]]>`,
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

        return item
    })
    .then(() => {
        // const data = db.data.news;

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
        <atom:link href="https://www.foxnews.com/us" rel="self" type="application/rss+xml" />
        <link>https://www.foxnews.com/us</link>
        <description>Where Hope Finally Made a Comeback</description>
        <lastBuildDate>${new Date()}</lastBuildDate>
        <language>en-US</language>
        <sy:updatePeriod>
        hourly	</sy:updatePeriod>
        <sy:updateFrequency>
        1	</sy:updateFrequency>
        <generator>https://wordpress.org/?v=5.8.4</generator>`;



        let json = fs.readFileSync('./home/godzillanewz/nodejsapp/dataBase/db.json', 'utf8');

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

        fs.writeFile('./home/godzillanewz/public_html/rss.xml', xml+result+'</channel></rss>', (err) => {
            if (err) throw err;
            console.log('Saved!');
        });

        return result

    });
