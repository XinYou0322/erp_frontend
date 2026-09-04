<script setup>
import WorkflowStatusBadge from './WorkflowStatusBadge.vue'

// items 需帶 id（workflow 的實際 id，用於導向明細頁），code 只是顯示用的單號
const props = defineProps({
  items: {
    type: Array,
    default: () => ([
      { id: 5001, code: 'WF-2026-0091', documentType: 'LEAVE', summary: '身體不適，請一天病假', applicant: 'Alice', approver: 'Bob', date: '2026-09-01', status: 'pending' },
      { id: 5000, code: 'WF-2026-0090', documentType: 'PURCHASE', summary: '珍珠 50kg、鮮奶 30箱', applicant: 'Carol', approver: 'Alice', date: '2026-08-31', status: 'approved' },
      { id: 4999, code: 'WF-2026-0089', documentType: 'LEAVE', summary: '家中有事，請假一天', applicant: 'David', approver: 'Bob', date: '2026-08-30', status: 'rejected' },
      { id: 4998, code: 'WF-2026-0088', documentType: 'PURCHASE', summary: '紅茶葉 20kg', applicant: 'Emma', approver: 'Alice', date: '2026-08-29', status: 'approved' },
      { id: 4997, code: 'WF-2026-0087', documentType: 'LEAVE', summary: '特休，安排家庭旅遊', applicant: 'Frank', approver: 'Bob', date: '2026-08-28', status: 'pending' },
    ]),
  },
})

const typeLabel = { LEAVE: '請假', PURCHASE: '採購', EXPENSE: '費用' }
</script>

<template>
  <div class="table-wrap">
    <table class="wf-table">
      <thead>
        <tr>
          <th>單號</th>
          <th>類型</th>
          <th>摘要</th>
          <th>申請人</th>
          <th>簽核人</th>
          <th>申請日期</th>
          <th>狀態</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td class="mono">{{ item.code }}</td>
          <td><span class="type-tag">{{ typeLabel[item.documentType] || item.documentType }}</span></td>
          <td class="summary">{{ item.summary }}</td>
          <td>{{ item.applicant }}</td>
          <td>{{ item.approver }}</td>
          <td class="mono">{{ item.date }}</td>
          <td><WorkflowStatusBadge :status="item.status" size="sm" /></td>
          <td class="actions">
            <router-link :to="`/workflows/${item.id}`" class="view-link">查看</router-link>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrap {
  background: var(--wf-paper-raised);
  border: 1px solid var(--wf-line);
  border-radius: var(--wf-radius-md);
  overflow-x: auto;
}

.wf-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--wf-font);
  font-size: 13.5px;
  min-width: 780px;
}

.wf-table thead th {
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--wf-ink-soft);
  border-bottom: 1px solid var(--wf-line);
  white-space: nowrap;
}

.wf-table tbody td {
  padding: 13px 16px;
  border-bottom: 1px solid var(--wf-line);
  color: var(--wf-ink);
  vertical-align: middle;
}

.wf-table tbody tr:last-child td {
  border-bottom: none;
}

.wf-table tbody tr:hover td {
  background: var(--wf-paper);
}

.mono {
  font-family: var(--wf-font-mono);
  font-size: 12.5px;
  color: var(--wf-ink-soft);
}

.summary {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-tag {
  font-size: 12px;
  padding: 2px 8px;
  border: 1px solid var(--wf-line-strong);
  border-radius: 4px;
  color: var(--wf-ink-soft);
}

.view-link {
  color: var(--wf-seal);
  font-weight: 500;
  text-decoration: none;
}

.view-link:hover {
  text-decoration: underline;
}
</style>
