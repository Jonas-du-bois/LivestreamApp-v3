<template>
  <div
    class="splash-screen"
    role="status"
    aria-live="polite"
    aria-label="Chargement de LiveStreamApp"
  >
    <span class="splash-screen__orb splash-screen__orb--cyan" aria-hidden="true" />
    <span class="splash-screen__orb splash-screen__orb--violet" aria-hidden="true" />

    <div class="splash-screen__card glass-panel">
      <div class="splash-screen__logo-wrap" aria-hidden="true">
        <span class="splash-screen__halo" />
        <img
          src="/icons/logo_livestreamappv3-192.png"
          alt=""
          width="96"
          height="96"
          class="splash-screen__logo"
          loading="eager"
          decoding="async"
        />
      </div>

      <!-- <p class="splash-screen__title">Coupe des Bains</p> -->
      <p class="splash-screen__subtitle">Connexion au live...</p>

      <div class="splash-screen__progress" aria-hidden="true">
        <span class="splash-screen__progress-bar" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.splash-screen {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: 1.5rem;
  background:
    radial-gradient(circle at 25% 25%, rgba(6, 182, 212, 0.22), transparent 45%),
    radial-gradient(circle at 75% 20%, rgba(139, 92, 246, 0.2), transparent 42%),
    linear-gradient(165deg, #020617 0%, #0b1120 55%, #030712 100%);
}

.splash-screen__orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(52px);
  pointer-events: none;
  animation: splash-orb-float 4.8s ease-in-out infinite;
}

.splash-screen__orb--cyan {
  width: 42vw;
  height: 42vw;
  max-width: 340px;
  max-height: 340px;
  background: rgba(6, 182, 212, 0.3);
  left: -8vw;
  top: 14vh;
}

.splash-screen__orb--violet {
  width: 48vw;
  height: 48vw;
  max-width: 380px;
  max-height: 380px;
  background: rgba(139, 92, 246, 0.26);
  right: -10vw;
  bottom: 8vh;
  animation-delay: -1.8s;
}

.splash-screen__card {
  width: min(90vw, 360px);
  padding: 2.25rem 1.5rem 1.4rem;
  text-align: center;
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow:
    0 25px 55px rgba(2, 6, 23, 0.52),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
}

.splash-screen__logo-wrap {
  position: relative;
  width: 112px;
  height: 112px;
  margin: 0 auto 1.1rem;
  display: grid;
  place-items: center;
  animation: splash-logo-float 2.4s ease-in-out infinite;
}

.splash-screen__halo {
  position: absolute;
  inset: 4px;
  border-radius: 9999px;
  background: linear-gradient(140deg, rgba(34, 211, 238, 0.35), rgba(139, 92, 246, 0.3));
  filter: blur(9px);
  transform: scale(0.92);
  animation: splash-halo-pulse 2s ease-in-out infinite;
}

.splash-screen__logo {
  position: relative;
  width: 96px;
  height: 96px;
  object-fit: contain;
  filter: drop-shadow(0 0 14px rgba(34, 211, 238, 0.45));
}

.splash-screen__title {
  margin: 0;
  color: #f8fafc;
  font-size: 1.28rem;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.splash-screen__subtitle {
  margin: 0.36rem 0 1rem;
  color: rgba(226, 232, 240, 0.78);
  font-size: 0.9rem;
  letter-spacing: 0.02em;
}

.splash-screen__progress {
  width: 100%;
  height: 6px;
  border-radius: 9999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.12);
}

.splash-screen__progress-bar {
  display: block;
  height: 100%;
  width: 46%;
  border-radius: inherit;
  background: linear-gradient(90deg, #22d3ee 0%, #a78bfa 100%);
  animation: splash-progress 1.2s ease-in-out infinite;
}

@keyframes splash-progress {
  0% {
    transform: translateX(-110%);
  }
  50% {
    transform: translateX(95%);
  }
  100% {
    transform: translateX(230%);
  }
}

@keyframes splash-halo-pulse {
  0%, 100% {
    opacity: 0.62;
    transform: scale(0.88);
  }
  50% {
    opacity: 1;
    transform: scale(1.02);
  }
}

@keyframes splash-logo-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@keyframes splash-orb-float {
  0%, 100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -12px, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .splash-screen__orb,
  .splash-screen__logo-wrap,
  .splash-screen__halo,
  .splash-screen__progress-bar {
    animation: none;
  }
}

@media (max-width: 420px) {
  .splash-screen__card {
    width: min(92vw, 330px);
    padding: 2rem 1.2rem 1.2rem;
  }

  .splash-screen__title {
    font-size: 1.16rem;
  }
}
</style>
