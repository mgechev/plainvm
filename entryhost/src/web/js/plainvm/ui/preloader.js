/**
 * Module which is responsible for the preloading of the application.
 * It's attaching to the "loading-coplete" event and only if this event
 * is being fired the preloader will be hide.
 */
plainvm.register('ui.preloader', function () {

    var loadingScreen = $('<div class="plainvm-preloader"></div>'),
        loadingLabel = $('<span class="plainvm-preloader-label"><div class="plainvm-preloader-icon"></div>Loading...</span>');

    /**
     * Initializing the module.
     *
     * @public
     * @param {object} sandbox The sandbox
     */
    function init(sandbox) {
        if (!$.isReady) {
            $(document).ready(function () {
                show();
            });
        }

        sandbox.subscribe('system-loading-completed', function () {
            hide();
        });
    }

    /**
     * Showing the preloader page.
     *
     * @public
     */
    function show() {
        $(document.body).append(loadingScreen);
        loadingScreen.empty();
        loadingScreen.append(loadingLabel);
        loadingLabel.css('left', (loadingScreen.width() - loadingLabel.width()) / 2);
        loadingLabel.css('top', (loadingScreen.height() - loadingLabel.height()) / 2);
    }

    /**
     * Hiding the preloading screen.
     *
     * @public
     */
    function hide() {
        loadingScreen.fadeOut(300, function () {
            loadingScreen.remove();
        });
    }

    /**
     * Public interface
     */
    return {
        init: init,
        hide: hide,
        show: show
    };
}());


