import fs from 'fs';
import convert from 'xml-js';
import generateDate from '../components/generateDate.js';

const generateXML = (dbName, baseXML, saveTo) => {
  const jsonNews = fs.readFileSync(`./dataBase/${dbName}`, 'utf8');

  const xmlNews = convert.json2xml(jsonNews, {
    compact: true,
    ignoreComment: false,
    ignoreText: false,
    spaces: 4,
    indentAttributes: true,
    indentCdata: true,
  });

  fs.writeFile(saveTo, `${baseXML + xmlNews}</channel></rss>`, (err) => {
    if (err) throw err;
    console.log('The file has been saved!' + generateDate());
  });
};

export default generateXML;
