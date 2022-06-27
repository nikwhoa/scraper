import { join, dirname, resolve } from 'path';
import { Low, JSONFile } from 'lowdb';
import { fileURLToPath } from 'url';
import convert from 'xml-js';
import fs from 'fs';
import puppeteer from 'puppeteer';

// create and connect to database
const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, './dataBase/cnnWorldDB.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);
await db.read();

let gettingNews = new Promise(async (resolve, reject) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://edition.cnn.com/world');
    const urls = await page.$$eval('div.cd__content a', (urls) =>
        urls.map((el) =>
            el.href.includes('bleacherreport.com') ||
            el.href.includes('fool.com') ||
            el.href.includes('ck.lendingtree.com') ||
            el.href.includes('live-news') ||
            el.href.includes('cnn.com/video') ||
            el.href.includes('cnn.com/style') ||
            el.href.includes('cnn.com/travel') ||
            el.href.includes('/2022/05/28/') ||
            el.href.includes('gallery') ||
            el.href.includes('/2022/05/29/') ||
            el.href.includes('/2022/05/30/') ||
            el.href.includes('/2022/03/20/') ||
            el.href.includes('/2022/03/26/') ||
            el.href.includes('/2022/03/21/') ||
            el.href.includes('/2022/05/26/') ||
            el.href.includes('/2022/05/27/') ||
            el.href.includes('/2022/03/12/') ||
            el.href.includes('/2021/05/12/') ||
            el.href.includes('/2022/05/27/') ||
            el.href.includes('/2022/03/22/') ||
            el.href.includes('europe') ||
            el.href.includes('world') ||
            el.href.includes('us') ||
            el.href.includes('business') ||
            el.href.includes('asia') ||
            el.href.includes('football') ||
            el.href.includes('americas') ||
            el.href.includes('cnn.com/specials')
                ? null
                : el.href
        )
    );
    await browser.close();
    resolve(urls);
})
    .then(async (data) => {
        let newNews = [];
        const urls = data.filter((el) => el != null);



        const browser = await puppeteer.launch();

        for (const item of urls) {
            const page = await browser.newPage();
            await page
                .goto(item, { waitUntil: 'load', timeout: 0 })
                .catch((e) => void 0);
            const titleNews = await page.$eval('h1', (el) => el.innerText);
            const image = await page.$eval(
                '.media__image--responsive',
                (el) => el.src
            );
            const newsContent = await page.$$eval(
                '.zn-body__paragraph',
                (el) => {
                    return el.map((el) => el.outerHTML);
                }
            );

            const html = Array.from(newsContent)
                .join('')
                .replace(/"/g, "'")
                .replace(
                    /\<cite class='el-editorial-source'\> \(CNN\)<\/cite>/g,
                    ''
                );
            const html2 = "<img src='" + image + "'/>" + html;

            newNews.push({
                title: titleNews,
                link: item,
                pubDate: new Date(),
                category: 'Cnn World News',
                description: html2,
            });
            await page.close();
        }

        await browser.close();

        return newNews;
    })

    .then(async (data) => {
        let { item } = db.data;

        if (item.length <= 0) {
            item.unshift(...data);
            await db.write();
        } else {
            data.forEach((items) => {
                if (!item.find((news) => news.title === items.title)) {
                    item.unshift(...data);
                }
            });
            await db.write();
        }

        return item;
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
    ><channel>
    <title>CNN World News</title>
    <atom:link href="https://edition.cnn.com/world" rel="self" type="application/rss+xml" />
    <link>https://edition.cnn.com/world</link>
    <description>Where Hope Finally Made a Comeback</description>
    <lastBuildDate>${new Date()}</lastBuildDate>
    <language>en-US</language>
    <sy:updatePeriod>
    hourly	</sy:updatePeriod>
    <sy:updateFrequency>
    1	</sy:updateFrequency>
    <generator>https://wordpress.org/?v=5.8.4</generator>`;

        let json = fs.readFileSync(
            // './home/godzillanewz/nodejsapp/dataBase/db.json',
            './home/godzillanewz/nodejsapp/dataBase/cnnWorldDB.json',
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
            // './home/godzillanewz/public_html/rss.xml',
            './home/godzillanewz/public_html/cnnWorldDBrss.xml',
            xml + result + '</channel></rss>',
            (err) => {
                if (err) throw err;
                console.log('Saved!');
            }
        );

        return result;
    });
