const { withSettingsGradle, withProjectBuildGradle, withGradleProperties } = require('@expo/config-plugins');
const path = require('path');

const UNITY_LIBRARY_NAME = 'unityLibrary';

const withUnityAndroid = (config) => {
    // 1. Add unityLibrary to settings.gradle
    config = withSettingsGradle(config, (config) => {
        // We use a relative path from the 'android' folder.
        // android folder is at root, so ../unity points to frontend/mobile/unity
        const unityProjectDir = `new File(settingsDir, '../unity/builds/android/${UNITY_LIBRARY_NAME}')`;

        // Check if valid include exists
        if (!config.modResults.contents.includes(`include ':${UNITY_LIBRARY_NAME}'`)) {
            config.modResults.contents += `
include ':${UNITY_LIBRARY_NAME}'
project(':${UNITY_LIBRARY_NAME}').projectDir = ${unityProjectDir}
`;
        } else {
            // If it exists, we MUST ensure the path is correct (it might be an old absolute path)
            // Regex to find the existing projectDir assignment
            const pattern = new RegExp(`project\\(':${UNITY_LIBRARY_NAME}'\\)\\.projectDir\\s*=\\s*.*`, 'g');
            if (config.modResults.contents.match(pattern)) {
                config.modResults.contents = config.modResults.contents.replace(
                    pattern,
                    `project(':${UNITY_LIBRARY_NAME}').projectDir = ${unityProjectDir}`
                );
            } else {
                // Include exists but projectDir assignment is missing? Add it.
                config.modResults.contents += `
project(':${UNITY_LIBRARY_NAME}').projectDir = ${unityProjectDir}
`;
            }
        }
        return config;
    });

    // 2. Add repository to project build.gradle
    config = withProjectBuildGradle(config, (config) => {
        // Relative path to libs
        const flatDirLine = `flatDir { dirs "\${rootProject.projectDir}/../unity/builds/android/${UNITY_LIBRARY_NAME}/libs" }`;

        const existingPattern = /flatDir\s*{\s*dirs\s*.*unityLibrary.*libs\s*}/;

        if (config.modResults.contents.match(existingPattern)) {
            // Replace existing flatDir if it looks related to unityLibrary to ensure correctness
            config.modResults.contents = config.modResults.contents.replace(
                existingPattern,
                flatDirLine
            );
        } else {
            if (config.modResults.contents.includes('allprojects {')) {
                config.modResults.contents = config.modResults.contents.replace(
                    /allprojects\s*\{/,
                    `allprojects {
    repositories {
        ${flatDirLine}
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
