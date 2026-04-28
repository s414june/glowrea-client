<script setup lang="ts">
import type { ProfileSummary } from '#shared/types/profile'

defineProps<{
  profile: ProfileSummary
}>()
</script>

<template>
  <div class="timeline-card overflow-hidden rounded-2xl">
    <!-- 封面 -->
    <div class="h-36 w-full overflow-hidden bg-stone-100 sm:h-44">
      <img
        v-if="profile.header && !profile.header.endsWith('/headers/original/missing.png')"
        :src="profile.header"
        :alt="`${profile.displayName || profile.username} 的封面`"
        class="h-full w-full object-cover"
      >
      <div v-else class="h-full w-full bg-gradient-to-br from-stone-100 to-stone-200" />
    </div>

    <!-- 頭像 + 資訊 -->
    <div class="px-5 pb-5">
      <div class="-mt-8 mb-3 flex items-end justify-between">
        <img
          :src="profile.avatar"
          :alt="profile.displayName || profile.username"
          class="h-16 w-16 rounded-full border-4 border-[#fffdf9] object-cover sm:h-20 sm:w-20"
        >
      </div>

      <p class="text-lg font-semibold leading-tight text-stone-900">
        {{ profile.displayName || profile.username }}
      </p>
      <p class="mt-0.5 text-sm text-stone-500">
        @{{ profile.acct }}
      </p>

      <div
        v-if="profile.note"
        class="prose prose-stone mt-3 max-w-none text-sm"
        v-html="profile.note"
      />

      <div class="mt-4 flex gap-5 text-sm">
        <span class="text-stone-700">
          <span class="font-semibold">{{ profile.statusesCount.toLocaleString() }}</span>
          <span class="ml-1 text-stone-500">貼文</span>
        </span>
        <span class="text-stone-700">
          <span class="font-semibold">{{ profile.followingCount.toLocaleString() }}</span>
          <span class="ml-1 text-stone-500">追蹤中</span>
        </span>
        <span class="text-stone-700">
          <span class="font-semibold">{{ profile.followersCount.toLocaleString() }}</span>
          <span class="ml-1 text-stone-500">追蹤者</span>
        </span>
      </div>
    </div>
  </div>
</template>
