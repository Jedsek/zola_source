function loadExternalScript(url, callback) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    script.onload = function() {
        if (callback) {
            callback();
        }
    };

    script.onerror = function() {
        console.error('Error loading script:', url);
    };

    document.head.appendChild(script);
}    

