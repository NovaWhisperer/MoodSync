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
        <section className='flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-stone-950/85 p-4 shadow-2xl shadow-black/25 backdrop-blur sm:rounded-[1.75rem] sm:p-5'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                <div className='min-w-0'>
                    <p className='text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-amber-200/90'>Camera scan</p>
                    <h2 className='mt-1 text-xl font-black tracking-tight text-white sm:text-2xl'>Detect your mood</h2>
                    <p className='mt-2 max-w-md text-sm leading-5 text-stone-300'>
                        Keep your face centered and tap scan to pull one mood from the camera.
                    </p>
                </div>

                <div className='flex shrink-0 flex-row flex-wrap gap-2 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-stone-300 sm:flex-col sm:items-end'>
                    <span className={`rounded-full px-3 py-1 ${isModelReady ? 'bg-emerald-400/15 text-emerald-200' : 'bg-white/5 text-stone-400'}`}>
                        Model {isModelReady ? 'ready' : 'loading'}
                    </span>
                    <span className={`rounded-full px-3 py-1 ${isCameraReady ? 'bg-emerald-400/15 text-emerald-200' : 'bg-white/5 text-stone-400'}`}>
                        Camera {isCameraReady ? 'ready' : 'waiting'}
                    </span>
                </div>
            </div>

            <div
                className={`mx-auto mt-4 w-full max-w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30 ${
                    isLandscape ? 'min-h-55 sm:min-h-0 sm:max-w-96 sm:aspect-square' : 'min-h-65 sm:min-h-0 sm:max-w-96 sm:aspect-4/5'
                }`}
            >
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className='h-full w-full object-cover'
                    style={{
                        objectPosition: isLandscape ? 'center center' : 'center 18%',
                        transform: 'scaleX(-1)',
                    }}
                />
            </div>

            <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                    <p className='text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-stone-400'>Current result</p>
                    {scanResult ? (
                        <>
                            <p className='mt-2 text-2xl font-black text-white'>{scanResult.mood}</p>
                            <p className='mt-1 text-sm text-stone-300'>Confidence {scanResult.confidence}%</p>
                        </>
                    ) : (
                        <p className='mt-2 text-sm leading-5 text-stone-300'>No mood yet. Scan once to load songs.</p>
                    )}
                </div>

                <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                    <p className='text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-stone-400'>Next step</p>
                    <p className='mt-2 text-sm leading-5 text-stone-300'>The detected mood will fetch songs from the backend automatically.</p>
                </div>
            </div>

            <button
                type='button'
                onClick={scanMood}
                disabled={!canScan}
                className='mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-amber-300 via-rose-300 to-orange-300 px-4 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:py-2.5'
            >
                {isScanning ? 'Scanning...' : canScan ? 'Scan Mood' : 'Preparing camera...'}
            </button>
        </section>
    );
}