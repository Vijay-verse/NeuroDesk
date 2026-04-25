import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

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
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      // Try to call AI API — for now, use a smart local response system
      // You can replace this with your own API endpoint
      const aiResponse = await generateLocalResponse(content);

      const assistantMsg = { role: 'assistant', content: aiResponse, timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setError('Failed to get response. Please try again.');
      if (addToast) addToast('AI response failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Smart local response system (replace with API call when ready)
  const generateLocalResponse = async (query) => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));

    const q = query.toLowerCase();

    if (q.includes('pomodoro')) {
      return "**The Pomodoro Technique** is a time management method:\n\n1. 🍅 **Work** for 25 minutes (1 Pomodoro)\n2. ☕ **Short break** for 5 minutes\n3. After 4 Pomodoros, take a **long break** (15-30 min)\n\n**Why it works:**\n- Creates urgency (timer pressure)\n- Prevents burnout (regular breaks)\n- Builds momentum (streak motivation)\n\nTry it right now in the **Focus Battle** page! 🎯";
    }

    if (q.includes('study') && (q.includes('tip') || q.includes('advice'))) {
      return "**Top Study Tips for Better Learning:**\n\n1. ⏰ **Active Recall** — Test yourself instead of re-reading\n2. 📅 **Spaced Repetition** — Review material at increasing intervals\n3. 🎯 **Focus Sessions** — Use Pomodoro (25 min focus + 5 min break)\n4. ✍️ **Teach Others** — Explaining concepts deepens understanding\n5. 😴 **Sleep Well** — Memory consolidation happens during sleep\n6. 🏃 **Exercise** — Physical activity boosts cognitive function\n7. 📝 **Take Notes** — Writing by hand improves retention\n\nStart tracking your study time in the **Focus Battle** page!";
    }

    if (q.includes('focus') || q.includes('concentration') || q.includes('distract')) {
      return "**How to Improve Focus:**\n\n🔇 **Environment**\n- Find a quiet space\n- Remove phone notifications\n- Use noise-cancelling headphones\n\n🧠 **Mental**\n- Start with a clear intention\n- Break tasks into small chunks\n- Use the 2-minute rule for momentum\n\n⏱️ **Technique**\n- Pomodoro Timer (25/5 pattern)\n- Deep work blocks (90 minutes)\n- \"Do Not Disturb\" scheduling\n\n💪 **Habits**\n- Same time, same place daily\n- Limit caffeine after 2 PM\n- Take walking breaks\n\nTrack your focus in the **Focus Battle** page and earn XP! ⚡";
    }

    if (q.includes('plan') || q.includes('schedule')) {
      return "**Weekly Study Plan Template:**\n\n📅 **Monday-Friday:**\n- Morning: 2 Pomodoros on hardest subject\n- Afternoon: 2 Pomodoros on secondary subjects\n- Evening: 1 Pomodoro for review + notes\n\n📅 **Saturday:**\n- Active recall and practice tests\n- Review weak areas from the week\n\n📅 **Sunday:**\n- Light review + plan next week\n- Rest and recharge 🔋\n\n**Tips:** Use the **Study Planner** to track tasks and the **Journal** to log learning insights!";
    }

    if (q.includes('memory') || q.includes('remember') || q.includes('memorize')) {
      return "**Best Memory Techniques:**\n\n1. 🏠 **Memory Palace** — Associate info with locations you know\n2. 🔗 **Chunking** — Group information into meaningful chunks\n3. 🎨 **Visualization** — Create vivid mental images\n4. 📝 **Cornell Notes** — Structured note-taking with summaries\n5. 🔄 **Spaced Repetition** — Review at optimal intervals\n6. 🎵 **Mnemonics** — Use acronyms, rhymes, or songs\n7. 📖 **Feynman Technique** — Explain concepts simply\n\nUse the **Journal** page to practice active note-taking! 🧠";
    }

    if (q.includes('burnout') || q.includes('tired') || q.includes('motivation')) {
      return "**Dealing with Study Burnout:**\n\n🔴 **Signs:** Fatigue, loss of motivation, difficulty concentrating\n\n🟢 **Solutions:**\n1. **Take a real break** — Step completely away from studying\n2. **Exercise** — Even a 15-min walk helps\n3. **Sleep** — Priority #1 for recovery\n4. **Set boundaries** — Don't study 24/7\n5. **Reward yourself** — Celebrate small wins\n6. **Change your environment** — Try a cafe or library\n7. **Lower the bar** — 10 minutes > 0 minutes\n\n💡 **Remember:** Consistency beats intensity. Small daily progress compounds! Check your streak in the **Dashboard** 🔥";
    }

    // Default response
    return `Great question! Here are some thoughts:\n\n${query.length > 20 ? "That's an interesting topic." : "I'd love to help with that."} While I'm currently running in offline mode, here are some general tips:\n\n1. **Break it down** — Divide complex problems into smaller pieces\n2. **Use NeuroDesk tools** — Track your progress with Focus Battle, plan with Study Planner\n3. **Stay consistent** — Small daily efforts compound over time\n4. **Take notes** — Use the Journal to capture insights\n\n💡 *Tip: Connect NeuroDesk to an AI API for more detailed, personalized responses!*`;
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
          <p className="page-subtitle">Your intelligent study companion. Ask anything about learning and productivity.</p>
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
            <p>Ask me anything about studying, productivity, or learning techniques. I'm here to help you succeed!</p>
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
                  {msg.content.split('\n').map((line, j) => (
                    <React.Fragment key={j}>
                      {line.startsWith('**') && line.endsWith('**')
                        ? <strong>{line.replace(/\*\*/g, '')}</strong>
                        : line.startsWith('- ') || line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.') || line.startsWith('5.') || line.startsWith('6.') || line.startsWith('7.')
                          ? <div style={{ paddingLeft: 8 }}>{line}</div>
                          : line
                      }
                      {j < msg.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
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
            placeholder="Ask me anything about studying, productivity, focus…"
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
