import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "idle" | "playing" | "finished";

interface TargetPos {
  x: number; // px from left of container
  y: number; // px from top of container
  key: number; // unique key to force re-mount
}

interface GameStats {
  hits: number;
  misses: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GAME_DURATION = 30; // seconds
const TARGET_DIAMETER = 72; // px
const TARGET_EXPIRE_MS = 1500; // ms
const TARGET_EXPIRE_WARN_MS = 700; // ms before expire to show warning

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRandomTargetPos(
  containerW: number,
  containerH: number,
): { x: number; y: number } {
  const pad = TARGET_DIAMETER / 2 + 12;
  const x = pad + Math.random() * (containerW - pad * 2);
  const y = pad + Math.random() * (containerH - pad * 2);
  return { x, y };
}

function calcAccuracy(hits: number, misses: number): string {
  const total = hits + misses;
  if (total === 0) return "0.0";
  return ((hits / total) * 100).toFixed(1);
}

// ─── Target Component ─────────────────────────────────────────────────────────

interface TargetProps {
  pos: TargetPos;
  onHit: (e: React.PointerEvent<HTMLDivElement>) => void;
  isPopping: boolean;
  isExpiring: boolean;
}

function Target({ pos, onHit, isPopping, isExpiring }: TargetProps) {
  const animClass = isPopping
    ? "target-hit"
    : isExpiring
      ? "target-expiring target-idle"
      : "target-idle";

  return (
    <div
      data-ocid="game.target"
      key={pos.key}
      onPointerDown={onHit}
      className={`absolute ${animClass}`}
      style={{
        width: TARGET_DIAMETER,
        height: TARGET_DIAMETER,
        borderRadius: "50%",
        left: pos.x - TARGET_DIAMETER / 2,
        top: pos.y - TARGET_DIAMETER / 2,
        cursor: "pointer",
        touchAction: "none",
        userSelect: "none",
        backgroundColor: "oklch(var(--game-accent))",
        // Inner cross marker for precision
        backgroundImage:
          "radial-gradient(circle at 50% 50%, oklch(var(--game-bg) / 0.15) 0%, oklch(var(--game-bg) / 0.15) 15%, transparent 16%)",
        zIndex: 10,
        willChange: "transform",
      }}
      aria-label="Target"
      role="button"
      tabIndex={-1}
    />
  );
}

// ─── Header Stats ─────────────────────────────────────────────────────────────

interface GameHeaderProps {
  timeLeft: number;
  hits: number;
  misses: number;
}

function GameHeader({ timeLeft, hits, misses }: GameHeaderProps) {
  const isWarning = timeLeft <= 5;

  return (
    <div className="flex items-center justify-between px-5 py-3 w-full select-none shrink-0">
      <div className="flex gap-5">
        <div className="flex flex-col items-center leading-none">
          <span
            data-ocid="game.hits_display"
            className="text-2xl font-bold tabular-nums"
            style={{ color: "oklch(var(--game-accent))" }}
          >
            {hits}
          </span>
          <span
            className="text-[10px] uppercase tracking-widest"
            style={{ color: "oklch(var(--game-muted))" }}
          >
            Hits
          </span>
        </div>
        <div className="flex flex-col items-center leading-none">
          <span
            data-ocid="game.misses_display"
            className="text-2xl font-bold tabular-nums"
            style={{ color: "oklch(var(--game-muted))" }}
          >
            {misses}
          </span>
          <span
            className="text-[10px] uppercase tracking-widest"
            style={{ color: "oklch(var(--game-muted))" }}
          >
            Miss
          </span>
        </div>
      </div>

      <div
        data-ocid="game.timer_display"
        className="text-4xl font-bold tabular-nums leading-none transition-colors duration-300"
        style={{
          color: isWarning
            ? "oklch(var(--game-warning))"
            : "oklch(var(--foreground))",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {timeLeft}
      </div>
    </div>
  );
}

// ─── Idle Screen ──────────────────────────────────────────────────────────────

interface IdleScreenProps {
  onStart: () => void;
}

function IdleScreen({ onStart }: IdleScreenProps) {
  return (
    <div className="screen-fade-in flex flex-col items-center justify-center h-full px-8 select-none">
      {/* Title */}
      <div className="mb-2 flex items-center gap-2">
        <div
          className="rounded-full shrink-0"
          style={{
            width: 14,
            height: 14,
            backgroundColor: "oklch(var(--game-accent))",
          }}
        />
        <span
          className="text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: "oklch(var(--game-accent))" }}
        >
          Mini Game
        </span>
      </div>

      <h1
        className="text-4xl sm:text-5xl font-bold text-center leading-tight mb-3"
        style={{ color: "oklch(var(--foreground))" }}
      >
        Thumb
        <br />
        Accuracy
        <br />
        Test
      </h1>

      <p
        className="text-sm text-center mb-12 max-w-xs leading-relaxed"
        style={{ color: "oklch(var(--game-muted))" }}
      >
        Tap targets as fast as you can.
        <br />
        30 seconds. No mercy.
      </p>

      {/* Stats preview row */}
      <div
        className="flex gap-8 mb-12"
        style={{ color: "oklch(var(--game-muted))" }}
      >
        {[
          { label: "Duration", value: "30s" },
          { label: "Target", value: "72px" },
          { label: "Auto-expire", value: "1.5s" },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1">
            <span
              className="text-lg font-bold"
              style={{ color: "oklch(var(--foreground))" }}
            >
              {item.value}
            </span>
            <span className="text-[10px] uppercase tracking-widest">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        data-ocid="game.start_button"
        onPointerDown={onStart}
        className="w-full max-w-xs h-14 rounded-none text-base font-bold uppercase tracking-widest transition-all duration-150 active:scale-95"
        style={{
          backgroundColor: "oklch(var(--game-accent))",
          color: "oklch(var(--game-bg))",
          touchAction: "none",
          userSelect: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        Start
      </button>

      {/* Decorative target hint */}
      <div className="mt-10 opacity-20 flex gap-4">
        {[28, 18, 22].map((size) => (
          <div
            key={size}
            className="rounded-full"
            style={{
              width: size,
              height: size,
              backgroundColor: "oklch(var(--game-accent))",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Score Screen ─────────────────────────────────────────────────────────────

interface ScoreScreenProps {
  hits: number;
  misses: number;
  onRestart: () => void;
}

function ScoreScreen({ hits, misses, onRestart }: ScoreScreenProps) {
  const accuracy = calcAccuracy(hits, misses);
  const total = hits + misses;

  const grade =
    Number.parseFloat(accuracy) >= 90
      ? "S"
      : Number.parseFloat(accuracy) >= 75
        ? "A"
        : Number.parseFloat(accuracy) >= 60
          ? "B"
          : Number.parseFloat(accuracy) >= 45
            ? "C"
            : "D";

  const gradeColor =
    grade === "S"
      ? "oklch(var(--game-accent))"
      : grade === "A"
        ? "oklch(0.80 0.18 145)"
        : grade === "B"
          ? "oklch(var(--foreground))"
          : "oklch(var(--game-muted))";

  return (
    <div className="screen-fade-in flex flex-col items-center justify-center h-full px-8 select-none">
      {/* Grade */}
      <div
        className="stat-reveal text-8xl font-bold leading-none mb-1"
        style={{ color: gradeColor, animationDelay: "0ms" }}
      >
        {grade}
      </div>
      <div
        className="stat-reveal text-[10px] uppercase tracking-[0.3em] mb-10"
        style={{ color: "oklch(var(--game-muted))", animationDelay: "60ms" }}
      >
        Grade
      </div>

      {/* Score panel */}
      <div
        data-ocid="game.score_panel"
        className="stat-reveal w-full max-w-xs mb-8"
        style={{
          animationDelay: "100ms",
          border: "1px solid oklch(var(--game-border))",
          backgroundColor: "oklch(var(--game-surface))",
        }}
      >
        <div
          data-ocid="game.accuracy_display"
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid oklch(var(--game-border))" }}
        >
          <span
            className="text-xs uppercase tracking-widest"
            style={{ color: "oklch(var(--game-muted))" }}
          >
            Accuracy
          </span>
          <span
            className="text-3xl font-bold tabular-nums"
            style={{ color: "oklch(var(--game-accent))" }}
          >
            {accuracy}%
          </span>
        </div>

        <div
          data-ocid="game.hits_display"
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid oklch(var(--game-border))" }}
        >
          <span
            className="text-xs uppercase tracking-widest"
            style={{ color: "oklch(var(--game-muted))" }}
          >
            Hits
          </span>
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color: "oklch(var(--foreground))" }}
          >
            {hits}
          </span>
        </div>

        <div
          data-ocid="game.misses_display"
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid oklch(var(--game-border))" }}
        >
          <span
            className="text-xs uppercase tracking-widest"
            style={{ color: "oklch(var(--game-muted))" }}
          >
            Misses
          </span>
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color: "oklch(var(--game-muted))" }}
          >
            {misses}
          </span>
        </div>

        <div className="flex items-center justify-between px-5 py-4">
          <span
            className="text-xs uppercase tracking-widest"
            style={{ color: "oklch(var(--game-muted))" }}
          >
            Total taps
          </span>
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color: "oklch(var(--foreground))" }}
          >
            {total}
          </span>
        </div>
      </div>

      <button
        type="button"
        data-ocid="game.restart_button"
        onPointerDown={onRestart}
        className="w-full max-w-xs h-14 rounded-none text-base font-bold uppercase tracking-widest transition-all duration-150 active:scale-95 stat-reveal"
        style={{
          backgroundColor: "oklch(var(--game-accent))",
          color: "oklch(var(--game-bg))",
          touchAction: "none",
          userSelect: "none",
          border: "none",
          cursor: "pointer",
          animationDelay: "200ms",
        }}
      >
        Play Again
      </button>

      <p
        className="mt-8 text-[10px] stat-reveal"
        style={{ color: "oklch(var(--game-muted))", animationDelay: "300ms" }}
      >
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "oklch(var(--game-accent))" }}
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [stats, setStats] = useState<GameStats>({ hits: 0, misses: 0 });
  const [target, setTarget] = useState<TargetPos | null>(null);
  const [isPopping, setIsPopping] = useState(false);
  const [isExpiring, setIsExpiring] = useState(false);

  // Refs for values used in intervals/timeouts
  const hitRef = useRef(0);
  const missRef = useRef(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expireWarnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<Phase>("idle");

  // Keep phaseRef in sync
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const clearAllTimers = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (targetTimerRef.current) clearTimeout(targetTimerRef.current);
    if (expireWarnRef.current) clearTimeout(expireWarnRef.current);
    if (popTimerRef.current) clearTimeout(popTimerRef.current);
    countdownRef.current = null;
    targetTimerRef.current = null;
    expireWarnRef.current = null;
    popTimerRef.current = null;
  }, []);

  const spawnTarget = useCallback(() => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const headerHeight = 56; // approx header area
    const h = rect.height - headerHeight;
    const w = rect.width;

    const { x, y } = getRandomTargetPos(w, h);
    setIsPopping(false);
    setIsExpiring(false);
    setTarget({ x, y: y + headerHeight, key: Date.now() });

    // Schedule expire warning
    expireWarnRef.current = setTimeout(() => {
      if (phaseRef.current === "playing") {
        setIsExpiring(true);
      }
    }, TARGET_EXPIRE_MS - TARGET_EXPIRE_WARN_MS);

    // Schedule auto-expire
    targetTimerRef.current = setTimeout(() => {
      if (phaseRef.current === "playing") {
        missRef.current += 1;
        setStats({ hits: hitRef.current, misses: missRef.current });
        spawnTarget();
      }
    }, TARGET_EXPIRE_MS);
  }, []);

  const _endGame = useCallback(() => {
    clearAllTimers();
    setPhase("finished");
  }, [clearAllTimers]);

  const startGame = useCallback(() => {
    // Reset state
    hitRef.current = 0;
    missRef.current = 0;
    setStats({ hits: 0, misses: 0 });
    setTimeLeft(GAME_DURATION);
    setIsPopping(false);
    setIsExpiring(false);
    clearAllTimers();

    setPhase("playing");

    // Start countdown
    let remaining = GAME_DURATION;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearAllTimers();
        // Finalize stats from refs
        setStats({ hits: hitRef.current, misses: missRef.current });
        setPhase("finished");
      }
    }, 1000);

    // Will spawn after phase transition
  }, [clearAllTimers]);

  // Spawn first target when phase becomes "playing"
  useEffect(() => {
    if (phase === "playing") {
      spawnTarget();
    } else {
      setTarget(null);
    }
  }, [phase, spawnTarget]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const handleTargetHit = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (phaseRef.current !== "playing") return;
      e.stopPropagation();

      // Clear pending timers
      if (targetTimerRef.current) clearTimeout(targetTimerRef.current);
      if (expireWarnRef.current) clearTimeout(expireWarnRef.current);
      targetTimerRef.current = null;
      expireWarnRef.current = null;

      hitRef.current += 1;
      setStats({ hits: hitRef.current, misses: missRef.current });

      // Pop animation, then spawn next
      setIsPopping(true);
      popTimerRef.current = setTimeout(() => {
        spawnTarget();
      }, 160);
    },
    [spawnTarget],
  );

  const handleMiss = useCallback((_e: React.PointerEvent<HTMLDivElement>) => {
    if (phaseRef.current !== "playing") return;
    // Only count if not clicking on the target itself (target stops propagation)
    missRef.current += 1;
    setStats({ hits: hitRef.current, misses: missRef.current });
  }, []);

  return (
    <div
      className="relative flex flex-col overflow-hidden select-none"
      style={{
        height: "100dvh",
        width: "100%",
        backgroundColor: "oklch(var(--game-bg))",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      {phase === "idle" && <IdleScreen onStart={startGame} />}

      {phase === "playing" && (
        <>
          <GameHeader
            timeLeft={timeLeft}
            hits={stats.hits}
            misses={stats.misses}
          />
          {/* Game area */}
          <div
            ref={gameAreaRef}
            className="relative flex-1"
            onPointerDown={handleMiss}
            style={{
              touchAction: "none",
              userSelect: "none",
              cursor: "crosshair",
            }}
          >
            {target && (
              <Target
                pos={target}
                onHit={handleTargetHit}
                isPopping={isPopping}
                isExpiring={isExpiring}
              />
            )}
            {/* Subtle grid overlay for depth */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(oklch(var(--game-border) / 0.3) 1px, transparent 1px),
                  linear-gradient(90deg, oklch(var(--game-border) / 0.3) 1px, transparent 1px)
                `,
                backgroundSize: "48px 48px",
                zIndex: 0,
              }}
            />
          </div>
        </>
      )}

      {phase === "finished" && (
        <ScoreScreen
          hits={stats.hits}
          misses={stats.misses}
          onRestart={startGame}
        />
      )}
    </div>
  );
}
