export function initYouTubePlayer() {
    const methodologySection = document.getElementById('methodology');
    if (!methodologySection) return;

    let apiLoaded = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !apiLoaded) {
                apiLoaded = true;
                observer.disconnect();
                loadYouTubeAPI();
            }
        });
    }, { rootMargin: '300px' });

    observer.observe(methodologySection);

    function loadYouTubeAPI() {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);

        window.onYouTubeIframeAPIReady = () => {
            const originUrl = window.location.origin;

            new YT.Player('player', {
                height: '100%',
                width: '100%',
                videoId: 'VYZwry3ubAY',
                playerVars: {
                    autoplay: 0,
                    controls: 1,
                    mute: 0,
                    origin: originUrl,
                    rel: 0,
                    showinfo: 0,
                    playsinline: 1
                }
            });
        };
    }
}
