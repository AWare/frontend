// @flow

export const prebidIntegration: ABTest = {
    id: 'PrebidIntegration',
    start: '2017-11-30',
    expiry: '2018-03-31',
    author: 'Richard Nguyen',
    description:
        'A test to verify that Prebid can support external demand for display ads',
    audience: 0.00000,
    audienceOffset: 0,
    successMeasure: 'Higher OMP (Open Market Place) yield',
    audienceCriteria: 'All web traffic, inline slots',
    dataLinkNames: '',
    idealOutcome: 'We prove that extending our ad-stack generates more revenue',
    canRun: () => true,
    variants: [
        {
            id: 'prebid-variant',
            test: () => {},
        },
        {
            id: 'control',
            test: () => {},
        },
    ],
};
