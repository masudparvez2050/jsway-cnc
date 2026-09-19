const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.jsway-cnc.com';
const TARGET_DIR = path.join(__dirname, '..', 'reference_site');

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// Helper to delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          ...(options.headers || {})
        },
        ...options
      });
      if (res.ok) return res;
      if (res.status === 404) return null;
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(1000 * (i + 1));
    }
  }
  return null;
}

// Concurrency queue
async function runConcurrent(items, concurrency, fn) {
  let index = 0;
  const results = [];
  async function worker() {
    while (index < items.length) {
      const i = index++;
      try {
        const res = await fn(items[i], i, items.length);
        results[i] = res;
      } catch (err) {
        console.error(`Error processing item ${i}:`, err.message);
        results[i] = null;
      }
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function collectUrls() {
  const sitemaps = [
    'https://www.jsway-cnc.com/page-sitemap.xml',
    'https://www.jsway-cnc.com/product-sitemap.xml',
    'https://www.jsway-cnc.com/video-sitemap.xml',
    'https://www.jsway-cnc.com/article-sitemap.xml'
  ];

  const urls = new Set();
  urls.add('https://www.jsway-cnc.com/');

  for (const sm of sitemaps) {
    try {
      console.log('Fetching sitemap:', sm);
      const res = await fetchWithRetry(sm);
      if (!res) continue;
      const text = await res.text();
      const matches = [...text.matchAll(/<loc>(https:\/\/www\.jsway-cnc\.com\/[^<]+)<\/loc>/g)].map(m => m[1]);
      for (const u of matches) {
        urls.add(u);
      }
    } catch (e) {
      console.error('Error fetching sitemap:', sm, e.message);
    }
  }
  return Array.from(urls);
}

// Download binary/text asset and save to disk
const downloadedAssets = new Set();

async function downloadAsset(assetUrl, relativePath) {
  if (downloadedAssets.has(relativePath)) return;
  downloadedAssets.add(relativePath);

  const localPath = path.join(TARGET_DIR, relativePath);
  const dir = path.dirname(localPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    const res = await fetchWithRetry(assetUrl);
    if (!res) return;
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(localPath, buffer);
    
    // If it is a CSS file, parse any url(...) inside it
    if (relativePath.endsWith('.css')) {
      const cssText = buffer.toString('utf8');
      const urlMatches = [...cssText.matchAll(/url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/gi)].map(m => m[1]);
      for (let matchedUrl of urlMatches) {
        if (matchedUrl.startsWith('data:') || matchedUrl.startsWith('#')) continue;
        matchedUrl = matchedUrl.split('?')[0].split('#')[0];
        
        let subAssetUrl;
        let subRelativePath;
        if (matchedUrl.startsWith('http://') || matchedUrl.startsWith('https://')) {
          subAssetUrl = matchedUrl;
          const parsed = new URL(matchedUrl);
          subRelativePath = path.join(parsed.hostname, parsed.pathname).replace(/\\/g, '/');
        } else if (matchedUrl.startsWith('/')) {
          subAssetUrl = BASE_URL + matchedUrl;
          subRelativePath = matchedUrl.replace(/^\/+/, '');
        } else {
          // relative to current css file
          const cssDir = path.dirname(relativePath);
          subRelativePath = path.join(cssDir, matchedUrl).replace(/\\/g, '/');
          subAssetUrl = BASE_URL + '/' + subRelativePath;
        }
        await downloadAsset(subAssetUrl, subRelativePath);
      }
    }
  } catch (err) {
    // skip failed asset
  }
}

async function scrapePage(pageUrl, index, total) {
  let fileName;
  if (pageUrl === BASE_URL || pageUrl === BASE_URL + '/') {
    fileName = 'index.html';
  } else {
    const urlObj = new URL(pageUrl);
    fileName = urlObj.pathname.replace(/^\/+/, '');
    if (!fileName.endsWith('.html')) {
      fileName = fileName + '.html';
    }
  }

  console.log(`[${index + 1}/${total}] Scraping: ${pageUrl} -> ${fileName}`);

  try {
    const res = await fetchWithRetry(pageUrl);
    if (!res) {
      console.warn(`404 or failed for: ${pageUrl}`);
      return;
    }
    let html = await res.text();

    // Extract assets from HTML
    const assetRegexes = [
      /<script[^>]+src=["']([^"']+)["']/gi,
      /<link[^>]+href=["']([^"']+)["']/gi,
      /<img[^>]+(?:src|data-src)=["']([^"']+)["']/gi,
      /<source[^>]+(?:src|srcset)=["']([^"']+)["']/gi
    ];

    const assetsToDownload = [];

    for (const regex of assetRegexes) {
      let match;
      while ((match = regex.exec(html)) !== null) {
        let assetUrl = match[1];
        if (!assetUrl || assetUrl.startsWith('data:') || assetUrl.startsWith('#') || assetUrl.startsWith('javascript:')) continue;
        if (assetUrl.includes('googletagmanager.com') || assetUrl.includes('google-analytics.com')) continue;

        assetUrl = assetUrl.split('?')[0].split('#')[0];

        let fullAssetUrl;
        let relativePath;

        if (assetUrl.startsWith('http://') || assetUrl.startsWith('https://')) {
          fullAssetUrl = assetUrl;
          const parsed = new URL(assetUrl);
          // Only download assets from jsway or its image cdn
          if (parsed.hostname.includes('jsway-cnc.com') || parsed.hostname.includes('yfisher.com') || parsed.hostname.includes('weyescloud.com')) {
            relativePath = path.join(parsed.hostname, parsed.pathname).replace(/\\/g, '/');
            assetsToDownload.push({ fullAssetUrl, relativePath });
          }
        } else if (assetUrl.startsWith('/')) {
          fullAssetUrl = BASE_URL + assetUrl;
          relativePath = assetUrl.replace(/^\/+/, '');
          assetsToDownload.push({ fullAssetUrl, relativePath });
        } else {
          fullAssetUrl = BASE_URL + '/' + assetUrl;
          relativePath = assetUrl;
          assetsToDownload.push({ fullAssetUrl, relativePath });
        }
      }
    }

    // Save page HTML
    const pageFilePath = path.join(TARGET_DIR, fileName);
    const dir = path.dirname(pageFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(pageFilePath, html, 'utf8');

    // Download page assets (with concurrency 5 for assets)
    for (const item of assetsToDownload) {
      await downloadAsset(item.fullAssetUrl, item.relativePath);
    }

  } catch (err) {
    console.error(`Failed to scrape ${pageUrl}:`, err.message);
  }
}

async function main() {
  console.log('--- Collecting all URLs from sitemaps ---');
  const allUrls = await collectUrls();
  console.log(`Total URLs found: ${allUrls.length}`);

  // Scrape all pages with concurrency of 8
  console.log('\n--- Starting Page Downloads ---');
  await runConcurrent(allUrls, 8, scrapePage);

  console.log('\n--- Scraping Finished! ---');
  console.log(`Total pages scraped: ${allUrls.length}`);
  console.log(`Total unique assets downloaded: ${downloadedAssets.size}`);
  console.log(`Files saved to: ${TARGET_DIR}`);
}

main().catch(err => {
  console.error('Fatal error in scraper:', err);
  process.exit(1);
});
