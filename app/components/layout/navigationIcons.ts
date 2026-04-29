import type { Component } from 'vue'
import {
  Bell,
  House,
  MoreHorizontal,
  Plus,
  Search,
  UserCircle2
} from 'lucide-vue-next'

export const navigationIcons: Record<string, Component> = {
  home: House,
  notifications: Bell,
  search: Search,
  explore: Search,
  profile: UserCircle2,
  more: MoreHorizontal,
  compose: Plus,
}
