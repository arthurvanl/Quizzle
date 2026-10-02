const pdfParse = require('pdf-parse');

const MAX_TEXT_LEN = 60000;

const stripHtml = (html) => {
    if (!html) return '';
    let out = html;
    out = out.replace(/<script[\s\S]*?<\/script>/gi, ' ');
    out = out.replace(/<style[\s\S]*?<\/style>/gi, ' ');
    out = out.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');
    out = out.replace(/<!--([\s\S]*?)-->/g, ' ');
    out = out.replace(/<\/(p|div|section|article|header|footer|li|h[1-6]|br|tr|td|th)>/gi, '\n');
    out = out.replace(/<br\s*\/?>/gi, '\n');
    out = out.replace(/<[^>]+>/g, ' ');
    out = out.replace(/&nbsp;/g, ' ');
    out = out.replace(/&amp;/g, '&');
    out = out.replace(/&lt;/g, '<');
    out = out.replace(/&gt;/g, '>');
    out = out.replace(/&quot;/g, '"');
    out = out.replace(/&#39;/g, "'");
    out = out.replace(/&[a-z0-9#]+;/gi, ' ');
    out = out.replace(/[ \t]+/g, ' ');
    out = out.replace(/\n\s*\n+/g, '\n\n');
    return out.trim();
};

const extractTitle = (html) => {
    const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    if (og?.[1]) return og[1].trim();
    const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (t?.[1]) return t[1].trim();
    return '';
};

const isPrivateHostname = (hostname) => {
    const h = hostname.toLowerCase();
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '0.0.0.0') return true;
    if (/^10\./.test(h)) return true;
    if (/^192\.168\./.test(h)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
    if (/^169\.254\./.test(h)) return true;
    if (/\.local$/.test(h)) return true;
    return false;
};

const validatePublicHttpUrl = (urlString) => {
    let parsed;
    try {
        parsed = new URL(urlString);
    } catch {
        throw new Error('Invalid URL.');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Only http(s) URLs are allowed.');
    }
    if (isPrivateHostname(parsed.hostname)) {
        throw new Error('This URL cannot be processed for security reasons.');
    }
    return parsed;
};

const extractFromUrl = async (urlString) => {
    const parsed = validatePublicHttpUrl(urlString);
    const response = await fetch(parsed.toString(), {
        signal: AbortSignal.timeout(15000),
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; QuizzleBot/1.0)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        redirect: 'follow'
    });
    if (!response.ok) throw new Error(`Failed to load URL (${response.status}).`);

    const contentType = response.headers.get('content-type') || '';
    if (!/(text\/html|application\/xhtml|text\/plain|application\/xml|text\/xml)/i.test(contentType)) {
        throw new Error('This URL content type is not supported.');
    }

    const raw = await response.text();
    const title = extractTitle(raw);
    const text = stripHtml(raw).slice(0, MAX_TEXT_LEN);
    if (text.length < 80) throw new Error('The URL contains no usable text.');

    return { title: title || parsed.hostname, text, source: parsed.toString() };
};

const extractFromWikipedia = async (query, lang = 'en') => {
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
        throw new Error('Wikipedia search term is required.');
    }
    const safeLang = /^[a-z]{2,8}$/i.test(lang) ? lang.toLowerCase() : 'en';

    let pageTitle = query.trim();
    try {
        const searchUrl = `https://${safeLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(pageTitle)}&format=json&srlimit=1&origin=*`;
        const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
        if (searchRes.ok) {
            const sdata = await searchRes.json();
            const hit = sdata?.query?.search?.[0];
            if (hit?.title) pageTitle = hit.title;
        }
    } catch {}

    const extractUrl = `https://${safeLang}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&redirects=1&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`;
    const res = await fetch(extractUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error('Failed to load Wikipedia article.');
    const data = await res.json();
    const pages = data?.query?.pages || {};
    const page = Object.values(pages)[0];
    if (!page || page.missing !== undefined) throw new Error('Wikipedia article not found.');
    const text = (page.extract || '').trim().slice(0, MAX_TEXT_LEN);
    if (text.length < 80) throw new Error('The article found contains no usable text.');
    return { title: page.title, text, source: `https://${safeLang}.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}` };
};

const extractFromPdf = async (base64) => {
    if (!base64 || typeof base64 !== 'string') throw new Error('PDF data missing.');
    const cleaned = base64.replace(/^data:[^,]+,/, '');
    let buffer;
    try {
        buffer = Buffer.from(cleaned, 'base64');
    } catch {
        throw new Error('PDF data could not be decoded.');
    }
    if (buffer.length === 0) throw new Error('PDF file is empty.');
    if (buffer.length > 25 * 1024 * 1024) throw new Error('PDF is too large (max 25 MB).');
    if (buffer.slice(0, 4).toString() !== '%PDF') throw new Error('File is not a valid PDF.');

    const result = await pdfParse(buffer, { max: 0 });
    const text = (result.text || '')
        .replace(/\u0000/g, '')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n+/g, '\n\n')
        .trim()
        .slice(0, MAX_TEXT_LEN);
    if (text.length < 80) throw new Error('No usable text could be extracted from the PDF.');
    const title = (result.info?.Title || '').trim();
    return { title, text, source: 'pdf' };
};

module.exports = { extractFromUrl, extractFromWikipedia, extractFromPdf };
