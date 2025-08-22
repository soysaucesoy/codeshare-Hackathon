// components/layout/Footer.tsx

import React from 'react';
import styles from './Footer.module.css'; // CSS Modulesを使用する場合

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.container} ${styles.footerContent}`}>
        <div className={styles.footerLogo}>
          {/* ロゴアイコンや名前をここに追加 */}
          <span className={styles.footerName}>ケアコネクト</span>
        </div>
        <div className={styles.footerCopyright}>
          © {new Date().getFullYear()} ケアコネクト. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

// Footerコンポーネントをエクスポート
export default Footer;