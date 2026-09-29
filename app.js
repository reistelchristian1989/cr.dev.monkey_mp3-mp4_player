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

// --- PLAYLIST SPEICHER-FUNKTION ---
function saveTrack() {
    const input = document.getElementById('trackinput');
    const trackName = input.value;
    if(!trackName) return;

    let savedTracks = JSON.parse(localStorage.getItem('myPlaylists')) || [];
    savedTracks.push(trackName);
    localStorage.setItem('myPlaylists', JSON.stringify(savedTracks));

    input.value = '';
    loadPlaylist();

    alert(
        "Playlist erfolgreich gespeichert! Info!!!, " +
        "so kannst du auf deine Playliste zurückgreifen und sie wieder in den Player laden:\n\n" +
        "1. Deine gespeicherten Track-Namen erscheinen sofort als Liste im 'Playlist Manager (Local Storage)' auf deiner Hauptseite.\n" +
        "2. Da Web-Apps aus Sicherheitsgründen keinen permanenten Zugriff auf lokale Ordner haben, lädst du deine echten MP3s einfach über den 'Choose Files'-Button (mit Mehrfachauswahl) neu in den Player.\n" +
        "3. Klicke dann in der angezeigten Auswahlliste auf den gewünschten Song, um ihn direkt abzuspielen.\n\n" +
        "So löscht du deine Playlist wieder, wenn du sie nicht mehr benötigst, erfolgreich und sicher:\n\n" +
        "- Öffne in deinem Browser (oder über VS Codium) die Entwickler-Tools mit der Taste [F12].\n" +
        "- Gehe oben auf den Reiter 'Application' (Anwendung) und öffne links den Punkt 'Local Storage'.\n" +
        "- Klicke dort auf den Eintrag 'myPlaylists' und lösche ihn (Rechtsklick -> Delete), um den Browser-Speicher komplett sauber und sicher zu leeren."
    );
}

function loadPlaylist() {
    const listContainer = document.getElementById('playlistContainer');
    listContainer.innerHTML = '';
    let savedTracks = JSON.parse(localStorage.getItem('myPlaylists')) || [];

    savedTracks.forEach(track => {
        let li = document.createElement('li');
        li.innerText = track;
        li.style.cursor = 'pointer';
        li.style.color = '#00ffcc';
        
        // Klickbar machen: Versucht den passenden Song in geladenen Tracks abzuspielen
        li.addEventListener('click', () => {
            const foundIndex = loadedTracks.findIndex(t => t.name.toLowerCase().includes(track.toLowerCase()));
            if (foundIndex !== -1) {
                playAudioTrack(foundIndex);
            } else {
                alert(`Der Song "${track}" wurde in den aktuell hochgeladenen Dateien nicht gefunden. Bitte wähle erst die Datei über den "Choose Files" Button aus!`);
            }
        });
        
        listContainer.appendChild(li);
    });
}

// Beim Start Playlist laden
loadPlaylist();

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

// --- MEHRERE MP3s AUS DEM SPEICHER LADEN & PLAYLIST ERSTELLEN (MIT AUTOPLAY-SCHALTER) ---
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
