require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require("dns")
const bodyParser = require('body-parser');

const { QuickDB } = require("quick.db");
const db = new QuickDB();

(async () => {
  if (!(await db.get("urls"))) {
    db.add("urls.count", 0);
  }
})();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', async function(req, res) {
  try {
      let originalUrl = req.body.url;
      const parsedUrl = new URL(originalUrl);

      dns.lookup(parsedUrl.hostname, async (err) => {
          if (err || !parsedUrl.protocol || !parsedUrl.hostname) {
              return res.json({ error: 'invalid url' });
          }
          
          let id = await db.get("urls.count");
          await db.add("urls.count", 1);
          id++;


          await db.push("urls.collection", { url: originalUrl, shortID: id });

          res.json({
              original_url: originalUrl,
              short_url: id
          });
      });
  } catch (err) {
      res.json({ error: 'invalid url' });
  }
});


app.get('/api/shorturl/:shortUrlId', async (req, res) => {
  console.log(await db.get("urls"))
  const shortUrlId = req.params.shortUrlId;
  const url_collection = await db.get("urls.collection")

  if (!url_collection) return res.json({ error: 'invalid url' });

  originalUrl = url_collection.find(e => e.shortID == shortUrlId)

  if (originalUrl.url) {
      return res.redirect(originalUrl.url);
  } else {
      return res.json({ error: 'invalid url' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
