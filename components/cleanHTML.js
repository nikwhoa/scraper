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

  //   switch (operation) {
  //     case 'remove':
  //       selectors.forEach((selector) => {
  //         $(selector).remove();
  //       });
  //       break;
  //     case 'unwrap':
  //       selectors.forEach((selector) => {
  //         $(selector).contents().unwrap();
  //       });
  //       break;
  //     default:
  //       break;
  //   }

  return $.html();
};

export default cleanHTML;
