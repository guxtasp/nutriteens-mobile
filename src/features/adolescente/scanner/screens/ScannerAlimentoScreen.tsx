// src/features/adolescente/scanner/screens/ScannerAlimentoScreen.tsx
// Scanner de alimentos (prova de conceito): lê EAN-13/EAN-8 e abre o resultado.
//  - iPhone (iOS 16+): leitor nativo do sistema (VisionKit) via CameraView.launchScanner. É o mais confiável.
//  - Demais casos (ou se o leitor nativo falhar): preview da câmera na tela, com moldura e lanterna.
// Estados: carregando permissão, permissão negada, erro da câmera, lendo.
// Trava depois do 1º código válido; destrava ao voltar para a tela.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { BackButton } from '../../../../shared/ui/BackButton';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { normalizarCodigo } from '../utils/scanner';

type Nav = NativeStackNavigationProp<AdolescenteStackParamList, 'ScannerAlimento'>;
type Leitura = { data: string; type?: string };

// API do leitor nativo (iOS 16+). Tipada à mão para não depender da versão exata dos tipos do pacote.
const nativo = CameraView as unknown as {
  isModernBarcodeScannerAvailable?: boolean;
  launchScanner?: (opcoes: { barcodeTypes: string[]; isPinchToZoomEnabled?: boolean; isGuidanceEnabled?: boolean; isHighlightingEnabled?: boolean }) => Promise<void>;
  dismissScanner?: () => Promise<void>;
  onModernBarcodeScanned?: (ouvinte: (e: Leitura) => void) => { remove: () => void };
};
const TEM_LEITOR_NATIVO = Platform.OS === 'ios' && nativo.isModernBarcodeScannerAvailable === true;
const TIPOS = ['ean13', 'ean8'];

const AVISO_LEITURA = 'Não consegui ler esse código. Chegue mais perto, com boa luz.';
const AVISO_DIGITADO = 'Esse código parece incompleto. Confere os números?';
const DICA_PREVIEW = 'Centralize o código na moldura, a uns 15 a 20 cm.';

export default function ScannerAlimentoScreen() {
  const navigation = useNavigation<Nav>();
  const [permissao, pedirPermissao] = useCameraPermissions();
  const [focada, setFocada] = useState(false);       // só mantém a câmera ligada com a tela em foco
  const [erroCamera, setErroCamera] = useState(false);
  const [tentativa, setTentativa] = useState(0);     // muda a key da câmera para remontar
  const [usarPreview, setUsarPreview] = useState(!TEM_LEITOR_NATIVO);
  const [lanterna, setLanterna] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [digitando, setDigitando] = useState(false);
  const [digitado, setDigitado] = useState('');
  const [ultima, setUltima] = useState<string | null>(null); // diagnóstico (só em desenvolvimento)
  const trava = useRef(false);
  const jaAbriuNativo = useRef(false);
  const ultimoAviso = useRef(0);

  useFocusEffect(
    useCallback(() => {
      trava.current = false;
      jaAbriuNativo.current = false;
      setAviso(null);
      setFocada(true);
      return () => setFocada(false);
    }, []),
  );

  function abrirResultado(codigo: string) {
    if (trava.current) return;
    trava.current = true; // nenhuma leitura extra até a tela voltar a ficar em foco
    Haptics.selectionAsync().catch(() => {});
    navigation.navigate('ResultadoScanner', { codigo });
  }

  function aoLer({ data, type }: Leitura) {
    if (__DEV__) setUltima(`${type ?? '?'}: ${data}`);
    if (trava.current) return;
    const codigo = normalizarCodigo(data);
    if (!codigo) {
      const agora = Date.now();
      if (agora - ultimoAviso.current > 2500) { ultimoAviso.current = agora; setAviso(AVISO_LEITURA); }
      return;
    }
    abrirResultado(codigo);
  }

  // leitor nativo: ouve a leitura, fecha o leitor e só então navega (evita empurrar tela durante o fechamento)
  useEffect(() => {
    if (!TEM_LEITOR_NATIVO || !nativo.onModernBarcodeScanned) return;
    const sub = nativo.onModernBarcodeScanned(async (e) => {
      if (__DEV__) setUltima(`${e.type ?? '?'}: ${e.data}`);
      if (trava.current) return;
      const codigo = normalizarCodigo(e.data);
      if (!codigo) return; // o leitor continua aberto
      try { await nativo.dismissScanner?.(); } catch { /* já fechado */ }
      setTimeout(() => abrirResultado(codigo), 300);
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirLeitorNativo = useCallback(async () => {
    if (!nativo.launchScanner) { setUsarPreview(true); return; }
    try {
      await nativo.launchScanner({ barcodeTypes: TIPOS, isPinchToZoomEnabled: true, isGuidanceEnabled: true, isHighlightingEnabled: true });
    } catch (e) {
      console.error('Scanner: leitor nativo falhou (usando a câmera da tela):', e);
      setUsarPreview(true);
    }
  }, []);

  // abre o leitor nativo sozinho 1x a cada vez que a tela ganha foco
  useEffect(() => {
    if (!TEM_LEITOR_NATIVO || usarPreview || !focada || !permissao?.granted || jaAbriuNativo.current) return;
    jaAbriuNativo.current = true;
    const t = setTimeout(abrirLeitorNativo, 350);
    return () => clearTimeout(t);
  }, [focada, permissao?.granted, usarPreview, abrirLeitorNativo]);

  function enviarDigitado() {
    const codigo = normalizarCodigo(digitado);
    if (!codigo) { setAviso(AVISO_DIGITADO); return; }
    abrirResultado(codigo);
  }

  const carregando = permissao === null;
  const negada = permissao !== null && !permissao.granted;
  const modoNativo = TEM_LEITOR_NATIVO && !usarPreview;
  const podeLer = permissao?.granted === true && focada && !erroCamera && !modoNativo;

  return (
    <SafeAreaView style={styles.tela}>
      {podeLer && (
        <CameraView
          key={tentativa}
          style={StyleSheet.absoluteFill}
          facing="back"
          autofocus="on"
          enableTorch={lanterna}
          barcodeScannerSettings={{ barcodeTypes: TIPOS as any }}
          onBarcodeScanned={aoLer}
          onMountError={() => setErroCamera(true)}
        />
      )}

      <View style={styles.cabecalho}>
        <BackButton onPress={() => navigation.goBack()} />
        <AppText style={styles.titulo}>Scanner de alimentos</AppText>
        {podeLer ? (
          <Pressable onPress={() => setLanterna((v) => !v)} style={styles.lanterna} accessibilityRole="button" accessibilityLabel="Lanterna">
            <Ionicons name={lanterna ? 'flash' : 'flash-off'} size={20} color="#fff" />
          </Pressable>
        ) : <View style={{ width: 48 }} />}
      </View>

      {carregando && <View style={styles.centro} pointerEvents="box-none"><ActivityIndicator color={colors.primary} size="large" /></View>}

      {negada && (
        <View style={styles.centro} pointerEvents="box-none">
          <AppText style={styles.msgTitulo}>Precisamos da câmera</AppText>
          <AppText style={styles.msgTexto}>
            {permissao?.canAskAgain
              ? 'Para ler o código de barras, deixe o NutriTeens usar a câmera. A foto não é guardada.'
              : 'A câmera está desligada para o NutriTeens. Dá para ligar de novo nas configurações do celular.'}
          </AppText>
          <AppButton
            label={permissao?.canAskAgain ? 'Permitir câmera' : 'Abrir configurações'}
            onPress={() => (permissao?.canAskAgain ? pedirPermissao() : Linking.openSettings())}
          />
        </View>
      )}

      {permissao?.granted && erroCamera && (
        <View style={styles.centro} pointerEvents="box-none">
          <AppText style={styles.msgTitulo}>A câmera não abriu</AppText>
          <AppText style={styles.msgTexto}>Pode ser que outro app esteja usando a câmera. Feche-o e tente de novo.</AppText>
          <AppButton label="Tentar de novo" onPress={() => { setErroCamera(false); setTentativa((n) => n + 1); }} />
        </View>
      )}

      {permissao?.granted && modoNativo && (
        <View style={styles.centro} pointerEvents="box-none">
          <MaterialCommunityIcons name="barcode-scan" size={72} color={colors.primary} />
          <AppText style={styles.msgTitulo}>Aponte para o código de barras</AppText>
          <AppText style={styles.msgTexto}>O leitor abre sozinho. Se fechar sem querer, toque no botão para abrir de novo.</AppText>
          <AppButton label="Abrir leitor" onPress={abrirLeitorNativo} />
          <AppText style={styles.link} onPress={() => setUsarPreview(true)}>Usar a câmera da tela</AppText>
        </View>
      )}

      {podeLer && (
        <View style={styles.centro} pointerEvents="none">
          <View style={styles.moldura}>
            <View style={[styles.canto, styles.cEsq, styles.cTopo]} />
            <View style={[styles.canto, styles.cDir, styles.cTopo]} />
            <View style={[styles.canto, styles.cEsq, styles.cBase]} />
            <View style={[styles.canto, styles.cDir, styles.cBase]} />
          </View>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.rodape}>
        {!modoNativo && <AppText style={styles.dica}>{aviso ?? DICA_PREVIEW}</AppText>}
        {modoNativo && !!aviso && <AppText style={styles.dica}>{aviso}</AppText>}
        {__DEV__ && <AppText style={styles.debug}>{ultima ? `Câmera leu → ${ultima}` : (podeLer || modoNativo ? 'Câmera pronta, ainda sem leitura' : 'Câmera parada')}</AppText>}
        {digitando ? (
          <View style={styles.digitarLinha}>
            <TextInput
              style={styles.input}
              value={digitado}
              onChangeText={(t) => { setDigitado(t.replace(/\D/g, '')); setAviso(null); }}
              keyboardType="number-pad"
              maxLength={14}
              placeholder="Números do código"
              placeholderTextColor={colors.placeholder}
              onSubmitEditing={enviarDigitado}
            />
            <AppButton label="Buscar" fullWidth={false} onPress={enviarDigitado} disabled={digitado.length < 8} />
          </View>
        ) : (
          <AppText style={styles.link} onPress={() => setDigitando(true)}>Prefere digitar o código?</AppText>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const CANTO = 34;
const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#000' },
  cabecalho: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 12, marginTop: 30 },
  titulo: { flex: 1, textAlign: 'center', fontFamily: typography.bold, fontSize: 18, color: '#fff' },
  lanterna: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  centro: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 14 },
  msgTitulo: { fontFamily: typography.bold, fontSize: 20, color: '#fff', textAlign: 'center' },
  msgTexto: { fontFamily: typography.regular, fontSize: 14, lineHeight: 20, color: '#D1D5DB', textAlign: 'center', marginBottom: 6 },
  moldura: { width: 290, height: 170 },
  canto: { position: 'absolute', width: CANTO, height: CANTO, borderColor: colors.primary },
  cEsq: { left: 0, borderLeftWidth: 4 },
  cDir: { right: 0, borderRightWidth: 4 },
  cTopo: { top: 0, borderTopWidth: 4 },
  cBase: { bottom: 0, borderBottomWidth: 4 },
  rodape: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingBottom: 36, paddingTop: 16, gap: 12, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)' },
  dica: { fontFamily: typography.regular, fontSize: 14, color: '#fff', textAlign: 'center' },
  debug: { fontFamily: typography.regular, fontSize: 11, color: '#FDE68A', textAlign: 'center' },
  link: { fontFamily: typography.bold, fontSize: 14, color: colors.primary, textDecorationLine: 'underline' },
  digitarLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
  input: { flex: 1, height: 48, borderRadius: 14, paddingHorizontal: 14, backgroundColor: '#fff', fontFamily: typography.regular, fontSize: 16, color: colors.textOnLight },
});
