import { createRouter, createWebHistory } from "vue-router";

import AppLayout from "../components/layout/AppLayout.vue";

import LoginView from "../views/auth/LoginView.vue";
import ForgotPasswordView from "../views/auth/ForgotPasswordView.vue";
import ResetPasswordView from "../views/auth/ResetPasswordView.vue";
import MobileOtpResetView from "../views/auth/MobileOtpResetView.vue";
import DashboardView from "../views/dashboard/DashboardView.vue";

import UserListView from "../views/users/UserListView.vue";
import UserFormView from "../views/users/UserFormView.vue";


import MenuListView from "../views/menu/MenuListView.vue";
import MenuFormView from "../views/menu/MenuFormView.vue";
import SecuritySetupView from "../views/security/SecuritySetupView.vue";
import AccessControlView from "../views/security/AccessControlView.vue";
import RoleListView from "../views/security/RoleListView.vue";
import RoleFormView from "../views/security/RoleFormView.vue";


import InstitutionListView from "../views/institution/InstitutionListView.vue";
import InstitutionCreateView from "../views/institution/InstitutionCreateView.vue";
import InstitutionEditView from "../views/institution/InstitutionEditView.vue";


import StudentListView from '../views/student/StudentListView.vue'
import StudentAdmissionView from '../views/student/StudentAdmissionView.vue'
import StudentProfileView from '../views/student/StudentProfileView.vue'
import StudentEditView from "../views/student/StudentEditView.vue";
import EmployeeManagementView from "../views/employee/EmployeeManagementView.vue";
import EventManagementView from "../views/event/EventManagementView.vue";
import FeesManagementView from "../views/fees/FeesManagementView.vue";




import { can } from "../utils/permission";

function getFirstAllowedPath() {
  const menus = JSON.parse(localStorage.getItem("sms_menus") || "[]");
  const stack = [...menus];

  while (stack.length) {
    const menu = stack.shift();

    if (menu?.route_path && menu.route_path !== "#") {
      return menu.route_path;
    }

    if (menu?.children?.length) {
      stack.unshift(...menu.children);
    }
  }

  return "/login";
}

const routes = [
  {
    path: "/",
    redirect: () => {
      const token = localStorage.getItem("sms_token");
      return token ? "/dashboard" : "/login";
    },
  },

  {
    path: "/login",
    name: "Login",
    component: LoginView,
    meta: {
      guestOnly: true,
    },
  },
  {
    path: "/forgot-password",
    name: "ForgotPassword",
    component: ForgotPasswordView,
  },
  {
    path: "/reset-password",
    name: "ResetPassword",
    component: ResetPasswordView,
  },
  {
    path: "/forgot-password/mobile",
    name: "MobileOtpPasswordReset",
    component: MobileOtpResetView,
  },
  {
    path: "/online-result",
    name: "OnlineResult",
    component: () => import("../views/exam/OnlineResultView.vue"),
    meta: { public: true, title: "Online Result" },
  },

  {
    path: "/",
    component: AppLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
{
  path: "dashboard",
  name: "Dashboard",
  component: DashboardView,
  meta: {
    requiresAuth: true,
    permission: "dashboard.access",
    action: "view",
  },
},
{
  path: "master-data",
  name: "MasterData",
  component: () => import("../views/master/MasterDataView.vue"),
  meta: {
    requiresAuth: true,
    permission: "master-data.management",
    action: "view",
    title: "Academic Master Setup",
    subtitle: "Classes, sessions, sections and institutional academic masters",
    hidePageTitle: true,
  },
},

      {
  path: "institutions",
  name: "InstitutionList",
  component: InstitutionListView,
  meta: {
    permission: "institution.management",
    action: "view",
  },
},
{
  path: "institutions/create",
  name: "InstitutionCreate",
  component: InstitutionCreateView,
  meta: {
    permission: "institution.management",
    action: "create",
  },
},
{
  path: "institutions/:id/edit",
  name: "InstitutionEdit",
  component: InstitutionEditView,
  meta: {
    permission: "institution.management",
    action: "update",
  },
},
{
  path: "security",
  name: "SecuritySetup",
  component: SecuritySetupView,
  meta: {
    permission: "role.permission",
    action: "view",
  },
},
{
  path: "security/role-permissions",
  name: "RoleAccessControl",
  component: AccessControlView,
  meta: {
    permission: "role.permission",
    action: "view",
  },
},
{
  path: "security/menus",
  name: "MenuList",
  component: MenuListView,
  meta: {
    permission: "menu.management",
    action: "view",
  },
},
{
  path: "security/menus/create",
  name: "MenuCreate",
  component: MenuFormView,
  meta: {
    permission: "menu.management",
    action: "create",
  },
},
{
  path: "security/menus/:id/edit",
  name: "MenuEdit",
  component: MenuFormView,
  meta: {
    permission: "menu.management",
    action: "update",
  },
},

{
  path: "security/roles",
  name: "RoleList",
  component: RoleListView,
  meta: {
    permission: "role.management",
    action: "view",
  },
},
{
  path: "security/roles/create",
  name: "RoleCreate",
  component: RoleFormView,
  meta: {
    permission: "role.management",
    action: "create",
  },
},
{
  path: "security/roles/:id/edit",
  name: "RoleEdit",
  component: RoleFormView,
  meta: {
    permission: "role.management",
    action: "update",
  },
},
      {
        path: "users",
        name: "UserList",
        component: UserListView,
        meta: {
          title: "User List",
          subtitle: "Manage system users",
          permission: "user.management",
          action: "view",
          breadcrumb: [{ title: "Users", path: null }],
        },
      },
      {
        path: "users/create",
        name: "UserCreate",
        component: UserFormView,
        meta: {
          title: "Create User",
          subtitle: "Add new system user",
          permission: "user.management",
          action: "create",
          breadcrumb: [
            { title: "Users", path: "/users" },
            { title: "Create", path: null },
          ],
        },
      },
      {
        path: "users/:user_id/edit",
        name: "UserEdit",
        component: UserFormView,
        meta: {
          title: "Edit User",
          subtitle: "Update user information",
          permission: "user.management",
          action: "update",
          breadcrumb: [
            { title: "Users", path: "/users" },
            { title: "Edit", path: null },
          ],
        },
      },
{
  path: 'students',
  name: 'StudentList',
  component: StudentListView,
  meta: {
    flatContent: true,
    hidePageTitle: true,
    permission: "student.management",
    action: "view",
  },
},
{
  path: 'students/admission',
  name: 'StudentAdmission',
  component: StudentAdmissionView,
  meta: {
    flatContent: true,
    hidePageTitle: true,
    permission: "student.admission",
    action: "create",
  },
},
{
  path: "students/:id",
  name: "StudentProfile",
  component: StudentProfileView,
  meta: {
    permission: "student.management",
    action: "view",
  },
},
{
  path: "students/:id/edit",
  name: "StudentEdit",
  component: StudentEditView,
  meta: {
    flatContent: true,
    hidePageTitle: true,
    permission: "student.management",
    action: "update",
  },
}
,
{
  path: "employees",
  name: "EmployeeManagement",
  component: EmployeeManagementView,
  meta: {
    permission: "employee.management",
    action: "view",
  },
}
,
{
  path: "notices",
  name: "NoticeManagement",
  component: () => import("../views/notice/NoticeManagementView.vue"),
  meta: {
    permission: "notice.management",
    action: "view",
  },
},
{
  path: "events",
  name: "EventManagement",
  component: EventManagementView,
  meta: { permission: "event.management", action: "view" },
},
{
  path: "fees",
  name: "FeesDashboard",
  component: FeesManagementView,
  meta: { permission: "fee.report", action: "view", feeSection: "dashboard", title: "Fee Dashboard", subtitle: "Billing, collection, due and waiver overview", hidePageTitle: true },
},
{
  path: "fees/heads",
  name: "FeeHeads",
  component: FeesManagementView,
  meta: { permission: "fee.management", action: "view", feeSection: "heads", title: "Fee Heads", subtitle: "Regular, exam and other institutional fee types", hidePageTitle: true },
},
{
  path: "fees/structures",
  name: "FeeStructures",
  component: FeesManagementView,
  meta: { permission: "fee.structure", action: "view", feeSection: "structures", title: "Fee Structures", subtitle: "Class-wise fee rules and amounts", hidePageTitle: true },
},
{
  path: "fees/assignments",
  name: "FeeAssignments",
  component: FeesManagementView,
  meta: { permission: "fee.assignment", action: "view", feeSection: "assignments", title: "Fee Assignments", subtitle: "Automatic student fee assignments", hidePageTitle: true },
},
{
  path: "fees/invoices",
  name: "FeeInvoices",
  component: FeesManagementView,
  meta: { permission: "fee.invoice", action: "view", feeSection: "invoices", title: "Fee Invoices", subtitle: "Generate individual or class-wise invoices", hidePageTitle: true },
},
{
  path: "fees/collections",
  name: "FeeCollections",
  component: FeesManagementView,
  meta: { permission: "fee.collection", action: "view", feeSection: "collections", title: "Fee Collection", subtitle: "Receive and track student payments", hidePageTitle: true },
},
{
  path: "fees/waivers",
  name: "FeeWaivers",
  component: FeesManagementView,
  meta: { permission: "fee.waiver", action: "view", feeSection: "waivers", title: "Fee Waivers", subtitle: "Student-specific concessions and approvals", hidePageTitle: true },
},
{
  path: "fees/reports",
  name: "FeeReports",
  component: FeesManagementView,
  meta: { permission: "fee.report", action: "view", feeSection: "reports", title: "Fee Reports", subtitle: "Outstanding invoices and collection history", hidePageTitle: true },
},
{
  path: "exams",
  name: "ExamDashboard",
  component: () => import("../views/exam/ExamManagementView.vue"),
  meta: { permission: "exam.management", action: "view", examSection: "dashboard", title: "Exam Dashboard", subtitle: "Examination, attendance and result progress", hidePageTitle: true },
},
{
  path: "exams/setup",
  name: "ExamSetup",
  component: () => import("../views/exam/ExamManagementView.vue"),
  meta: { permission: "exam.management", action: "view", examSection: "setup", title: "Exam Setup", subtitle: "Create examinations and snapshot class subjects", hidePageTitle: true },
},
{
  path: "exams/class-subjects",
  name: "ClassSubjectSetup",
  component: () => import("../views/exam/ClassSubjectSetupView.vue"),
  meta: { permission: "subject.management", action: "view", title: "Class Subject & Exam Method", subtitle: "Mandatory, optional, 4th subject and component marks setup", hidePageTitle: true },
},
{ path: "exams/subjects", name: "SubjectEntry", component: () => import("../views/exam/SubjectEntryView.vue"), meta: { permission: "subject.management", action: "view", title: "Subject Master", subtitle: "Institution-specific subject catalog and default assessment", hidePageTitle: true } },
{
  path: "exams/routine",
  name: "ExamRoutine",
  component: () => import("../views/exam/RoutineGeneratorView.vue"),
  meta: { permission: "exam.management", action: "view", title: "Routine & Seating", subtitle: "Schedule subjects and generate candidate seating", hidePageTitle: true },
},
{
  path: "exams/candidates",
  name: "ExamCandidates",
  component: () => import("../views/exam/ExamCandidatesView.vue"),
  meta: { permission: "exam.management", action: "view", title: "Candidates & Admit Cards", subtitle: "Eligibility, exam fee clearance and printable admit cards", hidePageTitle: true },
},
{
  path: "exams/marks",
  name: "ExamMarks",
  component: () => import("../views/exam/ExamMarksView.vue"),
  meta: { permission: "exam.management", action: "view", title: "Fast Marks Entry", subtitle: "Written, MCQ, practical and viva marks in one grid", hidePageTitle: true },
},
{
  path: "exams/results",
  name: "ExamResults",
  component: () => import("../views/exam/ExamResultsView.vue"),
  meta: { permission: "exam.management", action: "view", title: "Full Result Sheet", subtitle: "Review every subject, merit and publication status", hidePageTitle: true },
},
{
  path: "exams/documents",
  name: "ExamDocuments",
  component: () => import("../views/exam/ExamDocumentsView.vue"),
    meta: { permission: "exam.management", action: "view", title: "Marksheet & Certificates", subtitle: "Design, preview, print and issue academic documents", hidePageTitle: true },
},
{
  path: "exams/reports",
  name: "ExamReports",
  component: () => import("../views/exam/ExamReportsView.vue"),
  meta: { permission: "exam.management", action: "view", title: "Exam Reports", subtitle: "Result analytics, subject performance and tabulation", hidePageTitle: true },
},
    
    ],
  },
];

const router = createRouter({
  history: createWebHistory("/admin"),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("sms_token");

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const guestOnly = to.matched.some((record) => record.meta.guestOnly);

  if (requiresAuth && !token) {
    return next("/login");
  }

  if (guestOnly && token) {
    return next("/dashboard");
  }

  const protectedRoute = to.matched.find((record) => record.meta.permission);

  if (protectedRoute) {
    const permissionCode = protectedRoute.meta.permission;
    const action = protectedRoute.meta.action || "view";

    const allowed = can(permissionCode, action);

    if (!allowed) {
      const fallbackPath = getFirstAllowedPath();
      return next(fallbackPath === to.path ? "/login" : fallbackPath);
    }
  }

  next();
});

export default router;
