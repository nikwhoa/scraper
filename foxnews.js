import axios from 'axios';
import * as cheerio from 'cheerio';
import pretty from 'pretty';
import fs, { writeFile } from 'fs';
import replace from 'replace-in-file';

let news = []

async function getNewsUrls() {
    try {
        const { data } = await axios.get('https://www.foxnews.com/us');
        const $ = cheerio.load(data);
        const linksToNews = $('.collection.collection-article-list > div.content.article-list > article.article > div.m > a');
        const newsUrls = [];

        linksToNews.each((i, link) => {
            newsUrls.push($(link).attr('href'));
        });
        return newsUrls;
    } catch (err) {
        console.error(err);
    }
}

const options = {
    files: 'foxnews.json'
}

function building(news, title, subTitle, content, callback) {
    if (title.length > 0 && subTitle.length > 0) {

        return news.push({
            title,
            subTitle,
            content
        })
    }
    callback(news)
}

function write(data) {
    fs.writeFile('foxnews.json', JSON.stringify(data, null, 2), function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log('Saved!');
        }
    })
}


// fs.writeFile('foxnews.json', JSON.stringify({title, subTitle, content}, null, 2), (err, data) => err ? console.log(err) : console.log('saved'))


const getNews = async () => {

    const urlsBase = await getNewsUrls()
    let urls = []
    urlsBase.forEach(el => {
        if (el[0] === '/') {
            urls.push('https://www.foxnews.com' + el);
        } else {
            urls.push(el)
        }
    })

    urls.forEach(async url => {
        try {
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);
            const title = $('.headline').text()
            const subTitle = $('.sub-headline').text()
            const content = $('.article-body').html()
            const html = content != null ? content.replace(/"/g, '\'') : ''

            building(news, title, subTitle, html, write)


        } catch (error) {
            console.error(error)
        }
    })
}


getNews()


