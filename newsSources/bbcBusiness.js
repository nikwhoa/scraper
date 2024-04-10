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
    'https://www.bbc.com/news/business',
    '.gel-layout__item .gel-layout__item a',
  )
    .then((data) => {
      const links = [];

      data.filter((i, el) => {
        const $ = cheerio.load(el);

        /* It has to be change for others source */
        if (
          !$(el).attr('href').includes('investopedia-underscored') &&
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
    const urls = data.map((url) => `https://www.bbc.com${url}`);

    const news = [];
    const processedTitles = [];

    let count = 0;

    for (const item of urls) {
        count++;
      if(count > 10){
        break;
      }
      let data;
      if (item.startsWith("https://www.bbc.comhttps://www.bbc.com")) {
        let newItem = item;
        newItem = item.replace("https://www.bbc.comhttps://www.bbc.com", "https://www.bbc.com");
        const { data: newData } = await axios.get(newItem);
        data = newData;
      } else {
        const { data: newData } = await axios.get(item);
        data = newData;
      }
      const $ = cheerio.load(data);
      const article = $('article');

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

      const image = $(data).find('.ssrcss-11kpz0x-Placeholder img').attr("src");

      if (checkImage(image) === 'no image') {
        continue;
      }

      $(article).find('p:contains("By :")').remove();
      $(article).find('p:contains("By ")').remove();      
      $(article).find('h2:contains("Related Topics")').remove();
      $(article).find('h2:contains("More on this story")').remove();
      $(article).find('p:contains("You can read")').remove();
      $(article).find('button:contains("View comments")').remove();
      $(article).find('p:contains("Read more")').remove();
      $(article).find('div:contains("javascript")').remove();
      $(article).find('p:contains("click here")').remove();

      const description = cleanHTML(article.html(), {
        'header': 'remove',
        '.ssrcss-1y79c70-ComponentWrapper': 'remove',
        'figure': 'remove',
        '.ssrcss-84ltp5-Text': 'remove',
        '.ssrcss-68pt20-Text-TextContributorName': 'remove',
        '.ssrcss-1ujonwb-ClusterItems': 'remove',
        '': 'remove',
        'ul': 'remove',
        a: 'unwrap',
      });

      news.push({
        title: title.replace(/\n/g, '').replace(/  +/g, '').replace(/ +$/, ''),
        link: item,
        pubDate: generateDate(),
        description: `<img src="${image}" /> ${description.replace(
          /\n/g,
          '',
        )}<br><div>This post appeared first on bbc.com</div>`,
      });
    }

    return news;
  })
  .then(async (news) => {
    await addNewsToDB(news, 'bbcBusiness.json');
  })
  .then(() => {
    const xml = baseXML(
      'https://www.bbc.com/',
      'News from investopedia',
      'Get the latest news from the bbc',
    );

    generateXML(
      'bbcBusiness.json',
      xml,
      `${process.env.PATHTOXML}bbcBusiness.xml`,
      // 'xml/bbcBusiness.xml',
      // '/home/godzillanewz/public_html/bbcBusiness.xml',
    );
  })
  .catch((error) => {
    console.log(error);
  });
