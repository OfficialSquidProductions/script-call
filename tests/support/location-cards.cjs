'use strict';
// Legacy form tests explicitly expand the new card before their original assertions.
async function expandLocations(page){for(const card of await page.locator('[data-location-card]').all())if(await card.getAttribute('open')===null)await card.locator(':scope > summary').click();}
module.exports={expandLocations};
