// --- WIZARD FORM LOGIC ---
let currentStep = 1;
const totalSteps = 3;

function updateProgress() {
  const progress = (currentStep / totalSteps) * 100;
  document.getElementById('progress-bar').style.width = `${progress}%`;
}

function nextStep(step) {
  // Validate current step
  if (currentStep === 1) {
    const rec = document.getElementById('recipient').value.trim();
    const age = document.getElementById('age').value.trim();
    if (!rec || !age) return alert('Please fill in recipient and age.');
  } else if (currentStep === 2) {
    const occ = document.getElementById('occasion').value.trim();
    const int = document.getElementById('interests').value.trim();
    if (!occ || !int) return alert('Please let us know the occasion and interests.');
  }

  document.getElementById(`step-${currentStep}`).classList.remove('active');
  currentStep = step;
  document.getElementById(`step-${currentStep}`).classList.add('active');
  updateProgress();
}

function prevStep(step) {
  document.getElementById(`step-${currentStep}`).classList.remove('active');
  currentStep = step;
  document.getElementById(`step-${currentStep}`).classList.add('active');
  updateProgress();
}

// Initialize progress
updateProgress();

// --- TOGGLES LOGIC ---
function setupToggles(groupId) {
  const btns = document.querySelectorAll(`#${groupId} .toggle`);
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => x.classList.remove('active'));
    b.classList.add('active');
  }));
}
setupToggles('tg-type');
setupToggles('tg-budget');

function getToggle(groupId) {
  return document.querySelector(`#${groupId} .toggle.active`)?.dataset.val || '';
}

// --- LOADING LOGIC ---
let stepTimer = null;
function animateLoadingSteps() {
  const steps = ['ls1', 'ls2', 'ls3'];
  let i = 0;
  stepTimer = setInterval(() => {
    if (i > 0) {
      document.getElementById(steps[i - 1]).classList.remove('active');
      document.getElementById(steps[i - 1]).classList.add('done');
      document.getElementById(steps[i - 1]).textContent = '✓ ' + document.getElementById(steps[i - 1]).textContent.substring(2);
    }
    if (i < steps.length) {
      document.getElementById(steps[i]).classList.add('active');
      i++;
    } else {
      clearInterval(stepTimer);
    }
  }, 2000);
}

// --- SUBMIT FORM ---
let globalGifts = [];
let currentRecipient = "";

async function submitForm() {
  currentRecipient = document.getElementById('recipient').value.trim();
  const payload = {
    recipient: currentRecipient,
    age: document.getElementById('age').value.trim(),
    location: document.getElementById('location').value.trim(),
    occasion: document.getElementById('occasion').value.trim(),
    interests: document.getElementById('interests').value.trim(),
    giftType: getToggle('tg-type'),
    budget: getToggle('tg-budget'),
    emotion: document.getElementById('s-emotion').value,
    looks: document.getElementById('s-looks').value,
    priceFeel: document.getElementById('s-price').value,
    know: document.getElementById('s-know').value,
  };

  // Show loading
  document.querySelector('.form-section').style.display = 'none';
  document.getElementById('loading').style.display = 'block';
  animateLoadingSteps();

  try {
    const res = await fetch('/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    clearInterval(stepTimer);
    
    if (data.success && data.gifts && data.gifts.length > 0) {
      globalGifts = data.gifts;
      startUnwrapping();
    } else {
      alert('AI failed to return valid gifts: ' + (data.error || 'Unknown error'));
      restart();
    }
  } catch (e) {
    clearInterval(stepTimer);
    alert('Network error. Make sure the server is running.');
    restart();
  }
}

// --- UNWRAPPING EXPERIENCE ---
let unwrappedCount = 0;

function startUnwrapping() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('unwrapping').style.display = 'block';
  unwrappedCount = 0;
  
  const container = document.querySelector('.gift-boxes-container');
  container.innerHTML = '';
  document.querySelector('.reveal-all-btn').style.display = 'none';
  
  // Create boxes
  const boxCount = Math.min(globalGifts.length, 5);
  for(let i=0; i<boxCount; i++) {
    const gift = globalGifts[i];
    const box = document.createElement('div');
    box.className = 'gift-wrap';
    const num = i + 1;
    
    // Determine link icon + text
    const isExp = gift.type && gift.type.toLowerCase().includes('experience');
    const actText = isExp ? '🎫 Book Now' : '🛒 Shop';
    
    box.innerHTML = `
      <div class="gift-box-inner">🎁
        <div class="ribbon v"></div>
        <div class="ribbon h"></div>
      </div>
      <div class="item-revealed">
         <div class="mini-gift-card">
           <div class="mgc-title">${gift.name}</div>
           <div class="mgc-price">${gift.price}</div>
           <a href="${gift.purchaseUrl || gift.amazonUrl}" target="_blank" class="mgc-link">${actText}</a>
         </div>
      </div>
    `;
    
    box.addEventListener('click', function() {
      if(box.classList.contains('opened')) return;
      box.classList.add('shake');
      setTimeout(() => {
        box.classList.remove('shake');
        box.classList.add('opened');
        unwrappedCount++;
        
        // Show dashboard btn immediately after the first box is opened so they don't have to open all
        document.querySelector('.reveal-all-btn').style.display = 'inline-block';
        
      }, 400); // Wait for shake
    });
    container.appendChild(box);
  }
}

// --- DASHBOARD RESULTS ---
function showDashboard() {
  document.getElementById('unwrapping').style.display = 'none';
  document.getElementById('loading').style.display = 'none';
  
  document.getElementById('r-title').textContent = `Curated Collection for ${currentRecipient}`;
  document.getElementById('r-sub').textContent = `${globalGifts.length} items carefully matched to your inputs.`;
  
  renderCards(globalGifts);
  
  document.getElementById('results').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function sortGifts() {
  const val = document.getElementById('sort-filter').value;
  let sorted = [...globalGifts];
  if(val === 'match') {
    sorted.sort((a,b) => (b.match_score || 0) - (a.match_score || 0));
  } else if (val === 'price') {
    // Basic string extraction for price, usually not perfectly sortable but good enough approximation
    sorted.sort((a,b) => {
      const p1 = parseInt('0'+(a.price.match(/\d+/) || [0])[0]);
      const p2 = parseInt('0'+(b.price.match(/\d+/) || [0])[0]);
      return p1 - p2;
    });
  }
  renderCards(sorted);
}

function toggleSave(btn) {
  if(btn.classList.contains('saved')) {
    btn.classList.remove('saved');
    btn.innerHTML = '♡ Save';
  } else {
    btn.classList.add('saved');
    btn.innerHTML = '♥ Saved';
  }
}

function renderCards(gifts) {
  const cards = document.getElementById('r-cards');
  cards.innerHTML = '';
  
  gifts.forEach((g, i) => {
    let tagHTML = '';
    if(g.tags && g.tags.length > 0) {
      tagHTML = `<div class="gift-tags">` + g.tags.map(t => `<span class="tag-pill">${t}</span>`).join('') + `</div>`;
    }
    const match = g.match_score || (90 - Math.floor(Math.random()*15)); // fallback

    // Determine link style based on type
    const isExp = g.type && g.type.toLowerCase().includes('experience');
    const actText = isExp ? '🎫 Find Vouchers / Book' : '🛒 Shop on Amazon';

    const card = document.createElement('div');
    card.className = 'gift-card';
    card.style.animationDelay = `${i * 0.1}s`;
    
    card.innerHTML = `
      <div class="match-circle">
        ${match}%<div class="match-label">Match</div>
      </div>
      <div class="gift-details">
        <div class="gift-name-row">
          <div class="gift-name">${g.name}</div>
          <div class="gift-price">${g.price}</div>
        </div>
        <div class="gift-reason">${g.reason}</div>
        ${tagHTML}
        <div class="card-actions">
           <button class="save-btn" onclick="toggleSave(this)">♡ Save</button>
           <a href="${g.purchaseUrl || g.amazonUrl}" target="_blank" rel="noopener" class="shop-btn">${actText}</a>
        </div>
      </div>
    `;
    cards.appendChild(card);
  });
}

function restart() {
  document.getElementById('results').style.display = 'none';
  document.getElementById('unwrapping').style.display = 'none';
  document.querySelector('.form-section').style.display = 'block';
  
  // Reset Loading UI
  ['ls1', 'ls2', 'ls3'].forEach((id, i) => {
    const el = document.getElementById(id);
    el.classList.remove('active', 'done');
    const labels = ['🎁 Scanning thousands of ideas', '🔍 Matching with preferences', '✅ Wrapping up your list'];
    el.textContent = labels[i];
    if (i === 0) el.classList.add('active');
  });
  
  // Reset Wizard
  currentStep = 1;
  document.querySelectorAll('.wizard-step').forEach(d => d.classList.remove('active'));
  document.getElementById('step-1').classList.add('active');
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- SPARK CHAT WIDGET ---
let chatVisible = false;
let chatHistory = [];

function toggleChat() {
  chatVisible = !chatVisible;
  document.getElementById('chat-window').style.display = chatVisible ? 'flex' : 'none';
}

function appendMessage(role, text) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `message ${role === 'user' ? 'user-message' : 'bot-message'}`;
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function appendLoading() {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.id = 'chat-loading';
  div.className = `message loading-msg`;
  div.textContent = '...';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function removeLoading() {
  const el = document.getElementById('chat-loading');
  if(el) el.remove();
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if(!text) return;
  
  // Add user message to UI
  appendMessage('user', text);
  input.value = '';
  
  // Ask backend
  appendLoading();
  try {
    const res = await fetch('/chat', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ message: text, history: chatHistory })
    });
    const data = await res.json();
    removeLoading();
    
    if(data.success) {
      appendMessage('spark', data.reply);
      chatHistory.push({ role: 'user', content: text });
      chatHistory.push({ role: 'spark', content: data.reply });
    } else {
      appendMessage('spark', 'Oops, I had a little technical hiccup: ' + (data.error || 'Unknown error'));
    }
  } catch(e) {
    removeLoading();
    appendMessage('spark', 'Looks like I am offline right now. Make sure the server is running!');
  }
}

function handleChatEnter(e) {
  if(e.key === 'Enter') sendChatMessage();
}
