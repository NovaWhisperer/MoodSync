import { useEffect, useRef, useState } from 'react';

export default function FaceDetector({ onMoodDetected, isCameraActive, onRescan }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const faceapiRef = useRef(null);

    const [modelState, setModelState] = useState('loading'); // 'loading' | 'ready' | 'error'
    const [cameraState, setCameraState] = useState('waiting'); // 'waiting' | 'ready' | 'denied' | 'error'
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState('');
    const [isLandscape, setIsLandscape] = useState(false);

    useEffect(() => {
        const update = () => setIsLandscape(window.innerWidth > window.innerHeight);
        update();
        window.addEventListener('resize', update);
        window.addEventListener('orientationchange', update);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('orientationchange', update);
        };
    }, []);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
        setCameraState('waiting');
    };

    // Lazy-load face-api.js only when needed
    const loadModels = async () => {
        setModelState('loading');
        try {
            const faceapi = await import('face-api.js');
            faceapiRef.current = faceapi;
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            await faceapi.nets.faceExpressionNet.loadFromUri('/models');
            setModelState('ready');
        } catch (err) {
            console.error('Model initialization failed:', err);
            setModelState('error');
        }
    };

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            await loadModels();
            if (!isMounted) return;
        };

        init();

        return () => {
            isMounted = false;
            stopCamera();
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const startCamera = async () => {
            if (modelState !== 'ready' || !isCameraActive) {
                stopCamera();
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user' },
                    audio: false,
                });

                if (!isMounted || !videoRef.current) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }

                streamRef.current = stream;
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    if (isMounted) setCameraState('ready');
                };
            } catch (err) {
                if (!isMounted) return;
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setCameraState('denied');
                } else {
                    setCameraState('error');
                }
                console.error('Camera start failed:', err);
            }
        };

        startCamera();

        return () => {
            isMounted = false;
        };
    }, [modelState, isCameraActive]);

    const canScan =
        modelState === 'ready' &&
        cameraState === 'ready' &&
        !isScanning &&
        isCameraActive;

    const getScanButtonLabel = () => {
        if (isScanning) return 'Scanning...';
        if (!isCameraActive) return 'Camera paused';
        if (modelState === 'loading') return 'Loading AI model...';
        if (modelState === 'error') return 'Model failed to load';
        if (cameraState === 'denied') return 'Camera permission denied';
        if (cameraState === 'error') return 'Camera unavailable';
        if (cameraState !== 'ready') return 'Preparing camera...';
        return 'Scan mood now';
    };

    const scanMood = async () => {
        if (!videoRef.current || !faceapiRef.current) return;
        if (videoRef.current.readyState < 2) return;

        setIsScanning(true);
        setScanError('');

        try {
            const faceapi = faceapiRef.current;
            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceExpressions();

            if (!detection) {
                setScanError('No face detected. Centre your face and try again.');
                return;
            }

            const entries = Object.entries(detection.expressions);
            const [mood, confidence] = entries.reduce(
                (best, cur) => (cur[1] > best[1] ? cur : best),
                entries[0]
            );

            const ranked = [...entries]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name, score]) => ({
                    name,
                    confidence: Number((score * 100).toFixed(1)),
                }));

            const result = { mood, confidence: Number((confidence * 100).toFixed(1)), ranked };
            setScanResult(result);
            if (typeof onMoodDetected === 'function') onMoodDetected(mood);
        } catch (err) {
            console.error('Mood scan failed:', err);
            setScanError('Scan failed. Please try again.');
        } finally {
            setIsScanning(false);
        }
    };

    const handleRescan = () => {
        setScanResult(null);
        setScanError('');
        if (typeof onRescan === 'function') onRescan();
    };

    return (
        <section className='camera-panel'>
            <div className='camera-head'>
                <h2>Camera</h2>
                <div className='camera-readiness'>
                    <span className={`readiness-dot ${modelState === 'ready' ? 'is-ready' : modelState === 'error' ? 'is-error' : ''}`}>
                        Model {modelState === 'ready' ? 'ready' : modelState === 'error' ? 'failed' : 'loading'}
                    </span>
                    <span className={`readiness-dot ${cameraState === 'ready' ? 'is-ready' : cameraState === 'denied' || cameraState === 'error' ? 'is-error' : ''}`}>
                        Camera {cameraState === 'ready' ? 'ready' : cameraState === 'denied' ? 'denied' : cameraState === 'error' ? 'error' : 'waiting'}
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

            {/* Model load error with retry */}
            {modelState === 'error' && (
                <p className='state-inline error'>
                    Failed to load the AI model.{' '}
                    <button type='button' className='inline-retry-btn' onClick={loadModels}>
                        Retry
                    </button>
                </p>
            )}

            {/* Camera permission denied */}
            {cameraState === 'denied' && (
                <p className='state-inline error'>
                    Camera access was denied. Please allow camera permission in your browser settings and refresh the page.
                </p>
            )}

            {/* Camera generic error */}
            {cameraState === 'error' && modelState !== 'error' && (
                <p className='state-inline error'>
                    Could not access the camera. Make sure no other app is using it.
                </p>
            )}

            {/* Scan result strip */}
            <div className='scan-strip'>
                {scanError ? (
                    <p className='scan-error'>{scanError}</p>
                ) : scanResult ? (
                    <>
                        <p>
                            <strong>{scanResult.mood}</strong>
                            <span>{scanResult.confidence}% confidence</span>
                        </p>
                        <ul className='expression-breakdown' aria-label='Top expressions'>
                            {scanResult.ranked.map(({ name, confidence }) => (
                                <li key={name} className='expression-row'>
                                    <span className='expression-name'>{name}</span>
                                    <div className='expression-bar-wrap'>
                                        <div
                                            className='expression-bar-fill'
                                            style={{ width: `${confidence}%` }}
                                        />
                                    </div>
                                    <span className='expression-pct'>{confidence}%</span>
                                </li>
                            ))}
                        </ul>
                    </>
                ) : (
                    <p>Scan once to load songs</p>
                )}
            </div>

            <button
                type='button'
                onClick={scanMood}
                disabled={!canScan}
                className='scan-button'
                aria-label={getScanButtonLabel()}
            >
                {getScanButtonLabel()}
            </button>

            {!isCameraActive || scanResult ? (
                <button type='button' onClick={handleRescan} className='rescan-button'>
                    {!isCameraActive ? 'Enable camera to rescan mood' : 'Rescan mood'}
                </button>
            ) : null}
        </section>
    );
}