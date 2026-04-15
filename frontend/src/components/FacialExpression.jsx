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
        <section className='panel panel-detector'>
            <div className='panel-header'>
                <div>
                    <p className='panel-kicker'>Camera module</p>
                    <h2 className='panel-title'>Read your expression</h2>
                    <p className='panel-copy'>Frame your face, run one scan, and we map that emotion to tracks instantly.</p>
                </div>

                <div className='readiness-stack'>
                    <span className={`readiness-pill ${isModelReady ? 'is-ready' : ''}`}>
                        Model {isModelReady ? 'ready' : 'loading'}
                    </span>
                    <span className={`readiness-pill ${isCameraReady ? 'is-ready' : ''}`}>
                        Camera {isCameraReady ? 'ready' : 'waiting'}
                    </span>
                </div>
            </div>

            <div className={`camera-stage ${isLandscape ? 'landscape' : 'portrait'}`}>
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className='camera-feed'
                    style={{
                        objectPosition: isLandscape ? 'center center' : 'center 18%',
                        transform: 'scaleX(-1)',
                    }}
                />
            </div>

            <div className='meta-grid'>
                <article className='meta-card'>
                    <p className='meta-label'>Current result</p>
                    {scanResult ? (
                        <>
                            <p className='meta-value'>{scanResult.mood}</p>
                            <p className='meta-note'>Confidence {scanResult.confidence}%</p>
                        </>
                    ) : (
                        <p className='meta-note'>No mood yet. Run a scan to start song recommendations.</p>
                    )}
                </article>
            </div>

            <button type='button' onClick={scanMood} disabled={!canScan} className='primary-action'>
                {isScanning ? 'Scanning...' : canScan ? 'Scan mood now' : 'Preparing camera...'}
            </button>
        </section>
    );
}