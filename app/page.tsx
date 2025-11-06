// File: app/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";

const rangerActive = "/images/ranger-active.jpg";
const wolfActive = "/images/wolf-active.jpg";
const wolfInactive = "/images/wolf-inactive.jpg";

export default function Page() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [creatureAC, setCreatureAC] = useState(15);
  const [firstRound, setFirstRound] = useState(false);
  const [dreadfulStrike, setDreadfulStrike] = useState(false);
  const [huntersMark, setHuntersMark] = useState(true);
  const [zephyrStrike, setZephyrStrike] = useState(false);
  const [weapon, setWeapon] = useState<
    "twohanded" | "singlehanded" | "longbow"
  >("twohanded");

  const [mainName] = useState("Draven Galanodel");
  const [mainPhoto] = useState(rangerActive);

  const [secondaryName] = useState("Fang");
  const [secondaryActivePhoto] = useState(wolfActive);
  const [secondaryInactivePhoto] = useState(wolfInactive);
  const [hasSecondary] = useState(true);
  const [secondaryActive, setSecondaryActive] = useState(true);
  const [includeSecondaryInRoll] = useState(true);

  const [attackResultsMain, setAttackResultsMain] = useState<any[]>([]);
  const [attackResultsSecondary, setAttackResultsSecondary] = useState<any[]>(
    []
  );

  const [showSettings, setShowSettings] = useState(false);

  const DEX_BONUS = 4;
  const SECONDARY_HIT_BONUS = 3;
  const AC_VALUES = [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];

  const rollDie = (s: number) => Math.floor(Math.random() * s) + 1;
  const getMainHitBonus = () => (weapon === "longbow" ? 9 : 7);

  const getMainDamageFormula = (
    crit: boolean,
    label: string,
    isZephyr: boolean
  ) => {
    const isLongbow = weapon === "longbow";
    const baseDie = isLongbow ? 8 : 6;
    const mult = crit ? 2 : 1;
    return {
      base: { count: 1 * mult, sides: baseDie },
      hunters: huntersMark ? { count: 1 * mult, sides: 6 } : null,
      gloomstalker:
        firstRound && label === "Gloomstalker Attack"
          ? { count: 1 * mult, sides: 8 }
          : null,
      zephyr: isZephyr ? { count: 1 * mult, sides: 8 } : null,
      bonus: isLongbow ? 2 : 0,
    };
  };

  const getSecondaryDamageFormula = (crit: boolean) => ({
    base: { count: crit ? 2 : 1, sides: 8 },
    flatBonus: 10,
  });

  const getAttackLabels = () => {
    if (firstRound) {
      if (weapon === "longbow")
        return ["1st attack", "2nd attack", "Gloomstalker Attack"];
      if (weapon === "twohanded")
        return [
          "1st attack",
          "2nd attack",
          "Gloomstalker Attack",
          "Shortsword attack",
        ];
      if (weapon === "singlehanded")
        return ["1st attack", "2nd attack", "Gloomstalker Attack"];
    } else {
      if (weapon === "longbow") return ["1st attack", "2nd attack"];
      if (weapon === "twohanded")
        return ["1st attack", "2nd attack", "Shortsword attack"];
      if (weapon === "singlehanded") return ["1st attack", "2nd attack"];
    }
    return [];
  };

  const rollMain = () => {
    const labels = getAttackLabels();
    const results: any[] = [];

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      let roll1 = rollDie(20);
      let hitRoll = roll1;
      if (zephyrStrike && i === 0) {
        const roll2 = rollDie(20);
        hitRoll = Math.max(roll1, roll2);
      }

      const crit = hitRoll === 20;
      const hitTotal = hitRoll + getMainHitBonus();

      const f = getMainDamageFormula(crit, label, zephyrStrike && i === 0);
      const base = Array.from({ length: f.base.count }, () =>
        rollDie(f.base.sides)
      );
      const htrmk = f.hunters
        ? Array.from({ length: f.hunters.count }, () =>
            rollDie(f.hunters!.sides)
          )
        : [];
      const gloom = f.gloomstalker
        ? Array.from({ length: f.gloomstalker.count }, () =>
            rollDie(f.gloomstalker!.sides)
          )
        : [];
      const zphr = f.zephyr
        ? Array.from({ length: f.zephyr.count }, () => rollDie(f.zephyr!.sides))
        : [];

      const total =
        [...base, ...htrmk, ...gloom, ...zphr].reduce((a, b) => a + b, 0) +
        f.bonus +
        DEX_BONUS;

      const success = hitTotal >= creatureAC;

      results.push({
        label,
        hitRoll,
        hitTotal,
        crit,
        success,
        total,
        base,
        htrmk,
        gloom,
        zphr,
        dfstk: [],
        isDread: false,
      });
    }

    if (dreadfulStrike) {
      const firstHit = results.find((r) => r.success);
      if (firstHit) {
        const mult = firstHit.crit ? 2 : 1;
        const rolls = Array.from({ length: 2 * mult }, () => rollDie(6));
        const add = rolls.reduce((a, b) => a + b, 0);
        firstHit.dfstk = rolls;
        firstHit.total += add;
        firstHit.isDread = true;
      }
    }

    setAttackResultsMain(results);
  };

  const rollSecondary = () => {
    const hitRoll = rollDie(20);
    const crit = hitRoll === 20;
    const hitTotal = hitRoll + SECONDARY_HIT_BONUS;
    const f = getSecondaryDamageFormula(crit);
    const base = Array.from({ length: f.base.count }, () =>
      rollDie(f.base.sides)
    );
    const total = base.reduce((a, b) => a + b, 0) + f.flatBonus;
    const success = hitTotal >= creatureAC;
    setAttackResultsSecondary([
      { label: "Ben Attack", hitRoll, hitTotal, crit, success, total, base },
    ]);
  };

  const rollAll = () => {
    rollMain();
    if (hasSecondary && secondaryActive && includeSecondaryInRoll) {
      rollSecondary();
    } else {
      setAttackResultsSecondary([]);
    }
  };

  const totalMain = attackResultsMain
    .filter((r) => r.success)
    .reduce((a, b) => a + b.total, 0);
  const totalSec = attackResultsSecondary
    .filter((r) => r.success)
    .reduce((a, b) => a + b.total, 0);
  const totalCombined = totalMain + totalSec;

  const hardReset = () => {
    setAttackResultsMain([]);
    setAttackResultsSecondary([]);
    setFirstRound(false);
    setDreadfulStrike(false);
    setHuntersMark(true);
    setZephyrStrike(false);
    setWeapon("twohanded");
    setCreatureAC(15);
  };

  useEffect(() => {
    // Enhanced video initialization
    const video = videoRef.current;
    if (!video) return;

    const playVideo = async () => {
      try {
        // Reset video to start
        video.currentTime = 0;

        // Ensure all attributes are set
        video.muted = true;
        video.playsInline = true;
        video.loop = true;

        // Force load
        video.load();

        // Attempt to play
        await video.play();
        console.log("Video playing successfully");
      } catch (err) {
        console.error("Video autoplay failed:", err);

        // Fallback: try playing on user interaction
        const playOnInteraction = async () => {
          try {
            await video.play();
            console.log("Video started after user interaction");
            // Remove listeners after successful play
            document.removeEventListener("click", playOnInteraction);
            document.removeEventListener("touchstart", playOnInteraction);
          } catch (e) {
            console.error("Failed to play video on interaction:", e);
          }
        };

        document.addEventListener("click", playOnInteraction, { once: true });
        document.addEventListener("touchstart", playOnInteraction, {
          once: true,
        });
      }
    };

    playVideo();

    // Cleanup
    return () => {
      if (video) {
        video.pause();
      }
    };
  }, []);

  return (
    <div className="rf-wrap">
      <div className="rf-logo">
        <video
          ref={videoRef}
          className="rf-logo-video"
          muted
          playsInline
          loop
          preload="auto"
          aria-label="Rune Fate animated logo"
        >
          <source src="/media/logo-animation.webm" type="video/webm" />
          <source src="/media/logo_website_960.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Accessible fallback text (visually hidden) */}
        <span className="sr-only">Rune Fate</span>
      </div>

      {(attackResultsMain.length > 0 || attackResultsSecondary.length > 0) && (
        <div className="rf-topbar">
          <div className="rf-total">
            Combined Total Damage (SUCCESS only): {totalCombined}
          </div>
          <button onClick={hardReset} className="btn-reset" aria-label="Reset">
            ↻
          </button>
        </div>
      )}

      <div className="rf-container">
        <div className="ac-row">
          <div className="ac-group">
            <span className="ac-label">Creature AC:</span>
            {AC_VALUES.map((ac) => (
              <button
                key={ac}
                onClick={() => setCreatureAC(ac)}
                className={`ac-btn ${creatureAC === ac ? "is-active" : ""}`}
              >
                {ac}
              </button>
            ))}
          </div>
        </div>

        <div className="roll-row">
          <button onClick={rollAll} className="btn-roll">
            Roll
          </button>
        </div>

        {/* ===== Character rows (main | results) ===== */}
        <div className="char-grid">
          {/* Row 1: DRAVEN */}
          <div className="char-row">
            <div className="char-main">
              <div className="card card--main">
                <div className="main-head">
                  <div className="avatar avatar--square">
                    {mainPhoto ? (
                      <img src={mainPhoto} alt={mainName} />
                    ) : (
                      <div className="avatar-fallback">Upload</div>
                    )}
                  </div>
                  <div className="main-meta">
                    <div className="main-name">{mainName}</div>
                    <div className="main-total">Total Damage : {totalMain}</div>
                  </div>
                </div>

                <div className="opts">
                  <label className="opt">
                    <input
                      type="checkbox"
                      checked={firstRound}
                      onChange={() => setFirstRound(!firstRound)}
                    />
                    <span>First Round (Dread Ambusher)</span>
                  </label>

                  <div className="opt-row">
                    <label className="opt">
                      <input
                        type="checkbox"
                        checked={dreadfulStrike}
                        onChange={() => setDreadfulStrike(!dreadfulStrike)}
                      />
                      <span>Dreadful Strike (3)</span>
                    </label>

                    <label className="opt">
                      <input
                        type="checkbox"
                        checked={huntersMark}
                        onChange={() => setHuntersMark(!huntersMark)}
                      />
                      <span>Hunter's Mark</span>
                    </label>
                  </div>

                  <label className="opt">
                    <input
                      type="checkbox"
                      checked={zephyrStrike}
                      onChange={() => setZephyrStrike(!zephyrStrike)}
                    />
                    <span>Zephyr Strike</span>
                  </label>

                  <label className="opt">
                    <input
                      type="radio"
                      name="weapon-main"
                      checked={weapon === "twohanded"}
                      onChange={() => setWeapon("twohanded")}
                    />
                    <span>Scimitar + Shortsword</span>
                  </label>

                  <label className="opt">
                    <input
                      type="radio"
                      name="weapon-main"
                      checked={weapon === "singlehanded"}
                      onChange={() => setWeapon("singlehanded")}
                    />
                    <span>Scimitar</span>
                  </label>

                  <label className="opt">
                    <input
                      type="radio"
                      name="weapon-main"
                      checked={weapon === "longbow"}
                      onChange={() => setWeapon("longbow")}
                    />
                    <span>Longbow (+2 Magic)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="char-results">
              {attackResultsMain.length > 0 ? (
                <div className="results-stack">
                  {attackResultsMain.map((r, idx) => (
                    <div key={`m-${idx}`} className="result-card">
                      <div className="result-head">
                        <div className="title-row">
                          <span className="emoji">⚔️</span>
                          <span className="title">{r.label}</span>
                          {r.isDread && (
                            <>
                              <span className="emoji">⚡</span>
                              <span className="title">Dreadful Strike</span>
                            </>
                          )}
                        </div>
                        <div className="badge-row">
                          <span className={`pill ${r.success ? "ok" : "bad"}`}>
                            {r.success ? "Success" : "Miss"}
                          </span>
                        </div>
                      </div>

                      <div className="kv">
                        <div className="row">
                          <span className="k">Hit Roll</span>
                          <span className="v">
                            {r.hitRoll}
                            {r.crit && " 🔥 CRIT!"}
                          </span>
                        </div>
                        <div className="row">
                          <span className="k">Hit Roll (+)</span>
                          <span className="v">{r.hitTotal}</span>
                        </div>
                      </div>

                      <div className="total">Total Damage : {r.total}</div>

                      <div className="chips">
                        {r.base?.length > 0 && (
                          <div className="chip chip-base">
                            <span className="chip-tag">BASE</span>
                            <span className="chip-text">
                              {r.base
                                .map(
                                  (v: number) =>
                                    `d${weapon === "longbow" ? 8 : 6}:${v}`
                                )
                                .join(", ")}
                            </span>
                          </div>
                        )}
                        {r.htrmk?.length > 0 && (
                          <div className="chip chip-htrmk">
                            <span className="chip-tag">HTMK</span>
                            <span className="chip-text">
                              {r.htrmk.map((v: number) => `d6:${v}`).join(", ")}
                            </span>
                          </div>
                        )}
                        {r.gloom?.length > 0 && (
                          <div className="chip chip-gloom">
                            <span className="chip-tag">DSTK</span>
                            <span className="chip-text">
                              {r.gloom.map((v: number) => `d8:${v}`).join(", ")}
                            </span>
                          </div>
                        )}
                        {r.zphr?.length > 0 && (
                          <div className="chip chip-zphr">
                            <span className="chip-tag">ZEPHYR</span>
                            <span className="chip-text">
                              {r.zphr.map((v: number) => `d8:${v}`).join(", ")}
                            </span>
                          </div>
                        )}
                        {r.dfstk?.length > 0 && (
                          <div className="chip chip-dfstk">
                            <span className="chip-tag">DSTK</span>
                            <span className="chip-text">
                              {r.dfstk.map((v: number) => `d6:${v}`).join(", ")}
                            </span>
                          </div>
                        )}
                        <div className="chip chip-dex">
                          <span className="chip-tag">DEX</span>
                          <span className="chip-text">+4</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-hint">Press Roll to show results.</div>
              )}
            </div>
          </div>

          {/* Row 2: FANG */}
          {hasSecondary && (
            <div className="char-row">
              <div className="char-main">
                <div className="card card--secondary">
                  <div
                    className={`badge ${secondaryActive ? "is-on" : "is-off"}`}
                  >
                    {secondaryActive ? "Active" : "Inactive"}
                  </div>

                  <div
                    className={`sec-head ${
                      secondaryActive ? "" : "is-inactive"
                    }`}
                    onClick={() => setSecondaryActive(!secondaryActive)}
                  >
                    <div className="avatar avatar--square xxxl">
                      <img
                        src={
                          secondaryActive
                            ? secondaryActivePhoto
                            : secondaryInactivePhoto
                        }
                        alt={secondaryName}
                      />
                    </div>
                    <div className="sec-name">{secondaryName}</div>
                  </div>

                  <div className="box-total">
                    Total Damage :{" "}
                    {attackResultsSecondary
                      .filter((r) => r.success)
                      .reduce((a, b) => a + b.total, 0)}
                  </div>
                </div>
              </div>

              <div className="char-results">
                {attackResultsSecondary.length > 0 ? (
                  <div className="results-stack">
                    {attackResultsSecondary.map((r, idx) => (
                      <div key={`s-${idx}`} className="result-card">
                        <div className="result-head">
                          <div className="title-row">
                            <span className="emoji">🦷</span>
                            <span className="title">Bite Attack</span>
                          </div>
                          <div className="badge-row">
                            <span
                              className={`pill ${r.success ? "ok" : "bad"}`}
                            >
                              {r.success ? "Success" : "Miss"}
                            </span>
                          </div>
                        </div>

                        <div className="kv">
                          <div className="row">
                            <span className="k">Hit Roll</span>
                            <span className="v">
                              {r.hitRoll}
                              {r.crit && " 🔥 CRIT!"}
                            </span>
                          </div>
                          <div className="row">
                            <span className="k">Hit Roll (+)</span>
                            <span className="v">{r.hitTotal}</span>
                          </div>
                        </div>

                        <div className="total">Total Damage : {r.total}</div>

                        <div className="chips">
                          <div className="chip chip-base">
                            <span className="chip-tag">BASE</span>
                            <span className="chip-text">
                              {r.base.map((v: number) => `d8:${v}`).join(", ")}
                            </span>
                          </div>
                          <div className="chip chip-dex">
                            <span className="chip-tag">+10</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-hint">Press Roll to show results.</div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* ===== /Character rows ===== */}
      </div>

      <button
        onClick={() => setShowSettings(!showSettings)}
        className="btn-settings"
        aria-label="Settings"
      >
        ⚙
      </button>

      {showSettings && (
        <div className="settings-panel">
          <div className="settings-profile">
            <div className="pfp">
              👤
              <div className="pfp-badge">✓</div>
            </div>
            <div className="pfp-size">(200 x 200)</div>
            <div className="pfp-name">Sarah 2</div>
          </div>

          <div className="settings-section">
            <div className="section-title">App Preferences</div>

            <div className="pref-row">
              <span className="pref-label">Upload Background</span>
              <button className="btn-ghost">Choose File</button>
            </div>

            <div className="pref-row">
              <span className="pref-label">Dark/Light Mode</span>
              <label className="switch">
                <input type="checkbox" defaultChecked readOnly />
                <div className="track">
                  <div className="thumb right" />
                </div>
              </label>
            </div>

            <div className="pref-row">
              <span className="pref-label">Sound Effects</span>
              <label className="switch">
                <input type="checkbox" readOnly />
                <div className="track">
                  <div className="thumb left" />
                </div>
              </label>
            </div>
          </div>

          <div className="settings-actions">
            <button className="btn-primary">Save Changes</button>
            <button className="btn-ghost">+ Add New Character</button>
          </div>
        </div>
      )}
    </div>
  );
}
