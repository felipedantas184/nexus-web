// components/activities/FileActivity.tsx
'use client';

import React, { useState, useRef } from 'react';
import { ActivityProgress, FileActivityConfig } from '@/types/schedule';
import { FaUpload, FaFile, FaCheck, FaTimes, FaCloudUploadAlt } from 'react-icons/fa';

interface FileActivityProps {
  activity: {
    config: FileActivityConfig;
    instructions: string;
  };
  progress: ActivityProgress;
  readOnly: boolean;
  onComplete: (data?: any) => Promise<void>;
  onSkip: (reason?: string) => Promise<void>;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploading: boolean;
  error?: string;
}

export default function FileActivity({
  activity,
  progress,
  readOnly,
  onComplete,
  onSkip
}: FileActivityProps) {
  const config = activity.config as FileActivityConfig;
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(progress.status === 'completed');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar arquivos já enviados
  React.useEffect(() => {
    if (progress.executionData?.attachments) {
      const files: UploadedFile[] = progress.executionData.attachments.map((url: string, index: number) => ({
        id: `existing-${index}`,
        name: url.split('/').pop() || `Arquivo ${index + 1}`,
        size: 0, // Não temos tamanho
        type: url.split('.').pop() || 'file',
        url,
        uploading: false
      }));
      setUploadedFiles(files);
    }
  }, [progress.executionData?.attachments]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly || progress.status !== 'in_progress') return;
    
    const files = Array.from(event.target.files || []);
    
    // Validar número máximo de arquivos
    if (config.maxFiles && uploadedFiles.length + files.length > config.maxFiles) {
      alert(`Você pode enviar no máximo ${config.maxFiles} arquivos`);
      return;
    }
    
    // Validar tipos de arquivo
    const invalidFiles = files.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      return !config.allowedTypes.some(type => 
        type.toLowerCase().includes(extension) || 
        type.toLowerCase() === '*/*'
      );
    });
    
    if (invalidFiles.length > 0) {
      alert(`Tipos de arquivo não permitidos: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    // Validar tamanho máximo
    const oversizedFiles = files.filter(file => file.size > config.maxSizeMB * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert(`Arquivos muito grandes (máximo: ${config.maxSizeMB}MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    // Adicionar arquivos à lista
    const newFiles: UploadedFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type.split('/')[1] || file.name.split('.').pop() || 'file',
      uploading: true
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Simular upload (em produção, fazer upload real para Firebase Storage)
    newFiles.forEach(file => {
      setTimeout(() => {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === file.id 
              ? { ...f, uploading: false, url: `https://example.com/${file.name}` }
              : f
          )
        );
      }, 1500);
    });
    
    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    if (readOnly || progress.status !== 'in_progress') return;
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  const handleComplete = async () => {
    if (readOnly) return;
    
    // Validar se há arquivos (se necessário)
    if (uploadedFiles.length === 0) {
      alert('Por favor, envie pelo menos um arquivo');
      return;
    }
    
    setIsCompleting(true);
    try {
      const fileUrls = uploadedFiles.filter(f => f.url).map(f => f.url!);
      
      await onComplete({
        submission: {
          fileCount: uploadedFiles.length,
          totalSize: uploadedFiles.reduce((sum, file) => sum + file.size, 0)
        },
        attachments: fileUrls
      });
      
      setIsCompleted(true);
    } catch (error) {
      console.error('Erro ao completar atividade de arquivo:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSkip = async () => {
    if (readOnly) return;
    
    const reason = prompt('Por que você está pulando esta atividade de arquivo? (opcional)');
    await onSkip(reason || undefined);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📕';
    if (type.includes('word') || type.includes('document')) return '📄';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('video')) return '🎬';
    if (type.includes('audio')) return '🎵';
    if (type.includes('zip') || type.includes('compressed')) return '🗜️';
    return '📎';
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <FaUpload className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800 mb-1">Upload de Arquivos</h3>
            <p className="text-amber-700">
              {activity.instructions}
            </p>
            
            <div className="mt-3 space-y-1">
              <p className="text-sm text-amber-600">
                • Tipos permitidos: {config.allowedTypes.join(', ')}
              </p>
              <p className="text-sm text-amber-600">
                • Tamanho máximo: {config.maxSizeMB}MB por arquivo
              </p>
              {config.maxFiles && (
                <p className="text-sm text-amber-600">
                  • Máximo de {config.maxFiles} arquivo{config.maxFiles !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Área de Upload */}
      {!isCompleted && progress.status === 'in_progress' && (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-amber-400 transition-colors cursor-pointer"
          onClick={() => !readOnly && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={!config.maxFiles || config.maxFiles > 1}
            accept={config.allowedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={readOnly}
          />
          
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
            <FaCloudUploadAlt className="w-8 h-8 text-amber-600" />
          </div>
          
          <h4 className="text-lg font-semibold text-gray-800 mb-2">
            Clique para selecionar arquivos
          </h4>
          
          <p className="text-gray-600 mb-4">
            ou arraste e solte aqui
          </p>
          
          <div className="text-sm text-gray-500">
            {config.maxFiles ? `Até ${config.maxFiles} arquivos, ` : ''}
            {config.maxSizeMB}MB cada
          </div>
        </div>
      )}

      {/* Lista de Arquivos */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700">
            Arquivos Enviados ({uploadedFiles.length}
            {config.maxFiles && `/${config.maxFiles}`})
          </h4>
          
          {uploadedFiles.map(file => (
            <div 
              key={file.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="text-2xl">
                  {getFileIcon(file.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span className="uppercase">{file.type}</span>
                    {file.uploading && (
                      <span className="text-amber-600">Enviando...</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {file.uploading ? (
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : file.error ? (
                  <div className="text-red-500" title={file.error}>
                    <FaTimes />
                  </div>
                ) : (
                  <div className="text-green-500">
                    <FaCheck />
                  </div>
                )}
                
                {!readOnly && progress.status === 'in_progress' && !file.uploading && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isCompleted ? (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
            <FaCheck className="w-6 h-6 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-800 mb-1">Arquivos Enviados!</h4>
          <p className="text-gray-600">
            Você enviou {uploadedFiles.length} arquivo{uploadedFiles.length !== 1 ? 's' : ''}
          </p>
        </div>
      ) : (
        !readOnly && progress.status === 'in_progress' && (
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleComplete}
              disabled={isCompleting || uploadedFiles.length === 0}
              className="flex-1 bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FaCheck />
              {isCompleting ? 'Enviando...' : 'Finalizar Upload'}
            </button>
            
            <button
              onClick={handleSkip}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Pular
            </button>
          </div>
        )
      )}

      {!readOnly && progress.status === 'pending' && (
        <div className="text-center py-4 text-gray-500">
          Inicie a atividade para fazer upload de arquivos
        </div>
      )}
    </div>
  );
}