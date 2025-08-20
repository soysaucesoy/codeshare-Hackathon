
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// A simple hook to fetch user data
const useUser = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setIsAdmin(data.isAdmin);
        } else {
          // Not authenticated
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Failed to fetch user', error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, isAdmin, loading };
};

const AdminDashboardPage = () => {
  const router = useRouter();
  const { user, isAdmin, loading } = useUser();

  useEffect(() => {
    // ローディングが完了し、管理者でない場合はログインページにリダイレクト
    if (!loading && !isAdmin) {
      router.push('/admin/login');
    }
  }, [isAdmin, loading, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed', error);
      alert('Logout failed. Please try again.');
    }
  };

  // ローディング中は何も表示しないか、スピナーを表示
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <p>Loading...</p>
      </div>
    );
  }

  // リダイレクトが実行されるまでの間、管理者でないユーザーには何も表示しない
  if (!isAdmin) {
    return null;
  }

  // 管理者用のダッシュボードコンテンツ
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </header>
      <main style={styles.main}>
        <h2 style={styles.welcome}>Welcome, {user?.email || 'Admin'}!</h2>
        <p>This is your protected admin dashboard.</p>
        {/* ここに管理者向けのコンポーネントや機能を追加していく */}
      </main>
    </div>
  );
};

// Basic inline styles
const styles: { [key: string]: React.CSSProperties } = {
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  container: {
    fontFamily: 'sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#1f2937',
    color: 'white',
  },
  title: {
    margin: 0,
    fontSize: '24px',
  },
  logoutButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#4f46e5',
    color: 'white',
    cursor: 'pointer',
  },
  main: {
    padding: '40px',
  },
  welcome: {
    fontSize: '20px',
    marginBottom: '20px',
  },
};

export default AdminDashboardPage;
