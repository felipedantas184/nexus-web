// components/activities/VideoActivity.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ActivityProgress, VideoActivityConfig } from '@/types/schedule';
import { FaPlay, FaPause, FaCheck, FaYoutube, FaVimeo } from 'react-icons/fa';

interface VideoActivityProps {
  activity: {
    config: VideoActivityConfig;
    instructions: string;
  };
  progress: ActivityProgress;
  readOnly: boolean;
  onComplete: (data?: any) => Promise<void>;
  onSkip: (reason?: string) => Promise<void>;
}

export default function VideoActivity({
  activity,
  progress,
  readOnly,
  onComplete,
  onSkip
}: VideoActivityProps) {
  const config = activity.config as VideoActivityConfig;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchedPercentage, setWatchedPercentage] = useState(0);
  const [isCompleted, setIsCompleted] = useState(progress.status === 'completed');
  const [isLoading, setIsLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const extractVideoId = (url: string): string | null => {
    if (config.provider === 'youtube') {
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      return match ? match[1] : null;
    }
    if (config.provider === 'vimeo') {
      const match = url.match(/vimeo\.com\/(\d+)/);
      return match ? match[1] : null;
    }
    return null;
  };

  const getEmbedUrl = (): string => {
    const videoId = extractVideoId(config.url);
    
    if (config.provider === 'youtube' && videoId) {
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    }
    
    if (config.provider === 'vimeo' && videoId) {
      return `https://player.vimeo.com/video/${videoId}`;
    }
    
    return config.url; // URL customizada
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration || 0;
      
      setCurrentTime(current);
      setDuration(total);
      
      if (total > 0) {
        const percentage = (current / total) * 100;
        setWatchedPercentage(percentage);
        
        // Verificar se atingiu porcentagem mínima
        if (config.requireWatchPercentage && 
            percentage >= config.requireWatchPercentage && 
            !isCompleted) {
          // Automatically mark as ready for completion
        }
      }
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleComplete = async () => {
    if (readOnly) return;
    
    // Verificar se assistiu o mínimo requerido
    if (config.requireWatchPercentage && watchedPercentage < config.requireWatchPercentage) {
      alert(`Você precisa assistir pelo menos ${config.requireWatchPercentage}% do vídeo`);
      return;
    }
    
    setIsLoading(true);
    try {
      await onComplete({
        submission: {
          watchedPercentage,
          duration,
          completedAt: new Date()
        }
      });
      setIsCompleted(true);
    } catch (error) {
      console.error('Erro ao completar atividade de vídeo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    if (readOnly) return;
    
    const reason = prompt('Por que você está pulando este vídeo? (opcional)');
    await onSkip(reason || undefined);
  };

  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const embedUrl = getEmbedUrl();
  const isExternalEmbed = config.provider === 'youtube' || config.provider === 'vimeo';

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              {config.provider === 'youtube' ? (
                <FaYoutube className="w-5 h-5 text-red-600" />
              ) : config.provider === 'vimeo' ? (
                <FaVimeo className="w-5 h-5 text-red-600" />
              ) : (
                <FaPlay className="w-5 h-5 text-red-600" />
              )}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 mb-1">
              {config.provider === 'youtube' ? 'Vídeo do YouTube' :
               config.provider === 'vimeo' ? 'Vídeo do Vimeo' : 'Vídeo'}
            </h3>
            <p className="text-red-700">
              {activity.instructions}
            </p>
            
            {config.requireWatchPercentage && (
              <div className="mt-3">
                <p className="text-sm text-red-600">
                  • Você precisa assistir pelo menos {config.requireWatchPercentage}% do vídeo
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Player de Vídeo */}
      <div className="rounded-xl overflow-hidden shadow-lg">
        {isExternalEmbed ? (
          <div className="relative pt-[56.25%]"> {/* 16:9 Aspect Ratio */}
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video player"
            />
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full"
              controls={!readOnly && progress.status === 'in_progress'}
              src={config.url}
            >
              Seu navegador não suporta vídeos HTML5.
            </video>
            
            {!readOnly && progress.status === 'in_progress' && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePlayPause}
                    className="bg-white text-black p-3 rounded-full hover:bg-gray-200"
                  >
                    {isPlaying ? <FaPause /> : <FaPlay />}
                  </button>
                  
                  <div className="flex-1 mx-4">
                    <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white"
                        style={{ width: `${watchedPercentage}%` }}
                      />
                    </div>
                    <div className="text-white text-sm mt-1">
                      {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} / 
                      {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progresso e Ações */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600">Progresso:</span>
            <div className="text-lg font-semibold">
              {watchedPercentage.toFixed(1)}%
            </div>
          </div>
          
          {config.requireWatchPercentage && (
            <div className={`px-3 py-1 rounded-full text-sm ${
              watchedPercentage >= config.requireWatchPercentage
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {watchedPercentage >= config.requireWatchPercentage
                ? '✅ Requisito atendido'
                : `⏳ Necessário: ${config.requireWatchPercentage}%`}
            </div>
          )}
        </div>

        {isCompleted ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-2">
              <FaCheck className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-800">Vídeo Concluído!</h4>
            <p className="text-sm text-gray-600">
              Você assistiu {watchedPercentage.toFixed(1)}% do vídeo
            </p>
          </div>
        ) : (
          !readOnly && progress.status === 'in_progress' && (
            <div className="flex gap-3">
              <button
                onClick={handleComplete}
                disabled={isLoading} // RETIRADO CÓDIGO DAQUI
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FaCheck />
                {isLoading ? 'Concluindo...' : 'Marcar como Assistido'}
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
            Inicie a atividade para assistir ao vídeo
          </div>
        )}
      </div>
    </div>
  );
}