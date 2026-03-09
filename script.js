// ===== Data Management =====
let events = [];

// Load events from localStorage on page load
function loadEvents() {
  const savedEvents = localStorage.getItem('constellationEvents');
  if (savedEvents) {
    events = JSON.parse(savedEvents);
  }
}

// Save events to localStorage
function saveEvents() {
  localStorage.setItem('constellationEvents', JSON.stringify(events));
}

// ===== Event Form Toggle =====
function toggleEventForm() {
  const formContainer = document.getElementById('eventFormContainer');
  formContainer.classList.toggle('active');
  
  // Reset form when closing
  if (!formContainer.classList.contains('active')) {
    document.querySelector('.event-form form').reset();
  }
}

// ===== Add New Event =====
function addNewEvent(e) {
  e.preventDefault();
  
  const date = document.getElementById('eventDate').value;
  const title = document.getElementById('eventTitle').value;
  const description = document.getElementById('eventDescription').value;
  
  // Create event object
  const newEvent = {
    date: date,
    title: title,
    description: description,
    id: Date.now()
  };
  
  // Add to events array
  events.push(newEvent);
  
  // Sort events by date
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Save to localStorage
  saveEvents();
  
  // Re-render timeline
  renderTimeline();
  
  // Close form
  toggleEventForm();
  
  // Show success animation
  showSuccessMessage();
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
    const dateObj = new Date(event.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    eventDiv.innerHTML = `
      <div class="star" data-index="${index}">
        <div class="star-glow"></div>
        <div class="star-core"></div>
      </div>
      <div class="event-popup">
        <div class="popup-date">${formattedDate}</div>
        <div class="popup-title">${escapeHtml(event.title)}</div>
        <div class="popup-description">${escapeHtml(event.description)}</div>
      </div>
    `;
    
    timeline.appendChild(eventDiv);
  });
  
  // Reinitialize animations
  initScrollAnimations();
  drawConstellationLines();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== Success Message =====
function showSuccessMessage() {
  const message = document.createElement('div');
  message.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px 30px;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    animation: slideIn 0.5s ease;
  `;
  message.textContent = '✨ Memory added to your constellation!';
  document.body.appendChild(message);
  
  setTimeout(() => {
    message.style.animation = 'slideOut 0.5s ease';
    setTimeout(() => message.remove(), 500);
  }, 3000);
}

// ===== Scroll-based Animations =====
function initScrollAnimations() {
  const eventElements = document.querySelectorAll('.event');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        
        // Animate constellation line
        const index = parseInt(entry.target.querySelector('.star').getAttribute('data-index'));
        if (index > 0) {
          const line = document.querySelector(`.constellation-line[data-from="${index - 1}"][data-to="${index}"]`);
          if (line) {
            line.classList.add('animate');
          }
        }
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
  
  // Draw lines between consecutive stars
  for (let i = 0; i < stars.length - 1; i++) {
    const star1 = stars[i];
    const star2 = stars[i + 1];
    
    const rect1 = star1.getBoundingClientRect();
    const rect2 = star2.getBoundingClientRect();
    const timelineContainer = document.querySelector('.timeline-container').getBoundingClientRect();
    
    const x1 = rect1.left - timelineContainer.left + rect1.width / 2;
    const y1 = rect1.top - timelineContainer.top + rect1.height / 2;
    const x2 = rect2.left - timelineContainer.left + rect2.width / 2;
    const y2 = rect2.top - timelineContainer.top + rect2.height / 2;
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Create a curved path
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const offsetX = (y2 - y1) * 0.2;
    const offsetY = (x2 - x1) * -0.2;
    
    const d = `M ${x1} ${y1} Q ${midX + offsetX} ${midY + offsetY} ${x2} ${y2}`;
    
    line.setAttribute('d', d);
    line.classList.add('constellation-line');
    line.setAttribute('data-from', i);
    line.setAttribute('data-to', i + 1);
    
    svg.appendChild(line);
  }
}

// ===== Initialize on Load =====
document.addEventListener('DOMContentLoaded', () => {
  // Load saved events or use default from HTML
  loadEvents();
  
  // If no saved events, extract from HTML
  if (events.length === 0) {
    const eventElements = document.querySelectorAll('.event');
    eventElements.forEach(el => {
      const date = el.getAttribute('data-date');
      const title = el.querySelector('.popup-title').textContent;
      const description = el.querySelector('.popup-description').textContent;
      events.push({ date, title, description, id: Date.now() + Math.random() });
    });
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    saveEvents();
  }
  
  // Render timeline with saved data
  renderTimeline();
  
  // Redraw lines on window resize
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