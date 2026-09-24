import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme';

type ShowToast = (message: string) => void;

const ToastContext = createContext<ShowToast>(() => {});

/** Lightweight, non-blocking notices (e.g. "Nothing to replay yet"). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<ShowToast>((next) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(next);
    timer.current = setTimeout(() => setMessage(null), 2400);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message ? (
        <View
          pointerEvents="none"
          style={[styles.wrap, { bottom: insets.bottom + spacing.xl }]}
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.toast} accessibilityRole="alert">
            {message}
          </Text>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center' },
  toast: {
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    overflow: 'hidden',
    textAlign: 'center',
  },
});
