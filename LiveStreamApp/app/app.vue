<template>
  <div class="min-h-screen bg-[#0B1120] relative overflow-hidden">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage :keepalive="{ max: 10 }" />
    </NuxtLayout>
  </div>
</template>
