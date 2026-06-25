<template>
  <div class="table-card">
    <div v-if="loading" class="loading-box">
      Loading institutions...
    </div>

    <div v-else-if="!institutions.length" class="empty-box">
      No institution found.
    </div>

    <div v-else class="table-wrapper">
      <table class="institution-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Institution</th>
            <th>Type</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Status</th>
            <th class="text-right">Action</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="item in institutions"
            :key="item.institution_id"
          >
            <td>
              <strong>{{ item.institution_code }}</strong>
            </td>

            <td>
              <div class="name-cell">
                <div class="avatar">
                  {{ getInitial(item.institution_name) }}
                </div>

                <div>
                  <strong>{{ item.institution_name }}</strong>
                  <small v-if="item.institution_name_bn" class="bangla-line">
                    {{ item.institution_name_bn }}
                  </small>
                  <small>{{ item.address_line_bn || item.address_line || "No address" }}</small>
                </div>
              </div>
            </td>

            <td>{{ item.institution_type }}</td>
            <td>{{ item.phone_bn || item.phone || "-" }}</td>
            <td>{{ item.email || "-" }}</td>

            <td>
              <span
                class="status-badge"
                :class="item.status === 'ACTIVE' ? 'active' : 'inactive'"
              >
                {{ item.status }}
              </span>
            </td>

            <td class="text-right">
              <BaseButton
                size="sm"
                variant="secondary"
                @click="$emit('edit', item)"
              >
                Edit
              </BaseButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import BaseButton from "../common/BaseButton.vue";

defineProps({
  institutions: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["edit"]);

const getInitial = (name) => {
  return name ? name.charAt(0).toUpperCase() : "I";
};
</script>

<style scoped>
.table-card {
  background: #ffffff;
  border: 1px solid #e5edf7;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.institution-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 950px;
}

.institution-table th {
  background: #f8fafc;
  color: #475569;
  font-size: 13px;
  text-align: left;
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.institution-table td {
  padding: 15px 16px;
  border-bottom: 1px solid #eef2f7;
  color: #334155;
  font-size: 14px;
  vertical-align: middle;
}

.institution-table tr:hover td {
  background: #f9fbff;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.name-cell small {
  display: block;
  margin-top: 4px;
  color: #64748b;
  max-width: 340px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #2563eb, #0ea5e9);
  color: #ffffff;
  font-weight: 800;
}

.status-badge {
  display: inline-flex;
  padding: 5px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.status-badge.active {
  color: #047857;
  background: #d1fae5;
}

.status-badge.inactive {
  color: #b91c1c;
  background: #fee2e2;
}

.text-right {
  text-align: right !important;
}

.loading-box,
.empty-box {
  padding: 40px 20px;
  text-align: center;
  color: #64748b;
  font-weight: 600;
}
</style>
