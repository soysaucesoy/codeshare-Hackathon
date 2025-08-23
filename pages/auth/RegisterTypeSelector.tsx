import Link from 'next/link'

export const RegisterTypeSelector = () => {
  return (
    <div className="register-type-selector">
      <div className="selector-grid">
        <Link href="/auth/user/register" className="register-option user">
          <h3>利用者として登録</h3>
          <p>サービスを利用される方</p>
        </Link>
        
        <Link href="/auth/facility/register" className="register-option facility">
          <h3>事業所として登録</h3>
          <p>サービスを提供される事業者様</p>
        </Link>
      </div>
    </div>
  )
}