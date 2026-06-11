/* ==========================================================================
   Foursquare National Evangelist (FONE) - Testimony Wall Controller
   Dual Database: Firebase Firestore / LocalStorage (demo fallback)
   ========================================================================== */

/* ---- Sample seed testimonies for demo mode ---- */
const sampleTestimonies = [
  {
    id: "test-sample-1",
    name: "Sister Adunola",
    category: "Healing",
    text: "Praise the Lord! My son was diagnosed with a severe liver condition in March. We brought it to the Hours of Dominion prayer session and joined the FONE prayer wall. Three weeks later, the doctors ran a second round of tests and found NO trace of the disease. The specialist said he had never seen anything like it. Jesus is still the Healer!",
    amenCount: 47,
    isApproved: true,
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000)
  },
  {
    id: "test-sample-2",
    name: "Evang. Tobi Rasheed",
    category: "Financial",
    text: "For two years my business was stagnant — no sales, mounting debts. I attended the Osan Kan Oru Kan program and sowed in prayer. Within 30 days a contract I had forgotten about was suddenly renewed with triple the original value. God is faithful beyond words! Don't stop praying, family.",
    amenCount: 63,
    isApproved: true,
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000)
  },
  {
    id: "test-sample-3",
    name: "Mrs. Blessing Okafor",
    category: "Fruitfulness",
    text: "After 7 years of waiting and attending Joyful Mothers quarterly programs, I am testifying today with tears of joy — I am 5 months pregnant with twin boys! We were told medically it was nearly impossible. God proved every medical report wrong. To every mother waiting, hold on. Your miracle is coming!",
    amenCount: 112,
    isApproved: true,
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000),
    featured: true
  },
  {
    id: "test-sample-4",
    name: "Anonymous",
    category: "Deliverance",
    text: "I was trapped in a cycle of addiction for 6 years. I attended the Monthly Vigil and received personal counseling and deliverance prayer from the FONE team. That night something broke. I have been completely free for 8 months now. Glory be to God!",
    amenCount: 38,
    isApproved: true,
    createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000)
  },
  {
    id: "test-sample-5",
    name: "Bro. Emmanuel Nwosu",
    category: "Marriage",
    text: "My wife and I were on the verge of separation after years of misunderstanding. The counseling and deliverance sessions at Hours of Dominion restored our home. Today we celebrate 2 years of renewed vows and a stronger marriage than ever. Thank God for FONE!",
    amenCount: 29,
    isApproved: true,
    createdAt: new Date(Date.now() - 18 * 24 * 3600 * 1000)
  }
];

/* ---- State ---- */
let isTestFirebaseActive = false;
let testDb = null;
let testimoniesCache = [];
let activeFilter = 'All';
let searchQuery = '';

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', () => {
  initTestimonyPage();
});

function initTestimonyPage() {
  const form = document.getElementById('testimony-form');
  if (!form) return; // safety guard

  // Category pill selection
  const catPills = document.querySelectorAll('.cat-pill');
  const catInput = document.getElementById('test-category');
  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      catInput.value = pill.getAttribute('data-cat');
    });
  });

  // Filter pills
  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.getAttribute('data-filter');
      renderTestimonies();
    });
  });

  // Search
  const searchInput = document.getElementById('testimony-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.toLowerCase().trim();
      renderTestimonies();
    });
  }

  // Form submission
  form.addEventListener('submit', handleTestimonySubmit);

  // Try Firebase
  if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey !== 'YOUR_API_KEY') {
    try {
      // Try to get existing app or initialize
      try {
        firebase.app();
      } catch(e) {
        firebase.initializeApp(firebaseConfig);
      }
      testDb = firebase.firestore();
      isTestFirebaseActive = true;
      console.log("Testimony: Connected to Firebase.");
    } catch (error) {
      console.warn("Testimony: Firebase not available, using LocalStorage.", error);
      isTestFirebaseActive = false;
    }
  }

  loadTestimonies();
}

/* ---- Load ---- */
function loadTestimonies() {
  if (isTestFirebaseActive) {
    testDb.collection('testimonies')
      .where('isApproved', '==', true)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        testimoniesCache = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          testimoniesCache.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
          });
        });
        hideLoader();
        renderTestimonies();
        updateHeroStats();
      }, err => {
        console.error("Firebase testimony fetch error:", err);
        fallbackToLocalTestimonies();
      });
  } else {
    fallbackToLocalTestimonies();
  }
}

function fallbackToLocalTestimonies() {
  hideLoader();
  let stored = localStorage.getItem('fone_testimonies');
  if (!stored) {
    localStorage.setItem('fone_testimonies', JSON.stringify(sampleTestimonies));
    testimoniesCache = [...sampleTestimonies];
  } else {
    try {
      testimoniesCache = JSON.parse(stored).map(t => ({
        ...t,
        createdAt: new Date(t.createdAt)
      }));
    } catch(e) {
      testimoniesCache = [...sampleTestimonies];
    }
  }
  testimoniesCache.sort((a, b) => b.createdAt - a.createdAt);
  renderTestimonies();
  updateHeroStats();
}

function hideLoader() {
  const loader = document.getElementById('testimony-loader');
  if (loader) loader.style.display = 'none';
}

/* ---- Render ---- */
function renderTestimonies() {
  const feed = document.getElementById('testimony-feed');
  const emptyState = document.getElementById('testimony-empty');
  const countEl = document.getElementById('testimony-feed-count');
  if (!feed) return;

  // Remove existing cards
  feed.querySelectorAll('.testimony-card').forEach(c => c.remove());

  // Filter
  const filtered = testimoniesCache.filter(t => {
    if (t.isApproved === false) return false;
    const catMatch = activeFilter === 'All' || t.category === activeFilter;
    const searchMatch = !searchQuery ||
      (t.text && t.text.toLowerCase().includes(searchQuery)) ||
      (t.name && t.name.toLowerCase().includes(searchQuery));
    return catMatch && searchMatch;
  });

  if (countEl) {
    countEl.textContent = `${filtered.length} testimon${filtered.length === 1 ? 'y' : 'ies'}`;
  }

  if (filtered.length === 0) {
    if (emptyState) emptyState.classList.remove('id-hidden');
    return;
  }
  if (emptyState) emptyState.classList.add('id-hidden');

  filtered.forEach(t => {
    const card = buildTestimonyCard(t);
    feed.appendChild(card);
  });
}

function buildTestimonyCard(t) {
  const card = document.createElement('div');
  card.className = 'testimony-card' + (t.featured ? ' featured' : '');
  card.setAttribute('data-id', t.id);

  const initials = (t.name && t.name !== 'Anonymous')
    ? t.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '✦';

  const timeAgo = formatTimeAgo(t.createdAt);
  const amenCount = t.amenCount || 0;
  const hasAmened = localStorage.getItem(`amened_${t.id}`) === 'true';

  card.innerHTML = `
    ${t.featured ? `<div class="featured-badge"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Featured Testimony</div>` : ''}
    <div class="testimony-card-header">
      <div class="testimony-card-user">
        <div class="testimony-avatar">${escapeHTML(initials)}</div>
        <div>
          <div class="testimony-user-name">${escapeHTML(t.name || 'Anonymous')}</div>
          <div class="testimony-time">${timeAgo}</div>
        </div>
      </div>
      <span class="testimony-category-tag tag-${escapeHTML(t.category || 'General')}">${escapeHTML(t.category || 'General')}</span>
    </div>
    <p class="testimony-text">${escapeHTML(t.text)}</p>
    <div class="testimony-card-actions">
      <button class="btn-amen ${hasAmened ? 'active' : ''}" onclick="handleAmenClick('${t.id}')" id="amen-btn-${t.id}" aria-label="Say Amen">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="${hasAmened ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        ${hasAmened ? 'Amen! 🙌' : 'Say Amen'}
      </button>
      <span class="amen-count" id="amen-count-${t.id}">${amenCount} Amen${amenCount !== 1 ? 's' : ''}</span>
    </div>
  `;
  return card;
}

/* ---- Amen button ---- */
window.handleAmenClick = function(id) {
  const hasAmened = localStorage.getItem(`amened_${id}`) === 'true';
  const btn = document.getElementById(`amen-btn-${id}`);
  const countEl = document.getElementById(`amen-count-${id}`);

  const t = testimoniesCache.find(x => x.id === id);
  if (!t) return;

  if (hasAmened) {
    localStorage.removeItem(`amened_${id}`);
    t.amenCount = Math.max(0, (t.amenCount || 0) - 1);
    if (btn) {
      btn.classList.remove('active');
      btn.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> Say Amen`;
    }
  } else {
    localStorage.setItem(`amened_${id}`, 'true');
    t.amenCount = (t.amenCount || 0) + 1;
    if (btn) {
      btn.classList.add('active');
      btn.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" stroke="currentColor" stroke-width="2.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> Amen! 🙌`;
      // Micro-animation
      btn.style.transform = 'scale(1.08)';
      setTimeout(() => { btn.style.transform = ''; }, 200);
    }
  }

  if (countEl) {
    const n = t.amenCount;
    countEl.textContent = `${n} Amen${n !== 1 ? 's' : ''}`;
  }

  // Persist
  if (isTestFirebaseActive) {
    testDb.collection('testimonies').doc(id).update({
      amenCount: firebase.firestore.FieldValue.increment(hasAmened ? -1 : 1)
    });
  } else {
    persistLocalTestimonies();
  }

  updateHeroStats();
};

/* ---- Submit form ---- */
function handleTestimonySubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById('test-name');
  const categoryInput = document.getElementById('test-category');
  const textInput = document.getElementById('test-text');
  const submitBtn = document.getElementById('btn-submit-testimony');
  const successBox = document.getElementById('testimony-success-box');

  const nameVal = nameInput.value.trim() || 'Anonymous';
  const categoryVal = categoryInput.value || 'General';
  const textVal = textInput.value.trim();

  if (!textVal) return;

  submitBtn.disabled = true;
  submitBtn.querySelector('span').textContent = 'Sharing...';

  const newTestimony = {
    name: nameVal,
    category: categoryVal,
    text: textVal,
    amenCount: 0,
    isApproved: true
  };

  if (isTestFirebaseActive) {
    testDb.collection('testimonies').add({
      ...newTestimony,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      onTestimonySuccess();
    }).catch(err => {
      console.error("Firebase testimony submit error:", err);
      submitBtn.disabled = false;
      submitBtn.querySelector('span').textContent = 'Share My Testimony';
    });
  } else {
    const localTestimony = {
      id: 'local-test-' + Date.now(),
      ...newTestimony,
      createdAt: new Date()
    };
    testimoniesCache.unshift(localTestimony);
    persistLocalTestimonies();
    setTimeout(() => {
      onTestimonySuccess();
      renderTestimonies();
      updateHeroStats();
    }, 500);
  }

  function onTestimonySuccess() {
    nameInput.value = '';
    textInput.value = '';
    // reset category to General
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('selected'));
    document.querySelector('.cat-pill[data-cat="General"]').classList.add('selected');
    categoryInput.value = 'General';

    submitBtn.disabled = false;
    submitBtn.querySelector('span').textContent = 'Share My Testimony';

    successBox.classList.remove('id-hidden');
    setTimeout(() => { successBox.classList.add('id-hidden'); }, 6000);
  }
}

/* ---- Helpers ---- */
function updateHeroStats() {
  const countEl = document.getElementById('hero-testimony-count');
  const amenEl = document.getElementById('hero-amen-count');
  if (countEl) countEl.textContent = testimoniesCache.filter(t => t.isApproved !== false).length;
  if (amenEl) {
    const total = testimoniesCache.reduce((acc, t) => acc + (t.amenCount || 0), 0);
    amenEl.textContent = total;
  }
}

function persistLocalTestimonies() {
  localStorage.setItem('fone_testimonies', JSON.stringify(testimoniesCache));
}

function formatTimeAgo(date) {
  if (!date) return '';
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
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
