/**
 * Bottom tab bar (SPEC §3.2). 4 persistent tabs; the Wallet tab shows the
 * credit balance as a numeric badge. The History tab shows a badge for
 * unread (not-yet-viewed) analyses.
 */
import { Tabs } from 'expo-router';
import { Clock, Home, User, Wallet } from 'lucide-react-native';
import { colors } from '@/src/theme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useCreditStore, useAnalysisStore } from '@/src/store';

export default function TabsLayout() {
  const { t } = useTranslation();
  const balance = useCreditStore((s) => s.balance);
  const unread = useAnalysisStore((s) => s.unreadCount);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.slate,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: '#CBD5E1',
          borderTopWidth: 1,
          height: 83,
          paddingTop: 8,
          paddingBottom: 24,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: t('nav.wallet'),
          tabBarBadge: balance > 0 ? balance : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.orange, fontSize: 10 },
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('nav.history'),
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.orange, fontSize: 10 },
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
