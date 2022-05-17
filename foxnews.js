// const { data } = require('cheerio/lib/api/attributes')
import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import fs from 'fs'

const getData = (url) => {
    return fetch(url)
        .then(res => res.text())
        .then(data => {
            return data
        })
        .catch(err => {
            console.log(err)
        })
}

const URL = 'https://www.foxnews.com/us'

const getNews = async () => {
    const getNewsData = await getData(URL)

    const newsData = cheerio.load(getNewsData)
    const news = newsData('div.content.article-list')
    console.log(news.html());


    fs.appendFile('foxnews.html', news.html(), function (err) {
        if (err) throw err;
        console.log('Saved!');
    });
}


getNews()