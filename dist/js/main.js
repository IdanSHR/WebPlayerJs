class MusicPlayer {
    elements = { controls: {}, song: {} };

    audio = new Audio();
    currentSongIndex = 0;
    isRepeat = false;
    isShuffled = false;
    isPlaying = false;
    isMouseDown = false;
    constructor(containerId, settings) {
        this.elements.container = document.getElementById(containerId);
        if (!this.elements.container) {
            console.error(`Container not found!`);
            return;
        }

        if (!settings) {
            console.error(`Settings not found!`);
            return;
        }

        if (!settings.songs || settings.songs.length === 0) {
            console.error(`No songs found!`);
            return;
        }

        this.settings = settings;
        this.init();
    }

    init() {
        this.initFontAwsome();
        if (this.settings.style) {
            Object.assign(this.elements.container.style, this.settings.style);
        }
        this.resetQueue();
        this.createControls();
        this.updatePlaylist();
        this.addEventListeners();
        this.setSongData();
        this.setVolume();
    }
    initFontAwsome() {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css";
        document.head.appendChild(link);
    }
    createControls() {
        this.elements.container.innerHTML = `
              <div id="player-playlist-container"></div>
              <div id="player-container">
                  <h2 id="song-title"></h2>
                  <h3 id="song-artist"></h3>
                  <div id="player-track-container">
                      <span id="player-time-current">0:00</span>
                      <div id="player-track-progress">
                          <div id="player-progress-bar"></div>
                          </div>
                      <span id="player-time-total">0:00</span>
                  </div>
                  <div class="player-controls">
                      <button id="player-prev-button"><i class="fa fa-backward"></i></button>
                      <button id="player-play-pause-button"><i class="fa fa-play"></i></button>
                      <button id="player-stop-button"><i class="fa fa-stop"></i></button>
                      <button id="player-next-button"><i class="fa fa-forward"></i></button>
                      <button id="player-mute-button"><i class="fa fa-volume-up"></i></button>
                      <input type="range" id="player-volume-control" min="0" max="1" step="0.01">
                      <button id="player-speed-button">1x</button>
                      <button id="player-shuffle-button"><i class="fa fa-random"></i></button>
                      <button id="player-repeat-button"><i class="fa fa-redo"></i></button>
                  </div>
              </div>
          `;
        this.elements.song.title = document.getElementById("song-title");
        this.elements.song.artist = document.getElementById("song-artist");

        this.elements.playlistContainer = document.getElementById("player-playlist-container");
        this.elements.controls.progressBar = document.getElementById("player-progress-bar");
        this.elements.controls.progressBarContainer = document.getElementById("player-track-progress");
        this.elements.controls.timeCurrent = document.getElementById("player-time-current");
        this.elements.controls.timeTotal = document.getElementById("player-time-total");
        this.elements.controls.volumeControl = document.getElementById("player-volume-control");

        this.elements.controls.playPauseButton = document.getElementById("player-play-pause-button");
        this.elements.controls.stopButton = document.getElementById("player-stop-button");
        this.elements.controls.speedButton = document.getElementById("player-speed-button");
        this.elements.controls.shuffleButton = document.getElementById("player-shuffle-button");
        this.elements.controls.repeatButton = document.getElementById("player-repeat-button");
        this.elements.controls.nextButton = document.getElementById("player-next-button");
        this.elements.controls.prevButton = document.getElementById("player-prev-button");
        this.elements.controls.muteButton = document.getElementById("player-mute-button");

        if (this.settings.sticky) {
            document.querySelector("#player-container")?.classList.add("player-sticky");
        }
    }
    addEventListeners() {
        this.audio.addEventListener("timeupdate", () => this.updateTrackbar());
        this.audio.addEventListener("ended", () => this.nextSong());
        this.audio.addEventListener("timeupdate", () => this.updateCurrentTime());
        this.audio.addEventListener("loadedmetadata", () => this.updateTotalTime());

        if (this.settings.keyboard) {
            document.addEventListener("keydown", (e) => this.handleKeyboardControls(e));
        }

        this.elements.controls.progressBarContainer.addEventListener("mousedown", (e) => {
            this.isMouseDown = true;
            if (this.isPlaying) {
                this.audio.pause();
            }
            this.handleTrackbarClick(e);
        });

        this.elements.controls.progressBarContainer.addEventListener("mousemove", (e) => {
            if (this.isMouseDown) {
                this.handleTrackbarClick(e);
            }
        });

        this.elements.controls.progressBarContainer.addEventListener("mouseup", () => {
            this.isMouseDown = false;
            if (this.isPlaying) {
                this.audio.play();
            }
        });

        document.querySelectorAll(".player-song").forEach((song) =>
            song.addEventListener("click", (e) => {
                this.setSong(e?.currentTarget?.dataset?.song);
            })
        );

        this.elements.controls.volumeControl.addEventListener("input", () => this.setVolume());

        this.elements.controls.prevButton.addEventListener("click", () => this.previousSong());
        this.elements.controls.nextButton.addEventListener("click", () => this.nextSong());
        this.elements.controls.shuffleButton.addEventListener("click", () => this.toggleShuffle());
        this.elements.controls.muteButton.addEventListener("click", () => this.toggleMute());
        this.elements.controls.playPauseButton.addEventListener("click", () => this.togglePlayPause());
        this.elements.controls.stopButton.addEventListener("click", () => this.stop());
        this.elements.controls.speedButton.addEventListener("click", () => this.toggleSpeed());
        this.elements.controls.repeatButton.addEventListener("click", () => this.toggleRepeat());
    }

    play() {
        this.elements.controls.playPauseButton.innerHTML = '<i class="fa fa-pause"></i>';
        this.audio.play();
        this.isPlaying = true;
    }

    pause() {
        this.audio.pause();
        this.elements.controls.playPauseButton.innerHTML = '<i class="fa fa-play"></i>';
        this.isPlaying = false;
    }

    stop() {
        this.pause();
        this.audio.currentTime = 0;
    }

    nextSong() {
        this.currentSongIndex = (this.currentSongIndex + 1) % this.queue.length;
        this.setSongData();

        if (this.isPlaying) {
            this.play();
        }
    }

    previousSong() {
        this.currentSongIndex = this.currentSongIndex === 0 ? this.queue.length - 1 : this.currentSongIndex - 1;
        this.setSongData();

        if (this.isPlaying) {
            this.play();
        }
    }

    resetQueue() {
        this.queue = [...this.settings.songs];
    }

    setSong(songid) {
        this.currentSongIndex = this.settings.songs.findIndex((song) => song.id == songid);
        this.setSongData();

        if (this.isPlaying) {
            this.play();
        }
    }

    setSongData() {
        const song = this.queue[this.currentSongIndex];
        this.audio.src = song.url;
        this.elements.song.title.innerText = song.title;
        this.elements.song.artist.innerText = song.artist;
        document.querySelectorAll(".player-song").forEach((song) => song.classList.remove("active"));
        document.querySelector(`.player-song[data-song="${song.id}"]`)?.classList.add("active");
        this.updateTotalTime();
    }

    setSpeed(rate) {
        this.audio.playbackRate = rate;
    }

    setVolume() {
        const volume = this.elements.controls.volumeControl.value;
        this.audio.volume = Number(volume);

        if (this.audio.volume == 0) {
            this.toggleMute();
        } else if (this.audio.muted) {
            this.toggleMute();
        }
    }
    changeVolume(change) {
        this.audio.volume = Math.max(0, Math.min(1, this.audio.volume + change));
        this.elements.controls.volumeControl.value = this.audio.volume.toString();
    }

    toggleMute() {
        this.audio.muted = !this.audio.muted;
        this.elements.controls.volumeControl.value = this.audio.muted ? "0" : this.audio.volume.toString();
        this.elements.controls.muteButton.innerHTML = this.audio.muted ? '<i class="fa fa-volume-mute"></i>' : '<i class="fa fa-volume-up"></i>';
    }

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.elements.controls.shuffleButton.classList.toggle("active");
        if (this.isShuffled) {
            this.queue = this.queue.sort(() => Math.random() - 0.5);
        } else {
            this.resetQueue();
        }
    }

    toggleRepeat() {
        this.isRepeat = !this.isRepeat;
        this.audio.loop = this.isRepeat;
        this.elements.controls.repeatButton.classList.toggle("active");
    }
    togglePlayPause() {
        if (this.audio.paused) {
            this.play();
        } else {
            this.pause();
        }
    }

    toggleSpeed() {
        const speeds = [0.5, 0.75, 1, 1.5, 2];
        let currentSpeed = speeds.indexOf(this.audio.playbackRate);
        currentSpeed = (currentSpeed + 1) % speeds.length;
        this.audio.playbackRate = speeds[currentSpeed];
        this.elements.controls.speedButton.innerText = speeds[currentSpeed] + "x";
    }
    addTime(seconds) {
        this.audio.currentTime += seconds;
        if (this.audio.ended) {
            this.nextSong();
        }
    }
    jumpToTime(seconds) {
        this.audio.currentTime = seconds;
    }
    updateTrackbar() {
        const percentage = (this.audio.currentTime / this.audio.duration) * 100;
        this.elements.controls.progressBar.style.width = `${percentage}%`;
    }
    updatePlaylist() {
        this.elements.playlistContainer.innerHTML = "";
        this.settings.songs.forEach((song) => {
            this.elements.playlistContainer.innerHTML += `<div class="player-song" data-song="${song.id}"><strong>${song.title} - <span>${song.artist}</span></strong> <span> (${song.duration})</span> </div>`;
            let audio = new Audio(song.url);
            audio.onloadedmetadata = () => {
                let elem = document.querySelector(`.player-song[data-song="${song.id}"]`);
                song.duration = this.formatTime(audio.duration);
                elem.innerHTML = `<strong>${song.title} - <span>${song.artist}</span></strong> <span> (${song.duration})</span>`;
            };
        });
    }
    updateCurrentTime() {
        const currentTime = this.formatTime(this.audio.currentTime);
        this.elements.controls.timeCurrent.innerText = currentTime;
    }
    updateTotalTime() {
        const totalTime = this.formatTime(this.audio.duration);
        this.elements.controls.timeTotal.innerText = isNaN(this.audio.duration) ? "0:00" : totalTime;
    }
    handleTrackbarClick(e) {
        const percentage = (e.offsetX / this.elements.controls.progressBarContainer.offsetWidth) * 100;
        this.elements.controls.progressBar.style.width = `${percentage}%`;
        this.audio.currentTime = (this.audio.duration * percentage) / 100;
    }
    handleKeyboardControls(e) {
        switch (e.key) {
            case " ":
                e.preventDefault();
                this.togglePlayPause();
                break;

            case "ArrowLeft":
                this.addTime(-5);
                break;

            case "ArrowRight":
                this.addTime(5);
                break;

            case "ArrowUp":
                this.changeVolume(0.1);
                break;

            case "ArrowDown":
                this.changeVolume(-0.1);
                break;

            case "m":
                this.toggleMute();
                break;

            case "r":
                this.toggleRepeat();
                break;
            case "s":
                this.toggleShuffle();
                break;
        }
    }
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
    }
}
