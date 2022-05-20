const changeUrls = (urls) => {
    const urlsBase = urls;
    let changedUrls = [];

    urlsBase.forEach((el) => {
        if (el[0] === '/') {
            changedUrls.push('https://www.foxnews.com' + el);
        } else {
            changedUrls.push(el);
        }
    });

    return changedUrls;
};
export default changeUrls;
