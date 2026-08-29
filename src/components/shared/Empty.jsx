import { Inbox } from 'lucide-react';

export default function Empty({ text, small }) {
  return (
    <div className={`empty ${small ? 'small' : ''}`}>
      <Inbox size={small ? 16 : 20} />
      <span>{text}</span>
    </div>
  );
}
