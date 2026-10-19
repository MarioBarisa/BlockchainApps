<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import { categories, projects, type ProjectCategory } from '@/data/mockProjects'

const search = ref('')
const activeCategory = ref<ProjectCategory | 'Sve'>('Sve')

function resetFilters() {
  search.value = ''
  activeCategory.value = 'Sve'
}

// Filtriranje je lokalno - kasnije ide preko ugovora / indexera
const filteredProjects = computed(() => {
  const term = search.value.trim().toLowerCase()

  return projects.filter((project) => {
    const matchesCategory = activeCategory.value === 'Sve' || project.category === activeCategory.value
    const matchesTerm =
      term === '' ||
      project.title.toLowerCase().includes(term) ||
      project.description.toLowerCase().includes(term)

    return matchesCategory && matchesTerm
  })
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
    <SectionHeading
      eyebrow="Istraži"
      title="Projekti u zajednici"
      description="Pregledaj ideje susjeda, filtriraj po kategoriji i pronađi onu koju želiš poduprijeti."
    />

    <!-- Pretraga i filtri -->
    <div class="mt-6 flex flex-col gap-3">
      <label class="input input-bordered flex w-full items-center gap-2 rounded-2xl sm:max-w-md">
        <AppIcon name="magnifying-glass" :size="18" class="text-base-content/40" />
        <input v-model="search" type="search" class="grow" placeholder="Pretraži projekte..." />
      </label>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          class="btn btn-sm rounded-xl"
          :class="activeCategory === category ? 'btn-primary' : 'btn-ghost border border-base-300'"
          @click="activeCategory = category"
        >
          {{ category }}
        </button>
      </div>
    </div>

    <p class="mt-6 text-sm text-base-content/50">
      Pronađeno {{ filteredProjects.length }} od {{ projects.length }} projekata
    </p>

    <!-- Lista projekata -->
    <div v-if="filteredProjects.length" class="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ProjectCard v-for="project in filteredProjects" :key="project.id" :project="project" />
    </div>

    <!-- Prazno stanje -->
    <div v-else class="mt-3 rounded-3xl border border-dashed border-base-300 bg-base-100 p-10 text-center">
      <span class="mx-auto grid size-12 place-items-center rounded-2xl bg-base-200 text-base-content/50">
        <AppIcon name="magnifying-glass" :size="24" />
      </span>
      <h3 class="mt-4 font-bold">Nema rezultata</h3>
      <p class="mt-1 text-sm text-base-content/60">
        Pokušaj drugačiji pojam ili odaberi drugu kategoriju.
      </p>
      <button
        type="button"
        class="btn btn-ghost btn-sm mt-4 rounded-xl border border-base-300"
        @click="resetFilters"
      >
        Očisti filtre
      </button>
    </div>
  </div>
</template>
