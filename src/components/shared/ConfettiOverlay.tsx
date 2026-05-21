/**
 * Confetti celebration overlay (SPEC §6.5 — first-analysis celebration).
 * No-op when Reduce Motion is enabled.
 */
import { StyleSheet, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';

export interface ConfettiOverlayProps {
  active: boolean;
}

const CONFETTI_COLORS = ['#2563EB', '#00C896', '#E84A30', '#F59E0B', '#22C55E'];

export function ConfettiOverlay({ active }: ConfettiOverlayProps) {
  const reduced = useReducedMotion();
  if (!active || reduced) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <ConfettiCannon
        count={140}
        origin={{ x: -20, y: 0 }}
        fadeOut
        autoStart
        explosionSpeed={360}
        fallSpeed={2800}
        colors={CONFETTI_COLORS}
      />
    </View>
  );
}
