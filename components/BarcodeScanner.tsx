
import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onScanFailure }) => {
    useEffect(() => {
        // Configuração do Scanner
        const scanner = new Html5QrcodeScanner(
            "reader", 
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0 
            },
            /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                // Ao ler com sucesso, limpa o scanner e manda o código para o pai
                scanner.clear().catch(err => console.error("Erro ao limpar scanner", err));
                onScanSuccess(decodedText);
            },
            (errorMessage) => {
                if (onScanFailure) onScanFailure(errorMessage);
            }
        );

        // Limpeza quando o componente desmontar (fechar modal)
        return () => {
            scanner.clear().catch(error => console.error("Falha ao limpar scanner.", error));
        };
    }, [onScanSuccess, onScanFailure]);

    return (
        <div className="w-full max-w-sm mx-auto bg-black/5 dark:bg-black/40 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div id="reader" className="w-full overflow-hidden rounded-lg"></div>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                Aponte a câmera para o código de barras
            </p>
        </div>
    );
};

export default BarcodeScanner;
