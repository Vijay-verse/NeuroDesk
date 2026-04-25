import React, { useState, useEffect } from 'react';
import { Plus, Search, Grid, List as ListIcon, Trash2, Edit3 } from 'lucide-react';

const SecondBrain = ({ addToast }) => {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [activeTag, setActiveTag] = useState(null);
  const [formData, setFormData] = useState({
    title: '', content: '', tags: '', color: 'purple'
  });

  const fetchNotes = async () => {
    // Try API first, fallback to localStorage
    try {
      const token = localStorage.getItem('neurodesk_token');
      const res = await fetch('/api/notes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setNotes(data);
          localStorage.setItem('neurodesk_notes_local', JSON.stringify(data));
          return;
        }
      }
    } catch { /* use local */ }

    // Fallback to localStorage
    const local = JSON.parse(localStorage.getItem('neurodesk_notes_local') || '[]');
    setNotes(local);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('neurodesk_token');
    const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
    const noteData = { ...formData, tags: tagsArray };

    // Try API
    let saved = false;
    try {
      const endpoint = editingNote ? `/api/notes/${editingNote.id}` : '/api/notes';
      const method = editingNote ? 'PATCH' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(noteData)
      });

      if (res.ok) {
        saved = true;
      }
    } catch { /* save locally */ }

    // Save to localStorage regardless
    const localNotes = JSON.parse(localStorage.getItem('neurodesk_notes_local') || '[]');
    if (editingNote) {
      const idx = localNotes.findIndex(n => n.id === editingNote.id);
      if (idx !== -1) {
        localNotes[idx] = { ...localNotes[idx], ...noteData };
      }
    } else {
      localNotes.push({
        id: Date.now().toString(),
        ...noteData,
        createdAt: new Date().toISOString()
      });
    }
    localStorage.setItem('neurodesk_notes_local', JSON.stringify(localNotes));

    setIsModalOpen(false);
    setEditingNote(null);
    setFormData({ title: '', content: '', tags: '', color: 'purple' });
    fetchNotes();

    if (addToast) addToast(editingNote ? 'Note updated!' : 'Note created!', 'success');
  };

  const deleteNote = async (id) => {
    const token = localStorage.getItem('neurodesk_token');
    try {
      await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch { /* delete locally */ }

    // Delete from localStorage
    const localNotes = JSON.parse(localStorage.getItem('neurodesk_notes_local') || '[]');
    const filtered = localNotes.filter(n => n.id !== id && n.id !== id.toString());
    localStorage.setItem('neurodesk_notes_local', JSON.stringify(filtered));
    fetchNotes();
    if (addToast) addToast('Note deleted', 'info');
  };

  const openEdit = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      tags: (note.tags || []).join(', '),
      color: note.color || 'purple'
    });
    setIsModalOpen(true);
  };

  // Extract all unique tags
  const allTags = [...new Set(notes.flatMap(n => n.tags || []))].filter(Boolean);

  // Filter notes
  const filteredNotes = notes.filter(n => {
    const matchesSearch =
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.content?.toLowerCase().includes(search.toLowerCase()) ||
      (n.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesTag = !activeTag || (n.tags || []).includes(activeTag);
    return matchesSearch && matchesTag;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Today';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      if (diff < 86400000) return 'Today';
      if (diff < 172800000) return 'Yesterday';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return 'Today'; }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Journal 🧠</h1>
          <p className="page-subtitle">Capture everything. Connect your ideas. Build your knowledge graph.</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditingNote(null); setFormData({ title: '', content: '', tags: '', color: 'purple' }); setIsModalOpen(true); }}>
          <Plus size={16} /> New Note
        </button>
      </div>

      <div className="brain-toolbar">
        <div className="search-wrap">
          <Search size={18} />
          <input
            type="text" placeholder="Search notes, tags…"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="tag-filters">
            <button
              className={`tag-filter ${!activeTag ? 'active' : ''}`}
              onClick={() => setActiveTag(null)}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                className={`tag-filter ${activeTag === tag ? 'active' : ''}`}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        <div className="view-toggle">
          <button className={`view-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}>
            <Grid size={16} />
          </button>
          <button className={`view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
            <ListIcon size={16} />
          </button>
        </div>
      </div>

      <div className={`notes-grid ${view === 'list' ? 'list-view' : ''}`}>
        {filteredNotes.length > 0 ? filteredNotes.map(note => (
          <div key={note.id} className={`note-card color-${note.color || 'purple'}`} onClick={() => openEdit(note)}>
            <div className="note-card-header">
              <h4 className="note-card-title">{note.title}</h4>
              <div className="note-card-actions">
                <button className="note-action-btn edit" onClick={(e) => { e.stopPropagation(); openEdit(note); }}>
                  <Edit3 size={14} />
                </button>
                <button className="note-action-btn" onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <p className="note-card-content">{note.content}</p>
            <div className="note-card-footer">
              <div className="note-tags">
                {(note.tags || []).map((tag, i) => (
                  <span key={i} className="note-tag" onClick={(e) => { e.stopPropagation(); setActiveTag(tag); }}>#{tag}</span>
                ))}
              </div>
              <span className="note-date">{formatDate(note.createdAt)}</span>
            </div>
          </div>
        )) : (
          <div className="notes-empty">
            <div className="empty-icon">🧠</div>
            <p>{search || activeTag ? 'No notes match your search.' : 'Your journal is empty.'}</p>
            <p className="empty-sub">{search || activeTag ? 'Try a different search term.' : 'Start capturing thoughts, ideas, and insights!'}</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay open" onClick={() => setIsModalOpen(false)}>
          <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingNote ? 'Edit Note' : 'New Note'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="field-group">
                  <label className="field-label">Title</label>
                  <input
                    type="text" required value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Content</label>
                  <textarea
                    required value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Tags (comma-separated)</label>
                  <input
                    type="text" value={formData.tags}
                    placeholder="study, ideas, important…"
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  />
                </div>
                <div className="note-color-selector">
                  <label className="field-label">Note Color</label>
                  <div className="color-options">
                    {['purple', 'blue', 'cyan', 'green', 'orange', 'pink'].map(col => (
                      <button
                        key={col} type="button"
                        className={`color-opt ${formData.color === col ? 'active' : ''}`}
                        data-color={col}
                        onClick={() => setFormData({...formData, color: col})}
                      ></button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Note</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default SecondBrain;
