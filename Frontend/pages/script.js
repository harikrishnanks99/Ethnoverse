// Handle signup form
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("fullname").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;

    if (password !== confirm) {
      alert("Passwords do not match!");
      return;
    }

    alert(`Account created successfully for ${name} (${email})!`);
    signupForm.reset();
  });
}

// Handle forgot password form
const resetForm = document.getElementById("resetForm");
if (resetForm) {
  resetForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("resetEmail").value.trim();
    if (email === "") {
      alert("Please enter your email address.");
      return;
    }
    alert(`A password reset link has been sent to ${email}.`);
    resetForm.reset();
  });
}
// Handle login form
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      alert("Please fill in both email and password.");
      return;
    }

    // Simulate login success
    alert(`Welcome back, ${email}!`);
    loginForm.reset();
  });
}
