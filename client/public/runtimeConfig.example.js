// Original Classplus DIY ka runtimeConfig pattern — build ke baad bhi env change hota hai.
// (yahan dev values hain; copy karke runtimeConfig.js bana lo local ke liye)
window.runConfig = {
  API_BASE_URL: '', // dev: vite proxy → http://localhost:4000 ; prod: https://api.apnaclassplus.com
  APP_ENVIRONMENT: 'development',
  RAZORPAY_KEY: 'rzp_test_XXXXXXXXXXXXXX',
};
