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
    btn.innerText = `🔄 Audio Autoplay: ${isAudioAutoplay ? 'AN' : 'AUS'}`;
}

function toggleVideoAutoplay() {
    isVideoAutoplay = !isVideoAutoplay;
    const btn = document.getElementById('toggleVideoAutoplayBtn');
    btn.innerText = `🔄 Video Autoplay: ${isVideoAutoplay ? 'AN' : 'AUS'}`;
}

// Impressum Modal ohne Musik-Stopp
function openImpressumModal() {
    document.getElementById('impressumModal').style.display = 'block';
}

function closeImpressumModal() {
    document.getElementById('impressumModal').style.display = 'none';
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
document.getElementById('bassRange').addEventListener('input', (e) => {
    if(bassFilter) bassFilter.gain.setValueAtTime(e.target.value, audioCtx.currentTime);
});
document.getElementById('midRange').addEventListener('input', (e) => {
    if (midFilter) midFilter.gain.setValueAtTime(e.target.value, audioCtx.currentTime);
});
document.getElementById('highRange').addEventListener('input', (e) => {
    if (highFilter) highFilter.gain.setValueAtTime(e.target.value, audioCtx.currentTime);
});

// --- PLAYLIST SPEICHER-FUNKTION (LOCAL STORAGE) ---
function savePlaylist() {
    const input = document.getElementById('trackinput');
    const playlistName = input.value.trim();
    if(!playlistName) return;

    let savedPlaylists = JSON.parse(localStorage.getItem('myPlaylists')) || [];
    
    // Playlist mit Name und verknüpften Dateinamen speichern
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
        "2. Sollten Dateien fehlen, wähle sie vorher über 'Dateien auswählen' aus."
    );
}

function loadPlaylistManager() {
    const listContainer = document.getElementById('playlistContainer');
    listContainer.innerHTML = '';
    let savedPlaylists = JSON.parse(localStorage.getItem('myPlaylists')) || [];

    savedPlaylists.forEach((item, index) => {
        let li = document.createElement('li');
        // Falls alte Strings statt Objekte vorhanden sind
        const name = typeof item === 'string' ? item : item.name;
        li.innerText = `📂 ${name}`;
        li.style.cursor = 'pointer';
        li.style.color = '#00ffcc';
        
        // Aufrufen der Playlist
        li.addEventListener('click', () => {
            if (loadedTracks.length > 0) {
                playAudioTrack(0);
                alert(`Playlist "${name}" geladen und wird gestartet!`);
            } else {
                alert(`Bitte lade zuerst deine MP3-Dateien über "Dateien auswählen" hoch, um die Playlist "${name}" abzuspielen.`);
            }
        });
        
        listContainer.appendChild(li);
    });
}

// Beim Start Playlists laden
loadPlaylistManager();

// --- CAST / BILDSCHIRM SPIEGEL SIMULATION ---
function castVideo() {
    const videoElement = document.getElementById('myVideo');
    if (window.PresentationRequest) {
        alert("Suche nach verfügbaren Fernsehern (Chromecast / AirPlay via API)...");
    } else {
        alert("Starte native Medienübertragung auf verbundene Bildschirme.");
        if(videoElement.requestFullscreen) {
            videoElement.requestFullscreen();
        }
    }
}

// --- VIDEO AUS DEM INTERNEN SPEICHER LADEN (MIT AUTOPLAY-SCHALTER) ---
const videoPicker = document.getElementById('videoFilePicker');
const videoElement = document.getElementById('myVideo');
let loadedVideos = [];
let currentVideoIndex = 0;

videoPicker.addEventListener('change', (event) => {
    const files = event.target.files;
    loadedVideos = Array.from(files);
    currentVideoIndex = 0;

    if (loadedVideos.length > 0) {
        playVideoTrack(currentVideoIndex);
    }
});

function playVideoTrack(index) {
    if (index >= 0 && index < loadedVideos.length) {
        currentVideoIndex = index;
        videoElement.src = URL.createObjectURL(loadedVideos[index]);
        videoElement.load();
        videoElement.play().catch(err => console.log("Video-Wiedergabe bereit."));
    }
}

// Autoplay: Nur abspielen wenn isVideoAutoplay === true
videoElement.addEventListener('ended', () => {
    if (isVideoAutoplay && currentVideoIndex + 1 < loadedVideos.length) {
        playVideoTrack(currentVideoIndex + 1);
    }
});

// --- MEHRERE MP3s AUS DEM SPEICHER LADEN & PLAYLIST ERSTELLEN ---
const audioPicker = document.getElementById('audioFilePicker');
const audioPlaylistUI = document.getElementById('audioPlaylistUI');
let loadedTracks = []; 
let currentAudioIndex = 0;

audioPicker.addEventListener('change', (event) => {
    const files = event.target.files; 
    
    for (let i = 0; i < files.length; i++) {
        loadedTracks.push(files[i]);
    }
    
    renderAudioPlaylist();
});

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

// Autoplay: Nur abspielen wenn isAudioAutoplay === true
audioElement.addEventListener('ended', () => {
    if (isAudioAutoplay && currentAudioIndex + 1 < loadedTracks.length) {
        playAudioTrack(currentAudioIndex + 1);
    }
});
