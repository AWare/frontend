define([
    'qwery',
    'common/utils/config',
    'common/utils/detect',
    'common/utils/fastdom-promise',
    'common/modules/commercial/dfp/create-slot',
    'common/modules/user-prefs',
    'common/modules/commercial/commercial-features'
], function (
    qwery,
    config,
    detect,
    fastdom,
    createSlot,
    userPrefs,
    commercialFeatures
) {
    var containerSelector = '.fc-container:not(.fc-container--commercial)';
    var sliceSelector = '.js-fc-slice-mpu-candidate';
    var isNetworkFront = ['uk', 'us', 'au'].indexOf(config.page.pageId) !== -1;

    return {
        init: init
    };

    function init() {
        if (!commercialFeatures.sliceAdverts) {
            return Promise.resolve(false);
        }

        var prefs = userPrefs.get('container-states') || {};
        var isMobile = detect.isBreakpoint({ max : 'phablet' });

        // Get all containers
        containers = qwery(containerSelector)
        // Filter out closed ones
        .filter(function (container) {
            return prefs[container.getAttribute('data-id')] !== 'closed';
        });

        if (containers.length === 0) {
            return Promise.resolve(false);
        }

        return isMobile ?
             insertOnMobile(containers, getSlotNameOnMobile) :
             insertOnDesktop(containers, getSlotNameOnDesktop);
    }

    // On mobile, a slot is inserted after each container
    function insertOnMobile(containers, getSlotName) {
        var hasThrasher = containers[0].classList.contains('fc-container--thrasher');
        var slots;

        // Remove first container if it is a thrasher, and limit to max 10 MPUs
        containers = containers.slice(isNetworkFront && hasThrasher ? 1 : 0, 10);

        slots = containers
        .map(function (container, index) {
            var adName = getSlotName(index);
            var classNames = ['container-inline', 'mobile'];
            var slot, section;
            if (config.page.isAdvertisementFeature) {
                classNames.push('adfeature');
            }

            slot = createSlot(adName, classNames);

            // Wrap each ad slot in a SECTION element
            section = document.createElement('section');
            section.appendChild(slot);

            return section;
        });

        return fastdom.write(function () {
            slots.forEach(function (slot, index) {
                containers[index].parentNode.insertBefore(slot, containers[index].nextSibling);
            });
        });
    }

    // On destkop, a slot is inserted when there is a slice available
    function insertOnDesktop(containers, getSlotName) {
        var slots;

        // Remove first container on network fronts
        containers = containers.slice(isNetworkFront ? 1 : 0, 10);

        slots = containers
        // get all ad slices
        .reduce(function (result, container) {
            var slice = container.querySelector(sliceSelector);
            if (slice) {
                result.push(slice);
            }
            return result;
        }, [])
        // create ad slots for the selected slices
        .map(function (slice, index) {
            var adName = getSlotName(index);
            var classNames = ['container-inline'];
            var slot;

            if (config.page.isAdvertisementFeature) {
                classNames.push('adfeature');
            }

            slot = createSlot(adName, classNames);

            return { slice: slice, slot: slot };
        });

        return fastdom.write(function () {
            slots.forEach(function(item) {
                // add a tablet+ ad to the slice
                item.slice.classList.remove('fc-slice__item--no-mpu');
                item.slice.appendChild(item.slot);
            });
        });
    }

    function getSlotNameOnMobile(index) {
        return index === 0 ? 'top-above-nav' : 'inline' + index;
    }

    function getSlotNameOnDesktop(index) {
        return 'inline' + (index + 1);
    }

});
