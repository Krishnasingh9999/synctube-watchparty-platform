import { useRoomStore } from '../store/useRoomStore';

export default function EmojiReactions() {
  const { reactions } = useRoomStore();

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {reactions.map((reaction) => {
        // Distribute emojis horizontally across the right third of the screen using a deterministic hash of the ID to keep render pure
        const hash = reaction.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const randomXOffset = 60 + (hash % 31); // 60% to 90% from left
        
        return (
          <span
            key={reaction.id}
            className="absolute bottom-6 text-4xl animate-float-emoji select-none"
            style={{
              left: `${randomXOffset}%`,
              '--rotation': `${reaction.rotation}deg`,
            }}
          >
            {reaction.emoji}
          </span>
        );
      })}
    </div>
  );
}
