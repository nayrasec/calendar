// ===== Data Management =====
let events = [];
let editingId = null;

// Default events
const defaultEvents = [
  {
    id: 1,
    date: '2023-10-12',
    title: 'First Met ☕',
    description: 'The day we first met. The coffee was terrible, but the conversation wasn\'t.'
  },
  {
    id: 2,
    date: '2023-12-31',
    title: 'New Year\'s Eve 🎆',
    description: 'Our first New Year\'s Eve together, counting down to midnight with champagne and dreams.'
  },
  {
    id: 3,
    date: '2024-03-15',
    title: 'Road Trip Adventure 🚗',
    description: 'That spontaneous road trip where we got totally lost but found each other even more.'
  }
];

// Load events from localStorage on page load
function loadEvents() {
  const savedEvents = localStorage.getItem('constellationEvents');
  if (savedEvents) {
    try {
      events = JSON.parse(savedEvents);
    } catch (e) {
      console.error('Error loading saved events:', e);
      events = JSON.parse(JSON.stringify(defaultEvents));
    }
  } else {
    events = JSON.parse(JSON.stringify(defaultEvents));
  }
  
  // Sort by date
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Save events to localStorage
function saveEvents() {
  localStorage.setItem('constellationEvents', JSON.stringify(events));
}

// ===== Modal Toggles =====
function toggleEventForm() {
  const formContainer = document.getElementById('eventFormContainer');
  formContainer.classList.toggle('active');
  
  if (!formContainer.classList.contains('active')) {
    resetForm();
  }
}

function toggleHelp() {
  const helpModal = document.getElementById('helpModal');
  helpModal.classList.toggle('active');
}

// ===== Form Management =====
function resetForm() {
  editingId = null;
  document.getElementById('formTitle').textContent = 'Add a New Memory';
  document.getElementById('submitBtn').textContent = '✨ Add to Our Constellation';
  document.querySelector('.event-form form').reset();
}

function editEvent(id) {
  editingId = id;
  const event = events.find(e => e.id === id);
  
  if (!event) return;
  
  // Populate form
  document.getElementById('eventDate').value = event.date;
  document.getElementById('eventTitle').value = event.title;
  document.getElementById('eventDescription').value = event.description;
  
  // Update UI
  document.getElementById('formTitle').textContent = 'Edit Memory';
  document.getElementById('submitBtn').textContent = '✨ Update Memory';
  
  // Open form
  toggleEventForm();
}

function deleteEvent(id) {
  if (confirm('Are you sure you want to delete this memory? 😢')) {
    events = events.filter(e => e.id !== id);
    saveEvents();
    renderTimeline();
    showMessage('Memory removed from constellation', '#ff6482');
  }
}

function saveEventData(e) {
  e.preventDefault();
  
  const date = document.getElementById('eventDate').value;
  const title = document.getElementById('eventTitle').value;
  const description = document.getElementById('eventDescription').value;
  
  if (editingId) {
    // Update existing event
    const event = events.find(e => e.id === editingId);
    if (event) {
      event.date = date;
      event.title = title;
      event.description = description;
    }
    showMessage('✨ Memory updated!');
  } else {
    // Create new event
    const newEvent = {
      id: Date.now(),
      date: date,
      title: title,
      description: description
    };
    events.push(newEvent);
    showMessage('✨ Memory added to your constellation!');
  }
  
  // Sort and save
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  saveEvents();
  
  // Refresh UI
  renderTimeline();
  toggleEventForm();
}

// ===== Render Timeline =====
function renderTimeline() {
  const timeline = document.getElementById('timeline');
  timeline.innerHTML = '';
  
  events.forEach((event, index) => {
    const eventDiv = document.createElement('div');
    eventDiv.className = 'event';
    eventDiv.setAttribute('data-date', event.date);
    
    // Format date
    const dateObj = new Date(event.date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    eventDiv.innerHTML = `
      <div class="star" data-event-id="${event.id}" data-index="${index}">
        <div class="star-glow"></div>
        <div class="star-core"></div>
      </div>
      <div class="event-content">
        <div class="event-date">${formattedDate}</div>
        <div class="event-title">${escapeHtml(event.title)}</div>
        <div class="event-description">${escapeHtml(event.description)}</div>
        <div class="event-actions">
          <button class="event-btn edit-btn" onclick="editEvent(${event.id})">✏️ Edit</button>
          <button class="event-btn delete-btn" onclick="deleteEvent(${event.id})">🗑️ Delete</button>
        </div>
      </div>
    `;
    
    timeline.appendChild(eventDiv);
  });
  
  // Reinitialize animations
  initScrollAnimations();
  setTimeout(() => drawConstellationLines(), 100);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== Message Display =====
function showMessage(message, color = '#667eea') {
  const messageEl = document.createElement('div');
  messageEl.style.cssText = `
    position: fixed;
    top: 30px;
    right: 30px;
    background: linear-gradient(135deg, ${color} 0%, ${adjustBrightness(color, 1.2)} 100%);
    color: white;
    padding: 18px 30px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    z-index: 10000;
    font-weight: 500;
    animation: slideIn 0.5s ease;
  `;
  messageEl.textContent = message;
  document.body.appendChild(messageEl);
  
  setTimeout(() => {
    messageEl.style.animation = 'slideOut 0.5s ease';
    setTimeout(() => messageEl.remove(), 500);
  }, 3000);
}

function adjustBrightness(color, factor) {
  const hex = color.replace('#', '');
  const r = Math.min(255, Math.round(parseInt(hex.substring(0, 2), 16) * factor));
  const g = Math.min(255, Math.round(parseInt(hex.substring(2, 4), 16) * factor));
  const b = Math.min(255, Math.round(parseInt(hex.substring(4, 6), 16) * factor));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ===== Scroll-based Animations =====
function initScrollAnimations() {
  const eventElements = document.querySelectorAll('.event');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, 100);
      }
    });
  }, {
    threshold: 0.3
  });
  
  eventElements.forEach(event => {
    observer.observe(event);
  });
}

// ===== Draw Constellation Lines =====
function drawConstellationLines() {
  const svg = document.getElementById('constellationLines');
  const container = document.querySelector('.timeline-container');
  
  if (!svg || !container) return;
  
  // Clear previous content
  svg.innerHTML = `
    <defs>
      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#c06bff;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#ff6b9d;stop-opacity:1" />
      </linearGradient>
    </defs>
  `;
  
  const stars = document.querySelectorAll('.star');
  if (stars.length < 2) return;
  
  // Draw smooth lines between consecutive stars
  for (let i = 0; i < stars.length - 1; i++) {
    const star1 = stars[i];
    const star2 = stars[i + 1];
    
    const rect1 = star1.getBoundingClientRect();
    const rect2 = star2.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    
    // Calculate positions relative to SVG
    const x1 = rect1.left - svgRect.left + rect1.width / 2;
    const y1 = rect1.top - svgRect.top + rect1.height / 2;
    const x2 = rect2.left - svgRect.left + rect2.width / 2;
    const y2 = rect2.top - svgRect.top + rect2.height / 2;
    
    // Create smooth cubic bezier curve
    const controlPointY = y1 + (y2 - y1) / 2;
    const d = `M ${x1} ${y1} C ${x1} ${controlPointY}, ${x2} ${controlPointY}, ${x2} ${y2}`;
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('d', d);
    line.setAttribute('class', 'constellation-line');
    
    svg.appendChild(line);
  }
}

// ===== Initialize on Load =====
document.addEventListener('DOMContentLoaded', () => {
  // Load saved events
  loadEvents();
  
  // Render timeline with data
  renderTimeline();
  
  // Redraw lines on window resize with debounce
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      drawConstellationLines();
    }, 250);
  });
  
  // Close form when clicking outside
  document.getElementById('eventFormContainer').addEventListener('click', (e) => {
    if (e.target.id === 'eventFormContainer') {
      toggleEventForm();
    }
  });
  
  // Close help when clicking outside
  document.getElementById('helpModal').addEventListener('click', (e) => {
    if (e.target.id === 'helpModal') {
      toggleHelp();
    }
  });
});

// ===== CSS Animations (injected) =====
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);