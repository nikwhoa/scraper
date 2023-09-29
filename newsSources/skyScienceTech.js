import axios from 'axios';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import baseXML from '../components/baseXML.js';
import generateDate from '../components/generateDate.js';
import getNewsFromSource from '../components/getNewsFromSource.js';
import checkImage from '../components/checkImage.js';
import cleanHTML from '../components/cleanHTML.js';
import checkTitle from '../components/checkTitle.js';
import addNewsToDB from '../components/addNewsToDB.js';
import generateXML from '../components/generateXML.js';

dotenv.config();

new Promise((resolve, reject) => {
  getNewsFromSource(
    'https://news.sky.com/technology',
    'a.sdc-site-tile__headline-link',
  )
    .then((data) => {
      const links = [];

      data.filter((i, el) => {
        const $ = cheerio.load(el);

        /* It has to be change for others source */
        if (
          !$(el).attr('href').includes('cnn-underscored') &&
          !$(el).attr('href').includes('video') &&
          !$(el).attr('href').includes('style')
        ) {
          links.push($(el).attr('href'));
        }
      });

      return links;
    })
    .then((urls) => {
      if (urls.length <= 0) throw new Error();
      resolve(urls);
      reject(new Error('Links not found'));
    });
})
  .then(async (data) => {
    const urls = data.map((url) => `https://news.sky.com/${url}`);

    const news = [];

    for (const item of urls) {
      let data;
      if (item.startsWith("https://news.sky.com/https://news.sky.com/")) {
        let newItem = item;
        newItem = item.replace("https://news.sky.com/https://news.sky.com/", "https://news.sky.com/");
        const { data: newData } = await axios.get(newItem);
        data = newData;
      } else {
        const { data: newData } = await axios.get(item);
        data = newData;
      }
      const $ = cheerio.load(data);
      const article = $('.sdc-site-layout__col >.sdc-article-body');

      const title = $('.sdc-article-header__long-title').text();

      /* Check if title is empty or contains stop words */
      const checkingTitle = checkTitle(title);

      if (checkingTitle === 'no title' || checkingTitle === 'stop word') {
        continue;
      }

      const image = $(data).find('img.sdc-article-image__item').attr('src');

      if (checkImage(image) === 'no image') {
        continue;
      }

      $(article).find('p:contains("CNN")').remove();
      $(article).find('p:contains("Picture of the day")').remove();
      $(article).find('p:contains("CNN\'s")').remove();

      // Delete Read more:
      const patternToRemove = /<p><strong>Read more[\s\S]*?<\/p>/;
      const articleHtml = article.html();
      if (patternToRemove.test(articleHtml)) {
        article.html(articleHtml.replace(patternToRemove, ''));
      }

      const description = cleanHTML(article.html(), {
        '.sdc-article-tags__inner': 'remove',
        '.sdc-article-image__caption-text': 'remove',
        '.sdc-article-image__visually-hidden': 'remove',
        '.sdc-article-related-stories__title': 'remove',
        '.sdc-site-layout-sticky-region': 'remove',
        '.sdc-article-widget': 'remove',
        //strong: 'unwrap',
        a: 'unwrap',
      });

      news.push({
        title: title.replace(/\n/g, '').replace(/  +/g, '').replace(/ +$/, ''),
        link: item,
        pubDate: generateDate(),
        description: `<img src="${image.slice(0, image.indexOf('g?') + 1)}" /> ${description.replace(
          /\n/g,
          '',
        )}<br><div>This post appeared first on sky.com</div>`,
      });
    }

    return news;
  })
  .then(async (news) => {
    await addNewsToDB(news, 'skyScienceTech.json');
  })
  .then(() => {
    const xml = baseXML(
      'https://news.sky.com/world/',
      'Science News from SKY',
      'Get the latest news from the SKY',
    );

    generateXML(
      'skyScienceTech.json',
      xml,
      `${process.env.PATHTOXML}skyScienceTech.xml`,
      // 'xml/skyScienceTech.xml',
      // '/home/godzillanewz/public_html/skyScienceTech.xml',
    );
  })
  .catch((error) => {
    console.log(error);
  });
