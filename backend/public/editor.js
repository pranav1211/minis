class MinisEditor {
    constructor() {
        this.posts = [];
        this.selectedPostId = null;
        this.createEditor = null;
        this.editEditor = null;
        this.createTagMgr = null;
        this.editTagMgr = null;
        this._selectedImg = null;

        this.init();
    }

    async init() {
        this.setupAuth();
        this.setupTabs();
        this.initEditors();
        this._setupImageDeletion('create-editor');
        this._setupImageDeletion('edit-editor');
        this._setupGlobalImageKeydown();
        this.createTagMgr = this.setupTagPills('create');
        this.editTagMgr   = this.setupTagPills('edit');
        this.setupCreateForm();
        this.setupEditForm();
        await this.loadPosts();
    }

    // ── Auth ──

    setupAuth() {
        const isAuthenticated = this.getCookie('beyondme_auth');
        if (!isAuthenticated || isAuthenticated !== 'true') {
            window.location.href = 'https://manage.beyondmebtw.com';
            return;
        }
        if (!this.getCookie('beyondme_auth_key')) {
            window.location.href = 'https://manage.beyondmebtw.com';
            return;
        }
        document.getElementById('logout-btn').addEventListener('click', () => {
            document.cookie = 'beyondme_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.beyondmebtw.com';
            document.cookie = 'beyondme_auth_key=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.beyondmebtw.com';
            window.location.href = 'https://manage.beyondmebtw.com';
        });
    }

    getCookie(name) {
        for (const cookie of document.cookie.split(';')) {
            const [k, ...v] = cookie.trim().split('=');
            if (k === name) return decodeURIComponent(v.join('='));
        }
        return null;
    }

    getPassword() {
        return this.getCookie('beyondme_auth_key') || '';
    }

    // ── Tabs ──

    setupTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
            });
        });
    }

    // ── Toast UI Editors ──

    initEditors() {
        const toolbarItems = [
            ['heading', 'bold', 'italic', 'strike'],
            ['hr', 'quote'],
            ['ul', 'ol', 'task'],
            ['link', 'image'],
        ];

        this.createEditor = new toastui.Editor({
            el: document.getElementById('create-editor'),
            height: 'calc(100vh - 210px)',
            initialEditType: 'wysiwyg',
            previewStyle: 'vertical',
            placeholder: 'write something real…',
            hideModeSwitch: false,
            toolbarItems,
        });

        this.editEditor = new toastui.Editor({
            el: document.getElementById('edit-editor'),
            height: 'calc(100vh - 210px)',
            initialEditType: 'wysiwyg',
            previewStyle: 'vertical',
            placeholder: 'edit your mini…',
            hideModeSwitch: false,
            toolbarItems,
        });
    }

    // ── Tag Pills ──

    setupTagPills(prefix) {
        const pillsRow     = document.getElementById(`${prefix}-pills`);
        const textInput    = document.getElementById(`${prefix}-tag-text`);
        const suggestPanel = document.getElementById(`${prefix}-tag-suggestions`);
        const clearBtn     = document.getElementById(`${prefix}-clear-tags`);
        const wrapper      = document.getElementById(`${prefix}-tag-wrapper`);

        let tags = [];

        const getExistingTags = () => {
            const all = new Set();
            this.posts.forEach(p => (p.tags || []).forEach(t => all.add(t)));
            return Array.from(all).sort();
        };

        const renderPills = () => {
            pillsRow.innerHTML = '';
            tags.forEach((t, i) => {
                const span = document.createElement('span');
                span.className = 'tag-pill';
                span.appendChild(document.createTextNode(t));
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'pill-remove';
                btn.textContent = '×';
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    tags.splice(i, 1);
                    renderPills();
                    showSuggestions(textInput.value.trim());
                });
                span.appendChild(btn);
                pillsRow.appendChild(span);
            });
            if (clearBtn) clearBtn.style.display = tags.length > 0 ? 'inline-flex' : 'none';
        };

        const addTag = (raw) => {
            const tag = raw.trim().toLowerCase().replace(/,/g, '');
            if (tag && !tags.includes(tag)) {
                tags.push(tag);
                renderPills();
            }
            textInput.value = '';
            showSuggestions('');
        };

        const showSuggestions = (query) => {
            const filtered = getExistingTags().filter(t =>
                !tags.includes(t) &&
                (query === '' || t.toLowerCase().includes(query.toLowerCase()))
            );
            if (!filtered.length) {
                suggestPanel.style.display = 'none';
                suggestPanel.innerHTML = '';
                return;
            }
            suggestPanel.innerHTML = filtered.slice(0, 25).map(t =>
                `<span class="suggestion-pill" data-tag="${this.escapeHtml(t)}">${this.escapeHtml(t)}</span>`
            ).join('');
            suggestPanel.style.display = 'flex';
            suggestPanel.querySelectorAll('.suggestion-pill').forEach(el => {
                el.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    addTag(el.dataset.tag);
                    textInput.focus();
                });
            });
        };

        textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (textInput.value.trim()) addTag(textInput.value);
            }
            if (e.key === 'Backspace' && !textInput.value && tags.length > 0) {
                tags.pop();
                renderPills();
                showSuggestions('');
            }
        });

        textInput.addEventListener('input', () => {
            const val = textInput.value;
            if (val.includes(',')) {
                val.split(',').forEach((part, idx, arr) => {
                    if (idx < arr.length - 1 && part.trim()) addTag(part);
                });
                textInput.value = val.split(',').pop();
            }
            showSuggestions(textInput.value.trim());
        });

        textInput.addEventListener('focus',  () => showSuggestions(textInput.value.trim()));
        textInput.addEventListener('blur',   () => setTimeout(() => { suggestPanel.style.display = 'none'; }, 200));
        wrapper.addEventListener('click', () => textInput.focus());

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                tags = [];
                renderPills();
                suggestPanel.style.display = 'none';
            });
        }

        return {
            getTags:  () => tags.join(', '),
            setTags:  (val) => {
                tags = (val || '').split(',').map(t => t.trim()).filter(Boolean);
                renderPills();
                showSuggestions('');
            },
            clear:    () => { tags = []; renderPills(); },
        };
    }

    // ── Create form ──

    setupCreateForm() {
        document.getElementById('create-submit-btn').addEventListener('click', () => this.createPost());
    }

    async createPost() {
        const title    = document.getElementById('create-title').value.trim();
        const tags     = this.createTagMgr.getTags();
        const content  = this.createEditor.getMarkdown().trim();
        const password = this.getPassword();

        if (!title || !content) {
            this.showStatus('create-status', 'Title and content are required.', 'error');
            return;
        }
        if (!password) {
            this.showStatus('create-status', 'Authentication required.', 'error');
            return;
        }

        this.showStatus('create-status', 'Publishing…', 'loading');

        try {
            const res  = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, tags, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create post');

            this.showStatus('create-status', `Published! ID: ${data.id}`, 'success');
            document.getElementById('create-title').value = '';
            this.createTagMgr.clear();
            this.createEditor.setMarkdown('');
            await this.loadPosts();
        } catch (err) {
            this.showStatus('create-status', err.message, 'error');
        }
    }

    // ── Edit form ──

    setupEditForm() {
        document.getElementById('edit-search').addEventListener('input', (e) => {
            this.filterPostList(e.target.value.trim());
        });

        document.getElementById('editForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updatePost();
        });

        document.getElementById('delete-btn').addEventListener('click', async () => {
            if (!this.selectedPostId) return;
            if (confirm('Delete this mini? This cannot be undone.')) await this.deletePost();
        });
    }

    async loadPosts() {
        try {
            const res  = await fetch('/api/posts');
            const data = await res.json();
            this.posts = data.posts || [];
            this.renderPostList(this.posts);
            this.updatePostCount(this.posts.length);
        } catch (err) {
            console.error('Failed to load posts:', err);
        }
    }

    updatePostCount(n) {
        const el = document.getElementById('edit-post-count');
        if (el) el.textContent = `${n} mini${n !== 1 ? 's' : ''}`;
    }

    renderPostList(posts) {
        const list = document.getElementById('post-list');
        if (!posts.length) {
            list.innerHTML = '<div class="post-list-empty">no posts found</div>';
            return;
        }
        list.innerHTML = posts.map(post => `
            <div class="post-list-item ${post.id === this.selectedPostId ? 'selected' : ''}" data-id="${post.id}">
                <div class="post-list-title">${this.escapeHtml(post.title)}</div>
                <div class="post-list-meta">${post.date} · ${post.time}</div>
                <div class="post-list-tags">
                    ${(post.tags || []).map(t => `<span class="post-list-tag">${this.escapeHtml(t)}</span>`).join('')}
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.post-list-item').forEach(item => {
            item.addEventListener('click', () => this.selectPost(item.dataset.id));
        });
    }

    filterPostList(query) {
        if (!query) {
            this.renderPostList(this.posts);
            this.updatePostCount(this.posts.length);
            return;
        }
        const q        = query.toLowerCase();
        const filtered = this.posts.filter(p =>
            p.title.toLowerCase().includes(q) ||
            (p.tags || []).some(t => t.toLowerCase().includes(q))
        );
        this.renderPostList(filtered);
        this.updatePostCount(filtered.length);
    }

    async selectPost(id) {
        this.selectedPostId = id;
        document.querySelectorAll('.post-list-item').forEach(el => {
            el.classList.toggle('selected', el.dataset.id === id);
        });

        try {
            const res  = await fetch(`/api/posts/${id}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            const post = data.post;
            document.getElementById('edit-id').value    = post.id;
            document.getElementById('edit-title').value = post.title;
            this.editTagMgr.setTags((post.tags || []).join(', '));
            this.editEditor.setMarkdown(post.content || '');

            document.getElementById('editForm').style.display        = 'flex';
            document.getElementById('edit-empty-state').style.display = 'none';
        } catch (err) {
            this.showStatus('edit-status', `Failed to load: ${err.message}`, 'error');
        }
    }

    async updatePost() {
        if (!this.selectedPostId) return;

        const title    = document.getElementById('edit-title').value.trim();
        const tags     = this.editTagMgr.getTags();
        const content  = this.editEditor.getMarkdown().trim();
        const password = this.getPassword();

        if (!title || !content) {
            this.showStatus('edit-status', 'Title and content are required.', 'error');
            return;
        }
        if (!password) {
            this.showStatus('edit-status', 'Authentication required.', 'error');
            return;
        }

        this.showStatus('edit-status', 'Saving…', 'loading');

        try {
            const res  = await fetch(`/api/posts/${this.selectedPostId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, tags, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update post');

            this.showStatus('edit-status', 'Saved!', 'success');
            await this.loadPosts();
        } catch (err) {
            this.showStatus('edit-status', err.message, 'error');
        }
    }

    async deletePost() {
        if (!this.selectedPostId) return;

        const password = this.getPassword();
        if (!password) {
            this.showStatus('edit-status', 'Authentication required.', 'error');
            return;
        }

        this.showStatus('edit-status', 'Deleting…', 'loading');

        try {
            const res  = await fetch(`/api/posts/${this.selectedPostId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete post');

            this.showStatus('edit-status', 'Deleted.', 'success');
            this.selectedPostId = null;
            document.getElementById('editForm').style.display        = 'none';
            document.getElementById('edit-empty-state').style.display = 'flex';
            await this.loadPosts();
        } catch (err) {
            this.showStatus('edit-status', err.message, 'error');
        }
    }

    // ── Image deletion ──

    _setupImageDeletion(editorId) {
        document.getElementById(editorId).addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG') {
                if (this._selectedImg) this._selectedImg.classList.remove('img-selected');
                this._selectedImg = e.target;
                e.target.classList.add('img-selected');
            } else {
                if (this._selectedImg) this._selectedImg.classList.remove('img-selected');
                this._selectedImg = null;
            }
        });
    }

    _setupGlobalImageKeydown() {
        document.addEventListener('keydown', (e) => {
            if (!this._selectedImg) return;
            if (e.key !== 'Delete' && e.key !== 'Backspace') return;
            const tag = document.activeElement.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement.isContentEditable) return;
            e.preventDefault();
            this._selectedImg.remove();
            this._selectedImg = null;
        });
    }

    // ── Helpers ──

    showStatus(elementId, message, type) {
        const el = document.getElementById(elementId);
        el.textContent   = message;
        el.className     = `status-message ${type}`;
        el.style.display = 'block';
        if (type === 'success') setTimeout(() => { el.style.display = 'none'; }, 4000);
    }

    escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => new MinisEditor());
