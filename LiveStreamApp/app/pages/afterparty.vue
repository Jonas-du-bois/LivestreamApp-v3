<script setup lang="ts">
import { usePartyCountdown } from '~/composables/usePartyCountdown'

const { t } = useI18n()
const { timeLeftFull } = usePartyCountdown()

definePageMeta({ header: false, footer: false })

const galleryImages = [
  'https://images.unsplash.com/photo-1533241258671-55c65f0851ec?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1513271168-9b37c0aa89ac?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516997184976-5faac3ce5173?q=80&w=1000&auto=format&fit=crop'
]

const highlights = computed(() => [
  {
    icon: 'fluent:clock-alarm-24-filled',
    label: t('afterparty.startLabel'),
    value: t('afterparty.startTime'),
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30"
  },
  {
    icon: 'fluent:music-note-2-24-filled',
    label: 'Ambiance',
    value: t('afterparty.ambience'),
    color: "text-red-300",
    bg: "bg-red-700/10 border-red-600/30"
  },
  {
    icon: 'fluent:location-24-filled',
    label: t('afterparty.locationLabel'),
    value: t('afterparty.locationValue'),
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30"
  }
])

const drinkMenu = computed(() => [
  {
    category: t('afterparty.categories.beers'),
    icon: 'fluent:drink-beer-24-filled',
    drinks: [
      { name: t('afterparty.drinks.beerSmall'), price: '5' },
      { name: t('afterparty.drinks.beerLarge'), price: '7' },
      { name: t('afterparty.drinks.beerBottle'), price: '6' }
    ]
  },
  {
    category: t('afterparty.categories.cocktails'),
    icon: 'fluent:drink-margarita-24-regular',
    drinks: [
      { name: 'Mojito', price: '12' },
      { name: 'Gin Tonic', price: '11' },
      { name: 'Vodka Red Bull', price: '13' },
      { name: 'Tequila Sunrise', price: '12' }
    ]
  },
  {
    category: t('afterparty.categories.wines'),
    icon: 'fluent:drink-wine-24-filled',
    drinks: [
      { name: t('afterparty.drinks.whiteWine'), price: '5' },
      { name: t('afterparty.drinks.redWine'), price: '5' },
      { name: 'Spritz', price: '10' }
    ]
  },
  {
    category: t('afterparty.categories.softs'),
    icon: 'fluent:drink-bottle-24-regular',
    drinks: [
      { name: 'Coca-Cola', price: '4' },
      { name: 'Ice Tea', price: '4' },
      { name: t('afterparty.drinks.water'), price: '3' },
      { name: 'Red Bull', price: '5' }
    ]
  },
  {
    category: t('afterparty.categories.shots'),
    icon: 'fluent:beaker-24-regular',
    drinks: [
      { name: t('afterparty.drinks.vodkaShot'), price: '4' },
      { name: t('afterparty.drinks.tequilaShot'), price: '4' }
    ]
  }
])
</script>

<template>
  <div class="min-h-screen bg-cirque relative overflow-hidden">

    <!-- ══ FOND CIRQUE ══ -->
    <!-- Rayures diagonales façon chapiteau -->
    <div class="circus-stripes"></div>
    <!-- Vignette sombre pour lisibilité -->
    <div class="circus-vignette"></div>
    <!-- Lumières ambiantes chaudes -->
    <div class="circus-glow-red"></div>
    <div class="circus-glow-gold"></div>
    <!-- Confettis / étoiles décoratifs SVG -->
    <div class="circus-stars" aria-hidden="true">
      <svg class="star star-1" viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9"/></svg>
      <svg class="star star-2" viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9"/></svg>
      <svg class="star star-3" viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9"/></svg>
      <svg class="star star-4" viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9"/></svg>
      <svg class="star star-5" viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9"/></svg>
    </div>

    <!-- Header -->
    <div class="absolute top-safe left-4 right-4 z-50 pt-4 flex justify-between items-start">
      <UiBackButton to="/" class="circus-back-btn">
        {{ t('common.back') }}
      </UiBackButton>

      <!-- Badge "Coming Soon" style ticket cirque -->
      <div class="circus-badge">
        <span class="circus-badge-dot"></span>
        {{ t('afterparty.comingSoon') }}
      </div>
    </div>

    <!-- Contenu scrollable -->
    <div class="relative z-10 pt-32 pb-16 px-6">
      <Transition name="premium-swap" appear>
        <div class="space-y-0">

          <!-- ══ TITRE style affiche cirque ══ -->
          <div class="text-center mb-8">
            <!-- Bandeau décoratif haut -->
            <div class="circus-ornament-bar mb-4">
              <span class="ornament-line"></span>
              <span class="ornament-diamond">✦</span>
              <span class="ornament-line"></span>
            </div>

            <p class="circus-eyebrow">✦ Grand Spectacle ✦</p>
            <h1 class="circus-title">
              AFTER<br>PARTY
            </h1>
            <p class="circus-subtitle">{{ t('afterparty.subtitle') }}</p>

            <!-- Bandeau décoratif bas -->
            <div class="circus-ornament-bar mt-4">
              <span class="ornament-line"></span>
              <span class="ornament-diamond">✦</span>
              <span class="ornament-line"></span>
            </div>
          </div>

          <!-- ══ COUNTDOWN style horloge de gare / panneau de cirque ══ -->
          <div class="mb-8 flex justify-center">
            <div class="circus-countdown-wrap">
              <div class="circus-countdown">
                <p class="circus-countdown-label">{{ t('afterparty.countdownLabel') }}</p>
                <p class="circus-countdown-value">
                  {{ timeLeftFull || '--j --h --m' }}
                </p>
              </div>
            </div>
          </div>

          <!-- ══ THÈME CIRQUE - carte principale ══ -->
          <div class="mb-8 pt-6">
            <div class="circus-theme-card">
              <!-- Coins décoratifs -->
              <span class="corner corner-tl">✦</span>
              <span class="corner corner-tr">✦</span>
              <span class="corner corner-bl">✦</span>
              <span class="corner corner-br">✦</span>

              <div class="relative">
                <div class="flex items-center gap-3 mb-3">
                  <UiIconBox
                    icon="fluent:sparkle-24-filled"
                    variant="gradient"
                    color="amber"
                    shape="circle"
                    size="lg"
                    glow
                    pulse
                    class="circus-icon"
                  />
                  <div>
                    <p class="circus-theme-eyebrow">{{ t('afterparty.themeLabel') }}</p>
                    <h2 class="circus-theme-title">
                      {{ t('afterparty.themeValue') }}
                    </h2>
                  </div>
                </div>
                <p class="circus-theme-desc">
                  {{ t('afterparty.themeDescription') }}
                </p>
              </div>
            </div>
          </div>

          <!-- ══ GALERIE ══ -->
          <div class="relative -mx-6 py-6 mb-8 overflow-hidden">
            <!-- Bordures façon rideau -->
            <div class="gallery-curtain-left"></div>
            <div class="gallery-curtain-right"></div>
            <div class="flex gap-4 animate-scroll whitespace-nowrap px-4">
              <div
                v-for="(img, i) in [...galleryImages, ...galleryImages]"
                :key="i"
                class="inline-block h-48 w-72 shrink-0 rounded-none overflow-hidden border-2 border-amber-400/50 shadow-xl relative group circus-gallery-item"
              >
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 group-hover:from-black/70 transition-all"></div>
                <!-- Overlay rayures sur hover -->
                <div class="gallery-stripe-overlay"></div>
                <img :src="img" class="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Party ambiance" />
              </div>
            </div>
          </div>

          <!-- ══ INFOS PRATIQUES ══ -->
          <div class="grid grid-cols-1 gap-4 mb-8">
            <div
              v-for="item in highlights"
              :key="item.label"
              class="circus-info-tile"
              :class="item.bg"
            >
              <Icon :name="item.icon" class="text-amber-400 shrink-0" size="22" />
              <div class="flex-1">
                <p class="circus-tile-label">{{ item.label }}</p>
                <p class="circus-tile-value">{{ item.value }}</p>
              </div>
            </div>
          </div>

          <!-- ══ MENU BOISSONS ══ -->
          <div class="mb-8 py-6">
            <div class="circus-menu-card">
              <!-- Bande de titre style pancarte -->
              <div class="circus-menu-header">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="flex items-center gap-3 mb-1">
                      <Icon name="fluent:drink-bottle-24-regular" class="text-amber-400" size="28" />
                      <h2 class="circus-menu-title">{{ t('afterparty.drinksTitle') }}</h2>
                    </div>
                    <p class="circus-menu-sub">{{ t('afterparty.drinksSubtitle') }}</p>
                  </div>
                  <div class="circus-payment-badge">
                    <span>{{ t('afterparty.paymentMethods') }}</span>
                  </div>
                </div>
              </div>

              <!-- Séparateur ornemental -->
              <div class="circus-divider">
                <span class="div-line"></span>
                <span class="div-icon">✦</span>
                <span class="div-line"></span>
              </div>

              <!-- Boissons -->
              <div class="space-y-6 px-6 pb-6">
                <div v-for="(category, catIdx) in drinkMenu" :key="catIdx">
                  <div class="flex items-center gap-2 mb-3">
                    <Icon :name="category.icon" class="text-amber-400" size="20" />
                    <h3 class="circus-cat-title">{{ category.category }}</h3>
                  </div>
                  <div class="space-y-2">
                    <div
                      v-for="(drink, idx) in category.drinks"
                      :key="idx"
                      class="circus-drink-row"
                    >
                      <span class="circus-drink-name">{{ drink.name }}</span>
                      <div class="flex items-center gap-1.5">
                        <span class="circus-chf">CHF</span>
                        <span class="circus-price">{{ drink.price }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ══ FOOTER ══ -->
          <div class="text-center space-y-3 pt-4 pb-safe">
            <div class="circus-ornament-bar mb-3">
              <span class="ornament-line"></span>
              <span class="ornament-diamond">✦</span>
              <span class="ornament-line"></span>
            </div>
            <div class="flex items-center justify-center gap-6 text-amber-200/80 text-sm">
              <span class="flex items-center gap-2">
                <Icon name="fluent:ticket-diagonal-24-regular" class="w-4 h-4" />
                {{ t('afterparty.entryValue') }}
              </span>
              <span class="w-px h-4 bg-amber-400/40"></span>
              <span class="flex items-center gap-2">
                <Icon name="fluent:people-24-regular" class="w-4 h-4" />
                {{ t('afterparty.ageValue') }}
              </span>
            </div>
            <p class="text-amber-200/50 text-xs tracking-widest uppercase">{{ t('afterparty.dressCode') }}</p>
          </div>

        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* ════════════════════════════════════════
   VARIABLES & BASE
════════════════════════════════════════ */
:root {
  --cirque-red: #9B1D1D;
  --cirque-red-deep: #6B0E0E;
  --cirque-gold: #C9952A;
  --cirque-gold-light: #F0C060;
  --cirque-cream: #F5E6C8;
  --cirque-black: #100A04;
}

/* ════════════════════════════════════════
   FOND : CHAPITEAU
════════════════════════════════════════ */
.bg-cirque {
  background-color: #0E0806;
}

/* Rayures diagonales rouges/noires subtiles */
.circus-stripes {
  position: fixed;
  inset: 0;
  background-image: repeating-linear-gradient(
    -55deg,
    transparent,
    transparent 38px,
    rgba(139, 20, 20, 0.07) 38px,
    rgba(139, 20, 20, 0.07) 40px
  );
  pointer-events: none;
  z-index: 0;
}

/* Vignette */
.circus-vignette {
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.75) 100%);
  pointer-events: none;
  z-index: 1;
}

/* Lueurs chaudes */
.circus-glow-red {
  position: fixed;
  top: -20%;
  left: -10%;
  width: 60%;
  height: 60%;
  background: radial-gradient(circle, rgba(139,20,20,0.25) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
  animation: glow-breathe 6s ease-in-out infinite;
}
.circus-glow-gold {
  position: fixed;
  bottom: -10%;
  right: -10%;
  width: 50%;
  height: 50%;
  background: radial-gradient(circle, rgba(180,130,30,0.20) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
  animation: glow-breathe 8s ease-in-out infinite reverse;
}
@keyframes glow-breathe {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}

/* ════════════════════════════════════════
   ÉTOILES DÉCORATIVES
════════════════════════════════════════ */
.circus-stars {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}
.star {
  position: absolute;
  fill: var(--cirque-gold-light, #F0C060);
  opacity: 0.12;
  animation: star-twinkle 4s ease-in-out infinite;
}
.star-1 { width: 24px; top: 8%; left: 5%;  animation-delay: 0s; }
.star-2 { width: 16px; top: 15%; right: 8%; animation-delay: 1.2s; }
.star-3 { width: 30px; top: 40%; left: 3%; animation-delay: 0.6s; }
.star-4 { width: 18px; top: 60%; right: 5%; animation-delay: 2s; }
.star-5 { width: 22px; top: 80%; left: 10%; animation-delay: 1.5s; }

@keyframes star-twinkle {
  0%, 100% { opacity: 0.12; transform: scale(1) rotate(0deg); }
  50% { opacity: 0.35; transform: scale(1.2) rotate(15deg); }
}

/* ════════════════════════════════════════
   SAFE AREA
════════════════════════════════════════ */
.top-safe { top: env(safe-area-inset-top, 0px); }
.pb-safe  { padding-bottom: env(safe-area-inset-bottom, 20px); }

/* ════════════════════════════════════════
   BADGE "COMING SOON"
════════════════════════════════════════ */
.circus-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(155, 29, 29, 0.25);
  border: 1px solid rgba(201, 149, 42, 0.5);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #F0C060;
  font-family: 'Georgia', serif;
}
.circus-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #F0C060;
  animation: pulse-dot 1.5s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* ════════════════════════════════════════
   TITRE — AFFICHE CIRQUE
════════════════════════════════════════ */
.circus-eyebrow {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 11px;
  letter-spacing: 0.35em;
  color: #C9952A;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.circus-title {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: clamp(64px, 18vw, 88px);
  font-weight: 900;
  font-style: italic;
  line-height: 0.9;
  color: #F5E6C8;
  text-shadow:
    0 0 40px rgba(201,149,42,0.4),
    0 4px 0px rgba(139,20,20,0.8),
    3px 3px 0px rgba(139,20,20,0.6);
  letter-spacing: -0.02em;
  margin-bottom: 12px;
}

.circus-subtitle {
  font-family: 'Georgia', serif;
  font-size: 11px;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgba(245,230,200,0.6);
}

/* ════════════════════════════════════════
   ORNEMENTS
════════════════════════════════════════ */
.circus-ornament-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ornament-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(201,149,42,0.6), transparent);
}
.ornament-diamond {
  color: #C9952A;
  font-size: 14px;
  line-height: 1;
}

/* ════════════════════════════════════════
   COUNTDOWN
════════════════════════════════════════ */
.circus-countdown-wrap {
  position: relative;
}
.circus-countdown-wrap::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 8px;
  background: linear-gradient(135deg, #C9952A, #9B1D1D, #C9952A);
  z-index: 0;
  opacity: 0.7;
  animation: border-glow 3s ease-in-out infinite;
}
@keyframes border-glow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
.circus-countdown {
  position: relative;
  z-index: 1;
  padding: 20px 32px;
  background: rgba(14,8,6,0.95);
  border-radius: 6px;
  text-align: center;
}
.circus-countdown-label {
  font-family: 'Georgia', serif;
  font-size: 9px;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: rgba(201,149,42,0.8);
  margin-bottom: 8px;
}
.circus-countdown-value {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 32px;
  font-weight: 900;
  color: #F5E6C8;
  letter-spacing: 0.08em;
  text-shadow: 0 0 20px rgba(201,149,42,0.5);
}

/* ════════════════════════════════════════
   CARTE THÈME
════════════════════════════════════════ */
.circus-theme-card {
  position: relative;
  background: rgba(14,8,6,0.92);
  border: 1px solid rgba(201,149,42,0.35);
  border-radius: 8px;
  padding: 24px;
  overflow: hidden;
}
.circus-theme-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(139,20,20,0.1) 0%, transparent 60%);
  pointer-events: none;
}
/* Coins ornementaux */
.corner {
  position: absolute;
  color: #C9952A;
  font-size: 16px;
  opacity: 0.7;
  line-height: 1;
}
.corner-tl { top: 8px; left: 10px; }
.corner-tr { top: 8px; right: 10px; }
.corner-bl { bottom: 8px; left: 10px; }
.corner-br { bottom: 8px; right: 10px; }

.circus-theme-eyebrow {
  font-family: 'Georgia', serif;
  font-size: 9px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(201,149,42,0.7);
  margin-bottom: 2px;
}
.circus-theme-title {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 28px;
  font-weight: 900;
  font-style: italic;
  color: #F5E6C8;
  text-shadow: 0 0 15px rgba(201,149,42,0.4);
  line-height: 1.1;
}
.circus-theme-desc {
  font-family: 'Georgia', serif;
  color: rgba(245,230,200,0.75);
  font-size: 14px;
  line-height: 1.7;
  padding-left: 4px;
}

/* ════════════════════════════════════════
   GALERIE
════════════════════════════════════════ */
.gallery-curtain-left,
.gallery-curtain-right {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 48px;
  z-index: 10;
  pointer-events: none;
}
.gallery-curtain-left {
  left: 0;
  background: linear-gradient(90deg, #0E0806 0%, transparent 100%);
}
.gallery-curtain-right {
  right: 0;
  background: linear-gradient(-90deg, #0E0806 0%, transparent 100%);
}

.circus-gallery-item {
  box-shadow: 0 4px 24px rgba(139,20,20,0.3);
}

.gallery-stripe-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 8px,
    rgba(201,149,42,0.04) 8px,
    rgba(201,149,42,0.04) 9px
  );
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}
.group:hover .gallery-stripe-overlay {
  opacity: 1;
}

@keyframes scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.animate-scroll {
  display: flex;
  width: max-content;
  animation: scroll 25s linear infinite;
}
.animate-scroll:hover {
  animation-play-state: paused;
}

/* ════════════════════════════════════════
   INFOS PRATIQUES
════════════════════════════════════════ */
.circus-info-tile {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: rgba(14,8,6,0.75);
  border: 1px solid rgba(201,149,42,0.25);
  border-radius: 6px;
  transition: transform 0.2s, border-color 0.2s;
}
.circus-info-tile:hover {
  transform: scale(1.02);
  border-color: rgba(201,149,42,0.5);
}
.circus-tile-label {
  font-family: 'Georgia', serif;
  font-size: 10px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: rgba(201,149,42,0.7);
  margin-bottom: 2px;
}
.circus-tile-value {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 16px;
  font-weight: 700;
  color: #F5E6C8;
}

/* ════════════════════════════════════════
   MENU BOISSONS
════════════════════════════════════════ */
.circus-menu-card {
  background: rgba(14,8,6,0.9);
  border: 1px solid rgba(201,149,42,0.3);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(139,20,20,0.2);
}

/* En-tête du menu avec fond rayé */
.circus-menu-header {
  background: repeating-linear-gradient(
    90deg,
    rgba(139,20,20,0.18),
    rgba(139,20,20,0.18) 20px,
    rgba(14,8,6,0.0) 20px,
    rgba(14,8,6,0.0) 40px
  );
  border-bottom: 1px solid rgba(201,149,42,0.25);
  padding: 20px 24px;
}

.circus-menu-title {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 22px;
  font-weight: 900;
  font-style: italic;
  color: #F5E6C8;
}
.circus-menu-sub {
  font-size: 10px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: rgba(201,149,42,0.65);
  font-family: 'Georgia', serif;
}
.circus-payment-badge {
  padding: 6px 12px;
  border: 1px solid rgba(201,149,42,0.4);
  border-radius: 4px;
  background: rgba(201,149,42,0.08);
}
.circus-payment-badge span {
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #C9952A;
  font-family: 'Georgia', serif;
}

.circus-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
}
.div-line {
  flex: 1;
  height: 1px;
  background: rgba(201,149,42,0.25);
}
.div-icon {
  color: rgba(201,149,42,0.6);
  font-size: 12px;
}

.circus-cat-title {
  font-family: 'Georgia', serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #C9952A;
}

.circus-drink-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 4px;
  background: rgba(201,149,42,0.04);
  border: 1px solid rgba(201,149,42,0.12);
  transition: background 0.2s, border-color 0.2s;
}
.circus-drink-row:hover {
  background: rgba(201,149,42,0.10);
  border-color: rgba(201,149,42,0.30);
}
.circus-drink-name {
  font-family: 'Georgia', serif;
  font-size: 14px;
  font-weight: 500;
  color: #F5E6C8;
}
.circus-chf {
  font-size: 11px;
  font-weight: 700;
  color: rgba(245,230,200,0.5);
  letter-spacing: 0.05em;
}
.circus-price {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 20px;
  font-weight: 900;
  font-style: italic;
  color: #F0C060;
  text-shadow: 0 0 12px rgba(201,149,42,0.5);
}
</style>