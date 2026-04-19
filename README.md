# AI Chat Application (Groq API Based)

A modern ChatGPT-style AI chat application powered by Groq's fast language models. Features include multi-model support, persistent chat history, auto-context memory extraction, and a beautiful dark-themed UI.

## Features

### 🚀 Core Features
- **Multi-Model Support**: Switch between different Groq models (Llama, Mixtral, Qwen, etc.)
- **Chat History**: Persistent conversations that survive page refresh
- **Auto Context Memory**: AI automatically learns your name, preferences, and facts
- **Markdown Rendering**: Beautiful formatting for AI responses (bold, lists, code, etc.)
- **Model Testing**: Auto-tests all models to show working status

### 🎨 UI/UX
- **ChatGPT-style Dark Theme**: Modern, clean interface
- **Auto-expanding Input**: Type multi-line messages easily
- **Auto-focus**: Cursor returns to input after sending
- **Responsive Design**: Works on desktop and mobile

### 💾 Data Persistence
- Chat history saved to localStorage
- User preferences saved to localStorage
- Selected model remembered across sessions

## Models Available (Free Plan)

| Model | Description |
|-------|-------------|
| llama-3.3-70b-versatile | Meta's latest powerful model |
| llama-3.1-8b-instant | Fast & efficient |
| meta-llama/llama-4-scout-17b-16e-instruct | Scout model |
| openai/gpt-oss-120b | OpenAI's OSS model |
| openai/gpt-oss-20b | Smaller OSS model |
| allam-2-7b | Allam model |

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Abhijeet-dhotre/qroq-api-based-chat-application.git
   cd qroq-api-based-chat-application
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Get Your Groq API Key**
   - Visit [Groq Cloud](https://console.groq.com)
   - Sign up/Login
   - Go to API Keys section
   - Create new API key
   - Copy the key

4. **Configure the Application**
   
   Option A - Edit main.ts directly:
   ```typescript
   // Open src/main.ts and find this line:
   const API_KEY = 'YOUR_API_KEY_HERE'
   // Replace with your actual API key
   ```

   Option B - Create .env file (recommended):
   ```bash
   # Create .env file in project root
   VITE_GROQ_API_KEY=your_api_key_here
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Build for Production**
   ```bash
   npm run build
   ```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GROQ_API_KEY` | Yes | Your Groq API key |

## Project Structure

```
├── src/
│   ├── main.ts          # Main application code
│   ├── style.css      # Styling
│   └── assets/       # Static assets
├── index.html       # HTML entry point
├── package.json    # Dependencies
├── vite.config.ts  # Vite configuration
├── tsconfig.json  # TypeScript configuration
├── README.md      # This file
└── .gitignore    # Git ignore rules
```

## How It Works

### 1. Chat System
- Messages are stored in localStorage
- Each chat has unique ID and title
- Switch between chats in sidebar

### 2. Context Memory
After every message, the AI extracts:
- Your name (when you say "My name is...")
- Location
- Work/Job
- Preferences
- Other facts

This information is stored and included in system prompts for better responses.

### 3. Markdown Rendering
AI responses are rendered with proper formatting using marked.js:
- Headers (# ## ###)
- Bold (**text**)
- Italic (*text*)
- Lists (1. 2. or -)
- Code blocks
- Blockquotes
- Links

### 4. Model Selection
- Models are fetched from Groq API
- Each model is tested automatically
- Working models show ✓
- Non-working models show ✗

## Troubleshooting

### API Key Issues
- Make sure your API key is valid
- Check Groq console for key status
- Ensure API key has not expired

### Models Not Loading
- Check internet connection
- Try clicking refresh button (↻)
- Some models may not work on free tier

### Messages Not Showing
- Clear browser cache
- Check localStorage is enabled
- Try incognito mode

## Tech Stack

- **Frontend**: Vanilla TypeScript
- **Styling**: Tailwind CSS + Custom CSS
- **Build Tool**: Vite
- **Markdown**: marked.js
- **API**: Groq API

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License - feel free to use for any purpose.

## Acknowledgments

- [Groq](https://groq.com) for the fast inference API
- [marked.js](https://marked.js.org) for markdown rendering
- [Vite](https://vitejs.dev) for the build tool

---

Made with ❤️ by Abhijeet