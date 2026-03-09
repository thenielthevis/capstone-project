const { withAndroidManifest } = require('@expo/config-plugins');

const withAndroidQueries = (config) => {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults.manifest;

        if (!androidManifest.queries) {
            androidManifest.queries = [];
        }

        const hasLynivaQuery = androidManifest.queries.some(
            (query) => query.intent && query.intent.some((intent) => intent.data && intent.data.some((data) => data.$['android:scheme'] === 'lynivacc'))
        );

        if (!hasLynivaQuery) {
            androidManifest.queries.push({
                intent: [
                    {
                        action: [
                            { $: { 'android:name': 'android.intent.action.VIEW' } }
                        ],
                        data: [
                            { $: { 'android:scheme': 'lynivacc' } }
                        ]
                    }
                ]
            });
        }

        // Add intent filter for the target package too for extra safety on Android 11+
        const hasPackageQuery = androidManifest.queries.some(
            (query) => query.package && query.package.some((pkg) => pkg.$['android:name'] === 'com.UnityTechnologies.UniversalMobile3DTemplate')
        );

        if (!hasPackageQuery) {
            androidManifest.queries.push({
                package: [
                    { $: { 'android:name': 'com.UnityTechnologies.UniversalMobile3DTemplate' } }
                ]
            });
        }

        return config;
    });
};

module.exports = withAndroidQueries;
