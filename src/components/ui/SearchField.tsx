/**
 * Search field (SPEC §11.2). Light background, search icon, clear button.
 */
import { Pressable, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { cn } from '@/src/lib/cn';
import { colors } from '@/src/theme';

export interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchField({
  value,
  onChangeText,
  placeholder,
  className,
  autoFocus,
}: SearchFieldProps) {
  return (
    <View
      className={cn(
        'h-10 flex-row items-center rounded-[10px] bg-light px-3',
        className,
      )}
    >
      <Search size={18} color={colors.slate} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        autoFocus={autoFocus}
        className="ml-2 flex-1 font-body text-[14px] text-ink"
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
        >
          <X size={16} color={colors.slate} />
        </Pressable>
      ) : null}
    </View>
  );
}
