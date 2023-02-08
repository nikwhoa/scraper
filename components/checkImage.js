const checkImage = (image) => {
    if (image === undefined || image === null || image === '' || image === ' ' || image.length <= 10) {
        return 'no image'
    }
    return image;
};

export default checkImage;
