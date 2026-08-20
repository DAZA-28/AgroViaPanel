"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Robot.module.css";

interface RobotProps {
  message?: string;
  variant?: "greeting" | "error";
}

export function Robot({ message, variant = "greeting" }: RobotProps) {
  const robotRef = useRef<HTMLDivElement>(null);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const rect = robotRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + 50;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const max = 9;
      setPupilOffset({
        x: (dx / dist) * Math.min(dist / 25, 1) * max,
        y: (dy / dist) * Math.min(dist / 25, 1) * max,
      });
    }
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  useEffect(() => {
    let timeoutId: number;
    const schedule = () => {
      const delay = 2000 + Math.random() * 4000;
      return window.setTimeout(() => {
        setBlinking(true);
        window.setTimeout(() => setBlinking(false), 150);
        timeoutId = schedule();
      }, delay);
    };
    timeoutId = schedule();
    return () => window.clearTimeout(timeoutId);
  }, []);

  const pupilStyle = {
    transform: `translate(calc(-50% + ${pupilOffset.x}px), calc(-50% + ${pupilOffset.y}px))`,
  };

  return (
    <div className={styles.robotContainer} ref={robotRef}>
      <div className={styles.robot}>
        {message && (
          <div className={`${styles.robotSpeech} ${styles.show} ${variant === "error" ? styles.error : ""}`}>
            {message}
          </div>
        )}
        <div className={styles.robotHead}>
          <div className={styles.robotAntenna} />
          <div className={`${styles.robotEar} ${styles.left}`} />
          <div className={`${styles.robotEar} ${styles.right}`} />
          <div className={styles.robotScreen}>
            <div className={`${styles.robotEyebrow} ${styles.left}`} />
            <div className={`${styles.robotEyebrow} ${styles.right}`} />
            <div className={styles.robotEyes}>
              <div className={`${styles.robotEye} ${blinking ? styles.blink : ""}`}>
                <div className={styles.robotPupil} style={pupilStyle} />
              </div>
              <div className={`${styles.robotEye} ${blinking ? styles.blink : ""}`}>
                <div className={styles.robotPupil} style={pupilStyle} />
              </div>
            </div>
          </div>
          <div className={`${styles.robotMouth} ${variant === "error" ? styles.sad : styles.smile}`} />
        </div>
        <div className={styles.robotBody}>
          <div className={styles.robotCore}>{variant === "error" ? "\u{1F494}" : "\u{1F49A}"}</div>
        </div>
        <div className={`${styles.robotArm} ${styles.left}`} />
        <div className={`${styles.robotArm} ${styles.right}`} />
        <div className={styles.robotLegs}>
          <div className={styles.robotLeg} />
          <div className={styles.robotLeg} />
        </div>
      </div>
    </div>
  );
}
