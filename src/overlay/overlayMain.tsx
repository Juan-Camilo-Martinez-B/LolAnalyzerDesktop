import React from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';

const OverlayPlaceholder: React.FC = () => {
  return (
    <div className="overlay-container p-3 text-xs text-hextech-gold">
      <div className="font-bold tracking-wider">LOLANALYZER OVERLAY READY</div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('overlay-root')!).render(
  <React.StrictMode>
    <OverlayPlaceholder />
  </React.StrictMode>
);
