/**
 * Centre-anchored modal dialog + confirmation modal (SPEC §11.4).
 *
 * `Dialog` is the bare surface; `ConfirmationModal` is the standard
 * title/message/two-button modal used for confirmations and error states.
 */
import { Modal, Pressable, View } from 'react-native';
import { cn } from '@/src/lib/cn';
import { Button } from './Button';
import { Text } from './Text';

export interface DialogProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Tap-outside / hardware-back dismiss. */
  dismissable?: boolean;
  className?: string;
}

export function Dialog({
  visible,
  onClose,
  children,
  dismissable = true,
  className,
}: DialogProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissable ? onClose : undefined}
    >
      <View className="flex-1 items-center justify-center bg-black/40 px-8">
        {dismissable ? (
          <Pressable
            className="absolute inset-0"
            onPress={onClose}
            accessibilityLabel="Close"
          />
        ) : null}
        <View
          className={cn(
            'w-full max-w-[320px] rounded-2xl bg-white p-6',
            className,
          )}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

export interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Render the confirm button in destructive red. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Optional content above the title (icon / illustration). */
  header?: React.ReactNode;
  /** Disable tap-outside dismiss (e.g. blocking error modals). */
  dismissable?: boolean;
  confirmLoading?: boolean;
}

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
  header,
  dismissable = true,
  confirmLoading = false,
}: ConfirmationModalProps) {
  return (
    <Dialog visible={visible} onClose={onCancel} dismissable={dismissable}>
      {header ? <View className="mb-3 items-center">{header}</View> : null}
      <Text variant="h2" className="text-[18px] text-ink">
        {title}
      </Text>
      {message ? (
        <Text variant="body" className="mt-2 text-slate">
          {message}
        </Text>
      ) : null}
      <View className="mt-5 gap-2">
        <Button
          label={confirmLabel}
          variant={destructive ? 'destructive' : 'primary'}
          size="md"
          loading={confirmLoading}
          onPress={onConfirm}
        />
        {cancelLabel ? (
          <Button
            label={cancelLabel}
            variant="text"
            size="md"
            onPress={onCancel}
          />
        ) : null}
      </View>
    </Dialog>
  );
}
