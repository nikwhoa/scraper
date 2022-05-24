import toXML from 'jstoxml';

const toXMLFunc = () => {
    const xmlOptions = {
        header: true,
        indent: '  ',
    };

    toXML(
        {
            _name: 'rss',
            _attrs: {
                version: '2.0',
            },
            _content: {
                channel: [
                    {
                        title: 'RSS Fox News Us',
                    },
                    {
                        description: 'Description',
                    },
                    {
                        link: 'https://www.foxnews.com/us',
                    },
                    {
                        lastBuildDate: () => new Date(),
                    },
                    {
                        pubDate: () => new Date(),
                    },
                    {
                        language: 'en',
                    },
                    // {
                    //     item
                    // },
                ],
            },
        },
        xmlOptions
    );
};

console.log(toXMLFunc());

export default toXMLFunc;
