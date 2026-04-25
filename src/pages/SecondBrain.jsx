import React, { useState, useEffect } from 'react';
import { Plus, Search, Grid, List as ListIcon, Trash2, Edit3, Link as LinkIcon } from 'lucide-react';

const SecondBrain = () => {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({
    title: '', content: '', tags: '', color: 'purple'
  });

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('neurodesk_token');
      const res = await fetch('/api/notes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setNotes(data || []);
    } catch (err) {
      console.error('Failed to fetch notes');
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('neurodesk_token');
    const endpoint = editingNote ? `/api/notes/${editingNote.id}` : '/api/notes';
    const method = editingNote ? 'PATCH' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setEditingNote(null);
        setFormData({ title: '', content: '', tags: '', color: 'purple' });
        fetchNotes();
      } else {
        alert(data.error || 'The brain is fogged. Unable to save this note.');
      }
    } catch (err) {
      console.error('Failed to save note');
      alert('The neural connection was lost. Check your internet.');
    }
  };

  const deleteNote = async (id) => {
    const token = localStorage.getItem('neurodesk_token');
    try {
      await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotes();
    } catch (err) {
      console.error('Failed to delete note');
    }
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

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="page active">
      <div className="page-header">
        <div>
          <h1 className="page-title">Journal 🧠</h1>
          <p className="page-subtitle">Capture everything. Connect your ideas. Build your knowledge graph.</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditingNote(null); setIsModalOpen(true); }}>
          <Plus size={16} /> New Note
        </button>
      </div>

      <div className="brain-toolbar">
        <div className="search-wrap">
          <Search size={18} />
          <input 
            type="text" placeholder="Search notes…" 
            value={search} onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
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
                  <span key={i} className="note-tag">{tag}</span>
                ))}
              </div>
              <span className="note-date">Today</span>
            </div>
          </div>
        )) : (
          <div className="notes-empty">
            <div className="empty-icon">🧠</div>
            <p>Your journal is empty.</p>
            <p className="empty-sub">Start capturing thoughts, ideas, and insights!</p>
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
