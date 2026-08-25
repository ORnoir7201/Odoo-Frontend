import { useEffect, useRef } from 'react';

/**
 * Renvoie une "ref" à attacher au conteneur du menu déroulant.
 * Dès qu'un clic a lieu EN DEHORS de ce conteneur, `onOutsideClick` est
 * appelé — pratique pour fermer un menu automatiquement.
 */
export default function useClickOutside(onOutsideClick) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onOutsideClick();
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onOutsideClick]);

  return ref;
}