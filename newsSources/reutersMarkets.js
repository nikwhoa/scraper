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
    'https://www.reuters.com/markets/us/',
    '.media-story-card__placement-container__1R55- a',
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
    const urls = data.map((url) => `https://www.reuters.com${url}`);

    const news = [];

    for (const item of urls) {
      let data;
      if (item.startsWith("https://www.reuters.comhttps://www.reuters.com")) {
        let newItem = item;
        newItem = item.replace("https://www.reuters.comhttps://www.reuters.com", "https://www.reuters.com");
        const { data: newData } = await axios.get(newItem);
        data = newData;
      } else {
        const { data: newData } = await axios.get(item);
        data = newData;
      }
      const $ = cheerio.load(data);
      const article = $('.article-body__content__17Yit');

      const title = $('h1.text__text__1FZLe').text();
      //console.log(title);  

      /* Check if title is empty or contains stop words */
      const checkingTitle = checkTitle(title);

      if (checkingTitle === 'no title' || checkingTitle === 'stop word') {
        continue;
      }

      const image = $(data).find('div.styles__image-container__skIG1>img').attr('src');
      //console.log(image);
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
        'button': 'remove',
        '.article-body__row__dFOPA': 'remove',
        '.article-body__element__2p5pI': 'remove',
        a: 'unwrap',
      });

      let regex = /^[^(]+\([^)]+\) - /;
      let descriptionNew = description.replace(regex, "");
      regex = /^[^(]+\([^)]+\) - /;      
      descriptionNew = descriptionNew.replace(regex, "");

      news.push({
        title: title.replace(/\n/g, '').replace(/  +/g, '').replace(/ +$/, ''),
        link: item,
        pubDate: generateDate(),
        description: `<img src="${image}"> ${descriptionNew.replace(
          /\n/g,
          '',
        )}<br><div>This post appeared first on reuters.com</div>`,
      });
    }

    return news;
  })
  .then(async (news) => {
    await addNewsToDB(news, 'reutersMarkets.json');
  })
  .then(() => {
    const xml = baseXML(
      'https://www.reuters.com',
      'News from reuters',
      'Get the latest news from the reuters',
    );

    generateXML(
      'reutersMarkets.json',
      xml,
      `${process.env.PATHTOXML}reutersMarkets.xml`,
      // 'xml/reutersMarkets.xml',
      // '/home/godzillanewz/public_html/reutersMarkets.xml',
    );
  })
  .catch((error) => {
    console.log(error);
  });
