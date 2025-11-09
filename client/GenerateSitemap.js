
import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';

const BASE_URL = 'https://ktanewhocansolve.com';

const staticRoutes = [
  '/',
  '/users',
  '/bombs',
  '/missions',    
];

async function generateSitemap() {
  const sitemap = new SitemapStream({ hostname: BASE_URL });
  const writeStream = createWriteStream('./public/sitemap.xml');

  staticRoutes.forEach((route) => {
    sitemap.write({
      url: route,
      changefreq: 'weekly',
      priority: route === '/' ? 1.0 : 0.8,
    });
  });

  sitemap.end();

  const data = await streamToPromise(sitemap);
  writeStream.write(data.toString());
}

generateSitemap();
