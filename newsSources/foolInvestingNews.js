import axios from 'axios';
import * as cheerio from 'cheerio';
import baseXML from '../components/baseXML.js';
import generateDate from '../components/generateDate.js';
import getNewsFromSource from '../components/getNewsFromSource.js';
import checkImage from '../components/checkImage.js';
import cleanHTML from '../components/cleanHTML.js';
import checkTitle from '../components/checkTitle.js';
import addNewsToDB from '../components/addNewsToDB.js';
import generateXML from '../components/generateXML.js';
import ZabbixSender from 'node-zabbix-sender';
let Sender = new ZabbixSender({host: '127.0.0.1'});

new Promise((resolve, reject) => {
  getNewsFromSource(
    'https://www.fool.com/investing-news',
    '#aggregator-article-container .flex',
  )
    .then((data) => {
      const links = [];

      data.filter((i, el) => {
        const $ = cheerio.load(el);

        /* It has to be change for others source */
        const hrefAttribute = $(el).find('a').attr('href');
        if (hrefAttribute && !hrefAttribute.includes('the-ascent')) {
          if (
            !$(el).find('a').attr('href').includes('the-ascent') &&
            !$(el).find('a').attr('href').includes('retirement')
          ) {
            links.push($(el).find('a').attr('href'));
          }
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
    const urls = data.map((url) => 'https://www.fool.com' + url);

    const news = [];

    for (const item of urls) {
      const { data } = await axios.get(item);
      const $ = cheerio.load(data);
      const article = $('.article-body');

      const title = $('h1').text();

      /* Check if title is empty or contains stop words */
      const checkingTitle = checkTitle(title);

      if (checkingTitle === 'no title' || checkingTitle === 'stop word') {
        continue;
      }

      const image = $(article).find('img').attr('src');
      if (checkImage(image) === 'no image') {
        continue;
      }

      const description = cleanHTML(article.html(), {
        '.image': 'remove',
        '.article-pitch-container': 'remove',
        '.dfp-ads': 'remove',
        '.company-card-vue-component': 'remove',
        '.interad': 'remove',

        a: 'unwrap',
      });

      news.push({
        title,
        link: item,
        pubDate: generateDate(),
        description: `<img src=${image} /> ${description.replace(
          /\n/g,
          '',
        )}<br><div>This post appeared first on fool.com</div>`,
      });
    }

    return news;
  })
  .then(async (news) => {
    addNewsToDB(news, 'foolInvestingNews.json');
  })
  .then(() => {
    const xml = baseXML(
      'https://www.fool.com/investing/',
      'INVESTING NEWS FROM THE MOTLEY FOOL',
      'Get the latest news from the Motley Fool',
    );

    generateXML(
      'foolInvestingNews.json',
      xml,
    //   'xml/foolInvestingNews.xml',
      '/var/www/html/foolInvestingNews.xml',
    );
  })
  .catch((error) => {
    console.log(error);
  });
