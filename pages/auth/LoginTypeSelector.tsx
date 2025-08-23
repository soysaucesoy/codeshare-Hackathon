import Link from 'next/link'

export const LoginTypeSelector = () => {
  return (
    <div className="register-type-selector">
      <div className="selector-grid">
        <Link href="/auth/user/login" className="login-option user">
          <h3>利用者としてログイン</h3>
          <p>サービスを利用される方</p>
        </Link>
        
        <Link href="/auth/facility/login" className="login-option facility">
          <h3>事業所としてログイン</h3>
          <p>サービスを提供される事業者様</p>
        </Link>
      </div>
    </div>
  )
}