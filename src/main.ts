import './style.css'

declare const marked: {
  parse: (content: string) => string
}

const API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

interface Model {
  id: string
  object: string
  created: number
  owned_by: string
  working?: boolean
  testing?: boolean
}

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface Chat {
  id: string
  title: string
  messages: Message[]
}

interface UserMemory {
  name: string
  location: string
  work: string
  preferences: string[]
  facts: string[]
}

interface AppSettings {
  selectedModel: string
  userMemory: UserMemory
}

let models: Model[] = []
let selectedModel = 'llama-3.3-70b-versatile'

let userMemory: UserMemory = {
  name: '',
  location: '',
  work: '',
  preferences: [],
  facts: []
}

let chats: Chat[] = []
let currentChatId = ''
let saveTimeout: number | null = null

function createNewChat(): Chat {
  return {
    id: Date.now().toString(),
    title: 'New Chat',
    messages: []
  }
}

function loadChats() {
  try {
    const saved = localStorage.getItem('chats')
    if (saved) {
      const data = JSON.parse(saved)
      chats = data.chats || []
      currentChatId = data.currentChatId || ''
    }
    if (chats.length === 0) {
      chats = [createNewChat()]
    }
    if (!currentChatId || !chats.find(c => c.id === currentChatId)) {
      currentChatId = chats[0].id
    }
  } catch (e) {
    chats = [createNewChat()]
    currentChatId = chats[0].id
  }
}

function saveChats() {
  try {
    localStorage.setItem('chats', JSON.stringify({ chats, currentChatId }))
  } catch (e) {
    console.error('Failed to save chats:', e)
  }
}

function getCurrentChat(): Chat {
  return chats.find(c => c.id === currentChatId) || chats[0]
}

function autoSaveChats() {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = window.setTimeout(saveChats, 500)
}

function loadSettings() {
  try {
    const saved = localStorage.getItem('appSettings')
    if (saved) {
      const settings: AppSettings = JSON.parse(saved)
      selectedModel = settings.selectedModel || 'llama-3.3-70b-versatile'
      userMemory = settings.userMemory || userMemory
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
}

function saveSettings() {
  try {
    const settings: AppSettings = {
      selectedModel,
      userMemory
    }
    localStorage.setItem('appSettings', JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

const freeModels = [
  { id: 'allam-2-7b', object: 'model', created: 2024000000000, owned_by: 'Allam' },
  { id: 'llama-3.1-8b-instant', object: 'model', created: 2024000000005, owned_by: 'Meta' },
  { id: 'llama-3.3-70b-versatile', object: 'model', created: 2024000000006, owned_by: 'Meta' },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', object: 'model', created: 2024000000007, owned_by: 'Meta' },
  { id: 'openai/gpt-oss-120b', object: 'model', created: 2024000000010, owned_by: 'OpenAI' },
  { id: 'openai/gpt-oss-20b', object: 'model', created: 2024000000011, owned_by: 'OpenAI' },
  { id: 'openai/gpt-oss-safeguard-20b', object: 'model', created: 2024000000012, owned_by: 'OpenAI' },
  
]

function initModels() {
  models = freeModels.map(m => ({ ...m, working: undefined, testing: false }))
  renderModelSelect()
  testAllModels()
}

async function testModel(modelId: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5
      })
    })
    return response.ok
  } catch {
    return false
  }
}

async function testAllModels() {
  const sortedModels = [...models].sort((a, b) => b.created - a.created)

  for (const model of sortedModels) {
    if (model.testing) continue
    model.testing = true
    renderModelSelect()

    const isWorking = await testModel(model.id)
    model.working = isWorking
    model.testing = false

    const m = models.find(m => m.id === model.id)
    if (m) m.working = isWorking

    renderModelSelect()
  }
}

function refreshModels() {
  testAllModels()
}

async function extractUserMemory(messages: Message[]) {
  if (messages.length < 2) return
  
  const recentMsgs = messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')
  
  const extractionPrompt = `Extract user information from this conversation. Return ONLY a JSON object with these fields (leave empty string/array if nothing found):
- name: user's name or nickname
- location: where user lives
- work: user's job or workplace
- preferences: array of user preferences (brief phrases)
- facts: array of important facts about user

Conversation:
${recentMsgs}

Return ONLY valid JSON, no other text:`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: extractionPrompt }],
        max_tokens: 300,
        temperature: 0.1
      })
    })

    const data = await response.json()
    const extracted = data.choices?.[0]?.message?.content
    
    if (extracted) {
      try {
        const parsed = JSON.parse(extracted)
        
        if (parsed.name && !userMemory.name.includes(parsed.name)) {
          userMemory.name = parsed.name
        }
        if (parsed.location && !userMemory.location.includes(parsed.location)) {
          userMemory.location = parsed.location
        }
        if (parsed.work && !userMemory.work.includes(parsed.work)) {
          userMemory.work = parsed.work
        }
        if (parsed.preferences?.length > 0) {
          parsed.preferences.forEach((p: string) => {
            if (!userMemory.preferences.includes(p)) {
              userMemory.preferences.push(p)
            }
          })
        }
        if (parsed.facts?.length > 0) {
          parsed.facts.forEach((f: string) => {
            if (!userMemory.facts.includes(f)) {
              userMemory.facts.push(f)
            }
          })
        }
        
        saveSettings()
        updateContextIndicator()
      } catch {
        // Not valid JSON, ignore
      }
    }
  } catch {
    // Failed, ignore
  }
}

function buildSystemPrompt(): string {
  let system = `You are a helpful AI assistant. Be conversational, friendly, and concise.`

  if (userMemory.name) {
    system += `\n\nUser's name: ${userMemory.name}`
  }
  if (userMemory.location) {
    system += `\nUser lives in: ${userMemory.location}`
  }
  if (userMemory.work) {
    system += `\nUser works at: ${userMemory.work}`
  }
  if (userMemory.preferences.length > 0) {
    system += `\nUser Preferences: ${userMemory.preferences.join(', ')}`
  }
  if (userMemory.facts.length > 0) {
    system += `\nKnown Facts: ${userMemory.facts.join('; ')}`
  }

  return system
}

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div class="app-container">
    <aside class="sidebar">
      <button class="new-chat-btn" id="new-chat-btn">+ New Chat</button>
      <div class="chat-list" id="chat-list"></div>
      <div class="global-context-section">
        <span class="context-indicator" id="context-indicator">Auto Context: Active</span>
      </div>
    </aside>
    <main class="chat-main">
      <header class="chat-header">
        <div class="header-content">
          <h1 id="chat-title">New Chat</h1>
          <div class="model-controls">
            <select id="model-select" class="model-select">
              <option value="">Loading models...</option>
            </select>
            <button id="refresh-models-btn" class="refresh-btn" title="Test all models">↻</button>
          </div>
        </div>
      </header>
      <div class="chat-messages" id="messages"></div>
      <div class="input-wrapper">
        <div class="chat-input-container">
          <textarea id="user-input" placeholder="Send a message..." rows="1" autocomplete="off"></textarea>
          <button id="send-btn" title="Send message (Enter)">Send</button>
        </div>
      </div>
      <div class="loading" id="loading" hidden>Thinking...</div>
    </main>
  </div>
`

const chatListEl = document.getElementById('chat-list')!
const messagesContainer = document.getElementById('messages')!
const chatTitleEl = document.getElementById('chat-title')!
const userInput = document.getElementById('user-input') as HTMLTextAreaElement
const sendBtn = document.getElementById('send-btn') as HTMLButtonElement
const loadingIndicator = document.getElementById('loading')!
const newChatBtn = document.getElementById('new-chat-btn')!
const contextIndicator = document.getElementById('context-indicator')!
const modelSelect = document.getElementById('model-select') as HTMLSelectElement
const refreshBtn = document.getElementById('refresh-models-btn')!

loadSettings()
loadChats()
initModels()
updateContextIndicator()

function renderModelSelect() {
  modelSelect.innerHTML = ''
  const sortedModels = [...models].sort((a, b) => {
    if (a.working === true && b.working !== true) return -1
    if (a.working !== true && b.working === true) return 1
    return b.created - a.created
  })

  sortedModels.forEach(model => {
    const option = document.createElement('option')
    option.value = model.id

    let status = ''
    if (model.testing) status = ' [Testing...]'
    else if (model.working === true) status = ' ✓'
    else if (model.working === false) status = ' ✗'

    option.textContent = `${model.id} (${model.owned_by})${status}`
    option.disabled = model.working === false
    option.title = model.working === false ? 'Model not working' : model.id

    if (model.id === selectedModel) {
      option.selected = true
    }
    modelSelect.appendChild(option)
  })

  if (!selectedModel || !models.find(m => m.id === selectedModel && m.working)) {
    const workingModel = models.find(m => m.working === true)
    if (workingModel) {
      selectedModel = workingModel.id
      saveSettings()
    }
  }
}

modelSelect.addEventListener('change', () => {
  selectedModel = modelSelect.value
  saveSettings()
})

refreshBtn.addEventListener('click', refreshModels)

function renderChatList() {
  chatListEl.innerHTML = ''
  chats.forEach(chat => {
    const chatItem = document.createElement('div')
    chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`
    chatItem.dataset.id = chat.id
    chatItem.innerHTML = `
      <span class="chat-item-title">${chat.title}</span>
      <button class="delete-chat-btn" data-id="${chat.id}">×</button>
    `
    chatItem.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('delete-chat-btn')) {
        deleteChat(target.dataset.id!)
      } else {
        switchChat(chat.id)
      }
    })
    chatListEl.appendChild(chatItem)
  })
}

function switchChat(id: string) {
  currentChatId = id
  renderChatList()
  renderMessages()
}

function deleteChat(id: string) {
  const index = chats.findIndex(c => c.id === id)
  if (index > -1 && chats.length > 1) {
    chats.splice(index, 1)
    if (currentChatId === id) {
      currentChatId = chats[0].id
    }
    renderChatList()
    renderMessages()
    autoSaveChats()
  }
}

function renderMessages() {
  messagesContainer.innerHTML = ''
  const chat = getCurrentChat()
  chatTitleEl.textContent = chat.title
  chat.messages.forEach(msg => {
    addMessageToUI(msg.role, msg.content)
  })
}

function addMessageToUI(role: string, content: string) {
  if (role === 'system') return
  
  const messageDiv = document.createElement('div')
  messageDiv.className = `message ${role}`
  
  let htmlContent = content
  if (role === 'assistant' && typeof marked !== 'undefined') {
    htmlContent = marked.parse(content) as string
  } else {
    htmlContent = escapeHtml(content)
  }
  
  messageDiv.innerHTML = `
    <div class="message-content">
      <div class="message-text">${htmlContent}</div>
    </div>
  `
  
  messagesContainer.appendChild(messageDiv)
  messagesContainer.scrollTop = messagesContainer.scrollHeight
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function addMessage(role: 'user' | 'assistant', content: string) {
  const chat = getCurrentChat()
  chat.messages.push({ role, content })
  addMessageToUI(role, content)

  if (role === 'user' && chat.title === 'New Chat') {
    chat.title = content.slice(0, 30) + (content.length > 30 ? '...' : '')
    chatTitleEl.textContent = chat.title
    renderChatList()
  }
  
  if (role === 'user') {
    extractUserMemory(chat.messages)
  }
  
  autoSaveChats()
}

function updateContextIndicator() {
  const hasMemory = userMemory.name || userMemory.location || userMemory.work || userMemory.preferences.length > 0 || userMemory.facts.length > 0
  
  if (hasMemory) {
    let info = 'Auto Context: '
    const parts: string[] = []
    if (userMemory.name) parts.push(userMemory.name)
    if (userMemory.location) parts.push(userMemory.location)
    if (userMemory.work) parts.push(userMemory.work)
    if (userMemory.preferences.length > 0) parts.push(`${userMemory.preferences.length} prefs`)
    if (userMemory.facts.length > 0) parts.push(`${userMemory.facts.length} facts`)
    
    contextIndicator.textContent = info + parts.slice(0, 3).join(', ')
  } else {
    contextIndicator.textContent = 'Auto Context: Active'
  }
}

function setLoading(isLoading: boolean) {
  loadingIndicator.hidden = !isLoading
  sendBtn.disabled = isLoading
  userInput.disabled = isLoading
}

function getApiMessages(): Message[] {
  const chat = getCurrentChat()
  const systemPrompt = buildSystemPrompt()
  return [
    { role: 'system', content: systemPrompt },
    ...chat.messages
  ]
}

async function sendMessage() {
  const userMessage = userInput.value.trim()
  if (!userMessage || sendBtn.disabled) return

  userInput.value = ''
  userInput.style.height = 'auto'
  addMessage('user', userMessage)
  setLoading(true)

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: getApiMessages()
      })
    })

    const data = await response.json()
    let assistantMessage = data.choices?.[0]?.message?.content || 'No response received'
    
    const thinkEnd = '\u003E\u005D'
    const hasthink = assistantMessage.includes(thinkEnd)
    
    if (hasthink) {
      const afterthink = assistantMessage.split(thinkEnd).pop()
      if (afterthink && afterthink.trim().length > 0) {
        assistantMessage = afterthink.trim()
      }
    }
    
    assistantMessage = assistantMessage
      .replace(/<answer>/g, '')
      .replace(/<\/answer>/g, '')
      .replace(/<reasoning>/g, '')
      .replace(/<\/reasoning>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{2,}/g, '\n')
      .trim()
    
    if (!assistantMessage) {
      assistantMessage = 'No response received'
    }
    
    if (!assistantMessage) {
      assistantMessage = 'No response received'
    }
    
    addMessage('assistant', assistantMessage)
  } catch (error) {
    addMessage('assistant', 'Error: Failed to get response')
    console.error(error)
  }

  setLoading(false)
  userInput.focus()
}

newChatBtn.addEventListener('click', () => {
  const newChat = createNewChat()
  chats.unshift(newChat)
  currentChatId = newChat.id
  renderChatList()
  renderMessages()
  autoSaveChats()
})

sendBtn.addEventListener('click', sendMessage)

userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
})

function autoResizeInput() {
  userInput.style.height = 'auto'
  userInput.style.height = Math.min(userInput.scrollHeight, 150) + 'px'
}

userInput.addEventListener('input', autoResizeInput)

renderChatList()
renderMessages()
updateContextIndicator()
userInput.focus()