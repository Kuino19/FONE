/* ==========================================================================
   Foursquare National Evangelists (FONE) - Testimony Wall Controller
   Turso via Vercel API
   ========================================================================== */

let testimoniesCache = [];

document.addEventListener('DOMContentLoaded', () => {
  initTestimonyWall();
});

function initTestimonyWall() {
  const form = document.getElementById('testimony-form');
  if (form) {
    form.addEventListener('submit', handleTestimonySubmit);
  }
  loadTestimonies();
}

async function loadTestimonies() {
  const loader = document.getElementById('testimony-loader');
  const feed = document.getElementById('testimony-feed');
  if (!loader || !feed) return;

  loader.style.display = 'block';
  feed.innerHTML = '';

  try {
    const res = await fetch('/api/testimonies');
    if (!res.ok) throw new Error('API Error');
    testimoniesCache = await res.json();
  } catch (err) {
    console.error('Failed to fetch testimonies from Turso', err);
  }

  loader.style.display = 'none';
  renderTestimonies();
}

function renderTestimonies() {
  const feed = document.getElementById('testimony-feed');
  if (!feed) return;

  feed.innerHTML = '';

  if (testimoniesCache.length === 0) {
    feed.innerHTML = '<div class="empty-state">No testimonies found. Be the first to share one!</div>';
    return;
  }

  testimoniesCache.forEach(t => {
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
        <div class="testimony-category-badge badge-${escapeHTML(t.category)}">${escapeHTML(t.category)}</div>
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
  const btn = e.target.querySelector('button[type="submit"]');
  const ogText = btn.innerHTML;
  btn.innerHTML = 'Submitting...';
  btn.disabled = true;

  const nameInput = document.getElementById('testimony-name');
  const categoryInput = document.getElementById('testimony-category');
  const textInput = document.getElementById('testimony-text');

  const newTestimony = {
    id: 'test-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    name: nameInput.value.trim() || 'Anonymous',
    category: categoryInput.value,
    text: textInput.value.trim()
  };

  try {
    await fetch('/api/testimonies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTestimony)
    });
    
    newTestimony.createdAt = new Date().toISOString();
    newTestimony.amenCount = 0;
    newTestimony.featured = false;
    testimoniesCache.unshift(newTestimony);
    
    e.target.reset();
    renderTestimonies();
    
    // Smooth scroll
    document.getElementById('testimony-feed').scrollIntoView({ behavior: 'smooth' });
    
  } catch(err) {
    console.error(err);
    alert('Error submitting testimony. Please try again.');
  }

  btn.innerHTML = ogText;
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
    
    fetch('/api/amen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, increment: true })
    }).catch(console.error);
  }
}

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
