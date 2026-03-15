import React from 'react';

interface FloatingButtonProps {
  position: { x: number; y: number; width: number; height: number };
  onClick: () => void;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({ position, onClick }) => {
  const buttonSize = 36;
  const offset = 10;

  // Four-quadrant positioning
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let top = position.y - buttonSize - offset + window.scrollY;
  let left = position.x - buttonSize / 2 + window.scrollX;

  // Flip below if too close to top
  if (position.y < buttonSize + offset + 50) {
    top = position.y + position.height + offset + window.scrollY;
  }

  // Shift if too close to edges
  if (position.x + buttonSize / 2 > viewportWidth - 50) {
    left = viewportWidth - buttonSize - 10 + window.scrollX;
  }
  if (position.x - buttonSize / 2 < 50) {
    left = 10 + window.scrollX;
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        width: `${buttonSize}px`,
        height: `${buttonSize}px`,
        borderRadius: '50%',
        border: '2px solid transparent',
        background: 'white',
        backgroundClip: 'padding-box',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        zIndex: 2147483647,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        outline: 'none',
        padding: 0,
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLElement).style.transform = 'scale(1.05)';
        (e.target as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLElement).style.transform = 'scale(1)';
        (e.target as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
      aria-label="Look up word"
    >
      ✨
    </button>
  );
};
