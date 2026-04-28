import type { Component } from 'vue'
import {
  Bell,
  Compass,
  House,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  UserCircle2
} from 'lucide-vue-next'

export const navigationIcons: Record<string, Component> = {
  home: House,
  notifications: Bell,
  messages: Mail,
  search: Search,
  explore: Compass,
  profile: UserCircle2,
  more: MoreHorizontal,
  compose: Plus,
}
