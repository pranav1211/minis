class MinisEditor {
    constructor() {
        this.posts = [];
        this.selectedPostId = null;
        this.createEditor = null;
        this.editEditor = null;

        this.init();
    }

    async init() {
        this.setupAuth();
        this.setupTabs();
        this.setupCreateForm();
        this.setupEditForm();
        this.initEditors();
        await this.loadPosts();
    }

    // --- Auth ---

    setupAuth() {
        // Check if user is authenticated via beyondme_auth cookie
        const isAuthenticated = this.getCookie('beyondme_auth');
        if (!isAuthenticated || isAuthenticated !== 'true') {
            window.location.href = 'https://manage.beyondmebtw.com';
            return;
        }

        // Verify we have the auth key
        const authKey = this.getCookie('beyondme_auth_key');
        if (!authKey) {
            window.location.href = 'https://manage.beyondmebtw.com';
            return;
        }

        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn.addEventListener('click', () => {
            // Clear auth cookies and redirect to login
            document.cookie = 'beyondme_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.beyondmebtw.com';
            document.cookie = 'beyondme_auth_key=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.beyondmebtw.com';
            window.location.href = 'https://manage.beyondmebtw.com';
        });
    }

    getCookie(name) {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [cookieName, ...rest] = cookie.trim().split('=');
            if (cookieName === name) {
                return decodeURIComponent(rest.join('='));
            }
        }
        return null;
    }

    getPassword() {
        return this.getCookie('beyondme_auth_key') || '';
    }

    // --- Tabs ---

    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
                document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');

                // Refresh editors when switching tabs (CodeMirror needs this)
                if (btn.dataset.tab === 'create' && this.createEditor) {
                    this.createEditor.codemirror.refresh();
                }
                if (btn.dataset.tab === 'edit' && this.editEditor) {
                    this.editEditor.codemirror.refresh();
                }
            });
        });
    }

    // --- EasyMDE Editors ---

    initEditors() {
        const editorConfig = {
            spellChecker: false,
            status: false,
            toolbar: [
                'bold', 'italic', 'heading', '|',
                'quote', 'unordered-list', 'ordered-list', '|',
                'link', 'image', 'horizontal-rule', '|',
                'preview', 'side-by-side', '|',
                'guide'
            ],
            sideBySideFullscreen: false,
            minHeight: '300px',
        };

        this.createEditor = new EasyMDE({
            element: document.getElementById('create-content'),
            ...editorConfig,
            placeholder: 'Write your mini in markdown...'
        });

        this.editEditor = new EasyMDE({
            element: document.getElementById('edit-content'),
            ...editorConfig,
            placeholder: 'Edit your mini...'
        });
    }

    // --- Create Form ---

    setupCreateForm() {
        const form = document.getElementById('createForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createPost();
        });
    }

    async createPost() {
        const title = document.getElementById('create-title').value.trim();
        const tags = document.getElementById('create-tags').value.trim();
        const content = this.createEditor.value().trim();
        const password = this.getPassword();

        if (!title || !content) {
            this.showStatus('create-status', 'Title and content are required.', 'error');
            return;
        }

        if (!password) {
            this.showStatus('create-status', 'Authentication required. Please log in.', 'error');
            return;
        }

        this.showStatus('create-status', 'Creating post...', 'loading');

        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, tags, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create post');
            }

            this.showStatus('create-status', `Post created! ID: ${data.id}`, 'success');
            document.getElementById('create-title').value = '';
            document.getElementById('create-tags').value = '';
            this.createEditor.value('');
            await this.loadPosts();
        } catch (err) {
            this.showStatus('create-status', err.message, 'error');
        }
    }

    // --- Edit Form ---

    setupEditForm() {
        const searchInput = document.getElementById('edit-search');
        searchInput.addEventListener('input', () => {
            this.filterPostList(searchInput.value.trim());
        });

        const form = document.getElementById('editForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updatePost();
        });

        const deleteBtn = document.getElementById('delete-btn');
        deleteBtn.addEventListener('click', async () => {
            if (!this.selectedPostId) return;
            const confirmed = confirm('Are you sure you want to delete this post? This cannot be undone.');
            if (confirmed) {
                await this.deletePost();
            }
        });
    }

    async loadPosts() {
        try {
            const res = await fetch('/api/posts');
            const data = await res.json();
            this.posts = data.posts || [];
            this.renderPostList(this.posts);
        } catch (err) {
            console.error('Failed to load posts:', err);
        }
    }

    renderPostList(posts) {
        const list = document.getElementById('post-list');

        if (posts.length === 0) {
            list.innerHTML = '<div class="post-list-empty">No posts found</div>';
            return;
        }

        list.innerHTML = posts.map(post => `
            <div class="post-list-item ${post.id === this.selectedPostId ? 'selected' : ''}" data-id="${post.id}">
                <div>
                    <div class="post-list-title">${this.escapeHtml(post.title)}</div>
                    <div class="post-list-meta">${post.date} at ${post.time}</div>
                    <div class="post-list-tags">
                        ${(post.tags || []).map(t => `<span class="post-list-tag">${this.escapeHtml(t)}</span>`).join('')}
                    </div>
                </div>
                <div class="post-list-meta">${post.id}</div>
            </div>
        `).join('');

        list.querySelectorAll('.post-list-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectPost(item.dataset.id);
            });
        });
    }

    filterPostList(query) {
        if (!query) {
            this.renderPostList(this.posts);
            return;
        }
        const q = query.toLowerCase();
        const filtered = this.posts.filter(p =>
            p.title.toLowerCase().includes(q)
        );
        this.renderPostList(filtered);
    }

    async selectPost(id) {
        this.selectedPostId = id;

        // Highlight in list
        document.querySelectorAll('.post-list-item').forEach(el => {
            el.classList.toggle('selected', el.dataset.id === id);
        });

        // Fetch full post
        try {
            const res = await fetch(`/api/posts/${id}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            const post = data.post;
            document.getElementById('edit-id').value = post.id;
            document.getElementById('edit-title').value = post.title;
            document.getElementById('edit-tags').value = (post.tags || []).join(', ');
            this.editEditor.value(post.content || '');

            document.getElementById('editForm').style.display = 'block';
        } catch (err) {
            console.error('Failed to load post:', err);
            this.showStatus('edit-status', `Failed to load post: ${err.message}`, 'error');
        }
    }

    async updatePost() {
        if (!this.selectedPostId) return;

        const title = document.getElementById('edit-title').value.trim();
        const tags = document.getElementById('edit-tags').value.trim();
        const content = this.editEditor.value().trim();
        const password = this.getPassword();

        if (!title || !content) {
            this.showStatus('edit-status', 'Title and content are required.', 'error');
            return;
        }

        if (!password) {
            this.showStatus('edit-status', 'Authentication required. Please log in.', 'error');
            return;
        }

        this.showStatus('edit-status', 'Updating post...', 'loading');

        try {
            const res = await fetch(`/api/posts/${this.selectedPostId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, tags, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update post');
            }

            this.showStatus('edit-status', 'Post updated successfully!', 'success');
            await this.loadPosts();
        } catch (err) {
            this.showStatus('edit-status', err.message, 'error');
        }
    }

    async deletePost() {
        if (!this.selectedPostId) return;

        const password = this.getPassword();
        if (!password) {
            this.showStatus('edit-status', 'Authentication required. Please log in.', 'error');
            return;
        }

        this.showStatus('edit-status', 'Deleting post...', 'loading');

        try {
            const res = await fetch(`/api/posts/${this.selectedPostId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to delete post');
            }

            this.showStatus('edit-status', 'Post deleted.', 'success');
            this.selectedPostId = null;
            document.getElementById('editForm').style.display = 'none';
            await this.loadPosts();
        } catch (err) {
            this.showStatus('edit-status', err.message, 'error');
        }
    }

    // --- Helpers ---

    showStatus(elementId, message, type) {
        const el = document.getElementById(elementId);
        el.textContent = message;
        el.className = `status-message ${type}`;
        el.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => { el.style.display = 'none'; }, 4000);
        }
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new MinisEditor();
});
