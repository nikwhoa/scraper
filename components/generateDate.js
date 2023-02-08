const generateDate = () =>
  new Date().toLocaleDateString('en-uk', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

export default generateDate;
