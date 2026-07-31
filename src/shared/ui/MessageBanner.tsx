import React, { useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AnimatePresence, MotiView } from 'moti';
import { AppText } from './AppText';
import { typography } from '../theme/typography';

export type MessageType = 'error' | 'info' | 'success';

interface MessageBannerProps {
  message: string | null;
  type?: MessageType;
  onClose: () => void;
  autoHideMs?: number;
  style?: StyleProp<ViewStyle>;
}

// cores translúcidas (alpha ~0.9) pra dar o efeito de vidro fosco
const PALETTE: Record<MessageType, { background: string; text: string }> = {
  error: { background: 'rgba(253, 235, 234, 0.85)', text: '#C0392B' },
  info: { background: 'rgba(234, 242, 253, 0.85)', text: '#2E6DA4' },
  success: { background: 'rgba(233, 247, 239, 0.85)', text: '#1E8449' },
};

export function MessageBanner({ message, type = 'error', onClose, autoHideMs = 4000, style }: MessageBannerProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (message) {
      timerRef.current = setTimeout(onClose, autoHideMs);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [message, autoHideMs, onClose]);

  const cores = PALETTE[type];

  return (
    // placeholder reserva o espaço (evita "pulo" de layout quando usado dentro do fluxo normal, ex: LoginScreen)
    <View style={[styles.placeholder, style]} pointerEvents="box-none">
      <AnimatePresence>
        {message && (
          <MotiView
            key="banner"
            from={{ opacity: 0, translateY: -16 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -16 }}
            transition={{ type: 'timing', duration: 250 }}
            style={[styles.container, { backgroundColor: cores.background }]}
          >
            <AppText style={[styles.text, { color: cores.text }]}>{message}</AppText>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={16} color={cores.text} />
            </Pressable>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    minHeight: 56,
    marginTop: 12,
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    minHeight: 56,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    flex: 1,
    fontFamily: typography.regular,
    fontSize: 13,
    marginRight: 8,
  },
});