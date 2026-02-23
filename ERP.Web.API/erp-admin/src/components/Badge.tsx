interface Props {
  children: React.ReactNode;
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'gray' | 'indigo';
}

const colors = {
  green: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  red: 'bg-red-500/10 text-red-400 ring-red-500/20',
  blue: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  yellow: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  gray: 'bg-gray-500/10 text-gray-400 ring-gray-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/20',
};

export default function Badge({ children, color = 'gray' }: Props) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium ring-1 ${colors[color]}`}>
      {children}
    </span>
  );
}
