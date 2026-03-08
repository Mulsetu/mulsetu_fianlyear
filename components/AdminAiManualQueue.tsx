import { Colors } from '@/constants/theme';
import { supabase } from '@/utils/supabaseClient';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type QueueStatus = 'pending' | 'completed' | 'failed';

interface ManualQueueItem {
  id: string;
  crop: string;
  mandi: string;
  horizon: '1D' | '7D';
  prompt: string;
  status: QueueStatus;
  admin_note: string | null;
  created_at: string;
}

export default function AdminAiManualQueue() {
  const [items, setItems] = useState<ManualQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [responseInput, setResponseInput] = useState<Record<string, string>>({});

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_prediction_manual_requests')
        .select('id, crop, mandi, horizon, prompt, status, admin_note, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      setItems((data ?? []) as ManualQueueItem[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
    const intervalId = setInterval(loadItems, 10000);
    return () => clearInterval(intervalId);
  }, [loadItems]);

  const markCompleted = async (item: ManualQueueItem) => {
    const raw = responseInput[item.id]?.trim();
    if (!raw) {
      Alert.alert('Missing JSON', 'Paste Gemini JSON output first.');
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      Alert.alert('Invalid JSON', 'Response is not valid JSON.');
      return;
    }

    const { error } = await supabase
      .from('ai_prediction_manual_requests')
      .update({
        status: 'completed',
        response_json: parsed,
        admin_note: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    if (error) {
      Alert.alert('Update failed', error.message);
      return;
    }

    Alert.alert('Success', 'Request marked as completed.');
    setResponseInput((prev) => ({ ...prev, [item.id]: '' }));
    loadItems();
  };

  const markFailed = async (item: ManualQueueItem) => {
    const note = responseInput[item.id]?.trim() || 'Manual processing failed';
    const { error } = await supabase
      .from('ai_prediction_manual_requests')
      .update({
        status: 'failed',
        admin_note: note,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    if (error) {
      Alert.alert('Update failed', error.message);
      return;
    }

    Alert.alert('Updated', 'Request marked as failed.');
    loadItems();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>AI Manual Queue (Demo)</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadItems}>
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="small" color={Colors.light.primary} />}

      {!loading && items.length === 0 && (
        <Text style={styles.emptyText}>No manual AI requests yet.</Text>
      )}

      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.metaText}>Request: {item.id}</Text>
          <Text style={styles.metaText}>Crop: {item.crop} | Mandi: {item.mandi} | Horizon: {item.horizon}</Text>
          <Text style={[styles.metaText, item.status === 'pending' ? styles.pending : item.status === 'completed' ? styles.completed : styles.failed]}>
            Status: {item.status}
          </Text>

          <Text style={styles.label}>Prompt (copy this to Gemini manually)</Text>
          <Text selectable style={styles.promptBox}>{item.prompt}</Text>

          <Text style={styles.label}>Paste Gemini JSON output</Text>
          <TextInput
            multiline
            numberOfLines={8}
            style={styles.input}
            placeholder="Paste model JSON output"
            placeholderTextColor={Colors.light.icon}
            value={responseInput[item.id] ?? ''}
            onChangeText={(value) => setResponseInput((prev) => ({ ...prev, [item.id]: value }))}
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.completeBtn} onPress={() => markCompleted(item)}>
              <Text style={styles.actionText}>Mark Completed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.failBtn} onPress={() => markFailed(item)}>
              <Text style={styles.actionText}>Mark Failed</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: 'System',
  },
  refreshBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshBtnText: {
    color: 'white',
    fontWeight: '600',
    fontFamily: 'System',
  },
  emptyText: {
    color: Colors.light.icon,
    fontFamily: 'System',
  },
  card: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: Colors.light.background,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.icon,
    fontFamily: 'System',
    marginBottom: 4,
  },
  pending: {
    color: '#b45309',
  },
  completed: {
    color: '#166534',
  },
  failed: {
    color: '#991b1b',
  },
  label: {
    marginTop: 8,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    fontFamily: 'System',
  },
  promptBox: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 10,
    backgroundColor: Colors.light.inputBackground,
    color: Colors.light.text,
    fontFamily: 'System',
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 10,
    backgroundColor: 'white',
    color: Colors.light.text,
    fontFamily: 'System',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  completeBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  failBtn: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontWeight: '700',
    fontFamily: 'System',
  },
});
