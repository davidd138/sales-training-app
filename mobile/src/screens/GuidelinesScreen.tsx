import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import {
  useQuery,
  useMutation,
  GET_GUIDELINES,
  CREATE_GUIDELINE,
  UPDATE_GUIDELINE,
} from '../hooks/useGraphQL';

type Props = { navigation: any };

export default function GuidelinesScreen({ navigation }: Props) {
  const { data, loading, execute: loadGuidelines } = useQuery(GET_GUIDELINES);
  const createGuideline = useMutation(CREATE_GUIDELINE);
  const updateGuideline = useMutation(UPDATE_GUIDELINE);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadGuidelines);
    return unsubscribe;
  }, [navigation]);

  const guidelines = data || [];

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;
    await createGuideline.execute({ input: { title: title.trim(), content: content.trim() } });
    setTitle('');
    setContent('');
    setShowForm(false);
    loadGuidelines();
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await updateGuideline.execute({ input: { id, isActive: !isActive } });
    loadGuidelines();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Guidelines de venta</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm(!showForm)}
        >
          <Text style={styles.addButtonText}>{showForm ? 'Cancelar' : '+ Añadir'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Título"
            placeholderTextColor="#64748B"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Contenido de la guideline..."
            placeholderTextColor="#64748B"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleCreate}
            disabled={createGuideline.loading}
          >
            {createGuideline.loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} />
      ) : guidelines.length === 0 ? (
        <Text style={styles.empty}>No hay guidelines todavía</Text>
      ) : (
        guidelines.map((g: any) => (
          <View key={g.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{g.title}</Text>
              <Switch
                value={g.isActive}
                onValueChange={() => handleToggle(g.id, g.isActive)}
                trackColor={{ false: '#475569', true: '#3B82F6' }}
              />
            </View>
            <Text style={styles.cardContent}>{g.content}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  addButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  addButtonText: { color: '#60A5FA', fontWeight: '600' },
  form: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  empty: { color: '#94A3B8', textAlign: 'center', marginTop: 40, fontSize: 16 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#fff', flex: 1 },
  cardContent: { color: '#CBD5E1', fontSize: 14, lineHeight: 20 },
});
