let currentChatId = Date.now().toString();
let chats = JSON.parse(localStorage.getItem('ai_v2_chats')) || {};

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    const savedTheme = localStorage.getItem('ai_v2_theme') || 'light';
    setTheme(savedTheme);
    renderHistory();

    // Input handlers
    const input = document.getElementById('user-input');
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px';
    });

    document.getElementById('send-btn').addEventListener('click', handleSendMessage);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
});

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const isOpen = sidebar.classList.toggle('open');
    document.getElementById('sidebar-overlay').style.display = isOpen ? 'block' : 'none';
}

function toggleDropdown(id) {
    const dropdown = document.getElementById(id);
    const parent = dropdown.parentElement;
    const isExpanding = !parent.classList.contains('expanded');
    
    // Close others
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('expanded'));
    
    if (isExpanding) {
        parent.classList.add('expanded');
    }
}

function setTheme(theme) {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('ai_v2_theme', theme);
}

async function handleSendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;

    // Shift UI to Chat state
    document.getElementById('chat-container').className = 'chat-container chat-state';

    // New session logic
    if (!chats[currentChatId]) {
        chats[currentChatId] = { title: text.substring(0, 30), messages: [] };
    }

    const userMsg = { role: "user", content: text };
    chats[currentChatId].messages.push(userMsg);
    appendMessage(userMsg);
    
    input.value = '';
    input.style.height = 'auto';
    
    await fetchAI();
}

async function fetchAI() {
    const tempId = 'bot-' + Date.now();
    appendMessage({ role: 'assistant', content: '...', id: tempId });

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: CONFIG.MODEL,
                messages: chats[currentChatId].messages
            })
        });

        const data = await response.json();
        const result = data.choices[0].message.content;

        document.getElementById(tempId).innerHTML = marked.parse(result);
        chats[currentChatId].messages.push({ role: 'assistant', content: result });
        
        saveAndRefresh();
    } catch (e) {
        document.getElementById(tempId).innerText = "Error: Check API connection.";
    }
}

function appendMessage(msg) {
    const area = document.getElementById('messages-area');
    const div = document.createElement('div');
    div.className = `msg ${msg.role}`;
    if (msg.id) div.id = msg.id;

    if (msg.role === 'assistant' && msg.content !== '...') {
        div.innerHTML = marked.parse(msg.content);
    } else {
        div.textContent = msg.content;
    }

    area.appendChild(div);
    scrollToBottom();
}

function scrollToBottom() {
    const area = document.getElementById('messages-area');
    area.scrollTop = area.scrollHeight;
}

function renderHistory() {
    const list = document.getElementById('chat-history-list');
    list.innerHTML = '';
    Object.keys(chats).reverse().forEach(id => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.textContent = chats[id].title;
        div.onclick = () => loadChat(id);
        list.appendChild(div);
    });
}

function loadChat(id) {
    currentChatId = id;
    document.getElementById('messages-area').innerHTML = '';
    document.getElementById('chat-container').className = 'chat-container chat-state';
    chats[id].messages.forEach(appendMessage);
    if(window.innerWidth < 768) toggleSidebar();
}

function createNewChat() {
    currentChatId = Date.now().toString();
    document.getElementById('messages-area').innerHTML = '';
    document.getElementById('chat-container').className = 'chat-container center-state';
}

function saveAndRefresh() {
    localStorage.setItem('ai_v2_chats', JSON.stringify(chats));
    renderHistory();
    scrollToBottom();
}

function clearAllHistory() {
    if(confirm("Clear all conversations?")) {
        chats = {};
        localStorage.removeItem('ai_v2_chats');
        createNewChat();
        renderHistory();
    }
}