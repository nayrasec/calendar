// ===== State Management =====
const API_URL = 'http://localhost:8000/api';
let constellations = [];
let selectedConstellationId = null;
let selectedStarIndex = null;

// ===== Language Patterns for Star Positions =====
const LETTER_PATTERNS = {
  'G': [
    {x: 100, y: 50}, {x: 150, y: 50}, {x: 200, y: 50},
    {x: 100, y: 100}, {x: 200, y: 100},
    {x: 100, y: 150}, {x: 150, y: 150}, {x: 200, y: 150},
    {x: 100, y: 200}, {x: 200, y: 200},
    {x: 100, y: 250}, {x: 150, y: 250}, {x: 200, y: 250}
  ],
  'A': [
    {x: 100, y: 50},
    {x: 150, y: 100}, {x: 200, y: 50},
    {x: 100, y: 150}, {x: 150, y: 150}, {x: 200, y: 150},
    {x: 100, y: 200}, {x: 200, y: 200},
    {x: 100, y: 250}, {x: 200, y: 250}
  ],
  'U': [
    {x: 100, y: 50}, {x: 200, y: 50},
    {x: 100, y: 100}, {x: 200, y: 100},
    {x: 100, y: 150}, {x: 200, y: 150},
    {x: 100, y: 200}, {x: 200, y: 200},
    {x: 100, y: 250}, {x: 150, y: 300}, {x: 200, y: 250}
  ],
  'R': [
    {x: 100, y: 50}, {x: 150, y: 50}, {x: 200, y: 50},
    {x: 100, y: 100}, {x: 200, y: 100},
    {x: 100, y: 150}, {x: 150, y: 150}, {x: 200, y: 150},
    {x: 100, y: 200}, {x: 200, y: 200},
    {x: 100, y: 250}, {x: 200, y: 250}
  ],
  'I': [
    {x: 150, y: 50},
    {x: 150, y: 100},
    {x: 150, y: 150},
    {x: 150, y: 200},
    {x: 150, y: 250}
  ]
};

// Get star pattern for a name
function getStarPattern(name) {
  const pattern = [];
  let xOffset = 0;

  for (const letter of name) {
    const letterPattern = LETTER_PATTERNS[letter] || [];
    letterPattern.forEach(star => {
      pattern.push({
        x: star.x + xOffset,
        y: star.y
      });
    });
    xOffset += 300;
  }

  return pattern;
}

// ===== API FUNCTIONS =====

async function fetchConstellations() {
  try {
    const response = await fetch(`${API_URL}/constellations`);
    constellations = await response.json();
    await renderConstellations();
  } catch (error) {
    console.error('Error fetching constellations:', error);
    showMessage('Error loading constellations', '#ff6482');
  }
}

async function fetchConstellation(id) {
  try {
    const response = await fetch(`${API_URL}/constellations/${id}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching constellation:', error);
    return null;
  }
}

async function createNewConstellation(name) {
  try {
    const response = await fetch(`${API_URL}/constellations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const newConstellation = await response.json();
    constellations.push(newConstellation);
    await renderConstellations();
    showMessage(`✨ Constellation "${name}" created!`);
    closeConstellationModal();
  } catch (error) {
    console.error('Error creating constellation:', error);
    showMessage(error.message || 'Error creating constellation', '#ff6482');
  }
}

async function saveMemoryToAPI(constellation_id, star_index, title, description, date) {
  try {
    const response = await fetch(`${API_URL}/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        constellation_id,
        star_index,
        title,
        description,
        date
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const memory = await response.json();
    showMessage('💾 Memory saved to the stars!');
    
    // Refresh constellation data
    await fetchConstellations();
    closeMemoryModal();
    return memory;
  } catch (error) {
    console.error('Error saving memory:', error);
    showMessage(error.message || 'Error saving memory', '#ff6482');
  }
}

async function deleteMemory(memoryId) {
  try {
    const response = await fetch(`${API_URL}/memories/${memoryId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete memory');

    showMessage('Memory removed from the universe');
    await fetchConstellations();
  } catch (error) {
    console.error('Error deleting memory:', error);
    showMessage('Error deleting memory', '#ff6482');
  }
}

// ===== RENDER FUNCTIONS =====

async function renderConstellations() {
  const container = document.getElementById('constellationsContainer');
  container.innerHTML = '';

  for (const constellation of constellations) {
    const constellationData = await fetchConstellation(constellation.id);
    if (!constellationData) continue;

    const group = document.createElement('div');
    group.className = 'constellation-group';
    group.id = `constellation-${constellation.id}`;

    const title = document.createElement('div');
    title.className = 'constellation-title';
    title.textContent = constellation.name;

    const canvas = document.createElement('div');
    canvas.className = 'constellation-canvas';

    const starPattern = getStarPattern(constellation.name);
    const memories = constellationData.memories || [];

    // Create stars
    starPattern.forEach((position, index) => {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = position.x + 'px';
      star.style.top = position.y + 'px';
      star.onclick = (e) => {
        e.stopPropagation();
        openMemoryModal(constellation.id, index);
      };

      const starCore = document.createElement('div');
      starCore.className = 'star-core';

      const starGlow = document.createElement('div');
      starGlow.className = 'star-glow';

      const memory = memories.find(m => m.star_index === index);
      const info = document.createElement('div');
      info.className = 'star-info';

      if (memory) {
        info.innerHTML = `
          <div class="star-info-title">${escapeHtml(memory.title)}</div>
          <div class="star-info-description">${escapeHtml(memory.description)}</div>
        `;
      } else {
        info.innerHTML = `<div class="star-info-empty">Click to add memory ✨</div>`;
      }

      star.appendChild(starCore);
      star.appendChild(starGlow);
      star.appendChild(info);
      canvas.appendChild(star);
    });

    group.appendChild(title);
    group.appendChild(canvas);
    container.appendChild(group);
  }
}

// ===== MODAL FUNCTIONS =====

function openMemoryModal(constellationId, starIndex) {
  selectedConstellationId = constellationId;
  selectedStarIndex = starIndex;

  // Try to find existing memory to edit
  const constellation = constellations.find(c => c.id === constellationId);
  if (constellation) {
    // Fetch constellation data with memories
    fetchConstellation(constellationId).then(data => {
      const memory = data.memories?.find(m => m.star_index === starIndex);
      if (memory) {
        document.getElementById('memoryTitle').value = memory.title;
        document.getElementById('memoryDate').value = memory.date || '';
        document.getElementById('memoryDescription').value = memory.description;
      } else {
        document.getElementById('memoryTitle').value = '';
        document.getElementById('memoryDate').value = '';
        document.getElementById('memoryDescription').value = '';
      }
    });
  }

  document.getElementById('memoryModal').classList.add('active');
}

function closeMemoryModal() {
  document.getElementById('memoryModal').classList.remove('active');
  selectedConstellationId = null;
  selectedStarIndex = null;
  document.querySelector('#memoryModal form').reset();
}

function openConstellationModal() {
  document.getElementById('constellationModal').classList.add('active');
}

function closeConstellationModal() {
  document.getElementById('constellationModal').classList.remove('active');
  document.querySelector('#constellationModal form').reset();
}

// ===== FORM HANDLERS =====

function saveMemory(e) {
  e.preventDefault();

  const title = document.getElementById('memoryTitle').value;
  const date = document.getElementById('memoryDate').value;
  const description = document.getElementById('memoryDescription').value;

  if (!title || !description) {
    showMessage('Please fill in all required fields', '#ff6482');
    return;
  }

  saveMemoryToAPI(selectedConstellationId, selectedStarIndex, title, description, date);
}

function createConstellation(e) {
  e.preventDefault();

  const constellationName = document.getElementById('constellationName').value;

  if (!constellationName) {
    showMessage('Please enter a constellation name', '#ff6482');
    return;
  }

  createNewConstellation(constellationName);
}

// ===== UTILITY FUNCTIONS =====

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

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

// ===== Initialize =====

document.addEventListener('DOMContentLoaded', () => {
  // Close modals when clicking outside
  document.getElementById('memoryModal').addEventListener('click', (e) => {
    if (e.target.id === 'memoryModal') closeMemoryModal();
  });

  document.getElementById('constellationModal').addEventListener('click', (e) => {
    if (e.target.id === 'constellationModal') closeConstellationModal();
  });

  // Load constellations from API
  fetchConstellations();
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