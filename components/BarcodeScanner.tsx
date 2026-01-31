import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { AlertCircle, Camera } from 'lucide-react';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onScanFailure }) => {
    const [error, setError] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);
    const scannerId = "html5qr-code-full-region";
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isScanningRef = useRef(false);

    useEffect(() => {
        // Inicializar o scanner
        const startScanner = async () => {
            if (isScanningRef.current) return;

            try {
                // Pequeno delay para garantir que o DOM está pronto
                await new Promise(r => setTimeout(r, 100));

                const html5Qrcode = new Html5Qrcode(scannerId);
                scannerRef.current = html5Qrcode;

                isScanningRef.current = true;

                // Configuração da câmera
                // Preferir câmera traseira (environment)
                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };

                await html5Qrcode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        // Sucesso
                        onScanSuccess(decodedText);
                    },
                    (errorMessage) => {
                        // Erro de leitura (normal enquanto procura)
                        if (onScanFailure) onScanFailure(errorMessage);
                    }
                );

                setInitialized(true);
            } catch (err: any) {
                console.error("Erro ao iniciar câmera:", err);
                setError(err.message || "Erro ao acessar câmera. Verifique permissões.");
                isScanningRef.current = false;
            }
        };

        startScanner();

        // Cleanup function
        return () => {
            if (scannerRef.current && isScanningRef.current) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear();
                    isScanningRef.current = false;
                }).catch(err => {
                    console.error("Falha ao parar scanner:", err);
                });
            }
        };
    }, []);

    return (
        <div className="w-full max-w-sm mx-auto bg-black rounded-xl overflow-hidden relative shadow-lg">
            {error ? (
                <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 text-center gap-2 min-h-[250px]">
                    <AlertCircle className="text-red-500" size={32} />
                    <p className="font-bold text-gray-800 dark:text-white">Erro na Câmera</p>
                    <p className="text-xs text-gray-500">{error}</p>
                </div>
            ) : (
                <>
                    {/* Container do vídeo */}
                    <div id={scannerId} className="w-full h-full min-h-[300px] bg-black"></div>

                    {/* Overlay nativo estilizado (Scanning grid) */}
                    {initialized && (
                        <div className="absolute inset-0 pointer-events-none border-2 border-white/20 rounded-xl relative">
                            {/* Central Box Focus */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-pink-400 rounded-lg shadow-[0_0_0_999px_rgba(0,0,0,0.5)]">
                                {/* Scan Line Animation */}
                                <div className="absolute top-0 left-0 w-full h-0.5 bg-pink-500 shadow-[0_0_10px_#ec4899] animate-[scan_2s_infinite_linear]"></div>
                            </div>

                            <div className="absolute bottom-4 left-0 w-full text-center text-white text-xs font-bold drop-shadow-md">
                                Aponte para o código
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {!initialized && !error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-20">
                            <Camera className="animate-pulse mb-3 text-pink-400" size={40} />
                            <p className="text-sm font-medium">Ligando Câmera...</p>
                        </div>
                    )}
                </>
            )}

            <style>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                #html5qr-code-full-region video {
                    object-fit: cover !important;
                    border-radius: 12px;
                }
            `}</style>
        </div>
    );
};

export default BarcodeScanner;
