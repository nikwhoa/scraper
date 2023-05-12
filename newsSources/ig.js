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
    'https://www.ig.com/en/news-and-trade-ideas',
    '.article-category-section-list-item .article-category-section-item a',
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
    const urls = data.map((url) => `https://www.ig.com${url}`);

    const news = [];
    const processedTitles = []; // Initialize an array to store processed titles

    for (const item of urls) {
      const { data } = await axios.get(item);
      const $ = cheerio.load(data);
      const article = $('.ArticleContent');

      const title = $('h1').text();

      /* Check if title is empty or contains stop words */
      const checkingTitle = checkTitle(title);

      if (checkingTitle === 'no title' || checkingTitle === 'stop word') {
        continue;
      }

      // Check for duplicate title
      if (processedTitles.includes(title)) {
        continue; // Skip this iteration if title is a duplicate
      }
      
      // Add the title to processedTitles array
      processedTitles.push(title);

      const image = $(data).find('.ArticleImage .image-component-root img').attr('src');
      //console.log("title= "+title);

      if (checkImage(image) === 'no image') {
        continue;
      }

      $(article).find('p:contains("CNN")').remove();
      $(article).find('p:contains("Picture of the day")').remove();
      $(article).find('p:contains("CNN\'s")').remove();

      const description = cleanHTML(article.html(), {
        '.image': 'remove',
        '.html-embed': 'remove',
        '.footnote': 'remove',
        '.related-content': 'remove',
        '.gallery': 'remove',
        '.source': 'remove',
        '.highlights': 'remove',
        '.ad-slot': 'remove',
        '.video-resource': 'remove',
        a: 'unwrap',
      });

      news.push({
        title: title.replace(/\n/g, '').replace(/  +/g, '').replace(/ +$/, ''),
        link: item,
        pubDate: generateDate(),
        /*
        description: `<img src="${image.slice(0, image.indexOf('g?') + 1)}" /> ${description.replace(
          /\n/g,
          '',
        )}<br><div>This post appeared first on ig.com</div>`,*/
        description: `<img src="https:${image}" /> ${description.replace(
          /\n/g,
          '',
        )}<br><div>This post appeared first on ig.com</div>`,
      });
    }

    return news;
  })
  .then(async (news) => {
    await addNewsToDB(news, 'ig.json');
  })
  .then(() => {
    const xml = baseXML(
      'https://edition.cnn.com/world',
      'World News from CNN',
      'Get the latest news from the CNN',
    );

    generateXML(
      'ig.json',
      xml,
      `${process.env.PATHTOXML}ig.xml`,
      // 'xml/ig.xml',
      // '/home/godzillanewz/public_html/ig.xml',
    );
  })
  .catch((error) => {
    console.log(error);
  });
