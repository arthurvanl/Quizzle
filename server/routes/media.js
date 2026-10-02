const app = require('express').Router();
const rateLimit = require('express-rate-limit');
const {getConfig} = require('../utils/file');

const mediaLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: {message: 'Too many requests. Please wait a moment.'}
});

app.use(mediaLimiter);

app.get('/status', (req, res) => {
    const config = getConfig();
    res.json({
        images: !!config?.media?.unsplashAccessKey,
        gifs: !!config?.media?.giphyApiKey
    });
});

app.get('/images', async (req, res) => {
    const {query, page = 1} = req.query;

    const config = getConfig();
    const accessKey = config?.media?.unsplashAccessKey;
    if (!accessKey) return res.status(501).json({message: 'Unsplash API key not configured.'});

    try {
        const url = query
            ? `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=30`
            : `https://api.unsplash.com/photos?page=${page}&per_page=30&order_by=popular`;
        const response = await fetch(url, {
            headers: {'Authorization': `Client-ID ${accessKey}`}
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Unsplash API error:', error);
            return res.status(response.status).json({message: 'Error searching for images.'});
        }

        const data = await response.json();
        const photos = query ? data.results : data;
        const results = photos.map(img => ({
            id: img.id,
            thumbnail: img.urls.small,
            url: img.urls.regular,
            alt: img.alt_description || img.description || '',
            author: img.user.name,
            authorUrl: img.user.links.html
        }));

        res.json({results, totalPages: query ? data.total_pages : undefined, total: query ? data.total : undefined});
    } catch (error) {
        console.error('Unsplash proxy error:', error);
        res.status(500).json({message: 'Error searching for images.'});
    }
});

app.get('/gifs', async (req, res) => {
    const {query, offset = 0} = req.query;

    const config = getConfig();
    const apiKey = config?.media?.giphyApiKey;
    if (!apiKey) return res.status(501).json({message: 'Giphy API key not configured.'});

    try {
        const endpoint = query
            ? `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=30&offset=${offset}&rating=g&lang=de`
            : `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=30&offset=${offset}&rating=g`;

        const response = await fetch(endpoint);

        if (!response.ok) {
            const error = await response.text();
            console.error('Giphy API error:', error);
            return res.status(response.status).json({message: 'Error searching for GIFs.'});
        }

        const data = await response.json();
        const results = data.data.map(gif => ({
            id: gif.id,
            thumbnail: gif.images.fixed_width.url,
            url: gif.images.original.url,
            alt: gif.title || '',
            width: parseInt(gif.images.original.width),
            height: parseInt(gif.images.original.height)
        }));

        res.json({results, total: data.pagination.total_count});
    } catch (error) {
        console.error('Giphy proxy error:', error);
        res.status(500).json({message: 'Error searching for GIFs.'});
    }
});

module.exports = app;
