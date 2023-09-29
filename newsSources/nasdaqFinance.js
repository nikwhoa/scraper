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
    'https://www.nasdaq.com/topic/personal-finance',
    '.content-feed__card-title-link',
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
    const urls = data.map((url) => `https://www.nasdaq.com${url}`);

    const news = [];

    let count = 0;

    for (const item of urls) {
      count++;
      if(count > 1){
        break;
      }
      let data;
      if (item.startsWith("https://www.nasdaq.comhttps://www.nasdaq.com")) {
        let newItem = item;
        newItem = item.replace("https://www.nasdaq.comhttps://www.nasdaq.com", "https://www.nasdaq.com");
        const { data: newData } = await axios.get(newItem);
        data = newData;
      } else {
        const { data: newData } = await axios.get(item);
        data = newData;
      }
      const $ = cheerio.load(data);
      const article = $('.body__content');

      const title = $('h1').text();

      /* Check if title is empty or contains stop words */
      const checkingTitle = checkTitle(title);

      if (checkingTitle === 'no title' || checkingTitle === 'stop word') {
        continue;
      }

      const image = $(data).find('.picture > img').attr('src');


      if (checkImage(image) === 'no image') {
        continue;
      }

      $(article).find('p:contains("Find Out:")').remove();
      $(article).find('p:contains("More From")').next('ul').remove();
      $(article).find('p:contains("More From")').remove();
      $(article).find('p > strong').parent('p').remove();
      $(article).find('script').remove();
      $(article).contents().filter(function() {
        return this.nodeType === 8; // 8 обозначает узлы комментариев
      }).remove();
      $(article).find(':empty').remove();

      const description = cleanHTML(article.html(), {
        a: 'unwrap',
      });

      news.push({
        title: title.replace(/\n/g, '').replace(/  +/g, '').replace(/ +$/, ''),
        link: item,
        pubDate: generateDate(),
        description: `<img src="${image.slice(0, image.indexOf('g?') + 1)}" /> ${description.replace(
          /\n/g,
          '',
        )}<br><div>This post appeared first on nasdaqFinance.com</div>`,
      });
    }

    return news;
  })
  .then(async (news) => {
    await addNewsToDB(news, 'nasdaqFinance.json');
  })
  .then(() => {
    const xml = baseXML(
      'https://www.nasdaq.com/topic/personal-finance',
      'World News from CNN',
      'Get the latest news from the CNN',
    );

    generateXML(
      'nasdaqFinance.json',
      xml,
      `${process.env.PATHTOXML}nasdaqFinance.xml`,
      // 'xml/nasdaqFinance.xml',
      // '/home/godzillanewz/public_html/nasdaqFinance.xml',
    );
  })
  .catch((error) => {
    console.log(error);
  });
