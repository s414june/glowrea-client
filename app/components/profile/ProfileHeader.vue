<script setup lang="ts">
import type { ProfileSummary } from '#shared/types/profile'

defineProps<{
  profile: ProfileSummary
}>()
</script>

<template>
  <div class="timeline-card overflow-hidden rounded-2xl">
    <!-- 封面 -->
    <div class="h-36 w-full overflow-hidden bg-[var(--surface-line)] sm:h-44">
      <img
        v-if="profile.header && !profile.header.endsWith('/headers/original/missing.png')"
        :src="profile.header"
        :alt="`${profile.displayName || profile.username} 的封面`"
        class="h-full w-full object-cover"
      >
      <div v-else class="h-full w-full bg-gradient-to-br from-[var(--surface-line)] to-[var(--surface-bg)]" />
    </div>

    <!-- 頭像 + 資訊 -->
    <div class="px-5 pb-5">
      <div class="-mt-8 mb-3 flex items-end justify-between">
        <img
          :src="profile.avatar"
          :alt="profile.displayName || profile.username"
          class="h-16 w-16 rounded-full border-4 border-[var(--surface-card)] object-cover sm:h-20 sm:w-20"
        >
      </div>

      <p class="text-lg font-semibold leading-tight text-[var(--text-main)]">
        {{ profile.displayName || profile.username }}
      </p>
      <p class="mt-0.5 text-sm text-[var(--text-subtle)]">
        @{{ profile.acct }}
      </p>

      <div
        v-if="profile.note"
        class="prose prose-stone mt-3 max-w-none text-sm"
        v-html="profile.note"
      />

      <div class="mt-4 flex gap-5 text-sm">
        <span class="text-[var(--text-main)]">
          <span class="font-semibold">{{ profile.statusesCount.toLocaleString() }}</span>
          <span class="ml-1 text-[var(--text-subtle)]">貼文</span>
        </span>
        <span class="text-[var(--text-main)]">
          <span class="font-semibold">{{ profile.followingCount.toLocaleString() }}</span>
          <span class="ml-1 text-[var(--text-subtle)]">追蹤中</span>
        </span>
        <span class="text-[var(--text-main)]">
          <span class="font-semibold">{{ profile.followersCount.toLocaleString() }}</span>
          <span class="ml-1 text-[var(--text-subtle)]">追蹤者</span>
        </span>
      </div>
    </div>
  </div>
</template>
