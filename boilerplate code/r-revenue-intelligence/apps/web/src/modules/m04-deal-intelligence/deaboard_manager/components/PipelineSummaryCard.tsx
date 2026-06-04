import { ArrowUp } from 'lucide-react';
import type { PipelineSummary } from '../types/deal.types';

interface PipelineSummaryCardProps extends PipelineSummary {
  isActive?: boolean;
  onClick?: () => void;
}

export default function PipelineSummaryCard({
  label,
  amount,
  count,
  change,
  isActive,
  onClick,
}: PipelineSummaryCardProps) {
  // Color scheme based on label to match Figma design
  const getColors = () => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('pipeline') || lowerLabel.includes('open')) {
      return {
        bg: isActive ? 'bg-[#E8ECF1]' : 'bg-[#F8F9FB]',
        border: 'border-[#D1D9E0]',
        label: 'text-[#5A6B7A]',
        amount: 'text-[#1E3A5F]',
        count: 'text-[#6B7A8A]',
        arrow: 'text-[#F59E0B]',
        change: 'text-[#F59E0B]',
      };
    }
    if (lowerLabel.includes('best')) {
      return {
        bg: isActive ? 'bg-[#E6E8F5]' : 'bg-[#F5F6FA]',
        border: 'border-[#C8CCE5]',
        label: 'text-[#6B5BA8]',
        amount: 'text-[#4A3F8C]',
        count: 'text-[#7A6F9C]',
        arrow: 'text-[#F59E0B]',
        change: 'text-[#F59E0B]',
      };
    }
    if (lowerLabel.includes('commit')) {
      return {
        bg: isActive ? 'bg-[#E0EBFF]' : 'bg-[#F0F5FF]',
        border: 'border-[#B8D4FF]',
        label: 'text-[#4A6FA5]',
        amount: 'text-[#2E4A7C]',
        count: 'text-[#5A7FA8]',
        arrow: 'text-[#F59E0B]',
        change: 'text-[#F59E0B]',
      };
    }
    if (lowerLabel.includes('closed') || lowerLabel.includes('won') || lowerLabel.includes('lost')) {
      return {
        bg: isActive ? 'bg-[#EBE5F5]' : 'bg-[#F5F3FA]',
        border: 'border-[#D4CCE8]',
        label: 'text-[#5A4A8A]',
        amount: 'text-[#3D2F6C]',
        count: 'text-[#7A6B9C]',
        arrow: 'text-[#F59E0B]',
        change: 'text-[#F59E0B]',
      };
    }
    // Default
    return {
      bg: isActive ? 'bg-[#E8ECF1]' : 'bg-[#F8F9FB]',
      border: 'border-[#D1D9E0]',
      label: 'text-[#5A6B7A]',
      amount: 'text-[#1E3A5F]',
      count: 'text-[#6B7A8A]',
      arrow: 'text-[#F59E0B]',
      change: 'text-[#F59E0B]',
    };
  };

  const colors = getColors();

  return (
    <button
      onClick={onClick}
      className={`text-left rounded-lg p-4 flex-1 min-w-[180px] transition-all cursor-pointer border ${colors.bg} ${colors.border} hover:shadow-md`}
    >
      <p className={`text-xs font-medium uppercase tracking-wider mb-2 ${colors.label}`}>
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold ${colors.amount}`}>{amount}</span>
        <span className={`text-sm ${colors.count}`}>({count})</span>
      </div>
      <div className="flex items-center gap-1 mt-1">
        <ArrowUp size={12} className={colors.arrow} />
        <span className={`text-xs font-medium ${colors.change}`}>{change}</span>
      </div>
    </button>
  );
}
