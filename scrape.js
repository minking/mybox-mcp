import fs from 'fs';
import * as cheerio from 'cheerio';

const slugs = [
  'dms_storage', 'dms_root', 'dms_list', 'dms_resourceId', 'files_create_folder',
  'files_upload', 'files_download', 'files_copy', 'files_delete', 'files_move',
  'files_rename', 'dms_favorite', 'dms_unfavorite', 'search_files_resources',
  'search_folders_resources', 'dms_trash_list', 'files_trash_restore',
  'files_trash_clean_resourceId', 'files_trash_clean', 'dms_trash_routine'
];

async function run() {
  const apis = {};
  for (const slug of slugs) {
    const url = `https://developers.mybox.naver.com/docs/${slug}`;
    console.log(`Fetching ${url}...`);
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Naver MYBOX API docs usually have "Request" and "Response" sections.
    // We are interested in "Request" -> "Path Parameters", "Query Parameters", "Body".
    const apiInfo = { url, method: 'GET', endpoint: '', parameters: [] };
    
    // Find the API method and endpoint which are usually in a code block or similar.
    // For MYBOX, they typically have something like GET /api/v1/storage
    const methodEndpointStr = $('.document_api_path').text().trim() || $('.document_section .language-http').text().trim() || $('h3:contains("API")').next().text().trim();
    if (methodEndpointStr) {
      const parts = methodEndpointStr.split(' ');
      if (parts.length >= 2) {
        apiInfo.method = parts[0];
        apiInfo.endpoint = parts.slice(1).join(' ').trim();
      } else {
        apiInfo.methodEndpointStr = methodEndpointStr;
      }
    }
    
    // Extract Tables under Request
    let requestSection = false;
    $('h3, h4, table').each((i, el) => {
      const tag = $(el).prop('tagName').toLowerCase();
      if (tag === 'h3' || tag === 'h4') {
        const text = $(el).text().trim();
        if (text.includes('Request')) requestSection = true;
        else if (text.includes('Response')) requestSection = false;
      } else if (tag === 'table' && requestSection) {
        // Parse table
        const rows = [];
        $(el).find('tbody tr').each((j, tr) => {
          const cells = $(tr).find('td').map((k, td) => $(td).text().trim()).get();
          if (cells.length >= 4) { // Field, Type, Mandatory, Description
            rows.push({
              field: cells[0],
              type: cells[1],
              mandatory: cells[2],
              description: cells[3]
            });
          } else if (cells.length === 3) {
            rows.push({
              field: cells[0],
              type: cells[1],
              description: cells[2]
            });
          }
        });
        apiInfo.parameters.push(...rows);
      }
    });
    
    apis[slug] = apiInfo;
  }
  
  fs.writeFileSync('apis.json', JSON.stringify(apis, null, 2));
  console.log('Saved to apis.json');
}

run().catch(console.error);
