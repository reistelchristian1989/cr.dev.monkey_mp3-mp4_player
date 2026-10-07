// --- EQUALIZER LOGIK (JavaScript Web Audio API) ---
const audioElement = document.getElementById('myAudio');
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let sourceNode, bassFilter, midFilter, highFilter;
let isAudioInitialized = false;

// Autoplay Steuerung
let isAudioAutoplay = true;
let isVideoAutoplay = true;

function toggleAudioAutoplay() {
    isAudioAutoplay = !isAudioAutoplay;
    const btn = document.getElementById('toggleAudioAutoplayBtn');
    if (btn) btn.innerText = `🔄 Audio Autoplay: ${isAudioAutoplay ? 'AN' : 'AUS'}`;
}

function toggleVideoAutoplay() {
    isVideoAutoplay = !isVideoAutoplay;
    const btn = document.getElementById('toggleVideoAutoplayBtn');
    if (btn) btn.innerText = `🔄 Video Autoplay: ${isVideoAutoplay ? 'AN' : 'AUS'}`;
}

// Impressum Modal ohne Musik-Stopp
function openImpressumModal() {
    const modal = document.getElementById('impressumModal');
    if (modal) modal.style.display = 'block';
}

function closeImpressumModal() {
    const modal = document.getElementById('impressumModal');
    if (modal) modal.style.display = 'none';
}

audioElement.addEventListener('play', () => {
    if (!isAudioInitialized) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        sourceNode = audioCtx.createMediaElementSource(audioElement);

        // Filter erstellen für den Sound
        bassFilter = audioCtx.createBiquadFilter();
        bassFilter.type = 'lowshelf';
        bassFilter.frequency.setValueAtTime(200, audioCtx.currentTime);

        midFilter = audioCtx.createBiquadFilter();
        midFilter.type = 'peaking';
        midFilter.frequency.setValueAtTime(1500, audioCtx.currentTime);

        highFilter = audioCtx.createBiquadFilter();
        highFilter.type = 'highshelf';
        highFilter.frequency.setValueAtTime(3000, audioCtx.currentTime);

        // Verbindung herstellen: Quelle -> Bass -> Mitten -> Höhen -> Boxen
        sourceNode.connect(bassFilter);
        bassFilter.connect(midFilter);
        midFilter.connect(highFilter);
        highFilter.connect(audioCtx.destination);

        isAudioInitialized = true;
    }
});

// Regler-Steuerung Verknüpfung
const bassRange = document.getElementById('bassRange');
const midRange = document.getElementById('midRange');
const highRange = document.getElementById('highRange');

if (bassRange) {
    bassRange.addEventListener('input', (e) => {
        if(bassFilter) bassFilter.gain.setValueAtTime(e.target.value, audioCtx.currentTime);
    });
}
if (midRange) {
    midRange.addEventListener('input', (e) => {
        if (midFilter) midFilter.gain.setValueAtTime(e.target.value, audioCtx.currentTime);
    });
}
if (highRange) {
    highRange.addEventListener('input', (e) => {
        if (highFilter) highFilter.gain.setValueAtTime(e.target.value, audioCtx.currentTime);
    });
}

// --- SPUL- UND SKIP-FUNKTIONEN FÜR AUDIO ---
function seekAudio(seconds) {
    if (audioElement) {
        audioElement.currentTime += seconds;
    }
}

function skipAudio(direction) {
    let newIndex = currentAudioIndex + direction;
    if (newIndex >= 0 && newIndex < loadedTracks.length) {
        playAudioTrack(newIndex);
    }
}

// --- SPUL- UND SKIP-FUNKTIONEN FÜR VIDEO ---
function seekVideo(seconds) {
    const videoElement = document.getElementById('myVideo');
    if (videoElement) {
        videoElement.currentTime += seconds;
    }
}

function skipVideo(direction) {
    let newIndex = currentVideoIndex + direction;
    if (newIndex >= 0 && newIndex < loadedVideos.length) {
        playVideoTrack(newIndex);
    }
}

// --- PLAYLIST SPEICHER-FUNKTION (LOCAL STORAGE) ---
function savePlaylist() {
    const input = document.getElementById('trackinput');
    if (!input) return;
    const playlistName = input.value.trim();
    if(!playlistName) return;

    let savedPlaylists = JSON.parse(localStorage.getItem('myPlaylists')) || [];
    
    const newPlaylist = {
        name: playlistName,
        songs: loadedTracks.map(t => t.name)
    };

    savedPlaylists.push(newPlaylist);
    localStorage.setItem('myPlaylists', JSON.stringify(savedPlaylists));

    input.value = '';
    loadPlaylistManager();

    alert(
        `Playlist "${playlistName}" erfolgreich gespeichert!\n\n` +
        "1. Klicke einfach auf den Namen deiner Playlist im 'Playlist Manager', um die Playlist zu aktivieren.\n" +
        "2. Über das Papierkorb-Symbol ganz rechts kannst du die Playlist jederzeit wieder löschen.\n" +
        "3. Sollten Dateien fehlen, wähle sie vorher über 'Dateien auswählen' aus."
    );
}

function deletePlaylist(index) {
    let savedPlaylists = JSON.parse(localStorage.getItem('myPlaylists')) || [];
    const name = typeof savedPlaylists[index] === 'string' ? savedPlaylists[index] : savedPlaylists[index].name;

    if (confirm(`Möchtest du die Playlist "${name}" wirklich löschen?`)) {
        savedPlaylists.splice(index, 1);
        localStorage.setItem('myPlaylists', JSON.stringify(savedPlaylists));
        loadPlaylistManager();
    }
}

function loadPlaylistManager() {
    const listContainer = document.getElementById('playlistContainer');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    let savedPlaylists = JSON.parse(localStorage.getItem('myPlaylists')) || [];

    savedPlaylists.forEach((item, index) => {
        let li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.marginBottom = '5px';

        const name = typeof item === 'string' ? item : item.name;

        let nameSpan = document.createElement('span');
        nameSpan.innerText = `📂 ${name}`;
        nameSpan.style.cursor = 'pointer';
        nameSpan.style.color = '#00ffcc';
        
        nameSpan.addEventListener('click', () => {
            if (loadedTracks.length > 0) {
                playAudioTrack(0);
                alert(`Playlist "${name}" geladen und wird gestartet!`);
            } else {
                alert(`Bitte lade zuerst deine MP3-Dateien über "Dateien auswählen" hoch, um die Playlist "${name}" abzuspielen.`);
            }
        });

        let deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Diese Playlist löschen';
        deleteBtn.style.padding = '2px 8px';
        deleteBtn.style.marginLeft = '10px';
        deleteBtn.style.borderRadius = '12px';
        deleteBtn.style.fontSize = '12px';

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deletePlaylist(index);
        });

        li.appendChild(nameSpan);
        li.appendChild(deleteBtn);
        listContainer.appendChild(li);
    });
}

loadPlaylistManager();

// --- CAST / BILDSCHIRM SPIEGEL SIMULATION ---
function castVideo() {
    const videoElement = document.getElementById('myVideo');
    if (window.PresentationRequest) {
        alert("Suche nach verfügbaren Fernsehern (Chromecast / AirPlay via API)...");
    } else {
        alert("Starte native Medienübertragung auf verbundene Bildschirme.");
        if(videoElement && videoElement.requestFullscreen) {
            videoElement.requestFullscreen();
        }
    }
}

// --- VIDEO AUS DEM INTERNEN SPEICHER LADEN (MIT PLAYLIST UI & AUTOPLAY) ---
const videoPicker = document.getElementById('videoFilePicker');
const videoElement = document.getElementById('myVideo');
const videoPlaylistUI = document.getElementById('videoPlaylistUI');
let loadedVideos = [];
let currentVideoIndex = 0;

if (videoPicker) {
    videoPicker.addEventListener('change', (event) => {
        const files = event.target.files;
        loadedVideos = Array.from(files);
        currentVideoIndex = 0;

        renderVideoPlaylist();
        if (loadedVideos.length > 0) {
            playVideoTrack(currentVideoIndex);
        }
    });
}

function playVideoTrack(index) {
    if (index >= 0 && index < loadedVideos.length && videoElement) {
        currentVideoIndex = index;
        videoElement.src = URL.createObjectURL(loadedVideos[index]);
        videoElement.load();
        videoElement.play().catch(err => console.log("Video-Wiedergabe bereit."));
        renderVideoPlaylist();
    }
}

function renderVideoPlaylist() {
    if (!videoPlaylistUI) return;
    videoPlaylistUI.innerHTML = '';
    
    loadedVideos.forEach((video, index) => {
        let li = document.createElement('li');
        li.innerText = video.name;
        li.style.cursor = 'pointer';
        
        if (index === currentVideoIndex && videoElement.src) {
            li.style.color = '#ff0000';
            li.style.fontWeight = 'bold';
        } else {
            li.style.color = '#00ffcc';
        }
        
        li.addEventListener('click', () => {
            playVideoTrack(index);
        });
        
        videoPlaylistUI.appendChild(li);
    });
}

if (videoElement) {
    videoElement.addEventListener('ended', () => {
        if (isVideoAutoplay && currentVideoIndex + 1 < loadedVideos.length) {
            playVideoTrack(currentVideoIndex + 1);
        }
    });
}

// --- MEHRERE MP3s AUS DEM SPEICHER LADEN & PLAYLIST ERSTELLEN ---
const audioPicker = document.getElementById('audioFilePicker');
const audioPlaylistUI = document.getElementById('audioPlaylistUI');
let loadedTracks = []; 
let currentAudioIndex = 0;

if (audioPicker) {
    audioPicker.addEventListener('change', (event) => {
        const files = event.target.files; 
        
        for (let i = 0; i < files.length; i++) {
            loadedTracks.push(files[i]);
        }
        
        renderAudioPlaylist();
    });
}

function playAudioTrack(index) {
    if (index >= 0 && index < loadedTracks.length) {
        currentAudioIndex = index;
        audioElement.src = URL.createObjectURL(loadedTracks[index]);
        audioElement.load();
        audioElement.play().catch(err => console.log("Wiedergabe bereit."));
        renderAudioPlaylist();
    }
}

function renderAudioPlaylist() {
    if (!audioPlaylistUI) return;
    audioPlaylistUI.innerHTML = ''; 
    
    loadedTracks.forEach((track, index) => {
        let li = document.createElement('li');
        li.innerText = track.name; 
        li.style.cursor = 'pointer';
        
        if (index === currentAudioIndex && audioElement.src) {
            li.style.color = '#ff0000';
            li.style.fontWeight = 'bold';
        } else {
            li.style.color = '#00ffcc';
        }
        
        li.addEventListener('click', () => {
            playAudioTrack(index);
        });
        
        audioPlaylistUI.appendChild(li);
    });
}

audioElement.addEventListener('ended', () => {
    if (isAudioAutoplay && currentAudioIndex + 1 < loadedTracks.length) {
        playAudioTrack(currentAudioIndex + 1);
    }
});


// ==========================================
// --- NEU: HLS STREAM & PLAYLIST LOGIK ---
// ==========================================
const hlsUrlInput = document.getElementById('hlsUrlInput');
const playHlsUrlBtn = document.getElementById('playHlsUrlBtn');
const hlsFilePicker = document.getElementById('hlsFilePicker');
const hlsFileName = document.getElementById('hlsFileName');
const hlsVideo = document.getElementById('hlsVideo');

function playHlsStream(url) {
    if (!hlsVideo) return;
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(hlsVideo);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            hlsVideo.play();
        });
    } else if (hlsVideo.canPlayType('application/vnd.apple.mpegurl')) {
        hlsVideo.src = url;
        hlsVideo.addEventListener('loadedmetadata', function() {
            hlsVideo.play();
        });
    } else {
        alert('HLS wird von diesem Browser nicht unterstützt.');
    }
}

if (playHlsUrlBtn) {
    playHlsUrlBtn.addEventListener('click', () => {
        const url = hlsUrlInput ? hlsUrlInput.value.trim() : '';
        if (url) {
            playHlsStream(url);
        } else {
            alert('Bitte gib einen gültigen HLS-Link ein.');
        }
    });
}

if (hlsFilePicker) {
    hlsFilePicker.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            if (hlsFileName) hlsFileName.textContent = file.name;
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                const lines = content.split('\n');
                let streamUrl = '';
                for (let line of lines) {
                    line = line.trim();
                    if (line && !line.startsWith('#')) {
                        streamUrl = line;
                        break;
                    }
                }
                if (streamUrl) {
                    playHlsStream(streamUrl);
                } else {
                    alert('Keine gültige Stream-URL in der ausgewählten .m3u8-Datei gefunden.');
                }
            };
            reader.readAsText(file);
        }
    });
}
