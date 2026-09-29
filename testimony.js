/* ==========================================================================
   Foursquare National Evangelists (FONE) - Testimony Wall Controller
   Turso via Vercel API
   ========================================================================== */

let testimoniesCache = [];
let currentCategoryFilter = 'All';

document.addEventListener('DOMContentLoaded', () => {
  initTestimonyWall();
});

window.switchMobileTestimonyTab = function(tab) {
  const feedBtn = document.getElementById('btn-test-feed');
  const formBtn = document.getElementById('btn-test-form');
  const feedPanel = document.querySelector('.testimony-feed-panel');
  const formPanel = document.querySelector('.testimony-form-panel');
  const fabBtn = document.getElementById('mobile-test-fab');

  if (tab === 'feed') {
    if (feedBtn) feedBtn.classList.add('active');
    if (formBtn) formBtn.classList.remove('active');
    if (feedPanel) feedPanel.classList.remove('mobile-hide');
    if (formPanel) formPanel.classList.add('mobile-hide');
    if (fabBtn) fabBtn.style.display = '';
  } else {
    if (formBtn) formBtn.classList.add('active');
    if (feedBtn) feedBtn.classList.remove('active');
    if (formPanel) formPanel.classList.remove('mobile-hide');
    if (feedPanel) feedPanel.classList.add('mobile-hide');
    if (fabBtn) fabBtn.style.display = 'none';
  }
};

function initTestimonyWall() {
  const form = document.getElementById('testimony-form');
  const searchInput = document.getElementById('testimony-search');
  
  if (form) {
    form.addEventListener('submit', handleTestimonySubmit);
  }
  if (searchInput) {
    searchInput.addEventListener('input', renderTestimonies);
  }

  // Setup Form Category Pills (.cat-pill)
  const formPills = document.querySelectorAll('.testimony-form-panel .cat-pill');
  const hiddenInput = document.getElementById('test-category');
  formPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      formPills.forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      if (hiddenInput) hiddenInput.value = pill.getAttribute('data-cat') || 'General';
    });
  });

  // Setup Feed Category Filter Bar (.filter-pill)
  const filterPills = document.querySelectorAll('.testimony-filter-bar .filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategoryFilter = pill.getAttribute('data-filter') || 'All';
      renderTestimonies();
    });
  });

  // Default mobile view to Feed
  if (window.innerWidth <= 768) {
    switchMobileTestimonyTab('feed');
  }

  loadTestimonies();
}

async function loadTestimonies() {
  const loader = document.getElementById('testimony-loader');
  const feed = document.getElementById('testimony-feed');
  const emptyState = document.getElementById('testimony-empty');
  if (!feed) return;

  if (loader) loader.classList.remove('id-hidden');
  if (emptyState) emptyState.classList.add('id-hidden');

  try {
    const res = await fetch('/api/testimonies');
    if (!res.ok) throw new Error('API Error');
    testimoniesCache = await res.json();
  } catch (err) {
    console.error('Failed to fetch testimonies from Turso', err);
  }

  if (loader) loader.classList.add('id-hidden');
  updateTestimonyStats();
  renderTestimonies();
}

function updateTestimonyStats() {
  const heroCount = document.getElementById('hero-testimony-count');
  const heroAmen = document.getElementById('hero-amen-count');

  if (heroCount) heroCount.textContent = testimoniesCache.length;
  if (heroAmen) {
    const totalAmens = testimoniesCache.reduce((sum, t) => sum + (t.amenCount || 0), 0);
    heroAmen.textContent = totalAmens;
  }
}

function renderTestimonies() {
  const feed = document.getElementById('testimony-feed');
  const searchInput = document.getElementById('testimony-search');
  const feedCountEl = document.getElementById('testimony-feed-count');
  const emptyState = document.getElementById('testimony-empty');
  if (!feed) return;

  const cards = feed.querySelectorAll('.testimony-card');
  cards.forEach(c => c.remove());

  const searchVal = searchInput ? searchInput.value.toLowerCase() : '';

  let filtered = testimoniesCache.filter(t => {
    if (currentCategoryFilter !== 'All' && t.category !== currentCategoryFilter) return false;
    if (searchVal && (!t.text || !t.text.toLowerCase().includes(searchVal)) && (!t.name || !t.name.toLowerCase().includes(searchVal))) return false;
    return true;
  });

  if (feedCountEl) {
    feedCountEl.textContent = `Showing ${filtered.length} testimon${filtered.length === 1 ? 'y' : 'ies'}`;
  }

  if (filtered.length === 0) {
    if (emptyState) emptyState.classList.remove('id-hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('id-hidden');

  filtered.forEach(t => {
    const card = document.createElement('div');
    card.className = 'testimony-card';
    card.id = `test-${t.id}`;
    
    let d = new Date(t.createdAt);
    if (isNaN(d)) d = new Date();
    const timeAgo = formatTimeAgo(d);
    
    const amenCount = t.amenCount || 0;
    const hasAmened = localStorage.getItem(`amened_${t.id}`) === 'true';

    const nameStr = t.name || 'Anonymous';
    const initials = nameStr.substring(0, 2).toUpperCase();

    card.innerHTML = `
      ${t.featured ? `<div class="featured-badge">Featured Testimony</div>` : ''}
      <div class="testimony-card-header">
        <div class="testimony-card-user">
          <div class="testimony-avatar">${escapeHTML(initials)}</div>
          <div>
            <div class="testimony-user-name">${escapeHTML(nameStr)}</div>
            <div class="testimony-time">${timeAgo}</div>
          </div>
        </div>
        <div class="testimony-category-badge badge-${escapeHTML(t.category || 'General')}">${escapeHTML(t.category || 'General')}</div>
      </div>
      <div class="testimony-text">
        ${escapeHTML(t.text)}
      </div>
      <div class="testimony-footer">
        <button id="amen-btn-${t.id}" class="btn-amen ${hasAmened ? 'active' : ''}" onclick="handleAmenClick('${t.id}')">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="${hasAmened ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> 
          ${hasAmened ? 'Amen!' : 'Say Amen'}
        </button>
        <span class="amen-count"><span id="amen-count-${t.id}">${amenCount}</span> Amens</span>
      </div>
    `;
    feed.appendChild(card);
  });
}

async function handleTestimonySubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-testimony') || e.target.querySelector('button[type="submit"]');
  const ogHtml = btn.innerHTML;
  btn.innerHTML = '<span>Submitting...</span>';
  btn.disabled = true;

  const nameInput = document.getElementById('test-name');
  const categoryInput = document.getElementById('test-category');
  const textInput = document.getElementById('test-text');
  const successBox = document.getElementById('testimony-success-box');

  const newTestimony = {
    id: 'test-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    name: (nameInput && nameInput.value.trim()) || 'Anonymous',
    category: (categoryInput && categoryInput.value) || 'General',
    text: textInput ? textInput.value.trim() : ''
  };

  try {
    const res = await fetch('/api/testimonies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTestimony)
    });

    if (!res.ok) throw new Error('Failed to submit testimony');
    
    newTestimony.createdAt = new Date().toISOString();
    newTestimony.amenCount = 0;
    newTestimony.featured = false;
    testimoniesCache.unshift(newTestimony);
    
    e.target.reset();
    if (categoryInput) categoryInput.value = 'General';
    document.querySelectorAll('.testimony-form-panel .cat-pill').forEach(p => p.classList.remove('selected'));
    const firstPill = document.querySelector('.testimony-form-panel .cat-pill');
    if (firstPill) firstPill.classList.add('selected');

    if (successBox) {
      successBox.classList.remove('id-hidden');
      setTimeout(() => successBox.classList.add('id-hidden'), 6000);
    }

    updateTestimonyStats();
    renderTestimonies();

    if (window.innerWidth <= 768) {
      switchMobileTestimonyTab('feed');
    }
    
    const feedEl = document.getElementById('testimony-feed');
    if (feedEl) feedEl.scrollIntoView({ behavior: 'smooth' });
    
  } catch(err) {
    console.error(err);
    alert('Error submitting testimony. Please try again.');
  }

  btn.innerHTML = ogHtml;
  btn.disabled = false;
}

window.handleAmenClick = async function(id) {
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
    if (countEl) countEl.textContent = t.amenCount;
    updateTestimonyStats();
    
    fetch('/api/amen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, increment: false })
    }).catch(console.error);
    
  } else {
    localStorage.setItem(`amened_${id}`, 'true');
    t.amenCount = (t.amenCount || 0) + 1;
    if (btn) {
      btn.classList.add('active');
      btn.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" stroke="currentColor" stroke-width="2.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> Amen! `;
    }
    if (countEl) countEl.textContent = t.amenCount;
    updateTestimonyStats();
    
    fetch('/api/amen', {
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
