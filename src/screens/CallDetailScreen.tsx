import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, ALUNO_ID } from '../firebase/config';

type Chamado = {
  description: string;
  photoUri?: string | null;
  address?: string | null;
  status: string;
};

export default function CallDetailScreen({ route }: any) {
  const { chamadoId } = route.params;
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function carregarChamado() {
      try {
        setLoading(true);
        // Busca o documento no Firestore no caminho específico do aluno
        const docRef = doc(db, 'alunos', ALUNO_ID, 'chamados', chamadoId);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          setChamado(snapshot.data() as Chamado);
        } else {
          Alert.alert('Erro', 'Chamado não encontrado.');
        }
      } catch (error) {
        console.error('Erro ao buscar chamado:', error);
        Alert.alert('Erro', 'Não foi possível carregar os detalhes do chamado.');
      } finally {
        setLoading(false);
      }
    }

    carregarChamado();
  }, [chamadoId]);

  async function mudarStatus(novoStatus: string) {
    try {
      setUpdating(true);
      const docRef = doc(db, 'alunos', ALUNO_ID, 'chamados', chamadoId);

      // Atualiza apenas o campo "status" no Firestore
      await updateDoc(docRef, { status: novoStatus });

      // Atualiza o estado local para refletir imediatamente na UI
      setChamado((prev) => (prev ? { ...prev, status: novoStatus } : prev));

      Alert.alert('Sucesso', 'Status atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      Alert.alert('Erro', 'Não foi possível alterar o status do chamado.');
    } finally {
      setUpdating(false);
    }
  }

  // Função auxiliar para estilizar a tag de status de acordo com o valor
  function getStatusStyle(status: string) {
    switch (status) {
      case 'atendendo':
        return { bg: '#FFF3CD', text: '#856404', label: 'Em Atendimento' };
      case 'concluido':
        return { bg: '#D4EDDA', text: '#155724', label: 'Concluído' };
      case 'cancelado':
        return { bg: '#F8D7DA', text: '#721C24', label: 'Cancelado' };
      case 'aberto':
      default:
        return { bg: '#CCE5FF', text: '#004085', label: 'Aberto' };
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Carregando chamado...</Text>
      </View>
    );
  }

  if (!chamado) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Não foi possível carregar os dados.</Text>
      </View>
    );
  }

  const statusInfo = getStatusStyle(chamado.status);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {/* Exibição da foto (se houver) */}
      {chamado.photoUri ? (
        <Image source={{ uri: chamado.photoUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.noImageContainer}>
          <Text style={styles.noImageText}>Sem foto anexada</Text>
        </View>
      )}

      {/* Cartão de Detalhes */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>Status Atual:</Text>
          <View style={[styles.badge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.badgeText, { color: statusInfo.text }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Descrição</Text>
        <Text style={styles.description}>{chamado.description}</Text>

        {chamado.address ? (
          <>
            <Text style={styles.sectionTitle}>Endereço</Text>
            <Text style={styles.address}>{chamado.address}</Text>
          </>
        ) : null}
      </View>

      {/* Ações de Mudança de Status */}
      <View style={styles.actionsContainer}>
        <Text style={styles.actionsTitle}>Ações</Text>

        {updating ? (
          <ActivityIndicator size="small" color="#0066CC" style={{ marginVertical: 15 }} />
        ) : (
          <>
            {/* Status: Aberto -> Iniciar Atendimento */}
            {chamado.status === 'aberto' && (
              <TouchableOpacity
                style={[styles.button, styles.btnPrimary]}
                onPress={() => mudarStatus('atendendo')}
              >
                <Text style={styles.buttonText}>Iniciar Atendimento</Text>
              </TouchableOpacity>
            )}

            {/* Status: Atendendo -> Concluir Atendimento */}
            {chamado.status === 'atendendo' && (
              <TouchableOpacity
                style={[styles.button, styles.btnSuccess]}
                onPress={() => mudarStatus('concluido')}
              >
                <Text style={styles.buttonText}>Concluir Atendimento</Text>
              </TouchableOpacity>
            )}

            {/* Cancelar Chamado (disponível quando o chamado não for finalizado) */}
            {chamado.status !== 'concluido' && chamado.status !== 'cancelado' && (
              <TouchableOpacity
                style={[styles.button, styles.btnDanger]}
                onPress={() => mudarStatus('cancelado')}
              >
                <Text style={styles.buttonText}>Cancelar Chamado</Text>
              </TouchableOpacity>
            )}

            {/* Mensagem caso o chamado já esteja num estado final */}
            {(chamado.status === 'concluido' || chamado.status === 'cancelado') && (
              <Text style={styles.finishedText}>
                Este chamado já foi {chamado.status === 'concluido' ? 'concluído' : 'cancelado'} e não aceita mais alterações.
              </Text>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#D9534F',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 15,
  },
  noImageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  noImageText: {
    color: '#777',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#888',
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  address: {
    fontSize: 15,
    color: '#555',
  },
  actionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnPrimary: {
    backgroundColor: '#0066CC',
  },
  btnSuccess: {
    backgroundColor: '#28A745',
  },
  btnDanger: {
    backgroundColor: '#DC3545',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  finishedText: {
    textAlign: 'center',
    color: '#777',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
});