import { CheckCircle2 } from 'lucide-react';

export default function Empty({ text, small }) {
  return (
    <div className={`empty ${small ? 'small' : ''}`}>
      <CheckCircle2 size={small ? 16 : 20} />
      <span>{text}</span>
    </div>
  );
}
