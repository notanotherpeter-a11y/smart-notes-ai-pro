// SmartNotes AI Pro - Shared JavaScript

class SmartNotesCore {
  constructor() {
    this.currentUser = null;
    this.isAdmin = false;
    this.notes = [];
    
    // Initialize on page load
    this.init();
  }
  
  init() {
    this.checkAuth();
    this.initializeDemoAccounts();
    this.initializeNavigation();
    this.initializeMobileMenu();
  }
  
  // Authentication
  checkAuth() {
    const savedUser = localStorage.getItem('smartnotes_user');
    
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.isAdmin = this.currentUser.email === 'admin@smartnotes.com';
      
      // Update UI if user info elements exist
      this.updateUserInfo();
      
      // Load user notes
      this.loadUserNotes();
      
      return true;
    } else {
      // Redirect to login if not authenticated and not already on login page
      if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('index.html')) {
        window.location.href = './index.html';
      }
      return false;
    }
  }
  
  initializeDemoAccounts() {
    const users = JSON.parse(localStorage.getItem('smartnotes_users') || '[]');
    
    // Add demo account
    if (!users.find(u => u.email === 'demo@smartnotes.com')) {
      users.push({
        id: 'demo',
        name: 'Demo User',
        email: 'demo@smartnotes.com',
        password: 'demo123',
        created: new Date().toISOString()
      });
    }
    
    // Add admin account
    if (!users.find(u => u.email === 'admin@smartnotes.com')) {
      users.push({
        id: 'admin',
        name: 'Admin User',
        email: 'admin@smartnotes.com',
        password: 'admin123',
        created: new Date().toISOString(),
        role: 'admin'
      });
    }
    
    localStorage.setItem('smartnotes_users', JSON.stringify(users));
  }
  
  login(email, password) {
    const users = JSON.parse(localStorage.getItem('smartnotes_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      this.currentUser = user;
      this.isAdmin = user.email === 'admin@smartnotes.com';
      localStorage.setItem('smartnotes_user', JSON.stringify(user));
      
      this.showNotification('Welcome back!', 'success');
      
      // Redirect to dashboard
      window.location.href = './dashboard.html';
      
      return true;
    } else {
      this.showNotification('Invalid email or password', 'error');
      return false;
    }
  }
  
  signup(name, email, password) {
    const users = JSON.parse(localStorage.getItem('smartnotes_users') || '[]');
    
    if (users.find(u => u.email === email)) {
      this.showNotification('Email already registered', 'error');
      return false;
    }
    
    const newUser = {
      id: Date.now().toString(),
      name: name,
      email: email,
      password: password,
      created: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('smartnotes_users', JSON.stringify(users));
    
    this.currentUser = newUser;
    localStorage.setItem('smartnotes_user', JSON.stringify(newUser));
    
    this.showNotification('Account created successfully!', 'success');
    window.location.href = './dashboard.html';
    
    return true;
  }
  
  logout() {
    localStorage.removeItem('smartnotes_user');
    this.currentUser = null;
    this.isAdmin = false;
    this.notes = [];
    
    this.showNotification('Logged out successfully', 'info');
    window.location.href = './index.html';
  }
  
  updateUserInfo() {
    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    const userAvatarEl = document.getElementById('userAvatar');
    
    if (this.currentUser) {
      if (userNameEl) userNameEl.textContent = this.currentUser.name;
      if (userEmailEl) userEmailEl.textContent = this.currentUser.email;
      if (userAvatarEl) userAvatarEl.textContent = this.currentUser.name.charAt(0).toUpperCase();
    }
  }
  
  // Navigation
  initializeNavigation() {
    // Highlight current page
    const currentPage = window.location.pathname.split('/').pop();
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href && href.includes(currentPage)) {
        item.classList.add('active');
      }
    });
  }
  
  initializeMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    
    if (menuBtn && sidebar) {
      menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
      
      // Close sidebar when clicking outside
      document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      });
    }
  }
  
  // Notes Management
  loadUserNotes() {
    if (this.currentUser) {
      const userNotes = JSON.parse(localStorage.getItem(`smartnotes_notes_${this.currentUser.id}`) || '[]');
      this.notes = userNotes;
      return this.notes;
    }
    return [];
  }
  
  saveUserNotes() {
    if (this.currentUser) {
      localStorage.setItem(`smartnotes_notes_${this.currentUser.id}`, JSON.stringify(this.notes));
    }
  }
  
  addNote(content, type = 'text') {
    if (!this.currentUser) return false;
    
    const note = {
      id: Date.now().toString(),
      content: content.trim(),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      category: this.categorizeNote(content),
      type: type
    };
    
    this.notes.unshift(note);
    this.saveUserNotes();
    
    this.showNotification('Note added successfully!', 'success');
    return note;
  }
  
  updateNote(noteId, content) {
    const noteIndex = this.notes.findIndex(note => note.id === noteId);
    
    if (noteIndex !== -1) {
      this.notes[noteIndex].content = content.trim();
      this.notes[noteIndex].updated = new Date().toISOString();
      this.notes[noteIndex].category = this.categorizeNote(content);
      
      this.saveUserNotes();
      this.showNotification('Note updated!', 'success');
      return true;
    }
    
    return false;
  }
  
  deleteNote(noteId) {
    const noteIndex = this.notes.findIndex(note => note.id === noteId);
    
    if (noteIndex !== -1) {
      this.notes.splice(noteIndex, 1);
      this.saveUserNotes();
      this.showNotification('Note deleted', 'success');
      return true;
    }
    
    return false;
  }
  
  searchNotes(query) {
    const searchTerm = query.toLowerCase();
    
    return this.notes.filter(note => 
      note.content.toLowerCase().includes(searchTerm) ||
      note.category.toLowerCase().includes(searchTerm)
    );
  }
  
  filterNotesByCategory(category) {
    if (category === 'all') return this.notes;
    return this.notes.filter(note => note.category === category);
  }
  
  filterNotesByType(type) {
    if (type === 'all') return this.notes;
    return this.notes.filter(note => note.type === type);
  }
  
  filterNotesByDate(dateRange) {
    const now = new Date();
    let cutoff;
    
    switch (dateRange) {
      case 'today':
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        return this.notes;
    }
    
    return this.notes.filter(note => new Date(note.created) >= cutoff);
  }
  
  categorizeNote(content) {
    const hour = new Date().getHours();
    const text = content.toLowerCase();
    
    // Priority-based categorization
    if (text.includes('urgent') || text.includes('asap') || text.includes('important')) {
      return 'urgent';
    }
    
    if (text.includes('todo') || text.includes('task') || text.includes('remind')) {
      return 'scheduled';
    }
    
    if (text.includes('meeting') || text.includes('call') || text.includes('appointment')) {
      return 'meeting';
    }
    
    if (text.includes('idea') || text.includes('thought') || text.includes('brainstorm')) {
      return 'idea';
    }
    
    // Time-based fallback
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }
  
  // Statistics
  getStats() {
    const stats = {
      totalNotes: this.notes.length,
      voiceNotes: this.notes.filter(note => note.type === 'voice').length,
      textNotes: this.notes.filter(note => note.type === 'text').length,
      categories: {}
    };
    
    // Count notes by category
    this.notes.forEach(note => {
      stats.categories[note.category] = (stats.categories[note.category] || 0) + 1;
    });
    
    // Recent activity (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    stats.recentNotes = this.notes.filter(note => new Date(note.created) >= weekAgo).length;
    
    return stats;
  }
  
  // Admin Functions
  getAllUsers() {
    if (!this.isAdmin) return [];
    return JSON.parse(localStorage.getItem('smartnotes_users') || '[]');
  }
  
  getAllNotes() {
    if (!this.isAdmin) return [];
    
    const users = this.getAllUsers();
    const allNotes = [];
    
    users.forEach(user => {
      const userNotes = JSON.parse(localStorage.getItem(`smartnotes_notes_${user.id}`) || '[]');
      userNotes.forEach(note => {
        allNotes.push({
          ...note,
          userName: user.name,
          userEmail: user.email
        });
      });
    });
    
    return allNotes.sort((a, b) => new Date(b.created) - new Date(a.created));
  }
  
  deleteUser(userId) {
    if (!this.isAdmin || userId === this.currentUser.id) return false;
    
    const users = this.getAllUsers();
    const filteredUsers = users.filter(user => user.id !== userId);
    
    localStorage.setItem('smartnotes_users', JSON.stringify(filteredUsers));
    localStorage.removeItem(`smartnotes_notes_${userId}`);
    
    this.showNotification('User deleted successfully', 'success');
    return true;
  }
  
  // Utilities
  showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
      existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    // Hide notification
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }
  
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    if (diffHours < 1) {
      const minutes = Math.floor(diffMs / (1000 * 60));
      return `${minutes}m ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
  
  formatContent(content, maxLength = 150) {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }
  
  exportNotes(format = 'json') {
    const data = {
      user: this.currentUser.name,
      exportDate: new Date().toISOString(),
      notes: this.notes
    };
    
    let content, filename, mimeType;
    
    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        filename = `smartnotes-export-${Date.now()}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        const headers = ['Date', 'Type', 'Category', 'Content'];
        const rows = this.notes.map(note => [
          new Date(note.created).toLocaleString(),
          note.type,
          note.category,
          `"${note.content.replace(/"/g, '""')}"`
        ]);
        content = [headers, ...rows].map(row => row.join(',')).join('\n');
        filename = `smartnotes-export-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;
      default:
        throw new Error('Unsupported export format');
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showNotification(`Notes exported as ${format.toUpperCase()}`, 'success');
  }
}

// Voice AI Implementation
class VoiceAI {
  constructor(app) {
    this.app = app;
    this.speechRecognition = null;
    this.isListening = false;
    this.currentTranscript = '';
    
    this.init();
  }
  
  init() {
    if ('webkitSpeechRecognition' in window) {
      this.speechRecognition = new webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.speechRecognition = new SpeechRecognition();
    }
    
    if (this.speechRecognition) {
      this.setupSpeechRecognition();
    }
  }
  
  setupSpeechRecognition() {
    this.speechRecognition.continuous = true;
    this.speechRecognition.interimResults = true;
    this.speechRecognition.lang = 'en-US';
    
    this.speechRecognition.onstart = () => {
      this.isListening = true;
      this.updateUI(true);
      this.app.showNotification('🎙️ Listening... Speak now!', 'info');
    };
    
    this.speechRecognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update input field if exists
      const noteInput = document.getElementById('noteInput');
      if (noteInput && (finalTranscript || interimTranscript)) {
        noteInput.value = (this.currentTranscript || '') + finalTranscript + interimTranscript;
        
        // Update character count if function exists
        if (typeof updateCharCount === 'function') {
          updateCharCount();
        }
      }
      
      if (finalTranscript) {
        this.currentTranscript = (this.currentTranscript || '') + finalTranscript;
      }
    };
    
    this.speechRecognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      let errorMessage = 'Voice recognition error: ';
      switch (event.error) {
        case 'no-speech':
          errorMessage += 'No speech detected. Try speaking louder.';
          break;
        case 'audio-capture':
          errorMessage += 'Microphone not accessible.';
          break;
        case 'not-allowed':
          errorMessage += 'Microphone permission denied.';
          break;
        case 'network':
          errorMessage += 'Network error. Check your connection.';
          break;
        default:
          errorMessage += event.error;
      }
      
      this.app.showNotification(errorMessage, 'error');
      this.stop();
    };
    
    this.speechRecognition.onend = () => {
      this.isListening = false;
      this.updateUI(false);
      
      if (this.currentTranscript && this.currentTranscript.trim()) {
        this.app.showNotification(
          `🎤 Voice input complete: "${this.currentTranscript.substring(0, 50)}..."`, 
          'success'
        );
      }
    };
  }
  
  toggle() {
    if (!this.speechRecognition) {
      this.app.showNotification(
        'Voice AI not supported on this browser. Try Chrome or Safari.', 
        'error'
      );
      return;
    }
    
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }
  
  start() {
    if (!this.speechRecognition) return;
    
    try {
      const noteInput = document.getElementById('noteInput');
      this.currentTranscript = noteInput ? noteInput.value : '';
      this.speechRecognition.start();
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      this.app.showNotification('Could not start voice recognition', 'error');
    }
  }
  
  stop() {
    if (this.speechRecognition && this.isListening) {
      this.speechRecognition.stop();
    }
  }
  
  updateUI(isListening) {
    const button = document.getElementById('voiceButton');
    const status = document.getElementById('voiceStatus');
    
    if (button && status) {
      if (isListening) {
        button.classList.add('listening');
        button.textContent = '⏹️';
        status.classList.add('listening');
        status.textContent = 'Listening... Click to stop';
      } else {
        button.classList.remove('listening');
        button.textContent = '🎙️';
        status.classList.remove('listening');
        status.textContent = 'Click to start voice input';
      }
    }
  }
}

// Initialize global app instance
let smartApp = null;
let voiceAI = null;

document.addEventListener('DOMContentLoaded', () => {
  smartApp = new SmartNotesCore();
  voiceAI = new VoiceAI(smartApp);
});

// Global utility functions
function logout() {
  if (smartApp) {
    smartApp.logout();
  }
}

function toggleVoice() {
  if (voiceAI) {
    voiceAI.toggle();
  }
}

function addQuickPrefix(prefix) {
  const input = document.getElementById('noteInput');
  if (input) {
    input.value = prefix + input.value;
    input.focus();
    if (typeof updateCharCount === 'function') {
      updateCharCount();
    }
  }
}