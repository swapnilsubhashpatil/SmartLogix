import React from "react";

const GoogleLogin = () => {
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full bg-[#4285f4] text-white py-3 rounded-custom font-semibold hover:bg-[#357abd] transition-colors flex items-center justify-center gap-2"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.21 1.125-.843 2.078-1.797 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
          fill="#4285F4"
        />
        <path
          d="M9 18c2.43 0 4.467-.896 5.955-2.426l-2.908-2.258c-.806.54-1.837.859-3.047.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
          fill="#34A853"
        />
        <path
          d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.347 3.827.957 5.042h3.007v-2.332z"
          fill="#FBBC05"
        />
        <path
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 5.042h3.007v2.332C4.672 5.247 6.656 3.58 9 3.58z"
          fill="#EA4335"
        />
      </svg>
      Sign in with Google
    </button>
  );
};

export default GoogleLogin;
