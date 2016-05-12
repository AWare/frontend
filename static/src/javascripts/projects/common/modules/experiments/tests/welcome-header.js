define([
    'common/utils/config',
    'common/modules/ui/welcome-banner',
    'common/utils/detect',
    'common/utils/cookies',
    'common/utils/storage'
], function (
    config,
    welcomeHeader,
    detect,
    cookies,
    storage
) {
    return function () {
        var COOKIE_WELCOME_BANNER = 'GU_WELCOMEBANNER',
            cookieVal = cookies.get(COOKIE_WELCOME_BANNER);

        this.id = 'WelcomeHeader';
        this.start = '2016-05-12';
        this.expiry = '2016-05-13';
        this.author = 'Maria Livia Chiorean';
        this.description = 'Show a welcome header for first time users.';
        this.audience = 1;
        this.audienceOffset = 0;
        this.audienceCriteria = 'First time users';
        this.idealOutcome = 'People come back more after the first visit.';

        this.canRun = function () {
            var firstTimeVisitor = false;
            if (storage.local.isStorageAvailable()) {
                var alreadyVisited = storage.local.get('gu.alreadyVisited');
                if ((!alreadyVisited || alreadyVisited == 1) && !cookieVal) {
                    firstTimeVisitor = true;
                    cookies.add(COOKIE_WELCOME_BANNER, 1);
                }
            }
            return detect.isBreakpoint({max: 'mobile'}) && firstTimeVisitor;
        };

        this.variants = [{
            id: 'test1',
            test: function () {

            }
        }, {
            id: 'test2',
            test: function () {

            }
        }];

    };

});
