import { useRef } from 'react';

export default function OTPInput({ value, onChange, length = 6 }) {
  const inputRefs = useRef([]);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  const focusInput = (index) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  return (
    <div className="grid grid-cols-6 gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          value={digit.trim()}
          inputMode="numeric"
          maxLength={1}
          onFocus={(event) => event.target.select()}
          onChange={(event) => {
            const entered = event.target.value.replace(/\D/g, '');
            const next = value.padEnd(length, ' ').slice(0, length).split('');

            if (entered.length > 1) {
              entered.slice(0, length - index).split('').forEach((char, offset) => {
                next[index + offset] = char;
              });
              onChange(next.join('').replace(/\s/g, '').slice(0, length));
              focusInput(Math.min(index + entered.length, length - 1));
              return;
            }

            next[index] = entered.slice(-1);
            onChange(next.join('').slice(0, length));
            if (entered && index < length - 1) focusInput(index + 1);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && !digits[index].trim() && index > 0) {
              event.preventDefault();
              const next = value.padEnd(length, ' ').slice(0, length).split('');
              next[index - 1] = ' ';
              onChange(next.join('').replace(/\s/g, '').slice(0, length));
              focusInput(index - 1);
            }
            if (event.key === 'ArrowLeft' && index > 0) {
              event.preventDefault();
              focusInput(index - 1);
            }
            if (event.key === 'ArrowRight' && index < length - 1) {
              event.preventDefault();
              focusInput(index + 1);
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
            if (!pasted) return;
            onChange(pasted);
            focusInput(Math.min(pasted.length, length - 1));
          }}
          className="h-12 rounded-lg border border-line bg-black/30 text-center text-lg font-semibold outline-none focus:border-acid"
        />
      ))}
    </div>
  );
}
