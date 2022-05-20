import axios from 'axios';
import * as cheerio from 'cheerio';
import pretty from 'pretty';
import fs, { writeFile } from 'fs';
import replace from 'replace-in-file';
import { join, dirname, resolve } from 'path'
import { Low, JSONFile } from 'lowdb'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url));



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



function building(news, title, subTitle, content) {
    if (title.length > 0 && subTitle.length > 0) {

        return news.push({
            title,
            subTitle,
            content
        })
    }
    // callback(news)
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


const getNews = new Promise (async () => {
    console.log('Getting news urls...')
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
            building(news, title, subTitle, html)
        } catch (error) {
            console.error(error)
        }
    })

    console.log(readyUrl);
})


// const doo = async () => {
//     const file = join(__dirname, 'db.json')
//     const adapter = new JSONFile(file)
//     const db = new Low(adapter)

//     await db.read()
//     db.data = []

//     db.data.posts.push(news)

//     await db.write()
// }

getNews.then(() => {
    console.log('done');
})


// let promise = new Promise(function(resolve, reject) {
//     getNews()
// })

// promise.then(() => {
//     console.log(news)
// }).catch(err => console.log(err));
// logger()
