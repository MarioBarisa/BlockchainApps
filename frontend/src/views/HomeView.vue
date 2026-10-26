<script setup lang="ts">
import { appConfig } from '@/config/app'
import AppIcon from '@/components/AppIcon.vue'
import StatCard from '@/components/StatCard.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import { featuredProjects } from '@/data/mockProjects'

const stats = [
  { title: 'Projekata', value: '8', hint: 'Ideje susjeda koje čekaju podršku.', icon: 'rocket-launch' as const },
  { title: 'Podupiratelja', value: '172', hint: 'Ljudi iz kvarta koji su već sudjelovali.', icon: 'users-three' as const },
  { title: 'Prikupljeno', value: '10.6 ETH', hint: 'Ukupno kroz sve aktivne projekte.', icon: 'coin' as const },
]

const steps = [
  { title: 'Poveži wallet', text: 'Tvoja adresa je tvoj identitet. Bez registracije i lozinki.', icon: 'wallet' as const },
  { title: 'Odaberi projekt', text: 'Pregledaj ideje susjeda i vidi koliko im još nedostaje.', icon: 'compass' as const },
  { title: 'Podupri i prati', text: 'Svaki ether je vidljiv na blockchainu, od prvog do zadnjeg.', icon: 'shield-check' as const },
]
</script>

<template>
  <div class="page-shell space-y-6">
    <!-- Hero -->
    <section class="app-panel p-5">
      <div class="grid items-center gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <span class="badge badge-primary badge-outline gap-1.5 font-semibold">
            <AppIcon name="sparkle" :size="14" />
            Web3 za susjede
          </span>
          <h1 class="mt-4 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            Mali projekti,<br />
            <span class="text-primary">veliki susjedi.</span>
          </h1>
          <p class="mt-3 max-w-xl text-sm text-base-content/70">
            {{ appConfig.tagline }}
          </p>
          <div class="mt-4 flex flex-wrap gap-2">
            <RouterLink to="/explore" class="btn btn-primary gap-2 rounded-md">
              Istraži projekte
              <AppIcon name="arrow-right" :size="18" />
            </RouterLink>
            <RouterLink to="/profile" class="btn btn-ghost gap-2 rounded-md border border-base-300">
              <AppIcon name="user" :size="18" />
              Moj profil
            </RouterLink>
          </div>
        </div>

        <!-- Dekorativna kartica umjesto slike -->
        <div class="relative">
          <div class="rounded-lg border border-base-300 bg-base-200/50 p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="grid size-8 place-items-center rounded-md bg-primary text-primary-content">
                  <AppIcon name="hand-coins" :size="20" />
                </span>
                <div>
                  <p class="text-sm font-bold">Kolektivna kupnja kave</p>
                  <p class="text-xs text-base-content/65">Hrana · kvart</p>
                </div>
              </div>
              <span class="badge badge-success badge-sm gap-1 font-semibold">
                <AppIcon name="check-circle" :size="12" />
                aktivno
              </span>
            </div>
            <div class="mt-4">
              <div class="mb-1.5 flex items-baseline justify-between">
                <span class="font-mono text-xl font-semibold tabular-nums">2.4 ETH</span>
                <span class="text-xs text-base-content/65">od 3 ETH</span>
              </div>
              <progress class="progress progress-primary h-1.5 w-full" value="80" max="100"></progress>
              <div class="mt-2 flex items-center justify-between text-xs text-base-content/65">
                <span>34 podupiratelja</span>
                <span class="font-semibold text-primary">80%</span>
              </div>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <div class="rounded-md border border-base-300 bg-base-100 px-3 py-2">
                <p class="text-[11px] uppercase tracking-wide text-base-content/65">Mreža</p>
                <p class="mt-0.5 text-sm font-bold">{{ appConfig.network.name }}</p>
              </div>
              <div class="rounded-md border border-base-300 bg-base-100 px-3 py-2">
                <p class="text-[11px] uppercase tracking-wide text-base-content/65">Ugovor</p>
                <p class="mt-0.5 font-mono text-xs font-semibold">0xTBD...000</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Statistike -->
    <section>
      <div class="grid gap-3 sm:grid-cols-3">
        <StatCard v-for="stat in stats" :key="stat.title" v-bind="stat" />
      </div>
    </section>

    <!-- Istaknuti projekti -->
    <section>
      <SectionHeading
        eyebrow="Istaknuto"
        title="Ideje koje trebaju tvoj glas"
        description="Tri projekta iz kvarta kojima nedostaje najmanje do cilja."
      >
        <template #action>
          <RouterLink to="/explore" class="btn btn-ghost btn-sm gap-1 rounded-md">
            Vidi sve
            <AppIcon name="arrow-up-right" :size="16" />
          </RouterLink>
        </template>
      </SectionHeading>

      <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ProjectCard v-for="project in featuredProjects" :key="project.id" :project="project" />
      </div>
    </section>

    <!-- Kako radi -->
    <section>
      <SectionHeading eyebrow="Kako radi" title="Tri koraka do prve podrške" />
      <div class="mt-4 grid gap-3 sm:grid-cols-3">
        <div
          v-for="(step, index) in steps"
          :key="step.title"
          class="app-panel p-4"
        >
          <div class="flex items-center gap-3">
            <span class="grid size-8 place-items-center rounded-md bg-accent/15 text-accent">
              <AppIcon :name="step.icon" :size="20" />
            </span>
            <span class="text-xs font-bold uppercase tracking-wide text-base-content/70">
              Korak {{ index + 1 }}
            </span>
          </div>
          <h3 class="mt-3 font-semibold">{{ step.title }}</h3>
          <p class="mt-1 text-sm text-base-content/70">{{ step.text }}</p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section>
      <div class="app-panel border-l-4 border-l-primary px-5 py-4">
        <div class="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold tracking-tight">Imaš ideju za kvart?</h2>
            <p class="mt-1 max-w-xl text-sm text-base-content/70">
              Predloži projekt i pusti susjede da odluče. Sve je javno i provjerljivo.
            </p>
          </div>
          <RouterLink to="/profile" class="btn btn-primary gap-2 rounded-md">
            <AppIcon name="rocket-launch" :size="18" />
            Predloži projekt
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>
