import { useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

type UserRecord = {
  id: string | number
  이메일: string
  이름: string | null
  권한: string | null
  상태: string | null
}

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [organizationOne, setOrganizationOne] = useState('')
  const [organizationTwo, setOrganizationTwo] = useState('')
  const [phone, setPhone] = useState('')
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [remember, setRemember] = useState(false)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase) {
      setMessage('Supabase 환경변수를 먼저 설정해주세요.')
      return
    }

    setIsLoading(true)
    setMessage('')

    const { data, error } = await supabase.rpc('login_user', {
      login_email: email,
      login_password: password,
    }).maybeSingle<UserRecord>()

    setIsLoading(false)

    if (error) {
      setMessage(`로그인할 수 없습니다: ${error.message}`)
      return
    }

    if (!data) {
      setMessage('이메일 또는 암호가 올바르지 않습니다.')
      return
    }

    if (data.상태 && !['활성', '사용', 'active', 'enabled'].includes(data.상태.toLowerCase())) {
      setMessage('현재 사용할 수 없는 계정입니다.')
      return
    }

    setMessage(`${data.이름 || data.이메일}님, 로그인되었습니다. (${data.권한 || '사용자'})`)
    setIsLoggedIn(true)
  }

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase) {
      setMessage('Supabase 환경변수를 먼저 설정해주세요.')
      return
    }

    if (!email || !password || !name || !organizationOne || !organizationTwo) {
      setMessage('회원가입에 필요한 항목을 모두 입력해주세요.')
      return
    }

    setIsLoading(true)
    const { error } = await supabase.rpc('register_user', {
      new_email: email,
      new_password: password,
      new_name: name,
      new_org1: organizationOne,
      new_org2: organizationTwo,
      new_phone: phone || null,
    })
    setIsLoading(false)
    setMessage(error ? `회원가입할 수 없습니다: ${error.message}` : '회원가입이 완료되었습니다.')
    if (!error) {
      setIsSignUpMode(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!supabase) {
      setMessage('Supabase 환경변수를 먼저 설정해주세요.')
      return
    }

    if (!email) {
      setMessage('비밀번호를 재설정할 이메일을 입력해주세요.')
      return
    }

    setMessage('암호 재설정은 관리자에게 요청해주세요.')
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setEmail('')
    setPassword('')
    setMessage('')
  }

  return (
    <main className="login-page">
      <div className="bg-deco deco-1" aria-hidden="true">📂</div>
      <div className="bg-deco deco-2" aria-hidden="true">📄</div>
      <div className="bg-deco deco-3" aria-hidden="true">📁</div>
      <div className="bg-deco deco-4" aria-hidden="true">💾</div>

      <div className="login-wrapper">
        <div className="folder-tab" aria-hidden="true">root/login</div>
        <section className="login-card" aria-labelledby="login-title">
          <div className={`success-overlay${isLoggedIn ? ' active' : ''}`}>
            <div className="success-icon" aria-hidden="true">🎉</div>
            <h2 className="success-title">환영합니다!</h2>
            <p className="success-desc">Env-LIMS 시스템에 정상적으로 연결되었습니다.</p>
            <button className="btn-logout" type="button" onClick={handleLogout}>돌아가기</button>
          </div>

          <header className="card-header">
            <div className="window-controls" aria-hidden="true"><span className="control-dot dot-red" /><span className="control-dot dot-yellow" /><span className="control-dot dot-green" /></div>
            <div className="logo-container" aria-hidden="true">📂</div>
            <h1 id="login-title" className="brand-name">Env-LIMS</h1>
            <p className="brand-subtitle">환경분야 실험실정보관리시스템</p>
          </header>

          <div className="card-body">
            <form onSubmit={isSignUpMode ? handleSignUp : handleLogin}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">이메일</label>
                <div className="input-wrapper"><span className="input-icon" aria-hidden="true">👤</span><input className="form-input" id="email" name="email" type="email" placeholder="이메일을 입력하세요" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
              </div>

              {isSignUpMode && <>
                <div className="form-group"><label className="form-label" htmlFor="name">이름</label><div className="input-wrapper"><span className="input-icon" aria-hidden="true">🪪</span><input className="form-input" id="name" name="name" type="text" value={name} onChange={(event) => setName(event.target.value)} required /></div></div>
                <div className="form-group"><label className="form-label" htmlFor="organization-one">소속1</label><div className="input-wrapper"><span className="input-icon" aria-hidden="true">🏢</span><input className="form-input" id="organization-one" name="organization-one" type="text" value={organizationOne} onChange={(event) => setOrganizationOne(event.target.value)} required /></div></div>
                <div className="form-group"><label className="form-label" htmlFor="organization-two">소속2</label><div className="input-wrapper"><span className="input-icon" aria-hidden="true">📌</span><input className="form-input" id="organization-two" name="organization-two" type="text" value={organizationTwo} onChange={(event) => setOrganizationTwo(event.target.value)} required /></div></div>
                <div className="form-group"><label className="form-label" htmlFor="phone">전화번호 (선택)</label><div className="input-wrapper"><span className="input-icon" aria-hidden="true">📞</span><input className="form-input" id="phone" name="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></div></div>
              </>}

              <div className="form-group">
                <label className="form-label" htmlFor="password">비밀번호</label>
                <div className="input-wrapper"><span className="input-icon" aria-hidden="true">🔒</span><input className="form-input" id="password" name="password" type="password" placeholder="비밀번호를 입력하세요" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
              </div>

              {!isSignUpMode && <div className="form-options"><label className="remember-me"><input type="checkbox" name="remember" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> 로그인 상태 유지</label><button type="button" className="forgot-link" onClick={handlePasswordReset}>비밀번호 찾기</button></div>}
              <button className="btn-submit" type="submit" disabled={isLoading}>{isLoading ? '연결 중...' : isSignUpMode ? '회원가입' : '파일 브라우저 열기'} <span aria-hidden="true">⚡</span></button>
              <p className={`status-message${message ? ' visible' : ''}`} aria-live="polite">{message}</p>
            </form>
          </div>

          <footer className="card-footer"><span>Version 7.0.4-cute</span><button type="button" className="footer-link" onClick={() => setIsSignUpMode((current) => !current)}>{isSignUpMode ? '로그인으로 돌아가기' : '회원가입'}</button></footer>
        </section>
      </div>
    </main>
  )
}

export default App
