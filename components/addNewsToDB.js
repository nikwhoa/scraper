import { Low, JSONFile } from 'lowdb';
import connectDatabase from '../connectDatabase.js';

const addNewsToDB = async (data, pathToFile) => {
  let pathToDataBase = '';
  const db = await connectDatabase(`${pathToFile}`).then((path) => {
    pathToDataBase = path;
  });

  const adapter = new JSONFile(pathToDataBase);
  const dataBase = new Low(adapter);
  await dataBase.read();
  const { item } = dataBase.data;

  if (item.length <= 0) {
    // add new news if there is no news in database
    item.unshift(...data);
    await dataBase.write();
  } else {
    data.filter((news) =>
      !item.map((el) => el.title).includes(news.title)
        ? item.unshift(news)
        : null,
    );
  }
  // remove news if it is more than 100
  for (let i = 0; i < item.length; i += 1) {
    if (i > 100) {
      item.splice(i);
    }
  }

  await dataBase.write();

  return db;
};

export default addNewsToDB;
