import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { AlertCircle, Camera } from 'lucide-react';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onScanFailure }) => {
    const [error, setError] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const scannerId = "html5qr-code-full-region";

    useEffect(() => {
        // Timeout to ensure DOM element is rendered
        const timer = setTimeout(() => {
            if (scannerRef.current) {
                return; // Already initialized
            }

            try {
                const scanner = new Html5QrcodeScanner(
                    scannerId,
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        formatsToSupport: [
                            Html5QrcodeSupportedFormats.QR_CODE,
                            Html5QrcodeSupportedFormats.EAN_13,
                            Html5QrcodeSupportedFormats.EAN_8,
                            Html5QrcodeSupportedFormats.CODE_128,
                            Html5QrcodeSupportedFormats.UPC_A,
                            Html5QrcodeSupportedFormats.UPC_E
                        ],
                        rememberLastUsedCamera: true
                    },
                    /* verbose= */ false
                );

                scannerRef.current = scanner;

                scanner.render(
                    (decodedText) => {
                        // Prevent multiple success triggers
                        // scanner.clear(); // Taking out clear so they can scan multiple if needed, or parent handles close
                        onScanSuccess(decodedText);
                    },
                    (errorMessage) => {
                        // Scan error (frame didn't find qr code) - ignore
                    }
                );

                setInitialized(true);

            } catch (err: any) {
                console.error("Erro ao iniciar scanner:", err);
                setError(err.message || "Falha ao iniciar câmera.");
            }
        }, 100);

        return () => {
            clearTimeout(timer);
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
                scannerRef.current = null;
            }
        };
    }, []);

    return (
        <div className="w-full max-w-sm mx-auto bg-black/5 dark:bg-black/40 p-4 rounded-xl border border-gray-200 dark:border-gray-700 relative">
            {error ? (
                <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg text-center gap-2 min-h-[250px]">
                    <AlertCircle className="text-red-500" size={32} />
                    <p className="font-bold text-gray-800 dark:text-white">Não foi possível acessar a câmera</p>
                    <p className="text-xs text-gray-500">{error}</p>
                    <div className="text-[10px] text-gray-400 mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-left">
                        <p className="font-bold mb-1">Soluções possíveis:</p>
                        <ul className="list-disc pl-3 space-y-0.5">
                            <li>Verifique se permitiu o acesso à câmera.</li>
                            <li>Em celulares, o site deve usar <strong>HTTPS</strong>.</li>
                            <li>Tente usar outro navegador.</li>
                        </ul>
                    </div>
                </div>
            ) : (
                <div id={scannerId} className="w-full overflow-hidden rounded-lg bg-white dark:bg-gray-800"></div>
            )}

            {!initialized && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl z-10">
                    <Camera className="text-gray-400 animate-pulse mb-2" size={32} />
                    <p className="text-sm text-gray-500">Iniciando câmera...</p>
                </div>
            )}
        </div>
    );
};

export default BarcodeScanner;
