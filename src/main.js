const { Actor } = require('apify');
const axios = require('axios');
const cheerio = require('cheerio');

Actor.main(async () => {
  const input = await Actor.getInput();
  const { cities, category = 'sss', query = '', maxItems = 30 } = input;
  
  console.log('Starting Craigslist scraper...');
  console.log('Cities:', cities);
  console.log('Category:', category);
  console.log('Query:', query);
  console.log('Max items:', maxItems);
  
  const results = [];
  const proxyConfiguration = await Actor.createProxyConfiguration({
    groups: ['BUYPROXIES94952']
  });
  
  for (const city of cities) {
    if (results.length >= maxItems) break;
    
    try {
      const queryParam = query ? `&query=${encodeURIComponent(query)}` : '';
      const searchUrl = `https://${city}.craigslist.org/search/${category}?sort=date${queryParam}`;
      
      const response = await axios.get(searchUrl, {
        proxy: proxyConfiguration.createProxyUrl(),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      
      const $ = cheerio.load(response.data);
      const posts = $('.result-row');
      
      posts.each((i, el) => {
        if (results.length >= maxItems) return false;
        
        const title = $(el).find('.result-title').text().trim() || '';
        const price = $(el).find('.result-price').text().trim() || '';
        const location = $(el).find('.result-hood').text().trim() || '';
        const date = $(el).find('.result-date').attr('datetime') || '';
        const imageUrl = $(el).find('.result-image img').attr('src') || '';
        const postUrl = $(el).find('.result-title').attr('href') || '';
        const postId = $(el).attr('data-pid') || '';
        
        results.push({
          title,
          price,
          location,
          date,
          imageUrl,
          postUrl: postUrl.startsWith('http') ? postUrl : `https://${city}.craigslist.org${postUrl}`,
          postId,
          city,
          category
        });
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error scraping city "${city}":`, error.message);
    }
  }
  
  await Actor.pushData(results);
  console.log('Scraping completed. Total results:', results.length);
});