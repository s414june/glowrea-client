<script setup lang="ts">
import type { ProfileSummary } from '#shared/types/profile'
import { resolveCustomEmojiText } from '~/utils/emoji'
import ImageLightbox from '~/components/status/ImageLightbox.vue'

defineProps<{
  profile: ProfileSummary
}>()

const { profilePath } = useAccountNavigation()
const lightboxOpen = ref(false)
const lightboxImage = ref<{ id: string; url: string; description: string } | null>(null)

function openImage(url: string, description: string, id: string): void {
  lightboxImage.value = { id, url, description }
  lightboxOpen.value = true
}
</script>

<template>
  <div class="timeline-card overflow-hidden rounded-2xl">
    <!-- 封面 -->
    <div class="h-36 w-full overflow-hidden bg-[var(--surface-line)] sm:h-44">
      <button
        v-if="profile.header && !profile.header.endsWith('/headers/original/missing.png')"
        type="button"
        class="block h-full w-full cursor-zoom-in"
        :aria-label="`放大檢視 ${profile.displayName || profile.username} 的封面`"
        @click="openImage(profile.header, `${profile.displayName || profile.username} 的封面`, 'profile-header')"
      >
        <img
          :src="profile.header"
          :alt="`${profile.displayName || profile.username} 的封面`"
          class="h-full w-full object-cover"
        >
      </button>
      <div v-else class="h-full w-full bg-gradient-to-br from-[var(--surface-line)] to-[var(--surface-bg)]" />
    </div>

    <!-- 頭像 + 資訊 -->
    <div class="px-5 pb-5">
      <div class="-mt-8 mb-3 flex items-end justify-between">
        <button
          type="button"
          class="cursor-zoom-in rounded-full"
          :aria-label="`放大檢視 ${profile.displayName || profile.username} 的頭貼`"
          @click="openImage(profile.avatar, `${profile.displayName || profile.username} 的頭貼`, 'profile-avatar')"
        >
          <img
            :src="profile.avatar"
            :alt="profile.displayName || profile.username"
            class="h-16 w-16 rounded-full border-4 border-[var(--surface-card)] object-cover sm:h-20 sm:w-20"
          >
        </button>
      </div>

      <NuxtLink :to="profilePath(profile)" class="text-lg font-semibold leading-tight text-[var(--text-main)] hover:underline">
        <span v-html="resolveCustomEmojiText(profile.displayName || profile.username, profile.emojis ?? [])" />
      </NuxtLink>
      <NuxtLink :to="profilePath(profile)" class="mt-0.5 block text-sm text-[var(--text-subtle)] hover:underline">
        @{{ profile.acct }}
      </NuxtLink>

      <div
        v-if="profile.note"
        class="mastodon-content mt-3 max-w-none text-sm"
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

  <ImageLightbox
    v-if="lightboxOpen && lightboxImage"
    :images="[lightboxImage]"
    @close="lightboxOpen = false"
  />
</template>
