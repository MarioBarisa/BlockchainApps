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
  <div>
    <!-- Hero -->
    <section class="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-16">
      <div class="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <span class="badge badge-primary badge-outline gap-1.5 py-3 font-semibold">
            <AppIcon name="sparkle" :size="14" />
            Web3 za susjede
          </span>
          <h1 class="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Mali projekti,<br />
            <span class="text-primary">veliki susjedi.</span>
          </h1>
          <p class="mt-4 max-w-xl text-base text-base-content/70 sm:text-lg">
            {{ appConfig.tagline }}
          </p>
          <div class="mt-7 flex flex-wrap gap-3">
            <RouterLink to="/explore" class="btn btn-primary gap-2 rounded-2xl">
              Istraži projekte
              <AppIcon name="arrow-right" :size="18" />
            </RouterLink>
            <RouterLink to="/profile" class="btn btn-ghost gap-2 rounded-2xl border border-base-300">
              <AppIcon name="user" :size="18" />
              Moj profil
            </RouterLink>
          </div>
        </div>

        <!-- Dekorativna kartica umjesto slike -->
        <div class="relative">
          <div class="rounded-[2rem] border border-base-300/70 bg-base-100 p-6 shadow-lg">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="grid size-10 place-items-center rounded-2xl bg-primary text-primary-content">
                  <AppIcon name="hand-coins" :size="20" />
                </span>
                <div>
                  <p class="text-sm font-bold">Kolektivna kupnja kave</p>
                  <p class="text-xs text-base-content/50">Hrana · kvart</p>
                </div>
              </div>
              <span class="badge badge-success badge-sm gap-1 font-semibold">
                <AppIcon name="check-circle" :size="12" />
                aktivno
              </span>
            </div>
            <div class="mt-5">
              <div class="mb-1.5 flex items-baseline justify-between">
                <span class="text-2xl font-extrabold">2.4 ETH</span>
                <span class="text-xs text-base-content/50">od 3 ETH</span>
              </div>
              <progress class="progress progress-primary h-2.5 w-full" value="80" max="100"></progress>
              <div class="mt-2 flex items-center justify-between text-xs text-base-content/50">
                <span>34 podupiratelja</span>
                <span class="font-semibold text-primary">80%</span>
              </div>
            </div>
            <div class="mt-5 grid grid-cols-2 gap-3">
              <div class="rounded-2xl bg-base-200/70 p-3">
                <p class="text-[11px] uppercase tracking-wide text-base-content/50">Mreža</p>
                <p class="mt-0.5 text-sm font-bold">{{ appConfig.network.name }}</p>
              </div>
              <div class="rounded-2xl bg-base-200/70 p-3">
                <p class="text-[11px] uppercase tracking-wide text-base-content/50">Ugovor</p>
                <p class="mt-0.5 font-mono text-xs font-semibold">0xTBD...000</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Statistike -->
    <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div class="grid gap-4 sm:grid-cols-3">
        <StatCard v-for="stat in stats" :key="stat.title" v-bind="stat" />
      </div>
    </section>

    <!-- Istaknuti projekti -->
    <section class="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Istaknuto"
        title="Ideje koje trebaju tvoj glas"
        description="Tri projekta iz kvarta kojima nedostaje najmanje do cilja."
      >
        <template #action>
          <RouterLink to="/explore" class="btn btn-ghost btn-sm gap-1 rounded-xl">
            Vidi sve
            <AppIcon name="arrow-up-right" :size="16" />
          </RouterLink>
        </template>
      </SectionHeading>

      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ProjectCard v-for="project in featuredProjects" :key="project.id" :project="project" />
      </div>
    </section>

    <!-- Kako radi -->
    <section class="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <SectionHeading eyebrow="Kako radi" title="Tri koraka do prve podrške" />
      <div class="mt-6 grid gap-4 sm:grid-cols-3">
        <div
          v-for="(step, index) in steps"
          :key="step.title"
          class="rounded-3xl border border-base-300/70 bg-base-100 p-5 shadow-sm"
        >
          <div class="flex items-center gap-3">
            <span class="grid size-10 place-items-center rounded-2xl bg-accent/15 text-accent">
              <AppIcon :name="step.icon" :size="20" />
            </span>
            <span class="text-xs font-bold uppercase tracking-widest text-base-content/40">
              Korak {{ index + 1 }}
            </span>
          </div>
          <h3 class="mt-4 font-bold">{{ step.title }}</h3>
          <p class="mt-1 text-sm text-base-content/60">{{ step.text }}</p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
      <div class="rounded-[2rem] bg-primary px-6 py-10 text-primary-content sm:px-10">
        <div class="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-2xl font-extrabold tracking-tight sm:text-3xl">Imaš ideju za kvart?</h2>
            <p class="mt-1 max-w-xl text-sm text-primary-content/80">
              Predloži projekt i pusti susjede da odluče. Sve je javno i provjerljivo.
            </p>
          </div>
          <RouterLink to="/profile" class="btn btn-neutral gap-2 rounded-2xl">
            <AppIcon name="rocket-launch" :size="18" />
            Predloži projekt
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>
