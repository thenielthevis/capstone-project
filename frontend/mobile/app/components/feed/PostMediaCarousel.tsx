import React, { useState } from 'react';
import { View, FlatList, Dimensions, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import SessionPreview from './SessionPreview';

export default function PostMediaCarousel({ post }: { post: any }) {
    const { theme } = useTheme();
    const router = useRouter();
    const SCREEN_WIDTH = Dimensions.get('window').width;
    const [activeIndex, setActiveIndex] = useState(0);

    const mediaItems: any[] = [];
    if (post.reference) {
        mediaItems.push({ type: 'reference', data: post.reference });
    }
    if (post.images) {
        post.images.forEach((img: string) => mediaItems.push({ type: 'image', data: img }));
    }

    if (mediaItems.length === 0) return null;

    return (
        <View className="mt-2" style={{ height: 350 }}>
            <View style={{ flex: 1 }}>
                <FlatList
                    data={mediaItems}
                    keyExtractor={(item, index) => index.toString()}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(ev) => {
                        const newIndex = Math.floor(ev.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                        setActiveIndex(newIndex);
                    }}
                    renderItem={({ item, index }) => (
                        <View style={{ width: SCREEN_WIDTH, height: 350 }}>
                            {item.type === 'reference' ? (
                                <SessionPreview
                                    reference={item.data}
                                    style={{ width: SCREEN_WIDTH, height: 350, margin: 0, borderRadius: 0 }}
                                    extraParams={{
                                        images: JSON.stringify(post.images || []),
                                        postId: post._id
                                    }}
                                />
                            ) : (
                                <TouchableOpacity
                                    activeOpacity={0.95}
                                    onPress={() => router.push({
                                        pathname: '/screens/post/image-max',
                                        params: {
                                            images: JSON.stringify(post.images),
                                            // If reference exists, image index is (listIndex - 1)
                                            index: post.reference ? (index - 1).toString() : index.toString(),
                                            postId: post._id
                                        }
                                    })}
                                >
                                    <Image
                                        source={{ uri: item.data }}
                                        style={{ width: SCREEN_WIDTH, height: 350 }}
                                        resizeMode="cover"
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                />
                {/* Indicator 1/10 */}
                {mediaItems.length > 1 && (
                    <View style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16
                    }}>
                        <Text style={{ fontFamily: theme.fonts.bodyBold, color: '#fff', fontSize: 12 }}>
                            {activeIndex + 1} / {mediaItems.length}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}
