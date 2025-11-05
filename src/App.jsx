import React, { useState, useEffect, useRef, useCallback } from 'react';

// ====================================================================
// --- 1. CORE CONFIGURATION & UTILITIES ---
// (Audio related constants removed)
// ====================================================================

const LINKEDIN_URL = "https://www.linkedin.com/in/furqan-ahmed-bandey"; // Placeholder LinkedIn URL

// Helper function for display formatting
const formatDateTime = (rawDateTime) => {
  if (!rawDateTime) return '';
  const date = new Date(rawDateTime);
  return date.toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

// Custom Message Box Utility (Replaces alert/confirm)
const showTemporaryMessage = (message, isError = false) => {
    const messageBox = document.createElement('div');
    messageBox.textContent = message;
    
    const baseClasses = "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 rounded-xl shadow-2xl z-50 text-center transition-opacity duration-300 font-sans max-w-xs sm:max-w-md mx-auto";
    const colorClass = isError ? "bg-red-600 text-white" : "bg-green-500 text-white";
    
    messageBox.className = `${baseClasses} ${colorClass} opacity-0`;
    document.body.appendChild(messageBox);
    
    // Animate in
    setTimeout(() => messageBox.style.opacity = '1', 10);
    
    // Animate out and remove
    setTimeout(() => {
        messageBox.style.opacity = '0';
        setTimeout(() => document.body.removeChild(messageBox), 300); // Wait for fade out
    }, 4000);
};


// ====================================================================
// --- 2. VISUAL UTILITY COMPONENTS ---
// ====================================================================

// ParticleBackground: Canvas-based subtle animation (Gold/White theme)
const ParticleBackground = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const particles = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.2, vy: Math.random() * 0.3 + 0.1
      });
    }
    function loop() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.y -= p.vy;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        
        // Draw glow
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = '#C49A6E'; // Soft Gold
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + 1.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw core
        ctx.globalAlpha = p.alpha * 1.5;
        ctx.fillStyle = '#ffffff'; // White core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(loop);
    }
    loop();
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return (
    <canvas 
      ref={canvasRef} 
      className='absolute top-0 left-0 w-full h-full pointer-events-none z-0' 
    />
  );
};

// ConfettiEffect: CSS-based burst effect (Gold tones)
const ConfettiEffect = () => {
  const [pieces, setPieces] = useState([]);
  // Elegant color palette: Gold, Cream, Copper
  const colors = ['#ffd700', '#f0e68c', '#daa520', '#b8860b', '#fffaf0', '#a52a2a', '#e3a860']; 
  
  useEffect(() => {
    const newPieces = Array.from({ length: 150 }, (_, index) => ({
      id: index,
      color: colors[index % colors.length],
      style: {
        // Start position slightly randomized around the center top
        left: `${50 + (Math.random() - 0.5) * 40}vw`,
        top: `0vh`, 
        transform: `scale(${Math.random() * 0.5 + 0.5}) rotate(${Math.random() * 360}deg)`,
        animationDuration: `${Math.random() * 1.5 + 1.5}s`,
        animationDelay: `${Math.random() * 0.5}s`,
      },
    }));
    setPieces(newPieces);
    const timer = setTimeout(() => setPieces([]), 5000); // 5 seconds duration
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>{`
        @keyframes confetti-burst {
          0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translate(calc(var(--rand-x) * 150vw), 150vh) rotate(calc(var(--rand-rot) * 720deg)) scale(0.1); }
        }
        .confetti-piece {
          position: fixed; width: 8px; height: 8px; opacity: 0;
          animation: confetti-burst var(--duration) ease-out forwards;
          z-index: 20;
        }
      `}</style>
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {pieces.map(piece => (
          <div
            key={piece.id}
            className="confetti-piece"
            style={{
              ...piece.style,
              backgroundColor: piece.color,
              '--duration': piece.style.animationDuration,
              '--rand-x': Math.random() * 2 - 1,
              '--rand-rot': Math.random() * 2 + 1,
            }}
          />
        ))}
      </div>
    </>
  );
};


// ====================================================================
// --- 3. HOME VIEW (Creation Form) ---
// ====================================================================

const HomeView = ({ onCreate }) => {
  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [dateTime, setDateTime] = useState(""); 
  const [message, setMessage] = useState("");
  const [spotifyLink, setSpotifyLink] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const goldButton = "w-full bg-[#C49A6E] hover:bg-[#A5855A] text-white py-3 rounded-xl font-semibold transition-all shadow-md mt-6 tracking-wide";
  const inputStyle = "w-full p-3 mb-4 border border-gray-300 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-[#C49A6E] bg-white text-gray-800";

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 2097152) { 
      showTemporaryMessage("Image size must be less than 2MB.", true);
      setImageFile(null);
      return;
    }
    setImageFile(file);
    showTemporaryMessage(file ? `Image selected: ${file.name}` : "Image cleared.", false);
  };

  const handleCreateCelebration = async (e) => {
    e.preventDefault();
    if (!recipientName || !senderName || !dateTime) {
      showTemporaryMessage("✨ Please fill in Recipient Name, Sender Name, and Date/Time.", true);
      return;
    }

    setIsLoading(true);

    let imageBase64 = null;
    if (imageFile) {
      try {
        const reader = new FileReader();
        await new Promise((resolve, reject) => {
          reader.onload = (e) => {
            imageBase64 = e.target.result;
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
      } catch (e) {
        console.error("Image read error:", e);
        showTemporaryMessage("Error reading image file.", true);
        setIsLoading(false);
        return;
      }
    }

    // Generate a unique ID for this card (to mock a shareable link)
    const uniqueId = crypto.randomUUID(); 

    const newCelebration = {
      recipientName, senderName, dateTime, message, spotifyLink, imageBase64, id: uniqueId,
    };
    
    // Save the card data to localStorage using the unique ID
    localStorage.setItem(`card-${uniqueId}`, JSON.stringify(newCelebration));

    showTemporaryMessage("✅ Celebration created! Redirecting...", false);
    
    // Pass the data up to the parent App component and trigger the view change
    onCreate(newCelebration); 
    
    setIsLoading(false);
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
      <ParticleBackground />
      <div className="relative z-10 p-8 rounded-2xl shadow-2xl max-w-lg w-full bg-white/95 border-t-4 border-[#C49A6E]">
        <h1 className="text-4xl font-serif font-bold text-[#C49A6E] mb-6 tracking-wider">
          🥂 Create Your Elegant Wish 🍾
        </h1>

        <form onSubmit={handleCreateCelebration}>
          <input
            type="text" placeholder="Recipient Name"
            value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
            className={inputStyle} required
          />
          <input
            type="text" placeholder="Sender Name (Your Name)"
            value={senderName} onChange={(e) => setSenderName(e.target.value)}
            className={inputStyle} required
          />
          <label className="block text-left mb-2 text-gray-600 font-medium text-sm">Celebration Date with Time:</label>
          <input
            type="datetime-local" value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className={inputStyle} required
          />
          <textarea
            placeholder="Personal Message (Max 300 chars)"
            value={message} onChange={(e) => setMessage(e.target.value.substring(0, 300))}
            className={`${inputStyle} h-24 resize-none`}
          />
          <input
            type="text" placeholder="Spotify Song/Playlist Link (Optional)"
            value={spotifyLink} onChange={(e) => setSpotifyLink(e.target.value)}
            className={inputStyle}
          />
          <label className="block text-left mb-2 text-gray-600 font-medium text-sm">Upload Image (Optional, max 2MB):</label>
          <input
            type="file" accept="image/*"
            onChange={handleImageChange}
            className={inputStyle}
          />

          <button
            type="submit"
            disabled={isLoading}
            className={`${goldButton} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Processing...' : 'Generate Elegant Celebration'}
          </button>
        </form>
      </div>
    </div>
  );
};


// ====================================================================
// --- 4. CELEBRATION VIEW (Display & Countdown) ---
// ====================================================================

const CelebrationView = ({ celebrationData, onGoHome }) => {
  // Audio state and refs removed
  const [countdown, setCountdown] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);

  // --- Countdown & Confetti Effect ---
  useEffect(() => {
    if (!celebrationData.dateTime) return;
    const targetDate = new Date(celebrationData.dateTime).getTime();
    
    const calculateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      const isCelebrationTime = distance < 0;

      if (isCelebrationTime) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        
        // Trigger confetti burst when time passes, but only once
        if (!showConfetti) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000); 
        }
        return;
      }

      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
        isPast: false,
      });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [celebrationData, showConfetti]);
  
  
  // Audio playback and unlocking logic removed
  
  // Shareable Link feature: Copies a mock URL with the card ID
  const handleShare = () => {
    const uniqueId = celebrationData.id;
    const mockUrl = `${window.location.href.split('?')[0]}?cardId=${uniqueId}`; 
    
    try {
        const tempInput = document.createElement('input');
        tempInput.value = mockUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        showTemporaryMessage(`🔗 Shareable Link Copied! (Recipient needs this app's storage)`, false);
        
    } catch (err) {
        showTemporaryMessage("Copy failed. Browser blocked clipboard access.", true);
    }
  };

  // Helper to extract Spotify embed URL from a user-provided link
  const getSpotifyEmbedUrl = (link) => {
    if (!link) return null;
    try {
      const url = new URL(link);
      const parts = url.pathname.split('/');
      const type = parts[1];
      const id = parts[2];
      if (type && id) {
        // Ensures no autoplay
        return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0&autoplay=0`; 
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
    return null;
  };

  const { recipientName, senderName, dateTime, message, spotifyLink, imageBase64 } = celebrationData;
  const spotifyEmbedUrl = getSpotifyEmbedUrl(spotifyLink);
  const isCelebrationTime = countdown.isPast;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-white text-center p-6 overflow-hidden">
      
      <ParticleBackground />
      {isCelebrationTime && showConfetti && <ConfettiEffect />}
      
      <div 
        className="relative z-10 p-10 rounded-3xl shadow-2xl max-w-2xl w-full bg-white/95 border-4 border-[#C49A6E]"
      >
        <h1 className="text-5xl sm:text-6xl font-serif font-extrabold text-[#C49A6E] mb-4 tracking-tight">
          {isCelebrationTime ? `HAPPY BIRTHDAY ${recipientName.toUpperCase()}!` : 'COUNTDOWN STARTED!'}
        </h1>
        
        <p className="text-xl sm:text-3xl font-light text-gray-800 mb-6">Dear {recipientName},</p>

        {/* Countdown Timer Display */}
        <div className="mb-8 p-4 bg-gray-50/50 rounded-xl shadow-inner border border-gray-200">
          {!isCelebrationTime && (
            <p className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Counting down to: {formatDateTime(dateTime)}</p>
          )}
          <div className="flex justify-center space-x-2 sm:space-x-4 text-center">
            {['Days', 'Hours', 'Minutes', 'Seconds'].map((unit) => (
              <div key={unit} className="p-2 w-1/4 rounded-lg bg-white shadow-md">
                <p className="text-2xl sm:text-4xl font-mono font-bold text-[#C49A6E]">
                  {countdown[unit.toLowerCase()] !== undefined ? String(countdown[unit.toLowerCase()]).padStart(2, '0') : '--'}
                </p>
                <p className="text-xs text-gray-600 uppercase mt-1">{unit}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* --- PERSONALIZED CONTENT (Only appears on celebration time) --- */}
        {isCelebrationTime && (
          <div className='mt-8 pt-4 border-t border-gray-200'>
            {imageBase64 && (
              <img
                src={imageBase64} alt="Uploaded Celebration"
                className="w-full max-h-80 object-cover rounded-xl mb-6 shadow-lg border-2 border-gray-200 mx-auto"
              />
            )}
            
            <p className="text-lg text-gray-700 whitespace-pre-wrap italic mb-6 border-b pb-4">
              "{message || "A personal message goes here..."}"
            </p>
            
            <p className="text-right text-gray-800 font-semibold mb-8">
              — With love, {senderName}
            </p>

            {spotifyEmbedUrl && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Special Song for You:</h3>
                <iframe 
                  title="Spotify Embed" src={spotifyEmbedUrl} 
                  width="100%" height="80" frameBorder="0" allowFullScreen="" 
                  allow="encrypted-media; fullscreen; picture-in-picture"
                  className='rounded-xl shadow-lg'
                ></iframe>
              </div>
            )}
          </div>
        )}
        {/* -------------------------------------------------------- */}
        
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          
          <button 
            onClick={handleShare}
            className="bg-[#38A169] hover:bg-[#2F855A] text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg"
          >
            🔗 Shareable Link
          </button>
          
          <button 
            onClick={onGoHome} 
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-full transition-all font-semibold text-sm"
          >
            🏠 Create New
          </button>
        </div>
      </div>
      <p className='mt-6 text-sm text-gray-500 z-10'>Site Made by <a href={LINKEDIN_URL} target='_blank' rel='noreferrer' className='underline hover:text-[#C49A6E] transition-colors'>Furqan</a></p>
    </div>
  );
};


// ====================================================================
// --- 5. MAIN APP COMPONENT (State, Navigation, and Persistence) ---
// ====================================================================

export default function App() {
  const [celebrationData, setCelebrationData] = useState(null);
  const [currentPage, setCurrentPage] = useState('loading'); // Start in loading state

  // --- Initial Load Logic (Handles Shareable Links) ---
  useEffect(() => {
    // Check if the URL contains a 'cardId' query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const cardId = urlParams.get('cardId');

    if (cardId) {
        // Try to load the data from localStorage using the ID
        const storedData = localStorage.getItem(`card-${cardId}`);
        if (storedData) {
            try {
                const data = JSON.parse(storedData);
                setCelebrationData(data);
                setCurrentPage('celebration');
                return;
            } catch (e) {
                console.error("Failed to parse stored card data:", e);
                // Fall through to home if parsing fails
            }
        }
    }
    // If no cardId or no data found, go to 'home'
    setCurrentPage('home');
  }, []); // Run only on initial mount

  // Function called by HomeView to switch to CelebrationView
  const handleCreate = useCallback((data) => {
    setCelebrationData(data);
    setCurrentPage('celebration');
    // Use relative path modification to avoid the SecurityError when changing the history state.
    const newUrl = `${window.location.pathname}?cardId=${data.id}`;
    window.history.pushState(null, '', newUrl);
  }, []);

  // Function called by CelebrationView to return home
  const handleGoHome = useCallback(() => {
    setCelebrationData(null);
    setCurrentPage('home');
    // Use relative path modification to avoid the SecurityError when changing the history state.
    window.history.pushState(null, '', window.location.pathname);
  }, []);

  if (currentPage === 'loading') {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-xl font-semibold text-gray-600">Loading App...</div>
        </div>
    );
  }
  
  // Simple In-Memory Router/View Switcher
  if (currentPage === 'celebration' && celebrationData) {
    return (
      <CelebrationView 
        celebrationData={celebrationData} 
        onGoHome={handleGoHome} 
      />
    );
  }
  
  return <HomeView onCreate={handleCreate} />;
}
