const { withSettingsGradle, withProjectBuildGradle, withGradleProperties, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs-extra');
const path = require('path');

const UNITY_LIBRARY_NAME = 'unityLibrary';

const withUnityAndroid = (config) => {
    // 1. Copy unityLibrary to android/unityLibrary during prebuild
    config = withDangerousMod(config, [
        'android',
        async (config) => {
            const projectRoot = config.modRequest.projectRoot;
            const unitySource = path.join(projectRoot, 'unity', 'builds', 'android', UNITY_LIBRARY_NAME);
            const androidDest = path.join(projectRoot, 'android', UNITY_LIBRARY_NAME);

            if (fs.existsSync(unitySource)) {
                console.log(`Copying Unity library from ${unitySource} to ${androidDest}`);
                await fs.copy(unitySource, androidDest, { overwrite: true });
            } else {
                console.warn(`Warning: Unity library not found at ${unitySource}. Make sure you have exported your Unity project.`);
            }
            return config;
        },
    ]);

    // 2. Add unityLibrary to settings.gradle (Simple include since it's now internal)
    config = withSettingsGradle(config, (config) => {
        if (!config.modResults.contents.includes(`include ':${UNITY_LIBRARY_NAME}'`)) {
            config.modResults.contents += `
include ':${UNITY_LIBRARY_NAME}'
`;
        }
        return config;
    });

    // 3. Add repository to project build.gradle
    config = withProjectBuildGradle(config, (config) => {
        // Now it is local, so we point to it directly or use standard flatDir
        const flatDirLine = `flatDir { dirs "\${project(':${UNITY_LIBRARY_NAME}').projectDir}/libs" }`;

        if (!config.modResults.contents.includes('unityLibrary/libs')) {
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

    // 4. Add unityStreamingAssets to gradle.properties
    config = withGradleProperties(config, (config) => {
        const key = 'unityStreamingAssets';
        const value = '.unity3d';
        const prop = config.modResults.find((item) => item.key === key);
        if (!prop) {
            config.modResults.push({ type: 'property', key, value });
        }
        return config;
    });

    return config;
};

module.exports = withUnityAndroid;
