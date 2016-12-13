define([
    'common/utils/config',
    'common/utils/detect',
    'common/utils/storage',
    'common/modules/commercial/user-features'
], function (
    config,
    detect,
    storage,
    userFeatures
) {
    function adblockInUse() {
        return detect.adblockInUse;
    }

    function notMobile() {
        return detect.getBreakpoint() !== 'mobile';
    }

    function isPayingMember() {
        return userFeatures.isPayingMember();
    }

    function visitedMoreThanOnce() {
        var alreadyVisited = storage.local.get('gu.alreadyVisited') || 0;

        return alreadyVisited > 1;
    }

    function isAdblockSwitchOn() {
        return config.switches.adblock;
    }

    function noAdblockMsg() {
        return adblockInUse().then(function(adblockInUse){
            return adblockInUse &&  notMobile() && (
                !visitedMoreThanOnce() ||
                !isAdblockSwitchOn() ||
                (isAdblockSwitchOn() && visitedMoreThanOnce() && isPayingMember()));
        });
    }

    function showAdblockMsg() {
        return isAdblockSwitchOn() ?
                adblockInUse().then(function(adblockInUse){
                    return adblockInUse && !isPayingMember() && visitedMoreThanOnce()  && notMobile();
                })
            : Promise.resolve(false);
    }

    return {
        noAdblockMsg: noAdblockMsg,
        showAdblockMsg: showAdblockMsg
    };
});
