<template>
  <NuxtLayout>
    <NuxtPage v-slot="{ Component }">
      <transition mode="out-in" name="fade-slide-y">
        <component :is="Component" />
      </transition>
    </NuxtPage>
  </NuxtLayout>
</template>
