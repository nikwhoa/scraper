import axios from 'axios';
import * as cheerio from 'cheerio';
import { join, dirname, resolve } from 'path';
import { Low, JSONFile } from 'lowdb';
import { fileURLToPath } from 'url';
import getNewsUrls from './components/getUrls.js';
import changeUrls from './components/changeUrls.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
    const file = join(__dirname, './dataBase/db.json');
    const adapter = new JSONFile(file);
    const db = new Low(adapter);

    await db.read();
    db.data = db.data || { news: [] };

    data.forEach(async (url) => {
      try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const title = $('.headline').text();
        const subTitle = $('.sub-headline').text();
        const content = $('.article-body').html();
        const html = content != null ? content.replace(/"/g, "'") : '';

        if (title.length > 0 && subTitle.length > 0) {
          const { news } = db.data;
          news.push([{ title, subTitle, content: html }]);

          await db.write();
        } else {
          return null;
        }
      } catch (error) {
        console.error(error);
      }
    });
  })
  .then(() => console.log('done'));
