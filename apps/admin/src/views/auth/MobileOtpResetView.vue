<template>
  <main class="page"><section class="card">
    <h2>{{ step === 'send' ? 'Reset by Mobile' : 'Verify OTP' }}</h2>
    <p>{{ step === 'send' ? 'Enter the mobile number saved with your account.' : 'Enter the OTP and a new password.' }}</p>
    <form @submit.prevent="step === 'send' ? sendOtp() : resetPassword()">
      <label>Mobile number<input v-model.trim="mobile" inputmode="tel" placeholder="01XXXXXXXXX" :disabled="step !== 'send'" /></label>
      <template v-if="step === 'verify'">
        <label>Six-digit OTP<input v-model.trim="otp" inputmode="numeric" maxlength="6" /></label>
        <label>New password<input v-model="password" type="password" /></label>
        <label>Confirm password<input v-model="confirmPassword" type="password" /></label>
      </template>
      <button :disabled="loading">{{ loading ? 'Please wait...' : step === 'send' ? 'Send OTP' : 'Reset Password' }}</button>
    </form>
    <button class="link" type="button" @click="step === 'verify' ? (step = 'send') : router.push('/forgot-password')">{{ step === 'verify' ? 'Use a different mobile number' : 'Use email reset instead' }}</button>
    <button class="link" type="button" @click="router.push('/login')">Back to Login</button>
  </section></main>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "../../services/api";
const router = useRouter();
const step = ref("send"), loading = ref(false), mobile = ref(""), otp = ref(""), password = ref(""), confirmPassword = ref("");
async function sendOtp() {
  if (!mobile.value) return alert("Enter your mobile number.");
  try { loading.value = true; const { data } = await api.post("/auth/forgot-password/mobile", { mobile: mobile.value }); alert(data.message); step.value = "verify"; }
  catch (error) { alert(error.response?.data?.message || "Unable to send OTP."); }
  finally { loading.value = false; }
}
async function resetPassword() {
  if (!/^\d{6}$/.test(otp.value)) return alert("Enter the six-digit OTP.");
  if (password.value !== confirmPassword.value) return alert("Passwords do not match.");
  try { loading.value = true; const { data } = await api.post("/auth/reset-password/mobile-otp", { mobile: mobile.value, otp: otp.value, password: password.value }); alert(data.message); router.push("/login"); }
  catch (error) { alert(error.response?.data?.message || "Unable to reset password."); }
  finally { loading.value = false; }
}
</script>

<style scoped>
.page{min-height:100vh;display:grid;place-items:center;padding:24px;background:#f5f3ff}.card{width:100%;max-width:430px;padding:32px;border-radius:24px;background:#fff;box-shadow:0 24px 70px #0f172a1f}.card p{color:#64748b}.card form{display:grid;gap:16px}.card label{display:grid;gap:7px;font-weight:600;color:#334155}.card input{height:46px;padding:0 14px;border:1px solid #cbd5e1;border-radius:12px;font-size:15px}.card form button{height:50px;border:0;border-radius:14px;background:#2563eb;color:#fff;font-size:16px;font-weight:800;cursor:pointer}.card form button:disabled{opacity:.7}.link{display:block;width:100%;margin-top:14px;border:0;background:transparent;color:#2563eb;font-weight:700;cursor:pointer}
</style>
