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
    'https://edition.cnn.com/health',
    '.container_lead-plus-headlines-with-images__link',
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
    const urls = data.map((url) => `https://edition.cnn.com${url}`);

    const news = [];
    const processedTitles = [];

    for (const item of urls) {
      let data;
      if (item.startsWith("https://edition.cnn.comhttps://edition.cnn.com")) {
        let newItem = item;
        newItem = item.replace("https://edition.cnn.comhttps://edition.cnn.com", "https://edition.cnn.com");
        const { data: newData } = await axios.get(newItem);
        data = newData;
      } else {
        const { data: newData } = await axios.get(item);
        data = newData;
      }
      const $ = cheerio.load(data);
      const article = $('.article__content');

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

      const image = $(data).find('img.image__dam-img').attr('src');

      if (checkImage(image) === 'no image') {
        continue;
      }

      $(article).find('p:contains("CNN")').remove();
      $(article).find('p:contains("Picture of the day")').remove();
      $(article).find('p:contains("CNN\'s")').remove();
      $(article).find('p:contains("Get CNN")').remove();

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
        '.factbox_inline-small__title': 'remove',
        '.video-playlist': 'remove',
        a: 'unwrap',
      });

      news.push({
        title: title.replace(/\n/g, '').replace(/  +/g, '').replace(/ +$/, ''),
        link: item,
        pubDate: generateDate(),
        description: `<img src="${image.slice(0, image.indexOf('g?') + 1)}" /> ${description.replace(
          /\n/g,
          '',
        )}<br><div>This post appeared first on cnn.com</div>`,
      });
    }

    return news;
  })
  .then(async (news) => {
    await addNewsToDB(news, 'cnnhealth.json');
  })
  .then(() => {
    const xml = baseXML(
      'https://edition.cnn.com/health',
      'health News from CNN',
      'Get the latest news from the CNN',
    );

    generateXML(
      'cnnhealth.json',
      xml,
      `${process.env.PATHTOXML}cnnhealth.xml`,
      // 'xml/cnnhealth.xml',
      // '/home/godzillanewz/public_html/cnnhealth.xml',
    );
  })
  .catch((error) => {
    console.log(error);
  });
