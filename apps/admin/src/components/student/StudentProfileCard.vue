<template>
  <BaseCard class="profile-card">
    <div class="profile-top">
      <div class="avatar">
        <img v-if="student.photoUrl" :src="student.photoUrl" alt="Student photo" />
        <span v-else>{{ initials }}</span>
      </div>

      <div class="profile-main">
        <div class="profile-title">
          <h3>{{ fullName }}</h3>
          <StudentStatusBadge :status="student.status" />
        </div>

        <p>
          Admission No: <strong>{{ student.admissionNo || 'N/A' }}</strong>
        </p>

        <div class="quick-info">
          <span>{{ student.academic?.className || 'No Class' }}</span>
          <span>{{ student.academic?.sectionName || 'No Section' }}</span>
          <span>Roll: {{ student.academic?.rollNo || 'N/A' }}</span>
        </div>
      </div>
    </div>

    <div class="profile-info-grid">
      <div>
        <span>Mobile</span>
        <strong>{{ student.mobile || 'N/A' }}</strong>
      </div>

      <div>
        <span>Gender</span>
        <strong>{{ student.gender || 'N/A' }}</strong>
      </div>

      <div>
        <span>Date of Birth</span>
        <strong>{{ dateOfBirth }}</strong>
      </div>

      <div>
        <span>Blood Group</span>
        <strong>{{ student.bloodGroup || 'N/A' }}</strong>
      </div>

      <div>
        <span>Guardian</span>
        <strong>{{ student.guardian?.guardianName || student.guardian?.fatherName || 'N/A' }}</strong>
      </div>

      <div>
        <span>Guardian Mobile</span>
        <strong>{{ student.guardian?.guardianMobile || 'N/A' }}</strong>
      </div>
    </div>

    <div class="profile-actions">
      <BaseButton type="button" @click="$emit('view', student)">
        View Details
      </BaseButton>

      <BaseButton type="button" class="secondary-btn" @click="$emit('edit', student)">
        Edit
      </BaseButton>
    </div>
  </BaseCard>
</template>

<script setup>
import { computed } from 'vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import StudentStatusBadge from './StudentStatusBadge.vue'
import { formatDateForDisplay } from '@/utils/dateFormat'

const props = defineProps({
  student: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['view', 'edit'])

const fullName = computed(() => {
  const firstName = props.student.firstName || ''
  const lastName = props.student.lastName || ''
  return `${firstName} ${lastName}`.trim() || 'Unnamed Student'
})

const initials = computed(() => {
  return fullName.value
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
})

const dateOfBirth = computed(() => {
  return formatDateForDisplay(props.student.dateOfBirth || props.student.date_of_birth, 'N/A')
})
</script>

<style scoped>
.profile-card {
  padding: 24px;
  border-radius: 24px;
}

.profile-top {
  display: flex;
  gap: 18px;
  align-items: center;
}

.avatar {
  width: 88px;
  height: 88px;
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 26px;
  font-weight: 800;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-main {
  flex: 1;
}

.profile-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.profile-title h3 {
  margin: 0;
  font-size: 22px;
  color: #0f172a;
}

.profile-main p {
  margin: 8px 0 0;
  color: #64748b;
}

.quick-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.quick-info span {
  padding: 7px 10px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
}

.profile-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 22px;
}

.profile-info-grid div {
  padding: 14px;
  border-radius: 16px;
  background: #f8fafc;
}

.profile-info-grid span {
  display: block;
  color: #64748b;
  font-size: 12px;
  margin-bottom: 5px;
}

.profile-info-grid strong {
  color: #0f172a;
  font-size: 14px;
}

.profile-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.secondary-btn {
  background: #f1f5f9 !important;
  color: #334155 !important;
}

@media (max-width: 768px) {
  .profile-top {
    align-items: flex-start;
  }

  .profile-title {
    align-items: flex-start;
    flex-direction: column;
  }

  .profile-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
