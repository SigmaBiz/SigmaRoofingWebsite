const express = require('express');
const { google } = require('googleapis');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const port = 3000;

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/photoslibrary.readonly'];

app.set('view engine', 'ejs');

// Step 1: Login Redirect
app.get('/', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  res.redirect(url);
});

// Step 2: OAuth Callback
app.get('/oauth2callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const photos = google.photoslibrary({ version: 'v1', auth: oauth2Client });

    const albums = await photos.albums.list();
    const album = albums.data.albums.find(a => a.title === process.env.ALBUM_NAME);

    if (!album) {
      return res.send('Album not found. Double-check the name in your .env file.');
    }

    const media = await photos.mediaItems.search({
      requestBody: {
        albumId: album.id,
        pageSize: 20,
      },
    });

    const images = media.data.mediaItems.map(item => item.baseUrl);
    res.render('gallery', { images });
  } catch (err) {
    console.error('OAuth error:', err);
    res.status(500).send('Error: ' + err.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});