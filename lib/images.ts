import { supabase } from './supabase';

// =====================================================
// SERVIÇO DE UPLOAD DE IMAGENS
// =====================================================

export const ImageService = {
    /**
     * Faz upload de uma imagem para o Supabase Storage
     * @param file - Arquivo de imagem (File object)
     * @param folder - Pasta onde salvar (ex: 'logos', 'products', 'avatars')
     * @returns URL pública da imagem
     */
    async upload(file: File, folder: string = 'general'): Promise<string> {
        try {
            // Gerar nome único para o arquivo
            const fileExt = file.name.split('.').pop();
            const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            // Fazer upload
            const { data, error } = await supabase.storage
                .from('images')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Erro ao fazer upload:', error);
                throw error;
            }

            // Obter URL pública
            const { data: urlData } = supabase.storage
                .from('images')
                .getPublicUrl(fileName);

            return urlData.publicUrl;
        } catch (error: any) {
            console.error('Erro no upload de imagem:', error);
            throw new Error(`Erro ao fazer upload: ${error.message}`);
        }
    },

    /**
     * Deleta uma imagem do storage
     * @param imageUrl - URL completa da imagem
     */
    async delete(imageUrl: string): Promise<void> {
        try {
            // Extrair o caminho do arquivo da URL
            const url = new URL(imageUrl);
            const pathParts = url.pathname.split('/');
            const fileName = pathParts.slice(pathParts.indexOf('images') + 1).join('/');

            const { error } = await supabase.storage
                .from('images')
                .remove([fileName]);

            if (error) {
                console.error('Erro ao deletar imagem:', error);
                throw error;
            }
        } catch (error: any) {
            console.error('Erro ao deletar imagem:', error);
            throw new Error(`Erro ao deletar: ${error.message}`);
        }
    },

    /**
     * Atualiza uma imagem (deleta a antiga e faz upload da nova)
     * @param oldImageUrl - URL da imagem antiga (para deletar)
     * @param newFile - Novo arquivo de imagem
     * @param folder - Pasta onde salvar
     * @returns URL pública da nova imagem
     */
    async update(oldImageUrl: string | null, newFile: File, folder: string = 'general'): Promise<string> {
        try {
            // Deletar imagem antiga se existir
            if (oldImageUrl) {
                try {
                    await this.delete(oldImageUrl);
                } catch (err) {
                    console.warn('Não foi possível deletar imagem antiga:', err);
                    // Continua mesmo se falhar ao deletar
                }
            }

            // Fazer upload da nova imagem
            return await this.upload(newFile, folder);
        } catch (error: any) {
            console.error('Erro ao atualizar imagem:', error);
            throw new Error(`Erro ao atualizar: ${error.message}`);
        }
    },

    /**
     * Valida se o arquivo é uma imagem válida
     * @param file - Arquivo para validar
     * @param maxSizeMB - Tamanho máximo em MB (padrão: 5MB)
     * @returns true se válido, lança erro se inválido
     */
    validateImage(file: File, maxSizeMB: number = 5): boolean {
        // Validar tipo
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            throw new Error('Formato de imagem inválido. Use JPG, PNG, GIF ou WebP.');
        }

        // Validar tamanho
        const maxSize = maxSizeMB * 1024 * 1024; // Converter para bytes
        if (file.size > maxSize) {
            throw new Error(`Imagem muito grande. Tamanho máximo: ${maxSizeMB}MB`);
        }

        return true;
    }
};

// =====================================================
// HOOK REACT PARA UPLOAD DE IMAGENS
// =====================================================

import { useState } from 'react';

export function useImageUpload() {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadImage = async (file: File, folder: string = 'general'): Promise<string | null> => {
        try {
            setUploading(true);
            setError(null);

            // Validar imagem
            ImageService.validateImage(file);

            // Fazer upload
            const url = await ImageService.upload(file, folder);

            return url;
        } catch (err: any) {
            setError(err.message || 'Erro ao fazer upload');
            console.error('Erro no upload:', err);
            return null;
        } finally {
            setUploading(false);
        }
    };

    const updateImage = async (
        oldUrl: string | null,
        newFile: File,
        folder: string = 'general'
    ): Promise<string | null> => {
        try {
            setUploading(true);
            setError(null);

            // Validar imagem
            ImageService.validateImage(newFile);

            // Atualizar imagem
            const url = await ImageService.update(oldUrl, newFile, folder);

            return url;
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar imagem');
            console.error('Erro ao atualizar:', err);
            return null;
        } finally {
            setUploading(false);
        }
    };

    return {
        uploadImage,
        updateImage,
        uploading,
        error
    };
}
