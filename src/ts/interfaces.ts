export type Settings = {
    songs: Song[];
    style?: Partial<CSSStyleDeclaration>;
    keyboard?: boolean;
    sticky?: boolean;
};

export type Song = {
    id: string;
    title: string;
    artist: string;
    url: string;
    duration?: string;
};

export type Elements = {
    container: HTMLElement;
    playlistContainer: HTMLElement;
    song: {
        title: HTMLElement;
        artist: HTMLElement;
    };
    controls: {
        progressBar: HTMLElement;
        progressBarContainer: HTMLElement;
        timeCurrent: HTMLElement;
        timeTotal: HTMLElement;
        volumeControl: HTMLInputElement;
        playPauseButton: HTMLElement;
        stopButton: HTMLElement;
        speedButton: HTMLElement;
        shuffleButton: HTMLElement;
        repeatButton: HTMLElement;
        nextButton: HTMLElement;
        prevButton: HTMLElement;
        muteButton: HTMLElement;
    };
};
