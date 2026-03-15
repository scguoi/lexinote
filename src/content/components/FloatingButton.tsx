import React from 'react';

interface FloatingButtonProps {
  position: { x: number; y: number; width: number; height: number };
  onClick: () => void;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({ position, onClick }) => {
  const buttonSize = 32;
  const offset = 8;

  // Four-quadrant positioning
  const viewportWidth = window.innerWidth;

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
        borderRadius: '8px',
        border: 'none',
        background: 'linear-gradient(135deg, #6B7FFF, #8B5CF6)',
        boxShadow: '0 2px 10px rgba(107, 127, 255, 0.4)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        color: 'white',
        zIndex: 2147483647,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        outline: 'none',
        padding: 0,
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLElement).style.transform = 'scale(1.1)';
        (e.target as HTMLElement).style.boxShadow = '0 4px 14px rgba(107, 127, 255, 0.5)';
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLElement).style.transform = 'scale(1)';
        (e.target as HTMLElement).style.boxShadow = '0 2px 10px rgba(107, 127, 255, 0.4)';
      }}
      aria-label="Look up word"
    >
      📖
    </button>
  );
};
