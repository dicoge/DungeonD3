// ============================================================
// D20 骰子元件 — 使用 react-native-svg + Animated
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import Svg, { Polygon, Text as SvgText, G } from 'react-native-svg';

interface D20DiceProps {
  value: number | null;
  isRolling: boolean;
  onRoll: () => void;
}

const SIZE = 220;
const CENTER = SIZE / 2;
const OUTER_R = 90;   // 外圈六邊形半徑
const INNER_R = 48;   // 內圈半徑

// 骰子顏色
const COLORS = {
  outer1: '#5a0fa0',
  outer2: '#7a20c0',
  inner1: '#7a20c0',
  inner2: '#6a10b0',
  center: '#9b30d0',
  centerGlow: '#c060ff',
  stroke: '#aa44ff',
  text: '#ffffff',
  glow: '#dd88ff',
};

// 六個外圈三角形頂點（相對於中心）
function outerTrianglePoints(i: number): string {
  const angle1 = ((i * 60 - 90) * Math.PI) / 180;
  const angle2 = (((i + 1) * 60 - 90) * Math.PI) / 180;
  const cx = CENTER + Math.cos(((i * 60 + 30 - 90) * Math.PI) / 180) * INNER_R * 1.15;
  const cy = CENTER + Math.sin(((i * 60 + 30 - 90) * Math.PI) / 180) * INNER_R * 1.15;
  const x1 = CENTER + Math.cos(angle1) * OUTER_R;
  const y1 = CENTER + Math.sin(angle1) * OUTER_R;
  const x2 = CENTER + Math.cos(angle2) * OUTER_R;
  const y2 = CENTER + Math.sin(angle2) * OUTER_R;
  return `${cx},${cy} ${x1},${y1} ${x2},${y2}`;
}

// 六邊形外框頂點（封閉）
function hexagonPoints(): string {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const angle = ((i * 60 - 90) * Math.PI) / 180;
    return `${CENTER + Math.cos(angle) * OUTER_R},${CENTER + Math.sin(angle) * OUTER_R}`;
  });
  pts.push(pts[0]); // 封閉多邊形
  return pts.join(' ');
}

// 內圈六邊形（封閉）
function innerHexagonPoints(): string {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const angle = ((i * 60 - 90) * Math.PI) / 180;
    return `${CENTER + Math.cos(angle) * INNER_R},${CENTER + Math.sin(angle) * INNER_R}`;
  });
  pts.push(pts[0]);
  return pts.join(' ');
}

// 中央三角形（三個頂點，封閉）
function centerTrianglePoints(): string {
  const pts = Array.from({ length: 3 }, (_, i) => {
    const angle = ((i * 120 - 90) * Math.PI) / 180;
    return `${CENTER + Math.cos(angle) * INNER_R * 0.85},${CENTER + Math.sin(angle) * INNER_R * 0.85}`;
  });
  pts.push(pts[0]);
  return pts.join(' ');
}

export default function D20Dice({ value, isRolling, onRoll }: D20DiceProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState<number>(1);

  useEffect(() => {
    if (isRolling) {
      // 快速變換數字
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 20) + 1);
      }, 80);

      // 旋轉動畫
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      return () => {
        clearInterval(interval);
        spinValue.setValue(0);
      };
    } else if (value !== null) {
      setDisplayValue(value);
    }
  }, [isRolling, value, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* 外圈六邊形 */}
          <Polygon
            points={hexagonPoints()}
            fill="none"
            stroke={COLORS.stroke}
            strokeWidth={2.5}
          />

          {/* 外圈6個三角形 */}
          {Array.from({ length: 6 }, (_, i) => (
            <Polygon
              key={`outer-${i}`}
              points={outerTrianglePoints(i)}
              fill={i % 2 === 0 ? COLORS.outer1 : COLORS.outer2}
              stroke={COLORS.stroke}
              strokeWidth={1.5}
            />
          ))}

          {/* 內圈六邊形 */}
          <Polygon
            points={innerHexagonPoints()}
            fill="none"
            stroke={COLORS.stroke}
            strokeWidth={1.5}
          />

          {/* 中央三角形（發光效果） */}
          <Polygon
            points={centerTrianglePoints()}
            fill={COLORS.center}
            stroke={COLORS.glow}
            strokeWidth={2.5}
          />

          {/* 數字 */}
          <SvgText
            x={CENTER}
            y={CENTER + 12}
            fill={COLORS.text}
            fontSize={40}
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {displayValue}
          </SvgText>
        </Svg>
      </Animated.View>

      <TouchableOpacity
        style={[styles.rollButton, isRolling && styles.rollButtonDisabled]}
        onPress={onRoll}
        disabled={isRolling}
        activeOpacity={0.7}
      >
        <Animated.Text style={styles.rollText}>
          {isRolling ? '滾動中...' : '🎲 擲骰'}
        </Animated.Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rollButton: {
    marginTop: 24,
    backgroundColor: '#ab47bc',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#ab47bc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  rollButtonDisabled: {
    backgroundColor: '#555',
    opacity: 0.7,
  },
  rollText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
