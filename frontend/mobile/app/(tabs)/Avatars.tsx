import React from 'react';
import { View, StyleSheet } from 'react-native';
import UnityView from '@azesmway/react-native-unity';

export default function Avatars() {
    return (
        <View style={styles.container}>
            <UnityView
                style={styles.unity}
                onUnityMessage={(result) => {
                    console.log('Message from Unity:', result);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    unity: {
        flex: 1,
    },
});