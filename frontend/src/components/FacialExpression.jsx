import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

export default function FaceDetector({ onMoodDetected }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [isModelReady, setIsModelReady] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [isLandscape, setIsLandscape] = useState(false);

    useEffect(() => {
        const updateOrientation = () => {
            setIsLandscape(window.innerWidth > window.innerHeight);
        };

        updateOrientation();
        window.addEventListener('resize', updateOrientation);
        window.addEventListener('orientationchange', updateOrientation);

        return () => {
            window.removeEventListener('resize', updateOrientation);
            window.removeEventListener('orientationchange', updateOrientation);
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const stopCamera = () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };

        const start = async () => {
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
                await faceapi.nets.faceExpressionNet.loadFromUri('/models');

                if (isMounted) {
                    setIsModelReady(true);
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user' },
                    audio: false,
                });

                if (!isMounted || !videoRef.current) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                streamRef.current = stream;
                videoRef.current.srcObject = stream;

                videoRef.current.onloadedmetadata = () => {
                    if (isMounted) {
                        setIsCameraReady(true);
                    }
                };
            } catch (err) {
                console.error('Initialization failed:', err);
            }
        };

        start();

        return () => {
            isMounted = false;
            stopCamera();
        };
    }, []);

    const canScan = isModelReady && isCameraReady && !isScanning;

    const scanMood = async () => {
        if (!videoRef.current) {
            return;
        }

        if (videoRef.current.readyState < 2) {
            console.warn('Camera is not ready yet. Please wait a moment and try again.');
            return;
        }

        setIsScanning(true);

        try {
            const video = videoRef.current;

            const detection = await faceapi
                .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceExpressions();

            if (!detection) {
                console.warn('No face detected. Center your face and try again.');
                return;
            }

            const expressionEntries = Object.entries(detection.expressions);

            const [mood, confidence] = expressionEntries.reduce(
                (best, current) => (current[1] > best[1] ? current : best),
                expressionEntries[0]
            );

            const ranked = [...expressionEntries]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name, score]) => ({
                    name,
                    confidence: Number((score * 100).toFixed(1)),
                }));

            const result = {
                mood,
                confidence: Number((confidence * 100).toFixed(1)),
                ranked,
            };

            setScanResult(result);
            if (typeof onMoodDetected === 'function') {
                onMoodDetected(mood);
            }

            console.log('Mood result:', result);
        } catch (err) {
            console.error('Mood scan failed:', err);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <section className='camera-panel'>
            <div className='camera-head'>
                <h2>Camera</h2>
                <div className='camera-readiness'>
                    <span className={`readiness-dot ${isModelReady ? 'is-ready' : ''}`}>
                        Model {isModelReady ? 'ready' : 'loading'}
                    </span>
                    <span className={`readiness-dot ${isCameraReady ? 'is-ready' : ''}`}>
                        Camera {isCameraReady ? 'ready' : 'waiting'}
                    </span>
                </div>
            </div>

            <div className={`camera-frame ${isLandscape ? 'landscape' : 'portrait'}`}>
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className='camera-video'
                    style={{
                        objectPosition: isLandscape ? 'center center' : 'center 18%',
                        transform: 'scaleX(-1)',
                    }}
                />
            </div>

            <div className='scan-strip'>
                {scanResult ? (
                    <p>
                        <strong>{scanResult.mood}</strong>
                        <span>{scanResult.confidence}% confidence</span>
                    </p>
                ) : (
                    <p>Scan once to load songs</p>
                )}
            </div>

            <button type='button' onClick={scanMood} disabled={!canScan} className='scan-button'>
                {isScanning ? 'Scanning...' : canScan ? 'Scan mood now' : 'Preparing camera...'}
            </button>
        </section>
    );
}