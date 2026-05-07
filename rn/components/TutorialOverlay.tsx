// ============================================================
// 新手教學覆蓋層
// ============================================================
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { TUTORIAL_STEPS, useGameStore } from '../store/gameStore';

interface TutorialOverlayProps {
  visible: boolean;
}

export default function TutorialOverlay({ visible }: TutorialOverlayProps) {
  const tutorialStep = useGameStore(s => s.tutorialStep);
  const tutorialDone = useGameStore(s => s.tutorialDone);
  const completeTutorialStep = useGameStore(s => s.completeTutorialStep);
  const rollDice = useGameStore(s => s.rollDice);
  const movePlayer = useGameStore(s => s.movePlayer);
  const currentEnemy = useGameStore(s => s.currentEnemy);
  const attack = useGameStore(s => s.attack);

  if (tutorialDone || tutorialStep >= TUTORIAL_STEPS.length) return null;

  const step = TUTORIAL_STEPS[tutorialStep];
  if (!step) return null;

  const handleAction = () => {
    if (step.action === 'ROLL_DICE') {
      rollDice();
      completeTutorialStep(step.id);
    } else if (step.action === 'MOVE_PLAYER') {
      // 玩家需要實際移動後才完成
      completeTutorialStep(step.id);
    } else if (step.action === 'ATTACK_ENEMY') {
      if (currentEnemy) {
        attack();
        completeTutorialStep(step.id);
      }
    } else {
      completeTutorialStep(step.id);
    }
  };

  const isLastStep = tutorialStep === TUTORIAL_STEPS.length - 1;

  return (
    <Modal visible={visible && !tutorialDone} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.stepIndicator}>
              {tutorialStep + 1} / {TUTORIAL_STEPS.length}
            </Text>
          </View>

          <Text style={styles.title}>{step.title}</Text>

          <View style={styles.contentBox}>
            <Text style={styles.content}>
              {step.content.split('\n').map((line, i) => (
                <Text key={i}>
                  {line}{'\n'}
                </Text>
              ))}
            </Text>
          </View>

          <View style={styles.actions}>
            {step.action && (
              <TouchableOpacity style={styles.actionBtn} onPress={handleAction}>
                <Text style={styles.actionBtnText}>
                  {step.action === 'ROLL_DICE' && '🎲 去擲骰子！'}
                  {step.action === 'MOVE_PLAYER' && '🗺️ 去地圖移動！'}
                  {step.action === 'ATTACK_ENEMY' && '⚔️ 去戰鬥！'}
                </Text>
              </TouchableOpacity>
            )}

            {!step.action && (
              <TouchableOpacity
                style={[styles.actionBtn, isLastStep ? styles.startBtn : styles.nextBtn]}
                onPress={() => completeTutorialStep(step.id)}
              >
                <Text style={styles.actionBtnText}>
                  {isLastStep ? '🚀 開始冒險！' : '下一頁 →'}
                </Text>
              </TouchableOpacity>
            )}

            {!isLastStep && step.action && (
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={() => completeTutorialStep(step.id)}
              >
                <Text style={styles.skipText}>跳過教學</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 教學步進度指示 */}
          <View style={styles.progress}>
            {TUTORIAL_STEPS.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i <= tutorialStep && styles.dotActive]}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 20, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  card: {
    backgroundColor: '#12122a',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    maxWidth: 360,
    width: '90%',
    borderWidth: 2,
    borderColor: '#ab47bc',
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  stepIndicator: {
    color: '#888',
    fontSize: 12,
  },
  title: {
    color: '#4fc3f7',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  contentBox: {
    backgroundColor: '#0a0a14',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  content: {
    color: '#e0e0e0',
    fontSize: 15,
    lineHeight: 26,
    textAlign: 'center',
  },
  actions: {
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    backgroundColor: '#ab47bc',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  startBtn: {
    backgroundColor: '#4caf50',
  },
  nextBtn: {
    backgroundColor: '#4fc3f7',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipBtn: {
    padding: 8,
  },
  skipText: {
    color: '#888',
    fontSize: 13,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2a2a5a',
  },
  dotActive: {
    backgroundColor: '#ab47bc',
  },
});
