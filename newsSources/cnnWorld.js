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

new Promise((resolve, reject) => {
  getNewsFromSource(
    'https://edition.cnn.com/world',
    '.container_lead-plus-headlines__link',
  )
    .then((data) => {
      const links = [];

      data.filter((i, el) => {
        const $ = cheerio.load(el);

        /* It has to be change for others source */
        if (
          !$(el).attr('href').includes('cnn-underscored') &&
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
    const urls = data.map((url) => `https://edition.cnn.com${url}`);

    const news = [];

    for (const item of urls) {
      const { data } = await axios.get(item);
      const $ = cheerio.load(data);
      const article = $('.article__content');

      const title = $('h1').text();

      /* Check if title is empty or contains stop words */
      const checkingTitle = checkTitle(title);

      if (checkingTitle === 'no title' || checkingTitle === 'stop word') {
        continue;
      }

      const image = $(data).find('img.image__dam-img').attr('src');

      if (checkImage(image) === 'no image') {
        continue;
      }

      $(article).find('p:contains("CNN")').remove();
      $(article).find('p:contains("CNN\'s")').remove();

      const description = cleanHTML(article.html(), {
        '.image': 'remove',
        '.html-embed': 'remove',
        '.footnote': 'remove',
        '.related-content': 'remove',
        '.gallery': 'remove',
        '.ad-slot': 'remove',
        a: 'unwrap',
      });

      news.push({
        title: title.replace(/\n/g, '').replace(/  +/g, '').replace(/ +$/, ''),
        link: item,
        pubDate: generateDate(),
        description: `<img src="${image}" /> ${description.replace(
          /\n/g,
          '',
        )}<br><div>This post appeared first on cnn.com</div>`,
      });
    }

    return news;
  })
  .then(async (news) => {
    await addNewsToDB(news, 'cnnWorld.json');
  })
  .then(() => {
    const xml = baseXML(
      'https://edition.cnn.com/world',
      'World News from CNN',
      'Get the latest news from the CNN',
    );

    generateXML(
      'cnnWorld.json',
      xml,
      // 'xml/cnnWorld.xml',
      '/home/godzillanewz/public_html/cnnWorld.xml',
    );
  })
  .catch((error) => {
    console.log(error);
  });