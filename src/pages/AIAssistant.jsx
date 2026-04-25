import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

const DEEPSEEK_API_KEY = 'sk-7d47b55e1bc84a069ed23c348e05ab79';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const SYSTEM_PROMPT = `You are NeuroDesk AI — a premium, intelligent study assistant built into the NeuroDesk productivity platform.

Your personality: Friendly, encouraging, knowledgeable, and concise. You use emojis sparingly for warmth.

Your expertise:
- Study techniques (Pomodoro, active recall, spaced repetition, Feynman technique)
- Focus and concentration strategies
- Memory improvement methods
- Study planning and time management
- Dealing with procrastination and burnout
- Academic subjects (math, science, history, programming, etc.)
- Productivity habits and goal setting
- Mental health and wellbeing for students

NeuroDesk features you can reference:
- **Focus Battle**: Gamified Pomodoro timer with XP, levels, streaks, and distraction tracking
- **Journal**: Note-taking system with tags and search
- **Analytics**: Charts showing focus history, streaks, and XP milestones
- **Study Planner**: Task management with priorities and deadlines
- **MindTrace**: Mood and energy journaling
- **Utilities**: Todo list, calendar, sticky notes

Guidelines:
- Keep responses concise but helpful (aim for 100-300 words)
- Use markdown formatting: **bold**, bullet points, numbered lists
- When relevant, suggest using NeuroDesk features
- Be encouraging and supportive
- If asked about non-study topics, still help but gently steer back to productivity
- You can help with any academic subject — explain concepts clearly`;

const SUGGESTIONS = [
  "Explain the Pomodoro technique",
  "Give me 5 study tips for exams",
  "How to improve focus and concentration?",
  "Create a study plan for this week",
  "What are the best memory techniques?",
  "How to deal with study burnout?",
];

const AIAssistant = ({ addToast }) => {
  const [messages, setMessages] = useState(
    JSON.parse(localStorage.getItem('neurodesk_ai_messages') || '[]')
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Persist messages
  useEffect(() => {
    localStorage.setItem('neurodesk_ai_messages', JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async (text) => {
    const content = text || input.trim();
    if (!content || isLoading) return;

    setError(null);
    const userMsg = { role: 'user', content, timestamp: Date.now() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const aiResponse = await callDeepSeek(updatedMessages);
      const assistantMsg = { role: 'assistant', content: aiResponse, timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('DeepSeek API error:', err);
      setError(err.message || 'Failed to get response. Please try again.');
      if (addToast) addToast('AI response failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // DeepSeek API call with full conversation history
  const callDeepSeek = async (conversationMessages) => {
    // Build messages array for the API — include last 20 messages for context
    const recentMessages = conversationMessages.slice(-20);
    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentMessages.map(m => ({
        role: m.role,
        content: m.content
      }))
    ];

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error (${response.status})`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
  };

  // Render markdown-formatted text
  const renderMarkdown = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Empty line = spacing
      if (line.trim() === '') {
        elements.push(<div key={i} style={{ height: 8 }} />);
        i++;
        continue;
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(<h4 key={i} style={{ margin: '8px 0 4px', fontWeight: 700, fontSize: 14 }}>{formatInline(line.slice(4))}</h4>);
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(<h3 key={i} style={{ margin: '10px 0 4px', fontWeight: 700, fontSize: 15 }}>{formatInline(line.slice(3))}</h3>);
        i++;
        continue;
      }
      if (line.startsWith('# ')) {
        elements.push(<h2 key={i} style={{ margin: '10px 0 6px', fontWeight: 700, fontSize: 16 }}>{formatInline(line.slice(2))}</h2>);
        i++;
        continue;
      }

      // Code blocks
      if (line.startsWith('```')) {
        const lang = line.slice(3).trim();
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        elements.push(
          <pre key={`code-${i}`} style={{
            background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '12px 14px',
            fontSize: 12, fontFamily: "'Fira Code', 'Consolas', monospace",
            overflow: 'auto', margin: '6px 0', color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        continue;
      }

      // Numbered list items
      if (/^\d+\.\s/.test(line)) {
        elements.push(
          <div key={i} style={{ paddingLeft: 8, margin: '3px 0', lineHeight: 1.6 }}>
            {formatInline(line)}
          </div>
        );
        i++;
        continue;
      }

      // Bullet list items
      if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <div key={i} style={{ paddingLeft: 8, margin: '3px 0', lineHeight: 1.6 }}>
            {formatInline('• ' + line.slice(2))}
          </div>
        );
        i++;
        continue;
      }

      // Regular paragraph
      elements.push(<p key={i} style={{ margin: '3px 0', lineHeight: 1.6 }}>{formatInline(line)}</p>);
      i++;
    }

    return elements;
  };

  // Inline markdown formatting (bold, italic, code, links)
  const formatInline = (text) => {
    const parts = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold: **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      // Inline code: `text`
      const codeMatch = remaining.match(/`([^`]+)`/);
      // Italic: *text*
      const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);

      // Find earliest match
      const matches = [
        boldMatch ? { type: 'bold', match: boldMatch } : null,
        codeMatch ? { type: 'code', match: codeMatch } : null,
        italicMatch ? { type: 'italic', match: italicMatch } : null,
      ].filter(Boolean).sort((a, b) => a.match.index - b.match.index);

      if (matches.length === 0) {
        parts.push(remaining);
        break;
      }

      const first = matches[0];
      const idx = first.match.index;

      // Add text before the match
      if (idx > 0) {
        parts.push(remaining.slice(0, idx));
      }

      if (first.type === 'bold') {
        parts.push(<strong key={key++}>{first.match[1]}</strong>);
        remaining = remaining.slice(idx + first.match[0].length);
      } else if (first.type === 'code') {
        parts.push(
          <code key={key++} style={{
            background: 'rgba(167, 139, 250, 0.15)', padding: '1px 5px',
            borderRadius: 4, fontSize: '0.9em', fontFamily: "'Fira Code', monospace"
          }}>
            {first.match[1]}
          </code>
        );
        remaining = remaining.slice(idx + first.match[0].length);
      } else if (first.type === 'italic') {
        parts.push(<em key={key++}>{first.match[1]}</em>);
        remaining = remaining.slice(idx + first.match[0].length);
      }
    }

    return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaInput = (e) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('neurodesk_ai_messages');
    if (addToast) addToast('Chat cleared', 'info');
  };

  const userName = JSON.parse(localStorage.getItem('neurodesk_user') || '{}')?.name || 'User';
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Assistant 🤖</h1>
          <p className="page-subtitle">Powered by DeepSeek AI — your intelligent study companion.</p>
        </div>
        {messages.length > 0 && (
          <button className="btn-secondary btn-sm" onClick={clearChat}>Clear Chat</button>
        )}
      </div>

      <div className="ai-container">
        {messages.length === 0 && !isLoading ? (
          <div className="ai-empty-state">
            <div className="empty-icon">🧠</div>
            <h2>How can I help you today?</h2>
            <p>Ask me anything about studying, productivity, any subject, or learning techniques. Powered by DeepSeek AI.</p>
            <div className="ai-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="ai-suggestion" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="ai-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-message ${msg.role}`}>
                <div className="ai-avatar">
                  {msg.role === 'user' ? initials : '🤖'}
                </div>
                <div className="ai-bubble">
                  {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="ai-message assistant">
                <div className="ai-avatar">🤖</div>
                <div className="ai-bubble">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="ai-error">
                ❌ {error}
                <button onClick={() => { setError(null); sendMessage(messages[messages.length - 1]?.content); }}>
                  Retry
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        <div className="ai-input-area">
          <textarea
            ref={textareaRef}
            placeholder="Ask me anything — studying, any subject, productivity…"
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="ai-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default AIAssistant;
