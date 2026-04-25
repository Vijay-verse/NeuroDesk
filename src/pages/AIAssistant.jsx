import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

const GEMINI_API_KEY = 'AIzaSyDN0LjgYix-kG49UVm9yw4NEmdYSCdkeu8';

// Fallback chain: try models in order until one works
const GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
];

const buildGeminiUrl = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

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

// Smart local fallback responses when API is unavailable
const LOCAL_RESPONSES = {
  pomodoro: "**The Pomodoro Technique** 🍅\n\n1. **Work** for 25 minutes (1 Pomodoro)\n2. **Short break** for 5 minutes\n3. After 4 Pomodoros, take a **long break** (15-30 min)\n\n**Why it works:**\n- Creates urgency with timer pressure\n- Prevents burnout with regular breaks\n- Builds momentum through streaks\n\nTry it now in **Focus Battle**! 🎯",
  study: "**Top Study Tips** 📚\n\n1. **Active Recall** — Test yourself instead of re-reading\n2. **Spaced Repetition** — Review at increasing intervals\n3. **Pomodoro** — 25 min focus + 5 min break\n4. **Teach Others** — Explaining deepens understanding\n5. **Sleep Well** — Memory consolidation happens during sleep\n\nTrack your sessions in **Focus Battle** to earn XP! ⚡",
  focus: "**Improve Your Focus** 🎯\n\n**Environment:** Remove distractions, use \"Do Not Disturb\"\n**Technique:** Pomodoro Timer (25/5 pattern)\n**Habits:** Same time, same place daily\n**Mental:** Start with clear intentions, break tasks into chunks\n\nUse **Focus Battle** to track your sessions and build streaks! 🔥",
  memory: "**Memory Techniques** 🧠\n\n1. **Memory Palace** — Associate info with locations\n2. **Chunking** — Group info into meaningful chunks\n3. **Spaced Repetition** — Review at optimal intervals\n4. **Feynman Technique** — Explain concepts simply\n5. **Visualization** — Create vivid mental images\n\nCapture insights in the **Journal**! ✍️",
  burnout: "**Dealing with Burnout** 💪\n\n1. **Take a real break** — Step away completely\n2. **Exercise** — Even a 15-min walk helps\n3. **Sleep** — Priority #1 for recovery\n4. **Lower the bar** — 10 minutes > 0 minutes\n5. **Reward yourself** — Celebrate small wins\n\nConsistency beats intensity. Check your streak on the **Dashboard**! 🔥",
  plan: "**Weekly Study Plan** 📅\n\n**Mon-Fri:**\n- Morning: 2 Pomodoros on hardest subject\n- Afternoon: 2 Pomodoros on secondary subjects\n- Evening: 1 Pomodoro for review\n\n**Saturday:** Practice tests & weak areas\n**Sunday:** Light review + plan next week\n\nUse the **Study Planner** to track your tasks!",
  default: "Great question! Here are some tips:\n\n1. **Break it down** — Divide problems into smaller pieces\n2. **Use NeuroDesk** — Track progress with Focus Battle, plan with Study Planner\n3. **Stay consistent** — Small daily efforts compound\n4. **Take notes** — Use the Journal to capture insights\n\n*Note: I'm currently in offline mode. The AI service will resume shortly!* 💡"
};

const getLocalResponse = (query) => {
  const q = query.toLowerCase();
  if (q.includes('pomodoro')) return LOCAL_RESPONSES.pomodoro;
  if (q.includes('study') || q.includes('tip') || q.includes('exam')) return LOCAL_RESPONSES.study;
  if (q.includes('focus') || q.includes('concentrat') || q.includes('distract')) return LOCAL_RESPONSES.focus;
  if (q.includes('memory') || q.includes('remember') || q.includes('memorize')) return LOCAL_RESPONSES.memory;
  if (q.includes('burnout') || q.includes('tired') || q.includes('motivation')) return LOCAL_RESPONSES.burnout;
  if (q.includes('plan') || q.includes('schedule')) return LOCAL_RESPONSES.plan;
  return LOCAL_RESPONSES.default;
};

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
      const aiResponse = await callGemini(updatedMessages);
      const assistantMsg = { role: 'assistant', content: aiResponse, timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.warn('Gemini API unavailable, using local fallback:', err.message);
      // Fallback to local responses instead of showing error
      const fallbackResponse = getLocalResponse(content);
      const assistantMsg = { role: 'assistant', content: fallbackResponse, timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMsg]);
      if (addToast) addToast('Using offline mode — AI quota exceeded', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  // Gemini API call — tries multiple models in fallback chain
  const callGemini = async (conversationMessages) => {
    const recentMessages = conversationMessages.slice(-20);

    const contents = recentMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const requestBody = JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.95,
        topK: 40
      }
    });

    // Try each model in the fallback chain
    let lastError = null;
    for (const model of GEMINI_MODELS) {
      try {
        const response = await fetch(buildGeminiUrl(model), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        }

        // If quota/rate error, try next model
        const errData = await response.json().catch(() => ({}));
        lastError = errData.error?.message || `${model}: HTTP ${response.status}`;
        console.warn(`Gemini ${model} failed:`, lastError);
        continue;
      } catch (e) {
        lastError = e.message;
        continue;
      }
    }

    throw new Error(lastError || 'All Gemini models unavailable');
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

  // Inline markdown formatting (bold, italic, code)
  const formatInline = (text) => {
    const parts = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const codeMatch = remaining.match(/`([^`]+)`/);
      const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);

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
          <p className="page-subtitle">Powered by Gemini AI — your intelligent study companion.</p>
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
            <p>Ask me anything about studying, productivity, any subject, or learning techniques. Powered by Gemini AI.</p>
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
