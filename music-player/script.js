/* script.js — Updated: includes pre-stored sample songs + upload functionality */

(() => {
    // Sample songs that are always available
    const sampleSongs = [
        {
            id: 'sample_1',
            title: 'Saathi',
            artist: 'Kumar Sanu, Anwar',
            file_path: 'https://pagalfree.com/musics/128-Aisa Bhi Dekho Waqt - Saathi 128 Kbps.mp3', // Replace with actual audio files
            srcType: 'sample',
            liked: false
        },
        {
            id: 'Bada Naam Karenge',
            title: 'Bada Naam Karenge',
            artist: 'Indie Band',
            file_path: 'https://pagalfree.com/musics/128-Aap Nazar Aaye  - Bada Naam Karenge 128 Kbps.mp3', // Replace with actual audio files
            srcType: 'sample',
            liked: false
        },
        {
            id: 'sample_3',
            title: 'Dhadak 2',
            artist: 'Unknown Artist',
            file_path: 'https://pagalfree.com/musics/128-Bas Ek Dhadak - Dhadak 2 128 Kbps.mp3', // Replace with actual audio files
            srcType: 'sample',
            liked: false
        }
    ];

    // Elements
    const container = document.querySelector('.player-container');
    const albumImage = document.querySelector('.album-image');
    const titleEl = document.querySelector('.song-title');
    const artistEl = document.querySelector('.song-artist');

    // Play buttons (there are two play buttons in HTML)
    const playButtons = Array.from(document.querySelectorAll('.player-main .btn.play'));
    const mainPlayBtn = playButtons[0] || document.querySelector('.player-main .btn.play');
    const controlPlayBtn = playButtons[1] || mainPlayBtn;

    const prevBtn = document.querySelector('.btn.prev');
    const nextBtn = document.querySelector('.btn.next');
    const shuffleBtn = document.querySelector('.btn.shuffle');
    const repeatBtn = document.querySelector('.btn.repeat');
    const downloadTopBtn = document.querySelector('.btn.download');
    const fullscreenBtn = document.querySelector('.btn.fullscreen');
    const likeBtn = document.querySelector('.btn.like');
    const lyricsBtn = document.querySelector('.btn.lyrics');
    const queueBtn = document.querySelector('.btn.queue');
    const equalizerBtn = document.querySelector('.btn.equalizer');

    const progressInput = document.querySelector('.progress-bar');
    const currentTimeEl = document.querySelector('.current-time');
    const durationEl = document.querySelector('.duration');

    const volumeInput = document.querySelector('.bottom-controls .volume-control input[type="range"]') ||
        document.querySelector('.volume-control input[type="range"]') ||
        document.querySelector('input[type="range"][min="0"][max="1"]');

    const playlistContainer = document.querySelector('.playlist-items') || document.getElementById('playlist');
    const filePicker = document.getElementById('songUploader'); // file input
    const addBtn = document.querySelector('.btn.add');
    const uploadForm = document.getElementById('uploadForm');

    // Audio & state
    const audio = new Audio();
    audio.preload = 'auto';
    let songs = [];       // master playlist
    let currentIndex = 0;
    let isPlaying = false;
    let isShuffle = false;
    let isRepeat = false;
    let likedIds = new Set(JSON.parse(localStorage.getItem('music_likes') || '[]'));

    // helpers
    function humanTime(sec) {
        if (!sec || isNaN(sec)) return '0:00';
        const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
        return `${m}:${String(s).padStart(2, '0')}`;
    }
    function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }

    // server fetch (if you have get_songs.php)
    async function fetchServerSongs() {
        try {
            const res = await fetch('get_songs.php', { cache: 'no-store' });
            if (!res.ok) throw new Error('no api');
            const data = await res.json();
            return data.map(row => ({
                id: row.id || row.ID || null,
                title: row.title || row.name || row.file || 'Unknown',
                artist: row.artist || row.artist_name || 'Unknown',
                file_path: row.file_path || row.path || row.file || '',
                srcType: 'server',
                liked: row.liked ? !!Number(row.liked) : false
            }));
        } catch (err) {
            console.log('Server songs not available, using sample songs');
            return null;
        }
    }

    // load playlist (server first, then merge with samples)
    async function loadPlaylist() {
        // Always start with sample songs
        songs = [...sampleSongs];
        
        // Try to fetch and add server songs
        const serverSongs = await fetchServerSongs();
        if (serverSongs && serverSongs.length > 0) {
            // Add server songs after sample songs
            songs = [...songs, ...serverSongs];
        }
        
        renderPlaylist();
        if (songs.length) loadTrack(0);
    }

    // render sidebar playlist
    function renderPlaylist(list = songs) {
        if (!playlistContainer) return;
        playlistContainer.innerHTML = '';
        
        // Add a header to show different song sources
        if (list.length > 0) {
            const header = document.createElement('div');
            header.innerHTML = `<h3 style="color: #00abf0; margin-bottom: 10px;">Playlist (${list.length} songs)</h3>`;
            playlistContainer.appendChild(header);
        }
        
        list.forEach((s, idx) => {
            const item = document.createElement('div');
            item.className = 'playlist-item';
            
            // Add source indicator
            const sourceIcon = s.srcType === 'sample' ? '🎵' : 
                              s.srcType === 'server' ? '☁️' : 
                              s.srcType === 'local' ? '📁' : '🎶';
            
            item.innerHTML = `
          <div class="meta" style="display:flex;flex-direction:column;">
            <div class="title" style="font-weight:600">${sourceIcon} ${escapeHtml(s.title)}</div>
            <div class="artist" style="font-size:12px;color:#9aa0b3">${escapeHtml(s.artist)}</div>
          </div>
          <div class="actions" style="display:flex;gap:6px;align-items:center">
            <button class="btn play-now" data-idx="${idx}" title="Play"><i class="fa fa-play"></i></button>
            <button class="btn download-item" data-idx="${idx}" title="Download"><i class="fa fa-download"></i></button>
            ${s.srcType !== 'sample' ? `<button class="btn del-item" data-id="${s.id || ''}" title="Delete"><i class="fa fa-trash"></i></button>` : ''}
          </div>
        `;
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            item.style.padding = '8px';
            item.style.marginBottom = '8px';
            item.style.borderRadius = '8px';
            item.style.background = '#1a1b24';
            playlistContainer.appendChild(item);
        });

        // handlers
        playlistContainer.querySelectorAll('.play-now').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.dataset.idx);
                if (isNaN(idx)) return;
                loadTrack(idx);
                play();
            });
        });
        playlistContainer.querySelectorAll('.download-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.dataset.idx);
                const s = songs[idx];
                downloadTrack(s);
            });
        });
        playlistContainer.querySelectorAll('.del-item').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                if (!id) {
                    const parent = btn.closest('.playlist-item');
                    const all = Array.from(playlistContainer.children);
                    const index = all.indexOf(parent) - 1; // -1 because of header
                    if (index >= 0) {
                        songs.splice(index, 1); 
                        renderPlaylist();
                        if (index === currentIndex) { 
                            audio.pause(); 
                            isPlaying = false; 
                            updatePlayButtons(); 
                        }
                    }
                    return;
                }
                if (!confirm('Delete this song permanently?')) return;
                try {
                    const res = await fetch('delete_song.php', { 
                        method: 'POST', 
                        headers: { 'Content-Type': 'application/json' }, 
                        body: JSON.stringify({ id: Number(id) }) 
                    });
                    await loadFromServerAgain();
                } catch (e) {
                    try { 
                        await fetch(`delete_song.php?id=${encodeURIComponent(id)}`); 
                        await loadFromServerAgain(); 
                    }
                    catch (e2) { alert('Delete failed'); }
                }
            });
        });
        highlightCurrent();
    }

    async function loadFromServerAgain() {
        // Keep sample songs and reload server songs
        songs = [...sampleSongs];
        const serverSongs = await fetchServerSongs();
        if (serverSongs) {
            songs = [...songs, ...serverSongs];
        }
        renderPlaylist();
        if (songs.length === 0) {
            audio.pause(); isPlaying = false; updatePlayButtons();
            titleEl.textContent = 'No song'; artistEl.textContent = '—'; albumImage.src = 'defult.jpg';
        } else { 
            currentIndex = Math.min(currentIndex, songs.length - 1);
            loadTrack(currentIndex); 
        }
    }

    // load specific track index
    function loadTrack(index) {
        if (!songs || songs.length === 0) return;
        if (index < 0) index = 0;
        if (index >= songs.length) index = songs.length - 1;
        currentIndex = index;
        const s = songs[index];
        if (s.src) audio.src = s.src;
        else if (s.file_path) audio.src = s.file_path;
        else if (s.srcURL) audio.src = s.srcURL;
        else audio.removeAttribute('src');
        audio.load();
        titleEl.textContent = s.title || 'Unknown';
        artistEl.textContent = s.artist || 'Unknown';
        albumImage.src = s.cover || 'defult.jpg';
        highlightCurrent();
        audio.onloadedmetadata = () => { if (durationEl) durationEl.textContent = humanTime(audio.duration); };
        // sync like button
        if (likeBtn) likeBtn.classList.toggle('active', !!s.liked);
    }

    function highlightCurrent() {
        if (!playlistContainer) return;
        Array.from(playlistContainer.children).forEach((el, i) => {
            // Skip the header (index 0)
            if (i === 0) return;
            el.style.border = (i - 1 === currentIndex) ? '1px solid #00abf0' : 'none';
        });
    }

    // play/pause
    function play() {
        if (!audio.src) return;
        audio.play().then(() => { isPlaying = true; updatePlayButtons(); }).catch(e => { console.warn('play blocked', e); });
    }
    function pause() { audio.pause(); isPlaying = false; updatePlayButtons(); }
    function updatePlayButtons() {
        const html = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        if (mainPlayBtn) mainPlayBtn.innerHTML = html;
        if (controlPlayBtn) controlPlayBtn.innerHTML = html;
    }

    // next / prev
    function next() {
        if (!songs.length) return;
        if (isShuffle) currentIndex = Math.floor(Math.random() * songs.length);
        else currentIndex = (currentIndex + 1) % songs.length;
        loadTrack(currentIndex); play();
    }
    function prev() {
        if (!songs.length) return;
        if (isShuffle) currentIndex = Math.floor(Math.random() * songs.length);
        else currentIndex = (currentIndex - 1 + songs.length) % songs.length;
        loadTrack(currentIndex); play();
    }

    // progress updates
    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const percent = (audio.currentTime / audio.duration) * 100;
        if (progressInput) progressInput.value = percent;
        if (currentTimeEl) currentTimeEl.textContent = humanTime(audio.currentTime);
        if (durationEl && audio.duration) durationEl.textContent = humanTime(audio.duration);
    });
    if (progressInput) progressInput.addEventListener('input', () => { if (!audio.duration) return; audio.currentTime = (progressInput.value / 100) * audio.duration; });

    // volume
    if (volumeInput) {
        if (Number(volumeInput.value) > 1) volumeInput.value = 1;
        audio.volume = parseFloat(volumeInput.value) || 1;
        volumeInput.addEventListener('input', () => { audio.volume = parseFloat(volumeInput.value); try { localStorage.setItem('music_volume', String(audio.volume)); } catch (e) { } });
        try { const vol = parseFloat(localStorage.getItem('music_volume')); if (!isNaN(vol)) { audio.volume = vol; volumeInput.value = vol; } } catch (e) { }
    }

    // ended handling (use audio.loop if repeat is set)
    audio.addEventListener('ended', () => {
        if (audio.loop || isRepeat) {
            audio.currentTime = 0;
            play();
            return;
        }
        next();
    });

    // repeat button functionality
    if (repeatBtn) {
        repeatBtn.classList.toggle('active', isRepeat || audio.loop === true);
        repeatBtn.addEventListener('click', () => {
            isRepeat = !isRepeat;
            repeatBtn.classList.toggle('active', isRepeat);
            repeatBtn.setAttribute('aria-pressed', isRepeat ? 'true' : 'false');
            audio.loop = isRepeat;
            console.log('Repeat toggled:', isRepeat, 'audio.loop=', audio.loop);
        });
        audio.loop = isRepeat;
    }

    // wiring buttons
    if (mainPlayBtn) mainPlayBtn.addEventListener('click', () => isPlaying ? pause() : play());
    if (controlPlayBtn) controlPlayBtn.addEventListener('click', () => isPlaying ? pause() : play());
    if (nextBtn) nextBtn.addEventListener('click', next);
    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (shuffleBtn) shuffleBtn.addEventListener('click', () => { isShuffle = !isShuffle; shuffleBtn.classList.toggle('active', isShuffle); });

    // Download
    function downloadTrack(track) {
        if (!track) return;
        if (track.src) {
            const a = document.createElement('a'); a.href = track.src; a.download = (track.title || 'download') + '.mp3'; document.body.appendChild(a); a.click(); a.remove();
        } else if (track.file_path) {
            const a = document.createElement('a'); a.href = track.file_path; a.download = (track.title || 'download'); document.body.appendChild(a); a.click(); a.remove();
        } else alert('No file to download');
    }
    if (downloadTopBtn) downloadTopBtn.addEventListener('click', () => downloadTrack(songs[currentIndex]));

    // Fullscreen
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) container.requestFullscreen?.(); else document.exitFullscreen?.();
        });
    }

    // Like button
    if (likeBtn) {
        likeBtn.addEventListener('click', async () => {
            const s = songs[currentIndex];
            if (!s) return;
            s.liked = !s.liked;
            likeBtn.classList.toggle('active', s.liked);
            if (s.id && s.srcType === 'server') {
                try {
                    await fetch('like_song.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ id: s.id, liked: s.liked ? 1 : 0 }) });
                } catch (e) { }
            }
            if (s.liked) likedIds.add(s.id || s.title); else likedIds.delete(s.id || s.title);
            try { localStorage.setItem('music_likes', JSON.stringify(Array.from(likedIds))); } catch (e) { }
        });
    }

    // Lyrics popup
    if (lyricsBtn) {
        lyricsBtn.addEventListener('click', () => {
            const s = songs[currentIndex];
            const text = s ? `Lyrics for ${s.title}\n\n(No lyrics available in this demo)` : 'No song selected';
            const modal = document.createElement('div');
            modal.style.position = 'fixed'; modal.style.left = 0; modal.style.top = 0; modal.style.right = 0; modal.style.bottom = 0;
            modal.style.background = 'rgba(0,0,0,0.6)'; modal.style.display = 'flex'; modal.style.alignItems = 'center'; modal.style.justifyContent = 'center';
            modal.innerHTML = `<div style="background:#0f111a;color:#fff;padding:20px;border-radius:10px;max-width:90%;max-height:80%;overflow:auto;">
          <h3>Lyrics</h3><pre style="white-space:pre-wrap;">${escapeHtml(text)}</pre>
          <button id="closeLyrics" style="margin-top:10px;padding:8px;border-radius:6px;background:#00abf0;border:none;cursor:pointer;">Close</button>
        </div>`;
            document.body.appendChild(modal);
            modal.querySelector('#closeLyrics').addEventListener('click', () => modal.remove());
        });
    }

    // Queue preview
    if (queueBtn) queueBtn.addEventListener('click', () => {
        const nextList = songs.slice(currentIndex + 1, currentIndex + 6);
        if (nextList.length === 0) return alert('Queue is empty');
        alert('Next up:\n' + nextList.map(s => s.title + ' — ' + s.artist).join('\n'));
    });

    // Equalizer visual toggle
    if (equalizerBtn) {
        equalizerBtn.addEventListener('click', () => {
            if (albumImage.style.filter) albumImage.style.filter = '';
            else albumImage.style.filter = 'brightness(1.05) saturate(1.15)';
        });
    }

    // Search box
    const searchBox = document.querySelector('.search-box');
    if (searchBox) {
        searchBox.addEventListener('input', () => {
            const q = searchBox.value.trim().toLowerCase();
            if (!q) renderPlaylist(songs); 
            else renderPlaylist(songs.filter(s => (s.title || '').toLowerCase().includes(q) || (s.artist || '').toLowerCase().includes(q)));
        });
    }

    // Add button triggers file picker
    if (addBtn && filePicker) addBtn.addEventListener('click', () => filePicker.click());

    // File picker: add local files and upload to server
    if (filePicker) {
        filePicker.addEventListener('change', (e) => {
            const files = Array.from(e.target.files || []);
            if (!files.length) return;
            files.forEach((file, idx) => {
                const reader = new FileReader();
                reader.onload = function (ev) {
                    const id = 'local_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
                    const obj = { 
                        id, 
                        title: file.name.replace(/\.[^/.]+$/, ''), 
                        artist: 'Unknown', 
                        src: ev.target.result, 
                        srcType: 'local' 
                    };
                    songs.push(obj); 
                    renderPlaylist();
                    if (idx === 0) { loadTrack(songs.length - 1); play(); }
                };
                reader.readAsDataURL(file);
            });
            // try upload to server
            try {
                const fd = new FormData();
                files.forEach(f => fd.append('songs[]', f));
                fetch('upload.php', { method: 'POST', body: fd })
                    .then(r => r.json?.() || r.text())
                    .then(() => setTimeout(() => loadFromServerAgain(), 800))
                    .catch(() => { });
            } catch (e) { }
        });
    }

    // uploadForm fallback
    if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const form = new FormData(uploadForm);
            fetch('upload.php', { method: 'POST', body: form })
                .then(r => r.json?.() || r.text())
                .then(() => loadFromServerAgain())
                .catch(() => alert('Upload failed'));
        });
    }

    // restart on double-click album image
    if (albumImage) {
        albumImage.addEventListener('dblclick', () => {
            audio.currentTime = 0;
            play();
        });
    }

    // init: load songs
    loadPlaylist();

    // expose API for debugging
    window.musicPlayer = { play, pause, next, prev, loadTrack, songs };

})();