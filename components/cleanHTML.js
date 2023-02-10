import * as cheerio from 'cheerio';

const cleanHTML = (html, selectors) => {
  const $ = cheerio.load(html);

  Object.keys(selectors).forEach((selector) => {
    switch (selectors[selector]) {
      case 'remove':
        $(selector).remove();
        break;
      case 'unwrap':
        $(selector).contents().unwrap();
        break;
      default:
        break;
    }
  });

  $('h1').remove();
  $('html').contents().unwrap();

  return $.html().replace(/<body>/g, '').replace(/<\/body>/g, '').replace(/<head>/g, '').replace(/<\/head>/g, '');
};

export const hasSelectorClean = (html, selector, hasSelector) => {
  const $ = cheerio.load(html);

  $(`${selector}:has(${hasSelector})`).filter(function () {
    // check links to others news inside article
    if ($(this).contents().length === 2) {
      $(this).remove();
    }
  });
  return $.html();
};

export default cleanHTML;
