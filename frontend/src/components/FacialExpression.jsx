import { useEffect, useRef, useState, useCallback } from 'react';

export default function FaceDetector({ onMoodDetected, isCameraActive, onRescan, songsReady }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const faceapiRef = useRef(null);

    const [modelState, setModelState] = useState('loading'); // 'loading' | 'ready' | 'error'
    const [cameraState, setCameraState] = useState('waiting'); // 'waiting' | 'ready' | 'denied' | 'error'
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState('');

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
        setCameraState('waiting');
    }, []);

    const loadModels = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        loadModels();
        return () => stopCamera();
    }, [loadModels, stopCamera]);

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
                setCameraState(
                    err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
                        ? 'denied'
                        : 'error'
                );
                console.error('Camera start failed:', err);
            }
        };

        startCamera();
        return () => { isMounted = false; };
    }, [modelState, isCameraActive, stopCamera]);

    const canScan =
        modelState === 'ready' &&
        cameraState === 'ready' &&
        !isScanning &&
        isCameraActive;

    // Simplified — error states are already shown as messages above the button
    const scanButtonLabel = isScanning
        ? 'Scanning...'
        : (modelState !== 'ready' || cameraState !== 'ready')
            ? 'Preparing...'
            : 'Scan mood now';

    // Single human-readable status for the header
    const cameraStatus = (() => {
        if (modelState === 'error') return { text: 'AI model failed to load', error: true };
        if (cameraState === 'denied') return { text: 'Camera permission denied', error: true };
        if (cameraState === 'error') return { text: 'Camera unavailable', error: true };
        if (modelState === 'loading') return { text: 'Getting ready…', error: false };
        if (cameraState !== 'ready') return { text: 'Starting camera…', error: false };
        return { text: 'Ready to scan', error: false };
    })();

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

            // Sort once — first entry is the winner
            const ranked = Object.entries(detection.expressions)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name, score]) => ({
                    name,
                    confidence: Number((score * 100).toFixed(1)),
                }));

            const { name: mood, confidence } = ranked[0];
            setScanResult({ mood, confidence, ranked });
            onMoodDetected(mood);
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
        onRescan();
    };

    // ── Collapsed state — shown after songs load ──────────────────────────────
    if (songsReady && !isCameraActive) {
        return (
            <section className='camera-panel camera-panel-collapsed'>
                <div className='collapsed-mood'>
                    <div className='collapsed-mood-info'>
                        <span className='status-dot' />
                        <span className='collapsed-mood-label'>
                            Mood detected: <strong>{scanResult?.mood ?? 'unknown'}</strong>
                        </span>
                    </div>
                    {scanResult && (
                        <ul className='expression-breakdown collapsed-breakdown' aria-label='Top expressions'>
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
                    )}
                    <button type='button' onClick={handleRescan} className='rescan-button'>
                        Change mood
                    </button>
                </div>
            </section>
        );
    }

    // ── Expanded state — camera active ────────────────────────────────────────
    return (
        <section className='camera-panel'>
            <div className='camera-head'>
                <h2>Camera</h2>
                <span className={`camera-status-line ${cameraStatus.error ? 'is-error' : cameraState === 'ready' ? 'is-ready' : ''}`}>
                    {cameraStatus.text}
                </span>
            </div>

            <div className='camera-frame'>
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className='camera-video'
                />
            </div>

            {modelState === 'error' && (
                <p className='state-inline error'>
                    Failed to load the AI model.{' '}
                    <button type='button' className='inline-retry-btn' onClick={loadModels}>
                        Retry
                    </button>
                </p>
            )}

            {cameraState === 'denied' && (
                <p className='state-inline error'>
                    Camera access was denied. Please allow camera permission in your browser settings and refresh the page.
                </p>
            )}

            {cameraState === 'error' && modelState !== 'error' && (
                <p className='state-inline error'>
                    Could not access the camera. Make sure no other app is using it.
                </p>
            )}

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
                aria-label={scanButtonLabel}
            >
                {scanButtonLabel}
            </button>

            {scanResult && (
                <button type='button' onClick={handleRescan} className='rescan-button'>
                    Change mood
                </button>
            )}
        </section>
    );
}