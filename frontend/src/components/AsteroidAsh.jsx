import { useState, useEffect, useRef } from "react";

export default function AsteroidAsh({ isBackgroundOnly = false }) {
    const [isPlaying, setIsPlaying] = useState(isBackgroundOnly ? true : false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(
        parseInt(localStorage.getItem("asteroid_ash_highscore") || "0")
    );
    const [asteroids, setAsteroids] = useState([]);
    const [speed, setSpeed] = useState(3);
    const gameAreaRef = useRef(null);
    const requestRef = useRef();

    // Reset Game
    const startGame = () => {
        setIsPlaying(true);
        setScore(0);
        setAsteroids([]);
        setSpeed(3);
    };

    const endGame = () => {
        setIsPlaying(false);
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem("asteroid_ash_highscore", score.toString());
        }
    };

    // Generate Asteroids
    useEffect(() => {
        if (!isPlaying) return;

        // Increase difficulty every 10 seconds
        const intervalSpeed = setInterval(() => {
            setSpeed(s => Math.min(s + 0.5, 12));
        }, 10000);

        const spawnAsteroid = () => {
            if (!gameAreaRef.current) return;
            const isBomb = !isBackgroundOnly && Math.random() < 0.15; // 15% chance to be a bomb, NEVER in bg mode
            const types = ["rock", "ice", "metal"];
            const type = isBomb ? "bomb" : types[Math.floor(Math.random() * types.length)];
            const newAsteroid = {
                id: Date.now() + Math.random(),
                x: Math.random() * (gameAreaRef.current.clientWidth - 50),
                y: -50,
                type: type,
                size: Math.random() * 30 + 30
            };
            setAsteroids(prev => [...prev, newAsteroid]);
        };

        const spawnInterval = setInterval(spawnAsteroid, Math.max(800 - (speed * 50), 300));

        return () => {
            clearInterval(intervalSpeed);
            clearInterval(spawnInterval);
        };
    }, [isPlaying, speed]);

    // Game Loop
    const updateGame = () => {
        if (!isPlaying) return;

        setAsteroids(prev => {
            const updated = prev.map(a => ({ ...a, y: a.y + speed }));

            // End game if a non-bomb asteroid hits bottom (and not in bg mode)
            if (gameAreaRef.current && !isBackgroundOnly) {
                const fatalOutOfBounds = updated.find(a => a.y > gameAreaRef.current.clientHeight && a.type !== "bomb");
                if (fatalOutOfBounds) {
                    endGame();
                }
            }
            return updated.filter(a => a.y <= (gameAreaRef.current?.clientHeight || 1000));
        });

        requestRef.current = requestAnimationFrame(updateGame);
    };

    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(updateGame);
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [isPlaying, speed]);

    const scoreRef = useRef(0);
    useEffect(() => { scoreRef.current = score; }, [score]);

    // Slash Asteroid via Global Hover (works even under other UI layers like Chat)
    useEffect(() => {
        if (!isPlaying) return;

        const handleMouseMove = (e) => {
            if (!gameAreaRef.current) return;
            const rect = gameAreaRef.current.getBoundingClientRect();

            // Mouse relative to game area
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            setAsteroids(prev => {
                let hitIds = [];
                let hitBomb = false;

                prev.forEach(a => {
                    // Check bounding box intersection (with slight forgiveness pad)
                    if (mouseX >= a.x - 5 && mouseX <= a.x + a.size + 5 &&
                        mouseY >= a.y - 5 && mouseY <= a.y + a.size + 5) {
                        hitIds.push(a.id);
                        if (a.type === "bomb") hitBomb = true;
                    }
                });

                if (hitBomb && !isBackgroundOnly) {
                    setIsPlaying(false);
                    setHighScore(prevHigh => {
                        const newHigh = Math.max(prevHigh, scoreRef.current);
                        localStorage.setItem("asteroid_ash_highscore", newHigh.toString());
                        return newHigh;
                    });
                    return prev;
                }

                if (hitIds.length > 0) {
                    // Calculate non-bomb items slashed
                    const nonBombs = hitIds.filter(id => {
                        const target = prev.find(a => a.id === id);
                        return target && target.type !== "bomb";
                    });

                    if (nonBombs.length > 0) {
                        setScore(s => s + (nonBombs.length * 10));
                    }

                    if (isBackgroundOnly || !hitBomb) {
                        // Only remove if it was not a game-ending bomb
                        return prev.filter(a => !hitIds.includes(a.id));
                    }
                }
                return prev;
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [isPlaying, isBackgroundOnly]);

    return (
        <div className="asteroid-game-container">
            {!isBackgroundOnly && (
                <div className="header-area game-header">
                    <h2>Asteroid Ash</h2>
                    <div className="scores">
                        <span>Score: {score}</span>
                        <span className="high-score">High Score: {highScore}</span>
                    </div>
                </div>
            )}

            <div className={`game-area ${isBackgroundOnly ? 'bg-only' : ''}`} ref={gameAreaRef}>
                {!isPlaying && !isBackgroundOnly ? (
                    <div className="game-overlay">
                        <h3>Ready to slash?</h3>
                        <p>Hover over falling objects to destroy them.</p>
                        <p style={{ color: "#ef4444", fontWeight: "bold" }}>⚠️ DANGER: Do not touch the red bombs! ⚠️</p>
                        <button className="btn-primary" onClick={startGame} style={{ marginTop: "1rem" }}>
                            {score === 0 ? "Start Game" : "Play Again"}
                        </button>
                    </div>
                ) : (
                    asteroids.map(asteroid => (
                        <div
                            key={asteroid.id}
                            className={`asteroid ${asteroid.type}`}
                            style={{
                                left: asteroid.x,
                                top: asteroid.y,
                                width: asteroid.size,
                                height: asteroid.size
                            }}
                        >
                            {/* SVG representations for different asteroids */}
                            <svg width="100%" height="100%" viewBox="0 0 100 100" fill="currentColor">
                                {asteroid.type === "rock" && <polygon points="30,10 70,5 90,40 80,80 50,95 10,70 5,30" fill="#52525b" stroke="#3f3f46" strokeWidth="3" />}
                                {asteroid.type === "ice" && <polygon points="50,5 90,30 80,70 60,95 20,80 5,40" fill="#60a5fa" stroke="#3b82f6" strokeWidth="2" opacity="0.8" />}
                                {asteroid.type === "metal" && <path d="M50 5 Q80 10 90 40 Q95 70 60 90 Q30 95 10 60 Q5 30 30 15 Z" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="2" />}
                                {asteroid.type === "bomb" && (
                                    <g>
                                        <circle cx="50" cy="65" r="30" fill="#ef4444" stroke="#b91c1c" strokeWidth="3" />
                                        <path d="M50 35 L50 15 Q60 10 65 20 Q70 15 75 25" fill="none" stroke="#f59e0b" strokeWidth="4" />
                                        <polygon points="40,35 60,35 55,45 45,45" fill="#52525b" />
                                    </g>
                                )}
                            </svg>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
