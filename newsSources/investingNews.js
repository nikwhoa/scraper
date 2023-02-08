import axios from 'axios';
import * as cheerio from 'cheerio';
import { Low, JSONFile } from 'lowdb';
import fs from 'fs';
import convert from 'xml-js';
import connectDatabase from '../connectDatabase.js';
import baseXML from '../components/baseXML.js';
import generateDate from '../components/generateDate.js';

let pathToDataBase = '';
const db = connectDatabase('investingNews.json').then((path) => {
  pathToDataBase = path;
});

const getNews = new Promise((resolve, reject) => {
  let urls = [];
  axios
    .get('https://investingnews.com/featured')
    .then((response) => {
      const $ = cheerio.load(response.data);
      const article = $('.widget__head > a');

      article.filter((i, el) => {
        urls.push(el.attribs.href || null);
      });
    })
    .then(() => {
      console.log(urls);
      resolve(urls);
    })
    .catch((error) => {
      throw error;
    });
})
  .then(async (urls) => {
    const news = [];

    for (const item of urls) {
      const { data } = await axios.get(item);
      const $ = cheerio.load(data);

      const title =
        $('h1.widget__headline > .widget__headline-text')
          .text()
          .replace(/\n | {2}| {3}/gm, '')
          .trim() || null;

      if (
        title === null ||
        title.includes('Download') ||
        title.includes('Outlook') ||
        title.includes('outlook') ||
        title === '' ||
        title.includes('download') ||
        title.toLowerCase().includes('top stories') ||
        title.toLowerCase().includes('video') ||
        title.toLocaleLowerCase().includes('report')
      ) {
        continue;
      }

      $('div.ad-tag').remove();
      $('.shortcode-media').remove();
      $('.photo-credit').remove();
      $('script').remove();
      $('p:contains("@INN_Resource")').remove();
      $('p:contains("investingnews.com")').remove();
      $('p:contains("cmcleod@investingnews.com")').remove();
      $('p:contains("INN_Technology")').remove();
      $('p:contains("INNSpired")').remove();
      $('p:contains("INN")').remove();
      $('p:contains("@INN_Australia")').remove();
      $('p:contains("Investing News")').remove();
      $('div.post-pager').remove();
      $('div.around-the-web').remove();
      $('li:has(A)').remove();
      $('a').contents().unwrap();
      $('hr').remove();

      const image = $('picture > img.rm-hero-media'); // image[0].attribs.src
      const content = $(
        '.posts-wrapper > .post-partial > article .body-description',
      ).html();

      const html = content != null ? content.replace(/"/g, "'") : '';

      news.push({
        title,
        link: item,
        pubDate: generateDate(),
        description: `<img src='${image[0].attribs.src}' />${html.replace(
          /\n/g,
          '',
        )}<br><div>This post appeared first on investingnews.com</div>`,
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
      'https://investingnews.com/featured/',
      'INVESTING NEWS',
      'Get the latest news from Investing News',
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
      '/home/godzillanewz/public_html/investingNews.xml',
      // './xml/investingNews.xml',
      `${xml + xmlNews}</channel></rss>`,
      (err) => {
        if (err) throw err;
        console.log(
          `The file has been saved! ${new Date().toLocaleDateString('en-uk', {
            // weekday: 'long',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}`,
        );
      },
    );
  })
  .catch((err) => {
    throw err;
  });
