import axios from 'axios';
import FormData from 'form-data';

const wordpressApiUrl = 'https://godzillanewz.com/wp-json/wp/v2/posts';
const username = 'admin';
const password = 'DBlG yYSU fOq0 flU1 g6Q3 ucwM';
const headers = {
  'Content-Type': 'application/json',
  Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
};

const slugify = (text) => {
    return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
  };

const uploadImage = async (title, imageUrl) => {
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const formData = new FormData();
  const imageName = slugify(title) + '.jpg';

  formData.append('file', Buffer.from(response.data), { filename: imageName });

  try {
    const uploadResponse = await axios.post('https://godzillanewz.com/wp-json/wp/v2/media', formData, {
      headers: {
        ...headers,
        'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
      },
    });

    return uploadResponse.data.id;
  } catch (error) {
    console.error('Error uploading image:', error.message);
    return null;
  }
};

const addPostToWordPress = async (title, content, imageUrl, category) => {
  // Данные нового поста
  const newPostData = {
    title,
    content,
    status: 'publish',
    categories: [category], // ID категории, к которой вы хотите добавить пост
  };

  // Проверка дубликата поста по имени в текущей категории
  try {
    const existingPostsResponse = await axios.get(`${wordpressApiUrl}?categories=${category}&_fields=id,title,meta,slug`, { headers });
    const existingPostsInCategory = existingPostsResponse.data;

    let isDuplicate = false;
    const newPostSlug = slugify(newPostData.title);

    for (const post of existingPostsInCategory) {
      const existingPostSlug = post.slug;

      if (existingPostSlug === newPostSlug) {
        isDuplicate = true;
        break; // Если нашли дубликат, прекращаем цикл
      }
    }

    if (!isDuplicate) {
      // Создание нового поста, так как дубликат не найден
      const mediaId = await uploadImage(newPostData.title, imageUrl);

      if (mediaId) {
        newPostData.featured_media = mediaId;

        // Создание нового поста с изображением
        const createPostResponse = await axios.post(wordpressApiUrl, newPostData, { headers });

        //console.log('Created post with image:', createPostResponse.data.title);
      } else {
        //console.log('Image upload failed. Post not created.');
      }
    } else {
      //console.log('Post exists');
    }
  } catch (error) {
    console.error('Error adding post to WordPress:', error.message);
  }
};

export default addPostToWordPress;
