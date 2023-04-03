import axios from 'axios';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import baseXML from '../components/baseXML.js';
import generateDate from '../components/generateDate.js';
import getNewsFromSource from '../components/getNewsFromSource.js';
import checkImage from '../components/checkImage.js';
import cleanHTML, { hasSelectorClean } from '../components/cleanHTML.js';
import checkTitle from '../components/checkTitle.js';
import addNewsToDB from '../components/addNewsToDB.js';
import generateXML from '../components/generateXML.js';

dotenv.config();

const getNews = new Promise((resolve, reject) => {
  getNewsFromSource(
    'https://cryptonews.com/',
    '.category_contents_details .article-item',
  )
    .then((data) => {
      const links = [];

      data.filter((i, el) => {
        const $ = cheerio.load(el);

        /* It hase to be change for others source */
        if (
          !$(el).find('a').attr('href').includes('the-ascent') &&
          !$(el).find('a').attr('href').includes('retirement')
        ) {
          links.push($(el).find('a').attr('href'));
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
  .then(async (links) => {
    const urls = links.map((url) => `https://cryptonews.com${url}`);

    const news = [];

    for (const item of urls) {
      const { data } = await axios.get(item);
      const $ = cheerio.load(data);
      const article = $('.article-single__content');
      const title = $('h1').text();

      /* Check if title is empty or contains stop words */
      const checkingTitle = checkTitle(title);

      if (checkingTitle === 'no title' || checkingTitle === 'stop word') {
        continue;
      }

      const image = $(article).find('.content-img').attr('src');

      if (checkImage(image) === 'no image') {
        continue;
      }

      $(article).find('p:contains("Disclaimer")').remove();
      $(article).find('p:contains("Related Articles")').remove();

      $(article)
        .find('p')
        .filter(function () {
          return $(this).contents().length === 1;
        })
        .children('a')
        .filter(function () {
          return $(this).contents().length === 1;
        })
        .children('strong')
        .remove();

      const description = cleanHTML(article.html(), {
        'figure.media': 'remove',
        'figure.image': 'remove',
        '.dslot': 'remove',
        '.raw-html-embed': 'remove',
        a: 'unwrap',
        a: 'remove',
      });

      news.push({
        title,
        link: item,
        pubDate: generateDate(),
        description: `<img src=${image} /> ${description.replace(
          /\n/g,
          '',
        )}<br><div>This post appeared first on cryptonews.com</div>`,
      });
    }

    return news;
  })
  .then(async (news) => {
    await addNewsToDB(news, 'cryptonews.json');
  })
  .then(() => {
    const xml = baseXML(
      'https://cryptonews.com/',
      'Latest Cryptocurrency News',
      'Breaking crypto news about the latest Bitcoin, Ethereum, Blockchain, NFTs, and Altcoin trends and happenings.',
    );

    generateXML(
      'cryptonews.json',
      xml,
      `${process.env.PATHTOXML}cryptonews.xml`,
    );
  })
  .catch((error) => {
    console.log(error);
  });
