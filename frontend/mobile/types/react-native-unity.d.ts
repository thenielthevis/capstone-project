declare module '@azesmway/react-native-unity' {
    import { ViewProps } from 'react-native';
    import React from 'react';

    export interface UnityViewProps extends ViewProps {
        onUnityMessage?: (result: any) => void;
        fullScreen?: boolean;
    }

    export default class UnityView extends React.Component<UnityViewProps> { }
}
