<script setup lang="ts">
import type { StatusContext } from '#shared/types/status'

defineProps<{
  context: StatusContext
}>()
</script>

<template>
  <section class="mt-4 space-y-4">
    <div
      v-if="context.ancestors.length"
      class="timeline-card rounded-2xl p-4"
    >
      <h3 class="mb-3 text-sm font-semibold text-[var(--text-main)]">
        上文
      </h3>
      <ul class="space-y-3">
        <li
          v-for="item in context.ancestors"
          :key="item.id"
          class="rounded-xl border border-[var(--surface-line)] bg-[var(--surface-bg)] p-3"
        >
          <p class="text-xs text-[var(--text-subtle)]">
            {{ item.account.displayName || item.account.username }}
          </p>
          <div
            class="mastodon-content mt-1 max-w-none text-sm"
            v-html="item.content"
          />
        </li>
      </ul>
    </div>

    <div
      v-if="context.descendants.length"
      class="timeline-card rounded-2xl p-4"
    >
      <h3 class="mb-3 text-sm font-semibold text-[var(--text-main)]">
        回覆
      </h3>
      <ul class="space-y-3">
        <li
          v-for="item in context.descendants"
          :key="item.id"
          class="rounded-xl border border-[var(--surface-line)] bg-[var(--surface-bg)] p-3"
        >
          <p class="text-xs text-[var(--text-subtle)]">
            {{ item.account.displayName || item.account.username }}
          </p>
          <div
            class="mastodon-content mt-1 max-w-none text-sm"
            v-html="item.content"
          />
        </li>
      </ul>
    </div>
  </section>
</template>
