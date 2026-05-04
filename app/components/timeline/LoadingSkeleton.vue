<template>
  <div class="space-y-3">
    <div
      v-for="item in 3"
      :key="item"
      class="timeline-card animate-pulse rounded-2xl p-4"
    >
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-full bg-[var(--surface-line)]" />
        <div class="space-y-2">
          <div class="h-3 w-28 rounded bg-[var(--surface-line)]" />
          <div class="h-3 w-16 rounded bg-[var(--surface-line)] opacity-60" />
        </div>
      </div>
      <div class="mt-4 space-y-2">
        <div class="h-3 w-full rounded bg-[var(--surface-line)]" />
        <div class="h-3 w-11/12 rounded bg-[var(--surface-line)]" />
        <div class="h-3 w-3/4 rounded bg-[var(--surface-line)] opacity-60" />
      </div>
    </div>
  </div>
</template>