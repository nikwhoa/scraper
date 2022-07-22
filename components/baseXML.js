const xml = (url, title, description) => {
    // don'f forget to use </chanel> tag in output xml
    const baseXML = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wfw="http://wellformedweb.org/CommentAPI/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:sy="http://purl.org/rss/1.0/modules/syndication/" xmlns:slash="http://purl.org/rss/1.0/modules/slash/">
    <channel>
        <title>${title}</title>
        <atom:link href="${url}" rel="self" type="application/rss+xml" />
        <link>https://www.foxnews.com/us</link>
        <description>${description}</description>
        <lastBuildDate>${new Date()}</lastBuildDate>
        <language>en-US</language>
        <sy:updatePeriod>daily</sy:updatePeriod>
        <sy:updateFrequency>1</sy:updateFrequency>
        <generator>https://wordpress.org/?v=5.8.4</generator>`;

    return baseXML;
};

export default xml;
