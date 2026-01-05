const { withSettingsGradle, withProjectBuildGradle, withGradleProperties } = require('@expo/config-plugins');
const path = require('path');

const UNITY_LIBRARY_NAME = 'unityLibrary';

const withUnityAndroid = (config) => {
    // 1. Add unityLibrary to settings.gradle
    config = withSettingsGradle(config, (config) => {
        // Resolve absolute path to unityLibrary relative to the project root
        // config.modRequest.projectRoot is the root of the expo project
        const unityBuildPath = path.resolve(config.modRequest.projectRoot, 'unity', 'builds', 'android', UNITY_LIBRARY_NAME);

        // Normalize path separators for Gradle (Windows backslashes can fail)
        const unityBuildPathNormalized = unityBuildPath.replace(/\\/g, '/');

        if (!config.modResults.contents.includes(`include ':${UNITY_LIBRARY_NAME}'`)) {
            config.modResults.contents += `
include ':${UNITY_LIBRARY_NAME}'
project(':${UNITY_LIBRARY_NAME}').projectDir = new File('${unityBuildPathNormalized}')
`;
        }
        return config;
    });

    // 2. Add repository to project build.gradle
    config = withProjectBuildGradle(config, (config) => {
        const unityBuildPath = path.resolve(config.modRequest.projectRoot, 'unity', 'builds', 'android', UNITY_LIBRARY_NAME);
        const unityBuildPathNormalized = unityBuildPath.replace(/\\/g, '/');
        const flatDirLine = `flatDir { dirs "${unityBuildPathNormalized}/libs" }`;

        if (!config.modResults.contents.includes(flatDirLine)) {
            if (config.modResults.contents.includes('allprojects {')) {
                config.modResults.contents = config.modResults.contents.replace(
                    /allprojects\s*\{/,
                    `allprojects {
    repositories {
        flatDir { dirs "${unityBuildPathNormalized}/libs" }
    }
`
                );
            }
        }
        return config;
    });

    // 3. Add unityStreamingAssets to gradle.properties
    config = withGradleProperties(config, (config) => {
        const key = 'unityStreamingAssets';
        const value = '.unity3d';
        const prop = config.modResults.find((item) => item.key === key);
        if (prop) {
            prop.value = value;
        } else {
            config.modResults.push({ type: 'property', key, value });
        }
        return config;
    });

    return config;
};

module.exports = withUnityAndroid;
