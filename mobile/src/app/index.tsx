
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const modules = [
  {
    number: '01',
    title: 'Catálogo',
    description: 'Explorá los productos disponibles.',
  },
  {
    number: '02',
    title: 'Mis pedidos',
    description: 'Consultá tus pedidos y sus estados.',
  },
  {
    number: '03',
    title: 'Donaciones',
    description: 'Conocé las opciones para colaborar.',
  },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>E</Text>
          </View>
          <Text style={styles.brand}>EduKit</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>
            EDUCACIÓN Y COMUNIDAD
          </Text>
          <Text style={styles.title}>
            Bienvenido a EduKit
          </Text>
          <Text style={styles.subtitle}>
            Un espacio para explorar productos,
            gestionar pedidos y conocer oportunidades
            de donación.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          Explorá EduKit
        </Text>

        {modules.map((item) => (
          <View key={item.number} style={styles.card}>
            <View style={styles.numberBox}>
              <Text style={styles.number}>
                {item.number}
              </Text>
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>
                {item.title}
              </Text>
              <Text style={styles.cardDescription}>
                {item.description}
              </Text>
            </View>
          </View>
        ))}

        <Text style={styles.footer}>
          EduKit · Proyecto de Aplicaciones Móviles
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  container: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 36,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#2457C5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  brand: {
    fontSize: 24,
    fontWeight: '700',
    color: '#183153',
  },
  hero: {
    backgroundColor: '#E5EDFF',
    padding: 24,
    borderRadius: 20,
    marginBottom: 30,
  },
  eyebrow: {
    color: '#2457C5',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  title: {
    color: '#183153',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    color: '#42536B',
    fontSize: 16,
    lineHeight: 24,
  },
  sectionTitle: {
    color: '#183153',
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E1E8F0',
    gap: 16,
  },
  numberBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    color: '#2457C5',
    fontSize: 15,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#183153',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 5,
  },
  cardDescription: {
    color: '#5B687A',
    fontSize: 14,
    lineHeight: 21,
  },
  footer: {
    textAlign: 'center',
    color: '#6B7788',
    fontSize: 12,
    marginTop: 28,
  },
});
