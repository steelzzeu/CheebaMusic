// Initialize particles.js
document.addEventListener('DOMContentLoaded', () => {
    const player = new MusicPlayer();
});

class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.isPlaying = false;
        this.isShuffled = false;
        this.currentTrackIndex = 0;
        this.playlist = [
            'Keep the vibe right',
            'Good Vibes Only',
            'Peace and Love',
            'In Cheeba',
            'April Serenade',
            'Farewell to our Haven',
            'Chevy and Brotherhood',
            "The Plug's Got a Banjo",
            'Fuck Boots',
            'Thy Holy Zoot'
        ];
        this.shuffledPlaylist = [...this.playlist];
        this.initializePlayer();
        this.setupEventListeners();
        this.setupBackgroundPlayback();
    }

    initializePlayer() {
        this.playBtn = document.getElementById('play');
        this.prevBtn = document.getElementById('prev');
        this.nextBtn = document.getElementById('next');
        this.shuffleBtn = document.getElementById('shuffle');
        this.volumeBtn = document.getElementById('volume');
        this.progressBar = document.getElementById('progress');
        this.currentTimeSpan = document.getElementById('currentTime');
        this.durationSpan = document.getElementById('duration');
        this.trackList = document.getElementById('trackList');
        this.currentTrackElement = document.getElementById('currentTrack');
        this.currentArtistElement = document.getElementById('currentArtist');
        this.albumArtElement = document.getElementById('albumArt');

        // Start with first track and don't autoplay
        this.loadTrack(0, false);
        this.updateTrackList();
    }

    setupEventListeners() {
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.playPrevious());
        this.nextBtn.addEventListener('click', () => this.playNext());
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        
        // Volume control
        const volumeSlider = document.getElementById('volume');
        const volumeBtn = document.getElementById('volume-btn');
        
        volumeSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.setVolume(value);
        });
        
        volumeBtn.addEventListener('click', () => this.toggleMute());
        
        // Progress bar
        document.querySelector('.progress-bar').addEventListener('click', (e) => {
            const progressBar = e.currentTarget;
            const clickPosition = e.offsetX;
            const progressBarWidth = progressBar.offsetWidth;
            const seekTime = (clickPosition / progressBarWidth) * this.audio.duration;
            this.audio.currentTime = seekTime;
        });

        // Initial track list setup
        this.updateTrackList();

        // Audio event listeners
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.playNext());
        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.handleAudioError();
        });
    }

    setupBackgroundPlayback() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
            navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
            navigator.mediaSession.setActionHandler('previoustrack', () => this.playPrevious());
            navigator.mediaSession.setActionHandler('nexttrack', () => this.playNext());
            navigator.mediaSession.setActionHandler('stop', () => this.stop());
        }
    }

    handleAudioError() {
        console.log('Attempting to recover from audio error...');
        this.pause();
        // Try to reload the current track
        setTimeout(() => {
            this.loadTrack(this.currentTrackIndex, false);
        }, 1000);
    }

    setupAudioEventListeners(audio) {
        const timeUpdate = () => this.updateProgress();
        const ended = () => this.playNext();
        const error = (e) => {
            console.error('Audio error:', e);
            this.handleAudioError();
        };

        audio.addEventListener('timeupdate', timeUpdate);
        audio.addEventListener('ended', ended);
        audio.addEventListener('error', error);

        // Return cleanup function
        return () => {
            audio.removeEventListener('timeupdate', timeUpdate);
            audio.removeEventListener('ended', ended);
            audio.removeEventListener('error', error);
        };
    }

    loadTrack(index, shouldPlay = false) {
        this.currentTrackIndex = index;
        const trackName = this.isShuffled ? this.shuffledPlaylist[index] : this.playlist[index];
        
        // Store the current volume and playing state
        const currentVolume = this.audio.volume;
        const wasPlaying = this.isPlaying || shouldPlay;
        
        // Create and set up new audio element
        const newAudio = new Audio();
        newAudio.src = `songs/${trackName}.mp3`;
        newAudio.volume = currentVolume;
        
        // Clean up old audio element and its event listeners
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
            if (this.cleanupAudioListeners) {
                this.cleanupAudioListeners();
            }
        }
        
        // Replace old audio element
        this.audio = newAudio;
        
        // Set up event listeners on new audio element
        this.cleanupAudioListeners = this.setupAudioEventListeners(this.audio);
        
        // Update display
        this.currentTrackElement.textContent = trackName;
        this.currentArtistElement.textContent = 'CHEEBA';
        
        // Update Media Session Metadata
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: trackName,
                artist: 'CHEEBA',
                album: 'CHEEBA 420',
                artwork: [
                    {
                        src: 'albumcover.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            });
        }
        
        // Update track list and UI
        this.updateTrackList();
        
        // Load the audio
        this.audio.load();
        
        // Handle playback state
        if (wasPlaying) {
            this.audio.addEventListener('canplaythrough', () => {
                this.play();
            }, { once: true });
        } else {
            this.isPlaying = false;
            this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            }).catch(error => {
                console.error('Playback failed:', error);
                this.handleAudioError();
            });
        }
    }

    pause() {
        this.isPlaying = false;
        this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.audio.pause();
    }

    stop() {
        this.pause();
        this.audio.currentTime = 0;
    }

    playNext() {
        let nextIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        this.loadTrack(nextIndex, this.isPlaying);  // Maintain current playing state
    }

    playPrevious() {
        let prevIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
        this.loadTrack(prevIndex, this.isPlaying);  // Maintain current playing state
    }

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.shuffleBtn.style.opacity = this.isShuffled ? '1' : '0.7';
        this.shuffleBtn.style.color = this.isShuffled ? 'var(--primary-color)' : 'var(--text-color)';
        
        if (this.isShuffled) {
            // Save current track
            const currentTrack = this.playlist[this.currentTrackIndex];
            
            // Create new shuffled playlist
            this.shuffledPlaylist = [...this.playlist];
            for (let i = this.shuffledPlaylist.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.shuffledPlaylist[i], this.shuffledPlaylist[j]] = 
                [this.shuffledPlaylist[j], this.shuffledPlaylist[i]];
            }
            
            // Find current track in shuffled playlist
            this.currentTrackIndex = this.shuffledPlaylist.indexOf(currentTrack);
        }
        
        this.updateTrackList();
    }

    toggleMute() {
        if (this.audio.volume > 0) {
            this.lastVolume = this.audio.volume;
            this.setVolume(0);
        } else {
            this.setVolume(this.lastVolume || 1);
        }
    }

    setVolume(value) {
        this.audio.volume = value;
        document.getElementById('volume').value = value;
        
        const volumeBtn = document.getElementById('volume-btn');
        const icon = volumeBtn.querySelector('i');
        
        if (value === 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (value < 0.5) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }

    updateProgress() {
        if (!isNaN(this.audio.duration)) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressBar.style.width = `${progress}%`;
            this.currentTimeSpan.textContent = this.formatTime(this.audio.currentTime);
            this.durationSpan.textContent = this.formatTime(this.audio.duration);
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateTrackList() {
        const tracks = this.isShuffled ? this.shuffledPlaylist : this.playlist;
        const trackListElement = document.getElementById('trackList');
        
        // Clear existing tracks
        trackListElement.innerHTML = '';
        
        // Create new track elements with event listeners
        tracks.forEach((track, index) => {
            const li = document.createElement('li');
            li.textContent = track;
            li.dataset.track = index + 1;
            if (index === this.currentTrackIndex) {
                li.classList.add('active');
            }
            
            // Add click event listener
            li.addEventListener('click', () => {
                this.loadTrack(index, true);
            });
            
            trackListElement.appendChild(li);
        });
    }
} 