// ============================================================
// 互動引導式新手教學 Overlay
// 每一步引導玩家操作 UI 元素，自動進度，無跳過按鈕
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { TUTORIAL_STEPS, useGameStore } from '../store/gameStore';

interface TutorialOverlayProps {
  visible: boolean;
}

export default function TutorialOverlay({ visible }: TutorialOverlayProps) {
  const tutorialStep = useGameStore(s => s.tutorialStep);
  const tutorialDone = useGameStore(s => s.tutorialDone);
  const tutorialHighlight = useGameStore(s => s.tutorialHighlight);
  const completeTutorialStep = useGameStore(s => s.completeTutorialStep);
  const diceValue = useGameStore(s => s.diceValue);
  const player = useGameStore(s => s.player);
  const currentEnemy = useGameStore(s => s.currentEnemy);
  const setActiveTab = useGameStore(s => s.setActiveTab);

  const [showComplete, setShowComplete] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const prevPlayerRef = useRef({ x: player.x, y: player.y });
  const prevHpRef = useRef(player.hp);
  const prevEnemyRef = useRef(currentEnemy);

  if (tutorialDone || tutorialStep >= TUTORIAL_STEPS.length) return null;

  const step = TUTORIAL_STEPS[tutorialStep];
  if (!step) return null;

  const isLastStep = step.id === 'complete';
  const isFirstStep = step.id === 'welcome';
  const isActionStep = !isFirstStep && !isLastStep;

  // ============================================================
  // Auto-advancement: watch state changes and advance automatically
  // ============================================================

  // Step 1 (roll_dice): Auto-advance when diceValue changes from null to non-null
  useEffect(() => {
    if (step.id !== 'roll_dice') return;
    if (diceValue !== null) {
      const timer = setTimeout(() => {
        completeTutorialStep(step.id);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [diceValue, step.id]);

  // Step 2 (move_player): Auto-advance when player position changes
  useEffect(() => {
    if (step.id !== 'move_player') return;
    if (player.x !== prevPlayerRef.current.x || player.y !== prevPlayerRef.current.y) {
      const timer = setTimeout(() => {
        completeTutorialStep(step.id);
      }, 600);
      return () => clearTimeout(timer);
    }
    prevPlayerRef.current = { x: player.x, y: player.y };
  }, [player.x, player.y, step.id]);

  // Step 3 (attack_enemy): Auto-advance when currentEnemy becomes null (enemy defeated)
  useEffect(() => {
    if (step.id !== 'attack_enemy') return;
    // Enemy was present and now is null → defeated
    if (prevEnemyRef.current !== null && currentEnemy === null) {
      const timer = setTimeout(() => {
        completeTutorialStep(step.id);
      }, 800);
      return () => clearTimeout(timer);
    }
    prevEnemyRef.current = currentEnemy;
  }, [currentEnemy, step.id]);

  // Step 4 (use_item): Auto-advance when HP increases (item used)
  useEffect(() => {
    if (step.id !== 'use_item') return;
    if (player.hp > prevHpRef.current) {
      const timer = setTimeout(() => {
        completeTutorialStep(step.id);
      }, 800);
      return () => clearTimeout(timer);
    }
    prevHpRef.current = player.hp;
  }, [player.hp, step.id]);

  // Step 5 (complete): Auto-close after 2 seconds
  useEffect(() => {
    if (step.id !== 'complete') return;
    setShowComplete(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      completeTutorialStep(step.id);
    }, 2500);
    return () => clearTimeout(timer);
  }, [step.id]);

  // ============================================================
  // Step 1: Welcome — Full screen welcome card with "開始旅程" button
  // ============================================================
  if (isFirstStep) {
    return (
      <View style={styles.fullOverlay}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeIcon}>🏰</Text>
          <Text style={styles.welcomeTitle}>{step.title}</Text>
          <Text style={styles.welcomeContent}>
            {step.content.split('\n').map((line, i) => (
              <Text key={i}>
                {line}{'\n'}
              </Text>
            ))}
          </Text>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => completeTutorialStep(step.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.startBtnText}>🚀 開始旅程</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================================
  // Step 6: Complete — Full screen congratulations, auto-close
  // ============================================================
  if (isLastStep) {
    if (!showComplete) return null;
    return (
      <Animated.View style={[styles.fullOverlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.completeCard, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.completeIcon}>🎉</Text>
          <Text style={styles.completeTitle}>{step.title}</Text>
          <Text style={styles.completeContent}>
            {step.content.split('\n').map((line, i) => (
              <Text key={i}>
                {line}{'\n'}
              </Text>
            ))}
          </Text>
          <Text style={styles.completeSub}>準備踏上冒險之旅...</Text>
        </Animated.View>
      </Animated.View>
    );
  }

  // ============================================================
  // Steps 2-5: Floating hint bar at bottom (not full-screen)
  // ============================================================
  return (
    <View style={styles.hintContainer} pointerEvents="box-none">
      {/* Progress dots */}
      <View style={styles.progressRow}>
        {TUTORIAL_STEPS.map((s, i) => (
          <View
            key={s.id}
            style={[
              styles.dot,
              i === tutorialStep && styles.dotActive,
              i < tutorialStep && styles.dotDone,
            ]}
          />
        ))}
      </View>

      {/* Hint card */}
      <View style={styles.hintCard}>
        <Text style={styles.hintTitle}>{step.title}</Text>
        <Text style={styles.hintContent}>
          {step.content.split('\n').map((line, i) => (
            <Text key={i}>
              {line}{'\n'}
            </Text>
          ))}
        </Text>
      </View>
    </View>
  );
}

// ============================================================
const styles = StyleSheet.create({
  // --- Full overlay (for welcome & complete) ---
  fullOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 20, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 70,
  },

  // --- Welcome card ---
  welcomeCard: {
    backgroundColor: '#12122a',
    borderRadius: 24,
    padding: 32,
    margin: 24,
    maxWidth: 360,
    width: '90%',
    borderWidth: 2,
    borderColor: '#ab47bc',
    alignItems: 'center',
  },
  welcomeIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  welcomeTitle: {
    color: '#4fc3f7',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeContent: {
    color: '#e0e0e0',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 24,
  },
  startBtn: {
    backgroundColor: '#ab47bc',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // --- Complete card ---
  completeCard: {
    backgroundColor: '#12122a',
    borderRadius: 24,
    padding: 32,
    margin: 24,
    maxWidth: 360,
    width: '90%',
    borderWidth: 3,
    borderColor: '#ffd700',
    alignItems: 'center',
  },
  completeIcon: {
    fontSize: 72,
    marginBottom: 16,
  },
  completeTitle: {
    color: '#ffd700',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  completeContent: {
    color: '#e0e0e0',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 16,
  },
  completeSub: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },

  // --- Floating hint bar (steps 2-5) ---
  hintContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 70,
    pointerEvents: 'box-none',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2a2a5a',
  },
  dotActive: {
    backgroundColor: '#ab47bc',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotDone: {
    backgroundColor: '#4fc3f7',
  },
  hintCard: {
    backgroundColor: 'rgba(18, 18, 42, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    maxWidth: 360,
    width: '90%',
    borderWidth: 2,
    borderColor: '#ab47bc',
    alignItems: 'center',
  },
  hintTitle: {
    color: '#4fc3f7',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  hintContent: {
    color: '#e0e0e0',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
});