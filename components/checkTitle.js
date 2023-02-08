const checkTitle = (title, words = []) => {
  let returnTitle = '';

  words.forEach((word) => {

    if (title.includes(word)) {
      returnTitle = 'stop word';
    }
  });

  if (
    title.length <= 0 ||
    title === undefined ||
    title === null ||
    title === '' ||
    title === ' '
  ) {
    returnTitle = 'no title';
  }

  return returnTitle;
};

export default checkTitle;
