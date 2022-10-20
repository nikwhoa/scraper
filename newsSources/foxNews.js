/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable import/extensions */
/* eslint-disable prefer-template */
/* eslint-disable no-restricted-syntax */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Low, JSONFile } from 'lowdb';
import fs from 'fs';
import convert from 'xml-js';
import connectDatabase from '../connectDatabase.js';
import baseXML from '../components/baseXML.js';
import generateDate from '../components/generateDate.js';

let pathToDataBase = '';
const db = connectDatabase('foxNews.json').then((path) => {
    pathToDataBase = path;
});

const getNews = new Promise((resolve, reject) => {
    const links = [];

    axios
        .get('https://www.foxnews.com/politics')
        .then((response) => {
            const $ = cheerio.load(response.data);
            const article = $(
                '.collection.collection-article-list > div.content.article-list > article.article > div.m > a',
            );

            article.filter((i, el) => {
                if (
                    el.attribs.href.includes('video') ||
                    el.attribs.href.includes('media')
                ) {
                    return null;
                }
                links.push({
                    link: `https://www.foxnews.com${$(el).attr('href')}`,
                    // pubDate: generateDate(),
                });
            });
        })
        .then(() => {
            resolve(links);
        })
        .catch((error) => {
            throw error;
        });
})
    .then(async (data) => {
        const news = [];

        for (const item of data) {
            const { data } = await axios.get(item.link);
            const $ = cheerio.load(data);
            const titleNews = $('.headline').text();

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


            const image = $('.image-ct').attr('baseimage');
            $('.article-body').find('.image-ct').each((i, el) => {
                $(el).remove();
            });
            const content = $('.article-body').html();


            const html = content != null ? content.replace(/"/g, "'") : '';

            news.push({
                title: titleNews,
                link: item.link,
                pubDate: generateDate(),
                description: `<img src='${image}' />${html.replace(
                    /"/g,
                    "'",
                )}<br><div>This post appeared first on FOX NEWS</div>`,
            });
        }

        return news;
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
            'https://www.foxnews.com/us',
            'FOX NEWS US',
            'Get the latest news from FOX NEWS US',
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
            '/home/godzillanewz/public_html/foxnews.xml',
            // './xml/foxnews.xml',
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
