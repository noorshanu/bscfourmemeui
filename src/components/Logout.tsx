'use client';

import { useRouter } from 'next/navigation';

const LogoutButton = () => {
  const router = useRouter();

  const handleLogout = () => {
    // Clear the authToken cookie
    document.cookie = `authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;

    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // Redirect to the login page
    router.push('/auth/signin');
  };

  return <button onClick={handleLogout}>Logout</button>;
};

export default LogoutButton;