import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';

const OpticalFeedViewer = () => {
  const [tracklet, setTracklet] = useState([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sequenceId = 'sequence_01'; // Defaulting to our mock sequence
  const API_URL = 'http://localhost:8000';

  useEffect(() => {
    const fetchTracklet = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/optical-track/${sequenceId}`);
        // Sort by frame number just in case
        const sortedData = response.data.sort((a, b) => a.frame_number - b.frame_number);
        setTracklet(sortedData);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch tracklet:', err);
        setError('Failed to load tracklet data.');
        setLoading(false);
      }
    };
    fetchTracklet();
  }, [sequenceId]);

  useEffect(() => {
    let interval;
    if (isPlaying && tracklet.length > 0) {
      interval = setInterval(() => {
        setCurrentFrameIndex((prev) => {
          if (prev >= tracklet.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 100); // 10 FPS
    }
    return () => clearInterval(interval);
  }, [isPlaying, tracklet.length]);

  const handlePlayPause = () => {
    if (currentFrameIndex >= tracklet.length - 1 && !isPlaying) {
      setCurrentFrameIndex(0); // Restart if at end
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (currentFrameIndex < tracklet.length - 1) {
      setCurrentFrameIndex(currentFrameIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentFrameIndex > 0) {
      setCurrentFrameIndex(currentFrameIndex - 1);
    }
  };

  if (loading) return <div className="text-white p-4">Loading optical feed...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (tracklet.length === 0) return <div className="text-white p-4">No tracklet data found.</div>;

  const currentData = tracklet[currentFrameIndex];
  
  // Format frame number to match dataset format (e.g., 0000.jpg)
  const padFrame = (num) => String(num).padStart(4, '0');
  
  const imageUrl = `${API_URL}/dataset/${sequenceId}/images/${padFrame(currentData.frame_number)}.jpg`;

  // Pre-calculate path for drawing
  const pathPoints = tracklet.slice(0, currentFrameIndex + 1);

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-2xl w-full max-w-4xl mx-auto font-mono">
      {/* Header */}
      <div className="bg-slate-800 p-3 border-b border-slate-700 flex justify-between items-center text-cyan-400">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="font-semibold uppercase tracking-wider text-sm">OPTICAL FEED: {sequenceId}</span>
        </div>
        <div className="text-sm">
          FRAME {currentData.frame_number + 1} / {tracklet.length}
        </div>
      </div>

      {/* Viewer Area */}
      <div className="relative w-full aspect-video bg-black overflow-hidden group">
        <img 
          src={imageUrl} 
          alt={`Frame ${currentData.frame_number}`} 
          className="w-full h-full object-contain"
        />
        
        {/* SVG Overlay for Bounding Box and Path */}
        <svg 
          className="absolute top-0 left-0 w-full h-full pointer-events-none" 
          viewBox="0 0 640 480" // Assuming 640x480 for our mock/MSOD data. Adjust if dynamic is needed.
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Draw movement path */}
          <polyline
            points={pathPoints.map(p => `${p.center_x},${p.center_y}`).join(' ')}
            fill="none"
            stroke="rgba(34, 211, 238, 0.6)" // Cyan-400 with opacity
            strokeWidth="2"
            strokeDasharray="4 2"
          />

          {/* Draw bounding box */}
          <rect
            x={currentData.bounding_box[0]}
            y={currentData.bounding_box[1]}
            width={currentData.bounding_box[2] - currentData.bounding_box[0]}
            height={currentData.bounding_box[3] - currentData.bounding_box[1]}
            fill="none"
            stroke="#ef4444" // red-500
            strokeWidth="2"
          />
          
          {/* Draw center point */}
          <circle 
            cx={currentData.center_x} 
            cy={currentData.center_y} 
            r="3" 
            fill="#ef4444" 
          />
          
          {/* Label */}
          <text
            x={currentData.bounding_box[0]}
            y={currentData.bounding_box[1] - 5}
            fill="#ef4444"
            fontSize="12"
            fontFamily="monospace"
          >
            OBJ-{currentData.object_id} [CONF: {(currentData.confidence * 100).toFixed(0)}%]
          </text>
        </svg>
      </div>

      {/* Controls */}
      <div className="bg-slate-800 p-4 border-t border-slate-700 flex justify-center items-center space-x-6">
        <button 
          onClick={handlePrev} 
          disabled={currentFrameIndex === 0}
          className="text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
        >
          <SkipBack size={24} />
        </button>
        
        <button 
          onClick={handlePlayPause}
          className="text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          {isPlaying ? <Pause size={32} /> : <Play size={32} />}
        </button>
        
        <button 
          onClick={handleNext} 
          disabled={currentFrameIndex >= tracklet.length - 1}
          className="text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
        >
          <SkipForward size={24} />
        </button>
      </div>
    </div>
  );
};

export default OpticalFeedViewer;
