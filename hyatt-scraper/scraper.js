const { chromium } = require('playwright');
const fs = require('fs');

const URLS = [
  'https://www.hyatt.com/shop/rooms/drelc?location=Dreams%20Los%20Cabos%20Suites%20Golf%20Resort%20%26%20Spa&checkinDate=2026-05-22&checkoutDate=2026-05-26&rooms=1&adults=1&kids=0&rate=Standard&rateFilter=woh',
  'https://www.hyatt.com/shop/rooms/seplc?location=Secrets%20Puerto%20Los%20Cabos%20Golf%20%26%20Spa%20Resort&checkinDate=2026-05-22&checkoutDate=2026-05-26&rooms=1&adults=1&kids=0&rate=Standard&rateFilter=woh',
  'https://www.hyatt.com/shop/rooms/sjdif?location=Hyatt%20Ziva%20Los%20Cabos&checkinDate=2026-05-22&checkoutDate=2026-05-26&rooms=1&adults=1&kids=0&rate=Standard&rateFilter=woh',
  'https://www.hyatt.com/shop/rooms/brcsl?location=Breathless%20Cabo%20San%20Lucas%20Resort%20%26%20Spa&checkinDate=2026-05-22&checkoutDate=2026-05-26&rooms=1&adults=1&kids=0&rate=Standard&rateFilter=woh',
  'https://www.hyatt.com/shop/rooms/zocdm?location=Zoetry%20Casa%20del%20Mar%20Los%20Cabos&checkinDate=2026-05-22&checkoutDate=2026-05-26&rooms=1&adults=1&kids=0&rate=Standard&rateFilter=woh',
];

const DELAY = (ms) => new Promise(r => setTimeout(r, ms));

async function dismissCookiePopup(page) {
  try {
    await page.evaluate(() => {
      document.getElementById('onetrust-consent-sdk')?.remove();
      document.querySelector('.onetrust-pc-dark-filter')?.remove();
      document.querySelector('#onetrust-accept-btn-handler')?.click();
    });
    await DELAY(300);
  } catch {}
}

async function extractRooms(page) {
  await dismissCookiePopup(page);
  return await page.evaluate(() => {
    const results = [];
    const cards = Array.from(document.querySelectorAll('div.room-card-inner'));
    for (const card of cards) {
      const roomName = card.querySelector('h3.room-title, h2.room-title, [data-locator="room-title"]')
        ?.textContent?.trim();
      if (!roomName) continue;

      const cardWrapper = card.closest('[class*="room-card"]') || card.parentElement;
      const imgEl = cardWrapper?.querySelector('img[src]');
      const roomImage = imgEl?.src || null;

      const description = card.querySelector('div.room_description, .truncate-text')
        ?.textContent?.trim() || null;

      const rateEl = card.querySelector('[data-locator="points-rate"] span.b-col-7');
      const rateType = rateEl?.textContent?.trim() || null;

      const pointsContainer = card.querySelector('[data-locator="points-rate"]');
      let points = null;
      if (pointsContainer) {
        const spans = Array.from(pointsContainer.querySelectorAll('span'));
        for (const span of spans) {
          const val = parseInt(span.textContent?.trim().replace(/,/g, ''), 10);
          if (!isNaN(val) && val >= 5000 && val <= 300000) {
            points = val;
            break;
          }
        }
      }

      const fullText = (roomName + ' ' + (description || '')).toLowerCase();
      const bedMatch = fullText.match(/\b(king|queen|two double|double bed|twin|double)\b/);

      results.push({
        roomName, roomImage, description, points, rateType,
        bedType: bedMatch?.[0] || null,
        available: points !== null,
      });
    }

    const seen = new Set();
    return results.filter(r => {
      const key = `${r.roomName}|${r.points}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });
}

async function scrapeUrl(page, url, index) {
  const u = new URL(url);
  const label = u.searchParams.get('location') || u.pathname.split('/').pop();
  console.log(`  [${index+1}/${URLS.length}] ${label}`);

  const result = {
    resortName: label, resortImage: null, description: null,
    checkIn: u.searchParams.get('checkinDate'),
    checkOut: u.searchParams.get('checkoutDate'),
    url, tabs: [], rooms: [], error: null,
  };

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    await DELAY(2000 + Math.random() * 1000);
    await dismissCookiePopup(page);

    // Check what loaded
    const pageState = await page.evaluate(() => {
      const hasCards = document.querySelectorAll('div.room-card-inner').length > 0;
      const noRooms = /No Available Rooms/i.test(document.body.innerText);
      return { hasCards, noRooms };
    });

    if (pageState.noRooms) {
      console.log(`    ⚠️  No award availability for these dates`);
      result.resortName = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim()) || label;
      return result;
    }

    if (!pageState.hasCards) {
      try {
        await page.waitForSelector('div.room-card-inner', { timeout: 15000 });
      } catch {
        console.log(`    ⚠️  No room cards found`);
      }
    } else {
      console.log(`    ✅ Room cards loaded`);
    }

    await dismissCookiePopup(page);

    result.resortName = await page.evaluate(() =>
      document.querySelector('h1')?.textContent?.trim()
    ) || label;

    result.resortImage = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img[src]'))
        .filter(img => img.naturalWidth > 400 && !img.src.includes('logo'));
      return imgs[0]?.src || null;
    });

    // Get tabs by exact class
    const tabInfo = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('span.room-type-text'))
        .map((span, i) => ({ index: i, label: span.textContent?.trim() }));
    });

    console.log(`    Tabs: ${tabInfo.length} — ${tabInfo.map(t => t.label).join(' | ') || 'none'}`);

    if (tabInfo.length <= 1) {
      const rooms = await extractRooms(page);
      result.tabs.push({ tabLabel: tabInfo[0]?.label || 'All Rooms', rooms });
      result.rooms = rooms;
      console.log(`    → ${rooms.length} rooms`);
    } else {
      for (let t = 0; t < tabInfo.length; t++) {
        console.log(`    → Tab ${t+1}: "${tabInfo[t].label}"`);

        await page.evaluate((idx) => {
          const spans = Array.from(document.querySelectorAll('span.room-type-text'));
          const clickable = spans[idx]?.closest('button, [role="tab"], li') || spans[idx];
          clickable?.click();
        }, t);

        await DELAY(1500);
        try { await page.waitForSelector('div.room-card-inner', { timeout: 6000 }); } catch {}
        await DELAY(500);
        await dismissCookiePopup(page);

        const rooms = await extractRooms(page);
        console.log(`       ${rooms.length} rooms`);
        result.tabs.push({ tabLabel: tabInfo[t].label, rooms });
        result.rooms.push(...rooms);
      }

      const seen = new Set();
      result.rooms = result.rooms.filter(r => {
        const key = `${r.roomName}|${r.points}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    console.log(`    ✅ ${result.rooms.length} unique rooms, ${result.rooms.filter(r => r.available).length} with points`);
  } catch(e) {
    result.error = e.message.split('\n')[0];
    console.log(`    ERROR: ${result.error}`);
  }
  return result;
}

async function main() {
  console.log('🏨 Hyatt Scraper v3 — 5 URLs, 1 incognito session\n');

  let browser;
  try {
    browser = await chromium.connectOverCDP('http://localhost:9222');
    console.log('✅ Connected to Chrome\n');
  } catch(e) {
    console.error('❌ Cannot connect. Run this first:');
    console.error('/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --user-data-dir="/tmp/hyatt-chrome-session"');
    process.exit(1);
  }

  // Single incognito context for all 5 URLs
  const context = await browser.newContext();
  console.log('🔒 Incognito session opened\n');

  // Warm up on hyatt.com first
  console.log('Warming up on hyatt.com...');
  const warmup = await context.newPage();
  try {
    await warmup.goto('https://www.hyatt.com', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await DELAY(2500);
    await warmup.mouse.move(500, 300);
    await DELAY(500);
    await warmup.mouse.move(700, 400);
    await DELAY(500);
  } catch(e) { console.log('Warmup issue:', e.message.split('\n')[0]); }
  await warmup.close();
  console.log('✅ Warmed up\n');

  const all = [];

  for (let i = 0; i < URLS.length; i++) {
    const page = await context.newPage();
    const result = await scrapeUrl(page, URLS[i], i);
    all.push(result);
    await page.close();

    if (i < URLS.length - 1) {
      const wait = 3000 + Math.random() * 2000;
      console.log(`\n  ⏳ Waiting ${(wait/1000).toFixed(1)}s...\n`);
      await DELAY(wait);
    }
  }

  await context.close();
  console.log('\n🔒 Incognito session closed');

  fs.writeFileSync('hyatt-results.json', JSON.stringify(all, null, 2));

  console.log('\n═══════════════════════════════════════');
  console.log('RESULTS');
  console.log('═══════════════════════════════════════');
  let total = 0;
  for (const r of all) {
    const avail = r.rooms.filter(x => x.available).length;
    total += avail;
    const icon = r.error ? '❌' : avail > 0 ? '✅' : '⚠️ ';
    console.log(`\n${icon} ${r.resortName}`);
    if (r.error) { console.log(`   ${r.error}`); continue; }
    if (avail === 0) { console.log(`   No award availability`); continue; }
    for (const tab of r.tabs) {
      if (r.tabs.length > 1) console.log(`   [${tab.tabLabel}]`);
      for (const rm of tab.rooms.filter(x => x.available)) {
        console.log(`   • ${rm.roomName} — ${rm.points.toLocaleString()} pts · ${rm.rateType || ''}${rm.bedType ? ' · ' + rm.bedType : ''}`);
      }
    }
  }
  console.log(`\n───────────────────────────────────────`);
  console.log(`Total award rooms found: ${total}`);
  console.log(`Saved: hyatt-results.json ✅`);
}

main().catch(console.error);
