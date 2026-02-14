import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import avatarPortrait from '../../assets/mockups/avatar-portrait.png';
import geoPortrait from '../../assets/mockups/geo-portrait.png';
import exercisePortrait from '../../assets/mockups/exercise-portrait.png';

const mockups = [
    {
        id: 1,
        title: 'Avatar Customization',
        description: 'Express yourself with a fully customizable 3D avatar that grows with you.',
        image: avatarPortrait,
    },
    {
        id: 2,
        title: 'Precision Tracking',
        description: 'Track your runs and walks with high-fidelity GPS mapping and real-time stats.',
        image: geoPortrait,
    },
    {
        id: 3,
        title: 'Guided Exercises',
        description: 'Follow professional workout programs with clear instructions and progress tracking.',
        image: exercisePortrait,
    },
];

export default function MobileMockupCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % mockups.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + mockups.length) % mockups.length);
    };

    useEffect(() => {
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full max-w-sm mx-auto">
            <div className="relative mx-auto h-[650px] w-full max-w-[320px]">
                {mockups.map((mockup, index) => (
                    <div
                        key={mockup.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        <img
                            src={mockup.image}
                            alt={mockup.title}
                            className="w-full h-full object-contain"
                        />
                    </div>
                ))}
            </div>

            {/* Navigation Controls */}
            <button
                onClick={prevSlide}
                className="absolute left-[-60px] top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white hidden lg:block"
            >
                <ChevronLeft size={32} />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-[-60px] top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white hidden lg:block"
            >
                <ChevronRight size={32} />
            </button>

            {/* Slide Indicators */}
            <div className="flex justify-center gap-2 mt-8">
                {mockups.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-blue-500 w-8' : 'bg-gray-600'
                            }`}
                    />
                ))}
            </div>

            {/* Caption Area (Visible on small screens) */}
            <div className="mt-6 text-center lg:hidden bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                <h3 className="text-xl font-bold text-white mb-2">{mockups[currentIndex].title}</h3>
                <p className="text-gray-400">{mockups[currentIndex].description}</p>
            </div>
        </div>
    );
}
