'use client';

import { Brain, Check, Edit3, X } from 'lucide-react';
import { useState } from 'react';

import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/ai-categorization';

interface CategoryEditorProps {
  currentCategory: string;
  aiCategory?: string | undefined;
  aiConfidence?: number | undefined;
  transactionType: 'income' | 'expense';
  onCategoryChange: (newCategory: string) => void;
  disabled?: boolean;
}

export function CategoryEditor({
  currentCategory,
  aiCategory,
  aiConfidence,
  transactionType,
  onCategoryChange,
  disabled = false,
}: CategoryEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);

  const categories =
    transactionType === 'income'
      ? Object.values(INCOME_CATEGORIES)
      : Object.values(EXPENSE_CATEGORIES);

  const handleSave = () => {
    onCategoryChange(selectedCategory);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSelectedCategory(currentCategory);
    setIsEditing(false);
  };

  const useAICategory = () => {
    if (aiCategory) {
      setSelectedCategory(aiCategory);
      onCategoryChange(aiCategory);
    }
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900">{currentCategory}</span>

        {/* AI Confidence Badge */}
        {aiCategory && aiConfidence && (
          <div className="flex items-center gap-1">
            <Brain className="h-3 w-3 text-purple-500" />
            <span className="text-xs text-purple-600 font-medium" title="AI Confidence Score">
              {aiConfidence}%
            </span>
          </div>
        )}

        {/* Edit Button */}
        {!disabled && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Edit category"
          >
            <Edit3 className="h-3 w-3" />
          </button>
        )}

        {/* Use AI Category Button */}
        {aiCategory && aiCategory !== currentCategory && !disabled && (
          <button
            onClick={useAICategory}
            className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
            title={`Use AI suggestion: ${aiCategory} (${aiConfidence}% confidence)`}
          >
            Use AI
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedCategory}
        onChange={e => setSelectedCategory(e.target.value)}
        className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        autoFocus
      >
        {categories.map(category => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1">
        <button
          onClick={handleSave}
          className="p-1 text-green-600 hover:text-green-700 transition-colors"
          title="Save"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 text-red-600 hover:text-red-700 transition-colors"
          title="Cancel"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
