<script setup lang="ts">
/**
 * UiKeyValueList
 * Composant générique pour afficher une liste de paires clé/valeur avec différents styles.
 *
 * Variants:
 * - 'divider' : Une liste avec une ligne séparatrice discrète entre chaque élément (ex: infos.vue)
 * - 'dashed'  : Une liste avec une ligne pointillée/tirée entre le label et la valeur (ex: menus dans food.vue)
 * - 'boxed'   : Une liste où chaque élément est encapsulé dans une boîte avec un fond coloré (ex: boissons dans afterparty.vue)
 */

interface KeyValueItem {
  label?: string | number;
  value?: string | number;
  [key: string]: any;
}

const props = withDefaults(defineProps<{
  items: KeyValueItem[];
  variant?: 'divider' | 'dashed' | 'boxed';
  // Props spécifiques au style "boxed" et "dashed" (optionnelles)
  color?: 'violet' | 'blue' | 'cyan' | 'emerald' | 'orange' | 'pink' | 'white';
}>(), {
  variant: 'divider',
  color: 'violet'
});

const getBoxClasses = () => {
  if (props.variant !== 'boxed') return '';
  const colors = {
    violet: 'bg-violet-500/5 hover:bg-violet-500/10 border-violet-500/20 text-violet-400',
    blue: 'bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20 text-blue-400',
    cyan: 'bg-cyan-500/5 hover:bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    emerald: 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    orange: 'bg-orange-500/5 hover:bg-orange-500/10 border-orange-500/20 text-orange-400',
    pink: 'bg-pink-500/5 hover:bg-pink-500/10 border-pink-500/20 text-pink-400',
    white: 'bg-white/5 hover:bg-white/10 border-white/20 text-white',
  };
  return colors[props.color] || colors.violet;
};

const getTextColor = () => {
  const colors = {
    violet: 'text-violet-400',
    blue: 'text-blue-400',
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    orange: 'text-orange-400',
    pink: 'text-pink-400',
    white: 'text-white',
  };
  return colors[props.color] || colors.violet;
};
</script>

<template>
  <component :is="variant === 'dashed' ? 'ul' : 'div'" :class="{ 'space-y-3': variant === 'dashed', 'space-y-0': variant === 'divider', 'space-y-2': variant === 'boxed' }">
    <component
      :is="variant === 'dashed' ? 'li' : 'div'"
      v-for="(item, index) in items"
      :key="index"
      :class="[
        variant === 'divider' ? 'flex items-start justify-between gap-4 border-b border-white/10 pb-3 mt-3 first:mt-0 last:border-0 last:pb-0' : '',
        variant === 'dashed'  ? 'flex items-end justify-between text-sm group/item' : '',
        variant === 'boxed'   ? `flex items-center justify-between p-3 rounded-xl transition-colors border ${getBoxClasses().split(' text-')[0]}` : ''
      ]"
    >
      <!-- DASHED VARIANT -->
      <template v-if="variant === 'dashed'">
        <span class="text-white/90 font-medium relative pr-2 z-10">
          <slot name="label" :item="item">{{ item.label }}</slot>
        </span>
        <span class="flex-grow border-b border-dashed border-white/10 mb-1 mx-1"></span>
        <span :class="['font-bold pl-2 z-10', getTextColor()]">
          <slot name="value" :item="item">{{ item.value }}</slot>
        </span>
      </template>

      <!-- DIVIDER OR BOXED VARIANT -->
      <template v-else>
        <!-- Customisation complète via les slots ou affichage par défaut -->
        <slot name="label" :item="item">
          <p :class="variant === 'boxed' ? 'text-white text-sm font-medium' : 'text-white/70 text-sm min-w-36'">
            {{ item.label }}
          </p>
        </slot>
        <slot name="value" :item="item">
          <div :class="variant === 'boxed' ? 'flex items-center gap-1.5' : 'text-white text-sm text-right'">
            <span v-if="variant === 'boxed'" class="text-sm font-mono font-bold text-white/80">CHF</span>
            <span :class="variant === 'boxed' ? `text-lg font-mono font-bold ${getTextColor()}` : ''">
              {{ item.value }}
            </span>
          </div>
        </slot>
      </template>
    </component>
  </component>
</template>
