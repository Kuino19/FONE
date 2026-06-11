/* ==========================================================================
   Foursquare National Evangelist (FONE) Application Script
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
   4. Prayer Wall Controller (Dual Database: Firebase / LocalStorage)
   ========================================================================== */
let isFirebaseActive = false;
let db = null;
let prayersCache = []; // Local cache of items for search/filtering

// Sample data to initialize local DB if Firebase isn't present
const samplePrayers = [
  {
    id: "sample-1",
    name: "Sister Esther",
    category: "Healing",
    text: "Please pray for my mother who was diagnosed with a severe kidney issue. We believe in the healing stripe of Jesus Christ for absolute restoration. Amen.",
    isApproved: true,
    prayerCount: 14,
    createdAt: new Date(Date.now() - 4 * 3600 * 1000) // 4 hours ago
  },
  {
    id: "sample-2",
    name: "Anonymous",
    category: "Deliverance",
    text: "I am asking for prayers to break free from stagnation in my career and spiritual life. Let the fire of the Holy Spirit clear every roadblock.",
    isApproved: true,
    prayerCount: 29,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000) // 1 day ago
  },
  {
    id: "sample-3",
    name: "Brother David O.",
    category: "Mothers",
    text: "Standing in agreement with my wife for the fruit of the womb. We trust God that by this time next year, our Joyful Mother testimony will manifest.",
    isApproved: true,
    prayerCount: 22,
    createdAt: new Date(Date.now() - 48 * 3600 * 1000) // 2 days ago
  }
];

function initPrayerWall() {
  // Setup event listeners
  const form = document.getElementById('prayer-form');
  const searchInput = document.getElementById('wall-search');
  const filterSelect = document.getElementById('wall-filter');

  // Safety Guard: Exit if prayer wall elements are missing on this page
  if (!form) {
    return;
  }

  // Try to initialize Firebase
  if (typeof firebase !== 'undefined' && firebaseConfig && firebaseConfig.apiKey !== 'YOUR_API_KEY') {
    try {
      firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      isFirebaseActive = true;
      console.log("FONE Website: Connected successfully to Firebase Firestore.");
    } catch (error) {
      console.error("Firebase init failed, switching to LocalStorage mode.", error);
      isFirebaseActive = false;
    }
  } else {
    console.log("Firebase not configured. Running in client-side LocalStorage mode.");
    isFirebaseActive = false;
  }

  if (searchInput) searchInput.addEventListener('input', handleFilterChange);
  if (filterSelect) filterSelect.addEventListener('change', handleFilterChange);
  form.addEventListener('submit', handleFormSubmit);

  // Load Feed
  loadPrayerFeed();
}

// Fetch and stream prayer requests
function loadPrayerFeed() {
  const loader = document.getElementById('wall-loader');
  const emptyState = document.getElementById('wall-empty-state');
  const feedContainer = document.getElementById('prayer-feed');

  if (isFirebaseActive) {
    // Live stream approved prayers sorted by createdAt descending
    db.collection('prayers')
      .where('isApproved', '==', true)
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        loader.classList.add('id-hidden');
        prayersCache = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Convert firestore timestamp to JS Date
          const date = data.createdAt ? data.createdAt.toDate() : new Date();
          prayersCache.push({
            id: doc.id,
            ...data,
            createdAt: date
          });
        });

        renderFeed();
        updateStats();
      }, (error) => {
        console.error("Error fetching live prayers:", error);
        fallbackToLocal();
      });
  } else {
    // LocalStorage Mode
    fallbackToLocal();
  }

  function fallbackToLocal() {
    loader.classList.add('id-hidden');
    
    // Load local storage
    let stored = localStorage.getItem('fone_prayers');
    if (!stored) {
      // Populate with samples
      localStorage.setItem('fone_prayers', JSON.stringify(samplePrayers));
      prayersCache = [...samplePrayers];
    } else {
      try {
        prayersCache = JSON.parse(stored).map(p => ({
          ...p,
          createdAt: new Date(p.createdAt)
        }));
      } catch (e) {
        prayersCache = [...samplePrayers];
      }
    }
    
    // Sort descending
    prayersCache.sort((a, b) => b.createdAt - a.createdAt);
    
    renderFeed();
    updateStats();
  }
}

// Render dynamic elements to DOM
function renderFeed() {
  const feedContainer = document.getElementById('prayer-feed');
  const emptyState = document.getElementById('wall-empty-state');
  const activeCountEl = document.getElementById('active-wall-count');

  // Safety Guard: Exit if prayer feed elements are missing on this page
  if (!feedContainer || !emptyState || !activeCountEl) {
    return;
  }
  
  const searchInput = document.getElementById('wall-search');
  const filterSelect = document.getElementById('wall-filter');
  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const filterVal = filterSelect ? filterSelect.value : 'All';

  // Remove existing cards (leaving loader and emptyState hidden elements)
  const cards = feedContainer.querySelectorAll('.prayer-card');
  cards.forEach(card => card.remove());

  // Apply Filters
  const filtered = prayersCache.filter(p => {
    // Approved check (only relevant if local)
    if (p.isApproved !== true) return false;
    
    // Category match
    const categoryMatches = (filterVal === 'All' || p.category === filterVal);
    
    // Search match
    const searchMatches = !searchVal || 
      p.text.toLowerCase().includes(searchVal) || 
      p.name.toLowerCase().includes(searchVal);
      
    return categoryMatches && searchMatches;
  });

  activeCountEl.textContent = `Showing ${filtered.length} prayer request${filtered.length === 1 ? '' : 's'}`;

  if (filtered.length === 0) {
    emptyState.classList.remove('id-hidden');
    return;
  }

  emptyState.classList.add('id-hidden');

  // Insert cards
  filtered.forEach(prayer => {
    const card = document.createElement('div');
    card.className = 'prayer-card glass-panel';
    card.setAttribute('data-id', prayer.id);

    // Format relative time
    const timeAgo = formatTimeAgo(prayer.createdAt);

    // Check if user has already clicked "Prayed" in this browser session
    const hasPrayed = localStorage.getItem(`prayed_${prayer.id}`) === 'true';

    card.innerHTML = `
      <div class="prayer-card-header">
        <div class="prayer-card-user">
          <span class="prayer-user-name">${escapeHTML(prayer.name || "Anonymous")}</span>
          <span class="prayer-time-stamp">${timeAgo}</span>
        </div>
        <span class="prayer-category-badge badge-${prayer.category}">${prayer.category}</span>
      </div>
      <div class="prayer-card-text">${escapeHTML(prayer.text)}</div>
      <div class="prayer-card-actions">
        <button class="btn-pray ${hasPrayed ? 'active' : ''}" onclick="handlePrayClick('${prayer.id}')">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <span class="btn-pray-text">${hasPrayed ? 'Prayed!' : 'I Prayed for This'}</span>
        </button>
        <span class="prayed-multiplier">
          <span class="multiplier-dot"></span>
          <span class="pray-count-text">${prayer.prayerCount || 0} times prayed</span>
        </span>
      </div>
    `;
    
    feedContainer.appendChild(card);
  });
}

// Update counters in Hero stats
function updateStats() {
  const totalPrayersEl = document.getElementById('hero-total-prayers');
  const totalPrayedEl = document.getElementById('hero-total-prayed-for');

  // Safety Guard: Exit if stats indicators are missing on this page
  if (!totalPrayersEl || !totalPrayedEl) {
    return;
  }

  const totalSubmitted = prayersCache.length;
  const totalPrayedCount = prayersCache.reduce((acc, curr) => acc + (curr.prayerCount || 0), 0);

  // Animate count up if numbers change
  animateNumber(totalPrayersEl, parseInt(totalPrayersEl.textContent) || 0, totalSubmitted, 800);
  animateNumber(totalPrayedEl, parseInt(totalPrayedEl.textContent) || 0, totalPrayedCount, 800);
}

// Handle request submission
function handleFormSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById('form-name');
  const emailInput = document.getElementById('form-email');
  const categorySelect = document.getElementById('form-category');
  const textInput = document.getElementById('form-text');
  const publicCheckbox = document.getElementById('form-public');
  const submitBtn = document.getElementById('btn-submit-request');
  const successBox = document.getElementById('form-success-box');

  const nameVal = nameInput.value.trim() || 'Anonymous';
  const emailVal = emailInput.value.trim() || '';
  const categoryVal = categorySelect.value;
  const textVal = textInput.value.trim();
  const isPublicVal = publicCheckbox.checked;

  if (!textVal) return;

  // Set loading state
  submitBtn.disabled = true;
  submitBtn.querySelector('span').textContent = 'Submitting...';

  const newPrayer = {
    name: nameVal,
    email: emailVal,
    category: categoryVal,
    text: textVal,
    isApproved: true, // Auto-approve by default, can hide via admin
    prayerCount: 0
  };

  if (isFirebaseActive) {
    db.collection('prayers').add({
      ...newPrayer,
      isPublic: isPublicVal,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      onSubmissionSuccess();
    })
    .catch((error) => {
      console.error("Firebase submit error:", error);
      submitBtn.disabled = false;
      submitBtn.querySelector('span').textContent = 'Submit Request';
      alert("Error submitting request. Please try again.");
    });
  } else {
    // LocalStorage submission
    const localPrayer = {
      id: 'local-' + Date.now() + Math.random().toString(36).substr(2, 5),
      ...newPrayer,
      isPublic: isPublicVal,
      createdAt: new Date()
    };

    let stored = localStorage.getItem('fone_prayers');
    let prayers = [];
    if (stored) {
      try { prayers = JSON.parse(stored); } catch(e) {}
    }
    prayers.push(localPrayer);
    localStorage.setItem('fone_prayers', JSON.stringify(prayers));

    // Re-trigger load and render
    setTimeout(() => {
      onSubmissionSuccess();
      loadPrayerFeed();
    }, 600); // Small delay for premium feel
  }

  function onSubmissionSuccess() {
    // Reset inputs
    nameInput.value = '';
    emailInput.value = '';
    textInput.value = '';
    categorySelect.selectedIndex = 0;
    publicCheckbox.checked = true;

    // Reset button
    submitBtn.disabled = false;
    submitBtn.querySelector('span').textContent = 'Submit Request';

    // Show custom alert success box
    successBox.classList.remove('id-hidden');
    if (!isPublicVal) {
      document.getElementById('success-msg').textContent = "Your request was submitted privately. Our counseling team will review it, and it will not appear on the public wall.";
    } else {
      document.getElementById('success-msg').textContent = "Your request is active. Our network of evangelists is interceding for you.";
    }

    setTimeout(() => {
      successBox.classList.add('id-hidden');
    }, 6000);
  }
}

// Triggered when clicking "I Prayed for This"
window.handlePrayClick = function(id) {
  const hasPrayed = localStorage.getItem(`prayed_${id}`) === 'true';
  const button = document.querySelector(`.prayer-card[data-id="${id}"] .btn-pray`);

  if (hasPrayed) {
    // Undo prayer count locally
    localStorage.removeItem(`prayed_${id}`);
    if (button) button.classList.remove('active');
    
    if (isFirebaseActive) {
      db.collection('prayers').doc(id).update({
        prayerCount: firebase.firestore.FieldValue.increment(-1)
      });
    } else {
      let stored = localStorage.getItem('fone_prayers');
      if (stored) {
        let prayers = JSON.parse(stored);
        let idx = prayers.findIndex(p => p.id === id);
        if (idx !== -1) {
          prayers[idx].prayerCount = Math.max(0, (prayers[idx].prayerCount || 0) - 1);
          localStorage.setItem('fone_prayers', JSON.stringify(prayers));
          loadPrayerFeed();
        }
      }
    }
  } else {
    // Add prayer count
    localStorage.setItem(`prayed_${id}`, 'true');
    if (button) button.classList.add('active');

    // Simple micro-animation on heart
    const svg = button.querySelector('svg');
    svg.style.transform = 'scale(1.4)';
    setTimeout(() => svg.style.transform = '', 200);

    if (isFirebaseActive) {
      db.collection('prayers').doc(id).update({
        prayerCount: firebase.firestore.FieldValue.increment(1)
      });
    } else {
      let stored = localStorage.getItem('fone_prayers');
      if (stored) {
        let prayers = JSON.parse(stored);
        let idx = prayers.findIndex(p => p.id === id);
        if (idx !== -1) {
          prayers[idx].prayerCount = (prayers[idx].prayerCount || 0) + 1;
          localStorage.setItem('fone_prayers', JSON.stringify(prayers));
          loadPrayerFeed();
        }
      }
    }
  }
};

function handleFilterChange() {
  renderFeed();
}

/* ==========================================================================
   5. Helper Utilities
   ========================================================================== */
function formatTimeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  
  // Format standard date
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function animateNumber(element, start, end, duration) {
  if (start === end) {
    element.textContent = end;
    return;
  }
  
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    element.textContent = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      element.textContent = end;
    }
  };
  window.requestAnimationFrame(step);
}
