<template>
  <footer class="footer-bar">
    <p>© {{ currentYear }} School Management ERP. All rights reserved.</p>
    <span>Version 1.0.0</span>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.footer-bar {
  min-height: 56px;
  padding: 12px 22px;
  background: #ffffff;
  border-top: 1px solid #e5eaf3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  color: #64748b;
  font-size: 13px;
}

.footer-bar p {
  margin: 0;
}

.footer-bar span {
  background: #eef4ff;
  color: #2563eb;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 600;
}

@media (max-width: 700px) {
  .footer-bar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>