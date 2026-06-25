<template>
  <div class="app-layout">
    <SidebarMenu
      :collapsed="isSidebarCollapsed"
      :mobile-open="isMobileSidebarOpen"
      @close-mobile="isMobileSidebarOpen = false"
    />

    <div
      v-if="isMobileSidebarOpen"
      class="mobile-overlay"
      @click="isMobileSidebarOpen = false"
    ></div>

    <div class="main-area" :class="{ collapsed: isSidebarCollapsed }">
      <HeaderBar
        @toggle-sidebar="toggleSidebar"
        @toggle-collapse="isSidebarCollapsed = !isSidebarCollapsed"
      />

      <main class="page-content">
        <Breadcrumb />

        <PageTitle />

        <section class="content-card">
          <RouterView />
        </section>
      </main>

      <FooterBar />
    </div>
  </div>
</template>



<script setup>
import { ref } from 'vue'
import SidebarMenu from './SidebarMenu.vue'
import HeaderBar from './HeaderBar.vue'
import FooterBar from './FooterBar.vue'
import Breadcrumb from './Breadcrumb.vue'
import PageTitle from './PageTitle.vue'

const isSidebarCollapsed = ref(false)
const isMobileSidebarOpen = ref(false)

const toggleSidebar = () => {
  if (window.innerWidth <= 900) {
    isMobileSidebarOpen.value = true
  } else {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
  }
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  width: 100%;
  background: #f4f7fb;
  position: relative;
}

.main-area {
  min-height: 100vh;
  margin-left: 270px;
  width: calc(100% - 270px);
  transition: margin-left 0.25s ease;
  display: flex;
  flex-direction: column;
}

.main-area.collapsed {
  margin-left: 86px;
  width: calc(100% - 86px);
}

.page-content {
  flex: 1;
  padding: 22px;
}

.content-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  border: 1px solid #e5eaf3;
  min-height: 500px;
}

.mobile-overlay {
  display: none;
}

@media (max-width: 900px) {
  .main-area,
  .main-area.collapsed {
    margin-left: 0;
    width: 100%;
  }

  .page-content {
    padding: 14px;
  }

  .content-card {
    padding: 16px;
    border-radius: 14px;
  }

  .mobile-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    z-index: 90;
  }
}
</style>
