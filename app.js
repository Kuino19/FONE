/* ==========================================================================
   Foursquare National Evangelists (FONE) Application Script
   Contains navigation, dynamic schedules, tab switching, and Firestore API
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initTabs();
  initCountdown();
  initPrayerWall();
});

/* ==========================================================================
   1. Navigation & Scroll Effects
   ========================================================================== */
function initNavigation() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');
  const navItems = document.querySelectorAll('.nav-item');

  // Shrink navbar on scroll
  const checkScroll = () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', checkScroll);
  checkScroll();

  // Toggle mobile menu
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  // Close mobile menu on item click & set active state
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
      
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });
}

/* ==========================================================================
   2. Leadership / Board Tabs
   ========================================================================== */
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(`${tabId}-panel`).classList.add('active');
    });
  });
}

/* ==========================================================================
   3. Program Countdown Timer (Dynamic Date Math)
   ========================================================================== */
const PROGRAMS = [
  {
    name: "Hours of Dominion & Counselling",
    type: "weekly",
    dayOfWeek: 2, // Tuesday
    hour: 12, // 12:00 PM
    minute: 0,
    calculateNext: (now) => {
      // Every Tuesday at 12:00 Noon
      let date = new Date(now);
      date.setDate(now.getDate() + (2 + 7 - now.getDay()) % 7);
      date.setHours(12, 0, 0, 0);
      if (date < now) {
        date.setDate(date.getDate() + 7);
      }
      return date;
    }
  },
  {
    name: "Group Prayer & Monthly Vigil",
    type: "monthly",
    calculateNext: (now) => {
      // First Monday of the month at 11:00 PM (23:00)
      const getFirstMonday = (year, month) => {
        let date = new Date(year, month, 1);
        while (date.getDay() !== 1) { // 1 is Monday
          date.setDate(date.getDate() + 1);
        }
        date.setHours(23, 0, 0, 0);
        return date;
      };

      let nextDate = getFirstMonday(now.getFullYear(), now.getMonth());
      if (nextDate < now) {
        // Next month
        nextDate = getFirstMonday(now.getFullYear(), now.getMonth() + 1);
      }
      return nextDate;
    }
  },
  {
    name: "Osan Kan Oru Kan (One Day One Night)",
    type: "quarterly",
    months: [2, 5, 8, 11], // March, June, September, December (0-indexed)
    calculateNext: (now) => {
      // 3rd Tuesday of March, June, Sept, Dec at 12:00 Noon
      const getThirdTuesday = (year, month) => {
        let date = new Date(year, month, 1);
        let count = 0;
        while (count < 3) {
          if (date.getDay() === 2) count++;
          if (count < 3) date.setDate(date.getDate() + 1);
        }
        date.setHours(12, 0, 0, 0);
        return date;
      };

      let candidates = [];
      const currentYear = now.getFullYear();
      const targetMonths = [2, 5, 8, 11]; // Mar, Jun, Sep, Dec

      // Generate candidates for this year and next year
      for (let y = currentYear; y <= currentYear + 1; y++) {
        for (let m of targetMonths) {
          let t = getThirdTuesday(y, m);
          if (t >= now) candidates.push(t);
        }
      }
      candidates.sort((a, b) => a - b);
      return candidates[0];
    }
  },
  {
    name: "Singles Night (Specialized Prayer)",
    type: "quarterly",
    months: [0, 3, 6, 9], // January, April, July, October
    calculateNext: (now) => {
      // 4th Tuesday of Jan, Apr, Jul, Oct at 12:00 Noon
      const getFourthTuesday = (year, month) => {
        let date = new Date(year, month, 1);
        let count = 0;
        while (count < 4) {
          if (date.getDay() === 2) count++;
          if (count < 4) date.setDate(date.getDate() + 1);
        }
        date.setHours(12, 0, 0, 0);
        return date;
      };

      let candidates = [];
      const currentYear = now.getFullYear();
      const targetMonths = [0, 3, 6, 9];

      for (let y = currentYear; y <= currentYear + 1; y++) {
        for (let m of targetMonths) {
          let t = getFourthTuesday(y, m);
          if (t >= now) candidates.push(t);
        }
      }
      candidates.sort((a, b) => a - b);
      return candidates[0];
    }
  },
  {
    name: "Joyful Mothers (Fruitfulness Prayer)",
    type: "quarterly",
    months: [1, 4, 7, 10], // February, May, August, November
    calculateNext: (now) => {
      // 3rd Tuesday of Feb, May, Aug, Nov at 12:00 Noon
      const getThirdTuesday = (year, month) => {
        let date = new Date(year, month, 1);
        let count = 0;
        while (count < 3) {
          if (date.getDay() === 2) count++;
          if (count < 3) date.setDate(date.getDate() + 1);
        }
        date.setHours(12, 0, 0, 0);
        return date;
      };

      let candidates = [];
      const currentYear = now.getFullYear();
      const targetMonths = [1, 4, 7, 10];

      for (let y = currentYear; y <= currentYear + 1; y++) {
        for (let m of targetMonths) {
          let t = getThirdTuesday(y, m);
          if (t >= now) candidates.push(t);
        }
      }
      candidates.sort((a, b) => a - b);
      return candidates[0];
    }
  }
];

function initCountdown() {
  const eventNameEl = document.getElementById('next-event-name');
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  // Safety Guard: Exit if countdown elements are missing on this page
  if (!eventNameEl || !daysEl || !hoursEl || !minutesEl || !secondsEl) {
    return;
  }

  function updateClock() {
    const now = new Date();
    
    // Calculate next dates for all programs and find the closest one
    let nextEvents = PROGRAMS.map(p => {
      return {
        name: p.name,
        nextDate: p.calculateNext(now)
      };
    });

    nextEvents.sort((a, b) => a.nextDate - b.nextDate);
    const targetEvent = nextEvents[0];
    
    if (!targetEvent) return;

    eventNameEl.textContent = targetEvent.name;

    const diff = targetEvent.nextDate - now;

    // Time calculations
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Format output
    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  updateClock();
  setInterval(updateClock, 1000);
}

/* ==========================================================================
   4. Prayer Wall Controller (Turso via Vercel API)
   ========================================================================== */
let prayersCache = [];

function initPrayerWall() {
  const form = document.getElementById('prayer-form');
  const filterSelect = document.getElementById('category-filter');
  const searchInput = document.getElementById('search-prayers');
  if (!form) return;

  if (searchInput) searchInput.addEventListener('input', handleFilterChange);
  if (filterSelect) filterSelect.addEventListener('change', handleFilterChange);
  form.addEventListener('submit', handleFormSubmit);

  loadPrayerFeed();
}

async function loadPrayerFeed() {
  const loader = document.getElementById('prayer-loader');
  const feed = document.getElementById('prayer-feed');
  if (!loader || !feed) return;

  loader.classList.remove('d-none');
  feed.innerHTML = '';

  try {
    const res = await fetch('/api/prayers');
    if (!res.ok) throw new Error('API Error');
    prayersCache = await res.json();
  } catch (err) {
    console.error('Failed to fetch from Turso API', err);
  }

  loader.classList.add('d-none');
  renderFeed();
}

function handleFilterChange() {
  renderFeed();
}

function renderFeed() {
  const feed = document.getElementById('prayer-feed');
  const filterSelect = document.getElementById('category-filter');
  const searchInput = document.getElementById('search-prayers');
  if (!feed) return;

  feed.innerHTML = '';
  
  const filterVal = filterSelect ? filterSelect.value : 'All';
  const searchVal = searchInput ? searchInput.value.toLowerCase() : '';

  let filtered = prayersCache.filter(p => {
    if (filterVal !== 'All' && p.category !== filterVal) return false;
    if (searchVal && (!p.text || !p.text.toLowerCase().includes(searchVal))) return false;
    if (p.isPublic === false) return false;
    if (p.isApproved === false) return false;
    return true;
  });

  if (filtered.length === 0) {
    feed.innerHTML = '<div class="empty-state">No prayer requests found. Be the first to share one.</div>';
    return;
  }

  filtered.forEach(prayer => {
    const card = document.createElement('div');
    card.className = 'prayer-card';
    card.setAttribute('data-id', prayer.id);
    
    let d = new Date(prayer.createdAt);
    if (isNaN(d)) d = new Date();
    const timeAgo = formatTimeAgo(d);

    const hasPrayed = localStorage.getItem('prayed_' + prayer.id) === 'true';

    card.innerHTML = `
      <div class="prayer-card-header">
        <div class="prayer-card-user">
          <span class="prayer-user-name">${escapeHTML(prayer.name || "Anonymous")}</span>
          <span class="prayer-time-stamp">${timeAgo}</span>
        </div>
        <span class="prayer-category-badge badge-${escapeHTML(prayer.category || 'general')}">${escapeHTML(prayer.category || 'General')}</span>
      </div>
      <div class="prayer-card-text">${escapeHTML(prayer.text || '')}</div>
      <div class="prayer-card-footer">
        <button class="btn-pray ${hasPrayed ? 'active' : ''}" onclick="handlePrayClick('${prayer.id}')">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="${hasPrayed ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span class="pray-count">${prayer.prayerCount || 0}</span> Praying
        </button>
      </div>
    `;
    feed.appendChild(card);
  });
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const ogText = btn.innerHTML;
  btn.innerHTML = 'Submitting...';
  btn.disabled = true;

  const categoryInput = document.getElementById('form-category');
  const nameInput = document.getElementById('prayer-name');
  const textInput = document.getElementById('prayer-text');
  const visibilitySelect = document.getElementById('prayer-visibility');

  const newPrayer = {
    id: 'fone-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    name: nameInput.value.trim() || 'Anonymous',
    category: categoryInput ? categoryInput.value : 'General',
    text: textInput.value.trim(),
    isPublic: visibilitySelect ? (visibilitySelect.value === 'public') : true
  };

  try {
    await fetch('/api/prayers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPrayer)
    });
    
    newPrayer.createdAt = new Date().toISOString();
    newPrayer.prayerCount = 0;
    prayersCache.unshift(newPrayer);
    
    e.target.reset();
    if(categoryInput) categoryInput.value = 'General';
    document.querySelectorAll('#prayer-cat-pills .cat-pill').forEach(p => p.classList.remove('selected'));
    const firstPill = document.querySelector('#prayer-cat-pills .cat-pill');
    if(firstPill) firstPill.classList.add('selected');
    
    renderFeed();
  } catch(err) {
    console.error(err);
    alert('Error submitting request. Please try again.');
  }

  btn.innerHTML = ogText;
  btn.disabled = false;
}

window.handlePrayClick = async function(id) {
  const hasPrayed = localStorage.getItem('prayed_' + id) === 'true';
  const button = document.querySelector(`.prayer-card[data-id="${id}"] .btn-pray`);
  const countSpan = button ? button.querySelector('.pray-count') : null;
  
  const prayer = prayersCache.find(p => p.id === id);
  if (!prayer) return;

  if (hasPrayed) {
    localStorage.removeItem('prayed_' + id);
    if (button) button.classList.remove('active');
    prayer.prayerCount = Math.max(0, (prayer.prayerCount || 0) - 1);
    if(countSpan) countSpan.textContent = prayer.prayerCount;
    
    fetch('/api/pray', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, increment: false })
    }).catch(console.error);

  } else {
    localStorage.setItem('prayed_' + id, 'true');
    if (button) {
      button.classList.add('active');
      const svg = button.querySelector('svg');
      if(svg) {
        svg.style.transform = 'scale(1.4)';
        setTimeout(() => svg.style.transform = '', 200);
      }
    }
    prayer.prayerCount = (prayer.prayerCount || 0) + 1;
    if(countSpan) countSpan.textContent = prayer.prayerCount;
    
    fetch('/api/pray', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, increment: true })
    }).catch(console.error);
  }
};

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag]));
}

function formatTimeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + 'm ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + 'h ago';
  const days = Math.floor(hours / 24);
  return days + 'd ago';
}

/* ==========================================================================
   Verse of the Day Feature
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initVerseOfTheDay();
});

function initVerseOfTheDay() {
  const textEl = document.getElementById('votd-text');
  const refEl = document.getElementById('votd-ref');
  if (!textEl || !refEl) return;

  const fallbackVerses = [
    { text: "For I am not ashamed of the gospel of Christ: for it is the power of God unto salvation to every one that believeth.", ref: "Romans 1:16" },
    { text: "And he said unto them, Go ye into all the world, and preach the gospel to every creature.", ref: "Mark 16:15" },
    { text: "If my people, which are called by my name, shall humble themselves, and pray, and seek my face, and turn from their wicked ways; then will I hear from heaven.", ref: "2 Chronicles 7:14" },
    { text: "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost.", ref: "Matthew 28:19" },
    { text: "Call unto me, and I will answer thee, and show thee great and mighty things, which thou knowest not.", ref: "Jeremiah 33:3" },
    { text: "But ye shall receive power, after that the Holy Ghost is come upon you: and ye shall be witnesses unto me both in Jerusalem, and in all Judaea, and in Samaria, and unto the uttermost part of the earth.", ref: "Acts 1:8" },
    { text: "The effectual fervent prayer of a righteous man availeth much.", ref: "James 5:16" },
    { text: "Also I heard the voice of the Lord, saying, Whom shall I send, and who will go for us? Then said I, Here am I; send me.", ref: "Isaiah 6:8" }
  ];

  // Rotate based on current day of year
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const selected = fallbackVerses[dayOfYear % fallbackVerses.length];
  textEl.textContent = `"${selected.text}"`;
  refEl.textContent = `— ${selected.ref}`;

  // Attempt live API fetch for dynamic daily verse
  fetch('https://labs.bible.org/api/?passage=votd&type=json')
    .then(r => r.json())
    .then(data => {
      if (data && data[0]) {
        const item = data[0];
        textEl.textContent = `"${item.text.trim()}"`;
        refEl.textContent = `— ${item.bookname} ${item.chapter}:${item.verse}`;
      }
    })
    .catch(() => {
      // Keep fallback
    });
}
