const ogs = require('open-graph-scraper');
const express = require('express');
var cors = require('cors')
const fs = require('fs');
const fetch = require('node-fetch');
const links = require('./jsons/urls.json');
const formidableMiddleware = require('express-formidable');
var randomstring = require("randomstring");
const app = express()
const port = 3000

app.use(cors());
app.use(express.static('/public'));
app.use(formidableMiddleware({
    uploadDir: './uploads/',
}));

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/api/add_url', async (req, res) => {

    // console.log(req.fields);
    // console.log(req.files);

    try { 
        Boolean(new URL(req.fields.url)); 
    }
    catch(e){ 
        res.json({
          error: 'URL is invalid'
        });
        return; 
    }

    const custom_slug = req.fields.custom_meta == 'true' ? req.fields.slug || randomstring.generate(5) : randomstring.generate(5);

    if ((custom_slug in links))
    {
        res.json({
            error: 'Custom URL already exist'
        });
        return;
    }

    const objectData = {
        url: req.fields.url,
        slug: custom_slug,
    }
    
    const og_data = await ogs({ url: req.fields.url }).catch((err) => {
        console.error(err);
        res.json({
            error: 'Error Fetching the website'
        });
        return;
    });

    const url = new URL(req.fields.url).origin;
    const temp_image_url_path = `uploads/upload_${custom_slug}`;
    
    if (!req.files.image)
    {
        const image_url = og_data.result.ogImage.url.indexOf(url, 0) === 0 ? og_data.result.ogImage.url : processUrl(url, og_data.result.ogImage.url);

        await download(image_url, temp_image_url_path);
    }

    // console.log(req.files.image.path);

    objectData['title'] = req.fields.title || og_data.result.ogTitle || '',
    objectData['description'] = req.fields.description || og_data.result.ogDescription || '',
    objectData['slug'] = custom_slug,
    objectData['image'] = req.files.image ? req.files.image.path.replace('public\\', '').replace('\\', '/') : temp_image_url_path;

    console.log(objectData);

    await addData(custom_slug, objectData);
    // console.log(og_data,.);

    res.json({success: custom_slug});
})

app.get('/api/r/:link', (req, res) => {
    
    const link = req.params.link;

    const data = links[link];

    if (!data)
    {
        res.sendStatus(404);
        return;
    }
    
    console.log(data);

    res.send(`
        <!doctype html>

        <html lang="en">
            <head>
                <meta charset="utf-8">
                <title>${data.title}</title>
                <!-- Primary Meta Tags -->
                <meta name="title" content="${data.title}">
                <meta name="description" content="${data.description}">

                <!-- Open Graph / Facebook -->
                <meta property="og:type" content="website">
                <meta property="og:url" content="${data.url}">
                <meta property="og:title" content="${data.title}">
                <meta property="og:description" content="${data.description}">
                <meta property="og:image" content="${data.image}">

                <!-- Twitter -->
                <meta property="twitter:card" content="summary_large_image">
                <meta property="twitter:url" content="${data.url}">
                <meta property="twitter:title" content="${data.title}">
                <meta property="twitter:description" content="${data.description}">
                <meta property="twitter:image" content="${data.image}">
                
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        min-height: 100vh;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    img {
                        width: 100px;
                    }
                </style>
            </head>
            
            <body>
                <img src="../img/preloader.svg">


                <script>
                    setTimeout(()=>{
                        window.location.replace('${data.url}');
                        window.location.href = '${data.url}';
                    }, 10000);
                </script>
            </body>
        </html>
    `);

    // res.send(`You're visiting ${data || 'Not found'}`)
})

app.get('*', function(req, res){
    res.status(404).send(`
    <!doctype html>

    <html lang="en">
        <head>
            <meta charset="utf-8">
            
            <title>404 | RCDL.GA</title>
            <!-- Primary Meta Tags -->
            <meta name="title" content="404 | RCDL.GA">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                h4 {
                    font-size: 30px;
                    color: red;
                    font-family: sans-serif;
                }
                p {
                    font-size: 18px;
                    color: black;
                    font-family: sans-serif;
                }
            </style>
        </head>
        
        <body>
            <div style="text-align: center">
                <h4>404: Not Found</h4>
                <p>Ooops! you navigated to a non-existing page</p>
            </div>
        </body>
    </html>
`);
  });

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

function processUrl(url, og_image)
{
    let image = og_image;
    if (og_image.indexOf('/') !== 0)
    {
        image = '/' + og_image;
    }

    return url + image;
}

async function download(url, file) {
    const response = await fetch(url);
    const buffer = await response.buffer();
    fs.writeFile(file, buffer, () => 
      console.log('finished downloading!'));
}

async function addData(id, dataObject)
{
    const json_path = './jsons/urls.json';

    var data = await fs.readFileSync(json_path);
    var myObject= JSON.parse(data);

    myObject[id] = dataObject;



    var newData = JSON.stringify(myObject, false, 4);
    fs.writeFile(json_path, newData, err => {
        // error checking
        if(err) throw err;
        
        console.log("New data added");
    });   
}

module.exports = app;